import { SLIDER_RANGES, PRESETS, assumptions, state, monteCarloState, getMonteCarloVariableKeys, MONTE_CARLO_CONFIG, CONSTANTS } from './config.js';
import { sobolSequence } from './sobol.js';
import { computeModel } from './model.js';
import { computeQualityGate } from './computeHelpers.js';

export function sampleTriangular(min, mode, max) {
    if (max <= min) return min;
    const u = Math.random();
    const fc = (mode - min) / (max - min);
    if (u < fc) {
        return min + Math.sqrt(u * (max - min) * (mode - min));
    }
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

// Uniform distribution sampling (equal probability across range)
export function sampleUniform(min, max) {
    return min + Math.random() * (max - min);
}

// Generate variation bounds for a variable based on variation percentage
export function getVariationBounds(varName, baseValue, variationPct) {
    const range = SLIDER_RANGES[varName];
    if (!range) return { min: baseValue, mode: baseValue, max: baseValue };

    const sliderRange = range.max - range.min;
    const variationAmount = sliderRange * (variationPct / 100);

    let min = Math.max(range.min, baseValue - variationAmount);
    let max = Math.min(range.max, baseValue + variationAmount);

    // Round to step for integer variables (step >= 1) so tornado bounds match MC sampling
    if (range.step >= 1) {
        min = Math.round(min / range.step) * range.step;
        max = Math.round(max / range.step) * range.step;
    }

    return { min, mode: baseValue, max };
}

// Generate sampled assumptions for one Monte Carlo iteration
// When config.sobolValues is provided (array of [0,1] values), uses those
// instead of Math.random() for quasi-Monte Carlo sampling.
export function generateSampledAssumptions(config) {
    const baseAssumptions = { ...PRESETS[config.basePreset] };
    const sampled = { ...baseAssumptions };

    // Preserve current UI toggle state (behavioral flags, not sampled numerics)
    // Presets share identical toggle values, so without this override
    // user toggle changes in the UI are silently ignored during MC.
    sampled.applyInflationToExpenses = assumptions.applyInflationToExpenses;
    sampled.applyInflationToBurden = assumptions.applyInflationToBurden;
    sampled.applyInflationToBenchmark = assumptions.applyInflationToBenchmark;
    sampled.applyInflationToRatchet = assumptions.applyInflationToRatchet;
    sampled.enableRafAdjustment = assumptions.enableRafAdjustment;
    sampled.regionalRafSaturationEnabled = assumptions.regionalRafSaturationEnabled;

    const funding = config.funding || state.selectedFunding || 'bank';
    const sobolValues = config.sobolValues || null;

    // For each variable that should be varied
    let dimIndex = 0;
    getMonteCarloVariableKeys(funding, config.simulationType).forEach(varName => {
        const isHeld = monteCarloState.holdConstant[varName];
        const isVarying = monteCarloState.varyEnabled[varName];

        if (!isHeld && isVarying && baseAssumptions[varName] !== undefined) {
            const bounds = getVariationBounds(varName, baseAssumptions[varName], config.variationPct);

            if (sobolValues && dimIndex < sobolValues.length) {
                // QMC: map Sobol [0,1] value to variable range
                const u = sobolValues[dimIndex];
                if (monteCarloState.useTriangular) {
                    // Inverse CDF of triangular distribution
                    if (bounds.max <= bounds.min) {
                        sampled[varName] = bounds.min;
                    } else {
                        const fc = (bounds.mode - bounds.min) / (bounds.max - bounds.min);
                        if (u < fc) {
                            sampled[varName] = bounds.min + Math.sqrt(u * (bounds.max - bounds.min) * (bounds.mode - bounds.min));
                        } else {
                            sampled[varName] = bounds.max - Math.sqrt((1 - u) * (bounds.max - bounds.min) * (bounds.max - bounds.mode));
                        }
                    }
                } else {
                    // Inverse CDF of uniform: linear mapping
                    sampled[varName] = bounds.min + u * (bounds.max - bounds.min);
                }
            } else if (monteCarloState.useTriangular) {
                sampled[varName] = sampleTriangular(bounds.min, bounds.mode, bounds.max);
            } else {
                sampled[varName] = sampleUniform(bounds.min, bounds.max);
            }

            dimIndex++;

            // Snap to step size for variables with defined steps (e.g., step 6 for bankTermMonths)
            const range = SLIDER_RANGES[varName];
            if (range && range.step) {
                sampled[varName] = Math.round(sampled[varName] / range.step) * range.step;
                sampled[varName] = Math.max(bounds.min, Math.min(bounds.max, sampled[varName]));
            }
        } else if (monteCarloState.customConstants[varName] !== undefined) {
            // Use custom constant value if set
            sampled[varName] = monteCarloState.customConstants[varName];
        }
    });

    return sampled;
}

// Compute model for a single Monte Carlo iteration
export function computeMonteCarloIteration(sampledAssumptions, config) {
    // Temporarily replace global assumptions
    const originalAssumptions = { ...assumptions };
    Object.assign(assumptions, sampledAssumptions);
    // Defensive guard: clamp pcpCount to prevent division by zero
    if (assumptions.pcpCount < 1) assumptions.pcpCount = 1;

    let model;
    try {
        // Compute model (skip multi-year for Year 1 MC iterations)
        model = computeModel({ skipMultiYear: true });
    } finally {
        // Restore original assumptions even if computeModel throws
        Object.assign(assumptions, originalAssumptions);
    }

    // Extract key outcomes based on selected funder
    const funder = (config && config.funding) || state.selectedFunding || 'bank';
    let sharedSavings = 0;
    let perPcpNet = 0;
    let hitTarget = false;

    const practiceBurden18mo = model.practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER;
    const { qualityPass } = computeQualityGate(sampledAssumptions, 1);

    switch (funder) {
        case 'bank':
            hitTarget = (model.targetSavings >= model.msrThreshold) && qualityPass;
            if (hitTarget) {
                sharedSavings = model.acoShare;
                perPcpNet = sampledAssumptions.pcpCount > 0
                    ? (model.bankNetY1 / sampledAssumptions.pcpCount) - practiceBurden18mo
                    : -practiceBurden18mo;
            } else {
                sharedSavings = 0;
                perPcpNet = -practiceBurden18mo;
            }
            break;
        case 'hospital':
            hitTarget = model.hospitalMeetsThreshold && qualityPass;
            sharedSavings = hitTarget ? model.hospitalAcoShare : 0;
            perPcpNet = hitTarget
                ? (sampledAssumptions.pcpCount > 0
                    ? (model.hospitalNetY1 / sampledAssumptions.pcpCount) - practiceBurden18mo
                    : -practiceBurden18mo)
                : -practiceBurden18mo;
            break;
        case 'pe':
            hitTarget = (model.targetSavings >= model.msrThreshold) && qualityPass;
            if (hitTarget) {
                sharedSavings = model.acoShare;
                perPcpNet = sampledAssumptions.pcpCount > 0
                    ? (model.peNetToPcps / sampledAssumptions.pcpCount) - practiceBurden18mo
                    : -practiceBurden18mo;
            } else {
                sharedSavings = 0;
                perPcpNet = -practiceBurden18mo;
            }
            break;
        case 'payer':
            hitTarget = (model.targetSavings >= model.msrThreshold) && qualityPass;
            if (hitTarget) {
                sharedSavings = model.acoShare;
                perPcpNet = sampledAssumptions.pcpCount > 0
                    ? model.payerNetPerPcp - practiceBurden18mo
                    : -practiceBurden18mo;
            } else {
                sharedSavings = 0;
                perPcpNet = -(practiceBurden18mo + model.payerClawbackPerPcp);
            }
            break;
    }

    return {
        sharedSavings,
        perPcpNet,
        hitTarget,
        qualityPass,
        sampledAssumptions
    };
}

export function computeMedian(sorted) {
    const n = sorted.length;
    if (n === 0) return 0;
    return n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];
}

export function computePercentile(sorted, p) {
    if (sorted.length === 0) return 0;
    return sorted[Math.min(Math.floor(sorted.length * p), sorted.length - 1)];
}

export function computeStdDev(values, mean) {
    if (values.length < 2) return 0;
    const sqDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    return Math.sqrt(variance);
}

// Analyze Monte Carlo results
export function analyzeResults(results, viewType) {
    const values = results.map(r => viewType === 'sharedSavings' ? r.sharedSavings : r.perPcpNet);
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    // Basic statistics
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const median = computeMedian(sorted);
    const stdDev = computeStdDev(values, mean);

    // Percentiles
    const p5 = computePercentile(sorted, 0.05);
    const p95 = computePercentile(sorted, 0.95);

    // Hit rate and loss probability
    const hitCount = results.filter(r => r.hitTarget).length;
    const hitRate = (hitCount / n) * 100;
    // For shared savings view, loss = $0 payout; for per-PCP view, loss = negative net
    const lossCount = values.filter(v => viewType === 'sharedSavings' ? v === 0 : v < 0).length;
    const probLoss = (lossCount / n) * 100;

    // Quality miss rate
    const qualityMissCount = results.filter(r => r.qualityPass === false).length;
    const qualityMissRate = (qualityMissCount / n) * 100;

    // Histogram bins
    const min = sorted[0];
    const max = sorted[n - 1];
    const bins = [];
    if (max === min) {
        // All values identical — single bin
        bins.push({ min, max: min, count: n, frequency: 1.0 });
    } else {
        const binWidth = (max - min) / MONTE_CARLO_CONFIG.histogramBins;
        for (let i = 0; i < MONTE_CARLO_CONFIG.histogramBins; i++) {
            const binMin = min + i * binWidth;
            const binMax = binMin + binWidth;
            const count = values.filter(v => v >= binMin && (i === MONTE_CARLO_CONFIG.histogramBins - 1 ? v <= binMax : v < binMax)).length;
            bins.push({
                min: binMin,
                max: binMax,
                count,
                frequency: count / n
            });
        }
    }

    return {
        mean,
        median,
        stdDev,
        p5,
        p95,
        min,
        max,
        hitRate,
        probLoss,
        qualityMissRate,
        bins,
        values,
        n
    };
}

export function getVariableLabel(varName) {
    const labels = {
        pcpCount: 'PCP Count',
        patientsPerPcp: 'Patients/PCP',
        tcocPerPatient: 'TCOC/Patient',
        savingsTargetPct: 'Target Savings %',
        payerSharePct: 'ACO Share of Savings %',
        msrPct: 'MSR %',
        multiYearSavingsTargetPct: 'Multi-Year Target Savings %',
        multiYearMsrPct: 'Multi-Year MSR %',
        qualityGatePct: 'Quality Gate Required %',
        dataAnalyticsCost: 'Data Analytics',
        careManagerRatio: 'Care Manager Ratio',
        careManagerSalary: 'Care Manager Salary',
        adminCost: 'Admin Cost',
        itCost: 'IT Cost',
        legalCost: 'Legal Cost',
        qualityCost: 'Quality Reporting',
        lostHoursPerWeek: 'Lost Hours/Wk',
        revenuePerVisit: 'Revenue/Visit',
        visitsPerHour: 'Visits/Hr',
        practiceStaffFtePerPcp: 'Staff FTE/PCP',
        practiceStaffSalary: 'Staff Salary',
        bankInterestRate: 'Interest Rate',
        bankTermMonths: 'Loan Term',
        bankOrigFee: 'Orig Fee',
        hospitalReferralLock: 'Referral Lock',
        hospitalCostPremium: 'Cost Premium',
        hospitalGainShare: 'Gain Share',
        hospitalReferralPct: 'Referral %',
        hospitalPremiumGrowthPct: 'Premium Growth',
        peEquityShare: 'PE Share',
        peBoardControl: 'Board Control',
        peExitYears: 'Exit Years',
        payerPmpm: 'PMPM',
        payerClawbackPct: 'Clawback %',
        payerPmpmRatchet: 'PMPM Ratchet',
        // RAF variables
        acoBaseRaf: 'ACO Starting RAF',
        regionalBaseRaf: 'Regional Market RAF',
        acoRafGrowthPct: 'ACO RAF Growth %',
        regionalRafGrowthPct: 'Regional RAF Growth %',
        rafOptimizationPeakYear: 'RAF Optimized by Year',
        rafOptimizationFloor: 'RAF Growth After Opt.',
        codingIntensityCap: 'Coding Intensity Cap',
        attributionPct: 'Attribution %',
        acoStartingQualityPct: 'Starting Quality Score',
        acoQualityImprovementPct: 'ACO Quality Improvement',
        qualityGateRatchetPct: 'Quality Gate Ratchet',
        acoMaxQualityPct: 'Max Quality',
        qualityGateCeiling: 'Quality Gate Ceiling',
        inflationPct: 'Inflation %',
        benchmarkRatchetPct: 'Benchmark Ratchet'
    };
    return labels[varName] || varName;
}

// Get explanation for why a variable impacts outcomes
export function getVariableExplanation(varName) {
    const explanations = {
        tcocPerPatient: {
            lower: 'Smaller savings pool - less total dollars to save',
            higher: 'Larger savings opportunity - more dollars in play'
        },
        patientsPerPcp: {
            lower: 'Smaller total TCOC base to generate savings from',
            higher: 'More patients = more total TCOC = larger savings potential'
        },
        lostHoursPerWeek: {
            lower: 'Less practice burden - fewer hours diverted from FFS',
            higher: 'More foregone FFS revenue as hours go to ACO work'
        },
        visitsPerHour: {
            lower: 'Each lost hour costs less in foregone FFS revenue',
            higher: 'Each lost hour costs more - higher opportunity cost'
        },
        revenuePerVisit: {
            lower: 'Lower opportunity cost per lost hour',
            higher: 'Higher opportunity cost - each diverted hour hurts more'
        },
        practiceStaffFtePerPcp: {
            lower: 'Lower practice overhead burden',
            higher: 'Higher practice staff costs eat into net'
        },
        practiceStaffSalary: {
            lower: 'Lower practice cost burden',
            higher: 'Higher salary increases practice overhead'
        },
        careManagerRatio: {
            lower: 'More CMs needed per patient = higher infrastructure cost',
            higher: 'Fewer CMs needed = lower infrastructure cost'
        },
        careManagerSalary: {
            lower: 'Lower infrastructure cost',
            higher: 'Higher salary increases ACO operations cost'
        },
        adminCost: {
            lower: 'More left for PCPs after ACO ops',
            higher: 'More retained by ACO, less distributed'
        },
        itCost: {
            lower: 'Lower overhead burden',
            higher: 'Higher overhead reduces distributable funds'
        },
        legalCost: {
            lower: 'Lower overhead burden',
            higher: 'Higher overhead reduces distributable funds'
        },
        qualityCost: {
            lower: 'Lower overhead burden',
            higher: 'Higher overhead reduces distributable funds'
        },
        dataAnalyticsCost: {
            lower: 'Lower overhead burden',
            higher: 'Higher overhead reduces distributable funds'
        },
        bankInterestRate: {
            lower: 'Lower loan cost over deferral period',
            higher: 'More interest capitalizes during 18-month deferral'
        },
        bankTermMonths: {
            lower: 'Higher monthly payments require larger Y1 reserve',
            higher: 'Lower monthly payments = smaller Y1 loan budget'
        },
        bankOrigFee: {
            lower: 'Lower total principal to repay',
            higher: 'Higher principal = more total loan cost'
        },
        hospitalReferralLock: {
            lower: 'Less referral volume subject to premium',
            higher: 'More referrals locked in at premium prices'
        },
        hospitalCostPremium: {
            lower: 'Lower hospital costs lead to higher shared savings',
            higher: 'Higher premium reduces shared savings'
        },
        hospitalGainShare: {
            lower: 'Hospital takes smaller cut',
            higher: 'Hospital takes more, PCPs get less'
        },
        hospitalReferralPct: {
            lower: 'Less TCOC goes to referrals at premium',
            higher: 'More TCOC subject to hospital premium'
        },
        hospitalPremiumGrowthPct: {
            lower: 'Slower premium growth preserves more realized savings over time',
            higher: 'Faster premium growth compounds hospital costs, eroding savings'
        },
        peEquityShare: {
            lower: 'PE takes smaller cut',
            higher: 'PE takes more, PCPs get less'
        },
        payerPmpm: {
            lower: 'Less deducted at reconciliation (but less operational funding)',
            higher: 'More operational funding, but more deducted or clawed back'
        },
        payerClawbackPct: {
            lower: 'Lower penalty if target missed',
            higher: 'Higher clawback risk if ACO misses'
        },
        msrPct: {
            lower: 'Easier threshold to achieve payout',
            higher: 'Harder to exceed minimum savings rate'
        },
        qualityGatePct: {
            lower: 'Easier quality threshold to pass',
            higher: 'Harder to achieve quality gate'
        },
        savingsTargetPct: {
            lower: 'Less total savings if target achieved',
            higher: 'More savings dollars if target achieved'
        },
        multiYearSavingsTargetPct: {
            lower: 'Lower annual target = less savings each year over projection',
            higher: 'Higher annual target = more savings potential but harder to sustain'
        },
        multiYearMsrPct: {
            lower: 'Easier threshold to achieve payout each year',
            higher: 'Harder to exceed MSR annually, more miss years likely'
        },
        payerSharePct: {
            lower: 'ACO keeps less of savings',
            higher: 'ACO keeps more of total savings'
        },
        pcpCount: {
            lower: 'Fewer docs = less total TCOC but higher per-doc share',
            higher: 'More docs = more TCOC but split among more physicians'
        },
        // RAF variables
        acoBaseRaf: {
            lower: 'Lower starting RAF = lower adjusted benchmark = harder to show savings',
            higher: 'Higher starting RAF = higher benchmark = easier to show savings'
        },
        regionalBaseRaf: {
            lower: 'Lower regional RAF means ACO looks relatively better',
            higher: 'Higher regional RAF means ACO looks relatively worse'
        },
        acoRafGrowthPct: {
            lower: 'Slower RAF improvement = less benchmark growth over time',
            higher: 'Faster RAF growth = benchmark grows faster, easier savings'
        },
        regionalRafGrowthPct: {
            lower: 'Slower regional growth = ACO gains relative advantage',
            higher: 'Faster regional growth erodes ACO\'s RAF advantage'
        },
        rafOptimizationPeakYear: {
            lower: 'Earlier peak = less total optimization opportunity',
            higher: 'Later peak = more years of strong RAF growth'
        },
        rafOptimizationFloor: {
            lower: 'Lower floor = less ongoing RAF growth after peak',
            higher: 'Higher floor = sustained RAF growth after optimization peaks'
        },
        codingIntensityCap: {
            lower: 'Lower cap limits RAF growth more aggressively',
            higher: 'Higher cap allows more RAF growth per year'
        },
        attributionPct: {
            lower: 'Fewer attributed patients = smaller savings pool',
            higher: 'More attributed patients = larger TCOC base for savings'
        },
        acoStartingQualityPct: {
            lower: 'Lower baseline quality = higher risk of failing quality gate',
            higher: 'Higher starting quality = easier to pass quality gate'
        },
        acoQualityImprovementPct: {
            lower: 'Slower quality gains = harder to keep pace with ratcheting gate',
            higher: 'Faster improvement = stays ahead of quality gate ratchet'
        },
        qualityGateRatchetPct: {
            lower: 'Slower ratchet = quality gate stays achievable longer',
            higher: 'Faster ratchet = quality gate rises quickly, risk of failure'
        },
        acoMaxQualityPct: {
            lower: 'Lower ceiling caps quality improvement sooner',
            higher: 'Higher ceiling allows continued quality gains'
        },
        qualityGateCeiling: {
            lower: 'Lower ceiling limits how high quality gate can ratchet',
            higher: 'Higher ceiling lets quality gate keep rising'
        },
        inflationPct: {
            lower: 'Lower cost growth preserves margins',
            higher: 'Higher inflation erodes savings and increases burden'
        },
        benchmarkRatchetPct: {
            lower: 'Slower benchmark reduction = easier to hit targets over time',
            higher: 'Faster ratchet = benchmark drops quickly, harder to show savings'
        }
    };
    return explanations[varName] || { lower: 'Reduces outcome', higher: 'Increases outcome' };
}
