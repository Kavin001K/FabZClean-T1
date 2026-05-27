export type WalletLedgerEntry = {
  id?: string;
  transactionId?: string;
  entryNo?: string | number | null;
  transactionType?: string;
  type?: string;
  amount?: number | string;
  balanceBefore?: number | string;
  balanceAfter?: number | string;
  paymentMethod?: string | null;
  referenceId?: string | null;
  referenceNumber?: string | null;
  orderId?: string | null;
  note?: string | null;
  description?: string | null;
  notes?: string | null;
  reason?: string | null;
  createdAt?: string | null;
  transactionDate?: string | null;
  recordedByName?: string | null;
};

export function toLedgerNumber(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function getLedgerDirection(tx: WalletLedgerEntry) {
  const rawAmount = toLedgerNumber(tx?.amount, 0);
  const transactionType = String(tx?.transactionType || tx?.type || '').toUpperCase();
  const normalizedLegacyType = String(tx?.type || '').toLowerCase();

  const isCredit =
    transactionType === 'CREDIT' ||
    normalizedLegacyType === 'credit' ||
    normalizedLegacyType === 'deposit' ||
    (transactionType !== 'DEBIT' && rawAmount > 0);

  return {
    isCredit,
    absoluteAmount: Math.abs(rawAmount),
    signedAmount: isCredit ? Math.abs(rawAmount) : -Math.abs(rawAmount),
  };
}

export function formatPaymentMethodLabel(method?: string | null): string {
  if (!method) return 'SYSTEM';
  return method.replace(/_/g, ' ');
}
