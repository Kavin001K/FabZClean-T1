/**
 * Monthly Analytics Cron Job
 * 
 * Autonomous statistical engine that calculates and stores monthly performance metrics.
 * Runs daily at midnight via node-cron.
 * 
 * Metrics calculated:
 * - total_deliveries: Count of delivered orders in the month
 * - avg_delivery_time: Average time from dispatch to delivery (in minutes)
 * - total_delivery_payouts: Sum of all deliveryEarningsCalculated for the month
 * - revenue: Total revenue from all orders in the month
 */

import cron from 'node-cron';
import { db as storage } from '../db';

// ---- Main Calculation Logic ----

export async function computeMonthlyMetrics(monthYear?: string): Promise<void> {
    const supabase = (storage as any).supabase;
    if (!supabase) {
        console.error('[Analytics Cron] Supabase client not available');
        return;
    }

    const now = new Date();
    const targetMonthYear = monthYear || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`[Analytics Cron] Computing metrics for: ${targetMonthYear}`);

    try {
        // Fetch all orders
        const allOrders = await storage.listOrders();

        // Filter orders for the target month
        const monthOrders = allOrders.filter((order: any) => {
            const createdAt = new Date(order.createdAt || 0);
            const orderMonth = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
            return orderMonth === targetMonthYear;
        });

        // Filter delivered orders for the target month
        const deliveredOrders = allOrders.filter((order: any) => {
            if (order.status !== 'delivered') return false;
            const deliveredDate = new Date(order.deliveredAt || order.updatedAt || 0);
            const deliveredMonth = `${deliveredDate.getFullYear()}-${String(deliveredDate.getMonth() + 1).padStart(2, '0')}`;
            return deliveredMonth === targetMonthYear;
        });

        // ---- Calculate Metrics ----

        // 1. Total Deliveries
        const totalDeliveries = deliveredOrders.length;

        // 2. Average Delivery Time (minutes) — from dispatchedAt to deliveredAt
        let avgDeliveryTime = 0;
        const ordersWithBothTimestamps = deliveredOrders.filter(
            (o: any) => o.dispatchedAt && o.deliveredAt
        );
        if (ordersWithBothTimestamps.length > 0) {
            const totalMinutes = ordersWithBothTimestamps.reduce((sum: number, o: any) => {
                const dispatched = new Date(o.dispatchedAt).getTime();
                const delivered = new Date(o.deliveredAt).getTime();
                return sum + (delivered - dispatched) / (1000 * 60); // Convert ms to minutes
            }, 0);
            avgDeliveryTime = totalMinutes / ordersWithBothTimestamps.length;
        }

        // 3. Total Delivery Payouts
        const totalPayouts = deliveredOrders.reduce(
            (sum: number, o: any) => sum + (o.deliveryEarningsCalculated || 0), 0
        );

        // 4. Revenue
        const totalRevenue = monthOrders.reduce(
            (sum: number, o: any) => sum + parseFloat(o.totalAmount || '0'), 0
        );

        // ---- Fetch Previous Month for MoM Calculation ----
        const [year, month] = targetMonthYear.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1); // month is 0-indexed, so month-2
        const prevMonthYear = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        const { data: prevMetrics } = await supabase
            .from('monthly_performance_metrics')
            .select('*')
            .eq('month_year', prevMonthYear);

        const prevMap = new Map<string, number>();
        if (prevMetrics) {
            for (const m of prevMetrics) {
                prevMap.set(m.metric_type, parseFloat(m.value || '0'));
            }
        }

        // ---- Calculate MoM % Change ----
        const calcMoM = (current: number, metricType: string): number => {
            const previous = prevMap.get(metricType) || 0;
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / Math.abs(previous)) * 100;
        };

        // ---- Upsert Metrics ----
        const metrics = [
            { type: 'total_deliveries', value: totalDeliveries },
            { type: 'avg_delivery_time', value: Math.round(avgDeliveryTime * 100) / 100 },
            { type: 'total_delivery_payouts', value: totalPayouts },
            { type: 'revenue', value: Math.round(totalRevenue * 100) / 100 },
        ];

        for (const metric of metrics) {
            const mom = Math.round(calcMoM(metric.value, metric.type) * 100) / 100;

            // Upsert: try to find existing row, then update or insert
            const { data: existing } = await supabase
                .from('monthly_performance_metrics')
                .select('id')
                .eq('month_year', targetMonthYear)
                .eq('metric_type', metric.type)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('monthly_performance_metrics')
                    .update({
                        value: metric.value.toString(),
                        percentage_change_mom: mom.toString(),
                        last_computed_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('monthly_performance_metrics')
                    .insert({
                        month_year: targetMonthYear,
                        metric_type: metric.type,
                        value: metric.value.toString(),
                        percentage_change_mom: mom.toString(),
                        last_computed_at: new Date().toISOString(),
                    });
            }
        }

        console.log(`[Analytics Cron] ✅ Metrics saved for ${targetMonthYear}:`, {
            totalDeliveries,
            avgDeliveryTime: `${Math.round(avgDeliveryTime)} min`,
            totalPayouts: `₹${totalPayouts}`,
            revenue: `₹${Math.round(totalRevenue)}`,
        });

    } catch (error) {
        console.error('[Analytics Cron] ❌ Error computing metrics:', error);
    }
}

// ---- Cron Initialization ----

export function initAnalyticsCron(): void {
    // Run every day at midnight IST (18:30 UTC previous day)
    cron.schedule('30 18 * * *', async () => {
        console.log('[Analytics Cron] 🕐 Midnight IST trigger — computing monthly metrics...');
        await computeMonthlyMetrics();
    });

    // Also compute immediately on server start (for development/catch-up)
    setTimeout(async () => {
        console.log('[Analytics Cron] 🚀 Initial metrics computation on startup...');
        await computeMonthlyMetrics();
    }, 5000); // 5 second delay to let DB initialize

    console.log('[Analytics Cron] ✅ Scheduled daily metrics computation at midnight IST');
}
