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

        const totalRevenue = allOrders.reduce(
            (sum: number, order: any) => sum + parseFloat(order.totalAmount || "0"),
            0
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = allOrders.filter(
            (order: any) => order.createdAt && new Date(order.createdAt) >= today
        ).length;

        const newCustomersToday = customers.filter(
            (customer: any) => customer.createdAt && new Date(customer.createdAt) >= today
        ).length;

        const metrics = {
            totalRevenue,
            totalOrders: ordersToday,
            newCustomers: newCustomersToday,
            inventoryItems: products.length
        };

        res.json(metrics);
    } catch (error) {
        console.error("Dashboard metrics error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
});

export default router;
