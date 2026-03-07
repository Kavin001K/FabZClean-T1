/**
 * Wallet Management Routes
 *
 * Handles all wallet recharge and related operations.
 */

import { Router } from 'express';
import { db as storage } from '../db';
import { jwtRequired, requireRole } from '../middleware/auth';
import { createSuccessResponse, createErrorResponse } from '../services/serialization';
import { AuthService } from '../auth-service';

const router = Router();

// Only staff and admins can perform external top-ups
const WALLET_MANAGE_ROLES = ['admin', 'staff'];

router.use(jwtRequired);

/**
 * POST /api/wallet/recharge
 * Top up a customer's wallet balance (Workflow A)
 */
router.post('/recharge', requireRole(WALLET_MANAGE_ROLES), async (req, res) => {
    try {
        const { customerId, amount, paymentMethod } = req.body;

        if (!customerId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json(createErrorResponse('Valid customerId and positive amount are required', 400));
        }

        const rechargeAmount = parseFloat(amount);
        const recordedBy = req.employee?.id || 'system';
        const recordedByName = req.employee?.username || 'system';

        // Using ACID-compliant RPC method in SupabaseStorage
        // This handles: Customer balance update, transactions insert, and credit_transactions insert all at once.
        const result = await (storage as any).processWalletRecharge(
            customerId,
            rechargeAmount,
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
                'wallet_recharge',
                'customer',
                customerId,
                {
                    amount: rechargeAmount,
                    paymentMethod,
                    newBalance: result.newBalance
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(createSuccessResponse({ newBalance: result.newBalance }, 'Wallet recharged successfully'));
    } catch (error: any) {
        console.error('Wallet recharge error:', error);
        res.status(500).json(createErrorResponse(`Failed to recharge wallet: ${error.message}`, 500));
    }
});

export default router;
