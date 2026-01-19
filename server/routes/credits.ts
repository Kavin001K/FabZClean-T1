/**
 * Customer Credit Management Routes
 * 
 * Enhanced with:
 * - Franchise-based access control
 * - Super admin global view
 * - Detailed analytics and reporting
 * - Transaction history with proper filtering
 */

import { Router, Request, Response } from 'express';
import { db as storage } from '../db';
import { jwtRequired, requireRole } from '../middleware/auth';
import { createSuccessResponse, createErrorResponse } from '../services/serialization';
import type { UserRole } from '../../shared/supabase';

const router = Router();

// Role definitions
const CREDIT_VIEW_ROLES: UserRole[] = ['admin', 'franchise_manager', 'employee'];
const CREDIT_MANAGE_ROLES: UserRole[] = ['admin', 'franchise_manager'];
const ADMIN_ONLY: UserRole[] = ['admin'];

// Helper: Get user info from request
function getUserInfo(req: Request) {
    const user = (req as any).user;
    return {
        id: user?.id || user?.employeeId,
        role: user?.role as UserRole,
        franchiseId: user?.franchiseId,
        name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email
    };
}

// Helper: Check if user can access franchise data
function canAccessFranchise(userRole: UserRole, userFranchiseId: string | null, targetFranchiseId: string | null): boolean {
    if (userRole === 'admin') return true; // Super admin can access all
    if (!userFranchiseId) return true; // No franchise restriction
    if (!targetFranchiseId) return true; // Global data
    return userFranchiseId === targetFranchiseId;
}

// Apply JWT authentication to all routes
router.use(jwtRequired);

/**
 * GET /credits/stats
 * Get dashboard-level credit statistics
 * - Admin: sees all franchises
 * - Franchise manager: sees only their franchise
 */
router.get('/stats', requireRole(CREDIT_VIEW_ROLES), async (req: Request, res: Response) => {
    try {
        const { role, franchiseId: userFranchiseId } = getUserInfo(req);
        const isAdmin = role === 'admin';

        // Get all customers
        let customers = await storage.listCustomers();

        // Filter by franchise if not admin
        if (!isAdmin && userFranchiseId) {
            customers = customers.filter((c: any) =>
                !c.franchiseId || c.franchiseId === userFranchiseId
            );
        }

        // Calculate stats
        const customersWithDebt = customers.filter((c: any) =>
            parseFloat(c.creditBalance || '0') > 0
        );

        const totalOutstanding = customersWithDebt.reduce((sum: number, c: any) =>
            sum + parseFloat(c.creditBalance || '0'), 0
        );

        const activeCustomers = customersWithDebt.length;

        // Get credit transactions for monthly stats
        let allTransactions: any[] = [];
        for (const c of customersWithDebt) {
            try {
                const history = await storage.getCustomerCreditHistory(c.id);
                allTransactions.push(...history.map((h: any) => ({
                    ...h,
                    customerName: c.name,
                    customerPhone: c.phone,
                    customerFranchiseId: c.franchiseId
                })));
            } catch (e) {
                // Skip on error
            }
        }

        // Calculate monthly stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyTransactions = allTransactions.filter((t: any) =>
            new Date(t.createdAt) >= monthStart
        );

        // Credits issued this month (positive amounts = credit given to customer / debt created)
        const monthlyCreditGiven = monthlyTransactions
            .filter((t: any) => parseFloat(t.amount || '0') > 0)
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);

        // Payments received this month (negative amounts = payments received)
        const monthlyPaymentsReceived = monthlyTransactions
            .filter((t: any) => parseFloat(t.amount || '0') < 0)
            .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

        // Franchise breakdown for admin
        let franchiseBreakdown: any[] = [];
        if (isAdmin) {
            const franchises = await storage.listFranchises();
            for (const franchise of franchises) {
                const franchiseCustomers = customers.filter((c: any) =>
                    c.franchiseId === franchise.id
                );
                const franchiseOutstanding = franchiseCustomers.reduce((sum: number, c: any) =>
                    sum + parseFloat(c.creditBalance || '0'), 0
                );
                if (franchiseOutstanding > 0) {
                    franchiseBreakdown.push({
                        franchiseId: franchise.id,
                        franchiseName: franchise.name,
                        outstanding: franchiseOutstanding,
                        customerCount: franchiseCustomers.filter((c: any) =>
                            parseFloat(c.creditBalance || '0') > 0
                        ).length
                    });
                }
            }
            // Sort by outstanding amount
            franchiseBreakdown.sort((a, b) => b.outstanding - a.outstanding);
        }

        res.json(createSuccessResponse({
            totalOutstanding,
            activeCustomers,
            monthlyCreditGiven,
            monthlyPaymentsReceived,
            franchiseBreakdown,
            isAdmin,
            lastUpdated: new Date().toISOString()
        }));

    } catch (error: any) {
        console.error('Get credit stats error:', error);
        res.status(500).json(createErrorResponse('Failed to get credit stats', 500));
    }
});

/**
 * GET /credits/transactions
 * Get all credit transactions with filtering
 */
router.get('/transactions', requireRole(CREDIT_VIEW_ROLES), async (req: Request, res: Response) => {
    try {
        const { role, franchiseId: userFranchiseId } = getUserInfo(req);
        const isAdmin = role === 'admin';
        const { search, type, franchiseId: filterFranchiseId } = req.query;

        // Get customers with credit history
        let customers = await storage.listCustomers();

        // Filter by franchise
        if (!isAdmin && userFranchiseId) {
            customers = customers.filter((c: any) =>
                !c.franchiseId || c.franchiseId === userFranchiseId
            );
        } else if (filterFranchiseId) {
            customers = customers.filter((c: any) => c.franchiseId === filterFranchiseId);
        }

        // Collect all transactions with customer info
        const allTransactions: any[] = [];
        for (const customer of customers) {
            try {
                const history = await storage.getCustomerCreditHistory(customer.id);
                allTransactions.push(...history.map((t: any) => ({
                    id: t.id,
                    customerId: customer.id,
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    customerEmail: customer.email,
                    franchiseId: customer.franchiseId,
                    amount: parseFloat(t.amount || '0'),
                    type: t.type,
                    description: t.description,
                    referenceId: t.referenceId,
                    balanceAfter: parseFloat(t.balanceAfter || '0'),
                    createdBy: t.createdBy,
                    createdAt: t.createdAt
                })));
            } catch (e) {
                // Skip on error
            }
        }

        // Sort by date (newest first)
        allTransactions.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Apply type filter
        let filtered = allTransactions;
        if (type && type !== 'all') {
            filtered = filtered.filter((t: any) => t.type === type);
        }

        // Apply search filter
        if (search) {
            const searchStr = (search as string).toLowerCase();
            filtered = filtered.filter((t: any) =>
                t.customerName?.toLowerCase().includes(searchStr) ||
                t.customerPhone?.includes(searchStr) ||
                t.description?.toLowerCase().includes(searchStr)
            );
        }

        res.json(createSuccessResponse(filtered.slice(0, 100)));

    } catch (error: any) {
        console.error('Get credit transactions error:', error);
        res.status(500).json(createErrorResponse('Failed to get transactions', 500));
    }
});

/**
 * GET /credits/report/outstanding
 * Get customers with outstanding balances
 */
router.get('/report/outstanding', requireRole(CREDIT_VIEW_ROLES), async (req: Request, res: Response) => {
    try {
        const { role, franchiseId: userFranchiseId } = getUserInfo(req);
        const isAdmin = role === 'admin';
        const { franchiseId: filterFranchiseId, sortBy = 'balance', order = 'desc' } = req.query;

        // Get all customers
        let customers = await storage.listCustomers();

        // Filter by franchise
        if (!isAdmin && userFranchiseId) {
            customers = customers.filter((c: any) =>
                !c.franchiseId || c.franchiseId === userFranchiseId
            );
        } else if (filterFranchiseId) {
            customers = customers.filter((c: any) => c.franchiseId === filterFranchiseId);
        }

        // Filter only customers with outstanding balance
        const customersWithBalance = customers
            .filter((c: any) => parseFloat(c.creditBalance || '0') > 0)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                franchiseId: c.franchiseId,
                creditBalance: parseFloat(c.creditBalance || '0'),
                totalOrders: c.totalOrders || 0,
                totalSpent: parseFloat(c.totalSpent || '0'),
                lastOrder: c.lastOrder,
                createdAt: c.createdAt
            }));

        // Sort
        if (sortBy === 'balance') {
            customersWithBalance.sort((a, b) =>
                order === 'desc' ? b.creditBalance - a.creditBalance : a.creditBalance - b.creditBalance
            );
        } else if (sortBy === 'name') {
            customersWithBalance.sort((a, b) =>
                order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
            );
        }

        // Calculate totals
        const totalOutstanding = customersWithBalance.reduce((sum, c) => sum + c.creditBalance, 0);

        res.json(createSuccessResponse({
            customers: customersWithBalance,
            totalOutstanding,
            customerCount: customersWithBalance.length
        }));

    } catch (error: any) {
        console.error('Get outstanding report error:', error);
        res.status(500).json(createErrorResponse('Failed to get report', 500));
    }
});

/**
 * GET /credits/history/:customerId
 * Get specific customer's credit history
 */
router.get('/history/:customerId', requireRole(CREDIT_VIEW_ROLES), async (req: Request, res: Response) => {
    try {
        const { customerId } = req.params;
        const { role, franchiseId: userFranchiseId } = getUserInfo(req);

        // Verify customer exists and user has access
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
            return res.status(404).json(createErrorResponse('Customer not found', 404));
        }

        // Check franchise access
        if (role !== 'admin' && userFranchiseId &&
            customer.franchiseId && customer.franchiseId !== userFranchiseId) {
            return res.status(403).json(createErrorResponse('Access denied', 403));
        }

        const history = await storage.getCustomerCreditHistory(customerId);

        // Format response
        const formattedHistory = history.map((t: any) => ({
            id: t.id,
            amount: parseFloat(t.amount || '0'),
            type: t.type,
            description: t.description,
            referenceId: t.referenceId,
            balanceAfter: parseFloat(t.balanceAfter || '0'),
            createdBy: t.createdBy,
            createdAt: t.createdAt
        }));

        res.json(createSuccessResponse({
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                creditBalance: parseFloat(customer.creditBalance || '0')
            },
            transactions: formattedHistory
        }));

    } catch (error: any) {
        console.error('Get customer credit history error:', error);
        res.status(500).json(createErrorResponse('Failed to get history', 500));
    }
});

/**
 * POST /credits/payment
 * Record a credit payment (reduces customer debt)
 */
router.post('/payment', requireRole(CREDIT_MANAGE_ROLES), async (req: Request, res: Response) => {
    try {
        const { customerId, amount, paymentMethod, notes, referenceNumber } = req.body;
        const userInfo = getUserInfo(req);

        if (!customerId || !amount || amount <= 0) {
            return res.status(400).json(createErrorResponse('Customer ID and positive amount required', 400));
        }

        // Verify customer exists
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
            return res.status(404).json(createErrorResponse('Customer not found', 404));
        }

        // Check franchise access
        if (userInfo.role !== 'admin' && userInfo.franchiseId &&
            customer.franchiseId && customer.franchiseId !== userInfo.franchiseId) {
            return res.status(403).json(createErrorResponse('Access denied', 403));
        }

        const currentBalance = parseFloat(customer.creditBalance || '0');
        if (amount > currentBalance) {
            return res.status(400).json(createErrorResponse(
                `Payment amount (₹${amount}) exceeds outstanding balance (₹${currentBalance})`,
                400
            ));
        }

        // Record payment (negative amount reduces balance)
        const description = notes ||
            `Payment received${paymentMethod ? ` via ${paymentMethod}` : ''}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`;

        const result = await storage.addCustomerCredit(
            customerId,
            -amount,  // Negative to reduce balance
            'payment',
            description,
            referenceNumber,
            userInfo.name || userInfo.id
        );

        // Log audit
        try {
            await storage.createAuditLog({
                employeeId: userInfo.id,
                action: 'credit_payment',
                entityType: 'customer',
                entityId: customerId,
                details: {
                    amount,
                    paymentMethod,
                    referenceNumber,
                    previousBalance: currentBalance,
                    newBalance: currentBalance - amount
                },
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown'
            });
        } catch (e) {
            console.error('Audit log error:', e);
        }

        res.json(createSuccessResponse({
            transaction: result,
            newBalance: currentBalance - amount,
            message: `Payment of ₹${amount} recorded successfully`
        }));

    } catch (error: any) {
        console.error('Record payment error:', error);
        res.status(500).json(createErrorResponse('Failed to record payment', 500));
    }
});

/**
 * POST /credits/add
 * Add credit to customer (increases debt - e.g., for unpaid orders)
 */
router.post('/add', requireRole(CREDIT_MANAGE_ROLES), async (req: Request, res: Response) => {
    try {
        const { customerId, amount, reason, orderId } = req.body;
        const userInfo = getUserInfo(req);

        if (!customerId || !amount || amount <= 0) {
            return res.status(400).json(createErrorResponse('Customer ID and positive amount required', 400));
        }

        // Verify customer exists
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
            return res.status(404).json(createErrorResponse('Customer not found', 404));
        }

        // Check franchise access
        if (userInfo.role !== 'admin' && userInfo.franchiseId &&
            customer.franchiseId && customer.franchiseId !== userInfo.franchiseId) {
            return res.status(403).json(createErrorResponse('Access denied', 403));
        }

        const currentBalance = parseFloat(customer.creditBalance || '0');
        const description = reason || `Credit added${orderId ? ` for order ${orderId}` : ''}`;

        const result = await storage.addCustomerCredit(
            customerId,
            amount,  // Positive to increase balance
            'usage',
            description,
            orderId,
            userInfo.name || userInfo.id
        );

        // Log audit
        try {
            await storage.createAuditLog({
                employeeId: userInfo.id,
                action: 'credit_add',
                entityType: 'customer',
                entityId: customerId,
                details: {
                    amount,
                    reason,
                    orderId,
                    previousBalance: currentBalance,
                    newBalance: currentBalance + amount
                },
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown'
            });
        } catch (e) {
            console.error('Audit log error:', e);
        }

        res.json(createSuccessResponse({
            transaction: result,
            newBalance: currentBalance + amount,
            message: `Credit of ₹${amount} added successfully`
        }));

    } catch (error: any) {
        console.error('Add credit error:', error);
        res.status(500).json(createErrorResponse('Failed to add credit', 500));
    }
});

/**
 * POST /credits/adjustment
 * Admin adjustment (can add or remove credit)
 */
router.post('/adjustment', requireRole(ADMIN_ONLY), async (req: Request, res: Response) => {
    try {
        const { customerId, amount, reason } = req.body;
        const userInfo = getUserInfo(req);

        if (!customerId || amount === undefined) {
            return res.status(400).json(createErrorResponse('Customer ID and amount required', 400));
        }

        // Verify customer exists
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
            return res.status(404).json(createErrorResponse('Customer not found', 404));
        }

        const currentBalance = parseFloat(customer.creditBalance || '0');
        const description = reason || `Admin adjustment${amount > 0 ? ' (increase)' : ' (decrease)'}`;

        const result = await storage.addCustomerCredit(
            customerId,
            amount,
            'adjustment',
            description,
            undefined,
            userInfo.name || userInfo.id
        );

        // Log audit
        try {
            await storage.createAuditLog({
                employeeId: userInfo.id,
                action: 'credit_adjustment',
                entityType: 'customer',
                entityId: customerId,
                details: {
                    amount,
                    reason,
                    previousBalance: currentBalance,
                    newBalance: currentBalance + amount
                },
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown'
            });
        } catch (e) {
            console.error('Audit log error:', e);
        }

        res.json(createSuccessResponse({
            transaction: result,
            newBalance: currentBalance + amount,
            message: `Adjustment of ₹${amount} applied successfully`
        }));

    } catch (error: any) {
        console.error('Credit adjustment error:', error);
        res.status(500).json(createErrorResponse('Failed to apply adjustment', 500));
    }
});

/**
 * GET /credits/analytics
 * Get detailed credit analytics for dashboard
 */
router.get('/analytics', requireRole(CREDIT_VIEW_ROLES), async (req: Request, res: Response) => {
    try {
        const { role, franchiseId: userFranchiseId } = getUserInfo(req);
        const isAdmin = role === 'admin';

        // Get customers
        let customers = await storage.listCustomers();
        if (!isAdmin && userFranchiseId) {
            customers = customers.filter((c: any) =>
                !c.franchiseId || c.franchiseId === userFranchiseId
            );
        }

        // Get all credit history
        let allTransactions: any[] = [];
        for (const c of customers) {
            try {
                const history = await storage.getCustomerCreditHistory(c.id);
                allTransactions.push(...history.map((h: any) => ({
                    ...h,
                    customerId: c.id,
                    customerName: c.name
                })));
            } catch (e) { }
        }

        // Sort by date
        allTransactions.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Calculate trends (last 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentTransactions = allTransactions.filter((t: any) =>
            new Date(t.createdAt) >= thirtyDaysAgo
        );

        // Daily breakdown
        const dailyData: { [date: string]: { credited: number; paid: number } } = {};
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            dailyData[dateStr] = { credited: 0, paid: 0 };
        }

        recentTransactions.forEach((t: any) => {
            const dateStr = new Date(t.createdAt).toISOString().split('T')[0];
            const amount = parseFloat(t.amount || '0');
            if (dailyData[dateStr]) {
                if (amount > 0) {
                    dailyData[dateStr].credited += amount;
                } else {
                    dailyData[dateStr].paid += Math.abs(amount);
                }
            }
        });

        // Top debtors
        const topDebtors = customers
            .filter((c: any) => parseFloat(c.creditBalance || '0') > 0)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                balance: parseFloat(c.creditBalance || '0')
            }))
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);

        // Recent activity
        const recentActivity = allTransactions
            .slice(-10)
            .reverse()
            .map((t: any) => ({
                customerName: t.customerName,
                amount: parseFloat(t.amount || '0'),
                type: t.type,
                description: t.description,
                createdAt: t.createdAt
            }));

        res.json(createSuccessResponse({
            dailyData: Object.entries(dailyData)
                .map(([date, data]) => ({ date, ...data }))
                .reverse(),
            topDebtors,
            recentActivity,
            totalTransactions: allTransactions.length
        }));

    } catch (error: any) {
        console.error('Get analytics error:', error);
        res.status(500).json(createErrorResponse('Failed to get analytics', 500));
    }
});

export default router;
