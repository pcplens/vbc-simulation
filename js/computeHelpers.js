// computeHelpers.js - Domain-specific calculation helpers

// Compute quality gate pass/fail for a given year.
// For Year 1: (year-1) terms are 0, so gate = qualityGatePct, achieved = acoStartingQualityPct.
export function computeQualityGate({ qualityGatePct, qualityGateRatchetPct, qualityGateCeiling,
                                   acoStartingQualityPct, acoQualityImprovementPct, acoMaxQualityPct }, year) {
    const ceiling = qualityGateCeiling ?? 95;
    const qualityGateRequired = Math.min(ceiling, qualityGatePct + (year - 1) * qualityGateRatchetPct);
    const rawAchievedQuality = acoStartingQualityPct + (year - 1) * acoQualityImprovementPct;
    const achievedQuality = Math.min(100, acoMaxQualityPct, rawAchievedQuality);
    const qualityPass = achievedQuality >= qualityGateRequired;
    const qualityMargin = achievedQuality - qualityGateRequired;
    const atQualityCeiling = rawAchievedQuality >= acoMaxQualityPct;
    return { qualityGateRequired, rawAchievedQuality, achievedQuality, qualityPass, qualityMargin, atQualityCeiling };
}

// Compute single-year RAF growth rates with saturation curve
// Accepts growth rates as parameters so callers can pass shock-overridden values
export function computeRafGrowthRates(a, year, acoRafGrowthPct, regionalRafGrowthPct) {
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
    regionalGrowthRate = Math.min(regionalGrowthRate, a.codingIntensityCap);

    return { acoGrowthRate, regionalGrowthRate };
}

// RAF Adjustment calculation for benchmark modification
export function computeRafAdjustment(a, year) {
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

export function inflationMultiplier(inflationPct, year) {
    return Math.pow(1 + inflationPct / 100, year - 1);
}
