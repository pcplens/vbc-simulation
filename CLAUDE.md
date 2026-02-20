# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational simulation for ACO financial trade-offs. No build tools or dependencies. Serve via any static HTTP server (e.g., `python3 -m http.server`).

| File | Contents |
|------|----------|
| `index.html` | HTML markup (~4,140 lines) |
| `styles.css` | All CSS (~2,320 lines) |
| `js/` | ES modules (14 files, see Module Structure below) |
| `app.js` | Legacy monolith (loaded as `file://` fallback when ES modules fail) |
| `logo.png` | PCP Lens header logo |

**Note:** Some browsers block external script/CSS loading from `file://`. Use a local server for testing: `python3 -m http.server` then open `http://localhost:8000`.

**Author:** Sudeep Bansal, MD, MS | **Website:** www.PCPLens.com

## Architecture

### Module Structure

JavaScript is split into ES modules under `js/`. Entry point: `<script type="module" src="js/main.js">`.

| Module | Contents |
|--------|----------|
| `js/config.js` | `assumptions`, 3 presets, `CONSTANTS`, `SLIDER_RANGES`, `FUNDER_VARIABLES`, `FUNDING_CONFIG`, `MONTE_CARLO_CONFIG`, `PRESETS`, mutable `state` object, `DEFAULT_HOLD_CONSTANT`, `DEFAULT_VARY_ENABLED`, `monteCarloState` |
| `js/sobol.js` | Sobol direction numbers + `sobolSequence()` generator |
| `js/computeHelpers.js` | `computeQualityGate`, `computeRafGrowthRates`, `computeRafAdjustment`, `inflationMultiplier` |
| `js/model.js` | `computeCore`, `computeInfrastructure`, `computePracticeBurden`, `amortize`, `computeBankLoan`, `computeHospital`, `computePE`, `computePayerAdvance`, `computeModel` |
| `js/multiYear.js` | `computeHospitalPremiumForYear`, `computeYearFinancials`, `computeMultiYear` |
| `js/mcSampling.js` | Sampling helpers, `computeMonteCarloIteration`, stats utilities, variable label/explanation maps |
| `js/mcCharts.js` | `drawTornadoChart`, `drawCorrelationTornadoChart` |
| `js/monteCarlo.js` | `runMonteCarloSimulation`, `displayMonteCarloResults`, `drawHistogram`, `runTornadoAnalysis`, MC UI controls, `generateFunderMcControls`, `resetMonteCarloDefaults`, `updateMonteCarloFunderVars` |
| `js/multiYearMc.js` | `initializePathState`, `computeCascadingYearOutcome`, `updatePathState`, `runCascadingMonteCarlo`, multi-year MC display/charts/histograms, tornado + correlation analysis |
| `js/formatters.js` | `formatNumber`, `formatCurrency`, `formatCurrencyFull`, `formatSignedCurrency`, `applyMcStatColor`, `setVisible` |
| `js/domBindings.js` | `DOM_BINDINGS` array (~470 entries) |
| `js/ui.js` | `updateAllDisplays`, `updateSliderValues`, `updateAssumption`, `applyPreset`, `showStep`, `selectFunding`, `showScenario`, navigation, `window.*` exposure for HTML event handlers |
| `js/tests.js` | `captureBaseline`, `EXPECTED_VALUES`, `runTests` |
| `js/main.js` | Bootstrap: imports all modules, calls `applyPreset('realistic')`, `updateProgress()` |

### Dependency Graph (acyclic)

```
config ← (everything)
sobol ← mcSampling
computeHelpers ← model, multiYear, multiYearMc, mcSampling
model ← mcSampling, multiYearMc, ui, tests
multiYear ← model, multiYearMc, tests
mcSampling ← monteCarlo, multiYearMc
mcCharts ← monteCarlo, multiYearMc
monteCarlo ← ui (imports from multiYearMc, NOT vice versa)
multiYearMc ← monteCarlo, ui
formatters ← mcCharts, monteCarlo, multiYearMc, domBindings, ui
domBindings ← ui
ui ← tests, main
tests ← main
```

### Mutable State

All mutable UI state lives in `state` object exported from `config.js`:
```js
export const state = {
    currentStep, selectedFunding, activePreset, step5Initialized,
    currentMultiYearView, currentMonteCarloView, currentMultiYearMonteCarloView,
    currentMultiYearTornadoMode, currentYear1TornadoMode,
    domBindingsCache, currentMcTab
};
```
Modules import `state` and mutate properties directly (e.g., `state.selectedFunding = 'bank'`). The `assumptions` and `monteCarloState` objects are separate exports shared by reference.

### Key Helper Functions

- **`computeQualityGate(params, year)`** — Unified quality gate pass/fail for any year. Used by `computeMultiYear`, `computeCascadingYearOutcome`, `computeMonteCarloIteration`, and crossover scan. For Year 1, `(year-1)` terms zero out.
- **`payerTrueNet`** — Consolidated payer net after underwater correction, computed in `computePayerAdvance`. Surfaced as `payerNetY1` and `payerNetPerPcp` in `computeModel` return. Eliminates scattered `payerNetDistributable - payerUnderwaterAmount` patterns.

### Compute Pipeline
`computeModel(options)` orchestrates `computeCore()` → `computeInfrastructure()` → `computePracticeBurden()` → funder helpers (`computeBankLoan`, `computeHospital`, `computePayerAdvance`, `computePE`) → `computeRafAdjustment()` → `computeMultiYear()`

### Reactive Model
- Single `assumptions` object holds all input parameters (~50 sliders including RAF and quality)
- `computeModel(options)` returns unified model object; multi-year projection is lazy (only computed when `state.currentStep >= 5` and `options.skipMultiYear` is not set)
- Changes to any slider trigger full recalculation + UI update

### 7-Step Wizard Flow
1. **Setup** (Step 0) — Assumptions panel with presets
2. **Opportunity** (Step 1) — The "Pot of Gold" ACO share potential
3. **Costs** (Step 2) — Infrastructure costs and per PCP burden (18-month figures)
4. **Funding** (Step 3) — Funder comparison table + Bank/Hospital/Payer/PE selection + parameters
5. **Outcomes** (Step 4) — Year 1 outcomes (TCOC Miss / Quality Miss / Hit Target tabs) + Print button
6. **Projection** (Step 5) — Multi-year 1-20 year projections (Financial / Quality views) + Print button
7. **Monte Carlo** (Step 6) — Combined Year 1 and Multi-Year Monte Carlo simulations + Print button

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
Principal capitalizes during 18-month deferral. `loanBudget12mo` (12 months of deferred payments) is deducted from ACO share. Bank uses `bankNetDistributableShare`, not `netDistributableShare`.

### Hospital Partnership
Hospital premium (`totalTcoc * referralPct * lockInPct * premiumPct`) reduces realized savings BEFORE MSR check. If `hospitalRealizedSavings < msrThreshold`, payout is $0. UI auto-redirects to "TCOC Miss" tab when `hospitalMeetsThreshold === false`.

### PE Partnership
PE takes `peEquityShare%` of net distributable. PE owns equity/board control in ACO entity (not practices). `peBoardControl` and `peExitYears` have no financial effect.

### Payer Advance (Prospective PMPM)
Monthly PMPM provides upfront cash during 18-month operations. If target hit: annual advance deducted from ACO share. If target missed: clawback owed (`payerTotalAdvance18mo * payerClawbackPct%`). **Underwater Warning:** When `acoShare < payerAnnualAdvance`, even hitting targets results in owing money. PMPM ratchets down only after Hit/Partial years; miss years retain current PMPM.

### Risk Adjustment (HCC/RAF)
`adjustedBenchmark = totalTcoc * (acoRaf / regionalRaf)`. Ratio > 1.0 = easier savings; < 1.0 = harder. ACO RAF growth uses saturation curve: full growth rate until `rafOptimizationPeakYear`, then exponential decay toward `rafOptimizationFloor`, capped by `codingIntensityCap`. Regional RAF can also saturate (`regionalRafSaturationEnabled`). RAF ratio cascades through `targetSavings`, `acoShare`, and `msrThreshold`.

### Quality Gate
Minimum quality score threshold for payout. If quality fails, payer keeps ALL savings (100%), not just their 50%. Step 4: Quality Gate slider is display-only; Quality Miss tab shows `qualityGatePct - 10` (fixed 10% failure margin). In MC, quality gate is enforced — quality fail means $0 payout regardless of TCOC performance.

## Writing Style

**Never use "Your", "You", "We", "Our", or "Us"** in labels, calculations, or discussion questions. Use entity-specific language:
- "Your ACO Share" → "ACO Share"
- "If we miss again..." → "Where does the ACO get money..."

Exception: Button text ("Choose Your Funder") may use "your".

## Payer Context (Important)

This simulation models **Medicare Advantage and Commercial ACO** dynamics, not Medicare MSSP. MA/Commercial payers face quarterly earnings pressure and have interest in ratcheting benchmarks and quality thresholds during contract renewals. Context notes appear in Steps 0 and 5.

## Multi-Year Projection (Step 5)

- **Benchmark Ratcheting:** Each successful year, payers reduce next year's benchmark
- **Status:** Hit (full target) | Partial (above MSR but below target) | Miss ($0 payout) | Failed (can't cover obligations)
- **Default projection:** 10 years (all presets use `multiYearCount: 10`)
- Step 1 changes to Target Savings % and MSR % push one-way to Step 5 (live sync), but Step 5 slider changes remain independent

## Monte Carlo Analysis (Step 6)

Year 1 MC: 1000 iterations sampling varied parameters, producing histograms + tornado charts. Multi-Year MC: samples initial parameters once per iteration, then runs deterministic cascading path (benchmark ratchet, reserve dynamics, RAF growth, quality gate ratchet). Both Year 1 and Multi-Year use Sobol QMC for better convergence. Both simulations use funder-filtered variable keys (`getMonteCarloVariableKeys`). Tornado charts offer deterministic (one-at-a-time sweep) and Spearman correlation tabs, both computed upfront for instant switching.

## Visual & Layout Rules

### Color Contrast

| Context | Use | Avoid |
|---------|-----|-------|
| Dark `.calculation` bg | `#fca5a5`, `#f87171` (light reds) | `#ef4444` (too dark) |
| White/light boxes | `#dc2626`, `#991b1b` (dark reds) | Light colors |

Amber (`#f59e0b`) for deductions like "ACO Ops Retention".

### Mobile Responsive
- **<=768px:** Labels/values stack vertically; projection table hides columns 6-8 (`.multi-year-table:not(.show-all-cols)`)
- **<=600px:** Progress step text hidden, numbered circles shown; `.mobile-step-label` shows current step name
- **>768px:** Side-by-side layout; mobile elements hidden

### Minus Typography
All monetary negative signs use Unicode minus `−` (U+2212), not hyphen-minus `-` (U+002D). Label prefixes like "- ACO Ops Retention" use hyphen-minus (list-style, not mathematical). ~73 occurrences in codebase.

## Development Workflow

### Testing
```bash
python3 -m http.server  # Required — file:// may block external scripts
# Open http://localhost:8000 in browser, then in console:
runTests()        # 318 assertions (3 presets + unit tests + multi-year + MC iteration + edge cases)
captureBaseline() # After intentional calculation changes
```

### Playwright Browser Testing
Playwright v1.58.2 is available via `npx playwright` and as MCP tools (`mcp__playwright__browser_*`). System Chrome at `/Applications/Google Chrome.app` — use `channel: 'chrome'` for direct scripts.

Key MCP tools: `browser_navigate`, `browser_click`, `browser_snapshot`, `browser_take_screenshot`, `browser_run_code`, `browser_console_messages`.

### Adding New Assumptions
1. Add to `assumptions` object in `js/config.js`
2. Add to all three preset objects in `js/config.js`
3. Add slider HTML in `index.html` + `oninput="updateAssumption('param', this.value)"`
4. Add entry to `DOM_BINDINGS` in `js/domBindings.js`
5. Add slider ID to `updateSliderValues()` in `js/ui.js` — use `sliders` array if element ID matches assumption key, or `mappedSliders` array if they differ

### Adding New Calculations
1. Add to appropriate helper function in `js/model.js` (or `js/computeHelpers.js` for shared helpers)
2. Include in helper's return object
3. Destructure in `computeModel()` in `js/model.js` and include in return
4. Add `<span id="newDisplay">` in `index.html`
5. Add to `DOM_BINDINGS` in `js/domBindings.js` (import any new formatters if needed)

## Common Gotchas

1. **DOM_BINDINGS silently skips missing elements** — verify span exists in HTML

2. **Preset sync** — new assumptions must update all three preset objects

3. **Hospital uses different calculations** — check `hospitalMeetsThreshold` for conditional display; Hospital's "Payer Windfall" uses `hospitalRealizedSavings` (after premium)

4. **Bank-specific retention** — includes loan reserve; use `bankNetDistributableShare` not `netDistributableShare`

5. **innerHTML replacement** — never place span IDs inside elements that get `innerHTML` updates

6. **Compute helper dependencies** — call only through `computeModel()`, not directly

7. **`payerSharePct` naming** — despite name, represents ACO's share (60 = ACO gets 60%, payer keeps 40%)

8. **Miss scenario** — fixed at 1% savings (`CONSTANTS.MISS_SCENARIO_SAVINGS_PCT`). `computeMultiYear` only supports the `'hit'` scenario path; the miss branch was removed.

9. **Payer clawback splits evenly** — clawback amount divided equally among all PCPs regardless of panel size

10. **RAF adjustment cascades** — RAF ratio affects `adjustedBenchmark`, which changes `targetSavings`, `acoShare`, and `msrThreshold`. When RAF is enabled and ratio != 1.0, many downstream values differ from simple TCOC-based calculations.

11. **RAF saturation curve** — ACO RAF growth decays exponentially after the optimization year (`rafOptimizationPeakYear`). Regional RAF grows at constant rate unless `regionalRafSaturationEnabled` is true.

> Extended gotchas (#12-48): See `.claude/GOTCHAS.md` for Monte Carlo, multi-year, failure logic, and edge-case warnings.
