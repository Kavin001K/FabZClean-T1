import { Router } from "express";
import { db as storage } from "../db";
import { authMiddleware } from "../middleware/employee-auth";

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
        const franchiseId = getFranchiseId(req);
        const dateRange = req.query.dateRange as string || 'last-30-days';

        // 1. Fetch Orders
        // 1. Fetch Orders (Filter manually as storage.listOrders returns all)
        const allOrdersRaw = await storage.listOrders();
        const allOrders = franchiseId
            ? allOrdersRaw.filter(o => o.franchiseId === franchiseId)
            : allOrdersRaw;

        // 2. Filter by Date
        const now = new Date();
        let startDate = new Date();
        switch (dateRange) {
            case 'last-7-days': startDate.setDate(now.getDate() - 7); break;
            case 'last-30-days': startDate.setDate(now.getDate() - 30); break;
            case 'last-90-days': startDate.setDate(now.getDate() - 90); break;
            case 'last-year': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate = new Date(0); // All time
        }

        const filteredOrders = allOrders.filter(o => new Date(o.createdAt || 0) >= startDate);

        // Fetch customers for the franchise to get total count
        const allCustomersRaw = await storage.listCustomers();
        const allCustomers = franchiseId
            ? allCustomersRaw.filter(c => c.franchiseId === franchiseId)
            : allCustomersRaw;
        const totalCustomers = allCustomers.length;

        // 3. Calculate Metrics
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate basic retention (customers with > 1 order)
        const repeatCustomers = allCustomers.filter(c => (c.totalOrders || 0) > 1).length;
        const customerRetention = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

        // Revenue by Date (Chart)
        const revenueMap = new Map<string, number>();
        filteredOrders.forEach(o => {
            const date = new Date(o.createdAt || 0).toLocaleDateString('en-CA'); // YYYY-MM-DD
            revenueMap.set(date, (revenueMap.get(date) || 0) + parseFloat(o.totalAmount || '0'));
        });
        const revenueChart = Array.from(revenueMap.entries())
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Service Performance
        const serviceMap = new Map<string, { name: string, revenue: number, count: number }>();
        filteredOrders.forEach(o => {
            if (Array.isArray(o.items)) {
                o.items.forEach((item: any) => {
                    const name = item.serviceName || 'Unknown';
                    const price = parseFloat(item.price || 0) * (item.quantity || 1);
                    const prev = serviceMap.get(name) || { name, revenue: 0, count: 0 };
                    serviceMap.set(name, { name, revenue: prev.revenue + price, count: prev.count + 1 });
                });
            }
        });
        const servicePerformance = Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue);

        // Order Status Distribution
        const statusMap = new Map<string, number>();
        filteredOrders.forEach(o => {
            const status = o.status || 'unknown';
            statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });
        const orderStatusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

        res.json({
            metrics: {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                totalCustomers,
                customerRetention
            },
            charts: {
                revenueOverTime: revenueChart,
                servicePerformance,
                orderStatusDistribution
            }
        });

    } catch (error) {
        console.error("Analytics overview error:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
});

export default router;
