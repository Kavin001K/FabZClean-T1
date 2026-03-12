import { Router } from "express";
import { db as storage } from "../db";

const router = Router();

import { authMiddleware } from "../middleware/employee-auth";

// Dashboard metrics endpoint
router.get("/metrics", authMiddleware, async (req, res) => {
    try {
        const employee = req.employee;
        let franchiseId: string | undefined = undefined;

        if (employee && employee.role !== 'admin') {
            franchiseId = employee.franchiseId;
        }

        // Pass franchiseId to listOrders to filter at db level
        const allOrders = await storage.listOrders(franchiseId);

        // Note: listCustomers and listProducts might also need update in future if they need isolation
        // For now, assuming customers and products are shared or handled elsewhere
        const customers = await storage.listCustomers();
        const products = await storage.listProducts();

        const activeOrders = allOrders.filter((order: any) => order.status !== 'cancelled');
        const totalRevenue = activeOrders.reduce(
            (sum: number, order: any) => sum + parseFloat(order.totalAmount || "0"),
            0
        );
        const totalOrders = activeOrders.length;
        const totalOutstanding = customers.reduce(
            (sum: number, customer: any) => sum + Math.max(0, parseFloat(customer.creditBalance || customer.credit_balance || "0")),
            0
        );
        const successfulOrders = activeOrders.filter((order: any) => ['completed', 'delivered'].includes(order.status)).length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const ordersToday = activeOrders.filter(
            (order: any) => order.createdAt && new Date(order.createdAt) >= today
        ).length;

        const newCustomersToday = customers.filter(
            (customer: any) => customer.createdAt && new Date(customer.createdAt) >= today
        ).length;

        const dueDateStats = activeOrders.reduce((stats: any, order: any) => {
            if (!order.pickupDate) return stats;
            const pickupDate = new Date(order.pickupDate);
            pickupDate.setHours(0, 0, 0, 0);

            if (pickupDate < today) {
                stats.overdue += 1;
            } else if (pickupDate.getTime() === today.getTime()) {
                stats.today += 1;
            } else if (pickupDate.getTime() === tomorrow.getTime()) {
                stats.tomorrow += 1;
            } else if (pickupDate >= dayAfterTomorrow) {
                stats.upcoming += 1;
            }

            return stats;
        }, {
            today: 0,
            tomorrow: 0,
            overdue: 0,
            upcoming: 0,
        });

        const metrics = {
            totalRevenue,
            totalOrders,
            newCustomers: newCustomersToday,
            inventoryItems: products.length,
            bookedRevenue: totalRevenue,
            outstandingCredit: totalOutstanding,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            successRate: totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0,
            ordersToday,
            dueDateStats,
        };

        res.json(metrics);
    } catch (error) {
        console.error("Dashboard metrics error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
});

export default router;
