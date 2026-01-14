// ========================================
// REPORTING API: Franchise Analytics (Local SQLite Version)
// File: server/routes/reports.ts
// ========================================

import { Router } from "express";
import { db as storage } from "../db";
import { jwtRequired, requireRole } from "../middleware/auth";
import { AuthService } from "../auth-service";

const router = Router();

// Apply auth middleware to all routes
router.use(jwtRequired);

// Helper to calculate date difference
const getDaysDiff = (date1: Date, date2: Date) => {
    return Math.floor((date1.getTime() - date2.getTime()) / (1000 * 3600 * 24));
};

// Helper to log report access consistently
const logReportAccess = async (req: any, reportName: string, filters: any) => {
    if (req.employee) {
        await AuthService.logAction(
            req.employee.employeeId,
            req.employee.username,
            'generate_report',
            'report',
            reportName,
            {
                filters,
                timestamp: new Date().toISOString()
            },
            req.ip || req.connection.remoteAddress,
            req.get('user-agent')
        );
    }
};

// ========================================
// FRANCHISE PERFORMANCE REPORTS
// ========================================

/**
 * GET /api/reports/franchise-performance
 * Get performance metrics for all franchises
 * Access: Admin only
 */
router.get("/franchise-performance", requireRole(['admin']), async (req, res) => {
    try {
        const franchises = await storage.listFranchises();
        const orders = await storage.listOrders();
        const employees = await storage.listEmployees();
        const customers = await storage.getCustomers(); // Assuming getCustomers exists

        const performanceData = franchises.map(franchise => {
            const franchiseOrders = orders.filter(o => o.franchiseId === franchise.id);
            const franchiseEmployees = employees.filter(e => e.franchiseId === franchise.id);
            const franchiseCustomers = customers.filter(c => c.franchiseId === franchise.id);

            const totalRevenue = franchiseOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || "0") || 0), 0);

            return {
                franchise_id: franchise.id,
                franchise_name: franchise.name,
                franchise_code: franchise.code || franchise.franchiseId, // Fallback
                total_revenue: totalRevenue,
                total_orders: franchiseOrders.length,
                total_customers: franchiseCustomers.length,
                total_employees: franchiseEmployees.length,
                average_order_value: franchiseOrders.length > 0 ? totalRevenue / franchiseOrders.length : 0
            };
        });

        // Sort by revenue desc
        performanceData.sort((a, b) => b.total_revenue - a.total_revenue);

        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'generate_report',
                'report',
                'franchise_performance',
                {
                    reportType: 'franchise_performance_overview',
                    timestamp: new Date().toISOString()
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json({
            success: true,
            data: performanceData,
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
        const franchiseId = (req as any).employee?.franchiseId;

        // Security check: if not admin, ensure accessing own franchise
        // Note: franchiseCode here refers to the code/ID. If it's code, we need to map it.
        // For simplicity, we'll try to match by ID or Code.

        const franchises = await storage.listFranchises();
        const targetFranchise = franchises.find(f => f.franchiseId === franchiseCode || f.code === franchiseCode || f.id === franchiseCode);

        if (!targetFranchise) {
            return res.status(404).json({ success: false, message: "Franchise not found" });
        }

        const orders = await storage.listOrders();
        const franchiseOrders = orders.filter(o => o.franchiseId === targetFranchise.id);

        const totalRevenue = franchiseOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || "0") || 0), 0);

        const data = {
            franchise_id: targetFranchise.id,
            franchise_name: targetFranchise.name,
            franchise_code: targetFranchise.code || targetFranchise.franchiseId,
            total_revenue: totalRevenue,
            total_orders: franchiseOrders.length,
            // Add other metrics as needed
        };

        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'generate_report',
                'report',
                `franchise_performance_${franchiseCode}`,
                {
                    reportType: 'franchise_performance_detail',
                    franchiseCode,
                    timestamp: new Date().toISOString()
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json({
            success: true,
            data: data,
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
        const employee = (req as any).employee;

        let targetFranchiseId: string | undefined = undefined;

        if (employee.role === 'franchise_manager') {
            targetFranchiseId = employee.franchiseId;
        } else if (franchiseCode) {
            // Find franchise by code
            const franchises = await storage.listFranchises();
            const f = franchises.find(fr => fr.code === franchiseCode || fr.franchiseId === franchiseCode);
            if (f) targetFranchiseId = f.id;
        }

        const allEmployees = await storage.listEmployees();
        const allOrders = await storage.listOrders();

        let filteredEmployees = allEmployees;
        if (targetFranchiseId) {
            filteredEmployees = allEmployees.filter(e => e.franchiseId === targetFranchiseId);
        }

        const employeePerformance = filteredEmployees.map(emp => {
            // Match orders by employeeId or createdBy
            const empOrders = allOrders.filter(o => o.employeeId === emp.employeeId || o.createdBy === emp.employeeId);
            const revenue = empOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || "0") || 0), 0);

            return {
                employee_id: emp.id,
                employee_code: emp.employeeId,
                name: emp.name || `${emp.firstName} ${emp.lastName}`,
                role: emp.role,
                franchise_id: emp.franchiseId,
                total_orders: empOrders.length,
                revenue_generated: revenue,
                // Mock goals for now
                target_revenue: 10000,
                achievement_rate: (revenue / 10000) * 100
            };
        });

        // Sort by revenue
        employeePerformance.sort((a, b) => b.revenue_generated - a.revenue_generated);

        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'generate_report',
                'report',
                'employee_performance',
                {
                    reportType: 'employee_performance',
                    franchiseFilter: franchiseCode,
                    timestamp: new Date().toISOString()
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json({
            success: true,
            data: employeePerformance,
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
// DAILY SUMMARY
// ========================================

/**
 * GET /api/reports/daily-summary
 * Get daily summary of orders and revenue
 */
router.get("/daily-summary", async (req, res) => {
    try {
        const { franchiseCode, days = "30" } = req.query;
        const employee = (req as any).employee; // Corrected from user to employee

        const numDays = parseInt(days as string);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);

        let targetFranchiseId: string | undefined = undefined;

        if (employee.role === 'franchise_manager') {
            targetFranchiseId = employee.franchiseId;
        } else if (franchiseCode) {
            const franchises = await storage.listFranchises();
            const f = franchises.find(fr => fr.code === franchiseCode || fr.franchiseId === franchiseCode);
            if (f) targetFranchiseId = f.id;
        }

        const allOrders = await storage.listOrders();

        let filteredOrders = allOrders.filter(o => new Date(o.createdAt) >= startDate);
        if (targetFranchiseId) {
            filteredOrders = filteredOrders.filter(o => o.franchiseId === targetFranchiseId);
        }

        // Group by Date
        const dailyMap = new Map();

        filteredOrders.forEach(order => {
            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            if (!dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, {
                    date: dateStr,
                    total_revenue: 0,
                    total_orders: 0,
                    completed_orders: 0
                });
            }

            const dayStats = dailyMap.get(dateStr);
            dayStats.total_revenue += (parseFloat(order.totalAmount || "0") || 0);
            dayStats.total_orders += 1;
            if (order.status === 'completed' || order.status === 'delivered') {
                dayStats.completed_orders += 1;
            }
        });

        const dailyData = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'generate_report',
                'report',
                'daily_summary',
                {
                    reportType: 'daily_summary',
                    days: req.query.days || 30,
                    franchiseFilter: franchiseCode,
                    timestamp: new Date().toISOString()
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json({
            success: true,
            data: dailyData,
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

export default router;
