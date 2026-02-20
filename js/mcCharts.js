import { formatSignedCurrency } from './formatters.js';
import { getVariableExplanation } from './mcSampling.js';

export function drawTornadoChart(sensitivities, barsContainerId, axisContainerId) {
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
                    '<span class="indicator ' + lowClass + '">\u2193 Lower:</span>' +
                    '<span>' + explanation.lower + '</span>' +
                    '<span style="margin-left:auto;font-weight:600;color:#334155;">' + formatSignedCurrency(s.lowValue) + '</span>' +
                '</div>' +
                '<div class="tornado-explanation-line">' +
                    '<span class="indicator ' + highClass + '">\u2191 Higher:</span>' +
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

export function drawCorrelationTornadoChart(correlations, barsContainerId, axisContainerId) {
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
