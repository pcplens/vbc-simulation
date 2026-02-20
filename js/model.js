import { assumptions, CONSTANTS, state } from './config.js';
import { computeRafAdjustment } from './computeHelpers.js';
import { computeMultiYear } from './multiYear.js';

export function computeCore(a) {
    // Total panel = all patients across all PCPs
    const totalPanelPatients = a.pcpCount * a.patientsPerPcp;
    // Attributed patients = patients in ACO value-based care arrangement
    const attributedPatients = Math.round(totalPanelPatients * (a.attributionPct / 100));
    // TCOC is based on attributed patients only
    const totalTcoc = attributedPatients * a.tcocPerPatient;

    // Get Year 1 RAF adjustment
    const rafResult = computeRafAdjustment(a, 1);
    const { acoRaf, regionalRaf, rafRatio, isBelowMarket } = rafResult;

    // Adjusted benchmark = Base TCOC × RAF Ratio
    const adjustedBenchmark = totalTcoc * rafRatio;

    // Use adjusted benchmark for savings/MSR calculations
    const targetSavings = adjustedBenchmark * (a.savingsTargetPct / 100);
    const acoShare = targetSavings * (a.payerSharePct / 100);
    const perPcpBonus = a.pcpCount > 0 ? acoShare / a.pcpCount : 0;
    const msrThreshold = adjustedBenchmark * (a.msrPct / 100);

    return {
        totalPanelPatients, attributedPatients, totalTcoc, targetSavings, acoShare, perPcpBonus, msrThreshold,
        // RAF values for display
        acoRaf, regionalRaf, rafRatio, adjustedBenchmark, isBelowMarket
    };
}

export function computeInfrastructure(a, totalPatients) {
    const highRiskPatients = totalPatients * CONSTANTS.HIGH_RISK_PCT;
    const careManagersNeeded = a.careManagerRatio > 0 ? Math.ceil(highRiskPatients / a.careManagerRatio) : 0;
    const careManagementCost = careManagersNeeded * a.careManagerSalary;
    const totalInfrastructure = a.dataAnalyticsCost + careManagementCost + a.adminCost + a.itCost + a.legalCost + a.qualityCost;
    return { highRiskPatients, careManagersNeeded, careManagementCost, totalInfrastructure };
}

export function computePracticeBurden(a) {
    const visitsPerHour = a.visitsPerHour;
    const lostFfsPerPcp = a.lostHoursPerWeek * CONSTANTS.WEEKS_PER_YEAR * visitsPerHour * a.revenuePerVisit;
    const practiceStaffPerPcp = a.practiceStaffFtePerPcp * a.practiceStaffSalary;
    const practiceBurdenPerPcp = lostFfsPerPcp + practiceStaffPerPcp;
    // Aggregate
    const lostClinicHours = a.pcpCount * a.lostHoursPerWeek * CONSTANTS.WEEKS_PER_YEAR;
    const lostFfsRevenue = lostClinicHours * visitsPerHour * a.revenuePerVisit;
    const practiceStaffCost = a.pcpCount * a.practiceStaffFtePerPcp * a.practiceStaffSalary;
    const totalPracticeBurden = lostFfsRevenue + practiceStaffCost;
    return { visitsPerHour, lostFfsPerPcp, practiceStaffPerPcp, practiceBurdenPerPcp, lostClinicHours, lostFfsRevenue, practiceStaffCost, totalPracticeBurden };
}

export function amortize(principal, monthlyRate, termMonths) {
    if (Math.abs(monthlyRate) < 1e-10) return principal / termMonths;
    const factor = Math.pow(1 + monthlyRate, termMonths);
    return principal * monthlyRate * factor / (factor - 1);
}

export function computeBankLoan(a, fundingNeeded, acoShare, acoOperationalRetention, acoReserveFund) {
    const bankOrigFeeAmount = fundingNeeded * (a.bankOrigFee / 100);
    const bankPrincipal = fundingNeeded + bankOrigFeeAmount;
    const bankMonthlyRate = (a.bankInterestRate / 100) / 12;
    const bankMonthlyPayment = amortize(bankPrincipal, bankMonthlyRate, a.bankTermMonths);
    const bankTotalRepayment = bankMonthlyPayment * a.bankTermMonths;
    const bankTotalInterest = bankTotalRepayment - bankPrincipal;

    // Deferred payment model
    const deferralMonths = CONSTANTS.DEFERRAL_MONTHS;
    const capitalizedPrincipal = bankPrincipal * Math.pow(1 + bankMonthlyRate, deferralMonths);
    const capitalizedInterest = capitalizedPrincipal - bankPrincipal;
    const repaymentMonths = a.bankTermMonths;
    const deferredMonthlyPayment = amortize(capitalizedPrincipal, bankMonthlyRate, repaymentMonths);
    const deferredTotalRepayment = deferredMonthlyPayment * repaymentMonths;
    const deferredTotalInterest = capitalizedInterest + (deferredTotalRepayment - capitalizedPrincipal);

    // Loan payment periods
    const loanPaymentsFromY1 = Math.min(CONSTANTS.Y1_PAYMENT_MONTHS, repaymentMonths);
    const loanPaymentsFromY1Amount = deferredMonthlyPayment * loanPaymentsFromY1;

    // Bank-specific retention
    const bankY1LoanRetention = loanPaymentsFromY1Amount;
    const bankAcoRetention = acoOperationalRetention + acoReserveFund + bankY1LoanRetention;
    const bankNetDistributableShare = Math.max(0, acoShare - bankAcoRetention);

    return {
        bankOrigFeeAmount, bankPrincipal, bankMonthlyRate, bankMonthlyPayment, bankTotalRepayment, bankTotalInterest,
        deferralMonths, capitalizedPrincipal, capitalizedInterest, repaymentMonths,
        deferredMonthlyPayment, deferredTotalRepayment, deferredTotalInterest,
        loanPaymentsFromY1, loanPaymentsFromY1Amount,
        bankY1LoanRetention, bankAcoRetention, bankNetDistributableShare
    };
}

export function computeHospital(a, totalTcoc, targetSavings, msrThreshold, acoOperationalRetention) {
    const hospitalReferralVolume = totalTcoc * (a.hospitalReferralPct / 100);
    const hospitalLockedVolume = hospitalReferralVolume * (a.hospitalReferralLock / 100);
    const hospitalPremiumCost = hospitalLockedVolume * (a.hospitalCostPremium / 100);
    const hospitalPremiumPctOfTcoc = totalTcoc > 0 ? (hospitalPremiumCost / totalTcoc) * 100 : 0;
    const netEffectiveSavingsPct = a.savingsTargetPct - hospitalPremiumPctOfTcoc;
    const hospitalRealizedSavings = targetSavings - hospitalPremiumCost;
    const hospitalMeetsThreshold = hospitalRealizedSavings >= msrThreshold;
    const hospitalAcoShare = hospitalMeetsThreshold ? hospitalRealizedSavings * (a.payerSharePct / 100) : 0;
    const hospitalNetDistributable = Math.max(0, hospitalAcoShare - acoOperationalRetention - (hospitalAcoShare * a.acoReservePct));
    const hospitalGainShareAmount = hospitalNetDistributable * (a.hospitalGainShare / 100);
    return {
        hospitalReferralVolume, hospitalLockedVolume, hospitalPremiumCost,
        hospitalPremiumPctOfTcoc, netEffectiveSavingsPct, hospitalRealizedSavings,
        hospitalMeetsThreshold, hospitalAcoShare, hospitalNetDistributable, hospitalGainShareAmount
    };
}

export function computePE(a, netDistributableShare) {
    const peShare = netDistributableShare * (a.peEquityShare / 100);
    const peNetToPcps = netDistributableShare - peShare;
    return { peShare, peNetToPcps };
}

export function computePayerAdvance(a, totalPatients, acoShare, acoOperationalRetention, acoReserveFund) {
    // Monthly PMPM Income = PMPM x Total Patients
    const payerMonthlyPmpm = a.payerPmpm * totalPatients;

    // Total Advance (18 months of operations)
    const payerTotalAdvance18mo = payerMonthlyPmpm * CONSTANTS.DEFERRAL_MONTHS;

    // Annual advance (for Year 1 display and multi-year)
    const payerAnnualAdvance = payerMonthlyPmpm * 12;

    // Net distributable: ACO Share - Ops Retention - Reserve - Advance Deduction
    // When target is hit, advance is deducted from ACO Share before distribution
    const payerAdvanceDeduction = Math.min(payerAnnualAdvance, acoShare);
    const payerNetDistributable = Math.max(0, acoShare - acoOperationalRetention - acoReserveFund - payerAdvanceDeduction);

    // Clawback amount if target missed
    const payerClawbackAmount = payerTotalAdvance18mo * (a.payerClawbackPct / 100);

    // Per PCP clawback liability (evenly split)
    const payerClawbackPerPcp = a.pcpCount > 0 ? payerClawbackAmount / a.pcpCount : 0;

    // "Underwater" warning: when ACO Share < Annual PMPM Advance
    const payerIsUnderwater = acoShare < payerAnnualAdvance;
    const payerUnderwaterAmount = payerIsUnderwater ? (payerAnnualAdvance - acoShare) : 0;

    // Net distributable after underwater correction
    const payerTrueNet = payerNetDistributable - payerUnderwaterAmount;

    return {
        payerMonthlyPmpm,
        payerTotalAdvance18mo,
        payerAnnualAdvance,
        payerAdvanceDeduction,
        payerNetDistributable,
        payerClawbackAmount,
        payerClawbackPerPcp,
        payerIsUnderwater,
        payerUnderwaterAmount,
        payerTrueNet
    };
}

export function computeModel(options) {
    // Defensive guard: clamp pcpCount to 1 minimum to prevent division by zero
    const a = assumptions.pcpCount < 1 ? { ...assumptions, pcpCount: 1 } : assumptions;

    // Core calculations (includes RAF adjustment)
    const core = computeCore(a);
    const { totalPanelPatients, attributedPatients, totalTcoc, targetSavings, acoShare, perPcpBonus, msrThreshold,
            acoRaf, regionalRaf, rafRatio, adjustedBenchmark, isBelowMarket } = core;

    // Infrastructure (based on attributed patients - ACO only manages attributed)
    const infra = computeInfrastructure(a, attributedPatients);
    const { highRiskPatients, careManagersNeeded, careManagementCost, totalInfrastructure } = infra;

    // Practice burden
    const burden = computePracticeBurden(a);
    const { visitsPerHour, lostFfsPerPcp, practiceStaffPerPcp, practiceBurdenPerPcp, lostClinicHours, lostFfsRevenue, practiceStaffCost, totalPracticeBurden } = burden;

    // ACO Infrastructure total (what needs external funding)
    const acoInfrastructureTotal = totalInfrastructure;

    // ACO-only funding (practices self-fund their burden)
    const acoMonthlyBurn = acoInfrastructureTotal / 12;
    const acoFundingNeeded = acoMonthlyBurn * CONSTANTS.DEFERRAL_MONTHS;

    // Total investment and funding
    const totalInvestment18mo = acoFundingNeeded + (practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER * a.pcpCount);
    const fundingNeeded = acoFundingNeeded;

    // ACO Retention (before any distribution to constituents)
    const acoOperationalRetention = acoInfrastructureTotal;  // Fund Year 2 operations
    const acoReserveFund = acoShare * a.acoReservePct;       // 10% safety buffer
    const totalAcoRetention = acoOperationalRetention + acoReserveFund;
    const netDistributableShare = Math.max(0, acoShare - totalAcoRetention);

    // Bank calculations
    const bank = computeBankLoan(a, fundingNeeded, acoShare, acoOperationalRetention, acoReserveFund);
    const { bankOrigFeeAmount, bankPrincipal, bankMonthlyRate, bankMonthlyPayment, bankTotalRepayment, bankTotalInterest,
            deferralMonths, capitalizedPrincipal, capitalizedInterest, repaymentMonths,
            deferredMonthlyPayment, deferredTotalRepayment, deferredTotalInterest,
            loanPaymentsFromY1, loanPaymentsFromY1Amount,
            bankY1LoanRetention, bankAcoRetention, bankNetDistributableShare } = bank;

    // Hospital calculations
    const hospital = computeHospital(a, totalTcoc, targetSavings, msrThreshold, acoOperationalRetention);
    const { hospitalReferralVolume, hospitalLockedVolume, hospitalPremiumCost,
            hospitalPremiumPctOfTcoc, netEffectiveSavingsPct, hospitalRealizedSavings,
            hospitalMeetsThreshold, hospitalAcoShare, hospitalNetDistributable, hospitalGainShareAmount } = hospital;

    // PE calculations
    const pe = computePE(a, netDistributableShare);
    const { peShare, peNetToPcps } = pe;

    // Payer Advance calculations (PMPM is per attributed patient)
    const payerAdv = computePayerAdvance(a, attributedPatients, acoShare, acoOperationalRetention, acoReserveFund);
    const { payerMonthlyPmpm, payerTotalAdvance18mo, payerAnnualAdvance, payerAdvanceDeduction,
            payerNetDistributable, payerClawbackAmount, payerClawbackPerPcp,
            payerIsUnderwater, payerUnderwaterAmount, payerTrueNet } = payerAdv;

    // Year 1 outcomes (if hit target) - all from net distributable
    // Bank: Uses bank-specific distributable (after loan retention)
    // No pre-payout deduction - loan payments come from ACO share, not PCP practices
    const bankNetY1 = bankNetDistributableShare;
    const hospitalNetY1 = hospitalNetDistributable - hospitalGainShareAmount;
    const peNetY1 = peNetToPcps;
    const payerNetY1 = payerTrueNet;

    // Missed target calculations
    const actualSavings1Pct = totalTcoc * CONSTANTS.MISS_SCENARIO_SAVINGS_PCT;

    // Multi-year projections (only compute when on Step 5+ to avoid waste on slider drags)
    let multiYearHit = null;
    if (state.currentStep >= 5 && !(options && options.skipMultiYear)) {
        const baseModelForMultiYear = {
            totalTcoc,
            deferredMonthlyPayment,
            acoInfrastructureTotal,
            practiceBurdenPerPcp
        };
        const fundingForMultiYear = state.selectedFunding || 'bank';
        multiYearHit = computeMultiYear(baseModelForMultiYear, fundingForMultiYear);
    }

    return {
        // Core
        totalPanelPatients,
        attributedPatients,
        totalPatients: attributedPatients,  // Backwards compatibility alias
        totalTcoc,
        targetSavings,
        acoShare,
        perPcpBonus,
        msrThreshold,

        // RAF (Risk Adjustment)
        acoRaf,
        regionalRaf,
        rafRatio,
        adjustedBenchmark,
        isBelowMarket,

        // Infrastructure
        highRiskPatients,
        careManagersNeeded,
        careManagementCost,
        totalInfrastructure,

        // Practice burden (per PCP)
        visitsPerHour,
        lostFfsPerPcp,
        practiceStaffPerPcp,
        practiceBurdenPerPcp,

        // Practice burden (aggregate)
        lostClinicHours,
        lostFfsRevenue,
        practiceStaffCost,
        totalPracticeBurden,

        // ACO-only funding
        acoInfrastructureTotal,
        acoMonthlyBurn,
        acoFundingNeeded,

        // ACO Retention (before distribution)
        acoOperationalRetention,
        acoReserveFund,
        totalAcoRetention,
        netDistributableShare,

        // Totals
        totalInvestment18mo,
        fundingNeeded,

        // Bank
        bankPrincipal,
        bankOrigFeeAmount,
        bankMonthlyPayment,
        bankTotalInterest,
        bankTotalRepayment,
        perPcpLiability: deferredTotalRepayment / a.pcpCount,

        // Deferred payment loan
        deferralMonths,
        capitalizedPrincipal,
        capitalizedInterest,
        deferredMonthlyPayment,
        deferredTotalRepayment,
        deferredTotalInterest,
        repaymentMonths,

        // Loan payment allocation by ACO share payment
        loanPaymentsFromY1,
        loanPaymentsFromY1Amount,

        // Bank-specific retention
        bankY1LoanRetention,
        bankAcoRetention,
        bankNetDistributableShare,

        // Hospital
        hospitalReferralVolume,
        hospitalLockedVolume,
        hospitalPremiumCost,
        hospitalPremiumPctOfTcoc,
        netEffectiveSavingsPct,
        hospitalRealizedSavings,
        hospitalMeetsThreshold,
        hospitalAcoShare,
        hospitalNetDistributable,
        hospitalGainShareAmount,
        hospitalCareSavingsNeeded: targetSavings + hospitalPremiumCost,

        // PE
        peShare,
        peNetToPcps,
        peTotalTake: peShare,

        // Payer Advance
        payerMonthlyPmpm,
        payerTotalAdvance18mo,
        payerAnnualAdvance,
        payerAdvanceDeduction,
        payerNetDistributable,
        payerClawbackAmount,
        payerClawbackPerPcp,
        payerIsUnderwater,
        payerUnderwaterAmount,

        // Year 1 outcomes (using netDistributableShare)
        bankNetY1,
        hospitalNetY1,
        peNetY1,
        payerNetY1,

        // Missed
        actualSavings1Pct,

        // Practice burden for 18 months (reconciliation period)
        practiceBurden18mo: practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER,

        // Per PCP amounts for hit scenarios
        bankNetPerPcp: bankNetY1 / a.pcpCount,
        hospitalNetPerPcp: hospitalNetY1 / a.pcpCount,
        peNetPerPcp: peNetToPcps / a.pcpCount,
        payerNetPerPcp: payerNetY1 / a.pcpCount,

        // Net outcomes after burden (for conditional styling in hit scenarios)
        bankNetOutcome: (bankNetY1 / a.pcpCount) - (practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER),
        hospitalNetOutcome: (hospitalNetY1 / a.pcpCount) - (practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER),
        peNetOutcome: (peNetToPcps / a.pcpCount) - (practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER),
        payerNetOutcome: a.pcpCount > 0 ? (payerNetY1 / a.pcpCount) - (practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER) : 0,

        // Multi-year projections
        multiYearHit
    };
}
