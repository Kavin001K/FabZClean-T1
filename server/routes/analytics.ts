import { Router } from "express";
import { db as storage } from "../db";
import { authMiddleware } from "../middleware/employee-auth";
import { extractListData } from "../utils/list-result";

const router = Router();

// Helper for isolation
const getFranchiseId = (req: any) => {
    const employee = req.employee;
    if (employee && employee.role !== 'admin' && employee.role !== 'factory_manager') {
        return employee.franchiseId;
    }
    // Admin or user can request specific franchise via query param
    if (req.query.franchiseId && employee.role === 'admin') {
        return req.query.franchiseId as string;
    }
    return undefined;
};

router.get("/overview", authMiddleware, async (req, res) => {
    try {
        const supabase = (storage as any).supabase;
        if (!supabase) {
            return res.status(500).json({ message: "Database not available" });
        }

        const franchiseId = getFranchiseId(req);
        const dateRange = req.query.dateRange as string || 'last-30-days';

        // 1. Calculate Date Range
        const now = new Date();
        let startDate = new Date();
        switch (dateRange) {
            case 'last-7-days': startDate.setDate(now.getDate() - 7); break;
            case 'last-30-days': startDate.setDate(now.getDate() - 30); break;
            case 'last-90-days': startDate.setDate(now.getDate() - 90); break;
            case 'last-year': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate = new Date(0); // All time
        }

        // 2. Efficient Counts & Revenue using Supabase
        
        // Count Total Customers (No date filter for total count)
        let customerQuery = supabase.from('customers').select('id', { count: 'exact', head: true });
        if (franchiseId) customerQuery = customerQuery.eq('franchise_id', franchiseId);
        const { count: totalCustomersCount } = await customerQuery;

        // Fetch Orders for the period (Lightweight selection)
        let orderQuery = supabase.from('orders')
            .select('id, total_amount, status, created_at, items')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });
        
        if (franchiseId) orderQuery = orderQuery.eq('franchise_id', franchiseId);
        
        const { data: filteredOrders, error: orderError } = await orderQuery;
        if (orderError) throw orderError;

        // 3. Process Metrics (Now only on indexed/filtered data)
        const orders = filteredOrders || [];
        const totalOrders = orders.length;
        let totalRevenue = 0;
        
        const revenueMap = new Map<string, number>();
        const statusMap = new Map<string, number>();
        const serviceMap = new Map<string, { name: string, revenue: number, count: number }>();

        orders.forEach(o => {
            const rev = parseFloat(o.total_amount || '0');
            totalRevenue += rev;

            // Revenue Chart
            const date = new Date(o.created_at).toLocaleDateString('en-CA');
            revenueMap.set(date, (revenueMap.get(date) || 0) + rev);

            // Status Map
            const status = o.status || 'unknown';
            statusMap.set(status, (statusMap.get(status) || 0) + 1);

            // Service Map
            if (Array.isArray(o.items)) {
                o.items.forEach((item: any) => {
                    const name = item.serviceName || item.name || 'Laundry Services';
                    const price = parseFloat(item.price || 0) * (item.quantity || 1);
                    const prev = serviceMap.get(name) || { name, revenue: 0, count: 0 };
                    serviceMap.set(name, { name, revenue: prev.revenue + price, count: prev.count + 1 });
                });
            }
        });

        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Simplified retention for performance (could be improved with a more complex SQL)
        // For now, let's at least get a better count using SQL
        let repeatQuery = supabase.from('customers').select('id', { count: 'exact', head: true }).gt('total_orders', 1);
        if (franchiseId) repeatQuery = repeatQuery.eq('franchise_id', franchiseId);
        const { count: repeatCustomersCount } = await repeatQuery;
        
        const totalCust = totalCustomersCount || 0;
        const repeatCust = repeatCustomersCount || 0;
        const customerRetention = totalCust > 0 ? (repeatCust / totalCust) * 100 : 0;

        res.json({
            metrics: {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                totalCustomers: totalCust,
                customerRetention
            },
            charts: {
                revenueOverTime: Array.from(revenueMap.entries())
                    .map(([date, value]) => ({ date, value }))
                    .sort((a, b) => a.date.localeCompare(b.date)),
                servicePerformance: Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue),
                orderStatusDistribution: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))
            }
        });

    } catch (error) {
        console.error("Analytics overview error:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
});

/**
 * GET /api/analytics/monthly-metrics
 * Returns pre-computed monthly performance metrics from the autonomous stats engine.
 * Query params: ?month=2026-03 (optional, defaults to current month)
 */
router.get("/monthly-metrics", authMiddleware, async (req, res) => {
    try {
        const supabase = (storage as any).supabase;
        if (!supabase) {
            return res.status(500).json({ message: "Database not available" });
        }

        const now = new Date();
        const requestedMonth = (req.query.month as string) ||
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const { data: metrics, error } = await supabase
            .from('monthly_performance_metrics')
            .select('*')
            .eq('month_year', requestedMonth);

        if (error) {
            console.error("Monthly metrics fetch error:", error);
            return res.status(500).json({ message: "Failed to fetch metrics" });
        }

        // Transform into a keyed object for easy frontend consumption
        const metricsMap: Record<string, { value: number; change: number; lastComputed: string }> = {};
        for (const m of (metrics || [])) {
            metricsMap[m.metric_type] = {
                value: parseFloat(m.value || '0'),
                change: parseFloat(m.percentage_change_mom || '0'),
                lastComputed: m.last_computed_at,
            };
        }

        res.json({
            monthYear: requestedMonth,
            metrics: metricsMap,
        });
    } catch (error) {
        console.error("Monthly metrics error:", error);
        res.status(500).json({ message: "Failed to fetch monthly metrics" });
    }
});

export default router;
