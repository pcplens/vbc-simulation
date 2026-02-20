import { formatNumber, formatCurrency, formatCurrencyFull, formatSignedCurrency } from './formatters.js';
import { CONSTANTS } from './config.js';

export const DOM_BINDINGS = [
    // Step 0 - Setup sliders
    ['pcpCountDisplay', (m, a) => a.pcpCount, formatNumber],
    ['patientsPerPcpDisplay', (m, a) => a.patientsPerPcp, formatNumber],
    ['attributionPctDisplay', (m, a) => a.attributionPct, String],
    ['tcocPerPatientDisplay', (m, a) => a.tcocPerPatient, formatNumber],
    ['savingsTargetPctDisplay', (m, a) => a.savingsTargetPct.toFixed(1), String],
    ['payerSharePctDisplay', (m, a) => a.payerSharePct, String],
    ['msrPctDisplay', (m, a) => a.msrPct.toFixed(1), String],
    ['qualityGatePctDisplay', (m, a) => a.qualityGatePct, String],
    ['qualityGatePctStep2', (m, a) => a.qualityGatePct, String],

    // Multi-Year slider displays
    ['multiYearCountDisplay', (m, a) => a.multiYearCount, String],
    ['multiYearCountExplainer', (m, a) => a.multiYearCount, String],
    ['inflationPctDisplay', (m, a) => a.inflationPct.toFixed(1), String],
    ['hospitalPremiumGrowthPctDisplay', (m, a) => a.hospitalPremiumGrowthPct.toFixed(1), String],
    ['qualityGateRatchetPctDisplay', (m, a) => a.qualityGateRatchetPct.toFixed(1), String],
    ['benchmarkRatchetPctDisplay', (m, a) => a.benchmarkRatchetPct.toFixed(1), String],
    ['multiYearSavingsTargetPctDisplay', (m, a) => a.multiYearSavingsTargetPct.toFixed(1), String],
    ['multiYearMsrPctDisplay', (m, a) => a.multiYearMsrPct.toFixed(1), String],

    // Quality Improvement slider displays
    ['acoStartingQualityPctDisplay', (m, a) => a.acoStartingQualityPct, String],
    ['step5QualityGatePctDisplay', (m, a) => a.qualityGatePct, String],
    ['step5AcoStartingQualityPctDisplay', (m, a) => a.acoStartingQualityPct, String],
    ['acoQualityImprovementPctDisplay', (m, a) => a.acoQualityImprovementPct.toFixed(1), String],
    ['acoMaxQualityPctDisplay', (m, a) => a.acoMaxQualityPct, String],
    ['qualityGateCeilingDisplay', (m, a) => a.qualityGateCeiling, String],

    // RAF slider displays (Step 0 — base only; growth controls are in Step 5/6)
    ['acoBaseRafDisplay', (m, a) => a.acoBaseRaf.toFixed(2), String],
    ['regionalBaseRafDisplay', (m, a) => a.regionalBaseRaf.toFixed(2), String],

    // RAF slider displays (Step 6)
    ['step6AcoBaseRafDisplay', (m, a) => a.acoBaseRaf.toFixed(2), String],
    ['step6RegionalBaseRafDisplay', (m, a) => a.regionalBaseRaf.toFixed(2), String],
    ['step6AcoRafGrowthPctDisplay', (m, a) => a.acoRafGrowthPct, String],
    ['step6RegionalRafGrowthPctDisplay', (m, a) => a.regionalRafGrowthPct, String],
    ['step6RafOptimizationPeakYearDisplay', (m, a) => a.rafOptimizationPeakYear, String],
    ['step6RafOptimizationFloorDisplay', (m, a) => a.rafOptimizationFloor.toFixed(1), String],
    ['step6CodingIntensityCapDisplay', (m, a) => a.codingIntensityCap, String],

    // RAF calculation displays (Step 1 - Pot of Gold)
    ['acoRafCalc', (m) => m.acoRaf.toFixed(2), String],
    ['regionalRafCalc', (m) => m.regionalRaf.toFixed(2), String],
    ['rafRatioCalc', (m) => m.rafRatio.toFixed(3), String],
    ['adjustedBenchmarkCalc', (m) => m.adjustedBenchmark, formatCurrencyFull],

    // Quality Miss scenario
    ['qualityScoreMiss', (m, a) => Math.max(0, a.qualityGatePct - 10), String],
    ['qualityGatePctMiss', (m, a) => a.qualityGatePct, String],
    ['qualityGatePctHit', (m, a) => a.qualityGatePct, String],
    ['bankDebtOwedQuality', (m, a) => m.capitalizedPrincipal, formatCurrency],
    ['perPcpDebtQuality', (m, a) => m.capitalizedPrincipal / a.pcpCount, formatCurrency],

    // ===== BANK Quality Miss - "What You Could Have Received" =====
    ['qBankSavingsPct', (m, a) => a.savingsTargetPct, String],
    ['qBankTotalSavings', (m, a) => m.targetSavings, formatCurrency],
    ['qBankAcoSharePct', (m, a) => a.payerSharePct, String],
    ['qBankAcoShare', (m, a) => m.acoShare, formatCurrency],
    ['qBankOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
    ['qBankReserve', (m, a) => m.acoReserveFund, formatCurrency],
    ['qBankLoanBudget', (m, a) => m.bankY1LoanRetention, formatCurrency],
    ['qBankNetToPcps', (m, a) => m.bankNetY1, formatCurrency],
    ['qBankPcpCount', (m, a) => a.pcpCount, String],
    ['qBankPerPcp', (m, a) => m.bankNetY1 / a.pcpCount, formatCurrency],
    ['qBankPayerSharePct', (m, a) => 100 - a.payerSharePct, String],
    ['qBankPayerShare', (m, a) => m.targetSavings - m.acoShare, formatCurrency],
    ['qBankAcoSharePctLost', (m, a) => a.payerSharePct, String],
    ['qBankAcoShareLost', (m, a) => m.acoShare, formatCurrency],
    ['qBankPayerWindfall', (m, a) => m.targetSavings, formatCurrency],

    // ===== HOSPITAL Quality Miss - "What You Could Have Received" =====
    ['qHospSavingsPct', (m, a) => a.savingsTargetPct, String],
    ['qHospTargetSavings', (m, a) => m.targetSavings, formatCurrency],
    ['qHospPremiumCost', (m, a) => m.hospitalPremiumCost, formatCurrency],
    ['qHospRealizedSavings', (m, a) => m.hospitalRealizedSavings, formatCurrency],
    ['qHospAcoSharePct', (m, a) => a.payerSharePct, String],
    ['qHospAcoShare', (m, a) => m.hospitalAcoShare, formatCurrency],
    ['qHospOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
    ['qHospReserve', (m, a) => m.hospitalAcoShare * a.acoReservePct, formatCurrency],
    ['qHospGainSharePct', (m, a) => a.hospitalGainShare, String],
    ['qHospGainShare', (m, a) => m.hospitalGainShareAmount, formatCurrency],
    ['qHospNetToPcps', (m, a) => m.hospitalNetY1, formatCurrency],
    ['qHospPcpCount', (m, a) => a.pcpCount, String],
    ['qHospPerPcp', (m, a) => m.hospitalNetY1 / a.pcpCount, formatCurrency],
    ['qHospRealizedSavings2', (m, a) => m.hospitalRealizedSavings, formatCurrency],
    ['qHospPayerWindfall', (m, a) => m.hospitalRealizedSavings, formatCurrency],

    // ===== PE Quality Miss - "What You Could Have Received" =====
    ['qPeSavingsPct', (m, a) => a.savingsTargetPct, String],
    ['qPeTotalSavings', (m, a) => m.targetSavings, formatCurrency],
    ['qPeAcoSharePct', (m, a) => a.payerSharePct, String],
    ['qPeAcoShare', (m, a) => m.acoShare, formatCurrency],
    ['qPeOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
    ['qPeReserve', (m, a) => m.acoReserveFund, formatCurrency],
    ['qPeGainSharePct', (m, a) => a.peEquityShare, String],
    ['qPeGainShare', (m, a) => m.peShare, formatCurrency],
    ['qPeNetToPcps', (m, a) => m.peNetToPcps, formatCurrency],
    ['qPePcpCount', (m, a) => a.pcpCount, String],
    ['qPePerPcp', (m, a) => m.peNetToPcps / a.pcpCount, formatCurrency],
    ['qPePayerSharePct', (m, a) => 100 - a.payerSharePct, String],
    ['qPePayerShare', (m, a) => m.targetSavings - m.acoShare, formatCurrency],
    ['qPeAcoSharePctLost', (m, a) => a.payerSharePct, String],
    ['qPeAcoShareLost', (m, a) => m.acoShare, formatCurrency],
    ['qPePayerWindfall', (m, a) => m.targetSavings, formatCurrency],

    // ===== PAYER ADVANCE BINDINGS =====
    // Payer Advance params - slider displays
    ['payerPmpmDisplay', (m, a) => a.payerPmpm, String],
    ['payerClawbackPctDisplay', (m, a) => a.payerClawbackPct, String],
    ['payerPmpmRatchetDisplay', (m, a) => a.payerPmpmRatchet, String],

    // Step 6 hospital slider displays
    ['step6HospitalGainShareDisplay', (m, a) => a.hospitalGainShare, String],
    ['step6HospitalReferralPctDisplay', (m, a) => a.hospitalReferralPct, String],
    ['step6HospitalReferralLockDisplay', (m, a) => a.hospitalReferralLock, String],
    ['step6HospitalCostPremiumDisplay', (m, a) => a.hospitalCostPremium, String],

    // Step 6 payer slider displays
    ['step6PayerPmpmDisplay', (m, a) => a.payerPmpm, String],
    ['step6PayerClawbackPctDisplay', (m, a) => a.payerClawbackPct, String],
    ['step6PayerPmpmRatchetDisplay', (m, a) => a.payerPmpmRatchet, String],

    // Payer Advance - funding card calculations
    ['payerPmpmCalc', (m, a) => a.payerPmpm, String],
    ['payerPatientCount', (m, a) => m.attributedPatients, formatNumber],
    ['payerMonthlyCalc', (m, a) => m.payerMonthlyPmpm, formatCurrency],
    ['payerTotalAdvanceCalc', (m, a) => m.payerTotalAdvance18mo, formatCurrency],
    ['payerClawbackCalc', (m, a) => m.payerClawbackAmount, formatCurrency],
    ['payerClawbackPctCalc', (m, a) => a.payerClawbackPct, String],
    ['payerClawbackPerPcpCalc', (m, a) => m.payerClawbackPerPcp, formatCurrency],

    // Payer Advance - Underwater warning
    ['payerAnnualAdvanceWarn', (m, a) => m.payerAnnualAdvance, formatCurrency],
    ['payerAcoShareWarn', (m, a) => m.acoShare, formatCurrency],
    ['payerUnderwaterAmountWarn', (m, a) => m.payerUnderwaterAmount, formatCurrency],

    // Payer Miss scenario
    ['payerClawbackOwedMiss', (m, a) => m.payerClawbackAmount, formatCurrency],
    ['payerClawbackPerPcpMiss', (m, a) => m.payerClawbackPerPcp, formatCurrency],
    ['payerPerPcpLossMiss', (m, a) => m.practiceBurden18mo + m.payerClawbackPerPcp, formatCurrency],
    ['payerAdvanceReceivedMiss', (m, a) => m.payerTotalAdvance18mo / a.pcpCount, formatCurrency],
    ['payerClawbackPctMiss', (m, a) => a.payerClawbackPct, String],
    ['payerBurdenMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['payerNetLossMiss', (m, a) => m.practiceBurden18mo + m.payerClawbackPerPcp, formatCurrency],
    ['payerClawbackMissText', (m, a) => m.payerClawbackPerPcp, formatCurrency],
    ['payerClawbackMissPerDoc', (m, a) => m.payerClawbackPerPcp, formatCurrency],
    ['payerBurdenMissText', (m, a) => m.practiceBurden18mo, formatCurrency],

    // Payer Quality Miss - "What Could Have Received"
    ['qPayerSavingsPct', (m, a) => a.savingsTargetPct, String],
    ['qPayerTotalSavings', (m, a) => m.targetSavings, formatCurrency],
    ['qPayerAcoSharePct', (m, a) => a.payerSharePct, String],
    ['qPayerAcoShare', (m, a) => m.acoShare, formatCurrency],
    ['qPayerOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
    ['qPayerReserve', (m, a) => m.acoReserveFund, formatCurrency],
    ['qPayerAdvanceDeduction', (m, a) => m.payerAdvanceDeduction, formatCurrency],
    ['qPayerNetToPcps', (m, a) => m.payerNetY1, formatCurrency],
    ['qPayerPcpCount', (m, a) => a.pcpCount, String],
    ['qPayerPerPcp', (m, a) => m.payerNetPerPcp, formatCurrency],
    ['qPayerPayerSharePct', (m, a) => 100 - a.payerSharePct, String],
    ['qPayerPayerShare', (m, a) => m.targetSavings - m.acoShare, formatCurrency],
    ['qPayerAcoShareLost', (m, a) => m.acoShare, formatCurrency],
    ['qPayerClawbackRecovery', (m, a) => m.payerClawbackAmount, formatCurrency],
    ['qPayerPayerWindfall', (m, a) => m.targetSavings + m.payerClawbackAmount, formatCurrency],
    ['qPayerClawbackOwed', (m, a) => m.payerClawbackAmount, formatCurrency],
    ['qPayerClawbackPerPcp', (m, a) => m.payerClawbackPerPcp, formatCurrency],
    ['qPayerPerPcpLoss', (m, a) => m.practiceBurden18mo + m.payerClawbackPerPcp, formatCurrency],
    ['qPayerAdvanceReceived', (m, a) => m.payerTotalAdvance18mo / a.pcpCount, formatCurrency],
    ['qPayerClawbackPctQ', (m, a) => a.payerClawbackPct, String],
    ['qPayerBurdenMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qPayerClawbackPerDocQ', (m, a) => m.payerClawbackPerPcp, formatCurrency],
    ['qPayerNetLossMiss', (m, a) => m.practiceBurden18mo + m.payerClawbackPerPcp, formatCurrency],

    // Payer Hit scenario
    ['payerGrossShare', (m, a) => m.acoShare, formatCurrency],
    ['payerOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
    ['payerReserveRetention', (m, a) => m.acoReserveFund, formatCurrency],
    ['payerAdvanceDeductionHit', (m, a) => m.payerAdvanceDeduction, formatCurrency],
    ['payerNetHit', (m, a) => m.payerNetY1, formatCurrency],
    ['payerPcpCountHit', (m, a) => a.pcpCount, String],
    ['payerPerPcpHit', (m, a) => m.payerNetPerPcp, formatCurrency],
    ['payerPerPcpHitContext', (m, a) => m.payerNetPerPcp, formatCurrency],
    ['payerPracticeBurdenPerDoc', (m, a) => m.practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER, formatCurrency],
    ['payerRatchetPctHit', (m, a) => a.payerPmpmRatchet, String],
    ['payerY1PmpmHit', (m, a) => a.payerPmpm, String],
    ['payerY2PmpmHit', (m, a) => (a.payerPmpm * (1 - a.payerPmpmRatchet / 100)).toFixed(2), String],
    ['payerAdvanceDeductedStat', (m, a) => m.payerAdvanceDeduction, formatCurrency],
    ['payerY2PmpmStat', (m, a) => (a.payerPmpm * (1 - a.payerPmpmRatchet / 100)).toFixed(2), String],

    // Step 0 - Preview
    ['totalPatientsPreview', (m, a) => m.attributedPatients, formatNumber],
    ['totalTcocPreview', (m, a) => m.totalTcoc, formatCurrency],

    // Step 1 - Pot of Gold
    ['totalPanelPatientsCalc', (m, a) => m.totalPanelPatients, formatNumber],
    ['attributionPctCalc', (m, a) => a.attributionPct, String],
    ['attributedPatientsCalc', (m, a) => m.attributedPatients, formatNumber],
    ['tcocPerPatientCalc', (m, a) => a.tcocPerPatient, formatNumber],
    ['totalTcocCalc', (m, a) => m.totalTcoc, formatCurrencyFull],
    ['savingsTargetPctCalc', (m, a) => a.savingsTargetPct, String],
    ['targetSavingsCalc', (m, a) => m.targetSavings, formatCurrencyFull],
    ['payerSharePctCalc', (m, a) => a.payerSharePct, String],
    ['acoShareCalc', (m, a) => m.acoShare, formatCurrencyFull],
    ['acoShareCalc2', (m, a) => m.acoShare, formatCurrencyFull],
    ['payerKeepsPctCalc', (m, a) => 100 - a.payerSharePct, String],
    ['payerShareAmountCalc', (m, a) => m.targetSavings - m.acoShare, formatCurrencyFull],
    ['pcpCountCalc', (m, a) => a.pcpCount, formatNumber],
    ['perPcpCalc', (m, a) => Math.round(m.perPcpBonus), formatNumber],
    ['perPcpBonus', (m, a) => Math.round(m.perPcpBonus), formatNumber],
    ['acoShareDisplay', (m, a) => m.acoShare, formatCurrency],
    ['perPcpDisplay', (m, a) => m.perPcpBonus, formatCurrency],
    ['msrThresholdDisplay', (m, a) => m.msrThreshold, formatCurrency],
    ['msrPctCalc', (m, a) => a.msrPct, String],

    // Step 2 - Costs (slider displays)
    ['dataAnalyticsCostDisplay', (m, a) => a.dataAnalyticsCost, formatCurrency],
    ['careManagerRatioDisplay', (m, a) => a.careManagerRatio, formatNumber],
    ['careManagerSalaryDisplay', (m, a) => a.careManagerSalary, formatCurrency],
    ['adminCostDisplay', (m, a) => a.adminCost, formatCurrency],
    ['itCostDisplay', (m, a) => a.itCost, formatCurrency],
    ['legalCostDisplay', (m, a) => a.legalCost, formatCurrency],
    ['qualityCostDisplay', (m, a) => a.qualityCost, formatCurrency],
    ['lostHoursPerWeekDisplay', (m, a) => a.lostHoursPerWeek.toFixed(1), String],
    ['revenuePerVisitDisplay', (m, a) => a.revenuePerVisit, String],
    ['visitsPerHourDisplay', (m, a) => a.visitsPerHour.toFixed(1), String],
    ['practiceStaffFtePerPcpDisplay', (m, a) => a.practiceStaffFtePerPcp.toFixed(2), String],
    ['practiceStaffSalaryDisplay', (m, a) => a.practiceStaffSalary, formatCurrency],

    // ACO Bucket displays
    ['dataAnalyticsCostCalc', (m, a) => a.dataAnalyticsCost, formatCurrencyFull],
    ['careManagerCountCalc', (m, a) => m.careManagersNeeded, String],
    ['careManagementCostCalc', (m, a) => m.careManagementCost, formatCurrencyFull],
    ['adminCostCalc', (m, a) => a.adminCost, formatCurrencyFull],
    ['itCostCalc', (m, a) => a.itCost, formatCurrencyFull],
    ['legalCostCalc', (m, a) => a.legalCost, formatCurrencyFull],
    ['qualityCostCalc', (m, a) => a.qualityCost, formatCurrencyFull],
    ['acoInfrastructureTotalCalc', (m, a) => m.acoInfrastructureTotal, formatCurrencyFull],

    // Practice Bucket displays (per PCP)
    ['lostHoursCalc', (m, a) => a.lostHoursPerWeek, String],
    ['visitsPerHourCalc', (m, a) => m.visitsPerHour, String],
    ['revenuePerVisitCalc', (m, a) => a.revenuePerVisit, String],
    ['lostFfsPerDocCalc', (m, a) => Math.round(m.lostFfsPerPcp), formatNumber],
    ['practiceStaffFteCalc2', (m, a) => a.practiceStaffFtePerPcp.toFixed(2), String],
    ['practiceStaffSalaryCalc2', (m, a) => a.practiceStaffSalary, formatCurrency],
    ['practiceStaffPerDocCalc', (m, a) => Math.round(m.practiceStaffPerPcp), formatNumber],
    ['practiceBurdenPerPcpCalc', (m, a) => Math.round(m.practiceBurdenPerPcp), formatNumber],

    // Critical Timing displays (ACO-only)
    ['acoMonthlyBurnDisplay', (m, a) => m.acoMonthlyBurn, formatCurrency],
    ['acoFundingNeededDisplay', (m, a) => m.acoFundingNeeded, formatCurrency],
    ['practiceBurden18moDisplay', (m, a) => m.practiceBurden18mo, formatCurrency],

    // Step 3 - Funding
    ['fundingNeededChoice', (m, a) => m.fundingNeeded, formatCurrency],

    // Bank params - slider displays
    ['bankInterestRateDisplay', (m, a) => a.bankInterestRate.toFixed(1), String],
    ['bankTermMonthsDisplay', (m, a) => a.bankTermMonths, String],
    ['bankOrigFeeDisplay', (m, a) => a.bankOrigFee.toFixed(1), String],

    // Bank loan - Phase 1 (Setup)
    ['bankFundingNeeded', (m, a) => Math.round(m.fundingNeeded), formatCurrencyFull],
    ['bankOrigFeePctCalc', (m, a) => a.bankOrigFee, String],
    ['bankOrigFeeCalc', (m, a) => Math.round(m.bankOrigFeeAmount), formatCurrencyFull],
    ['bankPrincipalCalc', (m, a) => Math.round(m.bankPrincipal), formatCurrencyFull],
    ['bankCapitalizedInterest', (m, a) => Math.round(m.capitalizedInterest), formatCurrencyFull],
    ['bankCapitalizedPrincipal', (m, a) => Math.round(m.capitalizedPrincipal), formatCurrencyFull],

    // Bank loan - Phase 2 (Repayment using deferred values)
    ['bankMonthlyPaymentCalc', (m, a) => Math.round(m.deferredMonthlyPayment), formatCurrencyFull],
    ['bankTermMonthsCalc', (m, a) => a.bankTermMonths, String],
    ['bankTotalRepaymentCalc', (m, a) => Math.round(m.deferredTotalRepayment), formatCurrencyFull],
    ['bankTotalInterestCalc', (m, a) => Math.round(m.deferredTotalInterest), formatCurrencyFull],

    // Bank loan - Personal liability
    ['pcpCountBank', (m, a) => a.pcpCount, String],
    ['perPcpLiability', (m, a) => Math.round(m.deferredTotalRepayment / a.pcpCount), formatCurrencyFull],

    // Hospital params
    ['hospitalReferralLockDisplay', (m, a) => a.hospitalReferralLock, String],
    ['hospitalCostPremiumDisplay', (m, a) => a.hospitalCostPremium, String],
    ['hospitalGainShareDisplay', (m, a) => a.hospitalGainShare, String],
    ['hospitalReferralPctDisplay', (m, a) => a.hospitalReferralPct, String],
    ['hospitalReferralVolumeCalc', (m, a) => m.hospitalReferralVolume, formatCurrency],
    ['hospitalLockPctCalc', (m, a) => a.hospitalReferralLock, String],
    ['hospitalLockedVolumeCalc', (m, a) => m.hospitalLockedVolume, formatCurrency],
    ['hospitalPremiumPctCalc', (m, a) => a.hospitalCostPremium, String],
    ['hospitalPremiumCostCalc', (m, a) => m.hospitalPremiumCost, formatCurrency],
    ['hospitalHiddenCostCalc', (m, a) => m.hospitalPremiumCost, formatCurrency],
    ['targetSavingsHospital', (m, a) => m.targetSavings, formatCurrency],
    ['hospitalPremiumCostDisplay', (m, a) => m.hospitalPremiumCost, formatCurrency],

    // PE params
    ['peEquityShareDisplay', (m, a) => a.peEquityShare, String],
    ['peBoardControlDisplay', (m, a) => a.peBoardControl, String],
    ['peExitYearsDisplay', (m, a) => a.peExitYears, String],

    // Step 4 - Outcomes (Miss scenario)
    ['msrPctMiss', (m, a) => a.msrPct, String],
    ['actualSavingsMiss', (m, a) => m.actualSavings1Pct, formatCurrency],
    ['msrPctMissCalc', (m, a) => a.msrPct, String],
    ['msrThresholdMiss', (m, a) => m.msrThreshold, formatCurrency],

    // Bank miss
    ['bankDebtMiss', (m, a) => m.capitalizedPrincipal / a.pcpCount, formatCurrency],
    ['bankDebtOwed', (m, a) => m.capitalizedPrincipal, formatCurrency],
    ['perPcpDebt', (m, a) => m.capitalizedPrincipal / a.pcpCount, formatCurrency],

    // Hit target
    ['savingsTargetHit', (m, a) => a.savingsTargetPct, String],
    ['savingsPctHit', (m, a) => a.savingsTargetPct, String],
    ['totalSavingsHit', (m, a) => m.targetSavings, formatCurrency],
    ['payerShareHit', (m, a) => 100 - a.payerSharePct, String],
    ['payerShareAmountHit', (m, a) => m.targetSavings - m.acoShare, formatCurrency],
    ['acoSharePctHit', (m, a) => a.payerSharePct, String],
    ['acoShareHit', (m, a) => m.acoShare, formatCurrency],

    // Bank hit (with ACO retention including loan payments)
    ['bankGrossShare', (m, a) => m.acoShare, formatCurrency],
    ['bankOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
    ['bankReserveRetention', (m, a) => m.acoReserveFund, formatCurrency],
    ['bankY1LoanRetentionHit', (m, a) => m.bankY1LoanRetention, formatCurrency],
    ['bankNetHit', (m, a) => m.bankNetY1, formatCurrency],
    ['bankPcpCountHit', (m, a) => a.pcpCount, String],
    ['bankPerPcpInline', (m, a) => m.bankNetY1 / a.pcpCount, formatCurrency],

    // Hospital hit - cannot-hit container elements
    ['hospitalLockPctWarn', (m, a) => a.hospitalReferralLock, String],
    ['hospitalPremiumPctWarn', (m, a) => a.hospitalCostPremium, String],

    // Hospital hit - banner elements (Net Effective Savings %)
    ['hospitalNetSavingsPctHit', (m, a) => m.netEffectiveSavingsPct.toFixed(1), String],
    ['hospitalTargetPctHit', (m, a) => a.savingsTargetPct, String],
    ['hospitalPremiumPctHit', (m, a) => m.hospitalPremiumPctOfTcoc.toFixed(1), String],
    ['hospitalNetSavingsPctHit2', (m, a) => m.netEffectiveSavingsPct.toFixed(1), String],
    ['hospitalTargetPctHit2', (m, a) => a.savingsTargetPct, String],
    ['hospitalPremiumPctHit2', (m, a) => m.hospitalPremiumPctOfTcoc.toFixed(1), String],
    ['hospitalNetSavingsPctHit3', (m, a) => m.netEffectiveSavingsPct.toFixed(1), String],

    // Hospital hit - success content elements
    ['hospitalTargetSavingsCalc', (m, a) => m.targetSavings, formatCurrency],
    ['hospitalPremiumCalc', (m, a) => m.hospitalPremiumCost, formatCurrency],
    ['hospitalRealizedSavingsCalc', (m, a) => m.hospitalRealizedSavings, formatCurrency],
    ['hospitalPayerSharePct', (m, a) => a.payerSharePct, String],
    ['hospitalGrossShare', (m, a) => m.hospitalAcoShare, formatCurrency],
    ['hospitalOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
    ['hospitalReserveRetention', (m, a) => m.hospitalAcoShare * a.acoReservePct, formatCurrency],
    ['hospitalNetDistributableDisplay', (m, a) => m.hospitalNetDistributable, formatCurrency],
    ['hospitalGainShareHitPct', (m, a) => a.hospitalGainShare, String],
    ['hospitalGainShareHit', (m, a) => m.hospitalGainShareAmount, formatCurrency],
    ['hospitalNetHit', (m, a) => m.hospitalNetY1, formatCurrency],
    ['hospitalPerPcpHit', (m, a) => m.hospitalNetY1 / a.pcpCount, formatCurrency],
    ['hospitalTakeHit', (m, a) => m.hospitalGainShareAmount, formatCurrency],

    // Hospital cannot-hit container - percentage display
    ['hospitalPremiumPctWarn2', (m, a) => m.hospitalPremiumPctOfTcoc.toFixed(2), String],
    ['savingsTargetPctWarn', (m, a) => a.savingsTargetPct, String],
    ['premiumEffectPctWarn', (m, a) => m.hospitalPremiumPctOfTcoc.toFixed(2), String],
    ['netSavingsPctWarn', (m, a) => m.netEffectiveSavingsPct.toFixed(2), String],
    ['msrPctWarn', (m, a) => a.msrPct, String],

    // Hospital missed target - reframed explanation
    ['hospitalInvestmentMiss', (m, a) => m.acoFundingNeeded, formatCurrency],
    ['hospitalMsrPctBanner', (m, a) => a.msrPct, String],

    // PE hit (with ACO retention)
    ['peGrossShare', (m, a) => m.acoShare, formatCurrency],
    ['peOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
    ['peReserveRetention', (m, a) => m.acoReserveFund, formatCurrency],
    ['peNetDistributable', (m, a) => m.netDistributableShare, formatCurrency],
    ['peEquityHitPct', (m, a) => a.peEquityShare, String],
    ['peShareHit', (m, a) => m.peShare, formatCurrency],
    ['peNetHit', (m, a) => m.peNetToPcps, formatCurrency],
    ['pePerPcpHit', (m, a) => m.peNetToPcps / a.pcpCount, formatCurrency],
    ['peTakeHit', (m, a) => m.peTotalTake, formatCurrency],

    // Year 1 Payout Context - Hospital
    ['hospitalPerPcpHitContext', (m, a) => m.hospitalNetY1 / a.pcpCount, formatCurrency],
    ['hospitalPcpCountHit', (m, a) => a.pcpCount, formatNumber],

    // Year 1 Payout Context - PE
    ['pePerPcpHitContext', (m, a) => m.peNetToPcps / a.pcpCount, formatCurrency],
    ['pePcpCountHit', (m, a) => a.pcpCount, formatNumber],

    // ===== MISS SCENARIO - PCP Impact Displays =====
    // Bank Miss - PCP Impact
    ['bankBurdenMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['bankBurdenMissText', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['bankNetLossMiss', (m, a) => m.practiceBurden18mo + (m.capitalizedPrincipal / a.pcpCount), formatCurrency],
    ['bankPerPcpLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['bankDebtMissText', (m, a) => m.capitalizedPrincipal, formatCurrency],

    // Hospital Miss - PCP Impact
    ['hospBurdenMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['hospBurdenMissText', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['hospNetLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['hospPerPcpLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],

    // PE Miss - PCP Impact
    ['peBurdenMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['peBurdenMissText', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['peNetLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['pePerPcpLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['peInvestmentMissText', (m, a) => m.acoFundingNeeded, formatCurrency],

    // ===== QUALITY MISS - PCP Impact (same as TCOC Miss) =====
    ['qBankBurdenMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qBankPerPcpLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qHospBurdenMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qHospNetLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qHospPerPcpLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qPeBurdenMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qPeNetLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qPePerPcpLossMiss', (m, a) => m.practiceBurden18mo, formatCurrency],

    // ===== NEW "Reality for Each PCP" Box Displays =====
    // Bank TCOC Miss - Reality Box (bankDebtMiss, bankNetLossMiss already fixed above)
    ['bankLiabilityPerPcpText', (m, a) => m.capitalizedPrincipal / a.pcpCount, formatCurrency],

    // Bank Quality Miss - Reality Box
    ['qBankLiabilityPerDoc', (m, a) => m.capitalizedPrincipal / a.pcpCount, formatCurrency],
    ['qBankNetPositionMiss', (m, a) => m.practiceBurden18mo + (m.capitalizedPrincipal / a.pcpCount), formatCurrency],
    ['qBankBurdenMissText', (m, a) => m.practiceBurden18mo, formatCurrency],
    ['qBankDebtOwedText', (m, a) => m.capitalizedPrincipal, formatCurrency],
    ['qBankLiabilityPerPcpText', (m, a) => m.capitalizedPrincipal / a.pcpCount, formatCurrency],

    // Hospital TCOC Miss - Reality Box
    ['hospAcoLossMiss', (m, a) => m.acoFundingNeeded, formatCurrency],
    ['hospAcoLossMiss2', (m, a) => m.acoFundingNeeded, formatCurrency],

    // Hospital Quality Miss - Reality Box
    ['qHospInfraLoss', (m, a) => m.acoFundingNeeded, formatCurrency],
    ['qHospAcoLossMiss', (m, a) => m.acoFundingNeeded, formatCurrency],
    ['qHospAcoLossMiss2', (m, a) => m.acoFundingNeeded, formatCurrency],
    ['qHospBurdenMissText', (m, a) => m.practiceBurden18mo, formatCurrency],

    // PE Quality Miss - Reality Box
    ['qPeInfraLoss', (m, a) => m.acoFundingNeeded, formatCurrency],
    ['qPeBurdenMissText', (m, a) => m.practiceBurden18mo, formatCurrency],

    // ===== HIT TARGET - Discussion Questions & Stat Cards =====

    // Hospital Hit - stat card values
    ['hospitalLockPctHit', (m, a) => a.hospitalReferralLock, String],

    // PE Hit - stat card values
    ['peBoardControlHit', (m, a) => a.peBoardControl, String],

    // ===== COMPARISON MATRIX =====
    // TCOC Miss (all funders lose burden only, no ACO payout)
    ['cmpBankMiss', (m, a) => -(m.practiceBurden18mo + m.capitalizedPrincipal / a.pcpCount), formatSignedCurrency],
    ['cmpHospitalMiss', (m, a) => -m.practiceBurden18mo, formatSignedCurrency],
    ['cmpPeMiss', (m, a) => -m.practiceBurden18mo, formatSignedCurrency],
    ['cmpPayerMiss', (m, a) => -(m.practiceBurden18mo + m.payerClawbackPerPcp), formatSignedCurrency],

    // Quality Miss (same as TCOC Miss - no payout)
    ['cmpBankQuality', (m, a) => -(m.practiceBurden18mo + m.capitalizedPrincipal / a.pcpCount), formatSignedCurrency],
    ['cmpHospitalQuality', (m, a) => -m.practiceBurden18mo, formatSignedCurrency],
    ['cmpPeQuality', (m, a) => -m.practiceBurden18mo, formatSignedCurrency],
    ['cmpPayerQuality', (m, a) => -(m.practiceBurden18mo + m.payerClawbackPerPcp), formatSignedCurrency],

    // Hit Target (uses pre-computed net outcomes from model)
    ['cmpBankHit', (m, a) => m.bankNetOutcome, formatSignedCurrency],
    ['cmpHospitalHit', (m, a) => m.hospitalMeetsThreshold ? m.hospitalNetOutcome : -m.practiceBurden18mo, formatSignedCurrency],
    ['cmpPeHit', (m, a) => m.peNetOutcome, formatSignedCurrency],
    ['cmpPayerHit', (m, a) => m.payerNetOutcome, formatSignedCurrency],
];
