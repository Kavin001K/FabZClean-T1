/**
 * Statistical Utilities Library for FabzClean Analytics
 *
 * This comprehensive library provides statistical functions for:
 * - Basic Statistics (mean, median, mode, std deviation)
 * - Growth & Trend Analysis (growth rates, CAGR, moving averages)
 * - Forecasting (linear regression, time series prediction)
 * - Distribution Analysis (percentiles, z-scores, confidence intervals)
 * - Time Series Analysis (trend detection, anomaly detection)
 * - Business Metrics (CLV, churn rate, conversion rate)
 *
 * All functions are fully typed with TypeScript for type safety.
 *
 * @module statistics
 */

// ============================================================================
// BASIC STATISTICS
// ============================================================================

/**
 * Calculate the arithmetic mean (average) of a dataset
 * Formula: μ = (Σx) / n
 *
 * @param data - Array of numbers
 * @returns The mean value
 *
 * @example
 * mean([1, 2, 3, 4, 5]) // Returns 3
 */
export function mean(data: number[]): number {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, val) => acc + val, 0);
  return sum / data.length;
}

/**
 * Calculate the median (middle value) of a dataset
 * Formula: Middle value when sorted, or average of two middle values
 *
 * @param data - Array of numbers
 * @returns The median value
 *
 * @example
 * median([1, 2, 3, 4, 5]) // Returns 3
 * median([1, 2, 3, 4]) // Returns 2.5
 */
export function median(data: number[]): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate the mode (most frequent values) of a dataset
 *
 * @param data - Array of numbers
 * @returns Array of mode values (can be multiple modes)
 *
 * @example
 * mode([1, 2, 2, 3, 3, 3, 4]) // Returns [3]
 * mode([1, 1, 2, 2, 3]) // Returns [1, 2] (bimodal)
 */
export function mode(data: number[]): number[] {
  if (data.length === 0) return [];

  const frequency = new Map<number, number>();
  let maxFreq = 0;

  // Count frequencies
  for (const value of data) {
    const freq = (frequency.get(value) || 0) + 1;
    frequency.set(value, freq);
    maxFreq = Math.max(maxFreq, freq);
  }

  // Find all values with max frequency
  const modes: number[] = [];
  frequency.forEach((freq, value) => {
    if (freq === maxFreq) {
      modes.push(value);
    }
  });

  return modes;
}

/**
 * Calculate the variance of a dataset
 * Formula: σ² = Σ((x - μ)²) / n
 *
 * @param data - Array of numbers
 * @param sample - If true, uses sample variance (n-1), otherwise population variance (n)
 * @returns The variance
 *
 * @example
 * variance([1, 2, 3, 4, 5]) // Returns 2
 */
export function variance(data: number[], sample: boolean = false): number {
  if (data.length === 0) return 0;
  if (sample && data.length === 1) return 0;

  const avg = mean(data);
  const squaredDiffs = data.map(x => Math.pow(x - avg, 2));
  const divisor = sample ? data.length - 1 : data.length;

  return squaredDiffs.reduce((acc, val) => acc + val, 0) / divisor;
}

/**
 * Calculate the standard deviation of a dataset
 * Formula: σ = √(Σ((x - μ)²) / n)
 *
 * @param data - Array of numbers
 * @param sample - If true, uses sample std dev (n-1), otherwise population (n)
 * @returns The standard deviation
 *
 * @example
 * standardDeviation([1, 2, 3, 4, 5]) // Returns ~1.414
 */
export function standardDeviation(data: number[], sample: boolean = false): number {
  return Math.sqrt(variance(data, sample));
}

/**
 * Calculate the range statistics of a dataset
 *
 * @param data - Array of numbers
 * @returns Object with min, max, and range values
 *
 * @example
 * range([1, 5, 3, 9, 2]) // Returns { min: 1, max: 9, range: 8 }
 */
export function range(data: number[]): { min: number; max: number; range: number } {
  if (data.length === 0) {
    return { min: 0, max: 0, range: 0 };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);

  return {
    min,
    max,
    range: max - min,
  };
}

/**
 * Calculate quartiles and interquartile range (IQR)
 *
 * @param data - Array of numbers
 * @returns Object with Q1, Q2 (median), Q3, and IQR
 *
 * @example
 * quartiles([1, 2, 3, 4, 5, 6, 7, 8, 9]) // Returns { q1: 2.5, q2: 5, q3: 7.5, iqr: 5 }
 */
export function quartiles(data: number[]): { q1: number; q2: number; q3: number; iqr: number } {
  if (data.length === 0) {
    return { q1: 0, q2: 0, q3: 0, iqr: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const q2 = median(sorted);

  const lowerHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const upperHalf = sorted.slice(Math.ceil(sorted.length / 2));

  const q1 = median(lowerHalf);
  const q3 = median(upperHalf);
  const iqr = q3 - q1;

  return { q1, q2, q3, iqr };
}

// ============================================================================
// GROWTH & TREND ANALYSIS
// ============================================================================

/**
 * Calculate percentage growth rate
 * Formula: ((current - previous) / previous) × 100
 *
 * @param current - Current value
 * @param previous - Previous value
 * @returns Growth rate as a percentage
 *
 * @example
 * calculateGrowthRate(120, 100) // Returns 20 (20% growth)
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 * Formula: CAGR = ((End Value / Start Value)^(1/n) - 1) × 100
 *
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param periods - Number of periods
 * @returns CAGR as a percentage
 *
 * @example
 * calculateCAGR(1000, 1500, 3) // Returns ~14.47% annual growth
 */
export function calculateCAGR(startValue: number, endValue: number, periods: number): number {
  if (startValue <= 0 || periods <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
}

/**
 * Calculate Simple Moving Average (SMA)
 *
 * @param data - Array of numbers
 * @param window - Window size for the moving average
 * @returns Array of moving average values
 *
 * @example
 * movingAverage([1, 2, 3, 4, 5], 3) // Returns [NaN, NaN, 2, 3, 4]
 */
export function movingAverage(data: number[], window: number): number[] {
  if (window <= 0 || window > data.length) return data.map(() => NaN);

  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
    } else {
      const slice = data.slice(i - window + 1, i + 1);
      result.push(mean(slice));
    }
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * Formula: EMA_t = α × Value_t + (1 - α) × EMA_(t-1)
 *
 * @param data - Array of numbers
 * @param alpha - Smoothing factor (0 < α < 1), typically 2/(window+1)
 * @returns Array of EMA values
 *
 * @example
 * exponentialMovingAverage([1, 2, 3, 4, 5], 0.5) // Returns smoothed values
 */
export function exponentialMovingAverage(data: number[], alpha: number): number[] {
  if (data.length === 0) return [];
  if (alpha <= 0 || alpha > 1) alpha = 0.5;

  const result: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const ema = alpha * data[i] + (1 - alpha) * result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Calculate linear regression for trend analysis
 * Formula: y = mx + b
 * Where: m = Σ((x-x̄)(y-ȳ)) / Σ((x-x̄)²)
 *        b = ȳ - m×x̄
 *        R² = 1 - (SS_res / SS_tot)
 *
 * @param data - Array of {x, y} coordinate objects
 * @returns Object with slope, intercept, and R² value
 *
 * @example
 * linearRegression([{x:1,y:2}, {x:2,y:4}, {x:3,y:5}]) // Returns regression parameters
 */
export function linearRegression(
  data: { x: number; y: number }[]
): { slope: number; intercept: number; r2: number } {
  if (data.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  const n = data.length;
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);

  const xMean = mean(xValues);
  const yMean = mean(yValues);

  // Calculate slope (m)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = data[i].x - xMean;
    const yDiff = data[i].y - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R² (coefficient of determination)
  let ssRes = 0; // Residual sum of squares
  let ssTot = 0; // Total sum of squares

  for (let i = 0; i < n; i++) {
    const predicted = slope * data[i].x + intercept;
    ssRes += Math.pow(data[i].y - predicted, 2);
    ssTot += Math.pow(data[i].y - yMean, 2);
  }

  const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  return { slope, intercept, r2 };
}

// ============================================================================
// FORECASTING
// ============================================================================

/**
 * Simple linear forecasting using linear regression
 *
 * @param historicalData - Array of historical values
 * @param periods - Number of periods to forecast
 * @returns Array of forecasted values
 *
 * @example
 * forecastLinear([10, 12, 15, 18], 3) // Forecasts next 3 values
 */
export function forecastLinear(historicalData: number[], periods: number): number[] {
  if (historicalData.length < 2) return [];

  // Convert to {x, y} format
  const data = historicalData.map((y, x) => ({ x, y }));
  const { slope, intercept } = linearRegression(data);

  const forecast: number[] = [];
  const startX = historicalData.length;

  for (let i = 0; i < periods; i++) {
    const x = startX + i;
    const y = slope * x + intercept;
    forecast.push(Math.max(0, y)); // Ensure non-negative forecasts
  }

  return forecast;
}

/**
 * Moving average based forecasting
 *
 * @param data - Historical data array
 * @param window - Window size for moving average
 * @param periods - Number of periods to forecast
 * @returns Array of forecasted values
 *
 * @example
 * forecastMovingAverage([10, 12, 15, 18, 20], 3, 2) // Forecasts 2 periods
 */
export function forecastMovingAverage(data: number[], window: number, periods: number): number[] {
  if (data.length < window) return [];

  const forecast: number[] = [];
  let currentData = [...data];

  for (let i = 0; i < periods; i++) {
    const lastWindow = currentData.slice(-window);
    const nextValue = mean(lastWindow);
    forecast.push(nextValue);
    currentData.push(nextValue);
  }

  return forecast;
}

/**
 * Seasonal decomposition for time series
 * Separates trend, seasonal, and residual components
 *
 * @param data - Time series data
 * @param period - Seasonal period (e.g., 12 for monthly data with yearly seasonality)
 * @returns Object with trend, seasonal, and residual components
 */
export function seasonalDecomposition(
  data: number[],
  period: number
): { trend: number[]; seasonal: number[]; residual: number[] } {
  if (data.length < period * 2) {
    return {
      trend: data,
      seasonal: data.map(() => 0),
      residual: data.map(() => 0),
    };
  }

  // Calculate trend using centered moving average
  const trend = movingAverage(data, period);

  // Calculate detrended data
  const detrended = data.map((val, i) =>
    !isNaN(trend[i]) ? val - trend[i] : 0
  );

  // Calculate seasonal component
  const seasonal: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const seasonIndex = i % period;
    const seasonValues = detrended.filter((_, idx) => idx % period === seasonIndex);
    seasonal.push(mean(seasonValues));
  }

  // Calculate residual
  const residual = data.map((val, i) =>
    val - (trend[i] || 0) - (seasonal[i] || 0)
  );

  return { trend, seasonal, residual };
}

// ============================================================================
// DISTRIBUTION ANALYSIS
// ============================================================================

/**
 * Calculate a specific percentile of a dataset
 *
 * @param data - Array of numbers
 * @param p - Percentile (0-100)
 * @returns The value at the given percentile
 *
 * @example
 * percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 75) // Returns 7.75
 */
export function percentile(data: number[], p: number): number {
  if (data.length === 0) return 0;
  if (p < 0 || p > 100) return 0;

  const sorted = [...data].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate z-score (standard score)
 * Formula: z = (x - μ) / σ
 *
 * @param value - The value to calculate z-score for
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation of the distribution
 * @returns The z-score
 *
 * @example
 * zScore(75, 70, 5) // Returns 1.0
 */
export function zScore(value: number, meanVal: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - meanVal) / stdDev;
}

/**
 * Calculate normal distribution probability density
 * Formula: f(x) = (1 / (σ√(2π))) × e^(-((x-μ)²/(2σ²)))
 *
 * @param value - The value
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation
 * @returns Probability density at the value
 */
export function normalDistribution(value: number, meanVal: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  const z = zScore(value, meanVal, stdDev);
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = Math.exp(-(z * z) / 2);
  return coefficient * exponent;
}

/**
 * Calculate confidence interval for a dataset
 *
 * @param data - Array of numbers
 * @param confidence - Confidence level (e.g., 0.95 for 95%)
 * @returns Object with lower and upper bounds
 *
 * @example
 * confidenceInterval([10, 12, 14, 16, 18], 0.95) // Returns 95% CI
 */
export function confidenceInterval(
  data: number[],
  confidence: number
): { lower: number; upper: number; margin: number } {
  if (data.length === 0) {
    return { lower: 0, upper: 0, margin: 0 };
  }

  const meanVal = mean(data);
  const stdDev = standardDeviation(data, true);
  const n = data.length;

  // Use t-distribution critical value (approximation for z-score)
  // For 95% confidence: z ≈ 1.96
  // For 99% confidence: z ≈ 2.576
  const zCritical = confidence === 0.99 ? 2.576 : confidence === 0.95 ? 1.96 : 1.645;

  const standardError = stdDev / Math.sqrt(n);
  const margin = zCritical * standardError;

  return {
    lower: meanVal - margin,
    upper: meanVal + margin,
    margin,
  };
}

// ============================================================================
// TIME SERIES ANALYSIS
// ============================================================================

/**
 * Determine the overall trend direction
 *
 * @param timeSeries - Array of time series data points
 * @returns 'increasing', 'decreasing', or 'stable'
 *
 * @example
 * calculateTrend([{date: new Date(), value: 10}, ...]) // Returns 'increasing'
 */
export function calculateTrend(
  timeSeries: { date: Date; value: number }[]
): 'increasing' | 'decreasing' | 'stable' {
  if (timeSeries.length < 2) return 'stable';

  const data = timeSeries.map((d, i) => ({ x: i, y: d.value }));
  const { slope, r2 } = linearRegression(data);

  // If R² is very low, trend is not reliable
  if (r2 < 0.3) return 'stable';

  // Threshold for considering trend significant
  const threshold = 0.01;

  if (slope > threshold) return 'increasing';
  if (slope < -threshold) return 'decreasing';
  return 'stable';
}

/**
 * Detect anomalies using z-score method
 *
 * @param data - Array of numbers
 * @param threshold - Z-score threshold (typically 2 or 3)
 * @returns Array of indices where anomalies occur
 *
 * @example
 * detectAnomalies([10, 12, 11, 50, 13], 2) // Returns [3] (outlier at index 3)
 */
export function detectAnomalies(data: number[], threshold: number = 3): number[] {
  if (data.length < 3) return [];

  const meanVal = mean(data);
  const stdDev = standardDeviation(data);

  const anomalies: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const z = Math.abs(zScore(data[i], meanVal, stdDev));
    if (z > threshold) {
      anomalies.push(i);
    }
  }

  return anomalies;
}

/**
 * Calculate year-over-year growth rates
 *
 * @param currentPeriod - Current period data
 * @param previousPeriod - Previous period data
 * @returns Array of YoY growth percentages
 *
 * @example
 * yearOverYearGrowth([120, 130], [100, 110]) // Returns [20, 18.18]
 */
export function yearOverYearGrowth(currentPeriod: number[], previousPeriod: number[]): number[] {
  const minLength = Math.min(currentPeriod.length, previousPeriod.length);
  const growth: number[] = [];

  for (let i = 0; i < minLength; i++) {
    growth.push(calculateGrowthRate(currentPeriod[i], previousPeriod[i]));
  }

  return growth;
}

/**
 * Calculate month-over-month growth rates
 *
 * @param data - Time series data with dates and values
 * @returns Array of MoM growth percentages
 *
 * @example
 * monthOverMonthGrowth([{date: ..., value: 100}, {date: ..., value: 120}]) // Returns [20]
 */
export function monthOverMonthGrowth(data: { date: Date; value: number }[]): number[] {
  if (data.length < 2) return [];

  const growth: number[] = [];

  for (let i = 1; i < data.length; i++) {
    growth.push(calculateGrowthRate(data[i].value, data[i - 1].value));
  }

  return growth;
}

// ============================================================================
// BUSINESS METRICS
// ============================================================================

/**
 * Calculate Customer Lifetime Value (CLV)
 * Formula: CLV = Avg Order Value × Purchase Frequency × Customer Lifespan
 *
 * @param avgOrderValue - Average value per order
 * @param purchaseFrequency - Number of purchases per period
 * @param customerLifespan - Average customer lifespan in periods
 * @returns Customer lifetime value
 *
 * @example
 * customerLifetimeValue(100, 4, 3) // Returns 1200 (₹1200 CLV)
 */
export function customerLifetimeValue(
  avgOrderValue: number,
  purchaseFrequency: number,
  customerLifespan: number
): number {
  return avgOrderValue * purchaseFrequency * customerLifespan;
}

/**
 * Calculate customer churn rate
 * Formula: Churn Rate = (Customers Lost / Total Customers) × 100
 *
 * @param customersLost - Number of customers lost in period
 * @param totalCustomers - Total customers at start of period
 * @returns Churn rate as percentage
 *
 * @example
 * churnRate(10, 100) // Returns 10%
 */
export function churnRate(customersLost: number, totalCustomers: number): number {
  if (totalCustomers === 0) return 0;
  return (customersLost / totalCustomers) * 100;
}

/**
 * Calculate customer retention rate
 * Formula: Retention Rate = (Customers Retained / Total Customers) × 100
 *
 * @param customersRetained - Number of customers retained
 * @param totalCustomers - Total customers at start of period
 * @returns Retention rate as percentage
 *
 * @example
 * retentionRate(90, 100) // Returns 90%
 */
export function retentionRate(customersRetained: number, totalCustomers: number): number {
  if (totalCustomers === 0) return 0;
  return (customersRetained / totalCustomers) * 100;
}

/**
 * Calculate conversion rate
 * Formula: Conversion Rate = (Conversions / Total Visitors) × 100
 *
 * @param conversions - Number of conversions
 * @param totalVisitors - Total number of visitors
 * @returns Conversion rate as percentage
 *
 * @example
 * conversionRate(25, 1000) // Returns 2.5%
 */
export function conversionRate(conversions: number, totalVisitors: number): number {
  if (totalVisitors === 0) return 0;
  return (conversions / totalVisitors) * 100;
}

/**
 * Calculate revenue per customer
 * Formula: Revenue per Customer = Total Revenue / Total Customers
 *
 * @param totalRevenue - Total revenue
 * @param totalCustomers - Total number of customers
 * @returns Revenue per customer
 *
 * @example
 * revenuePerCustomer(50000, 200) // Returns 250
 */
export function revenuePerCustomer(totalRevenue: number, totalCustomers: number): number {
  if (totalCustomers === 0) return 0;
  return totalRevenue / totalCustomers;
}

/**
 * Calculate average order value
 * Formula: AOV = Total Revenue / Total Orders
 *
 * @param totalRevenue - Total revenue
 * @param totalOrders - Total number of orders
 * @returns Average order value
 *
 * @example
 * averageOrderValue(10000, 50) // Returns 200
 */
export function averageOrderValue(totalRevenue: number, totalOrders: number): number {
  if (totalOrders === 0) return 0;
  return totalRevenue / totalOrders;
}

/**
 * Calculate order completion rate
 * Formula: Completion Rate = (Completed Orders / Total Orders) × 100
 *
 * @param completedOrders - Number of completed orders
 * @param totalOrders - Total number of orders
 * @returns Completion rate as percentage
 *
 * @example
 * orderCompletionRate(85, 100) // Returns 85%
 */
export function orderCompletionRate(completedOrders: number, totalOrders: number): number {
  if (totalOrders === 0) return 0;
  return (completedOrders / totalOrders) * 100;
}

// ============================================================================
// HELPER FUNCTIONS & UTILITIES
// ============================================================================

/**
 * Format a trend indicator as arrow with color
 *
 * @param value - The value to check (positive = up, negative = down)
 * @returns Object with arrow symbol and color
 */
export function getTrendIndicator(value: number): { arrow: string; color: string; direction: string } {
  if (value > 0) {
    return { arrow: '↑', color: 'text-green-600', direction: 'up' };
  } else if (value < 0) {
    return { arrow: '↓', color: 'text-red-600', direction: 'down' };
  } else {
    return { arrow: '→', color: 'text-gray-600', direction: 'stable' };
  }
}

/**
 * Calculate statistical significance (p-value approximation)
 * Uses a simplified t-test approach
 *
 * @param data1 - First dataset
 * @param data2 - Second dataset
 * @returns Object with t-statistic and approximate p-value
 */
export function statisticalSignificance(
  data1: number[],
  data2: number[]
): { tStatistic: number; significant: boolean; confidence: string } {
  if (data1.length < 2 || data2.length < 2) {
    return { tStatistic: 0, significant: false, confidence: 'insufficient data' };
  }

  const mean1 = mean(data1);
  const mean2 = mean(data2);
  const std1 = standardDeviation(data1, true);
  const std2 = standardDeviation(data2, true);
  const n1 = data1.length;
  const n2 = data2.length;

  // Calculate pooled standard error
  const se = Math.sqrt((std1 * std1) / n1 + (std2 * std2) / n2);

  // Calculate t-statistic
  const tStatistic = se !== 0 ? (mean1 - mean2) / se : 0;

  // Approximate significance (|t| > 2 is roughly p < 0.05)
  const significant = Math.abs(tStatistic) > 2;

  let confidence = 'not significant';
  if (Math.abs(tStatistic) > 2.576) confidence = 'p < 0.01 (99% confidence)';
  else if (Math.abs(tStatistic) > 1.96) confidence = 'p < 0.05 (95% confidence)';
  else if (Math.abs(tStatistic) > 1.645) confidence = 'p < 0.10 (90% confidence)';

  return { tStatistic, significant, confidence };
}

/**
 * Calculate correlation coefficient (Pearson's r)
 * Formula: r = Σ((x-x̄)(y-ȳ)) / √(Σ(x-x̄)² × Σ(y-ȳ)²)
 *
 * @param x - First dataset
 * @param y - Second dataset
 * @returns Correlation coefficient (-1 to 1)
 *
 * @example
 * correlation([1,2,3,4,5], [2,4,6,8,10]) // Returns 1.0 (perfect positive correlation)
 */
export function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const xMean = mean(x);
  const yMean = mean(y);

  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (let i = 0; i < x.length; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xDenominator * yDenominator);
  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Get comprehensive summary statistics for a dataset
 *
 * @param data - Array of numbers
 * @returns Object with all major statistical measures
 */
export function summaryStatistics(data: number[]): {
  count: number;
  mean: number;
  median: number;
  mode: number[];
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
} {
  const q = quartiles(data);
  const r = range(data);

  return {
    count: data.length,
    mean: mean(data),
    median: median(data),
    mode: mode(data),
    stdDev: standardDeviation(data),
    variance: variance(data),
    min: r.min,
    max: r.max,
    range: r.range,
    q1: q.q1,
    q3: q.q3,
    iqr: q.iqr,
  };
}
