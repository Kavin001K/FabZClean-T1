import { Router } from "express";
import { db as storage } from "../db";
import { biSuiteService } from "../services/bi-suite.service";
import { jwtRequired, requireRole } from "../middleware/auth";
import * as math from "../utils/report-math";

const router = Router();

router.use(jwtRequired);

/**
 * GET /api/reports/bi/dashboard
 * High-level BI dashboard metrics
 */
router.get("/dashboard", async (req, res) => {
    try {
        const franchiseId = (req as any).employee?.franchiseId;
        const summaries = await storage.getDailySummaries({ franchiseId });

        // Calculate Trend Metrics (e.g. Month-over-Month)
        const currentMonth = summaries.slice(0, 30);
        const prevMonth = summaries.slice(30, 60);

        const currentRevenue = currentMonth.reduce((s, d) => s + parseFloat(d.totalRevenue || "0"), 0);
        const prevRevenue = prevMonth.reduce((s, d) => s + parseFloat(d.totalRevenue || "0"), 0);

        const revenueGrowth = prevRevenue > 0 ? ((currentRevenue / prevRevenue) - 1) * 100 : 0;

        // Forecasting
        const regressionData = summaries.slice(0, 30).map((s, i) => ({ x: i, y: parseFloat(s.totalRevenue || "0") })).reverse();
        const regression = math.calculateLinearRegression(regressionData);
        const forecastNext7Days = Array.from({ length: 7 }, (_, i) => regression.predict(regressionData.length + i + 1));

        res.json({
            success: true,
            data: {
                kpi: {
                    currentRevenue,
                    revenueGrowth: revenueGrowth.toFixed(2),
                    avgOrderValue: currentMonth.length > 0 ? currentRevenue / currentMonth.reduce((s, d) => s + (d.orderCount || 0), 0) : 0
                },
                forecast: forecastNext7Days,
                recentSummaries: summaries.slice(0, 7)
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/reports/bi/benchmarks
 * Benchmarking across franchises
 */
router.get("/benchmarks", requireRole(['admin']), async (req, res) => {
    try {
        const today = new Date();
        const benchmarks = await biSuiteService.getFranchiseBenchmarks(today);
        res.json({ success: true, data: benchmarks });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
