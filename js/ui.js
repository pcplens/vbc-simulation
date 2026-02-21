import { assumptions, CONSTANTS, state, monteCarloState, PRESETS, FUNDING_CONFIG } from './config.js';
import { computeModel } from './model.js';
import { formatCurrency, formatSignedCurrency, setVisible } from './formatters.js';
import { DOM_BINDINGS } from './domBindings.js';
import { updateMonteCarloFunderVars, initMcHeldVariableSliders, displayMonteCarloResults, setMonteCarloView, setMultiYearMonteCarloView, generateFunderMcControls, setMonteCarloPreset, updateMonteCarloSetting, toggleMcVariableGroup, updateMcVariableConstant, resetMcVariableToPreset, randomizeAllMcVariables, resetMonteCarloDefaults, runMonteCarloSimulation, toggleMcVariable } from './monteCarlo.js';
import { displayMultiYearMCResults, setYear1TornadoMode, setMultiYearTornadoMode } from './multiYearMc.js';

export function updateAllDisplays() {
    const m = computeModel();
    const a = assumptions.pcpCount < 1 ? { ...assumptions, pcpCount: 1 } : assumptions;

    // Apply all declarative DOM bindings (lazy-cache element lookups)
    if (!state.domBindingsCache) {
        state.domBindingsCache = new Map();
        DOM_BINDINGS.forEach(([id]) => {
            state.domBindingsCache.set(id, document.getElementById(id));
        });
    }
    DOM_BINDINGS.forEach(([id, accessor, formatter]) => {
        const el = state.domBindingsCache.get(id);
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
    document.getElementById('bankNetGainPerPcp').textContent = finalPayoutAfterBurden >= 0 ? '$' + formatCurrency(finalPayoutAfterBurden) : '\u2212$' + formatCurrency(Math.abs(finalPayoutAfterBurden));

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
    const isHospital = state.selectedFunding === 'hospital';
    setVisible('hit-target-banner', !isHospital);
    setVisible('hit-target-calculation', !isHospital);

    // Year 1 Payout Context - Hospital (with color styling)
    const hospitalPerPcpY1 = m.hospitalNetY1 / a.pcpCount;
    const hospitalNetGain = hospitalPerPcpY1 - practiceBurden18mo;
    document.getElementById('hospitalPracticeBurdenReminder').textContent = formatCurrency(practiceBurden18mo);
    document.getElementById('hospitalNetGainVsStatusQuo').textContent = hospitalNetGain >= 0 ? '$' + formatCurrency(hospitalNetGain) : '\u2212$' + formatCurrency(Math.abs(hospitalNetGain));
    const hospitalNetGainEl = document.getElementById('hospitalNetGainSpan');
    if (hospitalNetGainEl) {
        hospitalNetGainEl.style.color = hospitalNetGain >= 0 ? '#10b981' : '#ef4444';
    }

    // Year 1 Payout Context - PE
    const pePerPcpY1 = m.peNetToPcps / a.pcpCount;
    const peNetGain = pePerPcpY1 - practiceBurden18mo;
    document.getElementById('pePracticeBurdenReminder').textContent = formatCurrency(practiceBurden18mo);
    document.getElementById('peNetGainVsStatusQuo').textContent = peNetGain >= 0 ? '$' + formatCurrency(peNetGain) : '\u2212$' + formatCurrency(Math.abs(peNetGain));

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
    const payerPerPcpY1 = m.payerNetPerPcp;
    const payerNetGain = payerPerPcpY1 - practiceBurden18mo;
    const payerNetGainEl = document.getElementById('payerNetGainVsStatusQuo');
    if (payerNetGainEl) payerNetGainEl.textContent = payerNetGain >= 0 ? '$' + formatCurrency(payerNetGain) : '\u2212$' + formatCurrency(Math.abs(payerNetGain));

    updateRealityBox('payer', payerNetGain,
        `Each PCP <strong>gained ${formatCurrency(payerNetGain)}</strong> after accounting for practice burden. However, the PMPM advance was deducted from the ACO share\u2014upfront cash came at a cost.`,
        `<strong>Despite hitting the target</strong>, each PCP LOST ${formatCurrency(Math.abs(payerNetGain))}. The PMPM advance deduction consumed so much of the ACO share that PCPs couldn't recover their practice burden.`
    );

    // Show/hide Payer underwater warning
    const payerUnderwaterWarning = document.getElementById('payerUnderwaterWarning');
    if (payerUnderwaterWarning) {
        payerUnderwaterWarning.style.display = m.payerIsUnderwater ? 'block' : 'none';
    }

    // Conditional color for payer net displays (red when underwater/negative)
    const payerNetColor = m.payerNetY1 >= 0 ? '#059669' : '#ef4444';
    const payerPerPcpColor = m.payerNetPerPcp >= 0 ? '' : '#ef4444';
    ['qPayerNetToPcpsWrap', 'payerNetHitWrap'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.color = payerNetColor;
    });
    ['payerPerPcpHit', 'qPayerPerPcp', 'payerPerPcpHitContext'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.color = payerPerPcpColor;
    });

    // ===== COMPARISON MATRIX - Highlighting & Color Classes =====
    // Highlight selected funder column
    ['bank', 'hospital', 'payer', 'pe'].forEach(f => {
        const isSelected = state.selectedFunding === f;
        const cap = f.charAt(0).toUpperCase() + f.slice(1);
        ['Header', 'Miss', 'Quality', 'Hit'].forEach(suffix => {
            const el = document.getElementById('cmp' + cap + suffix);
            if (el) el.classList.toggle('selected-funder', isSelected);
        });
    });

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

    // Sync Step 5 and MC inflation checkboxes with assumptions
    ['Expenses', 'Burden', 'Benchmark', 'Ratchet'].forEach(name => {
        ['applyInflationTo', 'mcApplyInflationTo'].forEach(prefix => {
            const el = document.getElementById(prefix + name);
            if (el) el.checked = a['applyInflationTo' + name];
        });
    });

    // Update slider values
    updateSliderValues();

    return m;
}

export function updateSliderValues() {
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
        ['step6HospitalGainShare', 'hospitalGainShare'],
        ['step6HospitalReferralPct', 'hospitalReferralPct'],
        ['step6HospitalReferralLock', 'hospitalReferralLock'],
        ['step6HospitalCostPremium', 'hospitalCostPremium'],
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
        ['step5AcoStartingQualityPct', 'acoStartingQualityPct'],
        ['step5QualityGatePct', 'qualityGatePct']
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

export function updateAssumption(key, value) {
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

    state.activePreset = null;
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    const m = updateAllDisplays();

    // Update Monte Carlo funder-specific variables
    updateMonteCarloFunderVars();

    // If on multi-year step, update the displays (reuse computed model)
    if (state.currentStep === 5) {
        updateMultiYearDisplays(m);
    }

    // Mark MC results as stale when any assumption changes
    monteCarloState.year1Dirty = true;
    monteCarloState.multiYearDirty = true;
}

export function applyPreset(preset) {
    const presetObj = PRESETS[preset];
    if (!presetObj) return;

    Object.assign(assumptions, presetObj);
    state.activePreset = preset;
    state.step5Initialized = false;

    // Update preset button styles
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.preset-btn.${preset}`);
    if (activeBtn) activeBtn.classList.add('active');

    updateAllDisplays();

    // Update Monte Carlo funder-specific variables
    updateMonteCarloFunderVars();

    // Mark MC results as stale when preset changes
    monteCarloState.year1Dirty = true;
    monteCarloState.multiYearDirty = true;
}

const STEP_NAMES = ['1. Setup', '2. Opportunity', '3. Costs', '4. Funding', '5. Outcomes', '6. Projection', '7. Monte Carlo'];

export function updateProgress() {
    const totalSteps = 7;
    const progress = (state.currentStep / (totalSteps - 1)) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    for (let i = 0; i < totalSteps; i++) {
        const stepEl = document.getElementById('progress-' + i);
        stepEl.classList.remove('active', 'completed');
        if (i < state.currentStep) {
            stepEl.classList.add('completed');
        } else if (i === state.currentStep) {
            stepEl.classList.add('active');
        }
    }

    // Update mobile step label
    const stepLabel = document.getElementById('currentStepLabel');
    if (stepLabel) stepLabel.textContent = STEP_NAMES[state.currentStep];

}

export function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById('step' + stepNumber).classList.add('active');
    state.currentStep = stepNumber;
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update outcome displays when reaching step 4
    if (stepNumber === 4) {
        updateOutcomeDisplays();
    }

    // Update multi-year displays when reaching step 5
    if (stepNumber === 5) {
        // Default to bank if no funder selected (for direct jump)
        if (!state.selectedFunding) {
            state.selectedFunding = 'bank';
        }

        // Initialize multi-year contract parameters from Step 1 values (first visit only)
        if (!state.step5Initialized) {
            assumptions.multiYearSavingsTargetPct = assumptions.savingsTargetPct;
            assumptions.multiYearMsrPct = assumptions.msrPct;
            state.step5Initialized = true;
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
            funderSpecificGroup.style.display = (state.selectedFunding === 'hospital' || state.selectedFunding === 'payer') ? 'block' : 'none';
        }

        // Show Hospital Parameters only for Hospital funding
        const step6HospitalParams = document.getElementById('step6HospitalParams');
        if (step6HospitalParams) {
            step6HospitalParams.style.display = state.selectedFunding === 'hospital' ? 'block' : 'none';
        }

        // Show Payer Parameters only for Payer funding
        const step6PayerParams = document.getElementById('step6PayerParams');
        if (step6PayerParams) {
            step6PayerParams.style.display = state.selectedFunding === 'payer' ? 'block' : 'none';
        }

        updateMultiYearDisplays();
    }

    // Update Monte Carlo displays when reaching step 6
    if (stepNumber === 6) {
        // Default to bank if no funder selected (for direct jump)
        if (!state.selectedFunding) {
            state.selectedFunding = 'bank';
        }

        // Update funder button states
        updateMcFunderButtons(state.selectedFunding);

        // Initialize held variable sliders
        initMcHeldVariableSliders();

        // Update funder-specific variables display
        updateMonteCarloFunderVars();
    }
}

export function toggleSliderGroup(groupId) {
    const group = document.getElementById(groupId);
    if (group) {
        group.classList.toggle('collapsed');
    }
}

export function toggleTableColumns(btn) {
    const table = btn.parentElement.querySelector('.multi-year-table');
    if (!table) return;
    table.classList.toggle('show-all-cols');
    btn.textContent = table.classList.contains('show-all-cols') ? 'Hide Extra Columns' : 'Show All Columns';
}

export function showMultiYearView(view) {
    state.currentMultiYearView = view;

    // Update tab active states
    document.getElementById('viewTabFinancial').classList.toggle('active', view === 'financial');
    document.getElementById('viewTabQuality').classList.toggle('active', view === 'quality');

    // Show/hide appropriate containers
    document.getElementById('financialViewTable').style.display = view === 'financial' ? 'block' : 'none';
    document.getElementById('qualityViewTable').style.display = view === 'quality' ? 'block' : 'none';
}

// Monte Carlo tab toggle (Year 1 vs Multi-Year)
export function showMonteCarloTab(tab) {
    state.currentMcTab = tab;

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
                funding: state.selectedFunding || 'bank'
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
        if (monteCarloState.iterations > 2000) {
            iterSlider.value = '500';
            iterDisplay.textContent = '500';
            monteCarloState.iterations = 500;
        }
    } else {
        iterSlider.max = '10000';
        // Re-sync slider and display from state
        iterSlider.value = monteCarloState.iterations;
        iterDisplay.textContent = monteCarloState.iterations.toLocaleString();
    }
}

export function nextStep() {
    if (state.currentStep < 6) {
        showStep(state.currentStep + 1);
    }
}

export function prevStep() {
    if (state.currentStep > 0) {
        showStep(state.currentStep - 1);
    }
}

export function restart() {
    state.selectedFunding = null;
    applyPreset('realistic');
    document.getElementById('fundingSelection').style.display = 'none';
    document.getElementById('fundingNextBtn').disabled = true;
    document.querySelectorAll('.choice-card').forEach(card => card.classList.remove('expanded'));
    showStep(0);
}

export function selectFunding(funding) {
    state.selectedFunding = funding;

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
export function jumpToMonteCarlo() {
    // Default to bank funding if not already selected
    if (!state.selectedFunding) {
        state.selectedFunding = 'bank';
    }
    // Ensure Step 5 multi-year params are initialized from Step 1 values
    if (!state.step5Initialized) {
        assumptions.multiYearSavingsTargetPct = assumptions.savingsTargetPct;
        assumptions.multiYearMsrPct = assumptions.msrPct;
        state.step5Initialized = true;
    }
    // Update funder-specific variables display
    updateMonteCarloFunderVars();
    // Update funder buttons
    updateMcFunderButtons(state.selectedFunding);
    // Navigate to Step 6 (Monte Carlo)
    showStep(6);
}

// Change funder selection from within Monte Carlo (Step 7)
export function setMcFunder(funder) {
    if (monteCarloState.isRunning) return;
    state.selectedFunding = funder;

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
export function updateMcFunderButtons(funder) {
    document.querySelectorAll('.mc-funder-btn').forEach(btn => btn.classList.remove('active'));
    const funderIdMap = { bank: 'mcFunderBank', hospital: 'mcFunderHospital', payer: 'mcFunderPayer', pe: 'mcFunderPe' };
    const btnId = funderIdMap[funder];
    if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.add('active');
    }
}

// Generate funder MC controls before tooltip setup
generateFunderMcControls();

// Prevent clicks inside funding params from triggering card selection
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

export function updateOutcomeDisplays() {
    if (!state.selectedFunding) return;

    // Restore quality banner state when navigating back from Step 5
    updateQualityBannerVisibility();

    document.getElementById('selectedFunderOutcome').textContent = FUNDING_CONFIG[state.selectedFunding].shortName;

    // Show relevant funder outcomes (Year 2 is now in Step 6)
    ['bank', 'hospital', 'payer', 'pe'].forEach(f => {
        const missEl = document.getElementById('miss-' + f);
        const hitEl = document.getElementById('hit-' + f);

        if (f === state.selectedFunding) {
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
            qualityOutcome.classList.toggle('active', funder === state.selectedFunding);
        }
    });

    const m = updateAllDisplays();

    // Update Monte Carlo funder-specific variables
    updateMonteCarloFunderVars();

    // Auto-select scenario based on funder
    // Hospital: redirect to Missed Target if premium causes MSR miss
    // Others: default to Hit Target
    if (state.selectedFunding === 'hospital' && m) {
        if (!m.hospitalMeetsThreshold) {
            showScenario('miss');  // Auto-redirect to Missed Target
        } else {
            showScenario('hit');   // Hospital can hit target with favorable terms
        }
    } else {
        showScenario('hit');
    }
}

export function showScenario(scenario) {
    document.querySelectorAll('.scenario-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.scenario-content').forEach(content => content.classList.remove('active'));

    const tab = document.querySelector(`.scenario-tab.${scenario}`);
    const content = document.getElementById('scenario-' + scenario);
    if (tab) tab.classList.add('active');
    if (content) content.classList.add('active');

    // Show/hide banners based on scenario and funding type
    const isHospital = state.selectedFunding === 'hospital';

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
                outcomeEl.classList.toggle('active', funder === state.selectedFunding);
            }
        });
    }
}

// Quality gate disabled note (gate = 0 means quality miss is impossible)
function updateQualityBannerVisibility() {
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
}

export function updateMultiYearDisplays(precomputedModel) {
    const m = precomputedModel || computeModel();
    const data = m.multiYearHit;

    // Update funder label
    const funderLabel = document.getElementById('selectedFunderMultiYear');
    if (funderLabel && state.selectedFunding) {
        funderLabel.textContent = FUNDING_CONFIG[state.selectedFunding].shortName;
    }

    // Update summary stats
    const totalNet = data.totalNet;
    document.getElementById('multiYearTotalNet').textContent = totalNet >= 0
        ? '$' + formatCurrency(totalNet)
        : '\u2212$' + formatCurrency(Math.abs(totalNet));
    // Handle negative values: show "\u2212$6.2M" not "$-6184646"
    const netAfterBurden = data.netAfterBurden;
    document.getElementById('multiYearNetAfterBurden').textContent = netAfterBurden >= 0
        ? '$' + formatCurrency(netAfterBurden)
        : '\u2212$' + formatCurrency(Math.abs(netAfterBurden));
    const avgPerDoc = data.avgNetAfterBurdenPerPcp;
    document.getElementById('multiYearAvgPerPcp').textContent = avgPerDoc >= 0
        ? '$' + formatCurrency(avgPerDoc)
        : '\u2212$' + formatCurrency(Math.abs(avgPerDoc));

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

    // Quality gate disabled note
    updateQualityBannerVisibility();

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
    if (state.selectedFunding === 'bank') {
        deductionHeader.innerHTML = `Loan Payment<div style="${subtitleStyle}">(annual)</div>`;
    } else if (state.selectedFunding === 'hospital') {
        deductionHeader.innerHTML = `Hospital Share<div style="${subtitleStyle}">(gain share)</div>`;
    } else if (state.selectedFunding === 'payer') {
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
        if (state.selectedFunding === 'bank') {
            deduction = row.loanPayment;
        } else if (state.selectedFunding === 'payer') {
            deduction = row.payerAdvanceDeduction || 0;
        } else {
            deduction = row.partnerGainShare;
        }
        // Convert status to CSS class (e.g., "TCOC Miss" -> "tcoc-miss")
        const statusClass = row.status.toLowerCase().replace(' ', '-');
        const reserveChangeStr = row.reserveChange >= 0
            ? '+$' + formatCurrency(row.reserveChange)
            : '\u2212$' + formatCurrency(Math.abs(row.reserveChange));

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
                <td>${row.netToPcps >= 0 ? '$' + formatCurrency(row.netToPcps) : '\u2212$' + formatCurrency(Math.abs(row.netToPcps))}</td>
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
                : `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">\u2212$${formatCurrency(Math.abs(row.netToPcps))}</span>`;
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

export function toggleComparison() {
    const toggle = document.querySelector('.comparison-toggle');
    const grid = document.getElementById('comparisonGrid');
    toggle.classList.toggle('open');
    grid.classList.toggle('open');
}

export function updateMcYearsToProject(value) {
    monteCarloState.multiYearConfig.yearsToProject = parseInt(value);
    document.getElementById('mcYearsToProjectDisplay').textContent = value;
    monteCarloState.multiYearDirty = true;
}

// Expose functions to HTML inline event handlers
window.updateMcYearsToProject = updateMcYearsToProject;
window.updateAssumption = updateAssumption;
window.applyPreset = applyPreset;
window.showStep = showStep;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.restart = restart;
window.selectFunding = selectFunding;
window.jumpToMonteCarlo = jumpToMonteCarlo;
window.setMcFunder = setMcFunder;
window.showScenario = showScenario;
window.showMultiYearView = showMultiYearView;
window.showMonteCarloTab = showMonteCarloTab;
window.toggleSliderGroup = toggleSliderGroup;
window.toggleTableColumns = toggleTableColumns;
window.toggleComparison = toggleComparison;
window.setMonteCarloView = setMonteCarloView;
window.setMultiYearMonteCarloView = setMultiYearMonteCarloView;
window.setMonteCarloPreset = setMonteCarloPreset;
window.updateMonteCarloSetting = updateMonteCarloSetting;
window.toggleMcVariableGroup = toggleMcVariableGroup;
window.updateMcVariableConstant = updateMcVariableConstant;
window.resetMcVariableToPreset = resetMcVariableToPreset;
window.randomizeAllMcVariables = randomizeAllMcVariables;
window.resetMonteCarloDefaults = resetMonteCarloDefaults;
window.runMonteCarloSimulation = runMonteCarloSimulation;
window.toggleMcVariable = toggleMcVariable;
window.setYear1TornadoMode = setYear1TornadoMode;
window.setMultiYearTornadoMode = setMultiYearTornadoMode;
