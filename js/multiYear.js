import { assumptions, CONSTANTS } from './config.js';
import { computeRafAdjustment, computeQualityGate, inflationMultiplier } from './computeHelpers.js';

export function computeHospitalPremiumForYear(totalTcoc, year, a, fundingType) {
    // Use actual TCOC (not RAF-adjusted benchmark) to match Year 1 computeHospital behavior
    if (fundingType !== 'hospital') return 0;

    const referralVolume = totalTcoc * (a.hospitalReferralPct / 100);
    const lockedVolume = referralVolume * (a.hospitalReferralLock / 100);
    const growthFactor = Math.pow(1 + a.hospitalPremiumGrowthPct / 100, year - 1);
    const premiumPct = a.hospitalCostPremium * growthFactor;

    return lockedVolume * (premiumPct / 100);
}

// Shared helper: computes one year of ACO financial calculations.
// Both computeMultiYear() (Step 5) and computeCascadingYearOutcome() (Step 6 MC) prepare
// their own inputs (RAF values, savings rate, infrastructure cost, etc.) then call this
// for the shared math. Differences become input parameters rather than code duplication.
export function computeYearFinancials(params) {
    const {
        year, funding,
        // Pre-computed by caller
        rafAdjustedBenchmark,
        qualityPass,
        savingsPct, isCapped,
        minAchievableCost,
        hospitalPremium,
        infraCost,
        // Assumptions (passed through)
        payerSharePct, acoReservePct, multiYearMsrPct,
        // Loan state
        loanPaymentsRemaining, monthlyLoanPayment,
        // Partner params
        hospitalGainSharePct, peEquitySharePct,
        // Payer params
        currentPmpm, attributedPatients, payerClawbackPct,
        // Reserve state
        currentReserve,
        // Practice burden
        basePracticeBurdenTotal, applyInflationToBurden, inflationPct,
        // Behavior control
        adjustNetDistributableForShortfall,  // false for Step 5, true for MC
        isScenarioMiss                       // true when scenario='miss' (Step 5 only)
    } = params;

    // Max achievable savings (RAF-adjusted benchmark vs cost floor)
    const maxAchievableSavings = Math.max(0, rafAdjustedBenchmark - minAchievableCost);
    const maxAchievableSavingsPct = rafAdjustedBenchmark > 0
        ? (maxAchievableSavings / rafAdjustedBenchmark) * 100 : 0;

    // Target savings and realized savings (after hospital premium)
    const targetSavings = rafAdjustedBenchmark * (savingsPct / 100);
    const realizedSavings = targetSavings - hospitalPremium;

    // MSR threshold check
    const msrThreshold = rafAdjustedBenchmark * (multiYearMsrPct / 100);
    const meetsThreshold = realizedSavings >= msrThreshold;

    // ACO share: payout only if both TCOC and quality pass
    const acoShare = (meetsThreshold && qualityPass)
        ? realizedSavings * (payerSharePct / 100)
        : 0;

    // Ops retention (capped at ACO share)
    const opsRetention = Math.min(acoShare, infraCost);

    // Reserve contribution
    const reserveContribution = acoShare * acoReservePct;

    // Bank: Loan payment (12 months max per year, 0 if term ended)
    const monthsThisYear = Math.min(12, loanPaymentsRemaining);
    const loanPayment = monthlyLoanPayment * monthsThisYear;
    const newLoanPaymentsRemaining = Math.max(0, loanPaymentsRemaining - monthsThisYear);

    // Required obligations and shortfall
    // Use infraCost (actual costs) not opsRetention (income-capped) so reserve
    // correctly depletes during miss years when acoShare = 0
    const required = infraCost + loanPayment;
    const shortfall = Math.max(0, required - acoShare);

    // Net distributable: Step 5 uses full reserve; MC adjusts for shortfall
    let netDistributable;
    if (adjustNetDistributableForShortfall) {
        netDistributable = Math.max(0, acoShare - opsRetention - Math.max(0, reserveContribution - shortfall));
    } else {
        netDistributable = Math.max(0, acoShare - opsRetention - reserveContribution);
    }

    // Partner gain share / funding deduction (funder-specific)
    let partnerGainShare = 0;
    let fundingDeduction = 0;
    let payerAdvanceAmount = 0;
    let payerAdvanceDeduction = 0;
    let payerClawback = 0;
    let payerUnderwaterAmt = 0;

    if (funding === 'bank') {
        fundingDeduction = loanPayment;
    } else if (funding === 'hospital' && acoShare > 0) {
        partnerGainShare = netDistributable * (hospitalGainSharePct / 100);
        fundingDeduction = partnerGainShare;
    } else if (funding === 'pe' && acoShare > 0) {
        partnerGainShare = netDistributable * (peEquitySharePct / 100);
        fundingDeduction = partnerGainShare;
    }

    // Payer advance / clawback
    // Note: Multi-year payer logic is intentionally independent of computePayerAdvance().
    // It uses year-specific currentPmpm (ratcheted) and different clawback logic for
    // Year 1 (18mo) vs Years 2+ (12mo), so it cannot share the Year 1 helper.
    if (funding === 'payer') {
        payerAdvanceAmount = currentPmpm * attributedPatients * 12;
        if (acoShare > 0) {
            payerAdvanceDeduction = Math.min(payerAdvanceAmount, acoShare);
            fundingDeduction = payerAdvanceDeduction;
            payerUnderwaterAmt = (payerAdvanceAmount > acoShare) ? (payerAdvanceAmount - acoShare) : 0;
        } else {
            // Clawback on miss: Year 1 uses 18 months, Years 2+ use 12 months
            const advanceMonths = (year === 1) ? 18 : 12;
            const pmpmAdvanceForClawback = currentPmpm * attributedPatients * advanceMonths;
            payerClawback = pmpmAdvanceForClawback * (payerClawbackPct / 100);
        }
    }

    // Failure check: can the ACO cover obligations?
    const available = acoShare + currentReserve;
    const failed = available < required;

    // Reserve change
    const reserveChange = reserveContribution - shortfall;

    // Ending reserve (caller may override on failure)
    const endingReserve = currentReserve + reserveChange;

    // Determine TCOC status independently (for Quality View display)
    let tcocStatus;
    if (isScenarioMiss || !meetsThreshold) {
        tcocStatus = 'Miss';
    } else if (isCapped) {
        tcocStatus = 'Partial';
    } else {
        tcocStatus = 'Hit';
    }

    // Determine combined status: Hit, Partial, TCOC Miss, Quality Miss, Both Miss
    let status;
    if (!meetsThreshold && !qualityPass) {
        status = 'Both Miss';
    } else if (!meetsThreshold) {
        status = 'TCOC Miss';
    } else if (!qualityPass) {
        status = 'Quality Miss';
    } else if (isCapped) {
        status = 'Partial';
    } else {
        status = 'Hit';
    }

    // Net to PCPs
    const netToPcps = Math.max(0, acoShare - opsRetention - reserveContribution - fundingDeduction) - payerClawback - payerUnderwaterAmt;

    // Practice burden (Year 1 = 18 months, Years 2+ = 12 months, with optional inflation)
    const burdenMonths = (year === 1) ? 18 : 12;
    const burdenInflation = applyInflationToBurden ? inflationMultiplier(inflationPct, year) : 1;
    const practiceBurden = basePracticeBurdenTotal * burdenInflation * burdenMonths / 12;

    return {
        // Quality/threshold
        maxAchievableSavings, maxAchievableSavingsPct,
        targetSavings, realizedSavings,
        msrThreshold, meetsThreshold,
        // Financials
        acoShare,
        opsRetention, reserveContribution,
        loanPayment, monthsThisYear, newLoanPaymentsRemaining,
        netDistributable, partnerGainShare,
        payerAdvanceAmount, payerAdvanceDeduction, payerClawback,
        fundingDeduction,
        // Failure/reserve
        required, available, failed,
        shortfall, reserveChange, endingReserve,
        // Status
        tcocStatus, status,
        // Distribution
        netToPcps, practiceBurden
    };
}

export function computeMultiYear(baseModel, fundingType) {
    // baseModel: output of computeModel() for Year 1 values
    // fundingType: 'bank', 'hospital', or 'pe'
    // Returns: { rows[], totalNet, avgPerDocPerYear, failedYear, endingReserve }

    const a = assumptions;
    const years = a.multiYearCount;

    // Initialize from Year 1 model
    const originalTcoc = baseModel.totalTcoc;  // Original benchmark (cost floor baseline)
    let benchmark = originalTcoc;
    let reserve = 0;

    // The "floor" - minimum achievable cost after ACO optimizes (target savings achieved once)
    const minAchievableCost = originalTcoc * (1 - a.multiYearSavingsTargetPct / 100);

    // Bank-specific: track loan
    let loanPaymentsRemaining = (fundingType === 'bank') ? a.bankTermMonths : 0;
    const monthlyLoanPayment = (fundingType === 'bank') ? baseModel.deferredMonthlyPayment : 0;

    // Payer-specific: track PMPM with annual ratchet
    let currentPmpm = (fundingType === 'payer') ? a.payerPmpm : 0;
    // Use attributed patients from base model (already computed in computeModel)
    const attributedPatients = baseModel.attributedPatients;

    const rows = [];
    let totalNet = 0;
    let totalBurden = 0;
    let failedYear = null;

    // Quality tracking for summary
    let firstQualityMissYear = null;
    let firstTcocMissYear = null;
    let yearsWithPayout = 0;
    let yearsQualityFailed = 0;
    let yearsTcocFailed = 0;

    // RAF tracking for summary
    let yearRafFellBehind = null;

    for (let year = 1; year <= years && !failedYear; year++) {
        // Calculate RAF adjustment for this year
        const rafResult = computeRafAdjustment(a, year);
        const { acoRaf, regionalRaf, rafRatio, isBelowMarket } = rafResult;

        // Track first year RAF falls behind market
        if (isBelowMarket && !yearRafFellBehind) {
            yearRafFellBehind = year;
        }

        // Quality gate ratchets annually, capped at qualityGateCeiling
        const qg = computeQualityGate(a, year);
        const { qualityGateRequired, achievedQuality, qualityPass, qualityMargin, atQualityCeiling } = qg;

        // Track first quality miss
        if (!qualityPass && !firstQualityMissYear) {
            firstQualityMissYear = year;
        }

        // Apply inflation to benchmark FIRST (only after Year 1)
        if (year > 1 && a.applyInflationToBenchmark) {
            benchmark *= (1 + a.inflationPct / 100);
        }

        // Apply RAF adjustment to benchmark
        const rafAdjustedBenchmark = benchmark * rafRatio;

        // Pre-compute achievable to determine capping (helper also computes this)
        let savingsPct;
        let isCapped = false;
        const preMaxSavings = rafAdjustedBenchmark > 0
            ? (Math.max(0, rafAdjustedBenchmark - minAchievableCost) / rafAdjustedBenchmark) * 100 : 0;
        if (preMaxSavings >= a.multiYearSavingsTargetPct) {
            savingsPct = a.multiYearSavingsTargetPct;
        } else {
            savingsPct = preMaxSavings;
            isCapped = true;
        }

        // Hospital premium (grows annually) - uses actual TCOC (benchmark before RAF)
        const hospitalPremium = computeHospitalPremiumForYear(benchmark, year, a, fundingType);

        // Infrastructure cost with optional inflation
        const expenseInflationMultiplier = a.applyInflationToExpenses ? inflationMultiplier(a.inflationPct, year) : 1;
        const infraCost = baseModel.acoInfrastructureTotal * expenseInflationMultiplier;

        // Delegate shared financial math to helper
        const yf = computeYearFinancials({
            year, funding: fundingType,
            rafAdjustedBenchmark,
            qualityPass,
            savingsPct, isCapped,
            minAchievableCost,
            hospitalPremium,
            infraCost,
            payerSharePct: a.payerSharePct,
            acoReservePct: a.acoReservePct,
            multiYearMsrPct: a.multiYearMsrPct,
            loanPaymentsRemaining,
            monthlyLoanPayment,
            hospitalGainSharePct: a.hospitalGainShare,
            peEquitySharePct: a.peEquityShare,
            currentPmpm,
            attributedPatients,
            payerClawbackPct: a.payerClawbackPct,
            currentReserve: reserve,
            basePracticeBurdenTotal: baseModel.practiceBurdenPerPcp * a.pcpCount,
            applyInflationToBurden: a.applyInflationToBurden,
            inflationPct: a.inflationPct,
            adjustNetDistributableForShortfall: false,
            isScenarioMiss: false
        });

        // Update loan state
        loanPaymentsRemaining = yf.newLoanPaymentsRemaining;

        // Track first TCOC miss
        if (!yf.meetsThreshold && !firstTcocMissYear) {
            firstTcocMissYear = year;
        }

        // Failure handling
        if (yf.failed) {
            failedYear = year;
            const failReserveChange = -reserve;
            reserve = 0;
            totalNet -= yf.payerClawback;
            totalBurden += yf.practiceBurden;
            rows.push({
                year, benchmark: rafAdjustedBenchmark, savingsPct, acoShare: 0, opsRetention: 0,
                reserveChange: failReserveChange, endingReserve: reserve,
                loanPayment: yf.loanPayment, partnerGainShare: 0, payerClawback: yf.payerClawback,
                netToPcps: -yf.payerClawback, status: 'Failed',
                // Quality fields
                qualityGateRequired, achievedQuality, qualityPass, qualityMargin,
                tcocStatus: yf.tcocStatus, atQualityCeiling,
                // RAF fields
                acoRaf, regionalRaf, rafRatio, isBelowMarket
            });
            break;
        }

        // Count miss/payout years only after confirming no failure
        if (yf.status === 'Both Miss') { yearsTcocFailed++; yearsQualityFailed++; }
        else if (yf.status === 'TCOC Miss') { yearsTcocFailed++; }
        else if (yf.status === 'Quality Miss') { yearsQualityFailed++; }
        else if (yf.status === 'Hit' || yf.status === 'Partial') { yearsWithPayout++; }

        // Update reserve state
        reserve = yf.endingReserve;

        totalNet += yf.netToPcps;
        totalBurden += yf.practiceBurden;

        rows.push({
            year, benchmark: rafAdjustedBenchmark, savingsPct,
            acoShare: yf.acoShare, opsRetention: yf.opsRetention,
            reserveChange: yf.reserveChange,
            endingReserve: yf.endingReserve,
            loanPayment: yf.loanPayment,
            partnerGainShare: yf.partnerGainShare,
            payerAdvanceDeduction: yf.payerAdvanceDeduction,
            payerAdvanceAmount: yf.payerAdvanceAmount,
            payerClawback: yf.payerClawback,
            netToPcps: yf.netToPcps, status: yf.status,
            // Quality fields
            qualityGateRequired, achievedQuality, qualityPass, qualityMargin,
            tcocStatus: yf.tcocStatus, atQualityCeiling,
            // RAF fields
            acoRaf, regionalRaf, rafRatio, isBelowMarket
        });

        // Ratchet applies only when current year actually had payout (Hit or Partial)
        if (yf.status === 'Hit' || yf.status === 'Partial') {
            let ratchetBase = benchmark;
            // Only apply ratchet inflation if benchmark inflation isn't already active
            // (otherwise benchmark was already inflated at the top of the loop)
            if (a.applyInflationToRatchet && !a.applyInflationToBenchmark) {
                ratchetBase *= (1 + a.inflationPct / 100);
            }
            benchmark = ratchetBase * (1 - a.benchmarkRatchetPct / 100);

            // PMPM ratchet for payer: only on Hit/Partial (not on miss)
            if (fundingType === 'payer') {
                currentPmpm = currentPmpm * (1 - a.payerPmpmRatchet / 100);
            }
        }
    }

    const completedYears = failedYear ? failedYear : years;
    // totalBurden is now accumulated in the loop with year-by-year inflation
    const netAfterBurden = totalNet - totalBurden;

    // Calculate quality crossover year: when gate exceeds max achievable
    let qualityCrossoverYear = null;
    for (let y = 1; y <= 20; y++) {
        const { qualityGateRequired: gate } = computeQualityGate(a, y);
        if (gate > a.acoMaxQualityPct) {
            qualityCrossoverYear = y;
            break;
        }
    }

    return {
        rows,
        totalNet,
        avgPerDocPerYear: (completedYears > 0 && a.pcpCount > 0) ? totalNet / a.pcpCount / completedYears : 0,
        failedYear,
        endingReserve: reserve,
        totalBurden,
        netAfterBurden,
        avgNetAfterBurdenPerPcp: (completedYears > 0 && a.pcpCount > 0) ? netAfterBurden / a.pcpCount / completedYears : 0,
        // Quality summary fields
        firstQualityMissYear,
        firstTcocMissYear,
        yearsWithPayout,
        yearsQualityFailed,
        yearsTcocFailed,
        qualityCrossoverYear,
        // RAF summary fields
        yearRafFellBehind
    };
}
