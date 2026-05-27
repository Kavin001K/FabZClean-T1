import { LRUCache } from 'lru-cache';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const IDEMPOTENCY_HEADER = 'idempotency-key';

type CachedResponse = {
  statusCode: number;
  body: unknown;
};

const idempotencyStore = new LRUCache<string, CachedResponse>({
  max: 2000,
  ttl: 1000 * 60 * 10,
});

const PAYMENT_METHODS = [
  'CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'NET_BANKING', 'OTHER',
  'WALLET_REFUND', 'WALLET_ADJUSTMENT',
] as const;

export function getIdempotencyKey(req: Request): string | null {
  const raw = req.header(IDEMPOTENCY_HEADER);
  if (!raw) return null;
  const key = raw.trim();
  if (key.length < 8 || key.length > 128) return null;
  return key;
}

export function idempotencyMiddleware(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = getIdempotencyKey(req);
    if (!key) return next();

    const actorId = (req as any).employee?.id || 'anonymous';
    const cacheKey = `${scope}:${actorId}:${key}`;
    const cached = idempotencyStore.get(cacheKey);
    if (cached) {
      return res.status(cached.statusCode).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = function storeAndSend(body: unknown) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        idempotencyStore.set(cacheKey, { statusCode: res.statusCode, body });
      }
      return originalJson(body);
    };

    next();
  };
}

export type ParseBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): ParseBodyResult<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ') || 'Invalid request body';
    return { ok: false, message };
  }
  return { ok: true, data: parsed.data };
}

export function getParseErrorMessage<T>(result: ParseBodyResult<T>): string {
  return result.ok === false ? result.message : 'Invalid request body';
}

export const walletRechargeSchema = z.object({
  customerId: z.string().trim().min(1, 'customerId is required'),
  amount: z.coerce.number().positive('amount must be positive').max(1_000_000, 'amount exceeds limit'),
  paymentMethod: z.string().trim().optional(),
  referenceNumber: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const walletRefundSchema = z.object({
  customerId: z.string().trim().min(1, 'customerId is required'),
  amount: z.coerce.number().positive('amount must be positive').max(1_000_000, 'amount exceeds limit'),
  refundMethod: z.string().trim().optional(),
  reason: z.string().trim().min(1, 'reason is required').max(200),
  notes: z.string().trim().max(500).optional(),
  orderId: z.string().trim().max(100).optional(),
});

export const creditPaymentSchema = z.object({
  amount: z.coerce.number().positive('amount must be positive').max(1_000_000, 'amount exceeds limit'),
  paymentMethod: z.string().trim().optional(),
  referenceNumber: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const balanceAdjustSchema = z.object({
  amount: z.coerce.number().refine((value) => value !== 0, 'amount cannot be zero'),
  target: z.enum(['outstanding', 'wallet_balance', 'credit_limit']),
  reason: z.string().trim().min(1, 'reason is required').max(200),
  notes: z.string().trim().max(500).optional(),
});

export function normalizePaymentMethod(value: unknown, fallback = 'CASH'): string {
  const raw = String(value || fallback).trim().toUpperCase().replace(/\s+/g, '_');
  return (PAYMENT_METHODS as readonly string[]).includes(raw) ? raw : 'OTHER';
}

export function __resetIdempotencyStoreForTests() {
  idempotencyStore.clear();
}
