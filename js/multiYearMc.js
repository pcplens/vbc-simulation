import { assumptions, CONSTANTS, state, monteCarloState, PRESETS, MONTE_CARLO_CONFIG, getMonteCarloVariableKeys, SLIDER_RANGES, FUNDER_VARIABLES } from './config.js';
import { computeQualityGate, computeRafGrowthRates, inflationMultiplier } from './computeHelpers.js';
import { computeHospitalPremiumForYear, computeYearFinancials } from './multiYear.js';
import { computePracticeBurden, amortize } from './model.js';
import { generateSampledAssumptions, getVariationBounds, getVariableLabel, computeMedian, computePercentile, computeStdDev, computeRanks, computeSpearmanCorrelation } from './mcSampling.js';
import { sobolSequence } from './sobol.js';
import { drawTornadoChart, drawCorrelationTornadoChart } from './mcCharts.js';
import { formatSignedCurrency, formatCurrency, applyMcStatColor } from './formatters.js';

export function initializePathState(initialAssumptions, funding) {
    const totalPanelPatients = initialAssumptions.pcpCount * initialAssumptions.patientsPerPcp;
    const attributedPatients = Math.round(totalPanelPatients * (initialAssumptions.attributionPct / 100));
    const totalTcoc = attributedPatients * initialAssumptions.tcocPerPatient;

    // Calculate fixed bank loan payment once based on Year 1 infrastructure
    let bankDeferredMonthlyPayment = 0;
    if (funding === 'bank') {
        const a = initialAssumptions;
        // Use attributed patients for care manager calculation
        const infraCost = a.dataAnalyticsCost +
            Math.ceil(a.careManagerRatio > 0 ? attributedPatients * CONSTANTS.HIGH_RISK_PCT / a.careManagerRatio : 0) * a.careManagerSalary +
            a.adminCost + a.itCost + a.legalCost + a.qualityCost;
        // 18-month funding needed during deferral (matches Year 1 computeModel logic)
        const fundingNeeded = infraCost / 12 * CONSTANTS.DEFERRAL_MONTHS;
        const bankOrigFeeAmount = fundingNeeded * (a.bankOrigFee / 100);
        const bankPrincipal = fundingNeeded + bankOrigFeeAmount;
        const bankMonthlyRate = (a.bankInterestRate / 100) / 12;
        const capitalizedPrincipal = bankPrincipal * Math.pow(1 + bankMonthlyRate, CONSTANTS.DEFERRAL_MONTHS);
        bankDeferredMonthlyPayment = amortize(capitalizedPrincipal, bankMonthlyRate, a.bankTermMonths);
    }

    return {
        benchmark: totalTcoc,
        reserve: 0,
        acoRaf: initialAssumptions.acoBaseRaf,
        regionalRaf: initialAssumptions.regionalBaseRaf,
        loanPaymentsRemaining: funding === 'bank' ? initialAssumptions.bankTermMonths : 0,
        bankDeferredMonthlyPayment: bankDeferredMonthlyPayment,
        pmpm: initialAssumptions.payerPmpm,
        pcpCount: Math.max(1, initialAssumptions.pcpCount),  // Clamp to 1 minimum for division safety
        cumulativeNet: 0,
        cumulativeSharedSavings: 0,  // Track cumulative ACO share for Shared Savings view
        cumulativePerPcpNet: 0,   // Bug #10 fix: Track actual per-PCP cumulative net
        cumulativeBurden: 0,
        cumulativePerPcpBurden: 0, // Bug #10 fix: Track per-PCP burden
        cumulativeClawback: 0,       // Issue #1 fix: Track cumulative payer clawback
        cumulativePerPcpClawback: 0, // Issue #1 fix: Track per-PCP clawback
        failed: false,
        failedYear: null
    };
}

// Compute year outcome with cascading state
export function computeCascadingYearOutcome(pathState, shocks, year, funding, initialAssumptions) {
    const a = { ...assumptions, ...initialAssumptions };
    const totalPanelPatients = a.pcpCount * a.patientsPerPcp;
    // Apply per-year override if present (currently unused — all callers pass {})
    const attributionPct = shocks.attributionPct ?? a.attributionPct;
    const attributedPatients = Math.round(totalPanelPatients * (attributionPct / 100));

    // Apply overrides to year-specific parameters
    const tcocPerPatient = shocks.tcocPerPatient ?? a.tcocPerPatient;
    const acoRafGrowthPct = shocks.acoRafGrowthPct ?? a.acoRafGrowthPct;
    const regionalRafGrowthPct = shocks.regionalRafGrowthPct ?? a.regionalRafGrowthPct;
    const qualityImprovement = shocks.acoQualityImprovementPct ?? a.acoQualityImprovementPct;

    // Compute RAF evolution for this year
    let newAcoRaf = pathState.acoRaf;
    let newRegionalRaf = pathState.regionalRaf;

    if (year > 1 && a.enableRafAdjustment) {
        const rates = computeRafGrowthRates(a, year, acoRafGrowthPct, regionalRafGrowthPct);
        newAcoRaf *= (1 + rates.acoGrowthRate / 100);
        newRegionalRaf *= (1 + rates.regionalGrowthRate / 100);
    }

    const rafRatio = a.enableRafAdjustment ? (newRegionalRaf !== 0 ? newAcoRaf / newRegionalRaf : 1.0) : 1.0;

    // Apply benchmark ratcheting and inflation
    let benchmark = pathState.benchmark;
    if (year > 1 && a.applyInflationToBenchmark) {
        benchmark *= (1 + a.inflationPct / 100);
    }
    const rafAdjustedBenchmark = benchmark * rafRatio;

    // Quality dynamics (gate capped at qualityGateCeiling)
    const qgParams = {
        qualityGatePct: a.qualityGatePct,
        qualityGateRatchetPct: a.qualityGateRatchetPct,
        qualityGateCeiling: a.qualityGateCeiling,
        acoStartingQualityPct: a.acoStartingQualityPct,
        acoQualityImprovementPct: qualityImprovement,
        acoMaxQualityPct: a.acoMaxQualityPct
    };
    const { qualityGateRequired, achievedQuality, qualityPass } = computeQualityGate(qgParams, year);

    // Cost floor and achievable savings
    const originalTcoc = attributedPatients * tcocPerPatient;
    const minAchievableCost = originalTcoc * (1 - a.multiYearSavingsTargetPct / 100);

    // Pre-compute achievable to determine capping (helper also computes this)
    const preMaxSavings = rafAdjustedBenchmark > 0
        ? (Math.max(0, rafAdjustedBenchmark - minAchievableCost) / rafAdjustedBenchmark) * 100 : 0;
    const savingsPct = Math.min(a.multiYearSavingsTargetPct, preMaxSavings);
    const isCapped = savingsPct < a.multiYearSavingsTargetPct;

    // Hospital premium (if applicable)
    // Uses shared helper to avoid drift with deterministic multi-year calculation
    const hospitalPremium = computeHospitalPremiumForYear(benchmark, year, a, funding);

    // Infrastructure costs (with overrides and inflation applied)
    const expenseInflationMultiplier = a.applyInflationToExpenses ?
        inflationMultiplier(a.inflationPct, year) : 1;

    const baseInfraCost = (shocks.dataAnalyticsCost ?? a.dataAnalyticsCost) +
                         Math.ceil(a.careManagerRatio > 0 ? attributedPatients * CONSTANTS.HIGH_RISK_PCT / a.careManagerRatio : 0) *
                         (shocks.careManagerSalary ?? a.careManagerSalary) +
                         (shocks.adminCost ?? a.adminCost) + a.itCost + a.legalCost + a.qualityCost;

    const infraCost = baseInfraCost * expenseInflationMultiplier;

    // Practice burden (recomputed with shock overrides)
    const basePracticeBurden = computePracticeBurden(a).totalPracticeBurden;

    // Delegate shared financial math to helper
    const yf = computeYearFinancials({
        year, funding,
        rafAdjustedBenchmark,
        qualityPass,
        savingsPct, isCapped,
        minAchievableCost,
        hospitalPremium,
        infraCost,
        payerSharePct: a.payerSharePct,
        acoReservePct: a.acoReservePct,
        multiYearMsrPct: a.multiYearMsrPct,
        loanPaymentsRemaining: pathState.loanPaymentsRemaining,
        monthlyLoanPayment: (funding === 'bank') ? pathState.bankDeferredMonthlyPayment : 0,
        hospitalGainSharePct: a.hospitalGainShare,
        peEquitySharePct: a.peEquityShare,
        currentPmpm: pathState.pmpm,
        attributedPatients,
        payerClawbackPct: a.payerClawbackPct,
        currentReserve: pathState.reserve,
        basePracticeBurdenTotal: basePracticeBurden,
        applyInflationToBurden: a.applyInflationToBurden,
        inflationPct: a.inflationPct,
        adjustNetDistributableForShortfall: true,
        isScenarioMiss: false
    });

    // Cap reserve change at available reserve (MC-specific)
    const acoReserveChange = Math.max(-pathState.reserve, yf.reserveChange);

    // On failure: set status to 'Failed' and zero out distributions
    const finalStatus = yf.failed ? 'Failed' : yf.status;
    const finalNetToPcps = yf.failed ? -yf.payerClawback : yf.netToPcps;
    const finalAcoShare = yf.failed ? 0 : yf.acoShare;
    const finalFundingDeduction = yf.failed ? 0 : yf.fundingDeduction;
    const finalReserveChange = yf.failed ? -pathState.reserve : acoReserveChange;

    return {
        benchmark: benchmark,
        rafAdjustedBenchmark,
        rafRatio,
        acoRaf: newAcoRaf,
        regionalRaf: newRegionalRaf,
        qualityGateRequired,
        achievedQuality,
        qualityPass,
        savingsPct,
        realizedSavings: yf.realizedSavings,
        msrThreshold: yf.msrThreshold,
        meetsThreshold: yf.meetsThreshold,
        acoShare: finalAcoShare,
        acoOpsRetention: yf.opsRetention,
        acoReserveChange: finalReserveChange,
        fundingDeduction: finalFundingDeduction,
        loanPayment: yf.loanPayment,
        netToPcps: finalNetToPcps,
        practiceBurden: yf.practiceBurden,
        payerClawback: yf.payerClawback,
        status: finalStatus,
        failed: yf.failed,
        loanPaymentsRemaining: yf.newLoanPaymentsRemaining
    };
}

// Update path state for next year
// Bug #1, #7a, #7b, #7c, #8 fixes: Use proper config sources, ratchet on Partial, apply inflation
export function updatePathState(pathState, yearResult, year, funding, initialAssumptions) {
    const newReserve = pathState.reserve + yearResult.acoReserveChange;

    // Read ratchet from sampled assumptions (now unified with hold/vary system)
    const ratchetPct = (initialAssumptions?.benchmarkRatchetPct ?? assumptions.benchmarkRatchetPct) / 100;

    // Bug #7a fix: Ratchet on both 'Hit' AND 'Partial' (match deterministic behavior)
    let newBenchmark = yearResult.benchmark;
    if (yearResult.status === 'Hit' || yearResult.status === 'Partial') {
        newBenchmark = yearResult.benchmark * (1 - ratchetPct);

        // Bug #7b fix: Apply inflation to ratcheted benchmark if enabled
        // Bug #1 fix: Use assumptions.inflationPct (synced with Step 5) instead of separate MC config
        // Only apply ratchet inflation if benchmark inflation isn't already active
        // (otherwise benchmark was already inflated in computeCascadingYearOutcome)
        const a = { ...assumptions, ...initialAssumptions };
        if (a.applyInflationToRatchet && !a.applyInflationToBenchmark) {
            const inflationPct = a.inflationPct / 100;
            newBenchmark *= (1 + inflationPct);
        }
    }

    // Bug #8 fix: Use funding parameter and initialAssumptions for PMPM ratchet
    // PMPM ratchets only after successful years (Hit or Partial), not on miss
    let newPmpm = pathState.pmpm;
    if (funding === 'payer' && (yearResult.status === 'Hit' || yearResult.status === 'Partial')) {
        const pmpmRatchetPct = (initialAssumptions?.payerPmpmRatchet ?? assumptions.payerPmpmRatchet) / 100;
        newPmpm = pathState.pmpm * (1 - pmpmRatchetPct);
    }

    // Bug #10 fix: Calculate per-PCP values
    const perPcpNet = yearResult.netToPcps / pathState.pcpCount;
    const perPcpBurden = yearResult.practiceBurden / pathState.pcpCount;
    // Include payer clawback in per-PCP calculations (Issue #1 fix)
    const perPcpClawback = (yearResult.payerClawback || 0) / pathState.pcpCount;

    return {
        benchmark: newBenchmark,
        reserve: Math.max(0, newReserve),
        acoRaf: yearResult.acoRaf,
        regionalRaf: yearResult.regionalRaf,
        loanPaymentsRemaining: yearResult.loanPaymentsRemaining,
        bankDeferredMonthlyPayment: pathState.bankDeferredMonthlyPayment,
        pmpm: newPmpm,
        pcpCount: pathState.pcpCount,  // Carry forward
        cumulativeNet: pathState.cumulativeNet + yearResult.netToPcps,
        cumulativeSharedSavings: pathState.cumulativeSharedSavings + yearResult.acoShare,
        cumulativePerPcpNet: pathState.cumulativePerPcpNet + perPcpNet,  // Bug #10 fix
        cumulativeBurden: pathState.cumulativeBurden + yearResult.practiceBurden,
        cumulativePerPcpBurden: pathState.cumulativePerPcpBurden + perPcpBurden,  // Bug #10 fix
        cumulativeClawback: (pathState.cumulativeClawback || 0) + (yearResult.payerClawback || 0),  // Issue #1 fix
        cumulativePerPcpClawback: (pathState.cumulativePerPcpClawback || 0) + perPcpClawback,  // Issue #1 fix
        failed: yearResult.failed,
        failedYear: yearResult.failed ? year : pathState.failedYear
    };
}

// Compute a deterministic multi-year path for tornado sensitivity analysis
export function computeDeterministicMultiYearPath(testAssumptions, funding, years) {
    let pathState = initializePathState(testAssumptions, funding);

    for (let year = 1; year <= years && !pathState.failed; year++) {
        const yearResult = computeCascadingYearOutcome(pathState, {}, year, funding, testAssumptions);
        pathState = updatePathState(pathState, yearResult, year, funding, testAssumptions);
    }

    const isPerPcp = state.currentMultiYearMonteCarloView === 'perPcp';
    return {
        totalSharedSavings: pathState.cumulativeSharedSavings,
        perPcpNetAfterBurden: pathState.cumulativePerPcpNet - pathState.cumulativePerPcpBurden,
        failed: pathState.failed,
        value: isPerPcp
            ? (pathState.cumulativePerPcpNet - pathState.cumulativePerPcpBurden)
            : pathState.cumulativeSharedSavings
    };
}

// Run deterministic multi-year tornado analysis
export function runMultiYearTornadoAnalysis() {
    const baseAssumptions = { ...PRESETS[monteCarloState.basePreset] };

    // Apply custom constants for held variables
    Object.keys(monteCarloState.customConstants).forEach(varName => {
        if (monteCarloState.holdConstant[varName]) {
            baseAssumptions[varName] = monteCarloState.customConstants[varName];
        }
    });

    // Preserve current UI toggle state (match generateSampledAssumptions behavior)
    baseAssumptions.applyInflationToExpenses = assumptions.applyInflationToExpenses;
    baseAssumptions.applyInflationToBurden = assumptions.applyInflationToBurden;
    baseAssumptions.applyInflationToBenchmark = assumptions.applyInflationToBenchmark;
    baseAssumptions.applyInflationToRatchet = assumptions.applyInflationToRatchet;
    baseAssumptions.enableRafAdjustment = assumptions.enableRafAdjustment;
    baseAssumptions.regionalRafSaturationEnabled = assumptions.regionalRafSaturationEnabled;

    const funding = state.selectedFunding || 'bank';
    const years = monteCarloState.multiYearConfig?.yearsToProject || assumptions.multiYearCount;

    const baseResult = computeDeterministicMultiYearPath(baseAssumptions, funding, years);
    const baseValue = baseResult.value;

    let sensitivities = [];

    // For each variable that is being varied
    getMonteCarloVariableKeys(funding, 'multiYear').forEach(varName => {
        const isHeld = monteCarloState.holdConstant[varName];
        const isVarying = monteCarloState.varyEnabled[varName];

        if (!isHeld && isVarying && baseAssumptions[varName] !== undefined) {
            const bounds = getVariationBounds(varName, baseAssumptions[varName], monteCarloState.variationPct);

            // Test low value
            const lowAssumptions = { ...baseAssumptions, [varName]: bounds.min };
            const lowResult = computeDeterministicMultiYearPath(lowAssumptions, funding, years);
            const lowValue = lowResult.value;

            // Test high value
            const highAssumptions = { ...baseAssumptions, [varName]: bounds.max };
            const highResult = computeDeterministicMultiYearPath(highAssumptions, funding, years);
            const highValue = highResult.value;

            const impact = Math.abs(highValue - lowValue);

            sensitivities.push({
                varName,
                label: getVariableLabel(varName),
                lowValue,
                highValue,
                impact,
                lowDelta: lowValue - baseValue,
                highDelta: highValue - baseValue
            });
        }
    });

    // Sort by impact
    sensitivities.sort((a, b) => b.impact - a.impact);

    // Filter out variables with negligible impact
    if (sensitivities.length > 0) {
        const maxImpact = sensitivities[0].impact;
        const threshold = Math.max(1000, maxImpact * 0.01);
        sensitivities = sensitivities.filter(s => s.impact >= threshold);
    }

    return sensitivities.slice(0, 10);
}

// Analyze correlations between sampled parameters and Year 1 outcomes
export function analyzeYear1Correlations(results) {
    if (!results || results.length < 10) return [];

    const isPerPcp = state.currentMonteCarloView === 'perPcp';
    const outcomes = results.map(r => isPerPcp ? r.perPcpNet : r.sharedSavings);
    const funding = state.selectedFunding || 'bank';

    let correlations = [];

    // Dynamic significance threshold: max(0.10, ~p<0.01 critical value)
    // Eliminates spurious noise correlations that produce misleading bar colors
    // For n=1000: max(0.10, 0.081) = 0.10
    // For n=100:  max(0.10, 0.259) = 0.259
    const significanceThreshold = Math.max(0.10, 2.576 / Math.sqrt(results.length));

    getMonteCarloVariableKeys(funding, 'year1').forEach(varName => {
        const isHeld = monteCarloState.holdConstant[varName];
        const isVarying = monteCarloState.varyEnabled[varName];

        if (!isHeld && isVarying) {
            const values = results.map(r => r.sampledAssumptions?.[varName]);
            if (values.some(v => v === undefined || v === null)) return;
            const unique = new Set(values);
            if (unique.size < 3) return;

            const correlation = computeSpearmanCorrelation(values, outcomes);
            const absCorrelation = Math.abs(correlation);

            if (absCorrelation >= significanceThreshold) {
                correlations.push({
                    varName,
                    label: getVariableLabel(varName),
                    correlation,
                    absCorrelation
                });
            }
        }
    });

    correlations.sort((a, b) => b.absCorrelation - a.absCorrelation);
    return correlations.slice(0, 10);
}

// Analyze correlations between initial parameters and final outcomes
export function analyzeMultiYearCorrelations(paths) {
    if (!paths || paths.length < 10) return [];

    const isPerPcp = state.currentMultiYearMonteCarloView === 'perPcp';
    const outcomes = paths.map(p => isPerPcp ? p.perPcpNetAfterBurden : p.totalSharedSavings);
    const funding = state.selectedFunding || 'bank';

    let correlations = [];

    // Dynamic significance threshold: max(0.10, ~p<0.01 critical value)
    // Eliminates spurious noise correlations that produce misleading bar colors
    const significanceThreshold = Math.max(0.10, 2.576 / Math.sqrt(paths.length));

    // For each varied variable, extract initial sampled values
    getMonteCarloVariableKeys(funding, 'multiYear').forEach(varName => {
        const isHeld = monteCarloState.holdConstant[varName];
        const isVarying = monteCarloState.varyEnabled[varName];

        if (!isHeld && isVarying) {
            const values = paths.map(p => p.initialAssumptions?.[varName]);
            // Skip if not all paths have this variable
            if (values.some(v => v === undefined || v === null)) return;
            // Skip if no variance (all same value)
            const unique = new Set(values);
            if (unique.size < 3) return;

            const correlation = computeSpearmanCorrelation(values, outcomes);
            const absCorrelation = Math.abs(correlation);

            if (absCorrelation >= significanceThreshold) {
                correlations.push({
                    varName,
                    label: getVariableLabel(varName),
                    correlation,
                    absCorrelation
                });
            }
        }
    });

    // Sort by absolute correlation
    correlations.sort((a, b) => b.absCorrelation - a.absCorrelation);

    return correlations.slice(0, 10);
}

export function setYear1TornadoMode(mode) {
    state.currentYear1TornadoMode = mode;

    // Toggle tab buttons
    const detBtn = document.getElementById('mcTornadoTabDeterministic');
    const corrBtn = document.getElementById('mcTornadoTabCorrelation');
    if (detBtn) detBtn.classList.toggle('active', mode === 'deterministic');
    if (corrBtn) corrBtn.classList.toggle('active', mode === 'correlation');

    // Show/hide views
    const detView = document.getElementById('mcTornadoDeterministicView');
    const corrView = document.getElementById('mcTornadoCorrelationView');
    if (detView) detView.style.display = mode === 'deterministic' ? '' : 'none';
    if (corrView) corrView.style.display = mode === 'correlation' ? '' : 'none';

    // Update explanation text
    const explanation = document.getElementById('mcTornadoExplanation');
    if (explanation) {
        if (mode === 'deterministic') {
            explanation.innerHTML = 'Tests each variable independently at its low and high bounds while holding all others at baseline. Shows the dollar impact of each variable in isolation. <strong>Click any variable to see explanation.</strong> <strong>Pro:</strong> Concrete dollar values. <strong>Limitation:</strong> Does not capture how variables interact with each other.';
        } else {
            explanation.innerHTML = 'Computes Spearman rank correlation between each variable\'s sampled value and the Year 1 outcome across all simulation iterations. <strong>Pro:</strong> Captures how variables interact and jointly influence outcomes. <strong>Limitation:</strong> Shows correlation strength (\u22121 to +1), not dollar amounts.';
        }
    }
}

// Toggle multi-year tornado mode between deterministic and correlation
export function setMultiYearTornadoMode(mode) {
    state.currentMultiYearTornadoMode = mode;

    // Toggle tab buttons
    const detBtn = document.getElementById('myMcTornadoTabDeterministic');
    const corrBtn = document.getElementById('myMcTornadoTabCorrelation');
    if (detBtn) detBtn.classList.toggle('active', mode === 'deterministic');
    if (corrBtn) corrBtn.classList.toggle('active', mode === 'correlation');

    // Show/hide views
    const detView = document.getElementById('myMcTornadoDeterministicView');
    const corrView = document.getElementById('myMcTornadoCorrelationView');
    if (detView) detView.style.display = mode === 'deterministic' ? '' : 'none';
    if (corrView) corrView.style.display = mode === 'correlation' ? '' : 'none';

    // Update explanation text
    const explanation = document.getElementById('myMcTornadoExplanation');
    if (explanation) {
        if (mode === 'deterministic') {
            explanation.innerHTML = 'Tests each variable independently at its low and high bounds while holding all others at baseline. Runs a deterministic multi-year path for each test \u2014 identical methodology to the simulation paths, but with only one variable changed. Shows the dollar impact of each variable in isolation. <strong>Pro:</strong> Concrete dollar values. <strong>Limitation:</strong> Does not capture how variables interact with each other.';
        } else {
            explanation.innerHTML = 'Computes Spearman rank correlation between each variable\'s initial sampled value and the final outcome across all simulation paths. Each path is fully determined by its initial conditions \u2014 cascading dynamics (benchmark ratchets, RAF growth, reserve depletion) propagate deterministically from year to year. <strong>Pro:</strong> Captures variable interactions and path-dependent dynamics. <strong>Limitation:</strong> Shows correlation strength (\u22121 to +1), not dollar amounts.';
        }
    }
}

// Run cascading Monte Carlo simulation
export async function runCascadingMonteCarlo() {
    if (monteCarloState.isRunning) return;

    monteCarloState.isRunning = true;
    const paths = [];
    const funding = state.selectedFunding || 'bank';
    // Use multi-year config years or fallback to assumptions
    const years = monteCarloState.multiYearConfig?.yearsToProject || assumptions.multiYearCount;
    const iterations = monteCarloState.iterations;

    // Show progress (use shared Step 7 elements)
    const progressContainer = document.getElementById('mcProgressContainer');
    const progressFill = document.getElementById('mcProgressFill');
    const runBtn = document.getElementById('mcRunBtn');
    if (progressContainer) progressContainer.classList.add('active');
    if (runBtn) runBtn.disabled = true;

    // Hide previous results
    document.getElementById('mcResults').style.display = 'none';
    document.getElementById('myMcResults').style.display = 'none';
    document.getElementById('mcNoResults').style.display = 'none';

    try {
        // Pre-compute number of varied dimensions for QMC
        const useQMC = monteCarloState.useQMC;
        let variedDimCount = 0;
        if (useQMC) {
            const baseAssumptions = PRESETS[monteCarloState.basePreset];
            getMonteCarloVariableKeys(funding, 'multiYear').forEach(varName => {
                if (!monteCarloState.holdConstant[varName] && monteCarloState.varyEnabled[varName] && baseAssumptions[varName] !== undefined) {
                    variedDimCount++;
                }
            });
        }

        for (let iter = 0; iter < iterations; iter++) {
            // Pre-compute Sobol values for QMC sampling
            let sobolValues = null;
            if (useQMC && variedDimCount > 0) {
                sobolValues = [];
                for (let d = 0; d < variedDimCount; d++) {
                    sobolValues.push(sobolSequence(iter + 1, d));
                }
            }

            // Sample INITIAL parameters (Year 1 starting conditions)
            const initialAssumptions = generateSampledAssumptions({
                basePreset: monteCarloState.basePreset,
                variationPct: monteCarloState.variationPct,
                holdConstant: monteCarloState.holdConstant,
                varyEnabled: monteCarloState.varyEnabled,
                customConstants: monteCarloState.customConstants,
                funding: funding,
                sobolValues: sobolValues,
                simulationType: 'multiYear'
            });

            let pathState = initializePathState(initialAssumptions, funding);
            const pathHistory = [];

            for (let year = 1; year <= years && !pathState.failed; year++) {
                // Initial sampled parameters determine the full path — no per-year randomization
                // Cascading state (benchmark ratchet, RAF growth, quality gate) evolves deterministically year-to-year
                const yearResult = computeCascadingYearOutcome(pathState, {}, year, funding, initialAssumptions);

                // Update state for next year
                // Bug #8 fix: Pass funding and initialAssumptions for PMPM ratchet
                pathState = updatePathState(pathState, yearResult, year, funding, initialAssumptions);

                // Only store fields consumed by analyzeMultiYearPaths (fan chart, heatmap)
                pathHistory.push({
                    status: yearResult.status,
                    cumulativeSharedSavings: pathState.cumulativeSharedSavings,
                    cumulativePerPcpNetAfterBurden: pathState.cumulativePerPcpNet - pathState.cumulativePerPcpBurden
                });
            }

            paths.push({
                history: pathHistory,
                initialAssumptions: initialAssumptions,
                finalYear: pathHistory.length,
                failed: pathState.failed,
                failedYear: pathState.failedYear,
                totalNet: pathState.cumulativeNet,
                totalSharedSavings: pathState.cumulativeSharedSavings,
                totalBurden: pathState.cumulativeBurden,
                netAfterBurden: pathState.cumulativeNet - pathState.cumulativeBurden,
                // Bug #10 fix: Add actual per-PCP values
                totalPerPcpNet: pathState.cumulativePerPcpNet,
                totalPerPcpBurden: pathState.cumulativePerPcpBurden,
                // Clawback now embedded in netToPcps → cumulativeNet/cumulativePerPcpNet
                totalClawback: pathState.cumulativeClawback || 0,
                totalPerPcpClawback: pathState.cumulativePerPcpClawback || 0,
                perPcpNetAfterBurden: pathState.cumulativePerPcpNet - pathState.cumulativePerPcpBurden
            });

            // Update progress every 25 iterations
            if (iter % 25 === 0) {
                const pct = (iter / iterations) * 100;
                if (progressFill) progressFill.style.width = pct + '%';
                await new Promise(r => setTimeout(r, 0));
            }
        }

        if (progressFill) progressFill.style.width = '100%';

        monteCarloState.paths = paths;
        monteCarloState.results = analyzeMultiYearPaths(paths, years, state.currentMultiYearMonteCarloView);

        // Cache results for tab switching
        monteCarloState.multiYearPaths = paths;
        monteCarloState.multiYearResults = monteCarloState.results;
        monteCarloState.multiYearDirty = false;

        displayMultiYearMCResults(monteCarloState.results);

    } finally {
        monteCarloState.isRunning = false;
        if (progressContainer) progressContainer.classList.remove('active');
        if (runBtn) runBtn.disabled = false;
    }
}

// Analyze multi-year path results
export function analyzeMultiYearPaths(paths, years, viewType = 'perPcp') {
    // Determine which values to use based on view
    const useSharedSavings = viewType === 'sharedSavings';

    // Per-year statistics (for fan chart) - view-dependent
    // Bug #10 fix: Use cumulativePerPcpNetAfterBurden for Per-PCP view (matches histogram/stats)
    const yearStats = [];
    for (let y = 1; y <= years; y++) {
        const yearValues = paths
            .filter(p => p.history.length >= y)
            .map(p => useSharedSavings
                ? p.history[y - 1].cumulativeSharedSavings
                : p.history[y - 1].cumulativePerPcpNetAfterBurden);

        if (yearValues.length === 0) continue;

        const sorted = [...yearValues].sort((a, b) => a - b);
        yearStats.push({
            year: y,
            mean: yearValues.reduce((a, b) => a + b, 0) / yearValues.length,
            median: computeMedian(sorted),
            p5: computePercentile(sorted, 0.05),
            p25: computePercentile(sorted, 0.25),
            p75: computePercentile(sorted, 0.75),
            p95: computePercentile(sorted, 0.95),
            min: sorted[0],
            max: sorted[sorted.length - 1],
            surviving: yearValues.length / paths.length
        });
    }

    // Survival curve (not view-dependent)
    // Bug #5 fix: A path "survives" year y if it has history through year y AND did NOT fail in year y
    // (failedYear is the year of failure; paths surviving year y have either no failure or failedYear > y)
    const survivalCurve = [];
    for (let y = 1; y <= years; y++) {
        const surviving = paths.filter(p =>
            p.history.length >= y && (!p.failedYear || p.failedYear > y)
        ).length;
        survivalCurve.push({
            year: y,
            survivalRate: (surviving / paths.length) * 100
        });
    }

    // Failure distribution by year (not view-dependent)
    const failureByYear = {};
    paths.forEach(p => {
        if (p.failedYear) {
            failureByYear[p.failedYear] = (failureByYear[p.failedYear] || 0) + 1;
        }
    });

    // Status heatmap (probability of each status by year) - not view-dependent
    // Bug #12 fix: Add 'Failed' category to status heatmap
    const statusHeatmap = [];
    for (let y = 1; y <= years; y++) {
        const yearStatuses = paths
            .filter(p => p.history.length >= y)
            .map(p => p.history[y - 1].status);

        if (yearStatuses.length === 0) continue;

        const statusCounts = {};
        yearStatuses.forEach(s => statusCounts[s] = (statusCounts[s] || 0) + 1);

        const total = yearStatuses.length;
        statusHeatmap.push({
            year: y,
            hit: ((statusCounts['Hit'] || 0) / total * 100).toFixed(1),
            partial: ((statusCounts['Partial'] || 0) / total * 100).toFixed(1),
            tcocMiss: ((statusCounts['TCOC Miss'] || 0) / total * 100).toFixed(1),
            qualityMiss: ((statusCounts['Quality Miss'] || 0) / total * 100).toFixed(1),
            bothMiss: ((statusCounts['Both Miss'] || 0) / total * 100).toFixed(1),
            failed: ((statusCounts['Failed'] || 0) / total * 100).toFixed(1),
            cumulativeExited: ((paths.filter(p => p.failedYear && p.failedYear <= y).length / paths.length) * 100).toFixed(1)
        });
    }

    // Final outcome values - view-dependent
    // Bug #10 fix: Use perPcpNetAfterBurden for Per-PCP view (actual per-PCP values)
    const finalValues = paths.map(p => useSharedSavings
        ? p.totalSharedSavings
        : p.perPcpNetAfterBurden);
    const sortedFinal = [...finalValues].sort((a, b) => a - b);

    // Build histogram bins
    const min = sortedFinal[0];
    const max = sortedFinal[sortedFinal.length - 1];
    const binCount = MONTE_CARLO_CONFIG.histogramBins;
    const bins = [];
    if (max === min) {
        // All values identical — single bin (matches Year 1 MC degenerate handling)
        bins.push({ min, max: min, count: finalValues.length, frequency: 1.0 });
    } else {
        const binWidth = (max - min) / binCount;
        for (let i = 0; i < binCount; i++) {
            const binMin = min + i * binWidth;
            const binMax = binMin + binWidth;
            const count = finalValues.filter(v => v >= binMin && (i === binCount - 1 ? v <= binMax : v < binMax)).length;
            bins.push({
                min: binMin,
                max: binMax,
                count,
                frequency: count / paths.length
            });
        }
    }

    // Compute standard deviation
    const meanVal = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
    const stdDev = computeStdDev(finalValues, meanVal);

    // Probability of loss
    // For shared savings view, loss = $0 cumulative; for per-PCP view, loss = negative net
    const lossCount = finalValues.filter(v => useSharedSavings ? v === 0 : v < 0).length;
    const probLoss = (lossCount / finalValues.length) * 100;

    return {
        viewType,         // Track which view this analysis is for
        yearStats,        // For fan chart
        survivalCurve,    // For survival curve
        failureByYear,    // For failure analysis
        statusHeatmap,    // For status heatmap
        histogram: { bins, min, max },
        overallStats: {
            mean: meanVal,
            median: computeMedian(sortedFinal),
            stdDev,
            p5: computePercentile(sortedFinal, 0.05),
            p95: computePercentile(sortedFinal, 0.95),
            probLoss,
            survivalRate: paths.filter(p => !p.failed).length / paths.length,
            avgFailureYear: paths.filter(p => p.failed).length > 0 ?
                paths.filter(p => p.failed).map(p => p.failedYear).reduce((a, b) => a + b, 0) /
                paths.filter(p => p.failed).length : null,
            profitRate: paths.filter(p => p.perPcpNetAfterBurden > 0).length / paths.length
        }
    };
}

// Display Multi-Year Monte Carlo results
export function displayMultiYearMCResults(results) {
    if (!results) return;

    const isPerPcp = results.viewType === 'perPcp';

    // Show results container, hide placeholder
    document.getElementById('myMcResults').style.display = 'block';
    document.getElementById('mcNoResults').style.display = 'none';

    // Update view toggle button states
    document.getElementById('myMcViewSharedSavings').classList.toggle('active', !isPerPcp);
    document.getElementById('myMcViewPerPcp').classList.toggle('active', isPerPcp);

    // Update 8 stat cards
    document.getElementById('myMcStatSurvivalRate').textContent = (results.overallStats.survivalRate * 100).toFixed(1) + '%';

    // Show/hide PCP Profit Rate based on view
    const pcpProfitCard = document.getElementById('myMcPcpProfitCard');
    if (isPerPcp) {
        pcpProfitCard.style.display = 'block';
        document.getElementById('myMcStatPcpProfit').textContent = (results.overallStats.profitRate * 100).toFixed(1) + '%';
    } else {
        pcpProfitCard.style.display = 'none';
    }

    document.getElementById('myMcStatMean').textContent = formatSignedCurrency(results.overallStats.mean);
    document.getElementById('myMcStatMedian').textContent = formatSignedCurrency(results.overallStats.median);
    document.getElementById('myMcStatStdDev').textContent = '$' + formatCurrency(results.overallStats.stdDev);
    document.getElementById('myMcStatProbLoss').textContent = results.overallStats.probLoss.toFixed(1) + '%';
    document.getElementById('myMcStatP5').textContent = formatSignedCurrency(results.overallStats.p5);
    document.getElementById('myMcStatP95').textContent = formatSignedCurrency(results.overallStats.p95);

    applyMcStatColor('myMcStatMean', results.overallStats.mean);
    applyMcStatColor('myMcStatMedian', results.overallStats.median);
    applyMcStatColor('myMcStatP5', results.overallStats.p5);
    applyMcStatColor('myMcStatP95', results.overallStats.p95);

    // Show/hide Avg Failure Year card
    const avgFailCard = document.getElementById('myMcAvgFailureCard');
    const avgFailYear = results.overallStats.avgFailureYear;
    if (avgFailCard) {
        if (avgFailYear !== null) {
            document.getElementById('myMcStatAvgFailure').textContent = 'Year ' + avgFailYear.toFixed(1);
            avgFailCard.style.display = '';
        } else {
            avgFailCard.style.display = 'none';
        }
    }


    // Update Prob Loss label based on view
    const probLossLabel = document.getElementById('myMcStatProbLossLabel');
    probLossLabel.innerHTML = isPerPcp
        ? 'Prob PCP Loss <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Percentage of simulation paths where physicians end with negative cumulative net income after practice burden costs across all years. PCPs in ACOs that earned income before failing may still have positive cumulative returns.</span></span>'
        : 'Prob ACO Loss <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Percentage of simulation paths where the ACO receives $0 cumulative shared savings across all years. An ACO that earns savings in early years before failing will still show a positive cumulative total — so low survival does not necessarily mean high probability of loss.</span></span>';

    // Update chart titles based on view (with tooltips)
    const fanChartTitle = document.getElementById('myMcFanChartTitle');
    if (fanChartTitle) {
        fanChartTitle.innerHTML = isPerPcp
            ? 'Cumulative Per-PCP Net Over Time <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Running total of per-PCP net income across all years. Includes annual practice burden costs deducted each year. Shows median path with P25-P75 (darker) and P5-P95 (lighter) confidence bands.</span></span>'
            : 'Cumulative Shared Savings Over Time <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Running total of ACO shared savings across all years. Shows median path with P25-P75 (darker) and P5-P95 (lighter) confidence bands.</span></span>';
    }

    const histogramTitle = document.getElementById('myMcHistogramTitle');
    if (histogramTitle) {
        histogramTitle.innerHTML = isPerPcp
            ? 'Distribution of Final Per-PCP Net <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Total per-PCP net income at end of projection, after all years of payouts and practice burden costs.</span></span>'
            : 'Distribution of Final Shared Savings <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Total ACO shared savings at end of projection period.</span></span>';
    }

    // Draw visualizations
    drawFanChart(results.yearStats, results.viewType);
    drawSurvivalCurve(results.survivalCurve);
    drawStatusHeatmap(results.statusHeatmap);
    drawMultiYearHistogram(results.histogram, results.overallStats, results.viewType);

    // Run and draw multi-year tornado charts (both modes)
    const multiYearTornado = runMultiYearTornadoAnalysis();
    drawTornadoChart(multiYearTornado, 'myMcTornadoBars', 'myMcTornadoAxisLabels');

    if (monteCarloState.multiYearPaths) {
        const correlations = analyzeMultiYearCorrelations(monteCarloState.multiYearPaths);
        drawCorrelationTornadoChart(correlations, 'myMcCorrTornadoBars', 'myMcCorrTornadoAxisLabels');
    }

    // Restore tab state
    setMultiYearTornadoMode(state.currentMultiYearTornadoMode);
}

// Draw fan chart showing cumulative net distribution over years
export function drawFanChart(yearStats, viewType = 'perPcp') {
    const canvas = document.getElementById('myMcFanChart');
    if (!canvas || yearStats.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // Find value range
    const allValues = yearStats.flatMap(ys => [ys.p5, ys.p95]);
    const minY = Math.min(0, ...allValues);
    const maxY = Math.max(...allValues);
    const valueRange = maxY - minY || 1;

    const xScale = chartWidth / (yearStats.length - 1 || 1);
    const yScale = chartHeight / valueRange;

    const getX = (i) => padding.left + i * xScale;
    const getY = (val) => padding.top + chartHeight - (val - minY) * yScale;

    // Draw P5-P95 band (lightest)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.beginPath();
    yearStats.forEach((ys, i) => {
        const x = getX(i);
        if (i === 0) ctx.moveTo(x, getY(ys.p95));
        else ctx.lineTo(x, getY(ys.p95));
    });
    [...yearStats].reverse().forEach((ys, i) => {
        const x = getX(yearStats.length - 1 - i);
        ctx.lineTo(x, getY(ys.p5));
    });
    ctx.closePath();
    ctx.fill();

    // Draw P25-P75 band (medium)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.beginPath();
    yearStats.forEach((ys, i) => {
        const x = getX(i);
        if (i === 0) ctx.moveTo(x, getY(ys.p75));
        else ctx.lineTo(x, getY(ys.p75));
    });
    [...yearStats].reverse().forEach((ys, i) => {
        const x = getX(yearStats.length - 1 - i);
        ctx.lineTo(x, getY(ys.p25));
    });
    ctx.closePath();
    ctx.fill();

    // Draw median line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    yearStats.forEach((ys, i) => {
        const x = getX(i);
        const y = getY(ys.median);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw zero line if data spans negative and positive
    if (minY < 0 && maxY > 0) {
        const zeroY = getY(0);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding.left, zeroY);
        ctx.lineTo(padding.left + chartWidth, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('$0', padding.left - 5, zeroY + 4);
    }

    // Draw axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // X-axis labels (years)
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    yearStats.forEach((ys, i) => {
        if (i % Math.ceil(yearStats.length / 10) === 0 || i === yearStats.length - 1) {
            ctx.fillText('Y' + ys.year, getX(i), padding.top + chartHeight + 20);
        }
    });

    // Y-axis labels (handle negative values)
    ctx.textAlign = 'right';
    const formatAxisLabel = (val) => {
        const abs = Math.abs(val);
        let formatted;
        if (abs >= 1000000) {
            formatted = '$' + (abs / 1000000).toFixed(1) + 'M';
        } else if (abs >= 1000) {
            formatted = '$' + Math.round(abs / 1000) + 'K';
        } else {
            formatted = '$' + Math.round(abs);
        }
        return val < 0 ? '\u2212' + formatted : formatted;
    };
    ctx.fillText(formatAxisLabel(maxY), padding.left - 5, padding.top + 10);
    ctx.fillText(formatAxisLabel(minY), padding.left - 5, padding.top + chartHeight);

}

// Draw survival curve
export function drawSurvivalCurve(survivalData) {
    const canvas = document.getElementById('myMcSurvivalCurve');
    if (!canvas || survivalData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const xScale = chartWidth / (survivalData.length - 1 || 1);
    const yScale = chartHeight / 100;

    const getX = (i) => padding.left + i * xScale;
    const getY = (pct) => padding.top + chartHeight - pct * yScale;

    // Fill area under curve
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(0));
    survivalData.forEach((d, i) => {
        ctx.lineTo(getX(i), getY(d.survivalRate));
    });
    ctx.lineTo(getX(survivalData.length - 1), getY(0));
    ctx.closePath();
    ctx.fill();

    // Draw survival line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    survivalData.forEach((d, i) => {
        const x = getX(i);
        const y = getY(d.survivalRate);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    survivalData.forEach((d, i) => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(getX(i), getY(d.survivalRate), 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    survivalData.forEach((d, i) => {
        if (i % Math.ceil(survivalData.length / 10) === 0 || i === survivalData.length - 1) {
            ctx.fillText('Y' + d.year, getX(i), padding.top + chartHeight + 20);
        }
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.fillText('100%', padding.left - 5, padding.top + 10);
    ctx.fillText('50%', padding.left - 5, padding.top + chartHeight / 2);
    ctx.fillText('0%', padding.left - 5, padding.top + chartHeight);

    // Title
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ACO Survival Rate', padding.left, 15);
}

// Draw status heatmap as HTML table
export function drawStatusHeatmap(heatmapData) {
    const container = document.getElementById('myMcStatusHeatmap');
    if (!container || heatmapData.length === 0) return;

    const statusColors = {
        hit: { bg: '#d1fae5', text: '#065f46' },
        partial: { bg: '#fef3c7', text: '#92400e' },
        tcocMiss: { bg: '#fee2e2', text: '#991b1b' },
        qualityMiss: { bg: '#fce7f3', text: '#9d174d' },
        bothMiss: { bg: '#fecaca', text: '#7f1d1d' },
        failed: { bg: '#1f2937', text: '#f9fafb' },  // Bug #12 fix: Add Failed category
        cumulativeExited: { bg: '#6b7280', text: '#f9fafb' }
    };

    let html = '<table class="status-heatmap-table" style="width:100%;border-collapse:collapse;font-size:0.8em;">';
    html += '<thead><tr style="background:#f1f5f9;">';
    html += '<th style="padding:8px;text-align:left;">Year</th>';
    html += '<th style="padding:8px;">Hit</th>';
    html += '<th style="padding:8px;">Partial</th>';
    html += '<th style="padding:8px;">TCOC Miss</th>';
    html += '<th style="padding:8px;">Quality Miss</th>';
    html += '<th style="padding:8px;">Both Miss</th>';
    html += '<th style="padding:8px;">Failed <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Percentage of simulations reaching this year that failed in this specific year.</span></span></th>';
    html += '<th style="padding:8px;">Cumulative Failed <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text" style="left:auto;right:0;">Total percentage of simulations that have failed by this year (cumulative). Equals 100% minus survival rate at this year.</span></span></th>';
    html += '</tr></thead><tbody>';

    heatmapData.forEach(row => {
        html += '<tr>';
        html += '<td style="padding:6px 8px;font-weight:600;">Y' + row.year + '</td>';

        ['hit', 'partial', 'tcocMiss', 'qualityMiss', 'bothMiss', 'failed', 'cumulativeExited'].forEach(status => {
            const val = parseFloat(row[status]);
            const colors = statusColors[status];
            const bgColor = val > 5 ? colors.bg : 'transparent';
            const textColor = val > 5 ? colors.text : '#94a3b8';
            html += '<td style="padding:6px 8px;text-align:center;background:' + bgColor + ';color:' + textColor + ';">' +
                    (val > 0 ? row[status] + '%' : '-') + '</td>';
        });

        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('tbody tr').forEach(tr => {
        tr.addEventListener('click', function() {
            const wasActive = this.classList.contains('active-row');
            container.querySelectorAll('tbody tr.active-row').forEach(r => r.classList.remove('active-row'));
            if (!wasActive) this.classList.add('active-row');
        });
    });
}

// Draw multi-year histogram
export function drawMultiYearHistogram(histData, stats, viewType = 'perPcp') {
    const canvas = document.getElementById('myMcHistogram');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxFreq = Math.max(...histData.bins.map(b => b.frequency));
    const barWidth = chartWidth / histData.bins.length - 2;

    // Draw bars
    histData.bins.forEach((bin, i) => {
        const barHeight = (bin.frequency / maxFreq) * chartHeight;
        const x = padding.left + i * (chartWidth / histData.bins.length) + 1;
        const y = padding.top + chartHeight - barHeight;

        const midValue = (bin.min + bin.max) / 2;
        ctx.fillStyle = midValue < 0 ? '#fecaca' : '#bbf7d0';
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.strokeStyle = midValue < 0 ? '#f87171' : '#4ade80';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    });

    // Draw zero line if data spans negative and positive
    if (histData.min < 0 && histData.max > 0) {
        const zeroX = padding.left + ((0 - histData.min) / (histData.max - histData.min)) * chartWidth;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(zeroX, padding.top);
        ctx.lineTo(zeroX, padding.top + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw mean and median markers
    const valueRange = histData.max - histData.min || 1;
    const meanX = padding.left + ((stats.mean - histData.min) / valueRange) * chartWidth;
    const medianX = padding.left + ((stats.median - histData.min) / valueRange) * chartWidth;

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(meanX, padding.top);
    ctx.lineTo(meanX, padding.top + chartHeight);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(medianX, padding.top);
    ctx.lineTo(medianX, padding.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(formatSignedCurrency(histData.min), padding.left, padding.top + chartHeight + 25);
    ctx.textAlign = 'right';
    ctx.fillText(formatSignedCurrency(histData.max), padding.left + chartWidth, padding.top + chartHeight + 25);

}
