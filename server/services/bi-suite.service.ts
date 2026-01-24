import { db as storage } from '../db';
import * as math from '../utils/report-math';
import { Order, DailySummary, InsertDailySummary } from '../../shared/schema';

export class BISuiteService {
    /**
     * Generates a daily summary for a specific franchise and date.
     * This is intended to be run by a background job.
     */
    async generateDailySummary(franchiseId: string, date: Date): Promise<DailySummary> {
        const dateStr = date.toISOString().split('T')[0];
        const startDate = new Date(dateStr);
        const endDate = new Date(dateStr);
        endDate.setHours(23, 59, 59, 999);

        const orders = await storage.listOrders();
        const franchiseOrders = orders.filter(o =>
            o.franchiseId === franchiseId &&
            new Date(o.createdAt) >= startDate &&
            new Date(o.createdAt) <= endDate
        );

        const totalRevenue = franchiseOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);
        const orderCount = franchiseOrders.length;

        // Service Mix Calculation
        const serviceMix: Record<string, { count: number; revenue: number }> = {};
        franchiseOrders.forEach(order => {
            const items = (order.items as any[]) || [];
            items.forEach(item => {
                const id = item.serviceId || 'unknown';
                if (!serviceMix[id]) serviceMix[id] = { count: 0, revenue: 0 };
                serviceMix[id].count += item.quantity || 1;
                serviceMix[id].revenue += parseFloat(item.subtotal || '0');
            });
        });

        // Staff Performance
        const staffPerformance: Record<string, { ordersCreated: number; revenueGenerated: number }> = {};
        franchiseOrders.forEach(order => {
            const staffId = order.employeeId || 'system';
            if (!staffPerformance[staffId]) staffPerformance[staffId] = { ordersCreated: 0, revenueGenerated: 0 };
            staffPerformance[staffId].ordersCreated += 1;
            staffPerformance[staffId].revenueGenerated += parseFloat(order.totalAmount || '0');
        });

        // Efficiency metrics
        let totalTurnaroundHours = 0;
        let turnAroundCount = 0;
        let readyOnTimeCount = 0;
        let delayedOrderCount = 0;

        franchiseOrders.forEach(order => {
            if (order.status === 'completed' || order.status === 'ready_for_pickup') {
                const created = new Date(order.createdAt);
                const updated = new Date(order.updatedAt);
                const diffHours = (updated.getTime() - created.getTime()) / (1000 * 3600);
                totalTurnaroundHours += diffHours;
                turnAroundCount++;

                // Logic for "ready on time" would require a target delivery date field
                // For now, let's assume a default lead time
            }
        });

        const avgTurnaroundHours = turnAroundCount > 0 ? totalTurnaroundHours / turnAroundCount : 0;

        // Predictive Analytics Example: SMA and Regression
        const last30DaysSummaries = await storage.getDailySummaries({
            franchiseId,
            endDate: date
        });

        const revenueHistory = last30DaysSummaries.map(s => parseFloat(s.totalRevenue || '0')).reverse();
        const sma7 = math.calculateSMA([...revenueHistory, totalRevenue], 7);

        const regressionData = last30DaysSummaries.map((s, i) => ({ x: i, y: parseFloat(s.totalRevenue || '0') }));
        const regression = math.calculateLinearRegression(regressionData.concat({ x: regressionData.length, y: totalRevenue }));
        const nextDayForecast = regression.predict(regressionData.length + 1);

        const summaryData: InsertDailySummary = {
            franchiseId,
            date: startDate,
            totalRevenue: totalRevenue.toString(),
            orderCount,
            serviceMix,
            staffPerformance,
            avgTurnaroundHours: avgTurnaroundHours.toFixed(2),
            analytics: {
                sma7: sma7[sma7.length - 1],
                revenueForecast: nextDayForecast.toFixed(2),
                growthRate: last30DaysSummaries.length > 0
                    ? ((totalRevenue / parseFloat(last30DaysSummaries[0].totalRevenue || '1')) - 1) * 100
                    : 0
            }
        };

        return await storage.createDailySummary(summaryData);
    }

    /**
     * Calculates Benchmarking Comparison between franchises
     */
    async getFranchiseBenchmarks(date: Date) {
        const franchises = await storage.listFranchises();
        const summaries = await storage.getDailySummaries({
            startDate: date,
            endDate: date
        });

        return franchises.map(f => {
            const summary = summaries.find(s => s.franchiseId === f.id);
            return {
                name: f.name,
                revenue: parseFloat(summary?.totalRevenue || '0'),
                orders: summary?.orderCount || 0,
                efficiency: parseFloat(summary?.avgTurnaroundHours || '0')
            };
        });
    }
}

export const biSuiteService = new BISuiteService();
