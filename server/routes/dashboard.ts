import { Router } from "express";
import { db as storage } from "../db";

const router = Router();

// Dashboard metrics endpoint
router.get("/metrics", async (req, res) => {
    try {
        const allOrders = await storage.listOrders();
        const customers = await storage.listCustomers();
        const products = await storage.listProducts();

        const totalRevenue = allOrders.reduce(
            (sum, order) => sum + parseFloat(order.totalAmount || "0"),
            0
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = allOrders.filter(
            (order) => order.createdAt && new Date(order.createdAt) >= today
        ).length;

        const newCustomersToday = customers.filter(
            (customer) => customer.createdAt && new Date(customer.createdAt) >= today
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
