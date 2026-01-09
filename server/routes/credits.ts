/**
 * Customer Credit Management Routes
 * 
 * Handles all credit-related operations:
 * - View customer credit balance and history
 * - Record credit payments (settlements)
 * - Adjust credits (admin only)
 * - Credit reports
 */

import { Router } from 'express';
import { db as storage } from '../db';
import { jwtRequired, requireRole } from '../middleware/auth';
import { createSuccessResponse, createErrorResponse } from '../services/serialization';
import { AuthService } from '../auth-service';
import type { UserRole } from '../../shared/supabase';

const router = Router();

// Roles that can manage credits
const CREDIT_VIEW_ROLES: UserRole[] = ['admin', 'factory_manager', 'franchise_manager', 'employee'];
const CREDIT_MANAGE_ROLES: UserRole[] = ['admin', 'factory_manager', 'franchise_manager'];
const ADMIN_ONLY: UserRole[] = ['admin'];

// Apply JWT authentication to all routes
router.use(jwtRequired);

/**
 * GET /credits/:customerId
 * Get customer credit details including balance and history
 */
router.get('/:customerId', requireRole(CREDIT_VIEW_ROLES), async (req, res) => {
    try {
        const { customerId } = req.params;
        const customer = await storage.getCustomer(customerId);

        if (!customer) {
            return res.status(404).json(createErrorResponse('Customer not found', 404));
        }

        // Get credit history
        const creditHistory = await storage.getCustomerCreditHistory(customerId);

        // Calculate summary stats
        const totalCredited = creditHistory
            .filter((t: any) => t.type === 'credit' || t.type === 'usage')
            .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

        const totalPaid = creditHistory
            .filter((t: any) => t.type === 'payment' || t.type === 'deposit')
            .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || '0')), 0);

        const pendingBalance = parseFloat(customer.creditBalance || '0');

        res.json(createSuccessResponse({
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
            },
            creditBalance: pendingBalance,
            summary: {
                totalCredited,
                totalPaid,
                pendingBalance,
            },
            history: creditHistory.slice(0, 100), // Limit to last 100 transactions
        }));
    } catch (error: any) {
        console.error('Get customer credit error:', error);
        res.status(500).json(createErrorResponse('Failed to get credit details', 500));
    }
});

/**
 * POST /credits/:customerId/add
 * Add credit to customer (when marking order as credit payment)
 */
router.post('/:customerId/add', requireRole(CREDIT_MANAGE_ROLES), async (req, res) => {
    try {
        const { customerId } = req.params;
        const {
            amount,
            orderId,
            orderNumber,
            reason,
            notes
        } = req.body;

        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json(createErrorResponse('Valid amount is required', 400));
        }

        const customer = await storage.getCustomer(customerId);
        if (!customer) {
            return res.status(404).json(createErrorResponse('Customer not found', 404));
        }

        const creditAmount = parseFloat(amount);
        const description = reason || (orderNumber ? `Order ${orderNumber} placed on credit` : 'Credit added');

        // Add to credit balance
        const result = await storage.addCustomerCredit(
            customerId,
            creditAmount,
            'credit',
            description,
            orderId,
            req.employee?.employeeId
        );

        // Log the action
        if (req.employee) {
            await AuthService.logAction(
                req.employee.employeeId,
                req.employee.username,
                'add_customer_credit',
                'customer',
                customerId,
                {
                    amount: creditAmount,
                    orderId,
                    orderNumber,
                    reason: description
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(createSuccessResponse({
            message: 'Credit added successfully',
            newBalance: result.balanceAfter,
            transaction: result
        }));
    } catch (error: any) {
        console.error('Add credit error:', error);
        res.status(500).json(createErrorResponse(`Failed to add credit: ${error.message}`, 500));
    }
});

/**
 * POST /credits/:customerId/payment
 * Record a credit payment (customer settling their dues)
 */
router.post('/:customerId/payment', requireRole(CREDIT_MANAGE_ROLES), async (req, res) => {
    try {
        const { customerId } = req.params;
        const {
            amount,
            paymentMethod,
            referenceNumber,
            notes
        } = req.body;

        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json(createErrorResponse('Valid amount is required', 400));
        }

        const customer = await storage.getCustomer(customerId);
        if (!customer) {
            return res.status(404).json(createErrorResponse('Customer not found', 404));
        }

        const currentBalance = parseFloat(customer.creditBalance || '0');
        const paymentAmount = parseFloat(amount);

        // Use negative amount to reduce credit balance
        const description = `Payment received${paymentMethod ? ` via ${paymentMethod}` : ''}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`;

        const result = await storage.addCustomerCredit(
            customerId,
            -paymentAmount, // Negative to reduce balance
            'payment',
            description,
            referenceNumber,
            req.employee?.employeeId
        );

        // Log the action
        if (req.employee) {
            await AuthService.logAction(
                req.employee.employeeId,
                req.employee.username,
                'record_credit_payment',
                'customer',
                customerId,
                {
                    amount: paymentAmount,
                    paymentMethod,
                    referenceNumber,
                    previousBalance: currentBalance,
                    newBalance: currentBalance - paymentAmount
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(createSuccessResponse({
            message: 'Payment recorded successfully',
            previousBalance: currentBalance,
            amountPaid: paymentAmount,
            newBalance: currentBalance - paymentAmount,
            transaction: result
        }));
    } catch (error: any) {
        console.error('Record payment error:', error);
        res.status(500).json(createErrorResponse(`Failed to record payment: ${error.message}`, 500));
    }
});

/**
 * POST /credits/:customerId/adjust
 * Adjust credit balance (admin only - for corrections/disputes)
 */
router.post('/:customerId/adjust', requireRole(ADMIN_ONLY), async (req, res) => {
    try {
        const { customerId } = req.params;
        const {
            amount, // Can be positive (add credit) or negative (reduce credit)
            reason,
            notes
        } = req.body;

        if (amount === undefined || isNaN(parseFloat(amount))) {
            return res.status(400).json(createErrorResponse('Valid amount is required', 400));
        }

        if (!reason) {
            return res.status(400).json(createErrorResponse('Reason is required for adjustments', 400));
        }

        const customer = await storage.getCustomer(customerId);
        if (!customer) {
            return res.status(404).json(createErrorResponse('Customer not found', 404));
        }

        const currentBalance = parseFloat(customer.creditBalance || '0');
        const adjustmentAmount = parseFloat(amount);
        const description = `Credit adjustment: ${reason}${notes ? ` - ${notes}` : ''}`;

        const result = await storage.addCustomerCredit(
            customerId,
            adjustmentAmount,
            'adjustment',
            description,
            undefined,
            req.employee?.employeeId
        );

        // Log the action (important for admin adjustments)
        if (req.employee) {
            await AuthService.logAction(
                req.employee.employeeId,
                req.employee.username,
                'adjust_customer_credit',
                'customer',
                customerId,
                {
                    amount: adjustmentAmount,
                    reason,
                    notes,
                    previousBalance: currentBalance,
                    newBalance: currentBalance + adjustmentAmount
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(createSuccessResponse({
            message: 'Credit adjusted successfully',
            previousBalance: currentBalance,
            adjustment: adjustmentAmount,
            newBalance: currentBalance + adjustmentAmount,
            transaction: result
        }));
    } catch (error: any) {
        console.error('Adjust credit error:', error);
        res.status(500).json(createErrorResponse(`Failed to adjust credit: ${error.message}`, 500));
    }
});

/**
 * GET /credits/report/outstanding
 * Get all customers with outstanding credit balances
 */
router.get('/report/outstanding', requireRole(CREDIT_MANAGE_ROLES), async (req, res) => {
    try {
        const employee = req.employee;
        let franchiseId: string | undefined = undefined;

        // Apply franchise isolation for non-admin users
        if (employee && employee.role !== 'admin' && employee.role !== 'factory_manager') {
            franchiseId = employee.franchiseId;
        }

        const customers = await storage.listCustomers();

        // Filter customers with positive credit balance
        let customersWithCredit = customers.filter((c: any) =>
            parseFloat(c.creditBalance || '0') > 0
        );

        // Apply franchise filter if needed
        if (franchiseId) {
            customersWithCredit = customersWithCredit.filter((c: any) =>
                c.franchiseId === franchiseId
            );
        }

        // Sort by credit balance (highest first)
        customersWithCredit.sort((a: any, b: any) =>
            parseFloat(b.creditBalance || '0') - parseFloat(a.creditBalance || '0')
        );

        // Calculate totals
        const totalOutstanding = customersWithCredit.reduce(
            (sum: number, c: any) => sum + parseFloat(c.creditBalance || '0'),
            0
        );

        res.json(createSuccessResponse({
            totalCustomers: customersWithCredit.length,
            totalOutstanding,
            customers: customersWithCredit.map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                creditBalance: parseFloat(c.creditBalance || '0'),
                totalOrders: c.totalOrders || 0,
                lastOrder: c.lastOrder
            }))
        }));
    } catch (error: any) {
        console.error('Get outstanding credit report error:', error);
        res.status(500).json(createErrorResponse('Failed to get credit report', 500));
    }
});

export default router;
