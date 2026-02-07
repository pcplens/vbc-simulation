        // ============================================
        // ASSUMPTIONS OBJECT - Central State
        // ============================================
        const assumptions = {
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
            peBoardControl: 51,
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

        // ============================================
        // PRESET CONFIGURATIONS
        // ============================================
        const presetWorstCase = {
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

        const presetRealistic = {
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
            peBoardControl: 51,
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
            acoMaxQualityPct: 90,
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

        const presetBestCase = {
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

        // ============================================
        // CONSTANTS - Fixed business rules (not user-configurable)
        // ============================================
        const CONSTANTS = {
            DEFERRAL_MONTHS: 18,          // Months before ACO share payment arrives
            HIGH_RISK_PCT: 0.15,          // Percentage of patients considered high-risk
            WEEKS_PER_YEAR: 50,           // Working weeks for lost FFS calculation
            Y1_PAYMENT_MONTHS: 12,        // Loan payments covered by Year 1 ACO share
            MISS_SCENARIO_SAVINGS_PCT: 0.01,  // Assumed 1% savings in miss scenario
            BURDEN_18MO_MULTIPLIER: 1.5   // 18 months / 12 months for practice burden scaling
        };

        // ============================================
        // SLIDER RANGES - Min/max for Monte Carlo sampling
        // ============================================
        const SLIDER_RANGES = {
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
            hospitalReferralLock: { min: 30, max: 80, step: 5 },
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
        const FUNDER_VARIABLES = {
            bank: ['bankInterestRate', 'bankTermMonths', 'bankOrigFee'],
            hospital: ['hospitalReferralLock', 'hospitalCostPremium', 'hospitalGainShare', 'hospitalReferralPct', 'hospitalPremiumGrowthPct'],
            pe: ['peEquityShare', 'peBoardControl', 'peExitYears'],
            payer: ['payerPmpm', 'payerClawbackPct', 'payerPmpmRatchet']
        };
        const ALL_FUNDER_SPECIFIC_VARIABLES = new Set(Object.values(FUNDER_VARIABLES).flat());

        const YEAR1_EXCLUDED_VARS = new Set(['multiYearSavingsTargetPct', 'multiYearMsrPct']);
        const MULTI_YEAR_EXCLUDED_VARS = new Set(['savingsTargetPct', 'msrPct']);

        function isVariableApplicableForFunding(varName, funding) {
            if (!ALL_FUNDER_SPECIFIC_VARIABLES.has(varName)) return true;
            const activeFunding = funding || selectedFunding || 'bank';
            const allowedVars = FUNDER_VARIABLES[activeFunding] || [];
            return allowedVars.includes(varName);
        }

        function getMonteCarloVariableKeys(funding, simulationType) {
            return Object.keys(SLIDER_RANGES).filter(varName => {
                if (!isVariableApplicableForFunding(varName, funding)) return false;
                if (simulationType === 'year1' && YEAR1_EXCLUDED_VARS.has(varName)) return false;
                if (simulationType === 'multiYear' && MULTI_YEAR_EXCLUDED_VARS.has(varName)) return false;
                return true;
            });
        }

        // ============================================
        // MONTE CARLO CONFIGURATION
        // ============================================
        const MONTE_CARLO_CONFIG = {
            batchSize: 100,
            histogramBins: 25
        };

        // ============================================
        // FUNDING CONFIGURATION
        // ============================================
        const FUNDING_CONFIG = {
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

        // ============================================
        // PRESETS MAP
        // ============================================
        const PRESETS = {
            worst: presetWorstCase,
            realistic: presetRealistic,
            best: presetBestCase
        };

        // ============================================
        // STATE VARIABLES
        // ============================================
        let currentStep = 0;
        let selectedFunding = null;
        let activePreset = null;
        let step5Initialized = false;
        let currentMultiYearView = 'financial';  // 'financial' or 'quality'
        let currentMonteCarloView = 'sharedSavings';  // 'sharedSavings' or 'perPcp'
        let currentMultiYearMonteCarloView = 'sharedSavings';  // 'sharedSavings' or 'perPcp' for Multi-Year MC
        let currentMultiYearTornadoMode = 'deterministic';  // 'deterministic' or 'correlation'
        let currentYear1TornadoMode = 'deterministic';  // 'deterministic' or 'correlation'

        // Default hold constant configuration (used to reset variables to their default state)
        const DEFAULT_HOLD_CONSTANT = {
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

        const DEFAULT_VARY_ENABLED = {
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
            peBoardControl: true,
            peExitYears: true,
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
        let monteCarloState = {
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


        // ============================================
        // MULTI-YEAR MONTE CARLO CONFIGURATION
        // ============================================

        // Joe-Kuo Sobol direction numbers for Quasi-Monte Carlo (160 dimensions)
        // Source: https://web.maths.unsw.edu.au/~fkuo/sobol/
        // Format: [s, a, m1, m2, ...] where s = degree, a = polynomial coeff, m = initial directions
        const SOBOL_PRIMITIVES = [
            // Dimension 1 is special (handled separately)
            // Dimensions 2-160 encoded as [degree, polynomial_a, m1, m2, ...]
            [1,0,1],
            [2,1,1,3],
            [3,1,1,3,1],
            [3,2,1,1,1],
            [4,1,1,1,3,3],
            [4,4,1,3,5,13],
            [5,2,1,1,5,5,17],
            [5,4,1,1,5,5,5],
            [5,7,1,1,7,11,19],
            [5,11,1,1,5,1,1],
            [5,13,1,1,1,3,11],
            [5,14,1,3,5,5,31],
            [6,1,1,3,3,9,7,49],
            [6,13,1,1,1,15,21,21],
            [6,16,1,3,1,13,27,49],
            [6,19,1,1,1,15,7,5],
            [6,22,1,3,1,15,13,25],
            [6,25,1,1,5,5,19,61],
            [7,1,1,3,7,11,23,125,95],
            [7,4,1,3,7,5,29,17,89],
            [7,7,1,1,7,15,13,47,1],
            [7,8,1,3,1,5,13,101,27],
            [7,14,1,1,1,7,31,63,71],
            [7,19,1,1,3,5,1,63,37],
            [7,21,1,3,7,5,21,45,111],
            [7,28,1,3,1,3,31,59,117],
            [7,31,1,1,7,11,17,41,79],
            [7,32,1,3,3,13,9,41,17],
            [7,37,1,1,5,7,21,21,59],
            [7,41,1,1,7,3,17,83,97],
            [7,42,1,3,7,3,13,81,119],
            [7,50,1,1,1,15,27,107,5],
            [7,55,1,1,3,7,11,49,81],
            [7,56,1,3,5,11,1,19,67],
            [7,59,1,1,7,9,11,41,127],
            [7,62,1,3,3,5,3,115,73],
            [8,14,1,1,5,11,3,9,59,245],
            [8,21,1,1,1,15,31,49,103,165],
            [8,22,1,1,3,1,31,123,45,217],
            [8,38,1,3,1,5,23,61,61,15],
            [8,47,1,1,1,5,11,37,97,185],
            [8,49,1,3,7,15,17,119,17,157],
            [8,50,1,1,3,9,25,93,59,203],
            [8,52,1,3,1,15,25,23,41,69],
            [8,56,1,1,7,3,29,51,81,173],
            [8,67,1,3,5,15,25,93,37,51],
            [8,70,1,3,1,11,13,39,73,181],
            [8,84,1,3,7,15,9,69,23,141],
            [8,97,1,3,3,11,19,73,65,85],
            [8,103,1,3,5,3,7,113,53,137],
            [8,115,1,3,1,9,15,93,83,159],
            [8,122,1,1,1,13,17,87,115,105],
            [9,8,1,3,7,1,17,93,63,231,49],
            [9,13,1,3,3,1,3,81,3,81,205],
            [9,16,1,1,5,5,19,45,83,209,1],
            [9,22,1,3,1,11,9,123,63,205,43],
            [9,25,1,1,3,1,7,77,127,115,213],
            [9,44,1,1,1,5,9,75,107,21,5],
            [9,47,1,3,5,9,31,51,19,19,219],
            [9,52,1,3,1,11,27,71,57,9,147],
            [9,55,1,1,7,7,9,31,61,137,175],
            [9,59,1,1,5,15,31,17,55,81,87],
            [9,62,1,1,5,7,1,17,55,49,33],
            [9,67,1,3,3,9,9,63,55,89,201],
            [9,74,1,1,7,11,21,37,115,61,165],
            [9,81,1,3,5,7,5,49,5,161,117],
            [9,82,1,1,5,13,21,77,121,169,123],
            [9,87,1,1,1,11,23,85,123,193,113],
            [9,91,1,3,1,15,5,97,83,17,89],
            [9,94,1,3,5,9,3,53,105,89,199],
            [9,103,1,1,7,3,9,67,39,125,5],
            [9,104,1,1,1,3,13,3,103,85,213],
            [9,109,1,1,7,5,11,63,115,105,253],
            [9,122,1,1,3,13,27,101,13,31,99],
            [9,124,1,3,7,13,17,37,45,121,155],
            [9,137,1,3,7,7,21,53,37,117,215],
            [9,138,1,1,1,9,31,99,101,171,31],
            [9,143,1,3,3,1,3,125,41,181,183],
            [9,145,1,3,1,7,25,7,13,207,241],
            [9,152,1,1,5,9,29,89,105,27,215],
            [9,157,1,3,5,15,25,13,97,211,31],
            [9,167,1,1,3,5,23,117,27,53,123],
            [9,173,1,1,5,5,25,61,73,25,169],
            [9,176,1,3,1,9,5,123,97,193,117],
            [9,181,1,1,5,11,13,55,41,169,255],
            [9,182,1,3,7,11,5,97,81,189,29],
            [9,185,1,1,7,15,31,35,127,73,59],
            [9,191,1,1,1,13,9,83,59,97,91],
            [10,4,1,1,7,11,13,101,117,209,255,213],
            [10,13,1,3,7,3,17,19,5,185,205,189],
            [10,19,1,3,1,11,25,21,61,113,73,123],
            [10,21,1,3,1,5,9,61,63,245,109,21],
            [10,28,1,3,7,7,23,55,27,97,227,243],
            [10,31,1,1,3,3,21,87,115,49,5,161],
            [10,38,1,1,1,7,21,123,1,49,203,185],
            [10,44,1,1,7,15,15,99,103,43,11,51],
            [10,50,1,1,7,7,21,119,123,189,237,127],
            [10,52,1,3,7,13,9,73,17,201,51,201],
            [10,55,1,1,1,15,21,117,59,245,119,79],
            [10,61,1,3,7,3,9,79,33,181,83,143],
            [10,62,1,1,5,3,5,77,117,239,169,51],
            [10,67,1,3,5,5,21,127,111,141,245,123],
            [10,74,1,1,3,5,25,87,7,161,205,189],
            [10,81,1,1,1,7,25,79,89,221,17,99],
            [10,91,1,3,1,9,5,87,9,221,165,59],
            [10,98,1,1,7,7,31,13,91,189,89,243],
            [10,100,1,3,3,15,19,97,117,75,147,165],
            [10,103,1,1,5,1,23,71,21,241,137,219],
            [10,109,1,1,1,15,17,63,51,193,5,117],
            [10,115,1,3,3,15,11,97,59,75,31,131],
            [10,116,1,3,5,9,23,83,7,45,251,177],
            [10,121,1,1,7,15,15,117,61,149,177,107],
            [10,128,1,1,3,9,25,61,33,229,143,83],
            [10,134,1,1,1,15,7,111,99,245,243,97],
            [10,137,1,3,7,7,13,121,53,103,5,219],
            [10,152,1,3,5,7,9,59,45,145,131,125],
            [10,157,1,1,5,3,27,77,97,181,217,75],
            [10,161,1,1,1,3,5,19,33,37,45,15],
            [10,164,1,1,7,13,27,43,37,141,37,219],
            [10,167,1,3,3,15,9,49,31,219,205,51],
            [10,173,1,1,5,9,31,115,3,127,113,67],
            [10,176,1,1,3,15,25,75,61,245,115,145],
            [10,181,1,3,5,11,19,65,127,241,105,195],
            [10,185,1,1,7,3,1,37,109,87,191,141],
            [10,196,1,3,5,5,5,5,77,193,119,239],
            [10,203,1,1,3,3,23,69,119,181,69,95],
            [10,206,1,1,1,9,17,105,49,169,81,67],
            [10,211,1,1,7,13,1,69,45,117,51,9],
            [10,224,1,1,5,15,9,55,123,237,111,21],
            [10,227,1,3,1,1,25,117,3,173,139,91],
            [10,236,1,1,7,5,21,27,121,127,59,135],
            [10,247,1,1,5,1,31,109,111,159,53,51],
            [10,254,1,1,7,9,1,123,123,9,27,187],
            [10,268,1,3,1,5,25,87,93,203,167,225],
            [10,273,1,1,5,7,23,119,83,5,113,15],
            [10,289,1,3,7,15,23,27,73,45,83,63],
            [10,292,1,1,5,15,9,123,37,49,185,89],
            [10,304,1,3,3,9,31,127,49,201,223,87],
            [10,307,1,3,1,5,17,75,119,113,151,135],
            [10,316,1,1,7,1,9,93,73,157,17,73],
            [10,319,1,3,5,5,19,125,93,179,155,245],
            [10,322,1,3,3,1,21,91,101,197,219,195],
            [10,331,1,3,3,9,1,101,123,181,63,131],
            [10,343,1,1,7,15,25,115,51,153,23,209],
            [10,356,1,3,3,1,13,15,7,185,73,187],
            [10,359,1,3,1,7,29,15,69,57,63,35],
            [10,361,1,3,3,7,21,83,23,221,229,147],
            [10,370,1,1,5,9,29,47,91,115,223,175],
            // Dimensions 150-160: Joe-Kuo-6 direction numbers (new-joe-kuo-6.21201)
            [10,422,1,3,7,7,1,19,91,249,357,589],
            [10,426,1,1,1,9,1,25,109,197,279,411],
            [10,428,1,3,1,15,23,57,59,135,191,75],
            [10,433,1,1,5,15,29,21,39,253,383,349],
            [10,446,1,3,3,5,19,45,61,151,199,981],
            [10,454,1,3,5,13,9,61,107,141,141,1],
            [10,457,1,3,1,11,27,25,85,105,309,979],
            [10,472,1,3,3,11,19,7,115,223,349,43],
            [10,493,1,1,7,9,21,39,123,21,275,927],
            [10,505,1,1,7,13,15,41,47,243,303,437],
            [10,508,1,1,1,7,7,3,15,99,409,719]
        ];

        // Build Sobol direction vectors from primitives (160 dimensions)
        const SOBOL_DIRECTIONS = (function() {
            const L = 32;  // bits
            const directions = [];

            // Dimension 1: special case
            const dim1 = new Uint32Array(L);
            for (let i = 0; i < L; i++) {
                dim1[i] = 1 << (31 - i);
            }
            directions.push(dim1);

            // Dimensions 2-160: use Joe-Kuo primitives
            for (let d = 0; d < SOBOL_PRIMITIVES.length; d++) {
                const prim = SOBOL_PRIMITIVES[d];
                const s = prim[0];           // degree
                const a = prim[1];           // polynomial coefficients
                const m = prim.slice(2);     // initial direction numbers

                const V = new Uint32Array(L);

                // Initialize first s direction numbers from table
                for (let i = 0; i < s; i++) {
                    V[i] = m[i] << (31 - i);
                }

                // Compute remaining direction numbers via recurrence
                for (let i = s; i < L; i++) {
                    V[i] = V[i - s] ^ (V[i - s] >>> s);
                    for (let k = 1; k < s; k++) {
                        if ((a >>> (s - 1 - k)) & 1) {
                            V[i] ^= V[i - k];
                        }
                    }
                }

                directions.push(V);
            }

            return directions;
        })();

        // Generate Sobol sequence value for given index and dimension
        // Supports 160 dimensions (sufficient for 20-year projections with 8 vars/year)
        function sobolSequence(index, dimension) {
            if (dimension >= SOBOL_DIRECTIONS.length) {
                // Fallback to pseudo-random for dimensions beyond 160
                return Math.random();
            }

            let result = 0;
            const directions = SOBOL_DIRECTIONS[dimension];

            // Use Gray code for efficient computation
            let grayCode = index ^ (index >>> 1);
            for (let bit = 0; bit < 32 && grayCode > 0; bit++) {
                if (grayCode & 1) {
                    result ^= directions[bit];
                }
                grayCode >>>= 1;
            }

            return (result >>> 0) / 4294967296;  // Convert to unsigned, normalize to [0, 1]
        }

        // ============================================
        // COMPUTE HELPERS - Domain-specific calculations
        // ============================================

        // Compute single-year RAF growth rates with saturation curve
        // Accepts growth rates as parameters so callers can pass shock-overridden values
        function computeRafGrowthRates(a, year, acoRafGrowthPct, regionalRafGrowthPct) {
            // ACO growth with saturation curve
            let acoGrowthRate;
            if (year <= a.rafOptimizationPeakYear) {
                acoGrowthRate = acoRafGrowthPct;
            } else {
                const yearsAfterPeak = year - a.rafOptimizationPeakYear;
                const decayFactor = Math.pow(0.5, yearsAfterPeak);
                acoGrowthRate = a.rafOptimizationFloor +
                    (acoRafGrowthPct - a.rafOptimizationFloor) * decayFactor;
            }
            acoGrowthRate = Math.min(acoGrowthRate, a.codingIntensityCap);

            // Regional RAF growth (constant OR with saturation)
            let regionalGrowthRate;
            if (a.regionalRafSaturationEnabled && year > a.rafOptimizationPeakYear) {
                const yearsAfterPeak = year - a.rafOptimizationPeakYear;
                const decayFactor = Math.pow(0.5, yearsAfterPeak);
                regionalGrowthRate = a.rafOptimizationFloor +
                    (regionalRafGrowthPct - a.rafOptimizationFloor) * decayFactor;
            } else {
                regionalGrowthRate = regionalRafGrowthPct;
            }

            return { acoGrowthRate, regionalGrowthRate };
        }

        // RAF Adjustment calculation for benchmark modification
        function computeRafAdjustment(a, year) {
            if (!a.enableRafAdjustment) {
                return { acoRaf: 1.0, regionalRaf: 1.0, rafRatio: 1.0, isBelowMarket: false };
            }

            let acoRaf = a.acoBaseRaf;
            let regionalRaf = a.regionalBaseRaf;

            for (let y = 2; y <= year; y++) {
                const rates = computeRafGrowthRates(a, y, a.acoRafGrowthPct, a.regionalRafGrowthPct);
                acoRaf *= (1 + rates.acoGrowthRate / 100);
                regionalRaf *= (1 + rates.regionalGrowthRate / 100);
            }

            const rafRatio = Math.abs(regionalRaf) > 1e-10 ? acoRaf / regionalRaf : 1.0;
            return {
                acoRaf,
                regionalRaf,
                rafRatio,
                isBelowMarket: rafRatio < 1.0
            };
        }

        function computeCore(a) {
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

        function computeInfrastructure(a, totalPatients) {
            const highRiskPatients = totalPatients * CONSTANTS.HIGH_RISK_PCT;
            const careManagersNeeded = a.careManagerRatio > 0 ? Math.ceil(highRiskPatients / a.careManagerRatio) : 0;
            const careManagementCost = careManagersNeeded * a.careManagerSalary;
            const totalInfrastructure = a.dataAnalyticsCost + careManagementCost + a.adminCost + a.itCost + a.legalCost + a.qualityCost;
            return { highRiskPatients, careManagersNeeded, careManagementCost, totalInfrastructure };
        }

        function computePracticeBurden(a) {
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

        function amortize(principal, monthlyRate, termMonths) {
            if (Math.abs(monthlyRate) < 1e-10) return principal / termMonths;
            const factor = Math.pow(1 + monthlyRate, termMonths);
            return principal * monthlyRate * factor / (factor - 1);
        }

        function inflationMultiplier(inflationPct, year) {
            return Math.pow(1 + inflationPct / 100, year - 1);
        }

        function computeBankLoan(a, fundingNeeded, acoShare, acoOperationalRetention, acoReserveFund) {
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

        function computeHospital(a, totalTcoc, targetSavings, msrThreshold, acoOperationalRetention) {
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

        function computePE(a, netDistributableShare) {
            const peShare = netDistributableShare * (a.peEquityShare / 100);
            const peNetToPcps = netDistributableShare - peShare;
            return { peShare, peNetToPcps };
        }

        function computePayerAdvance(a, totalPatients, acoShare, acoOperationalRetention, acoReserveFund) {
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

            return {
                payerMonthlyPmpm,
                payerTotalAdvance18mo,
                payerAnnualAdvance,
                payerAdvanceDeduction,
                payerNetDistributable,
                payerClawbackAmount,
                payerClawbackPerPcp,
                payerIsUnderwater,
                payerUnderwaterAmount
            };
        }

        // ============================================
        // MULTI-YEAR PROJECTION FUNCTIONS
        // ============================================

        function computeHospitalPremiumForYear(totalTcoc, year, a, fundingType) {
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
        function computeYearFinancials(params) {
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
                multiYearSavingsTargetPct,
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
            if (funding === 'payer') {
                payerAdvanceAmount = currentPmpm * attributedPatients * 12;
                if (acoShare > 0) {
                    payerAdvanceDeduction = Math.min(payerAdvanceAmount, acoShare);
                    fundingDeduction = payerAdvanceDeduction;
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
            const netToPcps = Math.max(0, acoShare - opsRetention - reserveContribution - fundingDeduction) - payerClawback;

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

        function computeMultiYear(scenario, baseModel, fundingType) {
            // scenario: 'hit' or 'miss'
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
            // Use attributed patients for PMPM calculations
            const totalPanelPatients = a.pcpCount * a.patientsPerPcp;
            const attributedPatients = Math.round(totalPanelPatients * (a.attributionPct / 100));

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
                const qualityGateCeiling = a.qualityGateCeiling ?? 95;
                const qualityGateRequired = Math.min(qualityGateCeiling, a.qualityGatePct + (year - 1) * a.qualityGateRatchetPct);

                // ACO's achieved quality: starts at baseline, improves annually, capped at max and 100%
                const rawAchievedQuality = a.acoStartingQualityPct + (year - 1) * a.acoQualityImprovementPct;
                const achievedQuality = Math.min(100, a.acoMaxQualityPct, rawAchievedQuality);
                const qualityPass = achievedQuality >= qualityGateRequired;
                const qualityMargin = achievedQuality - qualityGateRequired;
                const atQualityCeiling = rawAchievedQuality >= a.acoMaxQualityPct;

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

                // Savings rate: hit path aims for target but capped by achievable; miss path uses fixed 1%
                let savingsPct;
                let isCapped = false;
                if (scenario === 'hit') {
                    // Pre-compute achievable to determine capping (helper also computes this)
                    const preMaxSavings = rafAdjustedBenchmark > 0
                        ? (Math.max(0, rafAdjustedBenchmark - minAchievableCost) / rafAdjustedBenchmark) * 100 : 0;
                    if (preMaxSavings >= a.multiYearSavingsTargetPct) {
                        savingsPct = a.multiYearSavingsTargetPct;
                    } else {
                        savingsPct = preMaxSavings;
                        isCapped = true;
                    }
                } else {
                    savingsPct = CONSTANTS.MISS_SCENARIO_SAVINGS_PCT * 100;
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
                    multiYearSavingsTargetPct: a.multiYearSavingsTargetPct,
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
                    isScenarioMiss: scenario === 'miss'
                });

                // Update loan state
                loanPaymentsRemaining = yf.newLoanPaymentsRemaining;

                // Track first TCOC miss
                if (!yf.meetsThreshold && !firstTcocMissYear && scenario === 'hit') {
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
            // Must use qualityGateCeiling to match actual gate logic
            const qualityGateCeilingVal = a.qualityGateCeiling ?? 95;
            let qualityCrossoverYear = null;
            for (let y = 1; y <= 20; y++) {
                const gate = Math.min(qualityGateCeilingVal, a.qualityGatePct + (y - 1) * a.qualityGateRatchetPct);
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
                avgNetAfterBurdenPerPcp: (completedYears > 0 && a.pcpCount > 0) ? netAfterBurden / a.pcpCount : 0,
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


        // ============================================
        // MONTE CARLO SIMULATION FUNCTIONS
        // ============================================

        // Triangular distribution sampling (centered on mode/preset value)
        function sampleTriangular(min, mode, max) {
            if (max <= min) return min;
            const u = Math.random();
            const fc = (mode - min) / (max - min);
            if (u < fc) {
                return min + Math.sqrt(u * (max - min) * (mode - min));
            }
            return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
        }

        // Uniform distribution sampling (equal probability across range)
        function sampleUniform(min, max) {
            return min + Math.random() * (max - min);
        }

        // Generate variation bounds for a variable based on variation percentage
        function getVariationBounds(varName, baseValue, variationPct) {
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
        function generateSampledAssumptions(config) {
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

            const funding = config.funding || selectedFunding || 'bank';
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

                    // Round certain variables to appropriate precision
                    if (['pcpCount', 'patientsPerPcp', 'tcocPerPatient', 'careManagerRatio',
                         'attributionPct', 'bankTermMonths', 'peExitYears'].includes(varName)) {
                        sampled[varName] = Math.round(sampled[varName]);
                    }
                } else if (monteCarloState.customConstants[varName] !== undefined) {
                    // Use custom constant value if set
                    sampled[varName] = monteCarloState.customConstants[varName];
                }
            });

            return sampled;
        }

        // Compute model for a single Monte Carlo iteration
        function computeMonteCarloIteration(sampledAssumptions, config) {
            // Temporarily replace global assumptions
            const originalAssumptions = { ...assumptions };
            Object.assign(assumptions, sampledAssumptions);
            // Defensive guard: clamp pcpCount to prevent division by zero
            if (assumptions.pcpCount < 1) assumptions.pcpCount = 1;

            // Compute model (skip multi-year for Year 1 MC iterations)
            const model = computeModel({ skipMultiYear: true });

            // Restore original assumptions
            Object.assign(assumptions, originalAssumptions);

            // Extract key outcomes based on selected funder
            const funder = (config && config.funding) || selectedFunding || 'bank';
            let sharedSavings = 0;
            let perPcpNet = 0;
            let hitTarget = false;

            const practiceBurden18mo = model.practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER;
            const qualityPass = sampledAssumptions.acoStartingQualityPct >= sampledAssumptions.qualityGatePct;

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
                            ? (model.payerNetDistributable / sampledAssumptions.pcpCount) - practiceBurden18mo
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

        // Run Monte Carlo simulation in batches to prevent UI freeze
        function runSimulationBatches(config, startIdx, results, resolve) {
            const endIdx = Math.min(startIdx + MONTE_CARLO_CONFIG.batchSize, config.iterations);

            for (let i = startIdx; i < endIdx; i++) {
                const sampled = generateSampledAssumptions(config);
                results.push(computeMonteCarloIteration(sampled, config));
            }

            // Update progress
            const progress = (endIdx / config.iterations) * 100;
            document.getElementById('mcProgressFill').style.width = progress + '%';
            document.getElementById('mcProgressText').textContent =
                'Running iteration ' + endIdx.toLocaleString() + ' of ' + config.iterations.toLocaleString() + '...';

            if (endIdx < config.iterations) {
                // Continue with next batch
                setTimeout(() => runSimulationBatches(config, endIdx, results, resolve), 0);
            } else {
                // Simulation complete
                resolve(results);
            }
        }

        // Shared statistics helpers
        function computeMedian(sorted) {
            const n = sorted.length;
            if (n === 0) return 0;
            return n % 2 === 0
                ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
                : sorted[Math.floor(n / 2)];
        }

        function computePercentile(sorted, p) {
            if (sorted.length === 0) return 0;
            return sorted[Math.min(Math.floor(sorted.length * p), sorted.length - 1)];
        }

        function computeStdDev(values, mean) {
            if (values.length < 2) return 0;
            const sqDiffs = values.map(v => Math.pow(v - mean, 2));
            const variance = sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
            return Math.sqrt(variance);
        }

        // Analyze Monte Carlo results
        function analyzeResults(results, viewType) {
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

        // Run tornado sensitivity analysis
        function runTornadoAnalysis(config) {
            const baseAssumptions = { ...PRESETS[config.basePreset] };
            const funding = config.funding || selectedFunding || 'bank';

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

            const baseResult = computeMonteCarloIteration(baseAssumptions, { funding });
            const baseValue = currentMonteCarloView === 'sharedSavings' ? baseResult.sharedSavings : baseResult.perPcpNet;

            let sensitivities = [];

            // For each variable that is being varied
            getMonteCarloVariableKeys(funding, 'year1').forEach(varName => {
                const isHeld = monteCarloState.holdConstant[varName];
                const isVarying = monteCarloState.varyEnabled[varName];

                if (!isHeld && isVarying && baseAssumptions[varName] !== undefined) {
                    const bounds = getVariationBounds(varName, baseAssumptions[varName], config.variationPct);

                    // Test low value
                    const lowAssumptions = { ...baseAssumptions, [varName]: bounds.min };
                    const lowResult = computeMonteCarloIteration(lowAssumptions, { funding });
                    const lowValue = currentMonteCarloView === 'sharedSavings' ? lowResult.sharedSavings : lowResult.perPcpNet;

                    // Test high value
                    const highAssumptions = { ...baseAssumptions, [varName]: bounds.max };
                    const highResult = computeMonteCarloIteration(highAssumptions, { funding });
                    const highValue = currentMonteCarloView === 'sharedSavings' ? highResult.sharedSavings : highResult.perPcpNet;

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

            // Filter out variables with negligible impact (< 1% of max impact or < $1000)
            // This prevents near-zero impact variables (like infrastructure costs in Shared Savings view)
            // from cluttering the chart with meaningless tiny bars
            if (sensitivities.length > 0) {
                const maxImpact = sensitivities[0].impact;
                const threshold = Math.max(1000, maxImpact * 0.01);
                sensitivities = sensitivities.filter(s => s.impact >= threshold);
            }

            return sensitivities.slice(0, 10);
        }

        // Get human-readable label for a variable
        function getVariableLabel(varName) {
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
        function getVariableExplanation(varName) {
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

        // Main Monte Carlo simulation entry point
        async function runMonteCarloSimulation() {
            if (monteCarloState.isRunning) return;

            // Check which tab is active and run appropriate simulation
            if (typeof currentMcTab !== 'undefined' && currentMcTab === 'multiyear') {
                // Run Multi-Year simulation
                await runCascadingMonteCarlo();
                return;
            }

            // Run Year 1 simulation
            monteCarloState.isRunning = true;

            // Show progress, hide results
            document.getElementById('mcProgressContainer').classList.add('active');
            document.getElementById('mcResults').style.display = 'none';
            document.getElementById('myMcResults').style.display = 'none';
            document.getElementById('mcNoResults').style.display = 'none';
            document.getElementById('mcRunBtn').disabled = true;

            const config = {
                basePreset: monteCarloState.basePreset,
                variationPct: monteCarloState.variationPct,
                iterations: monteCarloState.iterations,
                funding: selectedFunding || 'bank',
                simulationType: 'year1'
            };

            try {
                // Run simulation in batches
                const results = await new Promise(resolve => {
                    runSimulationBatches(config, 0, [], resolve);
                });

                // Store results and cache for tab switching
                monteCarloState.results = results;
                monteCarloState.year1Results = results;
                monteCarloState.year1Dirty = false;

                // Analyze and display results
                displayMonteCarloResults(config);

            } finally {
                monteCarloState.isRunning = false;
                document.getElementById('mcProgressContainer').classList.remove('active');
                document.getElementById('mcRunBtn').disabled = false;
            }
        }

        // Display Monte Carlo results
        function displayMonteCarloResults(config) {
            if (!monteCarloState.results) return;

            const stats = analyzeResults(monteCarloState.results, currentMonteCarloView);
            const tornado = runTornadoAnalysis(config);

            // Show results section
            document.getElementById('mcResults').style.display = 'block';
            document.getElementById('mcNoResults').style.display = 'none';

            // Update statistics
            document.getElementById('mcStatHitRate').textContent = stats.hitRate.toFixed(1) + '%';
            document.getElementById('mcStatMean').textContent = formatSignedCurrency(stats.mean);
            document.getElementById('mcStatMedian').textContent = formatSignedCurrency(stats.median);
            document.getElementById('mcStatStdDev').textContent = '$' + formatCurrency(stats.stdDev);
            document.getElementById('mcStatProbLoss').textContent = stats.probLoss.toFixed(1) + '%';
            document.getElementById('mcStatP5').textContent = formatSignedCurrency(stats.p5);
            document.getElementById('mcStatP95').textContent = formatSignedCurrency(stats.p95);

            applyMcStatColor('mcStatMean', stats.mean);
            applyMcStatColor('mcStatMedian', stats.median);
            applyMcStatColor('mcStatP5', stats.p5);
            applyMcStatColor('mcStatP95', stats.p95);

            // Show/hide Quality Miss Rate card
            const qualityMissCard = document.getElementById('mcQualityMissCard');
            if (qualityMissCard) {
                if (stats.qualityMissRate > 0) {
                    qualityMissCard.style.display = 'block';
                    document.getElementById('mcStatQualityMiss').textContent = stats.qualityMissRate.toFixed(1) + '%';
                } else {
                    qualityMissCard.style.display = 'none';
                }
            }

            // Show/hide PCP Profit Rate based on view
            const pcpProfitCard = document.getElementById('mcPcpProfitCard');
            if (currentMonteCarloView === 'perPcp') {
                pcpProfitCard.style.display = 'block';
                document.getElementById('mcStatPcpProfit').textContent = (100 - stats.probLoss).toFixed(1) + '%';
            } else {
                pcpProfitCard.style.display = 'none';
            }

            // Update Prob Loss label based on view
            const probLossLabel = document.getElementById('mcStatProbLossLabel');
            probLossLabel.innerHTML = currentMonteCarloView === 'sharedSavings'
                ? 'Prob ACO Loss <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Percentage of simulations where the ACO receives $0 payout (fails to meet MSR threshold).</span></span>'
                : 'Prob PCP Loss <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Percentage of simulations where physicians have negative net income after accounting for practice burden and any clawbacks.</span></span>';

            // Update histogram title with tooltip
            const histogramTitleEl = document.getElementById('mcHistogramTitle');
            histogramTitleEl.innerHTML = currentMonteCarloView === 'sharedSavings'
                ? 'Distribution of Shared Savings <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Total ACO shared savings distributed across all simulation iterations. Shows the range of possible Year 1 outcomes.</span></span>'
                : 'Distribution of Per-PCP Net Outcome <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Each physician\'s net income: (Net to PCPs ÷ Number of PCPs) minus 18-month practice burden (lost clinic revenue + staff costs). Positive = physician profits; negative = physician loses money.</span></span>';

            // Draw histogram
            drawHistogram(stats);

            // Draw deterministic tornado chart
            drawTornadoChart(tornado);

            // Show/hide infrastructure cost explanation based on view
            const tornadoViewNote = document.getElementById('mcTornadoViewNote');
            if (tornadoViewNote) {
                tornadoViewNote.style.display = currentMonteCarloView === 'sharedSavings' ? 'flex' : 'none';
            }

            // Draw correlation tornado (upfront for instant tab switching)
            if (monteCarloState.results && monteCarloState.results.length >= 10) {
                const correlations = analyzeYear1Correlations(monteCarloState.results);
                drawCorrelationTornadoChart(correlations, 'mcCorrTornadoBars', 'mcCorrTornadoAxisLabels');
            }

            // Restore tab state
            setYear1TornadoMode(currentYear1TornadoMode);
        }

        // Draw histogram on canvas
        function drawHistogram(stats) {
            const canvas = document.getElementById('mcHistogramCanvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size with device pixel ratio for crisp rendering
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            const width = rect.width;
            const height = rect.height;
            const padding = { top: 20, right: 20, bottom: 40, left: 60 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Find max frequency for scaling
            const maxFreq = Math.max(...stats.bins.map(b => b.frequency));

            // Draw bars
            const barWidth = chartWidth / stats.bins.length - 2;
            stats.bins.forEach((bin, i) => {
                const barHeight = (bin.frequency / maxFreq) * chartHeight;
                const x = padding.left + i * (chartWidth / stats.bins.length) + 1;
                const y = padding.top + chartHeight - barHeight;

                // Color based on value (red for negative, green for positive)
                const midValue = (bin.min + bin.max) / 2;
                if (midValue < 0) {
                    ctx.fillStyle = '#fecaca';
                } else {
                    ctx.fillStyle = '#bbf7d0';
                }

                ctx.fillRect(x, y, barWidth, barHeight);

                // Border
                ctx.strokeStyle = midValue < 0 ? '#f87171' : '#4ade80';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, barWidth, barHeight);
            });

            // Draw zero line if data spans negative and positive
            if (stats.min < 0 && stats.max > 0) {
                const zeroX = padding.left + ((0 - stats.min) / (stats.max - stats.min)) * chartWidth;
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(zeroX, padding.top);
                ctx.lineTo(zeroX, padding.top + chartHeight);
                ctx.stroke();
                ctx.setLineDash([]);

                // Label
                ctx.fillStyle = '#1e293b';
                ctx.font = '11px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('$0', zeroX, padding.top + chartHeight + 15);
            }

            // Draw axes
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, padding.top + chartHeight);
            ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
            ctx.stroke();

            // X-axis labels (min, max)
            ctx.fillStyle = '#64748b';
            ctx.font = '11px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(formatSignedCurrency(stats.min), padding.left, padding.top + chartHeight + 25);
            ctx.textAlign = 'right';
            ctx.fillText(formatSignedCurrency(stats.max), padding.left + chartWidth, padding.top + chartHeight + 25);

            // Y-axis label
            ctx.save();
            ctx.translate(15, padding.top + chartHeight / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.fillText('Frequency', 0, 0);
            ctx.restore();

            // Draw mean and median markers
            const range = stats.max - stats.min;
            const meanX = range === 0 ? padding.left + chartWidth / 2 : padding.left + ((stats.mean - stats.min) / range) * chartWidth;
            const medianX = range === 0 ? padding.left + chartWidth / 2 : padding.left + ((stats.median - stats.min) / range) * chartWidth;

            // Mean line
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(meanX, padding.top);
            ctx.lineTo(meanX, padding.top + chartHeight);
            ctx.stroke();

            // Median line
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(medianX, padding.top);
            ctx.lineTo(medianX, padding.top + chartHeight);
            ctx.stroke();
            ctx.setLineDash([]);

            // Legend
            ctx.font = '10px -apple-system, sans-serif';
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(width - 100, 10, 12, 12);
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'left';
            ctx.fillText('Mean', width - 85, 20);

            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(width - 100, 28, 12, 12);
            ctx.fillStyle = '#334155';
            ctx.fillText('Median', width - 85, 38);
        }

        // Draw tornado chart using HTML elements (click-to-expand explanations)
        function drawTornadoChart(sensitivities, barsContainerId, axisContainerId) {
            const container = document.getElementById(barsContainerId || 'mcTornadoBars');
            const axisLabels = document.getElementById(axisContainerId || 'mcTornadoAxisLabels');
            if (!container || !axisLabels) return;
            container.innerHTML = '';
            axisLabels.innerHTML = '';

            if (sensitivities.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#64748b;padding:40px;">No variables have significant impact on this metric</div>';
                return;
            }

            const maxDelta = Math.max(
                ...sensitivities.map(s => Math.max(Math.abs(s.lowDelta), Math.abs(s.highDelta)))
            );

            sensitivities.forEach((s, i) => {
                const explanation = getVariableExplanation(s.varName);
                const lowPct = (Math.abs(s.lowDelta) / maxDelta) * 50;
                const highPct = (Math.abs(s.highDelta) / maxDelta) * 50;
                const lowClass = s.lowDelta > 0 ? 'green' : 'red';
                const highClass = s.highDelta > 0 ? 'green' : 'red';

                const rowHTML = 
                    '<div class="tornado-row" data-index="' + i + '">' +
                        '<div class="tornado-label">' + s.label + '</div>' +
                        '<div class="tornado-bar-container">' +
                            '<div class="tornado-bar-left tornado-bar-' + lowClass + '" style="width: ' + lowPct + '%"></div>' +
                            '<div class="tornado-bar-right tornado-bar-' + highClass + '" style="width: ' + highPct + '%"></div>' +
                            '<div class="tornado-center-line"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="tornado-explanation" data-index="' + i + '">' +
                        '<div class="tornado-explanation-line">' +
                            '<span class="indicator ' + lowClass + '">↓ Lower:</span>' +
                            '<span>' + explanation.lower + '</span>' +
                            '<span style="margin-left:auto;font-weight:600;color:#334155;">' + formatSignedCurrency(s.lowValue) + '</span>' +
                        '</div>' +
                        '<div class="tornado-explanation-line">' +
                            '<span class="indicator ' + highClass + '">↑ Higher:</span>' +
                            '<span>' + explanation.higher + '</span>' +
                            '<span style="margin-left:auto;font-weight:600;color:#334155;">' + formatSignedCurrency(s.highValue) + '</span>' +
                        '</div>' +
                    '</div>';
                container.insertAdjacentHTML('beforeend', rowHTML);
            });

            // Add click handlers for expanding explanations
            container.querySelectorAll('.tornado-row').forEach(row => {
                row.addEventListener('click', () => {
                    const idx = row.dataset.index;
                    const exp = container.querySelector('.tornado-explanation[data-index="' + idx + '"]');
                    exp.classList.toggle('expanded');
                });
            });

            // Auto-expand first explanation for discoverability
            const firstExplanation = container.querySelector('.tornado-explanation[data-index="0"]');
            if (firstExplanation) {
                firstExplanation.classList.add('expanded');
            }

            // Add axis labels at bottom
            axisLabels.innerHTML = 
                '<span>' + formatSignedCurrency(-maxDelta) + '</span>' +
                '<span>$0</span>' +
                '<span>' + formatSignedCurrency(maxDelta) + '</span>';
        }

        // Monte Carlo UI Helper Functions
        function setMonteCarloPreset(preset) {
            monteCarloState.basePreset = preset;

            // Mark both simulations as dirty
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;

            // Update button states
            document.querySelectorAll('.mc-preset-btn').forEach(btn => btn.classList.remove('active'));
            const mcPresetBtn = document.getElementById('mcPreset' + capitalizeFirst(preset));
            if (mcPresetBtn) mcPresetBtn.classList.add('active');

            // Reset held/varied configuration to defaults
            monteCarloState.holdConstant = Object.assign({}, DEFAULT_HOLD_CONSTANT);
            monteCarloState.customConstants = {};
            monteCarloState.varyEnabled = Object.assign({}, DEFAULT_VARY_ENABLED);

            // Reset checkboxes to match default held/varied state
            document.querySelectorAll('.mc-variable-checkbox').forEach(cb => {
                const varName = cb.id.replace('mcVar', '');
                const varNameLower = varName.charAt(0).toLowerCase() + varName.slice(1);
                const isHeld = monteCarloState.holdConstant[varNameLower];
                cb.checked = isHeld;
            });

            // Update badges for varied variables (show badge, hide slider)
            Object.keys(SLIDER_RANGES).forEach(varName => {
                const badge = document.getElementById('mcBadge' + capitalizeFirst(varName));
                const sliderContainer = getMcSliderContainer(varName);
                const isHeld = monteCarloState.holdConstant[varName];

                if (!isHeld) {
                    if (badge) {
                        badge.textContent = 'Randomized';
                        badge.style.display = '';
                    }
                    if (sliderContainer) sliderContainer.classList.remove('visible');
                }
            });

            // Initialize sliders for held variables with new preset values
            initMcHeldVariableSliders();
        }

        function updateMonteCarloSetting(setting, value) {
            // Mark both simulations as dirty when settings change
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;

            if (setting === 'useTriangular') {
                monteCarloState.useTriangular = value;
                const label = document.querySelector('.mc-toggle-label');
                if (label) {
                    label.textContent = value ? 'Realistic clustering' : 'Uniform spread';
                }
            } else {
                monteCarloState[setting] = parseInt(value);

                if (setting === 'iterations') {
                    document.getElementById('mcIterationsDisplay').textContent = parseInt(value).toLocaleString();
                } else if (setting === 'variationPct') {
                    document.getElementById('mcVariationDisplay').textContent = value;
                }
            }
        }

        function toggleMcVariableGroup(groupId) {
            const group = document.getElementById(groupId);
            group.classList.toggle('collapsed');
        }

        // Format variable values appropriately by variable type
        function formatMcVariableValue(varName, value) {
            // Currency variables (costs, salaries, etc.)
            if (['dataAnalyticsCost', 'careManagerSalary', 'adminCost', 'itCost',
                 'legalCost', 'qualityCost', 'practiceStaffSalary', 'tcocPerPatient',
                 'revenuePerVisit'].includes(varName)) {
                return formatCurrency(value);
            }
            // Percentage variables
            if (['attributionPct', 'savingsTargetPct', 'payerSharePct', 'msrPct', 'multiYearSavingsTargetPct', 'multiYearMsrPct', 'qualityGatePct',
                 'acoStartingQualityPct', 'acoQualityImprovementPct', 'qualityGateRatchetPct', 'acoMaxQualityPct', 'qualityGateCeiling',
                 'bankInterestRate', 'bankOrigFee', 'hospitalReferralLock',
                 'hospitalCostPremium', 'hospitalGainShare', 'hospitalReferralPct',
                 'peEquityShare', 'peBoardControl', 'payerClawbackPct',
                 'payerPmpmRatchet', 'inflationPct', 'benchmarkRatchetPct'].includes(varName)) {
                return value + '%';
            }
            // Count/ratio variables
            if (['pcpCount', 'patientsPerPcp', 'careManagerRatio', 'bankTermMonths',
                 'peExitYears'].includes(varName)) {
                return formatNumber(Math.round(value));
            }
            // PMPM
            if (varName === 'payerPmpm') return '$' + value;
            // Hours/visits
            if (['lostHoursPerWeek', 'visitsPerHour'].includes(varName)) return value.toFixed(1);
            // FTE
            if (varName === 'practiceStaffFtePerPcp') return value.toFixed(2) + ' FTE';
            // RAF base values (decimal)
            if (['acoBaseRaf', 'regionalBaseRaf'].includes(varName)) return value.toFixed(2);
            // RAF percentage variables
            if (['acoRafGrowthPct', 'regionalRafGrowthPct', 'codingIntensityCap', 'rafOptimizationFloor'].includes(varName)) {
                return value + '%';
            }
            // RAF optimization peak year
            if (varName === 'rafOptimizationPeakYear') return 'Year ' + Math.round(value);
            // Default
            return value.toString();
        }

        // Get slider container element (sliders are now embedded in HTML)
        function getMcSliderContainer(varName) {
            const sliderId = 'mcSlider' + capitalizeFirst(varName);
            return document.getElementById(sliderId);
        }

        // Initialize or update a variable's slider
        function initMcVariableSlider(varName, value) {
            const range = SLIDER_RANGES[varName];
            if (!range) return;

            const sliderContainer = getMcSliderContainer(varName);
            if (!sliderContainer) return;

            const slider = sliderContainer.querySelector('input[type="range"]');

            if (slider) {
                slider.min = range.min;
                slider.max = range.max;
                slider.step = range.step;
                slider.value = value;
            }

            // Update the value display
            const valueDisplay = document.getElementById('mcValue' + capitalizeFirst(varName));
            if (valueDisplay) {
                valueDisplay.textContent = formatMcVariableValue(varName, value);
            }

            monteCarloState.customConstants[varName] = value;
        }

        // Update custom constant value when slider changes
        function updateMcVariableConstant(varName, value) {
            // Mark both simulations as dirty
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;

            const numValue = parseFloat(value);
            if (isNaN(numValue)) return;
            monteCarloState.customConstants[varName] = numValue;

            // Update value display element
            const valueDisplay = document.getElementById('mcValue' + capitalizeFirst(varName));
            if (valueDisplay) valueDisplay.textContent = formatMcVariableValue(varName, numValue);
        }

        // Reset a single variable to current preset value AND its default held/varied state
        function resetMcVariableToPreset(varName) {
            const presetValue = PRESETS[monteCarloState.basePreset][varName];
            if (presetValue === undefined) return;

            // Mark simulations as dirty
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;

            // Reset to default held/varied state
            const shouldBeHeld = DEFAULT_HOLD_CONSTANT[varName] === true;

            // Update checkbox
            const checkbox = document.getElementById('mcVar' + capitalizeFirst(varName));
            if (checkbox) {
                checkbox.checked = shouldBeHeld;
            }

            // Use toggleMcVariable to sync all UI state (slider, badge, state)
            toggleMcVariable(varName, shouldBeHeld);

            // Set the slider value to preset (if held)
            if (shouldBeHeld) {
                initMcVariableSlider(varName, presetValue);
            }
        }

        // Randomize all variables (uncheck all checkboxes)
        function randomizeAllMcVariables() {
            // Mark simulations as dirty
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;

            // Uncheck all checkboxes and update state
            document.querySelectorAll('.mc-variable-checkbox').forEach(cb => {
                const varName = cb.id.replace('mcVar', '');
                const varNameLower = varName.charAt(0).toLowerCase() + varName.slice(1);

                cb.checked = false;
                monteCarloState.holdConstant[varNameLower] = false;
                monteCarloState.varyEnabled[varNameLower] = true;
                delete monteCarloState.customConstants[varNameLower];

                // Hide slider, show badge
                const sliderContainer = getMcSliderContainer(varNameLower);
                if (sliderContainer) sliderContainer.classList.remove('visible');

                const badge = document.getElementById('mcBadge' + varName);
                if (badge) {
                    badge.style.display = '';
                    badge.textContent = 'Randomized';
                }
            });
        }

        // Initialize sliders for variables that are held constant by default
        function initMcHeldVariableSliders() {
            Object.keys(monteCarloState.holdConstant).forEach(varName => {
                if (monteCarloState.holdConstant[varName]) {
                    const existingCustom = monteCarloState.customConstants[varName];
                    const presetValue = PRESETS[monteCarloState.basePreset][varName];
                    const valueToUse = existingCustom !== undefined ? existingCustom : presetValue;
                    if (valueToUse !== undefined) {
                        initMcVariableSlider(varName, valueToUse);

                        // Show slider container, hide badge
                        const sliderContainer = getMcSliderContainer(varName);
                        if (sliderContainer) sliderContainer.classList.add('visible');

                        const badge = document.getElementById('mcBadge' + capitalizeFirst(varName));
                        if (badge) badge.style.display = 'none';
                    }
                }
            });
        }

        function toggleMcVariable(varName, isChecked) {
            // Mark both simulations as dirty
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;

            // FLIPPED: checked = held constant, unchecked = varied
            if (monteCarloState.holdConstant[varName] !== undefined) {
                monteCarloState.holdConstant[varName] = isChecked;
            }
            monteCarloState.varyEnabled[varName] = !isChecked;

            const badge = document.getElementById('mcBadge' + capitalizeFirst(varName));
            const sliderContainer = getMcSliderContainer(varName);

            if (isChecked) {
                // CHECKED = Holding constant: show slider container, hide badge
                const existingCustom = monteCarloState.customConstants[varName];
                const presetValue = PRESETS[monteCarloState.basePreset][varName];
                const valueToUse = existingCustom !== undefined ? existingCustom : presetValue;

                initMcVariableSlider(varName, valueToUse);
                if (sliderContainer) sliderContainer.classList.add('visible');
                if (badge) badge.style.display = 'none';
            } else {
                // UNCHECKED = Varying: hide slider container, show badge with "Randomized"
                if (sliderContainer) sliderContainer.classList.remove('visible');
                delete monteCarloState.customConstants[varName];

                if (badge) {
                    badge.style.display = '';
                    badge.textContent = 'Randomized';
                }
            }
        }

        function setMonteCarloView(view) {
            currentMonteCarloView = view;

            // Update button states
            document.getElementById('mcViewSharedSavings').classList.toggle('active', view === 'sharedSavings');
            document.getElementById('mcViewPerPcp').classList.toggle('active', view === 'perPcp');

            // Re-display results if available, but warn if stale
            if (monteCarloState.year1Dirty && monteCarloState.year1Results) {
                document.getElementById('mcResults').style.display = 'none';
                document.getElementById('myMcResults').style.display = 'none';
                document.getElementById('mcNoResults').style.display = 'block';
            } else if (monteCarloState.results) {
                displayMonteCarloResults({
                    basePreset: monteCarloState.basePreset,
                    variationPct: monteCarloState.variationPct,
                    iterations: monteCarloState.iterations,
                    funding: selectedFunding || 'bank'
                });
            }
        }

        // Multi-Year Monte Carlo view toggle
        function setMultiYearMonteCarloView(view) {
            currentMultiYearMonteCarloView = view;

            // Update button states
            document.getElementById('myMcViewSharedSavings').classList.toggle('active', view === 'sharedSavings');
            document.getElementById('myMcViewPerPcp').classList.toggle('active', view === 'perPcp');

            // Re-display results if available, but warn if stale
            if (monteCarloState.multiYearDirty && monteCarloState.multiYearPaths) {
                document.getElementById('mcResults').style.display = 'none';
                document.getElementById('myMcResults').style.display = 'none';
                document.getElementById('mcNoResults').style.display = 'block';
            } else if (monteCarloState.paths && monteCarloState.paths.length > 0) {
                const years = monteCarloState.multiYearConfig?.yearsToProject || assumptions.multiYearCount;
                const results = analyzeMultiYearPaths(monteCarloState.paths, years, view);
                monteCarloState.multiYearResults = results;
                displayMultiYearMCResults(results);
            }
        }

        // ============================================
        // MULTI-YEAR MONTE CARLO SIMULATION
        // ============================================

        // Initialize path state from initial assumptions
        function initializePathState(initialAssumptions, funding) {
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
                qualityGate: initialAssumptions.qualityGatePct,
                achievedQuality: initialAssumptions.acoStartingQualityPct,
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
        function computeCascadingYearOutcome(state, shocks, year, funding, initialAssumptions) {
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
            let newAcoRaf = state.acoRaf;
            let newRegionalRaf = state.regionalRaf;

            if (year > 1 && a.enableRafAdjustment) {
                const rates = computeRafGrowthRates(a, year, acoRafGrowthPct, regionalRafGrowthPct);
                newAcoRaf *= (1 + rates.acoGrowthRate / 100);
                newRegionalRaf *= (1 + rates.regionalGrowthRate / 100);
            }

            const rafRatio = a.enableRafAdjustment ? (newRegionalRaf !== 0 ? newAcoRaf / newRegionalRaf : 1.0) : 1.0;

            // Apply benchmark ratcheting and inflation
            let benchmark = state.benchmark;
            if (year > 1 && a.applyInflationToBenchmark) {
                benchmark *= (1 + a.inflationPct / 100);
            }
            const rafAdjustedBenchmark = benchmark * rafRatio;

            // Quality dynamics (gate capped at qualityGateCeiling)
            const qualityGateCeiling = a.qualityGateCeiling ?? 95;
            const qualityGateRequired = Math.min(qualityGateCeiling, state.qualityGate + (year > 1 ? a.qualityGateRatchetPct : 0));
            const rawAchievedQuality = state.achievedQuality + (year > 1 ? qualityImprovement : 0);
            const achievedQuality = Math.min(100, a.acoMaxQualityPct, rawAchievedQuality);
            const qualityPass = achievedQuality >= qualityGateRequired;

            // Cost floor and achievable savings
            const originalTcoc = attributedPatients * tcocPerPatient;
            const minAchievableCost = originalTcoc * (1 - a.multiYearSavingsTargetPct / 100);

            // Pre-compute achievable to determine capping (helper also computes this)
            const preMaxSavings = rafAdjustedBenchmark > 0
                ? (Math.max(0, rafAdjustedBenchmark - minAchievableCost) / rafAdjustedBenchmark) * 100 : 0;
            const savingsPct = Math.min(a.multiYearSavingsTargetPct, preMaxSavings);
            const isCapped = savingsPct < a.multiYearSavingsTargetPct;

            // Hospital premium (if applicable)
            // Note: Premium is based on actual TCOC (benchmark), not RAF-adjusted benchmark,
            // matching deterministic multi-year calculation in computeHospitalPremiumForYear()
            let hospitalPremium = 0;
            if (funding === 'hospital') {
                const hospitalGrowthFactor = Math.pow(1 + (a.hospitalPremiumGrowthPct / 100), year - 1);
                const inflatedPremiumPct = a.hospitalCostPremium * hospitalGrowthFactor;
                hospitalPremium = benchmark * (a.hospitalReferralPct / 100) *
                                  (a.hospitalReferralLock / 100) * (inflatedPremiumPct / 100);
            }

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
                multiYearSavingsTargetPct: a.multiYearSavingsTargetPct,
                loanPaymentsRemaining: state.loanPaymentsRemaining,
                monthlyLoanPayment: (funding === 'bank') ? state.bankDeferredMonthlyPayment : 0,
                hospitalGainSharePct: a.hospitalGainShare,
                peEquitySharePct: a.peEquityShare,
                currentPmpm: state.pmpm,
                attributedPatients,
                payerClawbackPct: a.payerClawbackPct,
                currentReserve: state.reserve,
                basePracticeBurdenTotal: basePracticeBurden,
                applyInflationToBurden: a.applyInflationToBurden,
                inflationPct: a.inflationPct,
                adjustNetDistributableForShortfall: true,
                isScenarioMiss: false
            });

            // Cap reserve change at available reserve (MC-specific)
            const acoReserveChange = Math.max(-state.reserve, yf.reserveChange);

            // On failure: set status to 'Failed' and zero out distributions
            const finalStatus = yf.failed ? 'Failed' : yf.status;
            const finalNetToPcps = yf.failed ? -yf.payerClawback : yf.netToPcps;
            const finalAcoShare = yf.failed ? 0 : yf.acoShare;
            const finalFundingDeduction = yf.failed ? 0 : yf.fundingDeduction;
            const finalReserveChange = yf.failed ? -state.reserve : acoReserveChange;

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
        function updatePathState(state, yearResult, year, funding, initialAssumptions) {
            const newReserve = state.reserve + yearResult.acoReserveChange;

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
            let newPmpm = state.pmpm;
            if (funding === 'payer' && (yearResult.status === 'Hit' || yearResult.status === 'Partial')) {
                const pmpmRatchetPct = (initialAssumptions?.payerPmpmRatchet ?? assumptions.payerPmpmRatchet) / 100;
                newPmpm = state.pmpm * (1 - pmpmRatchetPct);
            }

            // Bug #10 fix: Calculate per-PCP values
            const perPcpNet = yearResult.netToPcps / state.pcpCount;
            const perPcpBurden = yearResult.practiceBurden / state.pcpCount;
            // Include payer clawback in per-PCP calculations (Issue #1 fix)
            const perPcpClawback = (yearResult.payerClawback || 0) / state.pcpCount;

            return {
                benchmark: newBenchmark,
                reserve: Math.max(0, newReserve),
                acoRaf: yearResult.acoRaf,
                regionalRaf: yearResult.regionalRaf,
                qualityGate: yearResult.qualityGateRequired,
                achievedQuality: yearResult.achievedQuality,
                loanPaymentsRemaining: yearResult.loanPaymentsRemaining,
                bankDeferredMonthlyPayment: state.bankDeferredMonthlyPayment,
                pmpm: newPmpm,
                pcpCount: state.pcpCount,  // Carry forward
                cumulativeNet: state.cumulativeNet + yearResult.netToPcps,
                cumulativeSharedSavings: state.cumulativeSharedSavings + yearResult.acoShare,
                cumulativePerPcpNet: state.cumulativePerPcpNet + perPcpNet,  // Bug #10 fix
                cumulativeBurden: state.cumulativeBurden + yearResult.practiceBurden,
                cumulativePerPcpBurden: state.cumulativePerPcpBurden + perPcpBurden,  // Bug #10 fix
                cumulativeClawback: (state.cumulativeClawback || 0) + (yearResult.payerClawback || 0),  // Issue #1 fix
                cumulativePerPcpClawback: (state.cumulativePerPcpClawback || 0) + perPcpClawback,  // Issue #1 fix
                failed: yearResult.failed,
                failedYear: yearResult.failed ? year : state.failedYear
            };
        }

        // Compute a deterministic multi-year path for tornado sensitivity analysis
        function computeDeterministicMultiYearPath(testAssumptions, funding, years) {
            let state = initializePathState(testAssumptions, funding);

            for (let year = 1; year <= years && !state.failed; year++) {
                const yearResult = computeCascadingYearOutcome(state, {}, year, funding, testAssumptions);
                state = updatePathState(state, yearResult, year, funding, testAssumptions);
            }

            const isPerPcp = currentMultiYearMonteCarloView === 'perPcp';
            return {
                totalSharedSavings: state.cumulativeSharedSavings,
                perPcpNetAfterBurden: state.cumulativePerPcpNet - state.cumulativePerPcpBurden,
                failed: state.failed,
                value: isPerPcp
                    ? (state.cumulativePerPcpNet - state.cumulativePerPcpBurden)
                    : state.cumulativeSharedSavings
            };
        }

        // Run deterministic multi-year tornado analysis
        function runMultiYearTornadoAnalysis() {
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

            const funding = selectedFunding || 'bank';
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

        // Compute ranks for an array (1-based, average rank for ties)
        function computeRanks(arr) {
            const indexed = arr.map((v, i) => ({ v, i }));
            indexed.sort((a, b) => a.v - b.v);
            const ranks = new Array(arr.length);
            let i = 0;
            while (i < indexed.length) {
                let j = i;
                while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
                const avgRank = (i + j + 1) / 2; // average of 1-based ranks i+1..j
                for (let k = i; k < j; k++) {
                    ranks[indexed[k].i] = avgRank;
                }
                i = j;
            }
            return ranks;
        }

        // Compute Spearman rank correlation between two arrays
        function computeSpearmanCorrelation(x, y) {
            const n = x.length;
            if (n < 3) return 0;
            const rx = computeRanks(x);
            const ry = computeRanks(y);
            const meanRx = rx.reduce((a, b) => a + b, 0) / n;
            const meanRy = ry.reduce((a, b) => a + b, 0) / n;
            let num = 0, denX = 0, denY = 0;
            for (let i = 0; i < n; i++) {
                const dx = rx[i] - meanRx;
                const dy = ry[i] - meanRy;
                num += dx * dy;
                denX += dx * dx;
                denY += dy * dy;
            }
            const den = Math.sqrt(denX * denY);
            return den === 0 ? 0 : num / den;
        }

        // Analyze correlations between sampled parameters and Year 1 outcomes
        function analyzeYear1Correlations(results) {
            if (!results || results.length < 10) return [];

            const isPerPcp = currentMonteCarloView === 'perPcp';
            const outcomes = results.map(r => isPerPcp ? r.perPcpNet : r.sharedSavings);
            const funding = selectedFunding || 'bank';

            let correlations = [];

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

                    // Dynamic significance threshold: max(0.10, ~p<0.01 critical value)
                    // Eliminates spurious noise correlations that produce misleading bar colors
                    // For n=1000: max(0.10, 0.081) = 0.10
                    // For n=100:  max(0.10, 0.259) = 0.259
                    const significanceThreshold = Math.max(0.10, 2.576 / Math.sqrt(results.length));

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
        function analyzeMultiYearCorrelations(paths) {
            if (!paths || paths.length < 10) return [];

            const isPerPcp = currentMultiYearMonteCarloView === 'perPcp';
            const outcomes = paths.map(p => isPerPcp ? p.perPcpNetAfterBurden : p.totalSharedSavings);
            const funding = selectedFunding || 'bank';

            let correlations = [];

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

                    // Dynamic significance threshold: max(0.10, ~p<0.01 critical value)
                    // Eliminates spurious noise correlations that produce misleading bar colors
                    const significanceThreshold = Math.max(0.10, 2.576 / Math.sqrt(paths.length));

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

        // Draw correlation tornado chart (bars from -1 to +1)
        function drawCorrelationTornadoChart(correlations, barsContainerId, axisContainerId) {
            const container = document.getElementById(barsContainerId || 'myMcCorrTornadoBars');
            const axisLabels = document.getElementById(axisContainerId || 'myMcCorrTornadoAxisLabels');
            if (!container || !axisLabels) return;
            container.innerHTML = '';
            axisLabels.innerHTML = '';

            if (correlations.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#64748b;padding:40px;">No variables have significant correlation with outcomes</div>';
                return;
            }

            correlations.forEach((c, i) => {
                const explanation = getVariableExplanation(c.varName);
                const barPct = c.absCorrelation * 50; // 50% = full width on one side
                const isPositive = c.correlation > 0;
                const barClass = isPositive ? 'green' : 'red';
                const corrLabel = 'r = ' + (c.correlation > 0 ? '+' : '\u2212') + c.absCorrelation.toFixed(2);

                // For positive correlation: bar extends right from center
                // For negative correlation: bar extends left from center
                const leftWidth = isPositive ? 0 : barPct;
                const rightWidth = isPositive ? barPct : 0;

                const rowHTML =
                    '<div class="tornado-row" data-index="' + i + '">' +
                        '<div class="tornado-label">' + c.label + '</div>' +
                        '<div class="tornado-bar-container">' +
                            (leftWidth > 0 ? '<div class="tornado-bar-left tornado-bar-red" style="width: ' + leftWidth + '%"></div>' : '<div class="tornado-bar-left" style="width: 0%"></div>') +
                            (rightWidth > 0 ? '<div class="tornado-bar-right tornado-bar-green" style="width: ' + rightWidth + '%"></div>' : '<div class="tornado-bar-right" style="width: 0%"></div>') +
                            '<div class="tornado-center-line"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="tornado-explanation" data-index="' + i + '">' +
                        '<div class="tornado-explanation-line">' +
                            '<span class="indicator ' + (isPositive ? 'green' : 'red') + '">' + (isPositive ? '\u2191 Higher:' : '\u2193 Higher:') + '</span>' +
                            '<span>' + explanation.higher + '</span>' +
                            '<span style="margin-left:auto;font-weight:600;color:#334155;">' + corrLabel + '</span>' +
                        '</div>' +
                        '<div class="tornado-explanation-line">' +
                            '<span class="indicator ' + (isPositive ? 'red' : 'green') + '">' + (isPositive ? '\u2193 Lower:' : '\u2191 Lower:') + '</span>' +
                            '<span>' + explanation.lower + '</span>' +
                        '</div>' +
                    '</div>';
                container.insertAdjacentHTML('beforeend', rowHTML);
            });

            // Add click handlers for expanding explanations
            container.querySelectorAll('.tornado-row').forEach(row => {
                row.addEventListener('click', () => {
                    const idx = row.dataset.index;
                    const exp = container.querySelector('.tornado-explanation[data-index="' + idx + '"]');
                    exp.classList.toggle('expanded');
                });
            });

            // Auto-expand first explanation for discoverability
            const firstExplanation = container.querySelector('.tornado-explanation[data-index="0"]');
            if (firstExplanation) {
                firstExplanation.classList.add('expanded');
            }

            // Add axis labels
            axisLabels.innerHTML =
                '<span>\u22121.0 (Inverse)</span>' +
                '<span>0</span>' +
                '<span>+1.0 (Direct)</span>';
        }

        // Toggle Year 1 tornado mode between deterministic and correlation
        function setYear1TornadoMode(mode) {
            currentYear1TornadoMode = mode;

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
        function setMultiYearTornadoMode(mode) {
            currentMultiYearTornadoMode = mode;

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
        async function runCascadingMonteCarlo() {
            if (monteCarloState.isRunning) return;

            monteCarloState.isRunning = true;
            const paths = [];
            const funding = selectedFunding || 'bank';
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

                    let state = initializePathState(initialAssumptions, funding);
                    const pathHistory = [];

                    for (let year = 1; year <= years && !state.failed; year++) {
                        // Initial sampled parameters determine the full path — no per-year randomization
                        // Cascading state (benchmark ratchet, RAF growth, quality gate) evolves deterministically year-to-year
                        const yearResult = computeCascadingYearOutcome(state, {}, year, funding, initialAssumptions);

                        // Update state for next year
                        // Bug #8 fix: Pass funding and initialAssumptions for PMPM ratchet
                        state = updatePathState(state, yearResult, year, funding, initialAssumptions);

                        pathHistory.push({
                            year,
                            benchmark: yearResult.rafAdjustedBenchmark,
                            rafRatio: yearResult.rafRatio,
                            savingsPct: yearResult.savingsPct,
                            acoShare: yearResult.acoShare,
                            netToPcps: yearResult.netToPcps,
                            reserve: state.reserve,
                            status: yearResult.status,
                            qualityPass: yearResult.qualityPass,
                            cumulativeNet: state.cumulativeNet,
                            cumulativeSharedSavings: state.cumulativeSharedSavings,
                            cumulativePerPcpNet: state.cumulativePerPcpNet,
                            // Bug #10 fix: Track after-burden cumulative for fan chart
                            // Clawback now embedded in netToPcps → cumulativePerPcpNet
                            cumulativePerPcpNetAfterBurden: state.cumulativePerPcpNet - state.cumulativePerPcpBurden
                        });
                    }

                    paths.push({
                        history: pathHistory,
                        initialAssumptions: initialAssumptions,
                        finalYear: pathHistory.length,
                        failed: state.failed,
                        failedYear: state.failedYear,
                        totalNet: state.cumulativeNet,
                        totalSharedSavings: state.cumulativeSharedSavings,
                        totalBurden: state.cumulativeBurden,
                        netAfterBurden: state.cumulativeNet - state.cumulativeBurden,
                        // Bug #10 fix: Add actual per-PCP values
                        totalPerPcpNet: state.cumulativePerPcpNet,
                        totalPerPcpBurden: state.cumulativePerPcpBurden,
                        // Clawback now embedded in netToPcps → cumulativeNet/cumulativePerPcpNet
                        totalClawback: state.cumulativeClawback || 0,
                        totalPerPcpClawback: state.cumulativePerPcpClawback || 0,
                        perPcpNetAfterBurden: state.cumulativePerPcpNet - state.cumulativePerPcpBurden
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
                monteCarloState.results = analyzeMultiYearPaths(paths, years, currentMultiYearMonteCarloView);

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
        function analyzeMultiYearPaths(paths, years, viewType = 'perPcp') {
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
            const binCount = 25;
            const binWidth = (max - min) / binCount || 1;
            const bins = [];
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
        function displayMultiYearMCResults(results) {
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
            setMultiYearTornadoMode(currentMultiYearTornadoMode);
        }

        // Draw fan chart showing cumulative net distribution over years
        function drawFanChart(yearStats, viewType = 'perPcp') {
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
                return val < 0 ? '-' + formatted : formatted;
            };
            ctx.fillText(formatAxisLabel(maxY), padding.left - 5, padding.top + 10);
            ctx.fillText(formatAxisLabel(minY), padding.left - 5, padding.top + chartHeight);

        }

        // Draw survival curve
        function drawSurvivalCurve(survivalData) {
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
        function drawStatusHeatmap(heatmapData) {
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
        function drawMultiYearHistogram(histData, stats, viewType = 'perPcp') {
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

        function resetMonteCarloDefaults() {
            // Reset state
            monteCarloState = {
                isRunning: false,
                results: null,
                basePreset: 'realistic',
                variationPct: 50,
                useTriangular: false,
                iterations: 1000,
                year1Results: null,
                multiYearPaths: null,
                multiYearResults: null,
                year1Dirty: true,
                multiYearDirty: true,
                customConstants: {},
                holdConstant: Object.assign({}, DEFAULT_HOLD_CONSTANT),
                varyEnabled: Object.assign({}, DEFAULT_VARY_ENABLED),
                multiYearConfig: {
                    yearsToProject: 10
                },
                paths: null,
                useQMC: true
            };

            // Hide all slider containers
            document.querySelectorAll('.mc-slider-container').forEach(s => s.classList.remove('visible'));

            // Reset UI
            document.getElementById('mcIterations').value = 1000;
            document.getElementById('mcIterationsDisplay').textContent = '1,000';
            document.getElementById('mcVariation').value = 50;
            document.getElementById('mcVariationDisplay').textContent = '50';
            document.getElementById('mcUseTriangular').checked = false;
            const toggleLabel = document.querySelector('.mc-toggle-label');
            if (toggleLabel) toggleLabel.textContent = 'Uniform spread';

            setMonteCarloPreset('realistic');

            // Reset checkboxes - FLIPPED: checked = held
            document.querySelectorAll('.mc-variable-checkbox').forEach(cb => {
                const varName = cb.id.replace('mcVar', '');
                const varNameLower = varName.charAt(0).toLowerCase() + varName.slice(1);
                const isHeld = monteCarloState.holdConstant[varNameLower];
                cb.checked = isHeld;  // FLIPPED: checked means held
            });

            // Update all badges for varied variables (show badge, hide slider)
            Object.keys(SLIDER_RANGES).forEach(varName => {
                const badge = document.getElementById('mcBadge' + capitalizeFirst(varName));
                const sliderContainer = getMcSliderContainer(varName);
                const isHeld = monteCarloState.holdConstant[varName];

                if (!isHeld) {
                    // Show badge with "Randomized", hide slider
                    if (badge) {
                        badge.textContent = 'Randomized';
                        badge.style.display = '';
                    }
                    if (sliderContainer) sliderContainer.classList.remove('visible');
                }
            });

            // Initialize sliders for held variables (shows sliders, hides badges)
            initMcHeldVariableSliders();

            // Hide results
            document.getElementById('mcResults').style.display = 'none';
            document.getElementById('mcNoResults').style.display = 'block';
        }

        // Update Monte Carlo funder-specific variables visibility
        function updateMonteCarloFunderVars() {
            const funder = selectedFunding || null;

            // Hide all funder variable groups
            document.getElementById('mcBankVars').style.display = 'none';
            document.getElementById('mcHospitalVars').style.display = 'none';
            document.getElementById('mcPeVars').style.display = 'none';
            document.getElementById('mcPayerVars').style.display = 'none';
            document.getElementById('mcNoFunderSelected').style.display = 'none';

            // Show appropriate group
            if (funder === 'bank') {
                document.getElementById('mcBankVars').style.display = 'block';
                document.getElementById('mcFunderGroupTitle').textContent = 'Bank Loan';
            } else if (funder === 'hospital') {
                document.getElementById('mcHospitalVars').style.display = 'block';
                document.getElementById('mcFunderGroupTitle').textContent = 'Hospital Partner';
            } else if (funder === 'pe') {
                document.getElementById('mcPeVars').style.display = 'block';
                document.getElementById('mcFunderGroupTitle').textContent = 'Private Equity';
            } else if (funder === 'payer') {
                document.getElementById('mcPayerVars').style.display = 'block';
                document.getElementById('mcFunderGroupTitle').textContent = 'Payer Advance';
            } else {
                document.getElementById('mcNoFunderSelected').style.display = 'block';
                document.getElementById('mcFunderGroupTitle').textContent = 'Funder-Specific — Select a Funder';
            }
        }

        // ============================================
        // DOM BINDINGS TABLE
        // ============================================
        // Format: [elementId, accessor(m, a), formatter]
        // accessor receives pre-computed model (m) and assumptions (a)
        const DOM_BINDINGS = [
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
            ['payerBurdenMissText', (m, a) => m.practiceBurden18mo, formatCurrency],

            // Payer Quality Miss - "What Could Have Received"
            ['qPayerSavingsPct', (m, a) => a.savingsTargetPct, String],
            ['qPayerTotalSavings', (m, a) => m.targetSavings, formatCurrency],
            ['qPayerAcoSharePct', (m, a) => a.payerSharePct, String],
            ['qPayerAcoShare', (m, a) => m.acoShare, formatCurrency],
            ['qPayerOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
            ['qPayerReserve', (m, a) => m.acoReserveFund, formatCurrency],
            ['qPayerAdvanceDeduction', (m, a) => m.payerAdvanceDeduction, formatCurrency],
            ['qPayerNetToPcps', (m, a) => m.payerNetDistributable, formatCurrency],
            ['qPayerPcpCount', (m, a) => a.pcpCount, String],
            ['qPayerPerPcp', (m, a) => m.payerNetDistributable / a.pcpCount, formatCurrency],
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
            ['qPayerNetLossMiss', (m, a) => m.practiceBurden18mo + m.payerClawbackPerPcp, formatCurrency],

            // Payer Hit scenario
            ['payerGrossShare', (m, a) => m.acoShare, formatCurrency],
            ['payerOpsRetention', (m, a) => m.acoOperationalRetention, formatCurrency],
            ['payerReserveRetention', (m, a) => m.acoReserveFund, formatCurrency],
            ['payerAdvanceDeductionHit', (m, a) => m.payerAdvanceDeduction, formatCurrency],
            ['payerNetHit', (m, a) => m.payerNetDistributable, formatCurrency],
            ['payerPcpCountHit', (m, a) => a.pcpCount, String],
            ['payerPerPcpHit', (m, a) => m.payerNetDistributable / a.pcpCount, formatCurrency],
            ['payerPerPcpHitContext', (m, a) => m.payerNetDistributable / a.pcpCount, formatCurrency],
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

        // ============================================
        // COMPUTE MODEL - All Calculations
        // ============================================
        function computeModel(options) {
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
                    payerIsUnderwater, payerUnderwaterAmount } = payerAdv;

            // Year 1 outcomes (if hit target) - all from net distributable
            // Bank: Uses bank-specific distributable (after loan retention)
            // No pre-payout deduction - loan payments come from ACO share, not PCP practices
            const bankNetY1 = bankNetDistributableShare;
            const hospitalNetY1 = hospitalNetDistributable - hospitalGainShareAmount;
            const peNetY1 = peNetToPcps;
            const payerNetY1 = payerNetDistributable;

            // Missed target calculations
            const actualSavings1Pct = totalTcoc * CONSTANTS.MISS_SCENARIO_SAVINGS_PCT;

            // Multi-year projections (only compute when on Step 5+ to avoid waste on slider drags)
            let multiYearHit = null;
            if (currentStep >= 5 && !(options && options.skipMultiYear)) {
                const baseModelForMultiYear = {
                    totalTcoc,
                    deferredMonthlyPayment,
                    acoInfrastructureTotal,
                    practiceBurdenPerPcp
                };
                const fundingForMultiYear = selectedFunding || 'bank';
                multiYearHit = computeMultiYear('hit', baseModelForMultiYear, fundingForMultiYear);
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
                payerNetOutcome: (payerNetY1 / a.pcpCount) - (practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER),

                // Multi-year projections
                multiYearHit
            };
        }

        // ============================================
        // FORMATTING HELPERS
        // ============================================
        function capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        function formatNumber(num) {
            return num.toLocaleString();
        }

        function formatCurrency(num) {
            if (!isFinite(num)) return '0';
            num = Math.abs(num);
            if (num >= 1000000000) {
                return (num / 1000000000).toFixed(1) + 'B';
            } else if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(0) + 'K';
            }
            return num.toFixed(0);
        }

        function formatCurrencyFull(num) {
            if (!isFinite(num)) return '0';
            return num.toLocaleString();
        }

        function formatSignedCurrency(num) {
            const absValue = Math.abs(num);
            let formatted;
            if (absValue >= 1000000) {
                formatted = '$' + (absValue / 1000000).toFixed(1) + 'M';
            } else if (absValue >= 1000) {
                formatted = '$' + Math.round(absValue / 1000) + 'K';
            } else {
                formatted = '$' + Math.round(absValue);
            }
            return num >= 0 ? '+' + formatted : '−' + formatted;
        }

        function applyMcStatColor(valueElementId, numericValue) {
            const valueEl = document.getElementById(valueElementId);
            if (!valueEl) return;
            const cardEl = valueEl.closest('.mc-stat-card');
            valueEl.classList.remove('success', 'danger', 'warning');
            if (cardEl) cardEl.classList.remove('success', 'danger', 'warning');
            if (numericValue > 0) {
                valueEl.classList.add('success');
                if (cardEl) cardEl.classList.add('success');
            } else if (numericValue < 0) {
                valueEl.classList.add('danger');
                if (cardEl) cardEl.classList.add('danger');
            }
        }

        // ============================================
        // VISIBILITY HELPERS
        // ============================================
        function setVisible(id, visible) {
            const el = document.getElementById(id);
            if (el) el.style.display = visible ? 'block' : 'none';
        }

        // ============================================
        // UPDATE ALL DISPLAYS
        // ============================================
        let domBindingsCache = null;
        function updateAllDisplays() {
            const m = computeModel();
            const a = assumptions.pcpCount < 1 ? { ...assumptions, pcpCount: 1 } : assumptions;

            // Apply all declarative DOM bindings (lazy-cache element lookups)
            if (!domBindingsCache) {
                domBindingsCache = new Map();
                DOM_BINDINGS.forEach(([id]) => {
                    domBindingsCache.set(id, document.getElementById(id));
                });
            }
            DOM_BINDINGS.forEach(([id, accessor, formatter]) => {
                const el = domBindingsCache.get(id);
                if (el) el.textContent = formatter(accessor(m, a));
                else if (typeof DOM_DEBUG !== 'undefined' && DOM_DEBUG) {
                    console.warn('DOM_BINDINGS: element not found for id "' + id + '"');
                }
            });

            // RAF Adjustment Lines visibility (show when enabled and ratio differs from 1.0)
            const rafAdjustmentLine = document.getElementById('rafAdjustmentLine');
            const adjustedBenchmarkLine = document.getElementById('adjustedBenchmarkLine');
            const showRafLines = a.enableRafAdjustment && Math.abs(m.rafRatio - 1.0) > 0.001;
            if (rafAdjustmentLine) rafAdjustmentLine.style.display = showRafLines ? '' : 'none';
            if (adjustedBenchmarkLine) adjustedBenchmarkLine.style.display = showRafLines ? '' : 'none';

            // Color the RAF ratio based on whether it's favorable or unfavorable
            const rafRatioContainer = document.getElementById('rafRatioCalcContainer');
            if (rafRatioContainer) {
                rafRatioContainer.style.color = m.rafRatio >= 1.0 ? '#10b981' : '#ef4444';
            }

            // Sync RAF saturation checkbox (not handled by updateSliderValues)
            const step5SatCheckbox = document.getElementById('step6RegionalRafSaturationEnabled');
            const step5SatLabel = document.getElementById('step6RegionalRafSaturationLabel');
            if (step5SatCheckbox) step5SatCheckbox.checked = a.regionalRafSaturationEnabled;
            if (step5SatLabel) step5SatLabel.textContent = a.regionalRafSaturationEnabled
                ? 'Yes (saturates like ACO)' : 'No (constant growth)';

            // Complex logic that can't be expressed as simple bindings
            const practiceBurden18mo = m.practiceBurdenPerPcp * CONSTANTS.BURDEN_18MO_MULTIPLIER;

            // Bank Hit - Year 1 Payout box (18-month burden)
            const netPerPcp = m.bankNetY1 / a.pcpCount;
            const finalPayoutAfterBurden = netPerPcp - practiceBurden18mo;
            document.getElementById('bankCheckPerPcp').textContent = formatCurrency(netPerPcp);
            document.getElementById('bankBurdenPerPcp').textContent = formatCurrency(practiceBurden18mo);
            document.getElementById('bankNetGainPerPcp').textContent = finalPayoutAfterBurden >= 0 ? '$' + formatCurrency(finalPayoutAfterBurden) : '−$' + formatCurrency(Math.abs(finalPayoutAfterBurden));

            // Bank Hit - Loan status at reconciliation (Month 18)
            // No payments made yet — payments begin Month 19+
            document.getElementById('bankOutstandingBalance').textContent = formatCurrency(m.capitalizedPrincipal);
            document.getElementById('bankRemainingMonths').textContent = a.bankTermMonths;

            // Bank netGain for conditional styling
            const bankNetGain = finalPayoutAfterBurden;

            // Hospital hit - toggle visibility based on threshold
            setVisible('hospital-cannot-hit-container', !m.hospitalMeetsThreshold);
            setVisible('hospital-success-content', m.hospitalMeetsThreshold);

            // Show/hide shared banner based on funding (hospital has its own banner)
            const isHospital = selectedFunding === 'hospital';
            setVisible('hit-target-banner', !isHospital);
            setVisible('hit-target-calculation', !isHospital);

            // Year 1 Payout Context - Hospital (with color styling)
            const hospitalPerPcpY1 = m.hospitalNetY1 / a.pcpCount;
            const hospitalNetGain = hospitalPerPcpY1 - practiceBurden18mo;
            document.getElementById('hospitalPracticeBurdenReminder').textContent = formatCurrency(practiceBurden18mo);
            document.getElementById('hospitalNetGainVsStatusQuo').textContent = hospitalNetGain >= 0 ? '$' + formatCurrency(hospitalNetGain) : '−$' + formatCurrency(Math.abs(hospitalNetGain));
            const hospitalNetGainEl = document.getElementById('hospitalNetGainSpan');
            if (hospitalNetGainEl) {
                hospitalNetGainEl.style.color = hospitalNetGain >= 0 ? '#10b981' : '#ef4444';
            }

            // Year 1 Payout Context - PE
            const pePerPcpY1 = m.peNetToPcps / a.pcpCount;
            const peNetGain = pePerPcpY1 - practiceBurden18mo;
            document.getElementById('pePracticeBurdenReminder').textContent = formatCurrency(practiceBurden18mo);
            document.getElementById('peNetGainVsStatusQuo').textContent = peNetGain >= 0 ? '$' + formatCurrency(peNetGain) : '−$' + formatCurrency(Math.abs(peNetGain));

            // ============================================
            // CONDITIONAL STYLING FOR HIT SCENARIOS
            // ============================================

            function updateRealityBox(prefix, netGain, positiveMsg, negativeMsg) {
                const box = document.getElementById(prefix + 'RealityCheckBox');
                const title = document.getElementById(prefix + 'RealityCheckTitle');
                const text = document.getElementById(prefix + 'RealityCheckText');
                const span = document.getElementById(prefix + 'NetGainSpan');
                const border = document.getElementById(prefix + 'RealityBorderDiv');
                if (!box || !title || !text) return;
                if (netGain >= 0) {
                    box.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
                    box.style.borderLeft = '4px solid #10b981';
                    title.style.color = '#166534';
                    text.innerHTML = positiveMsg;
                    text.style.color = '#166534';
                    if (span) span.style.color = '#166534';
                    if (border) border.style.borderTopColor = '#10b981';
                } else {
                    box.style.background = 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
                    box.style.borderLeft = '4px solid #ef4444';
                    title.style.color = '#991b1b';
                    text.innerHTML = negativeMsg;
                    text.style.color = '#991b1b';
                    if (span) span.style.color = '#dc2626';
                    if (border) border.style.borderTopColor = '#ef4444';
                }
            }

            updateRealityBox('bank', bankNetGain,
                `Each PCP <strong>gained ${formatCurrency(bankNetGain)}</strong> after accounting for 18 months of lost clinic time and staff costs. But the ACO isn't debt-free yet\u2014${formatCurrency(m.capitalizedPrincipal)} in loan payments remain.`,
                `<strong>Despite hitting the target</strong>, each PCP LOST ${formatCurrency(Math.abs(bankNetGain))}. The practice burden was too high\u2014and the ACO still owes ${formatCurrency(m.capitalizedPrincipal)} on the loan.`
            );
            updateRealityBox('hospital', hospitalNetGain,
                `Each PCP <strong>gained ${formatCurrency(hospitalNetGain)}</strong> after accounting for practice burden. The ACO participation was worth it\u2014barely.`,
                `<strong>Despite hitting the target</strong>, each PCP LOST ${formatCurrency(Math.abs(hospitalNetGain))}. The hospital premium consumed so much of the savings that the ACO's share couldn't cover the cost of participation.`
            );
            updateRealityBox('pe', peNetGain,
                `Each PCP <strong>gained ${formatCurrency(peNetGain)}</strong> after accounting for practice burden. The ACO participation generated real profit.`,
                `<strong>Despite hitting the target</strong>, each PCP LOST ${formatCurrency(Math.abs(peNetGain))}. The PE gain share consumed so much that the ACO's share couldn't cover participation costs.`
            );

            // Payer reality check
            const payerPerPcpY1 = m.payerNetDistributable / a.pcpCount;
            const payerNetGain = payerPerPcpY1 - practiceBurden18mo;
            const payerNetGainEl = document.getElementById('payerNetGainVsStatusQuo');
            if (payerNetGainEl) payerNetGainEl.textContent = payerNetGain >= 0 ? '$' + formatCurrency(payerNetGain) : '−$' + formatCurrency(Math.abs(payerNetGain));

            updateRealityBox('payer', payerNetGain,
                `Each PCP <strong>gained ${formatCurrency(payerNetGain)}</strong> after accounting for practice burden. However, the PMPM advance was deducted from the ACO share\u2014upfront cash came at a cost.`,
                `<strong>Despite hitting the target</strong>, each PCP LOST ${formatCurrency(Math.abs(payerNetGain))}. The PMPM advance deduction consumed so much of the ACO share that PCPs couldn't recover their practice burden.`
            );

            // Show/hide Payer underwater warning
            const payerUnderwaterWarning = document.getElementById('payerUnderwaterWarning');
            if (payerUnderwaterWarning) {
                payerUnderwaterWarning.style.display = m.payerIsUnderwater ? 'block' : 'none';
            }

            // ===== COMPARISON MATRIX - Highlighting & Color Classes =====
            // Highlight selected funder column
            ['cmpBankHeader', 'cmpHospitalHeader', 'cmpPayerHeader', 'cmpPeHeader'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('selected-funder');
            });
            ['cmpBankMiss', 'cmpBankQuality', 'cmpBankHit'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('selected-funder', selectedFunding === 'bank');
            });
            ['cmpHospitalMiss', 'cmpHospitalQuality', 'cmpHospitalHit'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('selected-funder', selectedFunding === 'hospital');
            });
            ['cmpPayerMiss', 'cmpPayerQuality', 'cmpPayerHit'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('selected-funder', selectedFunding === 'payer');
            });
            ['cmpPeMiss', 'cmpPeQuality', 'cmpPeHit'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('selected-funder', selectedFunding === 'pe');
            });

            // Also highlight header
            const headerMap = { bank: 'cmpBankHeader', hospital: 'cmpHospitalHeader', payer: 'cmpPayerHeader', pe: 'cmpPeHeader' };
            if (selectedFunding && headerMap[selectedFunding]) {
                const headerEl = document.getElementById(headerMap[selectedFunding]);
                if (headerEl) headerEl.classList.add('selected-funder');
            }

            // Update comparison matrix color classes
            const comparisonCells = [
                ['cmpBankMiss', -(m.practiceBurden18mo + m.capitalizedPrincipal / a.pcpCount)],
                ['cmpHospitalMiss', -m.practiceBurden18mo],
                ['cmpPayerMiss', -(m.practiceBurden18mo + m.payerClawbackPerPcp)],
                ['cmpPeMiss', -m.practiceBurden18mo],
                ['cmpBankQuality', -(m.practiceBurden18mo + m.capitalizedPrincipal / a.pcpCount)],
                ['cmpHospitalQuality', -m.practiceBurden18mo],
                ['cmpPayerQuality', -(m.practiceBurden18mo + m.payerClawbackPerPcp)],
                ['cmpPeQuality', -m.practiceBurden18mo],
                ['cmpBankHit', m.bankNetOutcome],
                ['cmpHospitalHit', m.hospitalMeetsThreshold ? m.hospitalNetOutcome : -m.practiceBurden18mo],
                ['cmpPayerHit', m.payerNetOutcome],
                ['cmpPeHit', m.peNetOutcome]
            ];

            comparisonCells.forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) {
                    el.classList.remove('positive', 'negative');
                    el.classList.add(value >= 0 ? 'positive' : 'negative');
                }
            });

            // Sync Step 5 inflation checkboxes with assumptions
            const step5Expenses = document.getElementById('applyInflationToExpenses');
            if (step5Expenses) step5Expenses.checked = a.applyInflationToExpenses;
            const step5Burden = document.getElementById('applyInflationToBurden');
            if (step5Burden) step5Burden.checked = a.applyInflationToBurden;
            const step5Benchmark = document.getElementById('applyInflationToBenchmark');
            if (step5Benchmark) step5Benchmark.checked = a.applyInflationToBenchmark;
            const step5Ratchet = document.getElementById('applyInflationToRatchet');
            if (step5Ratchet) step5Ratchet.checked = a.applyInflationToRatchet;

            // Sync MC inflation checkboxes with assumptions
            const mcExpenses = document.getElementById('mcApplyInflationToExpenses');
            if (mcExpenses) mcExpenses.checked = a.applyInflationToExpenses;
            const mcBurden = document.getElementById('mcApplyInflationToBurden');
            if (mcBurden) mcBurden.checked = a.applyInflationToBurden;
            const mcBenchmark = document.getElementById('mcApplyInflationToBenchmark');
            if (mcBenchmark) mcBenchmark.checked = a.applyInflationToBenchmark;
            const mcRatchet = document.getElementById('mcApplyInflationToRatchet');
            if (mcRatchet) mcRatchet.checked = a.applyInflationToRatchet;

            // Update slider values
            updateSliderValues();

            return m;
        }

        // ============================================
        // UPDATE SLIDER VALUES (sync with assumptions)
        // ============================================
        function updateSliderValues() {
            // Sliders where element ID matches assumption key
            const sliders = [
                'pcpCount', 'patientsPerPcp', 'attributionPct', 'tcocPerPatient', 'savingsTargetPct', 'payerSharePct', 'msrPct', 'qualityGatePct',
                'acoBaseRaf', 'regionalBaseRaf',
                'dataAnalyticsCost', 'careManagerRatio', 'careManagerSalary', 'adminCost', 'itCost', 'legalCost', 'qualityCost',
                'lostHoursPerWeek', 'revenuePerVisit', 'visitsPerHour', 'practiceStaffFtePerPcp', 'practiceStaffSalary',
                'bankInterestRate', 'bankTermMonths', 'bankOrigFee',
                'hospitalReferralLock', 'hospitalCostPremium', 'hospitalGainShare', 'hospitalReferralPct',
                'payerPmpm', 'payerClawbackPct', 'payerPmpmRatchet',
                'peEquityShare', 'peBoardControl', 'peExitYears',
                'multiYearCount', 'multiYearSavingsTargetPct', 'multiYearMsrPct',
                'benchmarkRatchetPct', 'hospitalPremiumGrowthPct', 'inflationPct',
                'acoStartingQualityPct', 'acoQualityImprovementPct', 'qualityGateRatchetPct', 'acoMaxQualityPct', 'qualityGateCeiling'
            ];

            // Sliders where element ID differs from assumption key (Step 5/6 duplicates)
            const mappedSliders = [
                ['step6PayerPmpm', 'payerPmpm'],
                ['step6PayerClawbackPct', 'payerClawbackPct'],
                ['step6PayerPmpmRatchet', 'payerPmpmRatchet'],
                ['step6AcoBaseRaf', 'acoBaseRaf'],
                ['step6RegionalBaseRaf', 'regionalBaseRaf'],
                ['step6AcoRafGrowthPct', 'acoRafGrowthPct'],
                ['step6RegionalRafGrowthPct', 'regionalRafGrowthPct'],
                ['step6RafOptimizationPeakYear', 'rafOptimizationPeakYear'],
                ['step6RafOptimizationFloor', 'rafOptimizationFloor'],
                ['step6CodingIntensityCap', 'codingIntensityCap'],
                ['step5AcoStartingQualityPct', 'acoStartingQualityPct']
            ];

            sliders.forEach(key => {
                const el = document.getElementById(key);
                if (el) {
                    el.value = assumptions[key];
                }
            });

            mappedSliders.forEach(([elementId, assumptionKey]) => {
                const el = document.getElementById(elementId);
                if (el) {
                    el.value = assumptions[assumptionKey];
                }
            });
        }

        // ============================================
        // UPDATE ASSUMPTION
        // ============================================
        function updateAssumption(key, value) {
            // Handle boolean values (checkboxes) vs numeric values (sliders)
            if (typeof value === 'boolean') {
                assumptions[key] = value;
            } else {
                assumptions[key] = parseFloat(value);
            }

            // One-way live sync: Step 1 contract params push to Step 5
            if (key === 'savingsTargetPct') {
                assumptions.multiYearSavingsTargetPct = assumptions.savingsTargetPct;
                const slider = document.getElementById('multiYearSavingsTargetPct');
                if (slider) slider.value = assumptions.multiYearSavingsTargetPct;
                const display = document.getElementById('multiYearSavingsTargetPctDisplay');
                if (display) display.textContent = assumptions.multiYearSavingsTargetPct.toFixed(1);
            } else if (key === 'msrPct') {
                assumptions.multiYearMsrPct = assumptions.msrPct;
                const slider = document.getElementById('multiYearMsrPct');
                if (slider) slider.value = assumptions.multiYearMsrPct;
                const display = document.getElementById('multiYearMsrPctDisplay');
                if (display) display.textContent = assumptions.multiYearMsrPct.toFixed(1);
            }

            activePreset = null;
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            updateAllDisplays();

            // Update Monte Carlo funder-specific variables
            updateMonteCarloFunderVars();

            // If on multi-year step, update the displays
            if (currentStep === 5) {
                updateMultiYearDisplays();
            }

            // Mark MC results as stale when any assumption changes
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;
        }

        // ============================================
        // APPLY PRESET
        // ============================================
        function applyPreset(preset) {
            const presetObj = PRESETS[preset];
            if (!presetObj) return;

            Object.assign(assumptions, presetObj);
            activePreset = preset;
            step5Initialized = false;

            // Update preset button styles
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.querySelector(`.preset-btn.${preset}`);
            if (activeBtn) activeBtn.classList.add('active');

            updateAllDisplays();

            // Update Monte Carlo funder-specific variables
            updateMonteCarloFunderVars();
        }

        // ============================================
        // NAVIGATION
        // ============================================
        const STEP_NAMES = ['1. Setup', '2. Opportunity', '3. Costs', '4. Funding', '5. Outcomes', '6. Projection', '7. Monte Carlo'];

        function updateProgress() {
            const totalSteps = 7;
            const progress = (currentStep / (totalSteps - 1)) * 100;
            document.getElementById('progressFill').style.width = progress + '%';

            for (let i = 0; i < totalSteps; i++) {
                const stepEl = document.getElementById('progress-' + i);
                stepEl.classList.remove('active', 'completed');
                if (i < currentStep) {
                    stepEl.classList.add('completed');
                } else if (i === currentStep) {
                    stepEl.classList.add('active');
                }
            }

            // Update mobile step label
            const stepLabel = document.getElementById('currentStepLabel');
            if (stepLabel) stepLabel.textContent = STEP_NAMES[currentStep];

        }

        function showStep(stepNumber) {
            document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
            document.getElementById('step' + stepNumber).classList.add('active');
            currentStep = stepNumber;
            updateProgress();
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Update outcome displays when reaching step 4
            if (stepNumber === 4) {
                updateOutcomeDisplays();
            }

            // Update multi-year displays when reaching step 5
            if (stepNumber === 5) {
                // Initialize multi-year contract parameters from Step 1 values (first visit only)
                if (!step5Initialized) {
                    assumptions.multiYearSavingsTargetPct = assumptions.savingsTargetPct;
                    assumptions.multiYearMsrPct = assumptions.msrPct;
                    step5Initialized = true;
                }

                // Update slider positions to match
                document.getElementById('multiYearSavingsTargetPct').value = assumptions.multiYearSavingsTargetPct;
                document.getElementById('multiYearMsrPct').value = assumptions.multiYearMsrPct;
                document.getElementById('multiYearSavingsTargetPctDisplay').textContent = assumptions.multiYearSavingsTargetPct.toFixed(1);
                document.getElementById('multiYearMsrPctDisplay').textContent = assumptions.multiYearMsrPct.toFixed(1);

                // Show/hide Funder-Specific group based on selected funding
                const funderSpecificGroup = document.getElementById('group-funder-specific');
                if (funderSpecificGroup) {
                    // Show group only for hospital or payer (bank and PE have no funder-specific params)
                    funderSpecificGroup.style.display = (selectedFunding === 'hospital' || selectedFunding === 'payer') ? 'block' : 'none';
                }

                // Show Hospital Premium Growth slider only for Hospital funding
                const hospitalPremiumRow = document.getElementById('hospitalPremiumGrowthRow');
                if (hospitalPremiumRow) {
                    hospitalPremiumRow.style.display = selectedFunding === 'hospital' ? 'flex' : 'none';
                }

                // Show Payer Parameters only for Payer funding
                const step6PayerParams = document.getElementById('step6PayerParams');
                if (step6PayerParams) {
                    step6PayerParams.style.display = selectedFunding === 'payer' ? 'block' : 'none';
                }

                updateMultiYearDisplays();
            }

            // Update Monte Carlo displays when reaching step 6
            if (stepNumber === 6) {
                // Default to bank if no funder selected (for direct jump)
                if (!selectedFunding) {
                    selectedFunding = 'bank';
                }

                // Update funder button states
                updateMcFunderButtons(selectedFunding);

                // Initialize held variable sliders
                initMcHeldVariableSliders();

                // Update funder-specific variables display
                updateMonteCarloFunderVars();
            }
        }

        function toggleSliderGroup(groupId) {
            const group = document.getElementById(groupId);
            if (group) {
                group.classList.toggle('collapsed');
            }
        }

        function toggleTableColumns(btn) {
            const table = btn.parentElement.querySelector('.multi-year-table');
            if (!table) return;
            table.classList.toggle('show-all-cols');
            btn.textContent = table.classList.contains('show-all-cols') ? 'Hide Extra Columns' : 'Show All Columns';
        }

        function showMultiYearView(view) {
            currentMultiYearView = view;

            // Update tab active states
            document.getElementById('viewTabFinancial').classList.toggle('active', view === 'financial');
            document.getElementById('viewTabQuality').classList.toggle('active', view === 'quality');

            // Show/hide appropriate containers
            document.getElementById('financialViewTable').style.display = view === 'financial' ? 'block' : 'none';
            document.getElementById('qualityViewTable').style.display = view === 'quality' ? 'block' : 'none';
        }

        // Monte Carlo tab toggle (Year 1 vs Multi-Year)
        let currentMcTab = 'year1';  // 'year1' or 'multiyear'

        function showMonteCarloTab(tab) {
            currentMcTab = tab;

            // Update tab active states
            document.getElementById('mcTabYear1').classList.toggle('active', tab === 'year1');
            document.getElementById('mcTabMultiYear').classList.toggle('active', tab === 'multiyear');

            // Show/hide Years to Project slider in Simulation Settings
            const yearsRow = document.getElementById('mcYearsToProjectRow');
            if (yearsRow) {
                yearsRow.style.display = tab === 'multiyear' ? 'flex' : 'none';
            }

            // Show cached results if available and not dirty, otherwise show placeholder
            document.getElementById('mcResults').style.display = 'none';
            document.getElementById('myMcResults').style.display = 'none';

            if (tab === 'year1') {
                // Check for cached Year 1 results
                if (monteCarloState.year1Results && !monteCarloState.year1Dirty) {
                    // Restore cached results
                    monteCarloState.results = monteCarloState.year1Results;
                    displayMonteCarloResults({
                        basePreset: monteCarloState.basePreset,
                        variationPct: monteCarloState.variationPct,
                        iterations: monteCarloState.iterations,
                        funding: selectedFunding || 'bank'
                    });
                } else {
                    document.getElementById('mcNoResults').style.display = 'block';
                }
            } else {
                // Check for cached Multi-Year results
                if (monteCarloState.multiYearPaths && monteCarloState.multiYearResults && !monteCarloState.multiYearDirty) {
                    // Restore cached results
                    monteCarloState.paths = monteCarloState.multiYearPaths;
                    displayMultiYearMCResults(monteCarloState.multiYearResults);
                } else {
                    document.getElementById('mcNoResults').style.display = 'block';
                }
            }

            // Update run button text
            const runBtn = document.getElementById('mcRunBtn');
            if (runBtn) {
                runBtn.innerHTML = tab === 'year1'
                    ? '<span>&#127922;</span> Run Year 1 Simulation'
                    : '<span>&#127922;</span> Run Multi-Year Simulation';
            }

            // Update iterations slider for multi-year (fewer iterations needed with QMC)
            const iterSlider = document.getElementById('mcIterations');
            const iterDisplay = document.getElementById('mcIterationsDisplay');
            if (tab === 'multiyear') {
                iterSlider.max = '2000';
                if (parseInt(iterSlider.value) > 2000) {
                    iterSlider.value = '500';
                    iterDisplay.textContent = '500';
                    monteCarloState.iterations = 500;
                }
            } else {
                iterSlider.max = '10000';
            }
        }

        function nextStep() {
            if (currentStep < 6) {
                showStep(currentStep + 1);
            }
        }

        function prevStep() {
            if (currentStep > 0) {
                showStep(currentStep - 1);
            }
        }

        function restart() {
            selectedFunding = null;
            applyPreset('realistic');
            document.getElementById('fundingSelection').style.display = 'none';
            document.getElementById('fundingNextBtn').disabled = true;
            document.querySelectorAll('.choice-card').forEach(card => card.classList.remove('expanded'));
            showStep(0);
        }

        // ============================================
        // FUNDING SELECTION
        // ============================================
        function selectFunding(funding) {
            selectedFunding = funding;

            // Collapse all cards, expand selected one (accordion behavior)
            document.querySelectorAll('.choice-card').forEach(card => {
                card.classList.remove('expanded');
            });
            document.getElementById('choice-' + funding).classList.add('expanded');

            // Update selection text
            document.getElementById('selectedFundingText').textContent = FUNDING_CONFIG[funding].fullName;
            document.getElementById('fundingSelection').style.display = 'block';
            document.getElementById('fundingNextBtn').disabled = false;

            updateAllDisplays();

            // Update Monte Carlo funder-specific variables
            updateMonteCarloFunderVars();

            // Sync Monte Carlo funder buttons
            updateMcFunderButtons(funding);

            // Mark both simulations as dirty and clear cached results
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;
            monteCarloState.results = null;
            monteCarloState.year1Results = null;
            monteCarloState.multiYearPaths = null;
            monteCarloState.multiYearResults = null;
        }

        // Jump directly to Monte Carlo from Step 1
        function jumpToMonteCarlo() {
            // Default to bank funding if not already selected
            if (!selectedFunding) {
                selectedFunding = 'bank';
            }
            // Ensure Step 5 multi-year params are initialized from Step 1 values
            if (!step5Initialized) {
                assumptions.multiYearSavingsTargetPct = assumptions.savingsTargetPct;
                assumptions.multiYearMsrPct = assumptions.msrPct;
                step5Initialized = true;
            }
            // Update funder-specific variables display
            updateMonteCarloFunderVars();
            // Update funder buttons
            updateMcFunderButtons(selectedFunding);
            // Navigate to Step 6 (Monte Carlo)
            showStep(6);
        }

        // Change funder selection from within Monte Carlo (Step 7)
        function setMcFunder(funder) {
            if (monteCarloState.isRunning) return;
            selectedFunding = funder;

            // Mark both simulations as dirty
            monteCarloState.year1Dirty = true;
            monteCarloState.multiYearDirty = true;

            // Update funder button states
            updateMcFunderButtons(funder);

            // Update funder-specific variable display
            updateMonteCarloFunderVars();

            // Clear stale results
            monteCarloState.results = null;
            monteCarloState.year1Results = null;
            monteCarloState.multiYearPaths = null;
            monteCarloState.multiYearResults = null;

            // Reset results display
            document.getElementById('mcResults').style.display = 'none';
            document.getElementById('myMcResults').style.display = 'none';
            document.getElementById('mcNoResults').style.display = 'block';

            // Recalculate the model with new funding selection
            updateAllDisplays();
        }

        // Update Monte Carlo funder button states
        function updateMcFunderButtons(funder) {
            document.querySelectorAll('.mc-funder-btn').forEach(btn => btn.classList.remove('active'));
            const funderIdMap = { bank: 'mcFunderBank', hospital: 'mcFunderHospital', payer: 'mcFunderPayer', pe: 'mcFunderPe' };
            const btnId = funderIdMap[funder];
            if (btnId) {
                const btn = document.getElementById(btnId);
                if (btn) btn.classList.add('active');
            }
        }

        // Prevent clicks inside funding params from triggering card selection
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.funding-params').forEach(params => {
                params.addEventListener('click', (e) => e.stopPropagation());
            });

            // Make tooltip icons focusable and accessible on touch devices
            document.querySelectorAll('.tooltip-icon').forEach(icon => {
                icon.setAttribute('tabindex', '0');
                icon.setAttribute('role', 'button');
                icon.setAttribute('aria-label', 'More info');
            });

            // Stop tooltip pulse after user engages or after 10 seconds
            function stopTooltipPulse() {
                document.body.classList.add('tooltip-seen');
            }
            document.querySelectorAll('.tooltip-icon').forEach(icon => {
                icon.addEventListener('mouseenter', stopTooltipPulse, { once: true });
                icon.addEventListener('focus', stopTooltipPulse, { once: true });
            });
            setTimeout(stopTooltipPulse, 10000);

            // Toggle tooltip on touch/click for mobile devices
            let activeTooltipIcon = null;
            document.addEventListener('click', function(e) {
                const icon = e.target.closest('.tooltip-icon');
                if (icon) {
                    e.preventDefault();
                    if (activeTooltipIcon && activeTooltipIcon !== icon) {
                        activeTooltipIcon.blur();
                    }
                    if (activeTooltipIcon === icon) {
                        icon.blur();
                        activeTooltipIcon = null;
                    } else {
                        icon.focus();
                        activeTooltipIcon = icon;
                    }
                } else if (activeTooltipIcon) {
                    activeTooltipIcon.blur();
                    activeTooltipIcon = null;
                }
            });
        });

        // ============================================
        // UPDATE OUTCOME DISPLAYS
        // ============================================
        function updateOutcomeDisplays() {
            if (!selectedFunding) return;

            document.getElementById('selectedFunderOutcome').textContent = FUNDING_CONFIG[selectedFunding].shortName;

            // Show relevant funder outcomes (Year 2 is now in Step 6)
            ['bank', 'hospital', 'payer', 'pe'].forEach(f => {
                const missEl = document.getElementById('miss-' + f);
                const hitEl = document.getElementById('hit-' + f);

                if (f === selectedFunding) {
                    if (missEl) missEl.classList.add('active');
                    if (hitEl) hitEl.classList.add('active');
                } else {
                    if (missEl) missEl.classList.remove('active');
                    if (hitEl) hitEl.classList.remove('active');
                }
            });

            // Also toggle quality miss funder outcomes
            ['bank', 'hospital', 'payer', 'pe'].forEach(funder => {
                const qualityOutcome = document.getElementById('quality-' + funder);
                if (qualityOutcome) {
                    qualityOutcome.classList.toggle('active', funder === selectedFunding);
                }
            });

            const m = updateAllDisplays();

            // Update Monte Carlo funder-specific variables
            updateMonteCarloFunderVars();

            // Auto-select scenario for hospital based on threshold
            // If hospital premium causes MSR miss, auto-redirect to Missed Target
            if (selectedFunding === 'hospital' && m) {
                if (!m.hospitalMeetsThreshold) {
                    showScenario('miss');  // Auto-redirect to Missed Target
                } else {
                    showScenario('hit');   // Hospital can hit target with favorable terms
                }
            }
        }

        // ============================================
        // SCENARIO TABS
        // ============================================
        function showScenario(scenario) {
            document.querySelectorAll('.scenario-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.scenario-content').forEach(content => content.classList.remove('active'));

            const tab = document.querySelector(`.scenario-tab.${scenario}`);
            const content = document.getElementById('scenario-' + scenario);
            if (tab) tab.classList.add('active');
            if (content) content.classList.add('active');

            // Show/hide banners based on scenario and funding type
            const isHospital = selectedFunding === 'hospital';

            if (scenario === 'hit') {
                setVisible('hit-target-banner', !isHospital);
                setVisible('hit-target-calculation', !isHospital);
            }

            if (scenario === 'miss') {
                setVisible('shared-miss-banner', !isHospital);
                setVisible('hospital-miss-banner', isHospital);
                setVisible('shared-miss-calculation', !isHospital);
            }

            // Quality miss scenario - show appropriate funder outcomes
            if (scenario === 'quality') {
                ['bank', 'hospital', 'payer', 'pe'].forEach(funder => {
                    const outcomeEl = document.getElementById('quality-' + funder);
                    if (outcomeEl) {
                        outcomeEl.classList.toggle('active', funder === selectedFunding);
                    }
                });
            }
        }

        // ============================================
        // MULTI-YEAR PROJECTION DISPLAY
        // ============================================
        function updateMultiYearDisplays() {
            const m = computeModel();
            const data = m.multiYearHit;

            // Update funder label
            const funderLabel = document.getElementById('selectedFunderMultiYear');
            if (funderLabel && selectedFunding) {
                funderLabel.textContent = FUNDING_CONFIG[selectedFunding].shortName;
            }

            // Update summary stats
            const totalNet = data.totalNet;
            document.getElementById('multiYearTotalNet').textContent = totalNet >= 0
                ? '$' + formatCurrency(totalNet)
                : '−$' + formatCurrency(Math.abs(totalNet));
            // Handle negative values: show "−$6.2M" not "$-6184646"
            const netAfterBurden = data.netAfterBurden;
            document.getElementById('multiYearNetAfterBurden').textContent = netAfterBurden >= 0
                ? '$' + formatCurrency(netAfterBurden)
                : '−$' + formatCurrency(Math.abs(netAfterBurden));
            const avgPerDoc = data.avgNetAfterBurdenPerPcp;
            document.getElementById('multiYearAvgPerPcp').textContent = avgPerDoc >= 0
                ? '$' + formatCurrency(avgPerDoc)
                : '−$' + formatCurrency(Math.abs(avgPerDoc));

            // Years with Payout card
            document.getElementById('multiYearPayoutYears').textContent =
                `${data.yearsWithPayout}/${assumptions.multiYearCount}`;
            const payoutCard = document.getElementById('multiYearPayoutYearsCard');
            if (payoutCard) {
                payoutCard.classList.remove('success', 'warning', 'danger');
                const payoutRatio = data.yearsWithPayout / assumptions.multiYearCount;
                if (payoutRatio >= 0.8) {
                    payoutCard.classList.add('success');
                } else if (payoutRatio >= 0.5) {
                    payoutCard.classList.add('warning');
                } else {
                    payoutCard.classList.add('danger');
                }
            }

            // Quality crossover warning
            const crossoverWarning = document.getElementById('qualityCrossoverWarning');
            if (data.qualityCrossoverYear && data.qualityCrossoverYear <= assumptions.multiYearCount) {
                crossoverWarning.style.display = 'block';
                document.getElementById('qualityCrossoverYear').textContent = data.qualityCrossoverYear;
                document.getElementById('maxQualityDisplay').textContent = assumptions.acoMaxQualityPct;
            } else {
                crossoverWarning.style.display = 'none';
            }

            // Gate > Ceiling warning
            const gateExceedsCeilingWarning = document.getElementById('gateExceedsCeilingWarning');
            if (gateExceedsCeilingWarning) {
                if (assumptions.qualityGatePct > assumptions.qualityGateCeiling) {
                    gateExceedsCeilingWarning.style.display = 'block';
                    document.getElementById('gateExceedsCeilingGate').textContent = assumptions.qualityGatePct;
                    document.getElementById('gateExceedsCeilingCap').textContent = assumptions.qualityGateCeiling;
                } else {
                    gateExceedsCeilingWarning.style.display = 'none';
                }
            }

            // Quality gate disabled note (gate = 0 means quality miss is impossible)
            const qualityGateDisabledNote = document.getElementById('qualityGateDisabledNote');
            const qualityMissBanner = document.querySelector('#scenario-quality .result-banner');
            const qualityMissTldr = qualityMissBanner ? qualityMissBanner.nextElementSibling : null;
            if (qualityGateDisabledNote) {
                if (assumptions.qualityGatePct <= 0) {
                    qualityGateDisabledNote.style.display = 'block';
                    if (qualityMissBanner) qualityMissBanner.style.display = 'none';
                    if (qualityMissTldr) qualityMissTldr.style.display = 'none';
                } else {
                    qualityGateDisabledNote.style.display = 'none';
                    if (qualityMissBanner) qualityMissBanner.style.display = '';
                    if (qualityMissTldr) qualityMissTldr.style.display = '';
                }
            }

            // Conditional styling for Net After Burden card (green if positive, red if negative)
            const netAfterBurdenCard = document.getElementById('multiYearNetAfterBurdenCard');
            if (netAfterBurdenCard) {
                netAfterBurdenCard.classList.remove('success', 'danger');
                if (data.netAfterBurden >= 0) {
                    netAfterBurdenCard.classList.add('success');
                } else {
                    netAfterBurdenCard.classList.add('danger');
                }
            }

            // Conditional styling for Avg Per PCP card (same logic)
            const avgPerPcpCard = document.getElementById('multiYearAvgPerPcpCard');
            if (avgPerPcpCard) {
                avgPerPcpCard.classList.remove('success', 'danger');
                if (data.avgNetAfterBurdenPerPcp >= 0) {
                    avgPerPcpCard.classList.add('success');
                } else {
                    avgPerPcpCard.classList.add('danger');
                }
            }

            // Update stat card styling based on scenario
            const totalNetCard = document.getElementById('multiYearTotalNet').closest('.stat-card');
            if (totalNetCard) {
                totalNetCard.classList.remove('success', 'danger');
                if (data.totalNet > 0) {
                    totalNetCard.classList.add('success');
                } else if (data.failedYear) {
                    totalNetCard.classList.add('danger');
                }
            }

            // Show/hide failure banner
            const failureBanner = document.getElementById('multiYearFailureBanner');
            if (data.failedYear) {
                failureBanner.style.display = 'block';
                document.getElementById('multiYearFailedYear').textContent = data.failedYear;
            } else {
                failureBanner.style.display = 'none';
            }

            // Update dynamic column header based on funding type
            const deductionHeader = document.getElementById('deductionHeader');
            const subtitleStyle = 'font-size: 0.75em; font-weight: normal; color: #94a3b8;';
            if (selectedFunding === 'bank') {
                deductionHeader.innerHTML = `Loan Payment<div style="${subtitleStyle}">(annual)</div>`;
            } else if (selectedFunding === 'hospital') {
                deductionHeader.innerHTML = `Hospital Share<div style="${subtitleStyle}">(gain share)</div>`;
            } else if (selectedFunding === 'payer') {
                deductionHeader.innerHTML = `PMPM Deduction<div style="${subtitleStyle}">(advance repaid)</div>`;
            } else {
                deductionHeader.innerHTML = `PE Share<div style="${subtitleStyle}">(gain share)</div>`;
            }

            // Show/hide RAF ratio column and warning based on RAF enabled
            const rafEnabled = assumptions.enableRafAdjustment;
            const rafRatioHeader = document.getElementById('rafRatioHeader');
            if (rafRatioHeader) {
                rafRatioHeader.style.display = rafEnabled ? '' : 'none';
            }

            // RAF Fell Behind warning
            const rafFellBehindWarning = document.getElementById('rafFellBehindWarning');
            if (rafFellBehindWarning) {
                if (rafEnabled && data.yearRafFellBehind && data.yearRafFellBehind <= assumptions.multiYearCount) {
                    rafFellBehindWarning.style.display = 'block';
                    document.getElementById('rafFellBehindYear').textContent = data.yearRafFellBehind;
                } else {
                    rafFellBehindWarning.style.display = 'none';
                }
            }

            // Render Financial View table
            const tbody = document.getElementById('multiYearTableBody');
            let missStreak = 0;
            let failedStreak = 0;
            tbody.innerHTML = data.rows.map(row => {
                // Show loan payment for bank, PMPM deduction for payer, gain share for hospital/PE
                let deduction;
                if (selectedFunding === 'bank') {
                    deduction = row.loanPayment;
                } else if (selectedFunding === 'payer') {
                    deduction = row.payerAdvanceDeduction || 0;
                } else {
                    deduction = row.partnerGainShare;
                }
                // Convert status to CSS class (e.g., "TCOC Miss" -> "tcoc-miss")
                const statusClass = row.status.toLowerCase().replace(' ', '-');
                const reserveChangeStr = row.reserveChange >= 0
                    ? '+$' + formatCurrency(row.reserveChange)
                    : '−$' + formatCurrency(Math.abs(row.reserveChange));

                // Track consecutive miss/failed streaks for deepening tints
                const isMissType = ['TCOC Miss', 'Quality Miss', 'Both Miss'].includes(row.status);
                const isFailed = row.status === 'Failed';
                if (isFailed) { failedStreak++; missStreak = 0; }
                else if (isMissType) { missStreak++; failedStreak = 0; }
                else { missStreak = 0; failedStreak = 0; }
                let streakClass = '';
                if (isMissType && missStreak >= 2) streakClass = ` ${statusClass}-streak-${Math.min(missStreak, 3)}`;
                if (isFailed && failedStreak >= 2) streakClass = ` failed-streak-${Math.min(failedStreak, 3)}`;

                // Status color coding
                let statusStyle = 'font-weight: 600;';
                if (row.status === 'Failed') statusStyle += ' color: #dc2626;';
                else if (row.status === 'Quality Miss') statusStyle += ' color: #d97706;';
                else if (row.status === 'Both Miss') statusStyle += ' color: #dc2626;';
                else if (row.status === 'TCOC Miss') statusStyle += ' color: #b45309;';

                // RAF ratio column (conditionally included)
                const rafRatioCell = rafEnabled
                    ? `<td style="${row.isBelowMarket ? 'color: #ef4444;' : ''}">${row.rafRatio.toFixed(3)}x</td>`
                    : '';

                return `
                    <tr class="${statusClass}${streakClass}">
                        <td>${row.year}</td>
                        <td>$${formatCurrency(row.benchmark)}</td>
                        ${rafRatioCell}
                        <td>${row.savingsPct.toFixed(1)}%</td>
                        <td>$${formatCurrency(row.acoShare)}</td>
                        <td>$${formatCurrency(row.opsRetention)}</td>
                        <td>${reserveChangeStr}</td>
                        <td>$${formatCurrency(row.endingReserve)}</td>
                        <td>$${formatCurrency(deduction)}</td>
                        <td>${row.netToPcps >= 0 ? '$' + formatCurrency(row.netToPcps) : '−$' + formatCurrency(Math.abs(row.netToPcps))}</td>
                        <td style="${statusStyle}">${row.status}</td>
                    </tr>
                `;
            }).join('');

            // Render Quality View table
            const qualityTbody = document.getElementById('qualityViewTableBody');
            qualityTbody.innerHTML = data.rows.map(row => {
                const statusClass = row.status.toLowerCase().replace(' ', '-');
                const margin = row.qualityMargin;
                const marginStr = margin >= 0
                    ? `<span style="color: #059669;">+${margin.toFixed(1)}%</span>`
                    : `<span style="color: #dc2626;">${margin.toFixed(1)}%</span>`;

                const qualityBadge = row.qualityPass
                    ? '<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">PASS</span>'
                    : '<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">FAIL</span>';

                // TCOC status badge
                let tcocBadge;
                if (row.tcocStatus === 'Hit') {
                    tcocBadge = '<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">Hit</span>';
                } else if (row.tcocStatus === 'Partial') {
                    tcocBadge = '<span style="background: #fef9c3; color: #854d0e; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">Partial</span>';
                } else {
                    tcocBadge = '<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">Miss</span>';
                }

                // Outcome badge with payout status
                let outcomeBadge;
                if (row.status === 'Hit' || row.status === 'Partial') {
                    outcomeBadge = row.netToPcps >= 0
                        ? `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">$${formatCurrency(row.netToPcps)}</span>`
                        : `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">−$${formatCurrency(Math.abs(row.netToPcps))}</span>`;
                } else if (row.status === 'Failed') {
                    outcomeBadge = '<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">FAILED</span>';
                } else {
                    outcomeBadge = row.netToPcps < 0
                        ? `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">\u2212$${formatCurrency(Math.abs(row.netToPcps))}</span>`
                        : '<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">$0</span>';
                }

                return `
                    <tr class="${statusClass}">
                        <td>${row.year}</td>
                        <td>${row.qualityGateRequired.toFixed(1)}%</td>
                        <td>${row.achievedQuality.toFixed(1)}%${row.atQualityCeiling ? ' <span style="font-size:0.75em;color:#94a3b8;">(ceiling)</span>' : ''}</td>
                        <td>${marginStr}</td>
                        <td>${qualityBadge}</td>
                        <td>${tcocBadge}</td>
                        <td>${outcomeBadge}</td>
                    </tr>
                `;
            }).join('');
        }

        // ============================================
        // COMPARISON MATRIX TOGGLE
        // ============================================
        function toggleComparison() {
            const toggle = document.querySelector('.comparison-toggle');
            const grid = document.getElementById('comparisonGrid');
            toggle.classList.toggle('open');
            grid.classList.toggle('open');
        }

        // ============================================
        // TEST HARNESS
        // ============================================

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
        function captureBaseline() {
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
        function runTests() {
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
            const savedStep = currentStep;
            const savedFunding = selectedFunding;
            currentStep = 5;

            // Bank multi-year test
            applyPreset('realistic');
            selectedFunding = 'bank';
            const mBank = computeModel();
            const myBankHit = mBank.multiYearHit;
            assertExact('my bank rows', myBankHit.rows.length, 9);
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
            selectedFunding = 'payer';
            const mPayer = computeModel();
            const myPayerHit = mPayer.multiYearHit;
            assertExact('my payer rows', myPayerHit.rows.length, 9);

            // Worst case failure test
            applyPreset('worst');
            selectedFunding = 'bank';
            const mWorstMy = computeModel();
            const myWorstHit = mWorstMy.multiYearHit;
            assertExact('my worst has failedYear', myWorstHit.failedYear !== null, true);

            // Quality crossover test (realistic)
            applyPreset('realistic');
            selectedFunding = 'bank';
            const mQual = computeModel();
            const myQualHit = mQual.multiYearHit;
            if (myQualHit.qualityCrossoverYear !== null) {
                assertExact('quality crossover > 1', myQualHit.qualityCrossoverYear > 1, true);
            } else {
                results.passed++; // No crossover within 20 years is valid
            }

            // Restore state
            currentStep = savedStep;
            selectedFunding = savedFunding;
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

            // Report results
            console.log(`\n========== TEST RESULTS ==========`);
            console.log(`Passed: ${results.passed}`);
            console.log(`Failed: ${results.failed}`);
            if (results.failures.length > 0) {
                console.log('\nFailures:');
                console.table(results.failures);
            } else {
                console.log('\n✓ All tests passed!');
            }
            return results.failed === 0;
        }

        // ============================================
        // INITIALIZE
        // ============================================
        applyPreset('realistic');
        updateProgress();
