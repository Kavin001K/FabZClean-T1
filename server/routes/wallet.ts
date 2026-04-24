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

// Only authenticated store/admin roles can perform external top-ups
const WALLET_MANAGE_ROLES = ['admin', 'store_manager', 'store_staff'];
const WALLET_READ_ROLES = ['admin', 'store_manager', 'store_staff', 'factory_manager'];

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
        const recordedBy = req.employee?.id || null;
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

/**
 * POST /api/wallet/refund
 * Refund a customer via Wallet, Cash, Bank Transfer, etc.
 */
router.post('/refund', requireRole(WALLET_MANAGE_ROLES), async (req, res) => {
    try {
        const { customerId, amount, refundMethod, reason, notes, orderId } = req.body;

        if (!customerId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json(createErrorResponse('Valid customerId and positive amount are required', 400));
        }

        const refundAmount = parseFloat(amount);
        const recordedBy = req.employee?.id || null;
        const recordedByName = req.employee?.username || 'system';
        const method = refundMethod?.toLowerCase() || 'cash';

        if (method === 'wallet') {
            // Using ACID-compliant RPC method to increase wallet balance
            const result = await (storage as any).processWalletRecharge(
                customerId,
                refundAmount,
                'WALLET_REFUND',
                recordedBy,
                recordedByName
            );

            if (!result.success) {
                throw new Error(result.error);
            }
            
            // Also log in transactions for refund tracking
            await (storage as any).processRefundOut(
                customerId, 
                refundAmount, 
                'WALLET', 
                reason || 'Wallet Refund', 
                orderId
            );

            // Log the action
            if (req.employee) {
                await AuthService.logAction(
                    req.employee.employeeId,
                    req.employee.username,
                    'wallet_refund',
                    'customer',
                    customerId,
                    {
                        amount: refundAmount,
                        paymentMethod: 'WALLET',
                        newBalance: result.newBalance,
                        reason,
                        notes,
                        orderId
                    },
                    req.ip || req.connection.remoteAddress,
                    req.get('user-agent')
                );
            }

            res.json(createSuccessResponse({ newBalance: result.newBalance }, 'Refund processed to wallet successfully'));
        } else {
            // Cash, Bank Transfer, UPI, etc (Money leaving the system)
            let formattedMethod = 'CASH';
            if (method === 'upi') formattedMethod = 'UPI';
            if (method === 'bank_transfer') formattedMethod = 'BANK_TRANSFER';
            
            const result = await (storage as any).processRefundOut(
                customerId,
                refundAmount,
                formattedMethod,
                reason,
                orderId
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            // Log the action
            if (req.employee) {
                await AuthService.logAction(
                    req.employee.employeeId,
                    req.employee.username,
                    'external_refund',
                    'customer',
                    customerId,
                    {
                        amount: refundAmount,
                        paymentMethod: formattedMethod,
                        reason,
                        notes,
                        orderId
                    },
                    req.ip || req.connection.remoteAddress,
                    req.get('user-agent')
                );
            }

            res.json(createSuccessResponse({}, 'External refund processed successfully'));
        }
    } catch (error: any) {
        console.error('Wallet refund error:', error);
        res.status(500).json(createErrorResponse(`Failed to process refund: ${error.message}`, 500));
    }
});

/**
 * GET /api/wallet/refunds/:orderId
 * Get total refunded amount for an order
 */
router.get('/refunds/:orderId', requireRole(WALLET_READ_ROLES), async (req, res) => {
    try {
        const { orderId } = req.params;
        const { data, error } = await (storage as any).supabase
            .from('transactions')
            .select('amount')
            .eq('order_id', orderId)
            .eq('type', 'ORDER_REFUND')
            .eq('status', 'SUCCESS');

        if (error) throw error;

        const totalRefunded = data.reduce((sum: number, row: any) => sum + parseFloat(row.amount || 0), 0);
        res.json(createSuccessResponse({ totalRefunded }, 'Total refunded amount fetched successfully'));
    } catch (error: any) {
        console.error('Fetch refunded amount error:', error);
        res.status(500).json(createErrorResponse(`Failed to fetch refunded amount: ${error.message}`, 500));
    }
});

export default router;
