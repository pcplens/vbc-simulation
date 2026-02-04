# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-file educational simulation for ACO financial trade-offs. File: `regional_aco_simulation.html` (~11000 lines, ~1MB with embedded logo). No build tools or dependencies.

**Author:** Sudeep Bansal, MD, MS | **Website:** www.PCPLens.com

## Architecture

### Code Organization
```
CONSTANTS             - Fixed business rules (deferral months, high-risk %, etc.)
METRIC_TOOLTIPS       - Tooltip explanations for calculation box metrics
MC_VARIABLE_TOOLTIPS  - Tooltip explanations for Monte Carlo variable controls
FUNDING_CONFIG        - Funding type labels (shortName, fullName, partnerName)
PRESETS               - Preset configurations (worst/realistic/best)
SLIDER_RANGES         - Min/max bounds for Monte Carlo sampling
MONTE_CARLO_CONFIG    - Batch size, histogram bins, percentiles
ANNUAL_SHOCK_CONFIG   - Parameters varied each year in multi-year Monte Carlo
SOBOL_PRIMITIVES      - Joe-Kuo direction numbers for Quasi-Monte Carlo (150 dimensions)
SOBOL_DIRECTIONS      - Computed direction vectors from SOBOL_PRIMITIVES
DOM_BINDINGS          - Declarative DOM updates (~200 entries, prefix: qBank*, qHosp*, qPayer*, qPe*)

computeRafAdjustment()  - HCC/RAF benchmark adjustment with saturation curve
computeCore()           - Patients, TCOC, RAF-adjusted savings, MSR threshold
computeInfrastructure() - Care managers, infrastructure costs
computePracticeBurden() - Lost FFS, practice staff costs
computeBankLoan()       - Deferred payment model, loan allocation
computeHospital()       - Premium logic, threshold check
computePayerAdvance()   - PMPM advance, clawback, ratcheting
computePE()             - PE gain share
computeMultiYear()      - Multi-year projection with ratcheting + RAF tracking

computeModel()          - Orchestrates all helpers
updateAllDisplays()     - DOM_BINDINGS loop + complex logic

// Year 1 Monte Carlo (Step 6)
runMonteCarloSimulation()      - Main Year 1 simulation loop (async)
generateSampledAssumptions()   - Create varied assumptions per iteration
computeMonteCarloIteration()   - Run model with sampled inputs, handles miss scenarios
analyzeResults()               - Calculate statistics (mean, median, percentiles)
displayMonteCarloResults()     - Render histogram and stats
runTornadoAnalysis()           - Sensitivity analysis using customConstants

// Multi-Year Monte Carlo (Step 6)
runCascadingMonteCarlo()       - Main simulation loop with path-dependent dynamics
initializePathState()          - Initialize Year 1 state from sampled assumptions
sampleAnnualShocks()           - Sample year-specific parameter variations (QMC)
computeCascadingYearOutcome()  - Compute single year with cascading state
updatePathState()              - Update state between years (ratcheting, reserves)
analyzeMultiYearPaths()        - Compute statistics from simulation paths
displayMultiYearMCResults()    - Render all multi-year visualizations
sobolSequence()                - Quasi-Monte Carlo low-discrepancy sampling

// Monte Carlo UI helpers
setMonteCarloPreset()          - Switch preset, resets customConstants
setMcFunder()                  - Change funding option in Monte Carlo step
resetMcCustomValues()          - Reset custom values to current preset
updateMcVariableConstant()     - Update a held variable's value
toggleMcVariable()             - Toggle variable between held/varied
```

### Reactive Model
- Single `assumptions` object holds all input parameters (~50 sliders including RAF and quality)
- `computeModel()` returns unified model object
- Changes to any slider trigger full recalculation + UI update
- `DOM_BINDINGS` table maps ~210 elements to model values

### 7-Step Wizard Flow
1. **Setup** (Step 0) — Assumptions panel with presets
2. **Opportunity** (Step 1) — The "Pot of Gold" ACO share potential
3. **Costs** (Step 2) — Infrastructure costs and per PCP burden (18-month figures)
4. **Funding** (Step 3) — Bank/Hospital/Payer/PE selection + parameters
5. **Outcomes** (Step 4) — Year 1 outcomes (TCOC Miss / Quality Miss / Hit Target tabs)
6. **Projection** (Step 5) — Multi-year 1-20 year projections (Financial / Quality views)
7. **Monte Carlo** (Step 6) — Combined Year 1 and Multi-Year Monte Carlo simulations

### State Variables
```javascript
let currentStep = 0;
let selectedFunding = null;                  // 'bank', 'hospital', 'payer', or 'pe'
let activePreset = null;
let currentMonteCarloView = 'sharedSavings'; // 'sharedSavings' or 'perPcp' (Year 1)
let currentMultiYearView = 'financial';      // 'financial' or 'quality'
let currentMultiYearMonteCarloView = 'sharedSavings'; // 'sharedSavings' or 'perPcp' (Multi-Year MC)
let monteCarloState = {...};                 // Unified state for Year 1 and Multi-Year MC
let multiYearMonteCarloState = monteCarloState; // Alias for backward compatibility
```

## ACO Timeline (Critical)

```
Month 0-12:   Performance Year 1 (ACO operates, NO loan payments, no revenue)
Month 12-18:  Claims runout
Month 18:     Year 1 reconciliation payout arrives
Month 19+:    Loan payments begin (12 months budgeted from Year 1 check)
```

Bank loan uses 18-month deferred payment model. Interest capitalizes during deferral.

## Core Financial Mechanics

### Terminology
- **ACO Share** = what ACO receives from payer (50% of savings)
- **Net to PCPs** = final amount distributed after all deductions
- **Gain Share** = partner's cut (Hospital/PE)
- **Loan Budget** = money set aside for future loan payments (Bank only)

### ACO Retention Model
```
ACO Share
- ACO Ops Retention (fund Year 2 operations)
- ACO Reserve (10% safety buffer)
- [Bank only] Loan Budget (12 months of payments)
- [Payer only] Advance Deduction (PMPM repayment)
= Net Distributable
- [Hospital/PE only] Partner Gain Share
= Net to PCPs
```

### Bank Loan (18-Month Deferral)
```javascript
capitalizedPrincipal = principal * (1 + monthlyRate)^18
deferredMonthlyPayment = amortize(capitalizedPrincipal, rate, term)
loanBudget12mo = deferredMonthlyPayment * 12
bankNetY1 = acoShare - (acoOpsRetention + acoReserve + loanBudget12mo)
```

### Hospital Partnership
```javascript
// Premium reduces realized savings BEFORE MSR check
hospitalPremiumCost = totalTcoc * referralPct * lockInPct * premiumPct
hospitalRealizedSavings = targetSavings - hospitalPremiumCost

if (hospitalRealizedSavings < msrThreshold) {
    hospitalAcoShare = 0;  // No payout - missed threshold
}
```

**Auto-redirect:** When `hospitalMeetsThreshold === false`, UI redirects to "TCOC Miss" tab.

### PE Partnership
```javascript
peShare = netDistributableShare * (peEquityShare / 100)
peNetToPcps = netDistributableShare - peShare
```
PE owns equity/board control in ACO entity (not practices).

### Payer Advance (Prospective PMPM)
```javascript
// Monthly PMPM provides upfront cash flow during 18-month operations
payerMonthlyPmpm = payerPmpm * totalPatients
payerTotalAdvance18mo = payerMonthlyPmpm * 18
payerAnnualAdvance = payerMonthlyPmpm * 12

// If target hit: advance deducted from ACO share
payerAdvanceDeduction = min(payerAnnualAdvance, acoShare)
payerNetDistributable = acoShare - opsRetention - reserve - payerAdvanceDeduction

// If target missed: clawback owed
payerClawbackAmount = payerTotalAdvance18mo * (payerClawbackPct / 100)
payerClawbackPerPcp = payerClawbackAmount / pcpCount
```

**Parameters:**
- `payerPmpm`: $1-$20 per member per month (presets: $5/$10/$15)
- `payerClawbackPct`: 0-100% clawback if target missed (presets: 100%/75%/50%)
- `payerPmpmRatchet`: 0-100% annual PMPM reduction (presets: 100%/75%/50%)

**Underwater Warning:** When `acoShare < payerAnnualAdvance`, even hitting targets results in owing money at reconciliation.

### Risk Adjustment (HCC/RAF)
```javascript
// Adjusted Benchmark = Base TCOC × (ACO RAF / Regional RAF)
adjustedBenchmark = totalTcoc * rafRatio

// RAF ratio > 1.0 = higher benchmark, easier to show savings
// RAF ratio < 1.0 = lower benchmark, harder to show savings

// ACO RAF growth with saturation curve (peaks then decays to floor)
if (year <= rafOptimizationPeakYear) {
    acoGrowthRate = acoRafGrowthPct;
} else {
    // Exponential decay toward floor after peak
    acoGrowthRate = rafOptimizationFloor +
        (acoRafGrowthPct - rafOptimizationFloor) * pow(0.5, yearsAfterPeak);
}
acoGrowthRate = min(acoGrowthRate, codingIntensityCap);  // CMS-style cap
```

**Parameters:**
- `acoBaseRaf`: ACO's starting RAF (0.8-1.5, default 1.0)
- `regionalBaseRaf`: Market's starting RAF (0.8-1.5, default 1.0)
- `acoRafGrowthPct`: ACO's annual RAF improvement (0-15%, default 5%)
- `regionalRafGrowthPct`: Market's annual RAF growth (0-10%, default 3%)
- `rafOptimizationPeakYear`: Year by which most coding optimization is realized (1-5, default 3) — UI: "RAF Optimized by Year"
- `rafOptimizationFloor`: RAF growth rate after optimization peaks (0-5%, default 1%) — UI: "RAF Growth After Optimization"
- `codingIntensityCap`: CMS-style limit on annual RAF growth (0-10%, default 3%)
- `regionalRafSaturationEnabled`: If true, regional RAF also saturates (default false)

**UI Elements:**
- Step 0: Collapsible "Risk Adjustment (HCC/RAF)" slider group
- Step 1: Conditional RAF Adjustment lines (shown when ratio ≠ 1.0)
- Step 5: RAF sliders (synced with Step 0) + RAF Ratio column in Financial View table + "RAF Fell Behind Market" warning

**Preset Values:**
| Parameter | Worst | Realistic | Best |
|-----------|-------|-----------|------|
| acoBaseRaf | 0.95 | 1.0 | 1.1 |
| regionalBaseRaf | 1.05 | 1.0 | 0.95 |
| acoRafGrowthPct | 3% | 5% | 8% |
| regionalRafGrowthPct | 5% | 3% | 2% |
| rafOptimizationPeakYear | 2 | 3 | 4 |
| rafOptimizationFloor | 0.5% | 1% | 2% |
| regionalRafSaturationEnabled | true | false | false |

### Quality Improvement Parameters
```javascript
acoStartingQualityPct: 80,      // ACO's baseline quality score in Year 1
acoQualityImprovementPct: 3,    // Annual quality improvement rate
acoMaxQualityPct: 90,           // Maximum achievable quality (ceiling)
qualityGateCeiling: 95          // Maximum quality gate % (prevents infinite ratcheting)
```

**Preset Values:**
| Parameter | Worst | Realistic | Best |
|-----------|-------|-----------|------|
| acoStartingQualityPct | 80% | 82% | 85% |
| acoQualityImprovementPct | 2% | 3% | 5% |
| acoMaxQualityPct | 85% | 90% | 95% |
| qualityGateCeiling | 98% | 95% | 92% |

## Writing Style

**Never use "Your", "You", "We", "Our", or "Us"** in labels, calculations, or discussion questions. Use entity-specific language:
- ❌ "Your ACO Share" → ✅ "ACO Share"
- ❌ "If we miss again..." → ✅ "Where does the ACO get money..."

Exception: Button text ("Choose Your Funder") may use "your".

## Quality Gate

Minimum quality score threshold for payout. If quality fails, payer keeps ALL savings (100%), not just their 50%.

**Current behavior:** Quality Gate slider is display-only. Users select scenarios manually via tabs. Quality Miss shows `qualityGatePct - 10` (fixed 10% failure margin).

## Payer Context (Important)

This simulation models **Medicare Advantage and Commercial ACO** dynamics, not Medicare MSSP:

- **Medicare MSSP:** CMS has vested interest in ACO success; regularly adjusts program parameters to prevent widespread failure
- **MA/Commercial:** Private payers face quarterly earnings pressure; have interest in ratcheting benchmarks and quality thresholds during contract renewals

Context notes appear in:
- Step 0: Brief note before "Configure the ACO"
- Step 5: Detailed explanation before Discussion Questions

## Multi-Year Projection (Step 5)

### Key Mechanics
- **Benchmark Ratcheting:** Each successful year, payers reduce next year's benchmark
- **Status:** Hit (full target) | Partial (above MSR but below target) | Miss ($0 payout) | Failed (can't cover obligations)
- **Default projection:** 10 years (not overridden by presets)

### Contract Parameters
Step 5 has independent sliders for Target Savings %, MSR, and (when payer funding selected) PMPM/Clawback/Ratchet parameters. These sync bidirectionally with earlier steps via `updateAllDisplays()`.

## Monte Carlo Analysis (Step 6)

Dedicated step for Monte Carlo simulations, combining Year 1 and Multi-Year analysis with shared variable controls.

### Unified State Object
```javascript
let monteCarloState = {
    isRunning: false,
    results: null,
    basePreset: 'realistic',    // worst/realistic/best
    variationPct: 50,           // ±50% variation range (default)
    useTriangular: false,       // false=uniform, true=triangular sampling
    iterations: 1000,           // Number of simulation runs
    // Cached results for tab switching
    year1Results: null,         // Cached Year 1 simulation results
    multiYearPaths: null,       // Cached Multi-Year simulation paths
    multiYearResults: null,     // Cached Multi-Year analyzed results
    year1Dirty: true,           // True if sliders changed since last Year 1 run
    multiYearDirty: true,       // True if sliders changed since last Multi-Year run
    // Variable controls
    holdConstant: {...},        // Variables NOT varied (contract terms by default)
    varyEnabled: {...},         // Variables to vary (market conditions by default)
    customConstants: {...},     // User-modified held variable values
    // Multi-Year specific config
    multiYearConfig: {
        yearsToProject: 10,
        benchmarkRatchetPct: 1.0,
        qualityGateRatchetPct: 2.0,
        inflationPct: 3.0
    },
    paths: null,                // Multi-year path storage
    useQMC: true                // Quasi-Monte Carlo for multi-year
};

// For backward compatibility
let multiYearMonteCarloState = monteCarloState;
```

### Variable Categories
- **Held constant by default:** Contract terms (`savingsTargetPct`, `payerSharePct`, `msrPct`, `qualityGatePct`), network size (`pcpCount`, `patientsPerPcp`), quality baseline (`acoStartingQualityPct`, `acoMaxQualityPct`), and RAF baseline (`acoBaseRaf`, `regionalBaseRaf`, `codingIntensityCap`)
- **Varied by default:** Market conditions (`tcocPerPatient`), infrastructure costs, practice burden, funder-specific parameters, quality improvement (`acoQualityImprovementPct`, `qualityGateRatchetPct`), and RAF growth rates (`acoRafGrowthPct`, `regionalRafGrowthPct`, `rafOptimizationPeakYear`, `rafOptimizationFloor`)

### Checkbox UI Semantics
- **Checked = Hold constant:** Slider appears showing the held value; badge displays the numeric value
- **Unchecked = Vary:** Slider hidden; badge shows "Vary"

### Sampling Methods
Two distribution options controlled by `useTriangular`:
- **Uniform (default):** `sampleUniform(min, max)` — Values spread evenly across entire range
- **Triangular:** `sampleTriangular(min, mode, max)` — Values cluster around base scenario

Range bounds: `±variationPct`, clamped to `SLIDER_RANGES` bounds

### Year 1 Simulation
Runs 1,000 iterations of Year 1, each time sampling different values for varied parameters.

**View Options:**
- **Shared Savings:** Total ACO share distribution
- **Per-PCP Net:** Individual physician outcome after practice burden

**Miss Scenario Handling:**
`computeMonteCarloIteration()` branches on `hitTarget` (savings >= MSR threshold):
- **Hit:** Returns actual `sharedSavings` and computed `perPcpNet`
- **Miss (Bank/PE):** Returns `sharedSavings: 0`, `perPcpNet: -practiceBurden18mo`
- **Miss (Payer):** Returns `sharedSavings: 0`, `perPcpNet: -(practiceBurden18mo + clawback)`
- **Hospital:** Uses `hospitalMeetsThreshold` (accounts for premium reducing realized savings)

**Output:**
- Histogram with 25 bins
- Statistics: Mean, Median, Std Dev, P5/P95 percentiles
- ACO Hit Rate, PCP Profit Rate
- Sensitivity analysis (tornado chart)

### Multi-Year Simulation
Runs cascading simulations where each year's outcome depends on previous year's stochastic state.

**Cascading Dynamics:**
- **Benchmark** — ratchets down after successful years
- **Reserve** — accumulates from good years, depletes in bad years
- **RAF** — grows with stochastic rate each year (ACO and regional)
- **Quality Gate** — ratchets up deterministically
- **Achieved Quality** — improves with stochastic rate, capped at max
- **Loan Remaining** — decrements deterministically (bank funding)
- **PMPM** — ratchets down after hits (payer funding)

**Annual Shock Config:**
```javascript
const ANNUAL_SHOCK_CONFIG = {
    annualVariables: [     // Parameters varied EACH YEAR
        'tcocPerPatient',
        'acoRafGrowthPct',
        'regionalRafGrowthPct',
        'acoQualityImprovementPct',
        'dataAnalyticsCost',
        'adminCost',
        'careManagerSalary'
    ],
    annualVariationPct: 15  // Tighter than initial variation
};
```

**Visualizations:**
1. **Fan Chart** — Cumulative net to PCPs over years with P5-P95 and P25-P75 bands
2. **Survival Curve** — Percentage of ACOs still operating by year
3. **Final Histogram** — Distribution of total net outcome after practice burden
4. **Status Heatmap** — Probability of each outcome status (Hit/Partial/Miss/Failed) by year

**Output Statistics:**
- Median Net (after burden), ACO Survival Rate, PCP Profit Rate, P5/P95

### Quasi-Monte Carlo (Sobol Sequences)
Multi-Year simulation uses low-discrepancy Sobol sequences for better parameter space coverage:
- O(1/N) convergence vs O(1/√N) for standard MC
- 500 QMC iterations ≈ 2000 random MC iterations in accuracy
- Deterministic and reproducible results
- 150 dimensions supported via `SOBOL_PRIMITIVES` (Joe-Kuo direction numbers)

### UI Elements
- Base scenario preset buttons (Worst/Realistic/Best)
- Funding path selection buttons (synced with Step 3)
- Variable group toggles with hold/vary checkboxes
- Iterations slider (100-10000, default 1000)
- Sampling method toggle (Uniform/Triangular)
- Run Simulation buttons with progress bars
- Tab switching between Year 1 and Multi-Year views

## Mobile Responsive

- **≤768px:** Calculation box labels and values stack vertically; header/footer stack vertically
- **>768px:** Side-by-side layout throughout

## Color Contrast

| Context | Use | Avoid |
|---------|-----|-------|
| Dark `.calculation` bg | `#fca5a5`, `#f87171` (light reds) | `#ef4444` (too dark) |
| White/light boxes | `#dc2626`, `#991b1b` (dark reds) | Light colors |

Amber (`#f59e0b`) for deductions like "ACO Ops Retention".

## Tooltips

Two patterns: **Slider tooltips** use `?` icon; **Calculation box tooltips** use smaller `i` icon. Both use `.tooltip-container`, `.tooltip-icon`, `.tooltip-text` classes.

**Adding New Calculation Tooltips:**
1. Add explanation to `METRIC_TOOLTIPS` object (optional, for reference)
2. Add tooltip HTML inline within the `<span>` label in calculation box
3. Tooltip appears on hover (desktop) or tap (mobile)

**Right-Edge Tooltip Fix:** Tooltips near the right edge of the viewport get cut off. Add `style="left:auto;right:0;"` to the `.tooltip-text` span to anchor it to the right instead of left.

## Development Workflow

### Testing
```bash
open regional_aco_simulation.html
# In console:
runTests()        # 63 assertions across 3 presets (includes RAF fields)
captureBaseline() # After intentional calculation changes
```

### Adding New Assumptions
1. Add to `assumptions` object
2. Add to all three preset objects
3. Add slider HTML + `oninput="updateAssumption('param', this.value)"`
4. Add entry to `DOM_BINDINGS`

### Adding New Calculations
1. Add to appropriate helper function
2. Include in helper's return object
3. Destructure in `computeModel()` and include in return
4. Add `<span id="newDisplay">` in HTML
5. Add to `DOM_BINDINGS`

## Common Gotchas

1. **DOM_BINDINGS silently skips missing elements** — verify span exists in HTML

2. **Preset sync** — new assumptions must update all three preset objects

3. **Hospital uses different calculations** — check `hospitalMeetsThreshold` for conditional display; Hospital's "Payer Windfall" uses `hospitalRealizedSavings` (after premium)

4. **Bank-specific retention** — includes loan reserve; use `bankNetDistributableShare` not `netDistributableShare`

5. **innerHTML replacement** — never place span IDs inside elements that get `innerHTML` updates

6. **Compute helper dependencies** — call only through `computeModel()`, not directly

7. **`payerSharePct` naming** — despite name, represents ACO's share (60 = ACO gets 60%, payer keeps 40%)

8. **Miss scenario** — fixed at 1% savings (`CONSTANTS.MISS_SCENARIO_SAVINGS_PCT`)

9. **Payer clawback splits evenly** — clawback amount divided equally among all PCPs regardless of panel size

10. **RAF adjustment cascades** — RAF ratio affects `adjustedBenchmark`, which changes `targetSavings`, `acoShare`, and `msrThreshold`. When RAF is enabled and ratio ≠ 1.0, many downstream values differ from simple TCOC-based calculations.

11. **RAF saturation curve** — ACO RAF growth decays exponentially after the optimization year (`rafOptimizationPeakYear`). Regional RAF grows at constant rate unless `regionalRafSaturationEnabled` is true.

12. **Multi-Year MC uses global selectedFunding** — `updatePathState()` and `computeCascadingYearOutcome()` reference the global `selectedFunding` variable; ensure it's set before running simulation.

13. **Sobol sequence dimension limit** — QMC falls back to pseudo-random sampling for dimensions > 150; affects simulations with many varied parameters across many years.

14. **Monte Carlo state caching** — Results are cached in `year1Results` and `multiYearResults`. The `year1Dirty` and `multiYearDirty` flags track when sliders change. Cached results display immediately on tab switch if not dirty.

15. **Quality parameters** — `acoStartingQualityPct`, `acoQualityImprovementPct`, `acoMaxQualityPct`, and `qualityGateCeiling` control quality dynamics. Quality gate ratchets up each year; ACO quality improves but caps at `acoMaxQualityPct`.

## Formatting Functions

```javascript
formatNumber(num)       // "1,000"
formatCurrency(num)     // "$1.2M" or "$150K"
formatCurrencyFull(num) // "$1,234,567"
```

## Reference

Model assumptions and narrative decisions are documented in-line within the simulation source code.
