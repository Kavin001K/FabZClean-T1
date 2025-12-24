/**
 * Advanced Analytics Engine with Statistical Algorithms
 *
 * This module provides comprehensive business analytics including:
 * - Statistical analysis (mean, median, mode, std deviation, variance)
 * - Time series analysis and forecasting
 * - Customer segmentation and RFM analysis
 * - Revenue forecasting with linear regression
 * - Cohort analysis and retention metrics
 * - ABC analysis for inventory/customer classification
 * - Trend detection and seasonality analysis
 */

import { db as storage } from './db';

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Calculate mean (average) of an array
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate median (middle value) of an array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate mode (most frequent value) of an array
 */
export function calculateMode(values: number[]): number {
  if (values.length === 0) return 0;
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = values[0];

  for (const value of values) {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value];
      mode = value;
    }
  }

  return mode;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
}

/**
 * Calculate variance
 */
export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  return calculateMean(squaredDiffs);
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate correlation coefficient between two arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  if (denomX === 0 || denomY === 0) return 0;
  return numerator / Math.sqrt(denomX * denomY);
}

// ============================================================================
// LINEAR REGRESSION FOR FORECASTING
// ============================================================================

interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  predict: (x: number) => number;
}

/**
 * Perform linear regression analysis
 */
export function linearRegression(x: number[], y: number[]): LinearRegressionResult {
  if (x.length !== y.length || x.length === 0) {
    return { slope: 0, intercept: 0, r2: 0, predict: () => 0 };
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const meanY = calculateMean(y);
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = 1 - (ssResidual / ssTotal);

  return {
    slope,
    intercept,
    r2,
    predict: (xValue: number) => slope * xValue + intercept,
  };
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(values: number[], window: number): number[] {
  if (values.length < window) return values;

  const result: number[] = [];
  for (let i = 0; i <= values.length - window; i++) {
    const windowValues = values.slice(i, i + window);
    result.push(calculateMean(windowValues));
  }
  return result;
}

/**
 * Calculate exponential moving average (EMA)
 */
export function calculateEMA(values: number[], smoothing: number = 2): number[] {
  if (values.length === 0) return [];

  const result: number[] = [values[0]];
  const multiplier = smoothing / (values.length + 1);

  for (let i = 1; i < values.length; i++) {
    const ema = (values[i] - result[i - 1]) * multiplier + result[i - 1];
    result.push(ema);
  }

  return result;
}

// ============================================================================
// RFM ANALYSIS (Recency, Frequency, Monetary)
// ============================================================================

export interface RFMScore {
  customerId: string;
  customerName: string;
  recency: number;
  frequency: number;
  monetary: number;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmScore: string;
  segment: string;
}

/**
 * Perform RFM analysis on customers
 */
export async function performRFMAnalysis(): Promise<RFMScore[]> {
  const customers = await storage.listCustomers();
  const orders = await storage.listOrders();

  const now = new Date();
  const rfmData: RFMScore[] = [];

  for (const customer of customers) {
    const customerOrders = orders.filter((o: any) => o.customerId === customer.id);

    if (customerOrders.length === 0) continue;

    // Recency: Days since last order
    const lastOrderDate = new Date(Math.max(...customerOrders.map((o: any) => new Date(o.createdAt).getTime())));
    const recency = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

    // Frequency: Number of orders
    const frequency = customerOrders.length;

    // Monetary: Total spent
    const monetary = customerOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || '0'), 0);

    rfmData.push({
      customerId: customer.id,
      customerName: customer.name,
      recency,
      frequency,
      monetary,
      recencyScore: 0,
      frequencyScore: 0,
      monetaryScore: 0,
      rfmScore: '',
      segment: '',
    });
  }

  // Calculate scores (1-5 scale)
  const recencyValues = rfmData.map(d => d.recency);
  const frequencyValues = rfmData.map(d => d.frequency);
  const monetaryValues = rfmData.map(d => d.monetary);

  for (const data of rfmData) {
    // Recency: Lower is better (5 = most recent)
    data.recencyScore = scoreValue(data.recency, recencyValues, true);
    // Frequency: Higher is better
    data.frequencyScore = scoreValue(data.frequency, frequencyValues, false);
    // Monetary: Higher is better
    data.monetaryScore = scoreValue(data.monetary, monetaryValues, false);

    data.rfmScore = `${data.recencyScore}${data.frequencyScore}${data.monetaryScore}`;
    data.segment = segmentCustomer(data.recencyScore, data.frequencyScore, data.monetaryScore);
  }

  return rfmData.sort((a, b) => {
    const aScore = a.recencyScore * 100 + a.frequencyScore * 10 + a.monetaryScore;
    const bScore = b.recencyScore * 100 + b.frequencyScore * 10 + b.monetaryScore;
    return bScore - aScore;
  });
}

function scoreValue(value: number, allValues: number[], inverse: boolean): number {
  const sorted = [...allValues].sort((a, b) => inverse ? b - a : a - b);
  const quintiles = [
    sorted[0],
    calculatePercentile(sorted, 20),
    calculatePercentile(sorted, 40),
    calculatePercentile(sorted, 60),
    calculatePercentile(sorted, 80),
    sorted[sorted.length - 1],
  ];

  for (let i = 5; i >= 1; i--) {
    if (value >= quintiles[i - 1]) return i;
  }
  return 1;
}

function segmentCustomer(r: number, f: number, m: number): string {
  const total = r + f + m;

  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 4 && f >= 3 && m >= 3) return 'Loyal Customers';
  if (r >= 4 && f <= 2) return 'New Customers';
  if (r >= 3 && f >= 3 && m >= 3) return 'Potential Loyalists';
  if (r >= 3 && f <= 2 && m >= 3) return 'Promising';
  if (r <= 2 && f >= 3 && m >= 3) return 'At Risk';
  if (r <= 2 && f >= 4 && m >= 4) return 'Cant Lose Them';
  if (r <= 2 && f <= 2) return 'Lost';
  return 'Needs Attention';
}

// ============================================================================
// COHORT ANALYSIS
// ============================================================================

export interface CohortData {
  cohort: string;
  totalCustomers: number;
  periods: { [period: string]: { customers: number; retention: number } };
}

/**
 * Perform cohort analysis
 */
export async function performCohortAnalysis(): Promise<CohortData[]> {
  const orders = await storage.listOrders();
  const customers = await storage.listCustomers();

  // Group customers by first order month
  const cohorts: { [cohort: string]: { customerIds: Set<string>; ordersByPeriod: { [period: string]: Set<string> } } } = {};

  for (const customer of customers) {
    const customerOrders = orders.filter((o: any) => o.customerId === customer.id).sort((a: any, b: any) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (customerOrders.length === 0) continue;

    const firstOrderDate = new Date(customerOrders[0].createdAt);
    const cohortKey = `${firstOrderDate.getFullYear()}-${String(firstOrderDate.getMonth() + 1).padStart(2, '0')}`;

    if (!cohorts[cohortKey]) {
      cohorts[cohortKey] = {
        customerIds: new Set(),
        ordersByPeriod: {},
      };
    }

    cohorts[cohortKey].customerIds.add(customer.id);

    // Track orders by period
    for (const order of customerOrders) {
      const orderDate = new Date(order.createdAt);
      const monthsFromFirst = (orderDate.getFullYear() - firstOrderDate.getFullYear()) * 12 +
        (orderDate.getMonth() - firstOrderDate.getMonth());
      const periodKey = `Month ${monthsFromFirst}`;

      if (!cohorts[cohortKey].ordersByPeriod[periodKey]) {
        cohorts[cohortKey].ordersByPeriod[periodKey] = new Set();
      }
      cohorts[cohortKey].ordersByPeriod[periodKey].add(customer.id);
    }
  }

  // Convert to result format
  const result: CohortData[] = [];
  for (const [cohort, data] of Object.entries(cohorts)) {
    const totalCustomers = data.customerIds.size;
    const periods: { [period: string]: { customers: number; retention: number } } = {};

    for (const [period, customerSet] of Object.entries(data.ordersByPeriod)) {
      const customers = customerSet.size;
      const retention = (customers / totalCustomers) * 100;
      periods[period] = { customers, retention };
    }

    result.push({ cohort, totalCustomers, periods });
  }

  return result.sort((a, b) => a.cohort.localeCompare(b.cohort));
}

// ============================================================================
// ABC ANALYSIS
// ============================================================================

export interface ABCClassification {
  id: string;
  name: string;
  value: number;
  percentage: number;
  cumulativePercentage: number;
  class: 'A' | 'B' | 'C';
}

/**
 * Perform ABC analysis (Pareto analysis)
 * A items: Top 20% contributing 80% of value
 * B items: Next 30% contributing 15% of value
 * C items: Bottom 50% contributing 5% of value
 */
export function performABCAnalysis(items: { id: string; name: string; value: number }[]): ABCClassification[] {
  // Sort by value descending
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const totalValue = sorted.reduce((sum, item) => sum + item.value, 0);

  let cumulativeValue = 0;
  const result: ABCClassification[] = [];

  for (const item of sorted) {
    const percentage = (item.value / totalValue) * 100;
    cumulativeValue += item.value;
    const cumulativePercentage = (cumulativeValue / totalValue) * 100;

    let itemClass: 'A' | 'B' | 'C';
    if (cumulativePercentage <= 80) {
      itemClass = 'A';
    } else if (cumulativePercentage <= 95) {
      itemClass = 'B';
    } else {
      itemClass = 'C';
    }

    result.push({
      id: item.id,
      name: item.name,
      value: item.value,
      percentage,
      cumulativePercentage,
      class: itemClass,
    });
  }

  return result;
}

// ============================================================================
// REVENUE FORECASTING
// ============================================================================

export interface RevenueForecast {
  date: string;
  predicted: number;
  confidence: { lower: number; upper: number };
}

/**
 * Forecast revenue using linear regression and moving averages
 */
export async function forecastRevenue(days: number = 30): Promise<RevenueForecast[]> {
  const orders = await storage.listOrders();

  // Group orders by date
  const revenueByDate: { [date: string]: number } = {};
  for (const order of orders) {
    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + parseFloat(order.totalAmount || '0');
  }

  // Convert to arrays for analysis
  const dates = Object.keys(revenueByDate).sort();
  const revenues = dates.map(date => revenueByDate[date]);

  if (dates.length < 7) {
    return []; // Not enough data for forecasting
  }

  // Calculate moving average for baseline
  const ma7 = calculateMovingAverage(revenues, 7);
  const trend = linearRegression(
    Array.from({ length: revenues.length }, (_, i) => i),
    revenues
  );

  // Generate forecasts
  const forecasts: RevenueForecast[] = [];
  const lastDate = new Date(dates[dates.length - 1]);
  const stdDev = calculateStdDev(revenues);

  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    const predicted = trend.predict(revenues.length + i - 1);
    const confidenceInterval = 1.96 * stdDev; // 95% confidence

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted: Math.max(0, predicted),
      confidence: {
        lower: Math.max(0, predicted - confidenceInterval),
        upper: predicted + confidenceInterval,
      },
    });
  }

  return forecasts;
}

// ============================================================================
// COMPREHENSIVE BUSINESS ANALYTICS
// ============================================================================

export interface BusinessAnalytics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    growthRate: number;
  };
  statistics: {
    mean: number;
    median: number;
    mode: number;
    stdDev: number;
    variance: number;
  };
  trends: {
    daily: { date: string; revenue: number; orders: number }[];
    weekly: { week: string; revenue: number; orders: number }[];
    monthly: { month: string; revenue: number; orders: number }[];
  };
  topPerformers: {
    customers: { id: string; name: string; totalSpent: number }[];
    services: { name: string; revenue: number; orders: number }[];
  };
  forecasting: {
    nextWeek: number;
    nextMonth: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

/**
 * Generate comprehensive business analytics
 */
export async function generateBusinessAnalytics(): Promise<BusinessAnalytics> {
  const orders = await storage.listOrders();
  const customers = await storage.listCustomers();
  const services = await storage.listServices();

  // Overview metrics
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || '0'), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = customers.length;

  // Calculate growth rate (last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentRevenue = orders
    .filter((o: any) => new Date(o.createdAt) >= thirtyDaysAgo)
    .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || '0'), 0);

  const previousRevenue = orders
    .filter((o: any) => new Date(o.createdAt) >= sixtyDaysAgo && new Date(o.createdAt) < thirtyDaysAgo)
    .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || '0'), 0);

  const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Statistical analysis
  const orderValues = orders.map((o: any) => parseFloat(o.totalAmount || '0'));
  const statistics = {
    mean: calculateMean(orderValues),
    median: calculateMedian(orderValues),
    mode: calculateMode(orderValues),
    stdDev: calculateStdDev(orderValues),
    variance: calculateVariance(orderValues),
  };

  // Trend analysis
  const dailyData: { [date: string]: { revenue: number; orders: number } } = {};
  const weeklyData: { [week: string]: { revenue: number; orders: number } } = {};
  const monthlyData: { [month: string]: { revenue: number; orders: number } } = {};

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const dateKey = date.toISOString().split('T')[0];
    const weekKey = `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const revenue = parseFloat(order.totalAmount || '0');

    // Daily
    if (!dailyData[dateKey]) dailyData[dateKey] = { revenue: 0, orders: 0 };
    dailyData[dateKey].revenue += revenue;
    dailyData[dateKey].orders += 1;

    // Weekly
    if (!weeklyData[weekKey]) weeklyData[weekKey] = { revenue: 0, orders: 0 };
    weeklyData[weekKey].revenue += revenue;
    weeklyData[weekKey].orders += 1;

    // Monthly
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, orders: 0 };
    monthlyData[monthKey].revenue += revenue;
    monthlyData[monthKey].orders += 1;
  }

  const trends = {
    daily: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
    weekly: Object.entries(weeklyData).map(([week, data]) => ({ week, ...data })).sort((a, b) => a.week.localeCompare(b.week)),
    monthly: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month)),
  };

  // Top performers
  const topCustomers = customers
    .map((c: any) => ({ id: c.id, name: c.name, totalSpent: parseFloat(c.totalSpent || '0') }))
    .sort((a: { totalSpent: number }, b: { totalSpent: number }) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  const serviceRevenue: { [name: string]: { revenue: number; orders: number } } = {};
  for (const order of orders) {
    const items = (order.items as any[]) || [];
    for (const item of items) {
      const serviceName = item.name || 'Unknown';
      if (!serviceRevenue[serviceName]) serviceRevenue[serviceName] = { revenue: 0, orders: 0 };
      serviceRevenue[serviceName].revenue += parseFloat(item.price || '0') * (item.quantity || 1);
      serviceRevenue[serviceName].orders += 1;
    }
  }

  const topServices = Object.entries(serviceRevenue)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Forecasting
  const revenueHistory = trends.daily.map(d => d.revenue);
  const regression = linearRegression(
    Array.from({ length: revenueHistory.length }, (_, i) => i),
    revenueHistory
  );

  const nextWeek = regression.predict(revenueHistory.length + 7) * 7;
  const nextMonth = regression.predict(revenueHistory.length + 30) * 30;
  const trend = regression.slope > 0.1 ? 'increasing' : regression.slope < -0.1 ? 'decreasing' : 'stable';

  return {
    overview: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalCustomers,
      growthRate,
    },
    statistics,
    trends,
    topPerformers: {
      customers: topCustomers,
      services: topServices,
    },
    forecasting: {
      nextWeek,
      nextMonth,
      trend,
    },
  };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Export all analytics functions
 */
export const analyticsEngine = {
  // Statistical functions
  calculateMean,
  calculateMedian,
  calculateMode,
  calculateStdDev,
  calculateVariance,
  calculatePercentile,
  calculateCorrelation,

  // Regression and forecasting
  linearRegression,
  calculateMovingAverage,
  calculateEMA,
  forecastRevenue,

  // Business analytics
  performRFMAnalysis,
  performCohortAnalysis,
  performABCAnalysis,
  generateBusinessAnalytics,
};
