/**
 * ============================================================================
 * FabZClean BI Suite - Daily Maintenance & Analytics Calculation Script
 * ============================================================================
 * 
 * Enhanced maintenance script that:
 * 1. Runs database optimization (VACUUM, ANALYZE, backup)
 * 2. Calculates comprehensive BI statistics using the math engine
 * 3. Populates the daily_summaries table for <200ms dashboard loads
 * 4. Detects anomalies and flags suspicious orders
 * 
 * Scheduled to run every midnight via cron job
 * 
 * @module daily-maintenance
 * @version 2.0.0
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

// Import BI Math Engine
import {
    mean,
    median,
    mode,
    variance,
    standardDeviation,
    percentile,
    linearRegression,
    forecastRevenue,
    calculateProjectedMonthEndRevenue,
    calculateCLV,
    calculateCustomerCLVs,
    calculateLittlesLaw,
    calculateTurnaroundVariance,
    calculateStaffEfficiency,
    calculateServiceContribution,
    calculateServiceCorrelation,
    simpleMovingAverage,
    exponentialMovingAverage,
    calculateRevenueVelocity,
    detectAnomalies,
    generatePeakDemandHeatmap,
    calculateGSTBreakout,
    calculateCohortRetention,
} from "../utils/bi-math-engine";

// Path configuration
const SECURE_DATA_PATH = path.join(process.cwd(), "server", "secure_data");
const DB_PATH = path.join(SECURE_DATA_PATH, "fabzclean.db");
const BACKUPS_PATH = path.join(SECURE_DATA_PATH, "backups");
const LOGS_PATH = path.join(SECURE_DATA_PATH, "logs");

// Configuration
const LOG_RETENTION_DAYS = 365; // Keep logs for 1 year
const MAX_BACKUPS = 30; // Keep last 30 backups

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface MaintenanceResult {
    success: boolean;
    operations: {
        vacuum: boolean;
        analyze: boolean;
        backup: boolean;
        logCleanup: boolean;
        oldBackupCleanup: boolean;
        biCalculation: boolean;
    };
    errors: string[];
    stats: {
        dbSizeBefore: number;
        dbSizeAfter: number;
        logsDeleted: number;
        backupsDeleted: number;
        dailySummariesGenerated: number;
        anomaliesDetected: number;
        calculationDurationMs: number;
    };
    timestamp: string;
}

interface DailySummaryData {
    franchiseId: string;
    date: string;

    // Revenue
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    revenueGrowthDaily: number | null;
    revenueGrowthWeekly: number | null;
    revenueGrowthMonthly: number | null;

    // Predictive
    projectedMonthEndRevenue: number | null;
    revenueVelocity: number | null;
    revenueVelocityTrend: 'accelerating' | 'decelerating' | 'stable' | null;
    atRiskRevenue: number;
    regressionSlope: number | null;
    regressionIntercept: number | null;
    regressionR2: number | null;
    forecastNext7Days: any[];

    // Customer
    customerCount: number;
    newCustomerCount: number;
    returningCustomerCount: number;
    avgCustomerClv: number | null;
    totalPlatinumCustomers: number;
    totalGoldCustomers: number;
    totalSilverCustomers: number;
    totalBronzeCustomers: number;
    customerChurnRate: number | null;
    avgRetentionRate: number | null;

    // Service
    topServiceId: string | null;
    topServiceName: string | null;
    topServiceRevenue: number | null;
    serviceMixVariance: number | null;
    heroServicesCount: number;
    lossLeaderServicesCount: number;
    serviceMix: any;
    serviceCorrelationTop5: any[];

    // Operations
    avgTurnaroundHours: number | null;
    turnaroundStdDev: number | null;
    turnaroundConsistencyScore: number | null;
    percentWithinTarget: number | null;
    ordersArrivalRate: number | null;
    avgWaitTime: number | null;
    itemsInProcess: number | null;
    bottleneckType: 'volume' | 'processing' | 'balanced' | null;
    bottleneckRecommendation: string | null;
    readyOnTimeCount: number;
    delayedOrderCount: number;
    pendingOrdersCount: number;
    completedOrdersCount: number;

    // Staff
    avgStaffZScore: number | null;
    topPerformerEmployeeId: string | null;
    topPerformerName: string | null;
    topPerformerZScore: number | null;
    totalStaffProductivity: number | null;
    staffPerformance: any;

    // Tax
    totalTaxCollected: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    taxableAmount: number;
    taxByHsnCode: any;

    // Financial
    totalCost: number;
    contributionMargin: number | null;
    grossProfit: number | null;
    paymentMethodMix: any;
    creditSalesAmount: number;
    creditCollectedAmount: number;

    // Anomaly
    anomalyCount: number;
    anomalyDetails: any[];
    suspiciousOrderIds: string[];

    // Statistics
    orderValueMean: number | null;
    orderValueMedian: number | null;
    orderValueMode: number | null;
    orderValueStdDev: number | null;
    orderValueVariance: number | null;
    orderValue25thPercentile: number | null;
    orderValue75thPercentile: number | null;
    orderValue85thPercentile: number | null;
    orderValue95thPercentile: number | null;

    // Peak Demand
    peakDemandHour: number | null;
    peakDemandDayOfWeek: number | null;
    peakDemandScore: number | null;
    demandHeatmapTop10: any[];

    // Moving Averages
    sma7DayRevenue: number | null;
    sma14DayRevenue: number | null;
    sma30DayRevenue: number | null;
    ema7DayRevenue: number | null;

    // Meta
    calculationDurationMs: number;
    dataQualityScore: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getFileSize(filePath: string): number {
    try {
        return fs.statSync(filePath).size;
    } catch {
        return 0;
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

// ============================================================================
// BI CALCULATION ENGINE
// ============================================================================

/**
 * Calculate comprehensive BI statistics for a single franchise on a specific date
 */
function calculateDailySummary(
    db: Database.Database,
    franchiseId: string,
    date: Date
): DailySummaryData {
    const startTime = Date.now();
    const dateStr = getDateString(date);
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    // ============================================================================
    // FETCH RAW DATA
    // ============================================================================

    // Get today's orders
    const todayOrders = db.prepare(`
    SELECT * FROM orders 
    WHERE franchiseId = ? 
    AND createdAt >= ? AND createdAt <= ?
  `).all(franchiseId, startOfDay, endOfDay) as any[];

    // Get historical revenue (last 30 days)
    const thirtyDaysAgo = new Date(date);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalRevenue = db.prepare(`
    SELECT 
      DATE(createdAt) as date,
      SUM(CAST(totalAmount AS REAL)) as revenue,
      COUNT(*) as orderCount
    FROM orders 
    WHERE franchiseId = ? 
    AND createdAt >= ? AND createdAt <= ?
    GROUP BY DATE(createdAt)
    ORDER BY date
  `).all(franchiseId, thirtyDaysAgo.toISOString(), endOfDay) as any[];

    // Get all customers for CLV
    const customers = db.prepare(`
    SELECT 
      c.id,
      c.name,
      CAST(c.total_spent AS REAL) as totalSpent,
      CAST(c.total_orders AS INTEGER) as orderCount,
      c.created_at as firstOrderDate,
      c.last_order_at as lastOrderDate
    FROM customers c
    WHERE c.franchiseId = ?
  `).all(franchiseId) as any[];

    // Get staff metrics
    const staffMetrics = db.prepare(`
    SELECT 
      e.id as employeeId,
      e.first_name || ' ' || e.last_name as employeeName,
      COUNT(DISTINCT o.id) as ordersProcessed,
      SUM(CAST(o.garment_count AS INTEGER)) as totalItems
    FROM employees e
    LEFT JOIN orders o ON o.createdBy = e.id
    WHERE e.franchiseId = ? 
    AND o.createdAt >= ? AND o.createdAt <= ?
    GROUP BY e.id
  `).all(franchiseId, startOfDay, endOfDay) as any[];

    // Get services for correlation
    const services = db.prepare(`
    SELECT id, name, CAST(price AS REAL) as price
    FROM services
    WHERE franchiseId = ?
  `).all(franchiseId) as any[];

    // ============================================================================
    // CALCULATE REVENUE METRICS
    // ============================================================================

    const orderAmounts = todayOrders.map(o => parseFloat(o.totalAmount || '0'));
    const totalRevenue = orderAmounts.reduce((sum, val) => sum + val, 0);
    const orderCount = todayOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Growth calculations
    const yesterdayRevenue = historicalRevenue.find(r => {
        const rDate = new Date(r.date);
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        return getDateString(rDate) === getDateString(yesterday);
    })?.revenue || 0;

    const lastWeekRevenue = historicalRevenue.find(r => {
        const rDate = new Date(r.date);
        const lastWeek = new Date(date);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return getDateString(rDate) === getDateString(lastWeek);
    })?.revenue || 0;

    const revenueGrowthDaily = yesterdayRevenue > 0
        ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : null;

    const revenueGrowthWeekly = lastWeekRevenue > 0
        ? ((totalRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
        : null;

    // ============================================================================
    // PREDICTIVE METRICS (Linear Regression)
    // ============================================================================

    const revenueHistory = historicalRevenue.map(r => ({
        date: r.date,
        revenue: parseFloat(r.revenue || '0')
    }));

    const forecasts = forecastRevenue(revenueHistory, 7);
    const last7DaysRevenue = revenueHistory.slice(-7).map(r => r.revenue);

    const velocityData = last7DaysRevenue.length >= 7
        ? calculateRevenueVelocity(totalRevenue, last7DaysRevenue)
        : null;

    // Linear regression on revenue
    const xValues = revenueHistory.map((_, i) => i);
    const yValues = revenueHistory.map(r => r.revenue);
    const regression = linearRegression(xValues, yValues);

    // Projected month end
    const currentMonth = date.getMonth();
    const daysInMonth = new Date(date.getFullYear(), currentMonth + 1, 0).getDate();
    const dayOfMonth = date.getDate();
    const monthToDateRevenue = revenueHistory
        .filter(r => new Date(r.date).getMonth() === currentMonth)
        .reduce((sum, r) => sum + r.revenue, 0);

    const lastMonthRevenue = db.prepare(`
    SELECT SUM(CAST(totalAmount AS REAL)) as revenue
    FROM orders 
    WHERE franchiseId = ? 
    AND strftime('%Y-%m', createdAt) = strftime('%Y-%m', date(?, '-1 month'))
  `).get(franchiseId, dateStr) as any;

    const projectionData = calculateProjectedMonthEndRevenue(
        monthToDateRevenue,
        dayOfMonth,
        parseFloat(lastMonthRevenue?.revenue || '0')
    );

    // At-risk revenue (orders past expected completion)
    const overdueOrders = todayOrders.filter(o =>
        o.status === 'pending' || o.status === 'processing'
    );
    const atRiskRevenue = overdueOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);

    // ============================================================================
    // CUSTOMER METRICS (CLV Analysis)
    // ============================================================================

    const todayCustomerIds = [...new Set(todayOrders.map(o => o.customerId))];
    const customerCount = todayCustomerIds.length;

    // New vs returning customers
    const newCustomers = customers.filter(c => {
        const firstOrder = new Date(c.firstOrderDate);
        return getDateString(firstOrder) === dateStr;
    });
    const newCustomerCount = newCustomers.length;
    const returningCustomerCount = customerCount - newCustomerCount;

    // CLV calculations
    const clvResults = calculateCustomerCLVs(
        customers.map(c => ({
            id: c.id,
            name: c.name,
            totalSpent: c.totalSpent || 0,
            orderCount: c.orderCount || 0,
            firstOrderDate: new Date(c.firstOrderDate || date),
            lastOrderDate: new Date(c.lastOrderDate || date)
        }))
    );

    const avgCustomerClv = clvResults.length > 0
        ? mean(clvResults.map(c => c.clv))
        : 0;

    const tierCounts = {
        Platinum: clvResults.filter(c => c.tier === 'Platinum').length,
        Gold: clvResults.filter(c => c.tier === 'Gold').length,
        Silver: clvResults.filter(c => c.tier === 'Silver').length,
        Bronze: clvResults.filter(c => c.tier === 'Bronze').length
    };

    // ============================================================================
    // SERVICE METRICS (Contribution Analysis)
    // ============================================================================

    const serviceRevenue: Record<string, { count: number; revenue: number }> = {};

    for (const order of todayOrders) {
        const items = JSON.parse(order.items || '[]');
        for (const item of items) {
            const serviceId = item.serviceId || item.serviceName || 'Unknown';
            if (!serviceRevenue[serviceId]) {
                serviceRevenue[serviceId] = { count: 0, revenue: 0 };
            }
            serviceRevenue[serviceId].count += item.quantity || 1;
            serviceRevenue[serviceId].revenue += parseFloat(item.subtotal || item.price || '0');
        }
    }

    const serviceContributions = calculateServiceContribution(
        Object.entries(serviceRevenue).map(([id, data]) => ({
            serviceId: id,
            serviceName: id,
            revenue: data.revenue,
            costPerOrder: data.revenue * 0.3, // Assume 30% cost
            targetPercentage: 100 / Object.keys(serviceRevenue).length || 10
        })),
        totalRevenue
    );

    const topService = serviceContributions[0];
    const heroServices = serviceContributions.filter(s => s.category === 'Hero');
    const lossLeaders = serviceContributions.filter(s => s.category === 'LossLeader');

    // Service correlation
    const orderServices = todayOrders.map(o => {
        const items = JSON.parse(o.items || '[]');
        return {
            services: items.map((i: any) => i.serviceId || i.serviceName),
            totalAmount: parseFloat(o.totalAmount || '0')
        };
    });
    const correlations = calculateServiceCorrelation(orderServices);

    // ============================================================================
    // OPERATIONAL METRICS (Little's Law)
    // ============================================================================

    // Calculate turnaround times
    const turnaroundData = todayOrders
        .filter(o => o.completedAt && o.createdAt)
        .map(o => {
            const created = new Date(o.createdAt);
            const completed = new Date(o.completedAt);
            const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
            return {
                expectedHours: 24, // Default expected turnaround
                actualHours: hours
            };
        });

    const turnaroundMetrics = calculateTurnaroundVariance(turnaroundData);

    // Little's Law
    const avgProcessingDays = turnaroundMetrics.avgTurnaround / 24;
    const littlesLaw = calculateLittlesLaw(orderCount, avgProcessingDays);

    // Order status counts
    const statusCounts = {
        pending: todayOrders.filter(o => o.status === 'pending').length,
        completed: todayOrders.filter(o => o.status === 'completed').length,
        onTime: turnaroundData.filter(t => t.actualHours <= t.expectedHours + 2).length,
        delayed: turnaroundData.filter(t => t.actualHours > t.expectedHours + 2).length
    };

    // ============================================================================
    // STAFF METRICS (Z-Scores)
    // ============================================================================

    const staffEfficiency = calculateStaffEfficiency(
        staffMetrics.map(s => ({
            employeeId: s.employeeId,
            employeeName: s.employeeName || 'Unknown',
            ordersProcessed: s.ordersProcessed || 0,
            itemsByCategory: [{ category: 'default', count: s.totalItems || 0 }],
            hoursWorked: 8 // Assume 8-hour shift
        }))
    );

    const topPerformer = staffEfficiency[0];
    const avgStaffZScore = staffEfficiency.length > 0
        ? mean(staffEfficiency.map(s => s.zScore))
        : 0;

    // ============================================================================
    // TAX METRICS (GST Breakout)
    // ============================================================================

    let totalTaxCollected = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let taxableAmount = 0;

    for (const order of todayOrders) {
        if (order.gstEnabled) {
            const gstBreakout = calculateGSTBreakout(
                parseFloat(order.totalAmount || '0'),
                parseFloat(order.gstRate || '18'),
                false // Assume intrastate
            );
            totalTaxCollected += gstBreakout.totalTax;
            cgstAmount += gstBreakout.cgst;
            sgstAmount += gstBreakout.sgst;
            igstAmount += gstBreakout.igst;
            taxableAmount += gstBreakout.taxableAmount;
        }
    }

    // ============================================================================
    // ANOMALY DETECTION
    // ============================================================================

    const anomalies = detectAnomalies(
        todayOrders.map(o => ({
            orderId: o.id,
            orderNumber: o.orderNumber,
            amount: parseFloat(o.totalAmount || '0')
        })),
        3 // 3 standard deviations
    );

    // ============================================================================
    // STATISTICAL AGGREGATES
    // ============================================================================

    const orderStats = {
        mean: orderAmounts.length > 0 ? mean(orderAmounts) : null,
        median: orderAmounts.length > 0 ? median(orderAmounts) : null,
        mode: orderAmounts.length > 0 ? mode(orderAmounts) : null,
        stdDev: orderAmounts.length > 0 ? standardDeviation(orderAmounts) : null,
        variance: orderAmounts.length > 0 ? variance(orderAmounts) : null,
        p25: orderAmounts.length > 0 ? percentile(orderAmounts, 25) : null,
        p75: orderAmounts.length > 0 ? percentile(orderAmounts, 75) : null,
        p85: orderAmounts.length > 0 ? percentile(orderAmounts, 85) : null,
        p95: orderAmounts.length > 0 ? percentile(orderAmounts, 95) : null
    };

    // ============================================================================
    // PEAK DEMAND HEATMAP
    // ============================================================================

    const heatmapData = generatePeakDemandHeatmap(
        todayOrders.map(o => ({
            createdAt: new Date(o.createdAt),
            totalAmount: parseFloat(o.totalAmount || '0')
        }))
    );

    const peakDemand = heatmapData[0];

    // ============================================================================
    // MOVING AVERAGES
    // ============================================================================

    const revenueValues = revenueHistory.map(r => r.revenue);
    const sma7 = simpleMovingAverage(revenueValues, 7);
    const sma14 = simpleMovingAverage(revenueValues, 14);
    const sma30 = simpleMovingAverage(revenueValues, 30);
    const ema7 = exponentialMovingAverage(revenueValues);

    // ============================================================================
    // PAYMENT METHOD MIX
    // ============================================================================

    const paymentMix: Record<string, number> = {};
    let creditSales = 0;

    for (const order of todayOrders) {
        const method = order.paymentMethod || 'cash';
        paymentMix[method] = (paymentMix[method] || 0) + parseFloat(order.totalAmount || '0');

        if (order.paymentStatus === 'credit') {
            creditSales += parseFloat(order.totalAmount || '0');
        }
    }

    // ============================================================================
    // DATA QUALITY SCORE
    // ============================================================================

    let qualityScore = 100;
    if (orderCount === 0) qualityScore -= 20;
    if (customerCount === 0) qualityScore -= 15;
    if (staffMetrics.length === 0) qualityScore -= 10;
    if (revenueHistory.length < 7) qualityScore -= 15;
    if (anomalies.length > 5) qualityScore -= 10;

    const calculationDurationMs = Date.now() - startTime;

    // ============================================================================
    // COMPILE RESULT
    // ============================================================================

    return {
        franchiseId,
        date: dateStr,

        // Revenue
        totalRevenue,
        orderCount,
        avgOrderValue,
        revenueGrowthDaily,
        revenueGrowthWeekly,
        revenueGrowthMonthly: null, // TODO: Calculate MoM

        // Predictive
        projectedMonthEndRevenue: projectionData.adjustedProjection,
        revenueVelocity: velocityData?.velocity || null,
        revenueVelocityTrend: velocityData?.trend || null,
        atRiskRevenue,
        regressionSlope: regression.slope,
        regressionIntercept: regression.intercept,
        regressionR2: regression.r2,
        forecastNext7Days: forecasts,

        // Customer
        customerCount,
        newCustomerCount,
        returningCustomerCount,
        avgCustomerClv,
        totalPlatinumCustomers: tierCounts.Platinum,
        totalGoldCustomers: tierCounts.Gold,
        totalSilverCustomers: tierCounts.Silver,
        totalBronzeCustomers: tierCounts.Bronze,
        customerChurnRate: null, // TODO: Calculate from cohort data
        avgRetentionRate: null,

        // Service
        topServiceId: topService?.serviceId || null,
        topServiceName: topService?.serviceName || null,
        topServiceRevenue: topService?.revenue || null,
        serviceMixVariance: serviceContributions.reduce((sum, s) => sum + Math.abs(s.variance), 0),
        heroServicesCount: heroServices.length,
        lossLeaderServicesCount: lossLeaders.length,
        serviceMix: serviceContributions,
        serviceCorrelationTop5: correlations.slice(0, 5),

        // Operations
        avgTurnaroundHours: turnaroundMetrics.avgTurnaround,
        turnaroundStdDev: turnaroundMetrics.stdDevHours,
        turnaroundConsistencyScore: turnaroundMetrics.consistencyScore,
        percentWithinTarget: turnaroundMetrics.percentWithinTarget,
        ordersArrivalRate: littlesLaw.arrivalRate,
        avgWaitTime: littlesLaw.waitTime,
        itemsInProcess: littlesLaw.itemsInProcess,
        bottleneckType: littlesLaw.bottleneckType,
        bottleneckRecommendation: littlesLaw.recommendation,
        readyOnTimeCount: statusCounts.onTime,
        delayedOrderCount: statusCounts.delayed,
        pendingOrdersCount: statusCounts.pending,
        completedOrdersCount: statusCounts.completed,

        // Staff
        avgStaffZScore,
        topPerformerEmployeeId: topPerformer?.employeeId || null,
        topPerformerName: topPerformer?.employeeName || null,
        topPerformerZScore: topPerformer?.zScore || null,
        totalStaffProductivity: staffEfficiency.reduce((sum, s) => sum + s.weightedScore, 0),
        staffPerformance: staffEfficiency,

        // Tax
        totalTaxCollected,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxableAmount,
        taxByHsnCode: {}, // TODO: Group by HSN

        // Financial
        totalCost: totalRevenue * 0.3, // Assume 30% cost
        contributionMargin: totalRevenue > 0 ? 70 : null, // 70% margin
        grossProfit: totalRevenue * 0.7,
        paymentMethodMix: paymentMix,
        creditSalesAmount: creditSales,
        creditCollectedAmount: 0, // TODO: Track collections

        // Anomaly
        anomalyCount: anomalies.length,
        anomalyDetails: anomalies,
        suspiciousOrderIds: anomalies.map(a => a.orderId),

        // Statistics
        orderValueMean: orderStats.mean,
        orderValueMedian: orderStats.median,
        orderValueMode: orderStats.mode,
        orderValueStdDev: orderStats.stdDev,
        orderValueVariance: orderStats.variance,
        orderValue25thPercentile: orderStats.p25,
        orderValue75thPercentile: orderStats.p75,
        orderValue85thPercentile: orderStats.p85,
        orderValue95thPercentile: orderStats.p95,

        // Peak Demand
        peakDemandHour: peakDemand?.hourOfDay ?? null,
        peakDemandDayOfWeek: peakDemand?.dayOfWeek ?? null,
        peakDemandScore: peakDemand?.demandScore ?? null,
        demandHeatmapTop10: heatmapData.slice(0, 10),

        // Moving Averages
        sma7DayRevenue: sma7[sma7.length - 1] || null,
        sma14DayRevenue: sma14[sma14.length - 1] || null,
        sma30DayRevenue: sma30[sma30.length - 1] || null,
        ema7DayRevenue: ema7[ema7.length - 1] || null,

        // Meta
        calculationDurationMs,
        dataQualityScore: Math.max(0, qualityScore)
    };
}

/**
 * Insert or update daily summary in database
 */
function upsertDailySummary(db: Database.Database, summary: DailySummaryData): void {
    const existing = db.prepare(`
    SELECT id FROM daily_summaries 
    WHERE franchise_id = ? AND date = ?
  `).get(summary.franchiseId, summary.date + 'T00:00:00.000Z');

    if (existing) {
        db.prepare(`
      UPDATE daily_summaries SET
        total_revenue = ?,
        order_count = ?,
        avg_order_value = ?,
        revenue_growth_daily = ?,
        projected_month_end_revenue = ?,
        revenue_velocity = ?,
        at_risk_revenue = ?,
        regression_slope = ?,
        regression_r2 = ?,
        forecast_next_7_days = ?,
        customer_count = ?,
        new_customer_count = ?,
        returning_customer_count = ?,
        avg_customer_clv = ?,
        top_service_id = ?,
        top_service_name = ?,
        service_mix = ?,
        avg_turnaround_hours = ?,
        turnaround_consistency_score = ?,
        bottleneck_type = ?,
        avg_staff_z_score = ?,
        top_performer_employee_id = ?,
        staff_performance = ?,
        total_tax_collected = ?,
        cgst_amount = ?,
        sgst_amount = ?,
        anomaly_count = ?,
        anomaly_details = ?,
        order_value_mean = ?,
        order_value_std_dev = ?,
        peak_demand_hour = ?,
        sma_7_day_revenue = ?,
        payment_method_mix = ?,
        calculation_duration_ms = ?,
        data_quality_score = ?,
        last_recalculated_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
            summary.totalRevenue,
            summary.orderCount,
            summary.avgOrderValue,
            summary.revenueGrowthDaily,
            summary.projectedMonthEndRevenue,
            summary.revenueVelocity,
            summary.atRiskRevenue,
            summary.regressionSlope,
            summary.regressionR2,
            JSON.stringify(summary.forecastNext7Days),
            summary.customerCount,
            summary.newCustomerCount,
            summary.returningCustomerCount,
            summary.avgCustomerClv,
            summary.topServiceId,
            summary.topServiceName,
            JSON.stringify(summary.serviceMix),
            summary.avgTurnaroundHours,
            summary.turnaroundConsistencyScore,
            summary.bottleneckType,
            summary.avgStaffZScore,
            summary.topPerformerEmployeeId,
            JSON.stringify(summary.staffPerformance),
            summary.totalTaxCollected,
            summary.cgstAmount,
            summary.sgstAmount,
            summary.anomalyCount,
            JSON.stringify(summary.anomalyDetails),
            summary.orderValueMean,
            summary.orderValueStdDev,
            summary.peakDemandHour,
            summary.sma7DayRevenue,
            JSON.stringify(summary.paymentMethodMix),
            summary.calculationDurationMs,
            summary.dataQualityScore,
            new Date().toISOString(),
            new Date().toISOString(),
            (existing as any).id
        );
    } else {
        db.prepare(`
      INSERT INTO daily_summaries (
        id, franchise_id, date,
        total_revenue, order_count, avg_order_value,
        revenue_growth_daily, projected_month_end_revenue,
        revenue_velocity, at_risk_revenue,
        regression_slope, regression_r2, forecast_next_7_days,
        customer_count, new_customer_count, returning_customer_count,
        avg_customer_clv, top_service_id, top_service_name, service_mix,
        avg_turnaround_hours, turnaround_consistency_score, bottleneck_type,
        avg_staff_z_score, top_performer_employee_id, staff_performance,
        total_tax_collected, cgst_amount, sgst_amount,
        anomaly_count, anomaly_details,
        order_value_mean, order_value_std_dev,
        peak_demand_hour, sma_7_day_revenue, payment_method_mix,
        calculation_duration_ms, data_quality_score,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            crypto.randomUUID(),
            summary.franchiseId,
            summary.date + 'T00:00:00.000Z',
            summary.totalRevenue,
            summary.orderCount,
            summary.avgOrderValue,
            summary.revenueGrowthDaily,
            summary.projectedMonthEndRevenue,
            summary.revenueVelocity,
            summary.atRiskRevenue,
            summary.regressionSlope,
            summary.regressionR2,
            JSON.stringify(summary.forecastNext7Days),
            summary.customerCount,
            summary.newCustomerCount,
            summary.returningCustomerCount,
            summary.avgCustomerClv,
            summary.topServiceId,
            summary.topServiceName,
            JSON.stringify(summary.serviceMix),
            summary.avgTurnaroundHours,
            summary.turnaroundConsistencyScore,
            summary.bottleneckType,
            summary.avgStaffZScore,
            summary.topPerformerEmployeeId,
            JSON.stringify(summary.staffPerformance),
            summary.totalTaxCollected,
            summary.cgstAmount,
            summary.sgstAmount,
            summary.anomalyCount,
            JSON.stringify(summary.anomalyDetails),
            summary.orderValueMean,
            summary.orderValueStdDev,
            summary.peakDemandHour,
            summary.sma7DayRevenue,
            JSON.stringify(summary.paymentMethodMix),
            summary.calculationDurationMs,
            summary.dataQualityScore,
            new Date().toISOString(),
            new Date().toISOString()
        );
    }
}

// ============================================================================
// MAIN OPTIMIZATION FUNCTION
// ============================================================================

export async function optimizeSystem(): Promise<MaintenanceResult> {
    console.log("\n🧹 Starting Daily Maintenance & BI Calculation...");
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Database: ${DB_PATH}\n`);

    const biStartTime = Date.now();

    const result: MaintenanceResult = {
        success: true,
        operations: {
            vacuum: false,
            analyze: false,
            backup: false,
            logCleanup: false,
            oldBackupCleanup: false,
            biCalculation: false,
        },
        errors: [],
        stats: {
            dbSizeBefore: getFileSize(DB_PATH),
            dbSizeAfter: 0,
            logsDeleted: 0,
            backupsDeleted: 0,
            dailySummariesGenerated: 0,
            anomaliesDetected: 0,
            calculationDurationMs: 0,
        },
        timestamp: new Date().toISOString(),
    };

    let db: Database.Database | null = null;

    try {
        if (!fs.existsSync(DB_PATH)) {
            throw new Error(`Database not found at ${DB_PATH}`);
        }

        db = new Database(DB_PATH);

        // ============================================================================
        // STEP 1: VACUUM
        // ============================================================================
        console.log("   [1/6] Running VACUUM...");
        try {
            db.exec("VACUUM;");
            result.operations.vacuum = true;
            console.log("         ✅ VACUUM complete");
        } catch (err: any) {
            result.errors.push(`VACUUM failed: ${err.message}`);
            console.error("         ❌ VACUUM failed:", err.message);
        }

        // ============================================================================
        // STEP 2: ANALYZE
        // ============================================================================
        console.log("   [2/6] Running ANALYZE...");
        try {
            db.exec("ANALYZE;");
            result.operations.analyze = true;
            console.log("         ✅ ANALYZE complete");
        } catch (err: any) {
            result.errors.push(`ANALYZE failed: ${err.message}`);
            console.error("         ❌ ANALYZE failed:", err.message);
        }

        // ============================================================================
        // STEP 3: BACKUP
        // ============================================================================
        console.log("   [3/6] Creating backup...");
        try {
            if (!fs.existsSync(BACKUPS_PATH)) {
                fs.mkdirSync(BACKUPS_PATH, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `fabzclean_backup_${timestamp}.db`;
            const backupPath = path.join(BACKUPS_PATH, backupFileName);

            await db.backup(backupPath);

            result.operations.backup = true;
            console.log(`         ✅ Backup created: ${backupFileName}`);
        } catch (err: any) {
            result.errors.push(`Backup failed: ${err.message}`);
            console.error("         ❌ Backup failed:", err.message);
        }

        // ============================================================================
        // STEP 4: LOG CLEANUP
        // ============================================================================
        console.log("   [4/6] Archiving old logs...");
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);
            const cutoffStr = cutoffDate.toISOString();

            const countResult = db.prepare(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE createdAt < ?
      `).get(cutoffStr) as any;

            const logsToDelete = countResult?.count || 0;

            if (logsToDelete > 0) {
                if (!fs.existsSync(LOGS_PATH)) {
                    fs.mkdirSync(LOGS_PATH, { recursive: true });
                }

                const archiveFileName = `audit_archive_${new Date().toISOString().split('T')[0]}.json`;
                const archivePath = path.join(LOGS_PATH, archiveFileName);

                const oldLogs = db.prepare(`
          SELECT * FROM audit_logs 
          WHERE createdAt < ?
        `).all(cutoffStr);

                fs.writeFileSync(archivePath, JSON.stringify(oldLogs, null, 2));

                db.prepare(`
          DELETE FROM audit_logs 
          WHERE createdAt < ?
        `).run(cutoffStr);

                result.stats.logsDeleted = logsToDelete;
                console.log(`         ✅ Archived and deleted ${logsToDelete} old logs`);
            } else {
                console.log("         ✅ No old logs to archive");
            }

            result.operations.logCleanup = true;
        } catch (err: any) {
            result.errors.push(`Log cleanup failed: ${err.message}`);
            console.error("         ❌ Log cleanup failed:", err.message);
        }

        // ============================================================================
        // STEP 5: OLD BACKUP CLEANUP
        // ============================================================================
        console.log("   [5/6] Cleaning old backups...");
        try {
            if (fs.existsSync(BACKUPS_PATH)) {
                const backups = fs.readdirSync(BACKUPS_PATH)
                    .filter(f => f.endsWith('.db'))
                    .map(f => ({
                        name: f,
                        path: path.join(BACKUPS_PATH, f),
                        time: fs.statSync(path.join(BACKUPS_PATH, f)).mtime.getTime()
                    }))
                    .sort((a, b) => b.time - a.time);

                if (backups.length > MAX_BACKUPS) {
                    const toDelete = backups.slice(MAX_BACKUPS);
                    for (const backup of toDelete) {
                        fs.unlinkSync(backup.path);
                        result.stats.backupsDeleted++;
                    }
                    console.log(`         ✅ Deleted ${toDelete.length} old backups`);
                } else {
                    console.log(`         ✅ Backup count OK (${backups.length}/${MAX_BACKUPS})`);
                }
            }
            result.operations.oldBackupCleanup = true;
        } catch (err: any) {
            result.errors.push(`Backup cleanup failed: ${err.message}`);
            console.error("         ❌ Backup cleanup failed:", err.message);
        }

        // ============================================================================
        // STEP 6: BI CALCULATIONS
        // ============================================================================
        console.log("   [6/6] Calculating BI Statistics...");
        try {
            // Get all franchises
            const franchises = db.prepare(`SELECT id, name FROM franchises WHERE status = 'active'`).all() as any[];

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            for (const franchise of franchises) {
                console.log(`         📊 Processing ${franchise.name}...`);

                try {
                    const summary = calculateDailySummary(db, franchise.id, yesterday);
                    upsertDailySummary(db, summary);

                    result.stats.dailySummariesGenerated++;
                    result.stats.anomaliesDetected += summary.anomalyCount;

                    console.log(`            ✓ Revenue: ₹${summary.totalRevenue.toFixed(2)}, Orders: ${summary.orderCount}, Anomalies: ${summary.anomalyCount}`);
                } catch (franchiseErr: any) {
                    console.error(`            ✗ Error: ${franchiseErr.message}`);
                    result.errors.push(`BI calc for ${franchise.name}: ${franchiseErr.message}`);
                }
            }

            result.operations.biCalculation = true;
            console.log(`         ✅ BI Calculation complete (${franchises.length} franchises)`);
        } catch (err: any) {
            result.errors.push(`BI calculation failed: ${err.message}`);
            console.error("         ❌ BI calculation failed:", err.message);
        }

        // Log the maintenance action
        try {
            db.prepare(`
        INSERT INTO audit_logs (
          id, franchiseId, employeeId, action, entityType, entityId, details, ipAddress, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                crypto.randomUUID(),
                'SYSTEM',
                'SYSTEM',
                'bi_maintenance',
                'system',
                'maintenance',
                JSON.stringify({
                    summariesGenerated: result.stats.dailySummariesGenerated,
                    anomaliesDetected: result.stats.anomaliesDetected,
                    errors: result.errors
                }),
                'LOCALHOST',
                new Date().toISOString()
            );
        } catch {
            // Non-critical
        }

    } catch (err: any) {
        result.success = false;
        result.errors.push(`Critical error: ${err.message}`);
        console.error("❌ Critical maintenance error:", err.message);
    } finally {
        if (db) {
            db.close();
        }
    }

    result.stats.dbSizeAfter = getFileSize(DB_PATH);
    result.stats.calculationDurationMs = Date.now() - biStartTime;

    // Summary
    console.log("\n📊 Maintenance Summary:");
    console.log(`   Database Size: ${formatBytes(result.stats.dbSizeBefore)} → ${formatBytes(result.stats.dbSizeAfter)}`);
    console.log(`   Logs Archived: ${result.stats.logsDeleted}`);
    console.log(`   Backups Cleaned: ${result.stats.backupsDeleted}`);
    console.log(`   Daily Summaries: ${result.stats.dailySummariesGenerated}`);
    console.log(`   Anomalies Found: ${result.stats.anomaliesDetected}`);
    console.log(`   Calculation Time: ${result.stats.calculationDurationMs}ms`);
    console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
    }

    console.log("");

    return result;
}

// Run if executed directly
const currentFile = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === currentFile;

if (isMainModule) {
    optimizeSystem()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(err => {
            console.error("Fatal error:", err);
            process.exit(1);
        });
}

export default optimizeSystem;
