import { browserPrint } from '@/lib/print-service';
import { formatPaymentMethodLabel, getLedgerDirection, type WalletLedgerEntry } from '@/lib/wallet-ledger';

export type WalletReceiptCustomer = {
  name: string;
  phone?: string | null;
  email?: string | null;
};

export type WalletTopUpReceiptData = {
  customer: WalletReceiptCustomer;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
  balanceBefore?: number;
  balanceAfter?: number;
  transactionId?: string | null;
  entryNo?: string | number | null;
  staffName?: string | null;
  createdAt?: string | Date;
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toFixed(2)}`;
}

function formatDateTime(value?: string | Date | null): string {
  if (!value) return new Date().toLocaleString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toLocaleString() : date.toLocaleString();
}

function buildReceiptHtml(options: {
  title: string;
  customer: WalletReceiptCustomer;
  rows: Array<{ label: string; value: string }>;
  amountLabel: string;
  amountValue: string;
  amountClass: 'credit' | 'debit';
  balanceAfter?: number;
  footerNote?: string;
  transactionId?: string | null;
}) {
  const { title, customer, rows, amountLabel, amountValue, amountClass, balanceAfter, footerNote, transactionId } = options;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: auto; margin: 5mm; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      color: #1a1a1a;
      background: #fff;
    }
    .receipt {
      max-width: 80mm;
      margin: 0 auto;
      padding: 15px;
      border: 1px dashed #ccc;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -1px; margin: 0; }
    .title { font-size: 14px; text-transform: uppercase; font-weight: 600; margin-top: 5px; color: #666; }
    .customer-box {
      background: #f9fafb;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-size: 13px;
    }
    .customer-name { font-weight: 700; font-size: 15px; margin-bottom: 2px; }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-size: 13px;
      line-height: 1.4;
      gap: 12px;
    }
    .label { color: #555; flex-shrink: 0; }
    .value { font-weight: 600; text-align: right; }
    .amount-box {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 10px 0;
      margin: 15px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .amount-label { font-weight: 700; font-size: 16px; }
    .amount-value { font-size: 20px; font-weight: 800; }
    .credit { color: #059669; }
    .debit { color: #dc2626; }
    .footer { text-align: center; font-size: 11px; color: #666; margin-top: 20px; }
    .footer-msg { font-weight: 600; margin-bottom: 4px; color: #333; }
    @media print {
      body { padding: 0; }
      .receipt { border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1 class="logo">FAB CLEAN</h1>
      <div class="title">${escapeHtml(title)}</div>
    </div>
    <div class="customer-box">
      <div class="customer-name">${escapeHtml(customer.name)}</div>
      ${customer.phone ? `<div>${escapeHtml(customer.phone)}</div>` : ''}
    </div>
    ${rows.map((row) => `
      <div class="row">
        <span class="label">${escapeHtml(row.label)}</span>
        <span class="value">${escapeHtml(row.value)}</span>
      </div>
    `).join('')}
    <div class="amount-box">
      <span class="amount-label">${escapeHtml(amountLabel)}</span>
      <span class="amount-value ${amountClass}">${escapeHtml(amountValue)}</span>
    </div>
    ${typeof balanceAfter === 'number' ? `
      <div class="row" style="background:#f3f4f6;padding:6px;border-radius:4px;">
        <span class="label">Balance After</span>
        <span class="value">${escapeHtml(formatCurrency(balanceAfter))}</span>
      </div>
    ` : ''}
    <div class="footer">
      <div class="footer-msg">Thank you for choosing Fab Clean!</div>
      <div>This is a computer generated receipt.</div>
      ${footerNote ? `<div style="margin-top:8px;">${escapeHtml(footerNote)}</div>` : ''}
      ${transactionId ? `<div style="margin-top:8px;font-size:10px;">ID: ${escapeHtml(transactionId)}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

export function printWalletDocument(html: string, title: string): boolean {
  try {
    browserPrint(html, title);
    return true;
  } catch {
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) return false;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    return true;
  }
}

export function printWalletTopUpReceipt(data: WalletTopUpReceiptData): boolean {
  const html = buildReceiptHtml({
    title: 'Wallet Top-Up Receipt',
    customer: data.customer,
    rows: [
      { label: 'Date', value: formatDateTime(data.createdAt) },
      { label: 'Staff', value: data.staffName || 'System' },
      { label: 'Payment Mode', value: formatPaymentMethodLabel(data.paymentMethod) },
      { label: 'Reference', value: data.referenceNumber || '-' },
      ...(typeof data.balanceBefore === 'number'
        ? [{ label: 'Balance Before', value: formatCurrency(data.balanceBefore) }]
        : []),
      { label: 'Notes', value: data.notes || '-' },
    ],
    amountLabel: 'AMOUNT ADDED',
    amountValue: formatCurrency(data.amount),
    amountClass: 'credit',
    balanceAfter: data.balanceAfter,
    transactionId: data.transactionId || (data.entryNo ? String(data.entryNo) : null),
  });

  return printWalletDocument(html, `Wallet-TopUp-${data.customer.name}`);
}

export function printWalletLedgerReceipt(
  customer: WalletReceiptCustomer,
  tx: WalletLedgerEntry
): boolean {
  const direction = getLedgerDirection(tx);
  const createdAt = tx.createdAt || tx.transactionDate;
  const reference = tx.orderId || tx.referenceId || tx.referenceNumber || '-';
  const notes = tx.note || tx.description || tx.notes || tx.reason || '-';

  const html = buildReceiptHtml({
    title: 'Wallet Transaction Receipt',
    customer,
    rows: [
      { label: 'Date', value: formatDateTime(createdAt) },
      { label: 'Type', value: String(tx.transactionType || tx.type || 'Transaction') },
      { label: 'Reference', value: String(reference) },
      { label: 'Payment Mode', value: formatPaymentMethodLabel(tx.paymentMethod) },
      { label: 'Staff', value: tx.recordedByName || 'System' },
      { label: 'Notes', value: String(notes) },
    ],
    amountLabel: direction.isCredit ? 'CREDIT' : 'DEBIT',
    amountValue: `${direction.isCredit ? '' : '-'}${formatCurrency(direction.absoluteAmount)}`,
    amountClass: direction.isCredit ? 'credit' : 'debit',
    balanceAfter: Number(tx.balanceAfter ?? 0),
    transactionId: tx.transactionId || tx.id || null,
  });

  return printWalletDocument(html, `Wallet-Ledger-${customer.name}`);
}
