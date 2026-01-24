/**
 * Statistical Helpers for Business Intelligence (BI) Suite
 * Implements mathematical models for laundry business performance analysis.
 */

/**
 * Service Mix Variance (Contribution Analysis)
 * Formula: Variance = (Actual% - Target%) * TotalRevenue
 * Helps identify which laundry services are deviating from expected profitability.
 */
export function calculateServiceMixVariance(
    actualPercent: number,
    targetPercent: number,
    totalRevenue: number
): number {
    return (actualPercent - targetPercent) * totalRevenue;
}

/**
 * Customer Lifetime Value (CLV)
 * Formula: CLV = AverageOrderValue * PurchaseFrequency * CustomerLifespan
 * purchaseFrequency: orders per year
 * lifespanYears: expected customer retention in years
 */
export function calculateCLV(
    avgOrderValue: number,
    purchaseFrequency: number,
    lifespanYears: number = 3
): number {
    return avgOrderValue * purchaseFrequency * lifespanYears;
}

/**
 * Operational Bottleneck Formula (Little's Law)
 * Formula: L = λ * W
 * Items in Process (L) = Arrival Rate (λ) * Average Wait Time (W)
 * Provenance: Operations Management
 */
export function calculateInventoryInProcess(
    arrivalRatePerDay: number,
    avgLeadTimeDays: number
): number {
    return arrivalRatePerDay * avgLeadTimeDays;
}

/**
 * Revenue Seasonality (Simple Moving Average - SMA)
 * Used to smooth out weekend spikes in laundry drops.
 */
export function calculateSMA(data: number[], window: number = 7): number[] {
    const result: number[] = [];
    if (data.length < window) return [data.reduce((a, b) => a + b, 0) / data.length];

    for (let i = window - 1; i < data.length; i++) {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
    }
    return result;
}

/**
 * Predictive Forecasting (Simple Linear Regression)
 * Predicts Y for a given X based on historical trend.
 */
export function calculateLinearRegression(data: { x: number; y: number }[]): {
    slope: number;
    intercept: number;
    predict: (x: number) => number;
} {
    const n = data.length;
    if (n === 0) return { slope: 0, intercept: 0, predict: () => 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const point of data) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
        slope,
        intercept,
        predict: (x: number) => slope * x + intercept
    };
}

/**
 * Staff Efficiency Z-Score
 * Measures how a staff member's speed/value compares to the franchise average.
 * Formula: z = (x - μ) / σ
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
}

/**
 * Standard Deviation
 */
export function calculateStandardDeviation(values: number[]): number {
    const n = values.length;
    if (n <= 1) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    return Math.sqrt(variance);
}
