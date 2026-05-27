import { authorizedFetch } from '@/lib/data-service';
import type { WalletLedgerEntry } from '@/lib/wallet-ledger';

export const WALLET_QUERY_KEYS = {
  customers: ['wallet-management', 'customers'] as const,
  history: (customerId: string) => ['wallet', 'history', customerId] as const,
};

export const WALLET_PAYMENT_METHODS = [
  { id: 'CASH', name: 'Cash' },
  { id: 'UPI', name: 'UPI' },
  { id: 'CARD', name: 'Card' },
  { id: 'NET_BANKING', name: 'Net Banking' },
  { id: 'CHEQUE', name: 'Cheque' },
  { id: 'OTHER', name: 'Other' },
] as const;

export type WalletPaymentMethodId = (typeof WALLET_PAYMENT_METHODS)[number]['id'];

export const WALLET_MANAGE_ROLES = ['admin', 'store_manager', 'store_staff'] as const;

export function canManageWallet(role?: string | null): boolean {
  return !!role && WALLET_MANAGE_ROLES.includes(role as (typeof WALLET_MANAGE_ROLES)[number]);
}

export type WalletRechargeResult = {
  newBalance: number;
  balanceBefore?: number;
  transactionId?: string;
  id?: string;
  entryNo?: string | number | null;
  paymentMethod?: string;
  amount?: number;
};

async function parseApiResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.message || payload?.error?.message || fallbackError);
  }
  return (payload?.data ?? payload) as T;
}

export function normalizePaymentMethod(value: string): WalletPaymentMethodId {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
  const match = WALLET_PAYMENT_METHODS.find((method) => method.id === normalized);
  return match?.id ?? 'OTHER';
}

function createIdempotencyKey(scope: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${scope}-${crypto.randomUUID()}`;
  }
  return `${scope}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function withIdempotency(scope: string, init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', createIdempotencyKey(scope));
  }
  return { ...init, headers };
}

export async function rechargeWallet(params: {
  customerId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  idempotencyKey?: string;
}): Promise<WalletRechargeResult> {
  const res = await authorizedFetch('/wallet/recharge', withIdempotency('wallet-recharge', {
    method: 'POST',
    body: JSON.stringify({
      customerId: params.customerId,
      amount: params.amount,
      paymentMethod: normalizePaymentMethod(params.paymentMethod),
      referenceNumber: params.referenceNumber,
      notes: params.notes,
    }),
  }));
  return parseApiResponse<WalletRechargeResult>(res, 'Failed to recharge wallet');
}

export async function refundWallet(params: {
  customerId: string;
  amount: number;
  refundMethod: string;
  reason: string;
  notes?: string;
  orderId?: string;
}) {
  const res = await authorizedFetch('/wallet/refund', withIdempotency('wallet-refund', {
    method: 'POST',
    body: JSON.stringify(params),
  }));
  return parseApiResponse<{ newBalance?: number }>(res, 'Failed to issue refund');
}

export async function payCredit(params: {
  customerId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}) {
  const res = await authorizedFetch(`/credits/${params.customerId}/payment`, withIdempotency('credit-payment', {
    method: 'POST',
    body: JSON.stringify({
      amount: params.amount,
      paymentMethod: normalizePaymentMethod(params.paymentMethod),
      referenceNumber: params.referenceNumber,
      notes: params.notes,
    }),
  }));
  return parseApiResponse(res, 'Failed to record credit payment');
}

export async function adjustBalance(params: {
  customerId: string;
  amount: number;
  target: 'outstanding' | 'wallet_balance' | 'credit_limit';
  reason: string;
  notes?: string;
}) {
  const res = await authorizedFetch(`/credits/${params.customerId}/adjust`, withIdempotency('balance-adjust', {
    method: 'POST',
    body: JSON.stringify(params),
  }));
  return parseApiResponse(res, 'Failed to adjust balance');
}

export async function fetchWalletHistory(customerId: string, limit = 100): Promise<WalletLedgerEntry[]> {
  const res = await authorizedFetch(`/customers/${customerId}/wallet-history?limit=${limit}`);
  const payload = await parseApiResponse<WalletLedgerEntry[]>(res, 'Failed to load wallet history');
  return Array.isArray(payload) ? payload : [];
}

export async function fetchRefundedAmount(orderId: string): Promise<number> {
  const res = await authorizedFetch(`/wallet/refunds/${orderId}`);
  const payload = await parseApiResponse<{ totalRefunded?: number }>(res, 'Failed to load refund total');
  return Number(payload?.totalRefunded ?? 0);
}

export async function fetchCustomerOrders(customerId: string) {
  const res = await authorizedFetch(`/orders/customer/${customerId}`);
  const payload = await parseApiResponse<{ data?: unknown[] } | unknown[]>(res, 'Failed to load orders');
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
}

export function invalidateWalletQueries(
  queryClient: { invalidateQueries: (opts: { queryKey: readonly string[] }) => void },
  customerId?: string
) {
  queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.customers });
  queryClient.invalidateQueries({ queryKey: ['customers'] });
  queryClient.invalidateQueries({ queryKey: ['credits'] });
  if (customerId) {
    queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.history(customerId) });
  }
}
