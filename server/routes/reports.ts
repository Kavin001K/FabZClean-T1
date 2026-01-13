// ========================================
// REPORTING API: Franchise Analytics
// File: server/routes/reports.ts
// ========================================

import { Router } from "express";
import { storage } from "../SupabaseStorage";
import { authMiddleware, roleMiddleware } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ========================================
// FRANCHISE PERFORMANCE REPORTS
// ========================================

/**
 * GET /api/reports/franchise-performance
 * Get performance metrics for all franchises
 * Access: Admin only
 */
router.get("/franchise-performance", roleMiddleware(['admin']), async (req, res) => {
    try {
        const { data, error } = await storage.supabase
            .from('vw_franchise_performance')
            .select('*')
            .order('total_revenue', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Franchise performance report error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate franchise performance report",
            error: error.message
        });
    }
});

/**
 * GET /api/reports/franchise-performance/:franchiseCode
 * Get performance metrics for specific franchise
 * Access: Admin or franchise manager
 */
router.get("/franchise-performance/:franchiseCode", async (req, res) => {
    try {
        const { franchiseCode } = req.params;
        const { startDate, endDate } = req.query;

        const { data, error } = await storage.supabase
            .from('vw_franchise_performance')
            .select('*')
            .eq('franchise_code', franchiseCode)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data || null,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Franchise performance report error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate franchise performance report",
            error: error.message
        });
    }
});

// ========================================
// EMPLOYEE PERFORMANCE REPORTS
// ========================================

/**
 * GET /api/reports/employee-performance
 * Get performance metrics for all employees
 * Access: Admin or franchise manager (filtered by franchise)
 */
router.get("/employee-performance", async (req, res) => {
    try {
        const { franchiseCode } = req.query;
        const user = (req as any).user;

        let query = storage.supabase
            .from('vw_employee_performance')
            .select('*');

        // If franchise manager, filter by their franchise
        if (user.role === 'franchise_manager' && user.franchiseId) {
            const { data: franchise } = await storage.supabase
                .from('franchises')
                .select('franchise_code')
                .eq('id', user.franchiseId)
                .single();

            if (franchise) {
                query = query.eq('franchise_code', franchise.franchise_code);
            }
        } else if (franchiseCode) {
            query = query.eq('franchise_code', franchiseCode);
        }

        const { data, error } = await query.order('revenue_generated', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Employee performance report error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate employee performance report",
            error: error.message
        });
    }
});

/**
 * GET /api/reports/employee-performance/:employeeCode
 * Get performance metrics for specific employee
 */
router.get("/employee-performance/:employeeCode", async (req, res) => {
    try {
        const { employeeCode } = req.params;

        const { data, error } = await storage.supabase
            .from('vw_employee_performance')
            .select('*')
            .eq('employee_code', employeeCode)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data || null,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Employee performance report error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate employee performance report",
            error: error.message
        });
    }
});

// ========================================
// ORDER ANALYTICS
// ========================================

/**
 * GET /api/reports/order-analytics
 * Get detailed order analytics
 */
router.get("/order-analytics", async (req, res) => {
    try {
        const { franchiseCode, startDate, endDate, groupBy } = req.query;
        const user = (req as any).user;

        let query = storage.supabase
            .from('vw_order_analytics')
            .select('*');

        // Filter by franchise if manager
        if (user.role === 'franchise_manager' && user.franchiseId) {
            const { data: franchise } = await storage.supabase
                .from('franchises')
                .select('franchise_code')
                .eq('id', user.franchiseId)
                .single();

            if (franchise) {
                query = query.eq('franchise_code', franchise.franchise_code);
            }
        } else if (franchiseCode) {
            query = query.eq('franchise_code', franchiseCode);
        }

        // Date range filter
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) throw error;

        // Group data if requested
        let result = data || [];
        if (groupBy && data) {
            result = groupOrderData(data, groupBy as string);
        }

        res.json({
            success: true,
            data: result,
            count: result.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Order analytics report error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate order analytics report",
            error: error.message
        });
    }
});

// ========================================
// DAILY SUMMARY
// ========================================

/**
 * GET /api/reports/daily-summary
 * Get daily summary of orders and revenue
 */
router.get("/daily-summary", async (req, res) => {
    try {
        const { franchiseCode, days = 30 } = req.query;
        const user = (req as any).user;

        let query = storage.supabase
            .from('vw_daily_summary')
            .select('*');

        // Filter by franchise if manager
        if (user.role === 'franchise_manager' && user.franchiseId) {
            const { data: franchise } = await storage.supabase
                .from('franchises')
                .select('franchise_code')
                .eq('id', user.franchiseId)
                .single();

            if (franchise) {
                query = query.eq('franchise_code', franchise.franchise_code);
            }
        } else if (franchiseCode) {
            query = query.eq('franchise_code', franchiseCode);
        }

        // Get last N days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));

        const { data, error } = await query
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Daily summary report error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate daily summary report",
            error: error.message
        });
    }
});

// ========================================
// COMPARISON REPORTS
// ========================================

/**
 * GET /api/reports/franchise-comparison
 * Compare performance across franchises
 * Access: Admin only
 */
router.get("/franchise-comparison", roleMiddleware(['admin']), async (req, res) => {
    try {
        const { metric = 'revenue', period = '30' } = req.query;

        const { data, error } = await storage.supabase
            .from('vw_franchise_performance')
            .select('*')
            .order('total_revenue', { ascending: false });

        if (error) throw error;

        // Calculate rankings
        const ranked = (data || []).map((franchise, index) => ({
            ...franchise,
            rank: index + 1,
            performance_score: calculatePerformanceScore(franchise)
        }));

        res.json({
            success: true,
            data: ranked,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Franchise comparison report error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate franchise comparison report",
            error: error.message
        });
    }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function groupOrderData(data: any[], groupBy: string): any[] {
    const grouped: Record<string, any> = {};

    data.forEach(order => {
        let key: string;
        switch (groupBy) {
            case 'franchise':
                key = order.franchise_code;
                break;
            case 'employee':
                key = order.employee_code;
                break;
            case 'month':
                key = order.year_month;
                break;
            case 'day':
                key = order.created_at.split('T')[0];
                break;
            default:
                key = 'all';
        }

        if (!grouped[key]) {
            grouped[key] = {
                group: key,
                count: 0,
                total_amount: 0,
                orders: []
            };
        }

        grouped[key].count++;
        grouped[key].total_amount += parseFloat(order.total_amount || 0);
        grouped[key].orders.push(order);
    });

    return Object.values(grouped);
}

function calculatePerformanceScore(franchise: any): number {
    // Weighted score based on multiple metrics
    const revenueScore = (franchise.total_revenue || 0) / 1000; // Normalize
    const orderScore = (franchise.total_orders || 0) * 10;
    const customerScore = (franchise.total_customers || 0) * 5;
    const employeeScore = (franchise.total_employees || 0) * 20;

    return Math.round(
        (revenueScore * 0.4) +
        (orderScore * 0.3) +
        (customerScore * 0.2) +
        (employeeScore * 0.1)
    );
}

export default router;
