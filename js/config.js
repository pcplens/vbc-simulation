// config.js - Configuration, presets, constants, and mutable state

export const assumptions = {
    // Network Size
    pcpCount: 100,
    patientsPerPcp: 1000,
    attributionPct: 80,         // % of total panel attributed to ACO (30-100%)

    // Financial Parameters
    tcocPerPatient: 10000,
    savingsTargetPct: 5,
    payerSharePct: 50,
    msrPct: 1.5,
    qualityGatePct: 80,

    // Infrastructure Costs
    dataAnalyticsCost: 450000,
    careManagerRatio: 5000,
    careManagerSalary: 80000,
    adminCost: 1000000,
    itCost: 150000,
    legalCost: 100000,
    qualityCost: 150000,

    // Per PCP Burden
    lostHoursPerWeek: 3,
    revenuePerVisit: 100,
    visitsPerHour: 3,
    practiceStaffFtePerPcp: 0.25,
    practiceStaffSalary: 50000,

    // Bank Parameters
    bankInterestRate: 8,
    bankTermMonths: 36,
    bankOrigFee: 1,

    // Hospital Parameters
    hospitalReferralLock: 60,
    hospitalCostPremium: 22,
    hospitalGainShare: 50,
    hospitalReferralPct: 30,

    // PE Parameters
    peEquityShare: 50,
    peBoardControl: 50,
    peExitYears: 5,

    // Payer Advance Parameters
    payerPmpm: 10,              // $1-$20 PMPM advance per patient
    payerClawbackPct: 75,       // 0-100% clawback if target missed
    payerPmpmRatchet: 75,       // 0-100% annual PMPM reduction

    // ACO Retention
    acoReservePct: 0.10,  // 10% reserve fund

    // Multi-Year Parameters
    multiYearCount: 10,             // 1-20 years to project
    inflationPct: 3,                // Annual inflation %
    hospitalPremiumGrowthPct: 2,    // Hospital premium annual growth %
    qualityGateRatchetPct: 2,       // Quality gate annual increase (1-10%)
    benchmarkRatchetPct: 1.0,       // % of savings baked into next year's benchmark
    applyInflationToExpenses: true,
    applyInflationToBurden: true,
    applyInflationToBenchmark: false,
    applyInflationToRatchet: false,

    // Multi-Year Contract Parameters (independent from Step 1 for what-if scenarios)
    multiYearSavingsTargetPct: 5,    // Initialized from savingsTargetPct
    multiYearMsrPct: 1.5,            // Initialized from msrPct

    // Quality Improvement Parameters (for multi-year quality ratcheting)
    acoStartingQualityPct: 80,       // ACO's baseline quality score in Year 1
    acoQualityImprovementPct: 3,     // Annual quality improvement rate
    acoMaxQualityPct: 90,            // Maximum achievable quality (ceiling)
    qualityGateCeiling: 95,          // Maximum quality gate % (prevents infinite ratcheting)

    // Risk Adjustment (HCC/RAF) Parameters
    enableRafAdjustment: true,       // Toggle RAF feature on/off
    acoBaseRaf: 1.0,                 // ACO's starting RAF score (0.8-1.5)
    regionalBaseRaf: 1.0,            // Market's starting RAF score (0.8-1.5)
    acoRafGrowthPct: 5,              // ACO's annual RAF improvement rate (0-15%)
    regionalRafGrowthPct: 3,         // Market's annual RAF growth rate (0-10%)
    rafOptimizationPeakYear: 3,      // Year by which most coding optimization is realized (1-5)
    rafOptimizationFloor: 1,         // RAF growth rate after optimization peaks (0-5%)
    codingIntensityCap: 3,           // CMS-style cap on annual RAF growth (0-10%)
    regionalRafSaturationEnabled: true  // If true, regional RAF also saturates
};

export const presetWorstCase = {
    pcpCount: 50,
    patientsPerPcp: 800,
    attributionPct: 70,
    tcocPerPatient: 12000,
    savingsTargetPct: 3,
    payerSharePct: 40,
    msrPct: 3,
    qualityGatePct: 80,
    dataAnalyticsCost: 600000,
    careManagerRatio: 4000,
    careManagerSalary: 90000,
    adminCost: 1200000,
    itCost: 250000,
    legalCost: 150000,
    qualityCost: 200000,
    lostHoursPerWeek: 5,
    revenuePerVisit: 80,
    visitsPerHour: 4,
    practiceStaffFtePerPcp: 0.35,
    practiceStaffSalary: 55000,
    bankInterestRate: 10,
    bankTermMonths: 24,
    bankOrigFee: 2,
    hospitalReferralLock: 75,
    hospitalCostPremium: 30,
    hospitalGainShare: 60,
    hospitalReferralPct: 35,
    peEquityShare: 60,
    peBoardControl: 60,
    peExitYears: 3,
    payerPmpm: 5,
    payerClawbackPct: 100,
    payerPmpmRatchet: 100,
    acoReservePct: 0.10,
    inflationPct: 5,
    hospitalPremiumGrowthPct: 3,
    qualityGateRatchetPct: 5,
    benchmarkRatchetPct: 2.0,
    applyInflationToExpenses: true,
    applyInflationToBurden: true,
    applyInflationToBenchmark: false,
    applyInflationToRatchet: false,
    multiYearSavingsTargetPct: 3,
    multiYearMsrPct: 3,
    acoStartingQualityPct: 80,
    acoQualityImprovementPct: 2,
    acoMaxQualityPct: 85,
    qualityGateCeiling: 98,
    // RAF Parameters (Worst: ACO starts behind, market grows faster)
    enableRafAdjustment: true,
    acoBaseRaf: 0.95,
    regionalBaseRaf: 1.05,
    acoRafGrowthPct: 3,
    regionalRafGrowthPct: 5,
    rafOptimizationPeakYear: 2,
    rafOptimizationFloor: 0.5,
    codingIntensityCap: 3,
    regionalRafSaturationEnabled: true,
    multiYearCount: 10
};

export const presetRealistic = {
    pcpCount: 100,
    patientsPerPcp: 1000,
    attributionPct: 80,
    tcocPerPatient: 10000,
    savingsTargetPct: 5,
    payerSharePct: 50,
    msrPct: 1.5,
    qualityGatePct: 80,
    dataAnalyticsCost: 450000,
    careManagerRatio: 5000,
    careManagerSalary: 80000,
    adminCost: 1000000,
    itCost: 150000,
    legalCost: 100000,
    qualityCost: 150000,
    lostHoursPerWeek: 3,
    revenuePerVisit: 100,
    visitsPerHour: 3,
    practiceStaffFtePerPcp: 0.25,
    practiceStaffSalary: 50000,
    bankInterestRate: 8,
    bankTermMonths: 36,
    bankOrigFee: 1,
    hospitalReferralLock: 60,
    hospitalCostPremium: 22,
    hospitalGainShare: 50,
    hospitalReferralPct: 30,
    peEquityShare: 50,
    peBoardControl: 50,
    peExitYears: 5,
    payerPmpm: 10,
    payerClawbackPct: 75,
    payerPmpmRatchet: 75,
    acoReservePct: 0.10,
    inflationPct: 3,
    hospitalPremiumGrowthPct: 2,
    qualityGateRatchetPct: 2,
    benchmarkRatchetPct: 1.0,
    applyInflationToExpenses: true,
    applyInflationToBurden: true,
    applyInflationToBenchmark: false,
    applyInflationToRatchet: false,
    multiYearSavingsTargetPct: 5,
    multiYearMsrPct: 1.5,
    acoStartingQualityPct: 82,
    acoQualityImprovementPct: 3,
    acoMaxQualityPct: 95,
    qualityGateCeiling: 95,
    // RAF Parameters (Realistic: ACO and market start equal)
    enableRafAdjustment: true,
    acoBaseRaf: 1.0,
    regionalBaseRaf: 1.0,
    acoRafGrowthPct: 5,
    regionalRafGrowthPct: 3,
    rafOptimizationPeakYear: 3,
    rafOptimizationFloor: 1,
    codingIntensityCap: 3,
    regionalRafSaturationEnabled: true,
    multiYearCount: 10
};

export const presetBestCase = {
    pcpCount: 150,
    patientsPerPcp: 1200,
    attributionPct: 90,
    tcocPerPatient: 8000,
    savingsTargetPct: 7,
    payerSharePct: 60,
    msrPct: 0,
    qualityGatePct: 80,
    dataAnalyticsCost: 300000,
    careManagerRatio: 6000,
    careManagerSalary: 70000,
    adminCost: 800000,
    itCost: 100000,
    legalCost: 75000,
    qualityCost: 100000,
    lostHoursPerWeek: 2,
    revenuePerVisit: 120,
    visitsPerHour: 2,
    practiceStaffFtePerPcp: 0.15,
    practiceStaffSalary: 45000,
    bankInterestRate: 6,
    bankTermMonths: 48,
    bankOrigFee: 0.5,
    hospitalReferralLock: 50,
    hospitalCostPremium: 15,
    hospitalGainShare: 40,
    hospitalReferralPct: 25,
    peEquityShare: 40,
    peBoardControl: 50,
    peExitYears: 7,
    payerPmpm: 15,
    payerClawbackPct: 50,
    payerPmpmRatchet: 50,
    acoReservePct: 0.10,
    inflationPct: 2,
    hospitalPremiumGrowthPct: 1,
    qualityGateRatchetPct: 1,
    benchmarkRatchetPct: 0.5,
    applyInflationToExpenses: true,
    applyInflationToBurden: true,
    applyInflationToBenchmark: false,
    applyInflationToRatchet: false,
    multiYearSavingsTargetPct: 7,
    multiYearMsrPct: 0,
    acoStartingQualityPct: 85,
    acoQualityImprovementPct: 5,
    acoMaxQualityPct: 95,
    qualityGateCeiling: 92,
    // RAF Parameters (Best: ACO starts ahead, market grows slowly)
    enableRafAdjustment: true,
    acoBaseRaf: 1.1,
    regionalBaseRaf: 0.95,
    acoRafGrowthPct: 8,
    regionalRafGrowthPct: 2,
    rafOptimizationPeakYear: 4,
    rafOptimizationFloor: 2,
    codingIntensityCap: 3,
    regionalRafSaturationEnabled: true,
    multiYearCount: 10
};

export const CONSTANTS = {
    DEFERRAL_MONTHS: 18,          // Months before ACO share payment arrives
    HIGH_RISK_PCT: 0.15,          // Percentage of patients considered high-risk
    WEEKS_PER_YEAR: 50,           // Working weeks for lost FFS calculation
    Y1_PAYMENT_MONTHS: 12,        // Loan payments covered by Year 1 ACO share
    MISS_SCENARIO_SAVINGS_PCT: 0.01,  // Assumed 1% savings in miss scenario
    BURDEN_18MO_MULTIPLIER: 1.5   // 18 months / 12 months for practice burden scaling
};

export const SLIDER_RANGES = {
    // Network & Contract (Group 1 & 2)
    pcpCount: { min: 1, max: 200, step: 1 },
    patientsPerPcp: { min: 50, max: 2000, step: 10 },
    attributionPct: { min: 30, max: 100, step: 1 },
    tcocPerPatient: { min: 5000, max: 20000, step: 500 },
    savingsTargetPct: { min: 0.5, max: 10, step: 0.5 },
    payerSharePct: { min: 25, max: 100, step: 5 },
    msrPct: { min: 0, max: 5, step: 0.5 },
    multiYearSavingsTargetPct: { min: 0.5, max: 10, step: 0.5 },
    multiYearMsrPct: { min: 0, max: 5, step: 0.5 },
    qualityGatePct: { min: 0, max: 95, step: 5 },
    // Infrastructure (Group 3)
    dataAnalyticsCost: { min: 200000, max: 800000, step: 50000 },
    careManagerRatio: { min: 3000, max: 7000, step: 500 },
    careManagerSalary: { min: 60000, max: 110000, step: 5000 },
    adminCost: { min: 500000, max: 2000000, step: 100000 },
    itCost: { min: 50000, max: 350000, step: 25000 },
    legalCost: { min: 50000, max: 200000, step: 25000 },
    qualityCost: { min: 50000, max: 250000, step: 25000 },
    // Practice Burden (Group 4)
    lostHoursPerWeek: { min: 1, max: 6, step: 0.5 },
    revenuePerVisit: { min: 60, max: 150, step: 10 },
    visitsPerHour: { min: 1, max: 5, step: 0.5 },
    practiceStaffFtePerPcp: { min: 0.1, max: 0.5, step: 0.05 },
    practiceStaffSalary: { min: 40000, max: 70000, step: 5000 },
    // Bank-specific (Group 5)
    bankInterestRate: { min: 5, max: 15, step: 0.5 },
    bankTermMonths: { min: 24, max: 60, step: 6 },
    bankOrigFee: { min: 0, max: 3, step: 0.5 },
    // Hospital-specific (Group 5)
    hospitalReferralLock: { min: 10, max: 100, step: 5 },
    hospitalCostPremium: { min: 10, max: 40, step: 2 },
    hospitalGainShare: { min: 30, max: 70, step: 5 },
    hospitalReferralPct: { min: 20, max: 40, step: 2 },
    hospitalPremiumGrowthPct: { min: 0, max: 10, step: 0.5 },
    // PE-specific (Group 5)
    peEquityShare: { min: 30, max: 70, step: 5 },
    peBoardControl: { min: 40, max: 70, step: 5 },
    peExitYears: { min: 3, max: 10, step: 1 },
    // Payer-specific (Group 5)
    payerPmpm: { min: 1, max: 20, step: 1 },
    payerClawbackPct: { min: 0, max: 100, step: 5 },
    payerPmpmRatchet: { min: 0, max: 100, step: 5 },
    // RAF Parameters (Group 6)
    acoBaseRaf: { min: 0.8, max: 1.5, step: 0.05 },
    regionalBaseRaf: { min: 0.8, max: 1.5, step: 0.05 },
    acoRafGrowthPct: { min: 0, max: 15, step: 1 },
    regionalRafGrowthPct: { min: 0, max: 10, step: 1 },
    rafOptimizationPeakYear: { min: 1, max: 5, step: 1 },
    rafOptimizationFloor: { min: 0, max: 5, step: 0.5 },
    codingIntensityCap: { min: 0, max: 10, step: 1 },
    // Quality Parameters
    acoStartingQualityPct: { min: 50, max: 95, step: 1 },
    acoQualityImprovementPct: { min: 0, max: 10, step: 0.5 },
    qualityGateRatchetPct: { min: 0, max: 10, step: 1 },
    acoMaxQualityPct: { min: 80, max: 100, step: 1 },
    qualityGateCeiling: { min: 0, max: 100, step: 1 },
    // Inflation Parameters
    inflationPct: { min: 0, max: 10, step: 0.5 },
    // Benchmark Ratchet (Contract term)
    benchmarkRatchetPct: { min: 0, max: 5, step: 0.5 }
};

// Funder-specific variables should only be sampled/analyzed for the active funding model.
export const FUNDER_VARIABLES = {
    bank: ['bankInterestRate', 'bankTermMonths', 'bankOrigFee'],
    hospital: ['hospitalGainShare', 'hospitalReferralPct', 'hospitalReferralLock', 'hospitalCostPremium', 'hospitalPremiumGrowthPct'],
    pe: ['peEquityShare', 'peBoardControl', 'peExitYears'],
    payer: ['payerPmpm', 'payerClawbackPct', 'payerPmpmRatchet']
};
export const ALL_FUNDER_SPECIFIC_VARIABLES = new Set(Object.values(FUNDER_VARIABLES).flat());

export const MC_FUNDER_TOOLTIPS = {
    bankInterestRate: 'Annual interest rate on the bank loan. Interest capitalizes during the 18-month deferral period before payments begin.',
    bankTermMonths: 'Repayment period for the bank loan after the 18-month deferral. Longer terms mean lower monthly payments but more total interest.',
    bankOrigFee: 'One-time fee charged by the lender at loan origination, typically 1-3% of loan amount.',
    hospitalGainShare: 'Percentage of ACO shared savings paid to the hospital as their return on investment.',
    hospitalReferralLock: 'Percentage of referrals the ACO must send to hospital facilities. Higher lock-in means less flexibility to use lower-cost providers.',
    hospitalCostPremium: 'How much more hospital-based facilities charge compared to independent providers for the same service.',
    hospitalReferralPct: 'What percentage of total healthcare spending goes to specialist referrals, imaging, and procedures. Typically 25-35% of TCOC.',
    hospitalPremiumGrowthPct: 'Annual growth rate of hospital premium costs. Higher growth means the hospital cost premium compounds more each year, reducing realized savings.',
    peEquityShare: 'Percentage of ACO net distributable savings paid to the PE firm based on their equity ownership.',
    peBoardControl: 'Percentage of ACO board seats controlled by the PE firm. Higher control = less physician autonomy in ACO governance.',
    peExitYears: 'Target number of years before the PE firm seeks to exit the investment, typically through sale or IPO.',
    payerPmpm: 'Monthly per-member-per-month payment from payer during operations. Higher PMPM means more upfront cash but larger deduction from ACO share.',
    payerClawbackPct: 'Percentage of advance the payer reclaims if ACO misses targets. 100% means full clawback; lower percentages mean the payer absorbs some loss.',
    payerPmpmRatchet: 'Percentage by which PMPM is reduced each year during contract renewals. 100% ratchet means PMPM drops to $0 after Year 1.'
};

export const YEAR1_EXCLUDED_VARS = new Set(['multiYearSavingsTargetPct', 'multiYearMsrPct', 'hospitalPremiumGrowthPct']);
export const MULTI_YEAR_EXCLUDED_VARS = new Set(['savingsTargetPct', 'msrPct']);

export function isVariableApplicableForFunding(varName, funding) {
    if (!ALL_FUNDER_SPECIFIC_VARIABLES.has(varName)) return true;
    const activeFunding = funding || state.selectedFunding || 'bank';
    const allowedVars = FUNDER_VARIABLES[activeFunding] || [];
    return allowedVars.includes(varName);
}

export function getMonteCarloVariableKeys(funding, simulationType) {
    return Object.keys(SLIDER_RANGES).filter(varName => {
        if (!isVariableApplicableForFunding(varName, funding)) return false;
        if (simulationType === 'year1' && YEAR1_EXCLUDED_VARS.has(varName)) return false;
        if (simulationType === 'multiYear' && MULTI_YEAR_EXCLUDED_VARS.has(varName)) return false;
        return true;
    });
}

export const MONTE_CARLO_CONFIG = {
    batchSize: 100,
    histogramBins: 25
};

export const FUNDING_CONFIG = {
    bank: {
        shortName: 'Bank Loan',
        fullName: 'Bank Loan (Self-Fund)',
        partnerName: 'Bank Loan'
    },
    hospital: {
        shortName: 'Hospital Partner',
        fullName: 'Hospital Partner (PHO)',
        partnerName: 'Hospital Partnership'
    },
    payer: {
        shortName: 'Payer Advance',
        fullName: 'Payer Advance (Prospective PMPM)',
        partnerName: 'Payer Partnership'
    },
    pe: {
        shortName: 'Private Equity',
        fullName: 'Private Equity Partner',
        partnerName: 'PE Partnership'
    }
};

export const PRESETS = {
    worst: presetWorstCase,
    realistic: presetRealistic,
    best: presetBestCase
};

export const state = {
    currentStep: 0,
    selectedFunding: null,
    activePreset: null,
    step5Initialized: false,
    currentMultiYearView: 'financial',
    currentMonteCarloView: 'sharedSavings',
    currentMultiYearMonteCarloView: 'sharedSavings',
    currentMultiYearTornadoMode: 'deterministic',
    currentYear1TornadoMode: 'deterministic',
    domBindingsCache: null,
    currentMcTab: 'year1'
};

// Default hold constant configuration (used to reset variables to their default state)
export const DEFAULT_HOLD_CONSTANT = {
    savingsTargetPct: true,
    payerSharePct: true,
    msrPct: true,
    multiYearSavingsTargetPct: true,
    multiYearMsrPct: true,
    benchmarkRatchetPct: true,
    pcpCount: true,
    patientsPerPcp: true,
    qualityGatePct: true,
    acoStartingQualityPct: true,
    acoMaxQualityPct: true,
    acoBaseRaf: true,
    regionalBaseRaf: true,
    codingIntensityCap: true,
    qualityGateCeiling: true,
    inflationPct: true
};

export const DEFAULT_VARY_ENABLED = {
    attributionPct: true,
    tcocPerPatient: true,
    dataAnalyticsCost: true,
    careManagerRatio: true,
    careManagerSalary: true,
    adminCost: true,
    itCost: true,
    legalCost: true,
    qualityCost: true,
    lostHoursPerWeek: true,
    revenuePerVisit: true,
    visitsPerHour: true,
    practiceStaffFtePerPcp: true,
    practiceStaffSalary: true,
    bankInterestRate: true,
    bankTermMonths: true,
    bankOrigFee: true,
    hospitalReferralLock: true,
    hospitalCostPremium: true,
    hospitalGainShare: true,
    hospitalReferralPct: true,
    hospitalPremiumGrowthPct: true,
    peEquityShare: true,
    peBoardControl: false,
    peExitYears: false,
    payerPmpm: true,
    payerClawbackPct: true,
    payerPmpmRatchet: true,
    acoQualityImprovementPct: true,
    qualityGateRatchetPct: true,
    acoRafGrowthPct: true,
    regionalRafGrowthPct: true,
    rafOptimizationPeakYear: true,
    rafOptimizationFloor: true
};

// Monte Carlo state (unified for Year 1 and Multi-Year)
export let monteCarloState = {
    isRunning: false,
    results: null,
    basePreset: 'realistic',
    variationPct: 50,
    useTriangular: false,
    iterations: 1000,
    // Cached results for tab switching
    year1Results: null,       // Cached Year 1 simulation results
    multiYearPaths: null,     // Cached Multi-Year simulation paths
    multiYearResults: null,   // Cached Multi-Year analyzed results
    year1Dirty: true,         // True if sliders changed since last Year 1 run
    multiYearDirty: true,     // True if sliders changed since last Multi-Year run
    customConstants: {},
    holdConstant: Object.assign({}, DEFAULT_HOLD_CONSTANT),
    varyEnabled: Object.assign({}, DEFAULT_VARY_ENABLED),
    // Multi-Year specific config
    multiYearConfig: {
        yearsToProject: 10
    },
    // Multi-Year specific state
    paths: null,
    useQMC: true
};
