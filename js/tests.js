import { assumptions, state, monteCarloState, getMonteCarloVariableKeys, PRESETS } from './config.js';
import { computeModel, amortize } from './model.js';
import { computeMultiYear, computeYearFinancials } from './multiYear.js';
import { computeQualityGate, computeRafAdjustment } from './computeHelpers.js';
import { generateSampledAssumptions, computeMonteCarloIteration, computeMedian, computePercentile, computeStdDev } from './mcSampling.js';
import { applyPreset, showMonteCarloTab } from './ui.js';
import { formatCurrency, formatCurrencyFull, formatSignedCurrency } from './formatters.js';
import { computeRanks, computeSpearmanCorrelation } from './multiYearMc.js';

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
