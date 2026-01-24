import { Router } from "express";
import { db as storage } from "../db";
import { authMiddleware, roleMiddleware as requireRole } from "../middleware/employee-auth";

const router = Router();

// Cache simple in-memory for 60 seconds
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000;

function getCached(key: string) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
    }
    return null;
}

function setCache(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
}

// Global Dashboard Metrics (Admin vs Franchise logic handled here or via storage params)
router.get("/metrics", authMiddleware, async (req, res) => {
    try {
        const employee = req.employee!;
        let franchiseId: string | undefined = undefined;

        // If not admin, force franchiseId
        if (employee.role !== 'admin') {
            franchiseId = employee.franchiseId;
        } else if (req.query.franchiseId && req.query.franchiseId !== 'all') {
            franchiseId = req.query.franchiseId as string;
        }

        // Cache key based on franchiseId (or 'global' for admin)
        const cacheKey = `metrics:${franchiseId || 'global'}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const metrics = await storage.getDashboardMetrics(franchiseId);

        // Add growth stats
        const growth = await storage.getRevenueGrowth(franchiseId);
        metrics.revenueGrowth = growth.growth;

        setCache(cacheKey, metrics);
        res.json(metrics);
    } catch (error) {
        console.error("Dashboard metrics error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
});

// Admin: Leaderboard
router.get("/admin/leaderboard", authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
        const cacheKey = "admin:leaderboard";
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const leaderboard = await storage.getAdminLeaderboard();
        setCache(cacheKey, leaderboard);
        res.json(leaderboard);
    } catch (error) {
        console.error("Leaderboard error:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
});

// Franchise/Admin: Low Stock Alerts
router.get("/products/low-stock", authMiddleware, async (req, res) => {
    try {
        const employee = req.employee!;
        let franchiseId: string | undefined = undefined;
        if (employee.role !== 'admin') {
            franchiseId = employee.franchiseId;
        }

        const lowStock = await storage.getLowStockProducts(franchiseId);
        res.json(lowStock);
    } catch (error) {
        console.error("Low stock error:", error);
        res.status(500).json({ message: "Failed to fetch low stock products" });
    }
});

// Employee: Personal Stats
router.get("/employee/stats", authMiddleware, async (req, res) => {
    try {
        const employee = req.employee!;
        const stats = await storage.getEmployeeStats(employee.id);
        res.json(stats);
    } catch (error) {
        console.error("Employee stats error:", error);
        res.status(500).json({ message: "Failed to fetch employee stats" });
    }
});

// Employee: My Tasks
router.get("/tasks/my-pending", authMiddleware, async (req, res) => {
    try {
        const employee = req.employee!;
        // Direct DB call to get tasks (assuming listTasks can filter by employeeId)
        // If not, we should rely on getEmployeeStats or add a specific method.
        // For now, let's assume storage.listTasks supports employeeId filtering which MemStorage stub suggested involved parameters.
        const tasks = await storage.listTasks(employee.franchiseId, employee.id);
        const pendingTasks = tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress');
        res.json(pendingTasks);
    } catch (error) {
        console.error("My tasks error:", error);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
});

export default router;
