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

const router = Router();

const WALLET_MANAGE_ROLES = ['admin', 'store_manager', 'store_staff'];
const WALLET_READ_ROLES = ['admin', 'store_manager', 'store_staff', 'factory_manager'];

router.use(jwtRequired);

function normalizePaymentMethod(value: unknown): string {
  const raw = String(value || 'CASH').trim().toUpperCase().replace(/\s+/g, '_');
  const allowed = new Set([
    'CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER',
    'WALLET_REFUND', 'WALLET_ADJUSTMENT',
  ]);
  return allowed.has(raw) ? raw : 'OTHER';
}

/**
 * POST /api/wallet/recharge
 * Top up a customer's wallet balance
 */
router.post('/recharge', requireRole(WALLET_MANAGE_ROLES), async (req, res) => {
    try {
        const { customerId, amount, paymentMethod, referenceNumber, notes } = req.body;

        if (!customerId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json(createErrorResponse('Valid customerId and positive amount are required', 400));
        }

        const rechargeAmount = parseFloat(amount);
        const normalizedMethod = normalizePaymentMethod(paymentMethod);
        const recordedBy = req.employee?.id || null;
        const recordedByName = req.employee?.username || 'system';

        const result = await (storage as any).processWalletRecharge(
            customerId,
            rechargeAmount,
            normalizedMethod,
            recordedBy,
            recordedByName,
            {
                referenceNumber: referenceNumber ? String(referenceNumber).trim() : undefined,
                notes: notes ? String(notes).trim() : undefined,
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
                    amount: rechargeAmount,
                    paymentMethod: normalizedMethod,
                    referenceNumber: referenceNumber || null,
                    newBalance: result.newBalance,
                    transactionId: result.transactionId,
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
            amount: result.amount ?? rechargeAmount,
        }, 'Wallet recharged successfully'));
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
            const result = await (storage as any).processWalletRecharge(
                customerId,
                refundAmount,
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
                refundAmount,
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
                        amount: refundAmount,
                        paymentMethod: 'WALLET',
                        newBalance: result.newBalance,
                        reason,
                        notes,
                        orderId,
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
                refundAmount,
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
                        amount: refundAmount,
                        paymentMethod: formattedMethod,
                        reason,
                        notes,
                        orderId,
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
