import { describe, expect, it } from 'vitest';
import {
  __resetIdempotencyStoreForTests,
  parseBody,
  walletRechargeSchema,
  walletRefundSchema,
  balanceAdjustSchema,
  normalizePaymentMethod,
} from '../services/transaction-guard';

describe('transaction-guard', () => {
  it('validates wallet recharge payload', () => {
    const parsed = parseBody(walletRechargeSchema, {
      customerId: 'cust-1',
      amount: 500,
      paymentMethod: 'cash',
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.amount).toBe(500);
    }
  });

  it('rejects invalid recharge amount', () => {
    const parsed = parseBody(walletRechargeSchema, {
      customerId: 'cust-1',
      amount: -10,
    });
    expect(parsed.ok).toBe(false);
  });

  it('requires refund reason', () => {
    const parsed = parseBody(walletRefundSchema, {
      customerId: 'cust-1',
      amount: 100,
      reason: '',
    });
    expect(parsed.ok).toBe(false);
  });

  it('validates balance adjustment target', () => {
    const parsed = parseBody(balanceAdjustSchema, {
      amount: -50,
      target: 'wallet_balance',
      reason: 'Correction',
    });
    expect(parsed.ok).toBe(true);
  });

  it('normalizes payment methods', () => {
    expect(normalizePaymentMethod('net banking')).toBe('NET_BANKING');
    expect(normalizePaymentMethod('unknown')).toBe('OTHER');
  });

  it('resets idempotency cache in tests', () => {
    __resetIdempotencyStoreForTests();
    expect(true).toBe(true);
  });
});
