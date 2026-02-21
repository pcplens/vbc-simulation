// formatters.js - Formatting and visibility utilities

export function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatNumber(num) {
    return num.toLocaleString();
}

export function formatCurrency(num) {
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

export function formatCurrencyFull(num) {
    if (!isFinite(num)) return '0';
    return num.toLocaleString();
}

export function formatSignedCurrency(num) {
    if (!isFinite(num)) return '$0';
    const absValue = Math.abs(num);
    let formatted;
    if (absValue >= 1000000) {
        formatted = '$' + (absValue / 1000000).toFixed(1) + 'M';
    } else if (absValue >= 1000) {
        formatted = '$' + Math.round(absValue / 1000) + 'K';
    } else {
        formatted = '$' + Math.round(absValue);
    }
    if (num === 0) return formatted;
    return num > 0 ? '+' + formatted : '\u2212' + formatted;
}

export function formatCurrencySigned(num) {
    if (!isFinite(num)) return '$0';
    const abs = Math.abs(num);
    let formatted;
    if (abs >= 1000000000) formatted = (abs / 1000000000).toFixed(1) + 'B';
    else if (abs >= 1000000) formatted = (abs / 1000000).toFixed(1) + 'M';
    else if (abs >= 1000) formatted = Math.round(abs / 1000) + 'K';
    else formatted = Math.round(abs).toString();
    return num < 0 ? '\u2212$' + formatted : '$' + formatted;
}

export function applyMcStatColor(valueElementId, numericValue) {
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

export function setVisible(id, visible) {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? 'block' : 'none';
}
