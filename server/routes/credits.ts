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

const router = Router();

// Roles that can manage credits
const CREDIT_VIEW_ROLES: string[] = ['admin', 'store_manager', 'factory_manager', 'store_staff'];
const CREDIT_MANAGE_ROLES: string[] = ['admin', 'store_manager', 'store_staff'];
const ADMIN_ONLY: string[] = ['admin'];

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
            creditId: customer.id,
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
            req.employee?.id
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
            creditId: customerId,
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

        // Process the repayment using the robust RPC
        const recordedBy = req.employee?.id || null;
        const recordedByName = req.employee?.username || 'system';

        const result = await (storage as any).processCreditRepayment(
            customerId,
            paymentAmount, // Positive amount expected by RPC
            paymentMethod || 'CASH',
            recordedBy,
            recordedByName
        );

        if (!result.success) {
            throw new Error(result.error);
        }

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
            creditId: customerId,
            previousBalance: currentBalance,
            amountPaid: paymentAmount,
            newBalance: result.balanceAfter,
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
            amount, // Can be positive (add/increase) or negative (reduce/decrease)
            target, // "outstanding" or "credit_limit"
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
        const currentLimit = parseFloat(customer.creditLimit || '1000');
        const changeAmount = parseFloat(amount);
        const isLimitAdjustment = target === 'credit_limit';

        let result;
        let finalMessage = 'Credit adjusted successfully';
        let newBalance = currentBalance;
        let newLimit = currentLimit;

        if (isLimitAdjustment) {
            newLimit = currentLimit + changeAmount;
            if (newLimit < 0) {
                return res.status(400).json(createErrorResponse('Credit limit cannot be negative', 400));
            }
            // Update the limit directly on the customer record
            await storage.updateCustomer(customerId, {
                creditLimit: newLimit.toString()
            });

            // Do NOT insert a wallet ledger entry for limit changes — the wallet_transactions
            // table enforces a non-zero amount constraint, and limit changes don't affect
            // the customer's financial balance. The audit log below captures the change.
            result = {
                type: 'limit_adjustment',
                previousLimit: currentLimit,
                newLimit: newLimit,
                description: `Limit Updated: ₹${currentLimit} ➔ ₹${newLimit}. ${reason}${notes ? ` - ${notes}` : ''}`,
            };
            finalMessage = 'Credit limit updated successfully';
        } else {
            // Standard outstanding balance adjustment
            newBalance = currentBalance + changeAmount;
            if (newBalance < 0) {
                return res.status(400).json(createErrorResponse('Outstanding balance cannot be negative', 400));
            }
            const description = `Manual Adjustment: ${reason}${notes ? ` - ${notes}` : ''}`;
            result = await storage.addCustomerCredit(
                customerId,
                changeAmount,
                'adjustment',
                description,
                undefined,
                req.employee?.id
            );
        }

        // Log the action (important for admin adjustments)
        if (req.employee) {
            await AuthService.logAction(
                req.employee.employeeId,
                req.employee.username,
                isLimitAdjustment ? 'update_customer_limit' : 'adjust_customer_credit',
                'customer',
                customerId,
                {
                    amount: changeAmount,
                    target: target || 'outstanding',
                    reason,
                    notes,
                    previousBalance: currentBalance,
                    newBalance: newBalance,
                    previousLimit: currentLimit,
                    newLimit: newLimit
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(createSuccessResponse({
            message: finalMessage,
            creditId: customerId,
            previousBalance: currentBalance,
            adjustment: changeAmount,
            newBalance: newBalance,
            previousLimit: currentLimit,
            newLimit: newLimit,
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
router.get('/report/outstanding', requireRole(CREDIT_VIEW_ROLES), async (req, res) => {
    try {
        const employee = req.employee;
        let franchiseId: string | undefined = undefined;

        // Apply franchise isolation for non-admin users
        if (employee && employee.role !== 'admin') {
            franchiseId = (employee as any).franchiseId;
        }


        // Support pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;

        // Use optimized query to get only customers with credit
        const { 
            customers: paginatedCustomers, 
            totalCount, 
            totalOutstanding,
            prepaidCount,
            totalPrepaid,
            riskCount 
        } = await (storage as any).getCustomersWithOutstandingCredit(franchiseId, page, limit);

        res.json(createSuccessResponse({
            totalCustomers: totalCount,
            totalOutstanding,
            prepaidCount,
            totalPrepaid,
            riskCount,
            page,
            limit,
            customers: paginatedCustomers.map((c: any) => ({
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

/**
 * GET /credits/history
 * Get recent credit activity across all customers
 */
router.get('/history', requireRole(CREDIT_VIEW_ROLES), async (req, res) => {
    try {
        const history = await storage.getGlobalCreditHistory(50);
        res.json(createSuccessResponse(history));
    } catch (error: any) {
        console.error('Get global credit history error:', error);
        res.status(500).json(createErrorResponse('Failed to get credit history', 500));
    }
});

export default router;
