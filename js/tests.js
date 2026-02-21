import { assumptions, state, monteCarloState, getMonteCarloVariableKeys, PRESETS, CONSTANTS } from './config.js';
import { computeModel, amortize, computeCore, computeInfrastructure, computePracticeBurden, computeBankLoan, computeHospital, computePE, computePayerAdvance } from './model.js';
import { computeMultiYear, computeYearFinancials, computeHospitalPremiumForYear } from './multiYear.js';
import { computeQualityGate, computeRafAdjustment, inflationMultiplier, computeRafGrowthRates, computeMissLossPerPcp } from './computeHelpers.js';
import { generateSampledAssumptions, computeMonteCarloIteration, computeMedian, computePercentile, computeStdDev, sampleTriangular, sampleUniform, getVariationBounds } from './mcSampling.js';
import { applyPreset, showMonteCarloTab } from './ui.js';
import { formatCurrency, formatCurrencyFull, formatSignedCurrency, capitalizeFirst, formatCurrencyNegatable } from './formatters.js';
import { computeRanks, computeSpearmanCorrelation } from './mcSampling.js';

// Key fields to test - covers all major calculation domains
const TEST_FIELDS = [
    // Core
    'totalPanelPatients', 'attributedPatients', 'totalPatients', 'totalTcoc', 'targetSavings', 'acoShare', 'msrThreshold',
    // RAF
    'acoRaf', 'regionalRaf', 'rafRatio', 'adjustedBenchmark',
    // Infrastructure
    'acoInfrastructureTotal', 'careManagersNeeded', 'practiceBurdenPerPcp',
    // Net outcome and retention
    'netDistributableShare', 'acoOperationalRetention', 'acoReserveFund', 'acoFundingNeeded', 'practiceBurden18mo',
    // Bank
    'capitalizedPrincipal', 'deferredMonthlyPayment', 'bankNetY1', 'bankNetDistributableShare',
    'bankPrincipal', 'bankOrigFeeAmount', 'loanPaymentsFromY1Amount',
    // Hospital
    'hospitalPremiumCost', 'hospitalMeetsThreshold', 'hospitalNetY1',
    'hospitalAcoShare', 'hospitalNetDistributable', 'hospitalGainShareAmount',
    // PE
    'peShare', 'peNetToPcps',
    // Payer
    'payerMonthlyPmpm', 'payerTotalAdvance18mo', 'payerAnnualAdvance',
    'payerAdvanceDeduction', 'payerNetDistributable',
    'payerClawbackAmount', 'payerClawbackPerPcp', 'payerIsUnderwater'
];

// Capture current baseline values - run this in console to get expected values
export function captureBaseline() {
    const baseline = {};
    ['worst', 'realistic', 'best'].forEach(preset => {
        applyPreset(preset);
        const m = computeModel();
        baseline[preset] = {};
        TEST_FIELDS.forEach(field => {
            baseline[preset][field] = m[field];
        });
    });
    applyPreset('realistic');
    console.log('// Copy this into EXPECTED_VALUES:');
    console.log(JSON.stringify(baseline, null, 2));
    return baseline;
}

// Expected baseline values (captured from current working version)
// Run captureBaseline() in console to regenerate if needed
// NOTE: Run captureBaseline() after code changes to regenerate expected values
// RAF adjustment affects targetSavings, acoShare, msrThreshold, and cascading values
// Attribution: worst=70%, realistic=80%, best=90%
const EXPECTED_VALUES = {
    "worst": {
        "totalPanelPatients": 40000,
        "attributedPatients": 28000,
        "totalPatients": 28000,
        "totalTcoc": 336000000,
        "targetSavings": 9119999.999999998,
        "acoShare": 3647999.9999999995,
        "msrThreshold": 9119999.999999998,
        "acoRaf": 0.95,
        "regionalRaf": 1.05,
        "rafRatio": 0.9047619047619047,
        "adjustedBenchmark": 303999999.99999994,
        "acoInfrastructureTotal": 2580000,
        "careManagersNeeded": 2,
        "practiceBurdenPerPcp": 99250,
        "netDistributableShare": 703199.9999999995,
        "acoOperationalRetention": 2580000,
        "acoReserveFund": 364800,
        "acoFundingNeeded": 3870000,
        "practiceBurden18mo": 148875,
        "capitalizedPrincipal": 4583374.810661432,
        "deferredMonthlyPayment": 211499.49301520115,
        "bankNetY1": 0,
        "bankNetDistributableShare": 0,
        "bankPrincipal": 3947400,
        "bankOrigFeeAmount": 77400,
        "loanPaymentsFromY1Amount": 2537993.9161824137,
        "hospitalPremiumCost": 26459999.999999996,
        "hospitalMeetsThreshold": false,
        "hospitalNetY1": 0,
        "hospitalAcoShare": 0,
        "hospitalNetDistributable": 0,
        "hospitalGainShareAmount": 0,
        "peShare": 421919.9999999997,
        "peNetToPcps": 281279.9999999998,
        "payerMonthlyPmpm": 140000,
        "payerTotalAdvance18mo": 2520000,
        "payerAnnualAdvance": 1680000,
        "payerAdvanceDeduction": 1680000,
        "payerNetDistributable": 0,
        "payerClawbackAmount": 2520000,
        "payerClawbackPerPcp": 50400,
        "payerIsUnderwater": false
    },
    "realistic": {
        "totalPanelPatients": 100000,
        "attributedPatients": 80000,
        "totalPatients": 80000,
        "totalTcoc": 800000000,
        "targetSavings": 40000000,
        "acoShare": 20000000,
        "msrThreshold": 12000000,
        "acoRaf": 1.0,
        "regionalRaf": 1.0,
        "rafRatio": 1.0,
        "adjustedBenchmark": 800000000,
        "acoInfrastructureTotal": 2090000,
        "careManagersNeeded": 3,
        "practiceBurdenPerPcp": 57500,
        "netDistributableShare": 15910000,
        "acoOperationalRetention": 2090000,
        "acoReserveFund": 2000000,
        "acoFundingNeeded": 3135000,
        "practiceBurden18mo": 86250,
        "capitalizedPrincipal": 3568628.2343713418,
        "deferredMonthlyPayment": 111827.83854824204,
        "bankNetY1": 14568065.937421095,
        "bankNetDistributableShare": 14568065.937421095,
        "bankPrincipal": 3166350,
        "bankOrigFeeAmount": 31350,
        "loanPaymentsFromY1Amount": 1341934.0625789044,
        "hospitalPremiumCost": 31680000,
        "hospitalMeetsThreshold": false,
        "hospitalNetY1": 0,
        "hospitalAcoShare": 0,
        "hospitalNetDistributable": 0,
        "hospitalGainShareAmount": 0,
        "peShare": 7955000,
        "peNetToPcps": 7955000,
        "payerMonthlyPmpm": 800000,
        "payerTotalAdvance18mo": 14400000,
        "payerAnnualAdvance": 9600000,
        "payerAdvanceDeduction": 9600000,
        "payerNetDistributable": 6310000,
        "payerClawbackAmount": 10800000,
        "payerClawbackPerPcp": 108000,
        "payerIsUnderwater": false
    },
    "best": {
        "totalPanelPatients": 180000,
        "attributedPatients": 162000,
        "totalPatients": 162000,
        "totalTcoc": 1296000000,
        "targetSavings": 105044210.5263158,
        "acoShare": 63026526.315789476,
        "msrThreshold": 0,
        "acoRaf": 1.1,
        "regionalRaf": 0.95,
        "rafRatio": 1.1578947368421053,
        "adjustedBenchmark": 1500631578.9473684,
        "acoInfrastructureTotal": 1725000,
        "careManagersNeeded": 5,
        "practiceBurdenPerPcp": 30750,
        "netDistributableShare": 54998873.684210524,
        "acoOperationalRetention": 1725000,
        "acoReserveFund": 6302652.631578948,
        "acoFundingNeeded": 2587500,
        "practiceBurden18mo": 46125,
        "capitalizedPrincipal": 2844693.8367867265,
        "deferredMonthlyPayment": 66807.71738942096,
        "bankNetY1": 54197181.07553747,
        "bankNetDistributableShare": 54197181.07553747,
        "bankPrincipal": 2600437.5,
        "bankOrigFeeAmount": 12937.5,
        "loanPaymentsFromY1Amount": 801692.6086730515,
        "hospitalPremiumCost": 24300000,
        "hospitalMeetsThreshold": true,
        "hospitalNetY1": 25126124.210526317,
        "hospitalAcoShare": 48446526.315789476,
        "hospitalNetDistributable": 41876873.68421053,
        "hospitalGainShareAmount": 16750749.473684214,
        "peShare": 21999549.47368421,
        "peNetToPcps": 32999324.210526314,
        "payerMonthlyPmpm": 2430000,
        "payerTotalAdvance18mo": 43740000,
        "payerAnnualAdvance": 29160000,
        "payerAdvanceDeduction": 29160000,
        "payerNetDistributable": 25838873.684210524,
        "payerClawbackAmount": 21870000,
        "payerClawbackPerPcp": 145800,
        "payerIsUnderwater": false
    }
};

// Run all tests
export function runTests() {
    const results = { passed: 0, failed: 0, failures: [] };

    function assertEqual(preset, field, actual, expected) {
        // For booleans, exact match
        if (typeof expected === 'boolean') {
            if (actual === expected) {
                results.passed++;
            } else {
                results.failed++;
                results.failures.push({ preset, field, actual, expected });
            }
            return;
        }
        // For numbers, use 0.1% tolerance
        const tolerance = 0.001;
        const diff = Math.abs(actual - expected) / Math.max(Math.abs(expected), 1);
        if (diff <= tolerance) {
            results.passed++;
        } else {
            results.failed++;
            results.failures.push({ preset, field, actual, expected, diff: (diff * 100).toFixed(2) + '%' });
        }
    }

    // Check if baseline values exist
    if (Object.keys(EXPECTED_VALUES).length === 0) {
        console.error('No baseline values! Run captureBaseline() first and copy output to EXPECTED_VALUES');
        return false;
    }

    // Test each preset
    ['worst', 'realistic', 'best'].forEach(preset => {
        applyPreset(preset);
        const m = computeModel();
        const expected = EXPECTED_VALUES[preset];

        TEST_FIELDS.forEach(field => {
            assertEqual(preset, field, m[field], expected[field]);
        });
    });

    // Restore to realistic
    applyPreset('realistic');

    // ---- Statistics Helper Unit Tests ----
    function assertExact(label, actual, expected) {
        if (actual === expected) {
            results.passed++;
        } else {
            results.failed++;
            results.failures.push({ preset: 'unit', field: label, actual, expected });
        }
    }
    function assertClose(label, actual, expected, tol) {
        tol = tol || 0.001;
        const diff = Math.abs(actual - expected);
        if (diff <= tol) {
            results.passed++;
        } else {
            results.failed++;
            results.failures.push({ preset: 'unit', field: label, actual, expected, diff });
        }
    }

    // computeMedian
    assertExact('median odd', computeMedian([1,2,3]), 2);
    assertExact('median even', computeMedian([1,2,3,4]), 2.5);
    assertExact('median empty', computeMedian([]), 0);

    // computePercentile
    const pArr = Array.from({length:100}, (_, i) => i);
    assertExact('percentile p95', computePercentile(pArr, 0.95), 95);
    assertExact('percentile p=1.0', computePercentile([1,2,3], 1.0), 3);
    assertExact('percentile empty', computePercentile([], 0.5), 0);

    // computeStdDev
    assertClose('stddev basic', computeStdDev([2,4,4,4,5,5,7,9], 5), 2.138, 0.001);
    assertExact('stddev single', computeStdDev([5], 5), 0);

    // computeRanks and computeSpearmanCorrelation
    const ranks1 = computeRanks([3,1,2]);
    assertExact('ranks simple[0]', ranks1[0], 3);
    assertExact('ranks simple[1]', ranks1[1], 1);
    assertExact('ranks simple[2]', ranks1[2], 2);
    const ranksTied = computeRanks([1,1,3]);
    assertExact('ranks ties[0]', ranksTied[0], 1.5);
    assertExact('ranks ties[1]', ranksTied[1], 1.5);
    assertExact('ranks ties[2]', ranksTied[2], 3);
    assertClose('spearman perfect', computeSpearmanCorrelation([1,2,3],[1,2,3]), 1.0, 0.001);
    assertClose('spearman inverse', computeSpearmanCorrelation([1,2,3],[3,2,1]), -1.0, 0.001);

    // ---- Edge Case Tests ----
    // amortize 0% rate
    assertClose('amortize 0%', amortize(120000, 0, 12), 10000, 0.01);

    // formatCurrency NaN/Infinity
    assertExact('formatCurrency NaN', formatCurrency(NaN), '0');
    assertExact('formatCurrency Inf', formatCurrency(Infinity), '0');
    assertExact('formatCurrencyFull NaN', formatCurrencyFull(NaN), '0');
    assertExact('formatCurrencyFull Inf', formatCurrencyFull(Infinity), '0');

    // RAF disabled: ratio should be 1.0
    const savedRaf = assumptions.enableRafAdjustment;
    assumptions.enableRafAdjustment = false;
    const mNoRaf = computeModel();
    assertExact('RAF disabled ratio', mNoRaf.rafRatio, 1.0);
    assumptions.enableRafAdjustment = savedRaf;

    // ---- Multi-Year Projection Tests ----
    const savedStep = state.currentStep;
    const savedFunding = state.selectedFunding;
    state.currentStep = 5;

    // Bank multi-year test
    applyPreset('realistic');
    state.selectedFunding = 'bank';
    const mBank = computeModel();
    const myBankHit = mBank.multiYearHit;
    assertExact('my bank rows >= 1', myBankHit.rows.length >= 1, true);
    assertExact('my bank rows <= 10', myBankHit.rows.length <= 10, true);
    assertExact('my bank Y1 status', myBankHit.rows[0].status, 'Hit');
    // Benchmark ratchets after hit: Year 2 < Year 1
    if (myBankHit.rows.length >= 2) {
        const y1Bench = myBankHit.rows[0].benchmark;
        const y2Bench = myBankHit.rows[1].benchmark;
        assertExact('my bank ratchet', y2Bench < y1Bench, true);
    }
    // Reserve should accumulate
    if (myBankHit.rows.length >= 3) {
        assertExact('my bank reserve Y3', myBankHit.rows[2].endingReserve > 0, true);
    }

    // Payer multi-year test
    state.selectedFunding = 'payer';
    const mPayer = computeModel();
    const myPayerHit = mPayer.multiYearHit;
    assertExact('my payer rows >= 1', myPayerHit.rows.length >= 1, true);
    assertExact('my payer rows <= 10', myPayerHit.rows.length <= 10, true);

    // Worst case failure test
    applyPreset('worst');
    state.selectedFunding = 'bank';
    const mWorstMy = computeModel();
    const myWorstHit = mWorstMy.multiYearHit;
    assertExact('my worst has failedYear', myWorstHit.failedYear !== null, true);

    // Quality crossover test (realistic)
    applyPreset('realistic');
    state.selectedFunding = 'bank';
    const mQual = computeModel();
    const myQualHit = mQual.multiYearHit;
    if (myQualHit.qualityCrossoverYear !== null) {
        assertExact('quality crossover > 1', myQualHit.qualityCrossoverYear > 1, true);
    } else {
        results.passed++; // No crossover within 20 years is valid
    }

    // Restore state
    state.currentStep = savedStep;
    state.selectedFunding = savedFunding;
    applyPreset('realistic');

    // ---- MC Iteration Deterministic Tests ----
    // Bank hit scenario
    const bankHitAssumptions = { ...PRESETS.best, enableRafAdjustment: false };
    const bankHitResult = computeMonteCarloIteration(bankHitAssumptions, { funding: 'bank' });
    assertExact('mc bank hit hitTarget', bankHitResult.hitTarget, true);
    assertExact('mc bank hit qualityPass', bankHitResult.qualityPass, true);
    assertExact('mc bank hit sharedSavings > 0', bankHitResult.sharedSavings > 0, true);

    // Quality gate fail test
    const qualFailAssumptions = { ...PRESETS.realistic, acoStartingQualityPct: 79, qualityGatePct: 80, enableRafAdjustment: false };
    const qualFailResult = computeMonteCarloIteration(qualFailAssumptions, { funding: 'bank' });
    assertExact('mc quality fail qualityPass', qualFailResult.qualityPass, false);
    assertExact('mc quality fail hitTarget', qualFailResult.hitTarget, false);
    assertExact('mc quality fail sharedSavings', qualFailResult.sharedSavings, 0);

    // Payer miss with clawback
    const payerMissAssumptions = { ...PRESETS.worst, savingsTargetPct: 0.1, enableRafAdjustment: false };
    const payerMissResult = computeMonteCarloIteration(payerMissAssumptions, { funding: 'payer' });
    assertExact('mc payer miss perPcpNet < 0', payerMissResult.perPcpNet < 0, true);

    // Hospital hit scenario
    const hospitalHitAssumptions = { ...PRESETS.best, enableRafAdjustment: false };
    const hospitalHitResult = computeMonteCarloIteration(hospitalHitAssumptions, { funding: 'hospital' });
    assertExact('mc hospital hit hitTarget', hospitalHitResult.hitTarget, true);
    assertExact('mc hospital hit sharedSavings > 0', hospitalHitResult.sharedSavings > 0, true);

    // Hospital miss scenario
    const hospitalMissAssumptions = { ...PRESETS.worst, savingsTargetPct: 0.1, enableRafAdjustment: false };
    const hospitalMissResult = computeMonteCarloIteration(hospitalMissAssumptions, { funding: 'hospital' });
    assertExact('mc hospital miss perPcpNet < 0', hospitalMissResult.perPcpNet < 0, true);

    // PE hit scenario — equity share should reduce per-PCP net below bank
    const peHitAssumptions = { ...PRESETS.best, enableRafAdjustment: false };
    const peHitResult = computeMonteCarloIteration(peHitAssumptions, { funding: 'pe' });
    assertExact('mc pe hit hitTarget', peHitResult.hitTarget, true);
    assertExact('mc pe hit sharedSavings > 0', peHitResult.sharedSavings > 0, true);
    assertExact('mc pe hit perPcpNet < bank', peHitResult.perPcpNet < bankHitResult.perPcpNet, true);

    // ---- RAF Saturation Curve Tests ----
    applyPreset('realistic');
    const rafY1 = computeRafAdjustment(assumptions, 1);
    const rafY3 = computeRafAdjustment(assumptions, 3);
    const rafY5 = computeRafAdjustment(assumptions, 5);
    const rafY10 = computeRafAdjustment(assumptions, 10);
    // ACO RAF should grow over time
    assertExact('raf Y3 > Y1', rafY3.acoRaf > rafY1.acoRaf, true);
    assertExact('raf Y5 > Y3', rafY5.acoRaf > rafY3.acoRaf, true);
    // Growth rate should decay after peak year (3 for realistic)
    // Year 5 growth increment should be less than Year 3 growth increment
    const growthY2toY3 = rafY3.acoRaf - computeRafAdjustment(assumptions, 2).acoRaf;
    const growthY4toY5 = rafY5.acoRaf - computeRafAdjustment(assumptions, 4).acoRaf;
    assertExact('raf saturation decay', growthY4toY5 < growthY2toY3, true);

    // ---- Quality Gate Ceiling Floor Test ----
    const qgCeil = computeQualityGate({ qualityGatePct: 80, qualityGateRatchetPct: 3,
        qualityGateCeiling: 70, acoStartingQualityPct: 85,
        acoQualityImprovementPct: 2, acoMaxQualityPct: 95 }, 1);
    assertExact('quality gate ceiling does not lower Y1', qgCeil.qualityGateRequired, 80);

    // Ceiling should still cap upward ratchet growth
    const qgCeil2 = computeQualityGate({ qualityGatePct: 60, qualityGateRatchetPct: 5,
        qualityGateCeiling: 70, acoStartingQualityPct: 85,
        acoQualityImprovementPct: 2, acoMaxQualityPct: 95 }, 5);
    assertExact('quality gate ceiling caps upward ratchet', qgCeil2.qualityGateRequired, 70);

    // ---- MC Bank Miss Includes Loan Liability Test ----
    const bankMissAssumptions = { ...PRESETS.worst, savingsTargetPct: 0.1, enableRafAdjustment: false };
    const bankMissResult = computeMonteCarloIteration(bankMissAssumptions, { funding: 'bank' });
    assertExact('mc bank miss hitTarget', bankMissResult.hitTarget, false);
    // Bank miss should include loan liability (worse than just practice burden)
    const bankMissModel = computeModel({ skipMultiYear: true });
    const bankMissBurden = bankMissModel.practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER;
    assertExact('mc bank miss includes loan', bankMissResult.perPcpNet < -bankMissBurden, true);

    // ---- Preset Key Consistency Test ----
    const worstKeys = Object.keys(PRESETS.worst).sort();
    const realisticKeys = Object.keys(PRESETS.realistic).sort();
    const bestKeys = Object.keys(PRESETS.best).sort();
    assertExact('preset key count worst=realistic', worstKeys.length, realisticKeys.length);
    assertExact('preset key count worst=best', worstKeys.length, bestKeys.length);
    worstKeys.forEach(key => {
        assertExact('preset key ' + key + ' in realistic', key in PRESETS.realistic, true);
        assertExact('preset key ' + key + ' in best', key in PRESETS.best, true);
    });

    // ---- pcpCount=0 Zero-Division Guard Test ----
    const savedPcpCount = assumptions.pcpCount;
    assumptions.pcpCount = 0;
    const mZeroPcp = computeModel({ skipMultiYear: true });
    // All per-PCP fields must be finite (not Infinity/NaN)
    assertExact('zeroPcp perPcpBonus finite', isFinite(mZeroPcp.perPcpBonus), true);
    assertExact('zeroPcp perPcpLiability finite', isFinite(mZeroPcp.perPcpLiability), true);
    assertExact('zeroPcp bankNetPerPcp finite', isFinite(mZeroPcp.bankNetPerPcp), true);
    assertExact('zeroPcp hospitalNetPerPcp finite', isFinite(mZeroPcp.hospitalNetPerPcp), true);
    assertExact('zeroPcp peNetPerPcp finite', isFinite(mZeroPcp.peNetPerPcp), true);
    assertExact('zeroPcp payerNetPerPcp finite', isFinite(mZeroPcp.payerNetPerPcp), true);
    assertExact('zeroPcp bankNetOutcome finite', isFinite(mZeroPcp.bankNetOutcome), true);
    assertExact('zeroPcp hospitalNetOutcome finite', isFinite(mZeroPcp.hospitalNetOutcome), true);
    assertExact('zeroPcp peNetOutcome finite', isFinite(mZeroPcp.peNetOutcome), true);
    assertExact('zeroPcp payerNetOutcome finite', isFinite(mZeroPcp.payerNetOutcome), true);
    assumptions.pcpCount = savedPcpCount;

    // ---- computeYearFinancials Unit Tests ----
    // Test MSR threshold gate
    const yfHit = computeYearFinancials({
        year: 1, funding: 'bank',
        rafAdjustedBenchmark: 1000000, qualityPass: true,
        savingsPct: 5, isCapped: false, minAchievableCost: 900000,
        hospitalPremium: 0, infraCost: 100000,
        payerSharePct: 50, acoReservePct: 0.10, multiYearMsrPct: 1.5,
        loanPaymentsRemaining: 36, monthlyLoanPayment: 5000,
        hospitalGainSharePct: 50, peEquitySharePct: 50,
        currentPmpm: 0, attributedPatients: 80000, payerClawbackPct: 75,
        currentReserve: 0, basePracticeBurdenTotal: 500000,
        applyInflationToBurden: false, inflationPct: 3,
        adjustNetDistributableForShortfall: false, isScenarioMiss: false
    });
    assertExact('yf hit meetsThreshold', yfHit.meetsThreshold, true);
    assertExact('yf hit status', yfHit.status, 'Hit');
    assertExact('yf hit acoShare > 0', yfHit.acoShare > 0, true);

    // Test quality gate miss
    const yfQualMiss = computeYearFinancials({
        year: 1, funding: 'bank',
        rafAdjustedBenchmark: 1000000, qualityPass: false,
        savingsPct: 5, isCapped: false, minAchievableCost: 900000,
        hospitalPremium: 0, infraCost: 100000,
        payerSharePct: 50, acoReservePct: 0.10, multiYearMsrPct: 1.5,
        loanPaymentsRemaining: 36, monthlyLoanPayment: 5000,
        hospitalGainSharePct: 50, peEquitySharePct: 50,
        currentPmpm: 0, attributedPatients: 80000, payerClawbackPct: 75,
        currentReserve: 0, basePracticeBurdenTotal: 500000,
        applyInflationToBurden: false, inflationPct: 3,
        adjustNetDistributableForShortfall: false, isScenarioMiss: false
    });
    assertExact('yf qualMiss acoShare', yfQualMiss.acoShare, 0);
    assertExact('yf qualMiss status', yfQualMiss.status, 'Quality Miss');

    // Test partial (capped)
    const yfPartial = computeYearFinancials({
        year: 1, funding: 'bank',
        rafAdjustedBenchmark: 1000000, qualityPass: true,
        savingsPct: 3, isCapped: true, minAchievableCost: 970000,
        hospitalPremium: 0, infraCost: 100000,
        payerSharePct: 50, acoReservePct: 0.10, multiYearMsrPct: 1.5,
        loanPaymentsRemaining: 36, monthlyLoanPayment: 5000,
        hospitalGainSharePct: 50, peEquitySharePct: 50,
        currentPmpm: 0, attributedPatients: 80000, payerClawbackPct: 75,
        currentReserve: 0, basePracticeBurdenTotal: 500000,
        applyInflationToBurden: false, inflationPct: 3,
        adjustNetDistributableForShortfall: false, isScenarioMiss: false
    });
    assertExact('yf partial status', yfPartial.status, 'Partial');

    // Test payer clawback on miss
    const yfPayerMiss = computeYearFinancials({
        year: 1, funding: 'payer',
        rafAdjustedBenchmark: 1000000, qualityPass: true,
        savingsPct: 0.5, isCapped: false, minAchievableCost: 900000,
        hospitalPremium: 0, infraCost: 100000,
        payerSharePct: 50, acoReservePct: 0.10, multiYearMsrPct: 1.5,
        loanPaymentsRemaining: 0, monthlyLoanPayment: 0,
        hospitalGainSharePct: 50, peEquitySharePct: 50,
        currentPmpm: 10, attributedPatients: 80000, payerClawbackPct: 75,
        currentReserve: 0, basePracticeBurdenTotal: 500000,
        applyInflationToBurden: false, inflationPct: 3,
        adjustNetDistributableForShortfall: false, isScenarioMiss: false
    });
    assertExact('yf payerMiss acoShare', yfPayerMiss.acoShare, 0);
    assertExact('yf payerMiss clawback > 0', yfPayerMiss.payerClawback > 0, true);

    // Test failure detection (insufficient reserves)
    const yfFail = computeYearFinancials({
        year: 3, funding: 'bank',
        rafAdjustedBenchmark: 1000000, qualityPass: true,
        savingsPct: 0.5, isCapped: true, minAchievableCost: 995000,
        hospitalPremium: 0, infraCost: 500000,
        payerSharePct: 50, acoReservePct: 0.10, multiYearMsrPct: 1.5,
        loanPaymentsRemaining: 24, monthlyLoanPayment: 20000,
        hospitalGainSharePct: 50, peEquitySharePct: 50,
        currentPmpm: 0, attributedPatients: 80000, payerClawbackPct: 75,
        currentReserve: 0, basePracticeBurdenTotal: 500000,
        applyInflationToBurden: false, inflationPct: 3,
        adjustNetDistributableForShortfall: false, isScenarioMiss: false
    });
    assertExact('yf fail failed', yfFail.failed, true);

    // ---- Payer Underwater Test ----
    const savedAssumptions2 = { ...assumptions };
    applyPreset('realistic');
    assumptions.payerPmpm = 25;  // High PMPM to trigger underwater
    const mUnderwater = computeModel({ skipMultiYear: true });
    assertExact('payer underwater with high PMPM', mUnderwater.payerIsUnderwater, true);
    assertExact('payer underwater amount > 0', mUnderwater.payerUnderwaterAmount > 0, true);
    assertExact('payer underwater net reflects debt',
        mUnderwater.payerNetY1 < 0, true);
    Object.assign(assumptions, savedAssumptions2);

    // ---- Boundary Slider Value Tests ----
    // careManagerRatio at minimum (should not cause division by zero)
    const savedCmr = assumptions.careManagerRatio;
    assumptions.careManagerRatio = 0;
    const mCmr0 = computeModel({ skipMultiYear: true });
    assertExact('careManagerRatio=0 finite', isFinite(mCmr0.acoInfrastructureTotal), true);
    assumptions.careManagerRatio = savedCmr;

    // savingsTargetPct at extreme values
    const savedStp = assumptions.savingsTargetPct;
    assumptions.savingsTargetPct = 0.5;
    const mMinStp = computeModel({ skipMultiYear: true });
    assertExact('savingsTargetPct=0.5 finite', isFinite(mMinStp.targetSavings), true);
    assumptions.savingsTargetPct = 10;
    const mMaxStp = computeModel({ skipMultiYear: true });
    assertExact('savingsTargetPct=10 finite', isFinite(mMaxStp.targetSavings), true);
    assumptions.savingsTargetPct = savedStp;

    // hospitalCostPremium eating all savings
    const savedHcp = assumptions.hospitalCostPremium;
    assumptions.hospitalCostPremium = 40;
    state.selectedFunding = 'hospital';
    const mHighPrem = computeModel({ skipMultiYear: true });
    assertExact('high hospital premium finite', isFinite(mHighPrem.hospitalNetY1), true);
    assumptions.hospitalCostPremium = savedHcp;
    state.selectedFunding = savedFunding;

    // ---- MC Tab-Switch Iteration Clamping Test ----
    const savedIterations = monteCarloState.iterations;
    const iterSlider = document.getElementById('mcIterations');
    const iterDisplay = document.getElementById('mcIterationsDisplay');
    if (iterSlider && iterDisplay) {
        // Set state to 5000 (Year 1 range)
        monteCarloState.iterations = 5000;
        iterSlider.max = '10000';
        iterSlider.value = '5000';
        iterDisplay.textContent = '5,000';

        // Switch to multi-year — should clamp to 500
        showMonteCarloTab('multiyear');
        assertExact('mc tab switch: multiyear clamps iterations', monteCarloState.iterations <= 2000, true);
        assertExact('mc tab switch: multiyear slider max', iterSlider.max, '2000');
        assertExact('mc tab switch: multiyear display matches state',
            iterDisplay.textContent, String(monteCarloState.iterations));

        // Switch back to year1 — should re-sync from state
        showMonteCarloTab('year1');
        assertExact('mc tab switch: year1 slider max', iterSlider.max, '10000');
        assertExact('mc tab switch: year1 display matches state',
            iterDisplay.textContent, monteCarloState.iterations.toLocaleString());
        assertExact('mc tab switch: year1 slider matches state',
            parseInt(iterSlider.value), monteCarloState.iterations);

        // Restore
        monteCarloState.iterations = savedIterations;
        iterSlider.value = savedIterations;
        iterDisplay.textContent = savedIterations.toLocaleString();
    }

    // formatSignedCurrency zero should have no sign prefix
    assertExact('formatSignedCurrency zero', formatSignedCurrency(0), '$0');

    // ==============================================================
    // Hand-Calculated Unit Tests
    // Expected values computed independently from the code (paper math)
    // ==============================================================

    // ---- Hand-Calculated Unit Tests: computeHelpers ----

    // inflationMultiplier(inflationPct, year) = (1 + inflationPct/100)^(year-1)
    // Year 1, 3%: (1.03)^0 = 1.0
    assertClose('inflMult Y1 3%', inflationMultiplier(3, 1), 1.0, 0.0001);
    // Year 3, 3%: (1.03)^2 = 1.0609
    assertClose('inflMult Y3 3%', inflationMultiplier(3, 3), 1.0609, 0.0001);
    // Year 1, 0%: (1.0)^0 = 1.0
    assertClose('inflMult Y1 0%', inflationMultiplier(0, 1), 1.0, 0.0001);
    // Year 5, 5%: (1.05)^4 = 1.21550625
    assertClose('inflMult Y5 5%', inflationMultiplier(5, 5), 1.21550625, 0.0001);

    // computeQualityGate: gate=70, ratchet=3, ceiling=85, starting=75, improve=2, max=90
    const qgParams = { qualityGatePct: 70, qualityGateRatchetPct: 3, qualityGateCeiling: 85,
        acoStartingQualityPct: 75, acoQualityImprovementPct: 2, acoMaxQualityPct: 90 };
    // Year 1: gate = max(70, min(85, 70+0)) = 70; achieved = min(100, 90, 75+0) = 75
    const qgY1 = computeQualityGate(qgParams, 1);
    assertExact('qg Y1 required', qgY1.qualityGateRequired, 70);
    assertExact('qg Y1 achieved', qgY1.achievedQuality, 75);
    assertExact('qg Y1 pass', qgY1.qualityPass, true);
    assertExact('qg Y1 margin', qgY1.qualityMargin, 5);
    // Year 5: gate = max(70, min(85, 70+12)) = 82; achieved = min(100, 90, 75+8) = 83
    const qgY5 = computeQualityGate(qgParams, 5);
    assertExact('qg Y5 required', qgY5.qualityGateRequired, 82);
    assertExact('qg Y5 achieved', qgY5.achievedQuality, 83);
    assertExact('qg Y5 pass', qgY5.qualityPass, true);
    assertExact('qg Y5 margin', qgY5.qualityMargin, 1);
    // Year 7: gate = max(70, min(85, 70+18)) = 85 (ceiling); achieved = min(100, 90, 75+12) = 87
    const qgY7 = computeQualityGate(qgParams, 7);
    assertExact('qg Y7 required', qgY7.qualityGateRequired, 85);
    assertExact('qg Y7 achieved', qgY7.achievedQuality, 87);
    assertExact('qg Y7 pass', qgY7.qualityPass, true);
    assertExact('qg Y7 margin', qgY7.qualityMargin, 2);
    // Year 1 fail: startingQuality=69, gate=70 → pass=false, margin=-1
    const qgFail = computeQualityGate({ ...qgParams, acoStartingQualityPct: 69 }, 1);
    assertExact('qg Y1 fail pass', qgFail.qualityPass, false);
    assertExact('qg Y1 fail margin', qgFail.qualityMargin, -1);

    // computeRafGrowthRates: peakYear=3, floor=1, cap=10, regionalSat=true
    const rafGrA = { rafOptimizationPeakYear: 3, rafOptimizationFloor: 1,
        codingIntensityCap: 10, regionalRafSaturationEnabled: true };
    // Year 2 (before peak): acoRate = 5 (full); regional = 3 (no sat, y<=peak)
    const rg2 = computeRafGrowthRates(rafGrA, 2, 5, 3);
    assertClose('rafGr Y2 aco', rg2.acoGrowthRate, 5, 0.001);
    assertClose('rafGr Y2 reg', rg2.regionalGrowthRate, 3, 0.001);
    // Year 4 (1yr after peak): decay=0.5^1=0.5
    // acoRate = 1 + (5-1)*0.5 = 3; regional = 1 + (3-1)*0.5 = 2
    const rg4 = computeRafGrowthRates(rafGrA, 4, 5, 3);
    assertClose('rafGr Y4 aco', rg4.acoGrowthRate, 3, 0.001);
    assertClose('rafGr Y4 reg', rg4.regionalGrowthRate, 2, 0.001);
    // Year 5 (2yr after peak): decay=0.5^2=0.25
    // acoRate = 1 + (5-1)*0.25 = 2; regional = 1 + (3-1)*0.25 = 1.5
    const rg5 = computeRafGrowthRates(rafGrA, 5, 5, 3);
    assertClose('rafGr Y5 aco', rg5.acoGrowthRate, 2, 0.001);
    assertClose('rafGr Y5 reg', rg5.regionalGrowthRate, 1.5, 0.001);

    // computeRafAdjustment: disabled → identity
    const rafOff = computeRafAdjustment({ enableRafAdjustment: false }, 5);
    assertExact('rafAdj off acoRaf', rafOff.acoRaf, 1.0);
    assertExact('rafAdj off ratio', rafOff.rafRatio, 1.0);
    // Year 1: no loop runs → base values unchanged
    const rafTestA = { enableRafAdjustment: true, acoBaseRaf: 1.0, regionalBaseRaf: 1.0,
        acoRafGrowthPct: 5, regionalRafGrowthPct: 3,
        rafOptimizationPeakYear: 3, rafOptimizationFloor: 1,
        codingIntensityCap: 10, regionalRafSaturationEnabled: false };
    const rafY1t = computeRafAdjustment(rafTestA, 1);
    assertExact('rafAdj Y1 aco', rafY1t.acoRaf, 1.0);
    assertExact('rafAdj Y1 reg', rafY1t.regionalRaf, 1.0);
    assertExact('rafAdj Y1 ratio', rafY1t.rafRatio, 1.0);
    // Year 2: y=2 <= peak=3, full growth (uncapped at cap=10)
    // acoRaf = 1.0 * (1 + 5/100) = 1.05; regionalRaf = 1.0 * (1 + 3/100) = 1.03
    // ratio = 1.05/1.03 ≈ 1.019417
    const rafY2t = computeRafAdjustment(rafTestA, 2);
    assertClose('rafAdj Y2 aco', rafY2t.acoRaf, 1.05, 0.0001);
    assertClose('rafAdj Y2 reg', rafY2t.regionalRaf, 1.03, 0.0001);
    assertClose('rafAdj Y2 ratio', rafY2t.rafRatio, 1.05 / 1.03, 0.0001);

    // computeMissLossPerPcp
    // bank: -(burden + capitalizedPrincipal/pcpCount) = -(10000 + 500000/50) = -20000
    assertExact('missLoss bank', computeMissLossPerPcp('bank', 10000,
        { capitalizedPrincipal: 500000, pcpCount: 50 }), -20000);
    // payer: -(burden + clawbackPerPcp) = -(10000 + 5000) = -15000
    assertExact('missLoss payer', computeMissLossPerPcp('payer', 10000,
        { payerClawbackPerPcp: 5000 }), -15000);
    // hospital: -burden = -10000
    assertExact('missLoss hospital', computeMissLossPerPcp('hospital', 10000, {}), -10000);
    // pe: -burden = -10000
    assertExact('missLoss pe', computeMissLossPerPcp('pe', 10000, {}), -10000);

    // ---- Hand-Calculated Unit Tests: model.js ----

    // computeCore: pcpCount=10, patients=100, attrib=80%, tcoc=$10K, target=5%, share=50%, msr=2%
    const coreA = { pcpCount: 10, patientsPerPcp: 100, attributionPct: 80, tcocPerPatient: 10000,
        savingsTargetPct: 5, payerSharePct: 50, msrPct: 2, enableRafAdjustment: false };
    const coreR = computeCore(coreA);
    // totalPanelPatients = 10 × 100 = 1000
    assertExact('core totalPanel', coreR.totalPanelPatients, 1000);
    // attributedPatients = round(1000 × 0.80) = 800
    assertExact('core attributed', coreR.attributedPatients, 800);
    // totalTcoc = 800 × 10000 = 8,000,000
    assertExact('core totalTcoc', coreR.totalTcoc, 8000000);
    // adjustedBenchmark = 8M × 1.0 (RAF disabled) = 8,000,000
    assertExact('core adjBenchmark', coreR.adjustedBenchmark, 8000000);
    // targetSavings = 8M × 0.05 = 400,000
    assertExact('core targetSavings', coreR.targetSavings, 400000);
    // acoShare = 400K × 0.50 = 200,000
    assertExact('core acoShare', coreR.acoShare, 200000);
    // perPcpBonus = 200K / 10 = 20,000
    assertExact('core perPcpBonus', coreR.perPcpBonus, 20000);
    // msrThreshold = 8M × 0.02 = 160,000
    assertExact('core msrThreshold', coreR.msrThreshold, 160000);

    // computeInfrastructure: totalPatients=800, HIGH_RISK_PCT=0.15
    const infraA = { dataAnalyticsCost: 100000, careManagerRatio: 1000, careManagerSalary: 80000,
        adminCost: 200000, itCost: 50000, legalCost: 25000, qualityCost: 25000 };
    const infraR = computeInfrastructure(infraA, 800);
    // highRiskPatients = 800 × 0.15 = 120
    assertExact('infra highRisk', infraR.highRiskPatients, 120);
    // careManagers = ceil(120/1000) = 1; cost = 1 × 80000 = 80000
    assertExact('infra careManagers', infraR.careManagersNeeded, 1);
    assertExact('infra cmCost', infraR.careManagementCost, 80000);
    // total = 100K + 80K + 200K + 50K + 25K + 25K = 480,000
    assertExact('infra total', infraR.totalInfrastructure, 480000);

    // computePracticeBurden: lostHrs=2, rev=100, visits=3, staffFte=0.5, salary=40K, pcps=10
    // WEEKS_PER_YEAR=50
    const burdA = { lostHoursPerWeek: 2, revenuePerVisit: 100, visitsPerHour: 3,
        practiceStaffFtePerPcp: 0.5, practiceStaffSalary: 40000, pcpCount: 10 };
    const burdR = computePracticeBurden(burdA);
    // lostFfsPerPcp = 2 × 50 × 3 × 100 = 30,000
    assertExact('burden lostFfsPerPcp', burdR.lostFfsPerPcp, 30000);
    // practiceStaffPerPcp = 0.5 × 40000 = 20,000
    assertExact('burden staffPerPcp', burdR.practiceStaffPerPcp, 20000);
    // practiceBurdenPerPcp = 30K + 20K = 50,000
    assertExact('burden perPcp', burdR.practiceBurdenPerPcp, 50000);
    // lostClinicHours = 10 × 2 × 50 = 1,000
    assertExact('burden clinicHours', burdR.lostClinicHours, 1000);
    // lostFfsRevenue = 1000 × 3 × 100 = 300,000
    assertExact('burden lostFfs', burdR.lostFfsRevenue, 300000);
    // practiceStaffCost = 10 × 0.5 × 40000 = 200,000
    assertExact('burden staffCost', burdR.practiceStaffCost, 200000);
    // totalPracticeBurden = 300K + 200K = 500,000
    assertExact('burden total', burdR.totalPracticeBurden, 500000);

    // amortize: principal=10000, rate=1%/mo, 12 months
    // factor = (1.01)^12 ≈ 1.12682503; payment = 10000 × 0.01 × 1.12682503 / 0.12682503 ≈ 888.49
    assertClose('amortize 1% 12mo', amortize(10000, 0.01, 12), 888.49, 0.01);

    // computeBankLoan: 0% interest (exact arithmetic)
    // fundingNeeded=120K, origFee=0%, rate=0%, term=12mo
    const bankA0 = { bankOrigFee: 0, bankInterestRate: 0, bankTermMonths: 12 };
    const bankR0 = computeBankLoan(bankA0, 120000, 500000, 100000, 50000);
    assertExact('bank0% origFee', bankR0.bankOrigFeeAmount, 0);
    assertExact('bank0% principal', bankR0.bankPrincipal, 120000);
    // capitalizedPrincipal = 120K × (1+0)^18 = 120,000
    assertExact('bank0% capitalized', bankR0.capitalizedPrincipal, 120000);
    // deferredMonthlyPayment = 120K / 12 = 10,000
    assertExact('bank0% deferPmt', bankR0.deferredMonthlyPayment, 10000);
    // loanPaymentsFromY1Amount = 10K × min(12,12) = 120,000
    assertExact('bank0% y1Pmts', bankR0.loanPaymentsFromY1Amount, 120000);
    // bankNetDistrib = max(0, 500K - 100K - 50K - 120K) = 230,000
    assertExact('bank0% netDistrib', bankR0.bankNetDistributableShare, 230000);

    // computeBankLoan: 2% orig fee, 12% annual rate (1%/mo)
    // fundingNeeded=100K → origFee=2K, principal=102K
    // capitalizedPrincipal = 102K × (1.01)^18
    const bankA1 = { bankOrigFee: 2, bankInterestRate: 12, bankTermMonths: 12 };
    const bankR1 = computeBankLoan(bankA1, 100000, 500000, 100000, 50000);
    assertExact('bank12% origFee', bankR1.bankOrigFeeAmount, 2000);
    assertExact('bank12% principal', bankR1.bankPrincipal, 102000);
    assertClose('bank12% capitalized', bankR1.capitalizedPrincipal,
        102000 * Math.pow(1.01, 18), 1);

    // computeHospital: meets threshold
    // totalTcoc=10M, targetSavings=500K, msr=100K, opsRetention=200K
    const hospA = { hospitalReferralPct: 30, hospitalReferralLock: 50, hospitalCostPremium: 10,
        hospitalGainShare: 40, payerSharePct: 50, acoReservePct: 0.10, savingsTargetPct: 5 };
    const hospR1 = computeHospital(hospA, 10000000, 500000, 100000, 200000);
    // referralVol = 10M × 0.30 = 3M; locked = 3M × 0.50 = 1.5M; premium = 1.5M × 0.10 = 150K
    assertExact('hosp1 premium', hospR1.hospitalPremiumCost, 150000);
    // realizedSavings = 500K − 150K = 350K; 350K >= 100K → true
    assertExact('hosp1 realized', hospR1.hospitalRealizedSavings, 350000);
    assertExact('hosp1 meets', hospR1.hospitalMeetsThreshold, true);
    // acoShare = 350K × 0.50 = 175K
    assertExact('hosp1 acoShare', hospR1.hospitalAcoShare, 175000);
    // netDistrib = max(0, 175K − 200K − 17.5K) = 0
    assertExact('hosp1 netDistrib', hospR1.hospitalNetDistributable, 0);
    assertExact('hosp1 gainShare', hospR1.hospitalGainShareAmount, 0);

    // computeHospital: higher savings → positive distribution
    // targetSavings=1M, same premium=150K
    const hospR2 = computeHospital(hospA, 10000000, 1000000, 100000, 200000);
    // realizedSavings = 1M − 150K = 850K; acoShare = 850K × 0.50 = 425K
    assertExact('hosp2 acoShare', hospR2.hospitalAcoShare, 425000);
    // netDistrib = max(0, 425K − 200K − 42.5K) = 182,500
    assertExact('hosp2 netDistrib', hospR2.hospitalNetDistributable, 182500);
    // gainShare = 182.5K × 0.40 = 73,000
    assertExact('hosp2 gainShare', hospR2.hospitalGainShareAmount, 73000);

    // computeHospital: fails MSR threshold
    // targetSavings=200K, premium=150K → realized=50K < msr=100K
    const hospR3 = computeHospital(hospA, 10000000, 200000, 100000, 200000);
    assertExact('hosp3 meets', hospR3.hospitalMeetsThreshold, false);
    assertExact('hosp3 acoShare', hospR3.hospitalAcoShare, 0);

    // computePE: 40% equity on 100K distributable
    // peShare = 100K × 0.40 = 40K; netToPcps = 100K − 40K = 60K
    const peR1 = computePE({ peEquityShare: 40 }, 100000);
    assertExact('pe1 share', peR1.peShare, 40000);
    assertExact('pe1 netToPcps', peR1.peNetToPcps, 60000);
    // 100% equity → all to PE
    const peR2 = computePE({ peEquityShare: 100 }, 100000);
    assertExact('pe2 share', peR2.peShare, 100000);
    assertExact('pe2 netToPcps', peR2.peNetToPcps, 0);

    // computePayerAdvance: PMPM=10, patients=800, acoShare=200K, ops=100K, reserve=20K
    // DEFERRAL_MONTHS=18
    const payA = { payerPmpm: 10, payerClawbackPct: 75, pcpCount: 10 };
    const payR1 = computePayerAdvance(payA, 800, 200000, 100000, 20000);
    // monthlyPmpm = 10 × 800 = 8,000
    assertExact('payer monthlyPmpm', payR1.payerMonthlyPmpm, 8000);
    // totalAdvance18mo = 8K × 18 = 144,000
    assertExact('payer advance18mo', payR1.payerTotalAdvance18mo, 144000);
    // annualAdvance = 8K × 12 = 96,000
    assertExact('payer annualAdv', payR1.payerAnnualAdvance, 96000);
    // deduction = min(96K, 200K) = 96,000
    assertExact('payer deduction', payR1.payerAdvanceDeduction, 96000);
    // netDistrib = max(0, 200K − 100K − 20K − 96K) = max(0, −16K) = 0
    assertExact('payer netDistrib', payR1.payerNetDistributable, 0);
    // clawback = 144K × 0.75 = 108,000; perPcp = 108K / 10 = 10,800
    assertExact('payer clawback', payR1.payerClawbackAmount, 108000);
    assertExact('payer clawbackPerPcp', payR1.payerClawbackPerPcp, 10800);
    // isUnderwater: 200K < 96K → false
    assertExact('payer notUnderwater', payR1.payerIsUnderwater, false);
    assertExact('payer trueNet', payR1.payerTrueNet, 0);

    // computePayerAdvance: underwater case (acoShare=50K < annualAdvance=96K)
    const payR2 = computePayerAdvance(payA, 800, 50000, 100000, 20000);
    assertExact('payer2 underwater', payR2.payerIsUnderwater, true);
    // underwaterAmount = 96K − 50K = 46,000
    assertExact('payer2 underwaterAmt', payR2.payerUnderwaterAmount, 46000);
    // deduction = min(96K, 50K) = 50,000
    assertExact('payer2 deduction', payR2.payerAdvanceDeduction, 50000);
    // netDistrib = max(0, 50K − 100K − 20K − 50K) = 0
    assertExact('payer2 netDistrib', payR2.payerNetDistributable, 0);
    // trueNet = 0 − 46K = −46,000
    assertExact('payer2 trueNet', payR2.payerTrueNet, -46000);

    // ---- Hand-Calculated Unit Tests: multiYear.js ----

    // computeHospitalPremiumForYear
    const hpA = { hospitalReferralPct: 30, hospitalReferralLock: 50,
        hospitalCostPremium: 10, hospitalPremiumGrowthPct: 5 };
    // Non-hospital funder → 0
    assertExact('hospPrem bank=0', computeHospitalPremiumForYear(10000000, 1, hpA, 'bank'), 0);
    // Year 1: lockedVol = 10M × 0.30 × 0.50 = 1.5M; growth = (1.05)^0 = 1; return 1.5M × 0.10 = 150K
    assertExact('hospPrem Y1', computeHospitalPremiumForYear(10000000, 1, hpA, 'hospital'), 150000);
    // Year 3: growth = (1.05)^2 = 1.1025; prem% = 10 × 1.1025 = 11.025; return 1.5M × 0.11025 = 165,375
    assertClose('hospPrem Y3', computeHospitalPremiumForYear(10000000, 3, hpA, 'hospital'), 165375, 1);

    // computeYearFinancials: hit scenario (bank, exact arithmetic)
    const yfCalcHit = computeYearFinancials({
        year: 1, funding: 'bank',
        rafAdjustedBenchmark: 10000000, qualityPass: true,
        savingsPct: 10, isCapped: false, minAchievableCost: 9000000,
        hospitalPremium: 0, infraCost: 200000,
        payerSharePct: 50, acoReservePct: 0.10, multiYearMsrPct: 2,
        loanPaymentsRemaining: 12, monthlyLoanPayment: 10000,
        hospitalGainSharePct: 40, peEquitySharePct: 50,
        currentPmpm: 0, attributedPatients: 1000, payerClawbackPct: 75,
        currentReserve: 0, basePracticeBurdenTotal: 100000,
        applyInflationToBurden: false, inflationPct: 3,
        adjustNetDistributableForShortfall: false, isScenarioMiss: false
    });
    // targetSavings = 10M × 0.10 = 1M; realized = 1M − 0 = 1M
    assertExact('yfHit targetSavings', yfCalcHit.targetSavings, 1000000);
    // msrThreshold = 10M × 0.02 = 200K; 1M >= 200K → true
    assertExact('yfHit msr', yfCalcHit.msrThreshold, 200000);
    assertExact('yfHit meets', yfCalcHit.meetsThreshold, true);
    // acoShare = 1M × 0.50 = 500K
    assertExact('yfHit acoShare', yfCalcHit.acoShare, 500000);
    // opsRetention = min(500K, 200K) = 200K
    assertExact('yfHit opsRet', yfCalcHit.opsRetention, 200000);
    // reserveContrib = 500K × 0.10 = 50K
    assertExact('yfHit reserveContrib', yfCalcHit.reserveContribution, 50000);
    // loanPayment = 10K × 12 = 120K
    assertExact('yfHit loanPmt', yfCalcHit.loanPayment, 120000);
    // netDistrib = max(0, 500K − 200K − 50K) = 250K
    assertExact('yfHit netDistrib', yfCalcHit.netDistributable, 250000);
    // netToPcps = max(0, 500K − 200K − 50K − 120K) = 130K
    assertExact('yfHit netToPcps', yfCalcHit.netToPcps, 130000);
    assertExact('yfHit status', yfCalcHit.status, 'Hit');
    // shortfall = max(0, 320K − 500K) = 0; endReserve = 0 + (50K − 0) = 50K
    assertExact('yfHit endReserve', yfCalcHit.endingReserve, 50000);
    // failed: available=500K >= required=320K → false
    assertExact('yfHit notFailed', yfCalcHit.failed, false);
    // Practice burden: Y1 = 18mo, no inflation: 100K × 1 × 18/12 = 150K
    assertExact('yfHit burden', yfCalcHit.practiceBurden, 150000);

    // computeYearFinancials: quality miss (same inputs, qualityPass=false)
    const yfCalcQM = computeYearFinancials({
        year: 1, funding: 'bank',
        rafAdjustedBenchmark: 10000000, qualityPass: false,
        savingsPct: 10, isCapped: false, minAchievableCost: 9000000,
        hospitalPremium: 0, infraCost: 200000,
        payerSharePct: 50, acoReservePct: 0.10, multiYearMsrPct: 2,
        loanPaymentsRemaining: 12, monthlyLoanPayment: 10000,
        hospitalGainSharePct: 40, peEquitySharePct: 50,
        currentPmpm: 0, attributedPatients: 1000, payerClawbackPct: 75,
        currentReserve: 0, basePracticeBurdenTotal: 100000,
        applyInflationToBurden: false, inflationPct: 3,
        adjustNetDistributableForShortfall: false, isScenarioMiss: false
    });
    // TCOC threshold met but quality fails → acoShare = 0
    assertExact('yfQM acoShare', yfCalcQM.acoShare, 0);
    assertExact('yfQM status', yfCalcQM.status, 'Quality Miss');

    // computeYearFinancials: both miss (savingsPct=1 → target=100K < msr=200K, quality=false)
    const yfCalcBM = computeYearFinancials({
        year: 1, funding: 'bank',
        rafAdjustedBenchmark: 10000000, qualityPass: false,
        savingsPct: 1, isCapped: false, minAchievableCost: 9000000,
        hospitalPremium: 0, infraCost: 200000,
        payerSharePct: 50, acoReservePct: 0.10, multiYearMsrPct: 2,
        loanPaymentsRemaining: 12, monthlyLoanPayment: 10000,
        hospitalGainSharePct: 40, peEquitySharePct: 50,
        currentPmpm: 0, attributedPatients: 1000, payerClawbackPct: 75,
        currentReserve: 0, basePracticeBurdenTotal: 100000,
        applyInflationToBurden: false, inflationPct: 3,
        adjustNetDistributableForShortfall: false, isScenarioMiss: false
    });
    assertExact('yfBM status', yfCalcBM.status, 'Both Miss');

    // ---- Hand-Calculated Unit Tests: mcSampling.js ----

    // Additional precision tests for statistics
    assertExact('median 5-elem', computeMedian([1, 3, 5, 7, 9]), 5);
    assertExact('median 4-elem', computeMedian([10, 20, 30, 40]), 25);
    // percentile: arr[floor(10 × 0.25)] = arr[2] = 20
    assertExact('percentile p25', computePercentile([0, 10, 20, 30, 40, 50, 60, 70, 80, 90], 0.25), 20);
    // stddev: sqrt(((−10)^2 + 0^2 + (10)^2) / (3−1)) = sqrt(200/2) = 10
    assertClose('stddev [10,20,30]', computeStdDev([10, 20, 30], 20), 10, 0.001);
    // ranks with ties: [10,30,20,30] → sorted: 10→rank1, 20→rank2, 30→rank3.5, 30→rank3.5
    const ranksTied2 = computeRanks([10, 30, 20, 30]);
    assertExact('ranks4 [0]', ranksTied2[0], 1);
    assertExact('ranks4 [1]', ranksTied2[1], 3.5);
    assertExact('ranks4 [2]', ranksTied2[2], 2);
    assertExact('ranks4 [3]', ranksTied2[3], 3.5);
    // Spearman: perfect negative correlation with 5 elements = −1.0
    assertClose('spearman 5-neg', computeSpearmanCorrelation([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]), -1.0, 0.001);
    // Spearman: constant x → 0 (no variance in ranks)
    assertExact('spearman const', computeSpearmanCorrelation([1, 1, 1], [2, 3, 4]), 0);
    // sampleTriangular degenerate: max <= min → returns min
    assertExact('triangular degen', sampleTriangular(5, 5, 5), 5);
    // sampleUniform degenerate: max = min → min + random*0 = min
    assertExact('uniform degen', sampleUniform(7, 7), 7);
    // getVariationBounds: pcpCount (range 1-200, step 1), base=100, variation=25%
    // sliderRange = 199; amount = 199 × 0.25 = 49.75
    // min = round(max(1, 100-49.75)) = round(50.25) = 50
    // max = round(min(200, 100+49.75)) = round(149.75) = 150
    const vb1 = getVariationBounds('pcpCount', 100, 25);
    assertExact('varBounds pcp min', vb1.min, 50);
    assertExact('varBounds pcp max', vb1.max, 150);
    assertExact('varBounds pcp mode', vb1.mode, 100);
    // Unknown variable → degenerate bounds (no slider range)
    const vbUnk = getVariationBounds('unknownVar', 42, 25);
    assertExact('varBounds unk min', vbUnk.min, 42);
    assertExact('varBounds unk max', vbUnk.max, 42);

    // ---- Hand-Calculated Unit Tests: formatters.js ----

    // capitalizeFirst
    assertExact('capitalize hello', capitalizeFirst('hello'), 'Hello');
    assertExact('capitalize empty', capitalizeFirst(''), '');
    assertExact('capitalize A', capitalizeFirst('A'), 'A');
    // formatCurrency (abs value, abbreviated)
    assertExact('fmtCur 1.5M', formatCurrency(1500000), '1.5M');
    assertExact('fmtCur 500K', formatCurrency(500000), '500K');
    assertExact('fmtCur 999', formatCurrency(999), '999');
    assertExact('fmtCur 0', formatCurrency(0), '0');
    assertExact('fmtCur -2M abs', formatCurrency(-2000000), '2.0M');
    assertExact('fmtCur 2.5B', formatCurrency(2500000000), '2.5B');
    // formatSignedCurrency
    assertExact('fmtSgn +1.5M', formatSignedCurrency(1500000), '+$1.5M');
    assertExact('fmtSgn -500K', formatSignedCurrency(-500000), '\u2212$500K');
    // formatCurrencyNegatable
    assertExact('fmtNeg $1.5M', formatCurrencyNegatable(1500000), '$1.5M');
    assertExact('fmtNeg -$1.5M', formatCurrencyNegatable(-1500000), '\u2212$1.5M');
    assertExact('fmtNeg $500', formatCurrencyNegatable(500), '$500');

    // Restore state
    applyPreset('realistic');

    // Report results
    console.log(`\n========== TEST RESULTS ==========`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    if (results.failures.length > 0) {
        console.log('\nFailures:');
        console.table(results.failures);
    } else {
        console.log('\n\u2713 All tests passed!');
    }
    return results.failed === 0;
}
