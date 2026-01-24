/**
 * ============================================================================
 * FabZClean Business Intelligence (BI) Mathematics Engine
 * ============================================================================
 * 
 * Enterprise-grade statistical library providing:
 * - Predictive Revenue Forecasting (Linear Regression)
 * - Customer Lifetime Value (CLV) Calculation
 * - Operational Bottleneck Analysis (Little's Law)
 * - Staff Efficiency Z-Scores
 * - Service Contribution Margin Analysis
 * - Cohort Retention Analysis
 * - Seasonality Detection (SMA/EMA)
 * - Anomaly Detection (Standard Deviation Outliers)
 * - Peak Demand Heatmap Data
 * - Service Correlation Matrix
 * 
 * @module bi-math-engine
 * @version 2.0.0
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LinearRegressionResult {
    slope: number;
    intercept: number;
    r2: number;  // Coefficient of determination
    mse: number; // Mean Squared Error
    predict: (x: number) => number;
    equation: string;  // Human readable equation
}

export interface CLVResult {
    customerId: string;
    customerName: string;
    averageOrderValue: number;
    purchaseFrequency: number;  // Orders per year
    customerLifespan: number;   // Years
    clv: number;
    tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
    percentile: number;
}

export interface LittlesLawResult {
    arrivalRate: number;       // λ (lambda) - orders/items per day
    waitTime: number;          // W - average processing time in days
    itemsInProcess: number;    // L = λ * W
    bottleneckType: 'volume' | 'processing' | 'balanced';
    recommendation: string;
}

export interface StaffEfficiencyResult {
    employeeId: string;
    employeeName: string;
    rawScore: number;          // Raw productivity measure
    zScore: number;            // How many std devs from mean
    percentile: number;        // Percentile rank
    rating: 'Exceptional' | 'Above Average' | 'Average' | 'Below Average' | 'Needs Improvement';
    weightedScore: number;     // Complexity-adjusted score
}

export interface ServiceContributionResult {
    serviceId: string;
    serviceName: string;
    revenue: number;
    actualPercent: number;
    targetPercent: number;
    variance: number;          // (Actual% - Target%) * TotalRevenue
    marginContribution: number;
    category: 'Hero' | 'Performer' | 'Standard' | 'LossLeader';
}

export interface CohortRetentionResult {
    cohortMonth: string;       // YYYY-MM format
    totalCustomers: number;
    retentionByMonth: {
        month: number;           // 0 = joining month, 1 = first month after, etc.
        activeCustomers: number;
        retentionRate: number;   // Percentage
        revenue: number;
    }[];
    avgRetentionRate: number;
    churnRate: number;
}

export interface PeakDemandResult {
    dayOfWeek: number;         // 0 = Sunday, 6 = Saturday
    hourOfDay: number;         // 0-23
    demandScore: number;       // Normalized 0-1
    orderCount: number;
    revenue: number;
    label: string;             // e.g., "Saturday 10:00 AM"
}

export interface ServiceCorrelationResult {
    service1: string;
    service2: string;
    correlation: number;       // -1 to 1
    coOccurrences: number;     // Times bought together
    avgBasketLift: number;     // Revenue increase when together
}

export interface AnomalyResult {
    orderId: string;
    orderNumber: string;
    value: number;
    zScore: number;
    deviationType: 'high' | 'low';
    flagReason: string;
}

export interface ForecastResult {
    date: string;
    predicted: number;
    confidence: {
        lower: number;
        upper: number;
    };
    trend: 'up' | 'down' | 'stable';
    momentum: number;          // Rate of change
}

export interface DailySummaryData {
    date: string;
    franchiseId: string;

    // Revenue Metrics
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueGrowthMoM: number;
    revenueGrowthYoY: number;

    // Predictive Metrics
    projectedMonthEndRevenue: number;
    revenueVelocity: number;   // Current vs 7-day SMA
    atRiskRevenue: number;     // Orders past due

    // Customer Metrics
    newCustomers: number;
    returningCustomers: number;
    avgClv: number;
    customerChurnRate: number;

    // Service Metrics
    topServiceId: string;
    topServiceRevenue: number;
    serviceMixVariance: number;

    // Operational Metrics
    avgTurnaroundHours: number;
    turnaroundVariance: number;
    itemsInProcess: number;
    bottleneckScore: number;

    // Staff Metrics
    avgStaffZScore: number;
    topPerformerId: string;
    totalStaffProductivity: number;

    // Tax Metrics (GST Breakout)
    totalTaxCollected: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;

    // Anomaly Metrics
    anomalyCount: number;
    suspiciousOrderIds: string[];

    // Statistical Aggregates
    orderValueMean: number;
    orderValueMedian: number;
    orderValueStdDev: number;
    orderValue85thPercentile: number;

    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// CORE STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Calculate mean (average) of an array
 */
export function mean(values: number[]): number {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate median (middle value) of an array
 */
export function median(values: number[]): number {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

/**
 * Calculate mode (most frequent value) of an array
 */
export function mode(values: number[]): number {
    if (!values || values.length === 0) return 0;
    const frequency: Record<number, number> = {};
    let maxFreq = 0;
    let modeValue = values[0];

    for (const value of values) {
        frequency[value] = (frequency[value] || 0) + 1;
        if (frequency[value] > maxFreq) {
            maxFreq = frequency[value];
            modeValue = value;
        }
    }

    return modeValue;
}

/**
 * Calculate variance (population variance by default)
 */
export function variance(values: number[], sample: boolean = false): number {
    if (!values || values.length === 0) return 0;
    const avg = mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
    const divisor = sample && values.length > 1 ? values.length - 1 : values.length;
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / divisor;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[], sample: boolean = false): number {
    return Math.sqrt(variance(values, sample));
}

/**
 * Calculate percentile
 */
export function percentile(values: number[], p: number): number {
    if (!values || values.length === 0) return 0;
    if (p < 0 || p > 100) throw new Error('Percentile must be between 0 and 100');

    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate Z-Score: how many standard deviations a value is from the mean
 * Formula: z = (x - μ) / σ
 */
export function zScore(value: number, avg: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - avg) / stdDev;
}

/**
 * Convert Z-Score to percentile (using approximation of standard normal CDF)
 */
export function zScoreToPercentile(z: number): number {
    // Approximation of the standard normal CDF (error < 0.0005)
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return (0.5 * (1.0 + sign * y)) * 100;
}

// ============================================================================
// LINEAR REGRESSION (Predictive Forecasting)
// ============================================================================

/**
 * Perform Linear Regression Analysis
 * Uses Ordinary Least Squares (OLS) method
 * Formula: y = mx + b where m = slope, b = intercept
 */
export function linearRegression(x: number[], y: number[]): LinearRegressionResult {
    if (x.length !== y.length || x.length === 0) {
        return {
            slope: 0,
            intercept: 0,
            r2: 0,
            mse: 0,
            predict: () => 0,
            equation: 'y = 0'
        };
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    // Calculate slope (m) and intercept (b)
    const denominator = n * sumX2 - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R² (coefficient of determination)
    const meanY = mean(y);
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
        const predicted = slope * x[i] + intercept;
        return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const r2 = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

    // Calculate MSE
    const mse = ssResidual / n;

    return {
        slope,
        intercept,
        r2,
        mse,
        predict: (xValue: number) => slope * xValue + intercept,
        equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`
    };
}

/**
 * Forecast revenue for the next N days using linear regression
 * Based on historical data from the last 30 days
 */
export function forecastRevenue(
    historicalRevenue: { date: string; revenue: number }[],
    daysToForecast: number = 7
): ForecastResult[] {
    if (historicalRevenue.length < 7) {
        return [];
    }

    // Sort by date
    const sorted = [...historicalRevenue].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Use last 30 days (or all available)
    const relevantData = sorted.slice(-30);

    const x = relevantData.map((_, i) => i);
    const y = relevantData.map(d => d.revenue);

    const regression = linearRegression(x, y);
    const stdDev = standardDeviation(y);

    // 95% confidence interval = 1.96 * stdDev
    const confidence95 = 1.96 * stdDev;

    const forecasts: ForecastResult[] = [];
    const lastDate = new Date(relevantData[relevantData.length - 1].date);
    const lastIdx = x.length - 1;

    for (let i = 1; i <= daysToForecast; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + i);

        const predicted = Math.max(0, regression.predict(lastIdx + i));
        const trend = regression.slope > 0.05 ? 'up' : regression.slope < -0.05 ? 'down' : 'stable';

        forecasts.push({
            date: forecastDate.toISOString().split('T')[0],
            predicted: Math.round(predicted * 100) / 100,
            confidence: {
                lower: Math.max(0, Math.round((predicted - confidence95) * 100) / 100),
                upper: Math.round((predicted + confidence95) * 100) / 100
            },
            trend,
            momentum: Math.round(regression.slope * 100) / 100
        });
    }

    return forecasts;
}

// ============================================================================
// CUSTOMER LIFETIME VALUE (CLV)
// ============================================================================

/**
 * Calculate Customer Lifetime Value
 * Formula: CLV = Average Order Value × Purchase Frequency × Customer Lifespan
 */
export function calculateCLV(
    averageOrderValue: number,
    purchaseFrequencyPerYear: number,
    customerLifespanYears: number = 3
): number {
    return averageOrderValue * purchaseFrequencyPerYear * customerLifespanYears;
}

/**
 * Batch calculate CLV for all customers and segment them
 */
export function calculateCustomerCLVs(
    customers: {
        id: string;
        name: string;
        totalSpent: number;
        orderCount: number;
        firstOrderDate: Date;
        lastOrderDate: Date;
    }[],
    avgCustomerLifespanYears: number = 3
): CLVResult[] {
    const results: CLVResult[] = [];
    const now = new Date();

    for (const customer of customers) {
        const customerAgeYears = Math.max(
            0.1,
            (now.getTime() - customer.firstOrderDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );

        const avgOrderValue = customer.orderCount > 0
            ? customer.totalSpent / customer.orderCount
            : 0;

        const purchaseFrequency = customer.orderCount / customerAgeYears;

        const clv = calculateCLV(avgOrderValue, purchaseFrequency, avgCustomerLifespanYears);

        results.push({
            customerId: customer.id,
            customerName: customer.name,
            averageOrderValue: Math.round(avgOrderValue * 100) / 100,
            purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
            customerLifespan: avgCustomerLifespanYears,
            clv: Math.round(clv * 100) / 100,
            tier: 'Bronze', // Will be updated below
            percentile: 0    // Will be updated below
        });
    }

    // Sort by CLV and assign tiers
    results.sort((a, b) => b.clv - a.clv);

    const clvValues = results.map(r => r.clv);

    for (let i = 0; i < results.length; i++) {
        const pct = ((results.length - i) / results.length) * 100;
        results[i].percentile = Math.round(pct);

        // Assign tiers: Top 10% = Platinum, 10-30% = Gold, 30-60% = Silver, 60-100% = Bronze
        if (pct >= 90) {
            results[i].tier = 'Platinum';
        } else if (pct >= 70) {
            results[i].tier = 'Gold';
        } else if (pct >= 40) {
            results[i].tier = 'Silver';
        } else {
            results[i].tier = 'Bronze';
        }
    }

    return results;
}

// ============================================================================
// LITTLE'S LAW (Operational Bottleneck Analysis)
// ============================================================================

/**
 * Apply Little's Law: L = λ × W
 * L = Items in Process
 * λ = Arrival Rate (orders per day)
 * W = Wait Time (average processing time in days)
 */
export function calculateLittlesLaw(
    ordersPerDay: number,
    avgProcessingTimeDays: number,
    targetProcessingTimeDays: number = 1
): LittlesLawResult {
    const itemsInProcess = ordersPerDay * avgProcessingTimeDays;

    // Determine bottleneck type
    let bottleneckType: 'volume' | 'processing' | 'balanced';
    let recommendation: string;

    const processingRatio = avgProcessingTimeDays / targetProcessingTimeDays;
    const volumeRatio = itemsInProcess / (ordersPerDay * targetProcessingTimeDays);

    if (processingRatio > 1.2 && volumeRatio <= 1.2) {
        bottleneckType = 'processing';
        recommendation = `Processing speed is ${Math.round((processingRatio - 1) * 100)}% slower than target. Consider increasing staff or optimizing workflow.`;
    } else if (volumeRatio > 1.2 && processingRatio <= 1.2) {
        bottleneckType = 'volume';
        recommendation = `Incoming volume is ${Math.round((volumeRatio - 1) * 100)}% higher than capacity. Consider expanding capacity or limiting orders.`;
    } else if (processingRatio > 1.2 && volumeRatio > 1.2) {
        bottleneckType = 'processing';
        recommendation = `Both volume and processing are strained. Priority: Improve processing speed, then expand capacity.`;
    } else {
        bottleneckType = 'balanced';
        recommendation = `Operations are running within acceptable parameters.`;
    }

    return {
        arrivalRate: Math.round(ordersPerDay * 100) / 100,
        waitTime: Math.round(avgProcessingTimeDays * 100) / 100,
        itemsInProcess: Math.round(itemsInProcess * 100) / 100,
        bottleneckType,
        recommendation
    };
}

// ============================================================================
// STAFF EFFICIENCY Z-SCORES (Weighted Productivity Scoring)
// ============================================================================

/**
 * Service complexity weights for fair staff comparison
 * A heavy suit counts more than a simple shirt
 */
export const SERVICE_COMPLEXITY_WEIGHTS: Record<string, number> = {
    // Premium/Complex Services (3x weight)
    'suit_premium': 3.0,
    'wedding_dress': 3.0,
    'leather_jacket': 3.0,
    'heavy_coat': 2.5,

    // Standard Complex (2x weight)
    'suit_standard': 2.0,
    'dress': 2.0,
    'coat': 2.0,
    'blazer': 1.8,

    // Regular Items (1x weight)
    'shirt': 1.0,
    'trouser': 1.0,
    'jeans': 1.0,
    't_shirt': 0.8,

    // Simple Items (0.5x weight)
    'underwear': 0.5,
    'socks': 0.3,
    'handkerchief': 0.3,

    // Default
    'default': 1.0
};

/**
 * Get complexity weight for a service
 */
export function getServiceComplexityWeight(serviceCategory: string): number {
    const normalized = serviceCategory.toLowerCase().replace(/[-\s]/g, '_');
    return SERVICE_COMPLEXITY_WEIGHTS[normalized] || SERVICE_COMPLEXITY_WEIGHTS['default'];
}

/**
 * Calculate weighted staff efficiency scores with Z-Score normalization
 */
export function calculateStaffEfficiency(
    staffMetrics: {
        employeeId: string;
        employeeName: string;
        ordersProcessed: number;
        itemsByCategory: { category: string; count: number }[];
        hoursWorked: number;
    }[]
): StaffEfficiencyResult[] {
    // Calculate weighted scores
    const weightedScores = staffMetrics.map(staff => {
        let weightedItems = 0;
        for (const item of staff.itemsByCategory) {
            weightedItems += item.count * getServiceComplexityWeight(item.category);
        }

        // Productivity = Weighted Items per Hour
        const productivity = staff.hoursWorked > 0 ? weightedItems / staff.hoursWorked : 0;

        return {
            ...staff,
            weightedScore: Math.round(weightedItems * 100) / 100,
            rawScore: Math.round(productivity * 100) / 100
        };
    });

    // Calculate mean and stdDev of raw scores
    const rawScores = weightedScores.map(s => s.rawScore);
    const avgScore = mean(rawScores);
    const stdDevScore = standardDeviation(rawScores);

    // Calculate Z-Scores and ratings
    return weightedScores.map(staff => {
        const z = zScore(staff.rawScore, avgScore, stdDevScore);
        const pct = zScoreToPercentile(z);

        let rating: StaffEfficiencyResult['rating'];
        if (z >= 1.5) rating = 'Exceptional';
        else if (z >= 0.5) rating = 'Above Average';
        else if (z >= -0.5) rating = 'Average';
        else if (z >= -1.5) rating = 'Below Average';
        else rating = 'Needs Improvement';

        return {
            employeeId: staff.employeeId,
            employeeName: staff.employeeName,
            rawScore: staff.rawScore,
            zScore: Math.round(z * 100) / 100,
            percentile: Math.round(pct),
            rating,
            weightedScore: staff.weightedScore
        };
    }).sort((a, b) => b.zScore - a.zScore);
}

// ============================================================================
// SERVICE CONTRIBUTION MARGIN ANALYSIS
// ============================================================================

/**
 * Calculate Service Mix Variance (Contribution Analysis)
 * Formula: Variance = (Actual% - Target%) × TotalRevenue
 */
export function calculateServiceContribution(
    services: {
        serviceId: string;
        serviceName: string;
        revenue: number;
        costPerOrder: number;  // Direct costs (chemicals, labor share)
        targetPercentage: number;  // Expected % of total revenue
    }[],
    totalRevenue: number
): ServiceContributionResult[] {
    const results: ServiceContributionResult[] = [];

    for (const service of services) {
        const actualPercent = totalRevenue > 0 ? (service.revenue / totalRevenue) * 100 : 0;
        const variance = ((actualPercent - service.targetPercentage) / 100) * totalRevenue;
        const marginContribution = service.revenue - (service.costPerOrder * (service.revenue / (service.revenue || 1)));

        // Categorize service
        let category: ServiceContributionResult['category'];
        const marginPercent = service.revenue > 0 ? (marginContribution / service.revenue) * 100 : 0;

        if (marginPercent >= 40 && actualPercent >= service.targetPercentage) {
            category = 'Hero';
        } else if (marginPercent >= 25) {
            category = 'Performer';
        } else if (marginPercent >= 10) {
            category = 'Standard';
        } else {
            category = 'LossLeader';
        }

        results.push({
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            revenue: Math.round(service.revenue * 100) / 100,
            actualPercent: Math.round(actualPercent * 100) / 100,
            targetPercent: service.targetPercentage,
            variance: Math.round(variance * 100) / 100,
            marginContribution: Math.round(marginContribution * 100) / 100,
            category
        });
    }

    return results.sort((a, b) => b.marginContribution - a.marginContribution);
}

// ============================================================================
// MOVING AVERAGES (Seasonality Detection)
// ============================================================================

/**
 * Simple Moving Average (SMA)
 * Used to smooth out weekend spikes in laundry drops
 */
export function simpleMovingAverage(values: number[], window: number = 7): number[] {
    if (!values || values.length < window) {
        return values && values.length > 0
            ? [mean(values)]
            : [];
    }

    const result: number[] = [];
    for (let i = window - 1; i < values.length; i++) {
        const windowValues = values.slice(i - window + 1, i + 1);
        result.push(mean(windowValues));
    }
    return result;
}

/**
 * Exponential Moving Average (EMA)
 * Gives more weight to recent values
 */
export function exponentialMovingAverage(values: number[], smoothing: number = 2): number[] {
    if (!values || values.length === 0) return [];

    const result: number[] = [values[0]];
    const multiplier = smoothing / (values.length + 1);

    for (let i = 1; i < values.length; i++) {
        const ema = (values[i] - result[i - 1]) * multiplier + result[i - 1];
        result.push(ema);
    }

    return result;
}

/**
 * Calculate Revenue Velocity
 * Current daily revenue vs 7-day SMA
 */
export function calculateRevenueVelocity(
    currentDayRevenue: number,
    last7DaysRevenue: number[]
): { velocity: number; trend: 'accelerating' | 'decelerating' | 'stable' } {
    const sma7 = mean(last7DaysRevenue);
    const velocity = sma7 > 0 ? (currentDayRevenue / sma7) * 100 : 100;

    let trend: 'accelerating' | 'decelerating' | 'stable';
    if (velocity > 110) trend = 'accelerating';
    else if (velocity < 90) trend = 'decelerating';
    else trend = 'stable';

    return {
        velocity: Math.round(velocity * 100) / 100,
        trend
    };
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detect outliers using Z-Score method
 * Flags orders that deviate > threshold standard deviations from mean
 */
export function detectAnomalies(
    orders: {
        orderId: string;
        orderNumber: string;
        amount: number;
    }[],
    threshold: number = 3
): AnomalyResult[] {
    if (orders.length < 3) return [];

    const amounts = orders.map(o => o.amount);
    const avgAmount = mean(amounts);
    const stdDevAmount = standardDeviation(amounts);

    const anomalies: AnomalyResult[] = [];

    for (const order of orders) {
        const z = zScore(order.amount, avgAmount, stdDevAmount);

        if (Math.abs(z) > threshold) {
            anomalies.push({
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                value: order.amount,
                zScore: Math.round(z * 100) / 100,
                deviationType: z > 0 ? 'high' : 'low',
                flagReason: z > 0
                    ? `Order amount ₹${order.amount} is ${Math.abs(z).toFixed(1)} std devs above average (₹${avgAmount.toFixed(2)})`
                    : `Order amount ₹${order.amount} is ${Math.abs(z).toFixed(1)} std devs below average (₹${avgAmount.toFixed(2)})`
            });
        }
    }

    return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

// ============================================================================
// PEAK DEMAND HEATMAP
// ============================================================================

/**
 * Generate Peak Demand Heatmap Data
 * Shows when the store is mathematically busiest
 */
export function generatePeakDemandHeatmap(
    orders: {
        createdAt: Date;
        totalAmount: number;
    }[]
): PeakDemandResult[] {
    // Initialize 7x24 grid (days x hours)
    const grid: { count: number; revenue: number }[][] = Array(7)
        .fill(null)
        .map(() => Array(24).fill(null).map(() => ({ count: 0, revenue: 0 })));

    // Populate grid
    for (const order of orders) {
        const dayOfWeek = order.createdAt.getDay(); // 0 = Sunday
        const hourOfDay = order.createdAt.getHours();
        grid[dayOfWeek][hourOfDay].count++;
        grid[dayOfWeek][hourOfDay].revenue += order.totalAmount;
    }

    // Find max for normalization
    let maxCount = 0;
    for (const day of grid) {
        for (const hour of day) {
            if (hour.count > maxCount) maxCount = hour.count;
        }
    }

    // Generate results
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const results: PeakDemandResult[] = [];

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const cell = grid[day][hour];
            const hourLabel = hour === 0 ? '12:00 AM'
                : hour < 12 ? `${hour}:00 AM`
                    : hour === 12 ? '12:00 PM'
                        : `${hour - 12}:00 PM`;

            results.push({
                dayOfWeek: day,
                hourOfDay: hour,
                demandScore: maxCount > 0 ? Math.round((cell.count / maxCount) * 100) / 100 : 0,
                orderCount: cell.count,
                revenue: Math.round(cell.revenue * 100) / 100,
                label: `${dayNames[day]} ${hourLabel}`
            });
        }
    }

    return results.sort((a, b) => b.demandScore - a.demandScore);
}

// ============================================================================
// SERVICE CORRELATION MATRIX
// ============================================================================

/**
 * Calculate service correlation (which services are frequently bought together)
 */
export function calculateServiceCorrelation(
    orders: {
        services: string[];  // Array of service IDs/names in the order
        totalAmount: number;
    }[]
): ServiceCorrelationResult[] {
    // Build co-occurrence matrix
    const coOccurrence: Record<string, Record<string, { count: number; totalRevenue: number }>> = {};
    const serviceOrderCount: Record<string, number> = {};

    for (const order of orders) {
        const uniqueServices = Array.from(new Set(order.services));

        // Count individual service occurrences
        for (const service of uniqueServices) {
            serviceOrderCount[service] = (serviceOrderCount[service] || 0) + 1;
        }

        // Count co-occurrences
        for (let i = 0; i < uniqueServices.length; i++) {
            for (let j = i + 1; j < uniqueServices.length; j++) {
                const s1 = uniqueServices[i];
                const s2 = uniqueServices[j];

                if (!coOccurrence[s1]) coOccurrence[s1] = {};
                if (!coOccurrence[s1][s2]) coOccurrence[s1][s2] = { count: 0, totalRevenue: 0 };

                coOccurrence[s1][s2].count++;
                coOccurrence[s1][s2].totalRevenue += order.totalAmount;
            }
        }
    }

    // Convert to results
    const results: ServiceCorrelationResult[] = [];
    const avgOrderValue = orders.length > 0
        ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length
        : 0;

    for (const s1 of Object.keys(coOccurrence)) {
        for (const s2 of Object.keys(coOccurrence[s1])) {
            const data = coOccurrence[s1][s2];
            const minOccurrence = Math.min(serviceOrderCount[s1] || 1, serviceOrderCount[s2] || 1);

            // Jaccard-like correlation coefficient
            const correlation = minOccurrence > 0 ? data.count / minOccurrence : 0;

            // Basket lift = avg revenue when together / overall avg revenue
            const avgRevenueWhenTogether = data.count > 0 ? data.totalRevenue / data.count : 0;
            const basketLift = avgOrderValue > 0 ? avgRevenueWhenTogether / avgOrderValue : 1;

            results.push({
                service1: s1,
                service2: s2,
                correlation: Math.round(correlation * 100) / 100,
                coOccurrences: data.count,
                avgBasketLift: Math.round(basketLift * 100) / 100
            });
        }
    }

    return results.sort((a, b) => b.correlation - a.correlation);
}

// ============================================================================
// GST BREAKOUT MODEL
// ============================================================================

export interface GSTBreakout {
    totalAmount: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    isInterstate: boolean;
    gstRate: number;
}

/**
 * Calculate GST Breakout (CGST/SGST/IGST) based on HSN codes and location
 * @param totalAmountIncludingTax - Total amount including tax
 * @param gstRate - GST rate (default 18%)
 * @param isInterstate - If true, charge IGST; otherwise split CGST/SGST
 */
export function calculateGSTBreakout(
    totalAmountIncludingTax: number,
    gstRate: number = 18,
    isInterstate: boolean = false
): GSTBreakout {
    // Calculate taxable amount (reverse calculate from total)
    const taxableAmount = totalAmountIncludingTax / (1 + gstRate / 100);
    const totalTax = totalAmountIncludingTax - taxableAmount;

    if (isInterstate) {
        return {
            totalAmount: Math.round(totalAmountIncludingTax * 100) / 100,
            taxableAmount: Math.round(taxableAmount * 100) / 100,
            cgst: 0,
            sgst: 0,
            igst: Math.round(totalTax * 100) / 100,
            totalTax: Math.round(totalTax * 100) / 100,
            isInterstate: true,
            gstRate
        };
    } else {
        const halfTax = totalTax / 2;
        return {
            totalAmount: Math.round(totalAmountIncludingTax * 100) / 100,
            taxableAmount: Math.round(taxableAmount * 100) / 100,
            cgst: Math.round(halfTax * 100) / 100,
            sgst: Math.round(halfTax * 100) / 100,
            igst: 0,
            totalTax: Math.round(totalTax * 100) / 100,
            isInterstate: false,
            gstRate
        };
    }
}

// ============================================================================
// COHORT RETENTION ANALYSIS
// ============================================================================

/**
 * Perform cohort analysis grouping customers by join month
 */
export function calculateCohortRetention(
    customers: {
        customerId: string;
        firstOrderDate: Date;
        orders: { date: Date; amount: number }[];
    }[]
): CohortRetentionResult[] {
    // Group customers by cohort (month of first order)
    const cohorts: Record<string, {
        customers: typeof customers;
        retentionByMonth: Record<number, { customers: Set<string>; revenue: number }>;
    }> = {};

    for (const customer of customers) {
        const cohortKey = `${customer.firstOrderDate.getFullYear()}-${String(customer.firstOrderDate.getMonth() + 1).padStart(2, '0')}`;

        if (!cohorts[cohortKey]) {
            cohorts[cohortKey] = { customers: [], retentionByMonth: {} };
        }

        cohorts[cohortKey].customers.push(customer);

        // Track which months customer made purchases
        for (const order of customer.orders) {
            const monthDiff = (order.date.getFullYear() - customer.firstOrderDate.getFullYear()) * 12
                + (order.date.getMonth() - customer.firstOrderDate.getMonth());

            if (!cohorts[cohortKey].retentionByMonth[monthDiff]) {
                cohorts[cohortKey].retentionByMonth[monthDiff] = { customers: new Set(), revenue: 0 };
            }

            cohorts[cohortKey].retentionByMonth[monthDiff].customers.add(customer.customerId);
            cohorts[cohortKey].retentionByMonth[monthDiff].revenue += order.amount;
        }
    }

    // Convert to results
    const results: CohortRetentionResult[] = [];

    for (const [cohortMonth, data] of Object.entries(cohorts)) {
        const totalCustomers = data.customers.length;
        const retentionByMonth: CohortRetentionResult['retentionByMonth'] = [];
        let totalRetention = 0;
        let monthCount = 0;

        for (const [monthStr, monthData] of Object.entries(data.retentionByMonth)) {
            const month = parseInt(monthStr);
            const activeCustomers = monthData.customers.size;
            const retentionRate = (activeCustomers / totalCustomers) * 100;

            retentionByMonth.push({
                month,
                activeCustomers,
                retentionRate: Math.round(retentionRate * 100) / 100,
                revenue: Math.round(monthData.revenue * 100) / 100
            });

            if (month > 0) {  // Exclude month 0 (joining month) from average
                totalRetention += retentionRate;
                monthCount++;
            }
        }

        retentionByMonth.sort((a, b) => a.month - b.month);

        results.push({
            cohortMonth,
            totalCustomers,
            retentionByMonth,
            avgRetentionRate: monthCount > 0 ? Math.round((totalRetention / monthCount) * 100) / 100 : 0,
            churnRate: monthCount > 0 ? Math.round((100 - (totalRetention / monthCount)) * 100) / 100 : 0
        });
    }

    return results.sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth));
}

// ============================================================================
// PROJECTED MONTH-END REVENUE
// ============================================================================

/**
 * Calculate projected month-end revenue
 * Uses current daily average multiplied by remaining days, adjusted for MoM growth
 */
export function calculateProjectedMonthEndRevenue(
    currentMonthRevenue: number,
    daysElapsed: number,
    previousMonthRevenue: number
): {
    projected: number;
    dailyAverage: number;
    remainingDays: number;
    momGrowth: number;
    adjustedProjection: number;
} {
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - daysElapsed;

    const dailyAverage = daysElapsed > 0 ? currentMonthRevenue / daysElapsed : 0;
    const projected = currentMonthRevenue + (dailyAverage * remainingDays);

    // Calculate MoM growth
    const previousDailyAvg = previousMonthRevenue / new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    const momGrowth = previousDailyAvg > 0 ? ((dailyAverage / previousDailyAvg) - 1) * 100 : 0;

    // Adjust projection with growth momentum
    const growthMultiplier = 1 + (momGrowth / 100) * 0.5; // Apply 50% of growth trend
    const adjustedProjection = currentMonthRevenue + (dailyAverage * remainingDays * growthMultiplier);

    return {
        projected: Math.round(projected * 100) / 100,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        remainingDays,
        momGrowth: Math.round(momGrowth * 100) / 100,
        adjustedProjection: Math.round(adjustedProjection * 100) / 100
    };
}

// ============================================================================
// TURNAROUND VARIANCE
// ============================================================================

/**
 * Calculate turnaround variance using standard deviation
 * Shows how consistently orders meet their due dates
 */
export function calculateTurnaroundVariance(
    orders: {
        expectedHours: number;
        actualHours: number;
    }[]
): {
    avgTurnaround: number;
    stdDevHours: number;
    consistencyScore: number;  // 0-100, higher is better
    percentWithinTarget: number;  // Within ±2 hours
    message: string;
} {
    if (orders.length === 0) {
        return {
            avgTurnaround: 0,
            stdDevHours: 0,
            consistencyScore: 100,
            percentWithinTarget: 100,
            message: 'No orders to analyze'
        };
    }

    const deviations = orders.map(o => o.actualHours - o.expectedHours);
    const actualHours = orders.map(o => o.actualHours);

    const avgTurnaround = mean(actualHours);
    const stdDevHours = standardDeviation(deviations);

    // Count orders within ±2 hours of expected
    const withinTarget = deviations.filter(d => Math.abs(d) <= 2).length;
    const percentWithinTarget = (withinTarget / orders.length) * 100;

    // Consistency score: inverse of normalized std dev
    const maxAcceptableStdDev = 4; // 4 hours is the threshold for poor consistency
    const normalizedStdDev = Math.min(stdDevHours / maxAcceptableStdDev, 1);
    const consistencyScore = (1 - normalizedStdDev) * 100;

    return {
        avgTurnaround: Math.round(avgTurnaround * 100) / 100,
        stdDevHours: Math.round(stdDevHours * 100) / 100,
        consistencyScore: Math.round(consistencyScore),
        percentWithinTarget: Math.round(percentWithinTarget),
        message: `${Math.round(percentWithinTarget)}% of orders ready within ±2 hours of target`
    };
}

// ============================================================================
// EXPORT BUNDLED ENGINE
// ============================================================================

export const biMathEngine = {
    // Core Statistics
    mean,
    median,
    mode,
    variance,
    standardDeviation,
    percentile,
    zScore,
    zScoreToPercentile,

    // Regression & Forecasting
    linearRegression,
    forecastRevenue,
    calculateProjectedMonthEndRevenue,

    // Customer Analytics
    calculateCLV,
    calculateCustomerCLVs,
    calculateCohortRetention,

    // Operations
    calculateLittlesLaw,
    calculateTurnaroundVariance,

    // Staff Analytics
    calculateStaffEfficiency,
    getServiceComplexityWeight,
    SERVICE_COMPLEXITY_WEIGHTS,

    // Service Analytics
    calculateServiceContribution,
    calculateServiceCorrelation,

    // Time Series
    simpleMovingAverage,
    exponentialMovingAverage,
    calculateRevenueVelocity,

    // Anomaly Detection
    detectAnomalies,

    // Demand Analysis
    generatePeakDemandHeatmap,

    // Tax
    calculateGSTBreakout,
};

export default biMathEngine;
