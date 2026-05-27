/**
 * Wallet Management Routes
 *
 * Handles wallet recharge, refunds, and related ledger operations.
 */

import { Router } from 'express';
import { db as storage } from '../db';
import { jwtRequired, requireRole } from '../middleware/auth';
import { createSuccessResponse, createErrorResponse } from '../services/serialization';
import { AuthService } from '../auth-service';
import {
  idempotencyMiddleware,
  normalizePaymentMethod,
  getParseErrorMessage,
  parseBody,
  walletRechargeSchema,
  walletRefundSchema,
} from '../services/transaction-guard';

const router = Router();

const WALLET_MANAGE_ROLES = ['admin', 'store_manager', 'store_staff'];
const WALLET_READ_ROLES = ['admin', 'store_manager', 'store_staff', 'factory_manager'];

router.use(jwtRequired);

/**
 * POST /api/wallet/recharge
 * Top up a customer's wallet balance
 */
router.post('/recharge', requireRole(WALLET_MANAGE_ROLES), idempotencyMiddleware('wallet:recharge'), async (req, res) => {
    try {
        const parsed = parseBody(walletRechargeSchema, req.body);
        if (parsed.ok === false) {
            return res.status(400).json(createErrorResponse(getParseErrorMessage(parsed), 400));
        }

        const { customerId, amount, paymentMethod, referenceNumber, notes } = parsed.data;
        const normalizedMethod = normalizePaymentMethod(paymentMethod);
        const recordedBy = req.employee?.id || null;
        const recordedByName = req.employee?.username || 'system';

        const result = await (storage as any).processWalletRecharge(
            customerId,
            amount,
            normalizedMethod,
            recordedBy,
            recordedByName,
            {
                referenceNumber: referenceNumber || undefined,
                notes: notes || undefined,
            }
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        if (req.employee) {
            await AuthService.logAction(
                req.employee.employeeId,
                req.employee.username,
                'wallet_recharge',
                'customer',
                customerId,
                {
                    amount,
                    paymentMethod: normalizedMethod,
                    referenceNumber: referenceNumber || null,
                    newBalance: result.newBalance,
                    transactionId: result.transactionId,
                    correlationId: req.correlationId,
                },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(createSuccessResponse({
            newBalance: result.newBalance,
            balanceBefore: result.balanceBefore,
            transactionId: result.transactionId,
            id: result.id,
            entryNo: result.entryNo,
            paymentMethod: result.paymentMethod || normalizedMethod,
            amount: result.amount ?? amount,
        }, 'Wallet recharged successfully'));
    } catch (error: any) {
        console.error(JSON.stringify({ level: 'error', event: 'wallet_recharge_failed', correlationId: req.correlationId, message: error.message }));
        res.status(500).json(createErrorResponse(`Failed to recharge wallet: ${error.message}`, 500));
    }
});

/**
 * POST /api/wallet/refund
 * Refund a customer via Wallet, Cash, Bank Transfer, etc.
 */
router.post('/refund', requireRole(WALLET_MANAGE_ROLES), idempotencyMiddleware('wallet:refund'), async (req, res) => {
    try {
        const parsed = parseBody(walletRefundSchema, req.body);
        if (parsed.ok === false) {
            return res.status(400).json(createErrorResponse(getParseErrorMessage(parsed), 400));
        }

        const { customerId, amount, refundMethod, reason, notes, orderId } = parsed.data;
        const recordedBy = req.employee?.id || null;
        const recordedByName = req.employee?.username || 'system';
        const method = refundMethod?.toLowerCase() || 'cash';

        if (method === 'wallet') {
            const result = await (storage as any).processWalletRecharge(
                customerId,
                amount,
                'WALLET_REFUND',
                recordedBy,
                recordedByName,
                { notes: [reason, notes].filter(Boolean).join(' — ') || undefined }
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            await (storage as any).processRefundOut(
                customerId,
                amount,
                'WALLET',
                reason || 'Wallet Refund',
                orderId
            );

            if (req.employee) {
                await AuthService.logAction(
                    req.employee.employeeId,
                    req.employee.username,
                    'wallet_refund',
                    'customer',
                    customerId,
                    {
                        amount,
                        paymentMethod: 'WALLET',
                        newBalance: result.newBalance,
                        reason,
                        notes,
                        orderId,
                        correlationId: req.correlationId,
                    },
                    req.ip || req.connection.remoteAddress,
                    req.get('user-agent')
                );
            }

            res.json(createSuccessResponse({ newBalance: result.newBalance }, 'Refund processed to wallet successfully'));
        } else {
            let formattedMethod = 'CASH';
            if (method === 'upi') formattedMethod = 'UPI';
            if (method === 'bank_transfer') formattedMethod = 'BANK_TRANSFER';

            const result = await (storage as any).processRefundOut(
                customerId,
                amount,
                formattedMethod,
                reason,
                orderId
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            if (req.employee) {
                await AuthService.logAction(
                    req.employee.employeeId,
                    req.employee.username,
                    'external_refund',
                    'customer',
                    customerId,
                    {
                        amount,
                        paymentMethod: formattedMethod,
                        reason,
                        notes,
                        orderId,
                        correlationId: req.correlationId,
                    },
                    req.ip || req.connection.remoteAddress,
                    req.get('user-agent')
                );
            }

            res.json(createSuccessResponse({}, 'External refund processed successfully'));
        }
    } catch (error: any) {
        console.error(JSON.stringify({ level: 'error', event: 'wallet_refund_failed', correlationId: req.correlationId, message: error.message }));
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
