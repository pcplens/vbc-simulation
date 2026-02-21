import { PRESETS, assumptions, state, monteCarloState, getMonteCarloVariableKeys, MONTE_CARLO_CONFIG, SLIDER_RANGES, FUNDER_VARIABLES, MC_FUNDER_TOOLTIPS, DEFAULT_HOLD_CONSTANT, DEFAULT_VARY_ENABLED, FUNDING_CONFIG } from './config.js';
import { sobolSequence } from './sobol.js';
import { generateSampledAssumptions, computeMonteCarloIteration, analyzeResults, getVariableLabel, getVariableExplanation, getVariationBounds, computeMedian, computePercentile, computeStdDev } from './mcSampling.js';
import { formatSignedCurrency, formatCurrency, applyMcStatColor, formatNumber, capitalizeFirst } from './formatters.js';
import { drawTornadoChart, drawCorrelationTornadoChart } from './mcCharts.js';
import { runCascadingMonteCarlo, displayMultiYearMCResults, analyzeYear1Correlations, setYear1TornadoMode, analyzeMultiYearPaths } from './multiYearMc.js';

export function runSimulationBatches(config, startIdx, results, resolve, reject) {
    try {
        const endIdx = Math.min(startIdx + MONTE_CARLO_CONFIG.batchSize, config.iterations);

        // Count varied dimensions for Sobol QMC (computed once, cached on config)
        if (config._variedDimCount === undefined) {
            const useQMC = monteCarloState.useQMC;
            let count = 0;
            if (useQMC) {
                const baseAssumptions = PRESETS[config.basePreset];
                getMonteCarloVariableKeys(config.funding, config.simulationType).forEach(varName => {
                    if (!monteCarloState.holdConstant[varName] && monteCarloState.varyEnabled[varName] && baseAssumptions[varName] !== undefined) {
                        count++;
                    }
                });
            }
            config._variedDimCount = count;
            config._useQMC = useQMC;
        }

        for (let i = startIdx; i < endIdx; i++) {
            // Pre-compute Sobol values for QMC sampling
            let sobolValues = null;
            if (config._useQMC && config._variedDimCount > 0) {
                sobolValues = [];
                for (let d = 0; d < config._variedDimCount; d++) {
                    sobolValues.push(sobolSequence(i + 1, d));
                }
            }
            const iterConfig = sobolValues ? Object.assign({}, config, { sobolValues }) : config;
            const sampled = generateSampledAssumptions(iterConfig);
            results.push(computeMonteCarloIteration(sampled, config));
        }

        // Update progress
        const progress = (endIdx / config.iterations) * 100;
        document.getElementById('mcProgressFill').style.width = progress + '%';
        document.getElementById('mcProgressText').textContent =
            'Running iteration ' + endIdx.toLocaleString() + ' of ' + config.iterations.toLocaleString() + '...';

        if (endIdx < config.iterations) {
            // Continue with next batch
            setTimeout(() => runSimulationBatches(config, endIdx, results, resolve, reject), 0);
        } else {
            // Simulation complete
            resolve(results);
        }
    } catch (err) {
        reject(err);
    }
}

export function runTornadoAnalysis(config) {
    const baseAssumptions = { ...PRESETS[config.basePreset] };
    const funding = config.funding || state.selectedFunding || 'bank';

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
    const baseValue = state.currentMonteCarloView === 'sharedSavings' ? baseResult.sharedSavings : baseResult.perPcpNet;

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
            const lowValue = state.currentMonteCarloView === 'sharedSavings' ? lowResult.sharedSavings : lowResult.perPcpNet;

            // Test high value
            const highAssumptions = { ...baseAssumptions, [varName]: bounds.max };
            const highResult = computeMonteCarloIteration(highAssumptions, { funding });
            const highValue = state.currentMonteCarloView === 'sharedSavings' ? highResult.sharedSavings : highResult.perPcpNet;

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

export async function runMonteCarloSimulation() {
    if (monteCarloState.isRunning) return;

    // Check which tab is active and run appropriate simulation
    if (state.currentMcTab === 'multiyear') {
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
        funding: state.selectedFunding || 'bank',
        simulationType: 'year1'
    };

    try {
        // Run simulation in batches
        const results = await new Promise((resolve, reject) => {
            runSimulationBatches(config, 0, [], resolve, reject);
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
export function displayMonteCarloResults(config) {
    if (!monteCarloState.results) return;

    const stats = analyzeResults(monteCarloState.results, state.currentMonteCarloView);
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
    if (state.currentMonteCarloView === 'perPcp') {
        pcpProfitCard.style.display = 'block';
        document.getElementById('mcStatPcpProfit').textContent = (100 - stats.probLoss).toFixed(1) + '%';
    } else {
        pcpProfitCard.style.display = 'none';
    }

    // Update Prob Loss label based on view
    const probLossLabel = document.getElementById('mcStatProbLossLabel');
    probLossLabel.innerHTML = state.currentMonteCarloView === 'sharedSavings'
        ? 'Prob ACO Loss <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Percentage of simulations where the ACO receives $0 payout (fails to meet MSR threshold).</span></span>'
        : 'Prob PCP Loss <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Percentage of simulations where physicians have negative net income after accounting for practice burden and any clawbacks.</span></span>';

    // Update histogram title with tooltip
    const histogramTitleEl = document.getElementById('mcHistogramTitle');
    histogramTitleEl.innerHTML = state.currentMonteCarloView === 'sharedSavings'
        ? 'Distribution of Shared Savings <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Total ACO shared savings distributed across all simulation iterations. Shows the range of possible Year 1 outcomes.</span></span>'
        : 'Distribution of Per-PCP Net Outcome <span class="tooltip-container"><span class="tooltip-icon">i</span><span class="tooltip-text">Each physician\'s net income: (Net to PCPs ÷ Number of PCPs) minus 18-month practice burden (lost clinic revenue + staff costs). Positive = physician profits; negative = physician loses money.</span></span>';

    // Draw histogram
    drawHistogram(stats);

    // Draw deterministic tornado chart
    drawTornadoChart(tornado);

    // Show/hide infrastructure cost explanation based on view
    const tornadoViewNote = document.getElementById('mcTornadoViewNote');
    if (tornadoViewNote) {
        tornadoViewNote.style.display = state.currentMonteCarloView === 'sharedSavings' ? 'flex' : 'none';
    }

    // Draw correlation tornado (upfront for instant tab switching)
    if (monteCarloState.results && monteCarloState.results.length >= 10) {
        const correlations = analyzeYear1Correlations(monteCarloState.results);
        drawCorrelationTornadoChart(correlations, 'mcCorrTornadoBars', 'mcCorrTornadoAxisLabels');
    }

    // Restore tab state
    setYear1TornadoMode(state.currentYear1TornadoMode);
}

// Draw histogram on canvas
export function drawHistogram(stats) {
    const canvas = document.getElementById('mcHistogramCanvas');
    if (!canvas) return;
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

export function setMonteCarloPreset(preset) {
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

export function updateMonteCarloSetting(setting, value) {
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
        monteCarloState[setting] = parseInt(value, 10);

        if (setting === 'iterations') {
            document.getElementById('mcIterationsDisplay').textContent = parseInt(value, 10).toLocaleString();
        } else if (setting === 'variationPct') {
            document.getElementById('mcVariationDisplay').textContent = value;
        }
    }
}

export function toggleMcVariableGroup(groupId) {
    const group = document.getElementById(groupId);
    group.classList.toggle('collapsed');
}

// Format variable values appropriately by variable type
export function formatMcVariableValue(varName, value) {
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
         'hospitalCostPremium', 'hospitalGainShare', 'hospitalReferralPct', 'hospitalPremiumGrowthPct',
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

// Generate funder-specific MC controls dynamically from FUNDER_VARIABLES
export function generateFunderMcControls() {
    const funderContainerIds = {
        bank: 'mcBankVars',
        hospital: 'mcHospitalVars',
        pe: 'mcPeVars',
        payer: 'mcPayerVars'
    };
    const presetValues = PRESETS.realistic;

    for (const [funderKey, varNames] of Object.entries(FUNDER_VARIABLES)) {
        const container = document.getElementById(funderContainerIds[funderKey]);
        if (!container) continue;
        container.innerHTML = '';

        for (const varName of varNames) {
            const capName = capitalizeFirst(varName);
            const label = getVariableLabel(varName);
            const tooltip = MC_FUNDER_TOOLTIPS[varName] || '';
            const defaultValue = presetValues[varName];
            const displayValue = formatMcVariableValue(varName, defaultValue);
            const isRandomized = !DEFAULT_HOLD_CONSTANT[varName];

            const row = document.createElement('div');
            row.className = 'mc-variable-row';
            row.innerHTML =
                '<input type="checkbox" class="mc-variable-checkbox" id="mcVar' + capName + '" onchange="toggleMcVariable(\'' + varName + '\', this.checked)">' +
                '<div class="mc-variable-label"><span class="tooltip-container">' + label +
                    '<span class="tooltip-icon" tabindex="0" role="button">i</span>' +
                    '<span class="tooltip-text">' + tooltip + '</span>' +
                '</span></div>' +
                '<span class="mc-variable-badge" id="mcBadge' + capName + '">' + (isRandomized ? 'Randomized' : 'Constant') + '</span>' +
                '<div class="mc-slider-container" id="mcSlider' + capName + '">' +
                    '<input type="range" oninput="updateMcVariableConstant(\'' + varName + '\', this.value)">' +
                    '<div class="mc-slider-value" id="mcValue' + capName + '">' + displayValue + '</div>' +
                    '<button class="mc-slider-reset" onclick="resetMcVariableToPreset(\'' + varName + '\')" title="Reset to preset">&#8634;</button>' +
                '</div>';

            container.appendChild(row);
        }
    }
}

// Get slider container element (sliders are now embedded in HTML)
export function getMcSliderContainer(varName) {
    const sliderId = 'mcSlider' + capitalizeFirst(varName);
    return document.getElementById(sliderId);
}

// Initialize or update a variable's slider
export function initMcVariableSlider(varName, value) {
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
export function updateMcVariableConstant(varName, value) {
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
export function resetMcVariableToPreset(varName) {
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
export function randomizeAllMcVariables() {
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
export function initMcHeldVariableSliders() {
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

export function toggleMcVariable(varName, isChecked) {
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

export function setMonteCarloView(view) {
    state.currentMonteCarloView = view;

    // Update button states
    document.getElementById('mcViewSharedSavings').classList.toggle('active', view === 'sharedSavings');
    document.getElementById('mcViewPerPcp').classList.toggle('active', view === 'perPcp');

    // Re-display results if available, but warn if stale
    if (monteCarloState.year1Dirty && monteCarloState.year1Results) {
        document.getElementById('mcResults').style.display = 'none';
        document.getElementById('myMcResults').style.display = 'none';
        document.getElementById('mcNoResults').style.display = 'block';
    } else if (monteCarloState.year1Results) {
        // Use year1Results (the array) to avoid crash if results holds a multi-year object
        monteCarloState.results = monteCarloState.year1Results;
        displayMonteCarloResults({
            basePreset: monteCarloState.basePreset,
            variationPct: monteCarloState.variationPct,
            iterations: monteCarloState.iterations,
            funding: state.selectedFunding || 'bank'
        });
    }
}

// Multi-Year Monte Carlo view toggle
export function setMultiYearMonteCarloView(view) {
    state.currentMultiYearMonteCarloView = view;

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

export function resetMonteCarloDefaults() {
    // Reset state
    Object.assign(monteCarloState, {
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
    });

    // Hide all slider containers
    document.querySelectorAll('.mc-slider-container').forEach(s => s.classList.remove('visible'));

    // Reset UI
    document.getElementById('mcIterations').value = 1000;
    document.getElementById('mcIterationsDisplay').textContent = '1,000';
    document.getElementById('mcVariation').value = 50;
    document.getElementById('mcVariationDisplay').textContent = '50';
    document.getElementById('mcYearsToProject').value = 10;
    document.getElementById('mcYearsToProjectDisplay').textContent = '10';
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
export function updateMonteCarloFunderVars() {
    const funder = state.selectedFunding || null;

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
