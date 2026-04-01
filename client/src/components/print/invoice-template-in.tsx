import React from 'react';
import { getFranchiseById, getFormattedAddress } from '@/lib/franchise-config';
import { parseAndFormatAddress } from '@/lib/address-utils';
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileText,
  type LucideIcon,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Shirt,
  Store,
  Truck,
  UserRound,
} from 'lucide-react';

const COMPANY_GSTIN = '33AITPD3522F1ZK';
const COMPANY_PAN = 'AITPD3522F';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  enableGST?: boolean;
  franchiseId?: string;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string | null;
    logo?: string;
  };
  customer: {
    id?: string | null;
    name: string;
    address: string | Record<string, unknown>;
    phone: string | null;
    email: string | null;
    taxId?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number | string;
    unitPrice: number | string;
    total: number | string;
    taxRate?: number;
    hsn?: string;
  }>;
  subtotal: number | string;
  taxAmount?: number | string;
  deliveryCharges?: number | string;
  expressSurcharge?: number | string;
  total: number | string;
  paymentTerms?: string;
  notes?: string;
  qrCode?: string;
  signature?: string;
  isExpressOrder?: boolean;
  fulfillmentType?: string;
  deliveryAddress?: unknown;
  paymentBreakdown?: {
    walletDeducted: number;
    cashPaid: number;
    creditOutstanding: number;
    previousOutstanding: number;
    newOutstanding: number;
    paymentMethod: string;
  };
}

const formatIndianCurrency = (amount: number): string =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCompactCurrency = (amount: number): string =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const convertToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (value: number): string => {
    if (value === 0) return '';
    if (value < 10) return ones[value];
    if (value < 20) return teens[value - 10];
    if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ''}`;
    return `${ones[Math.floor(value / 100)]} Hundred${value % 100 ? ` and ${convertLessThanThousand(value % 100)}` : ''}`;
  };

  let rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = '';

  if (rupees >= 10000000) {
    result += `${convertLessThanThousand(Math.floor(rupees / 10000000))} Crore `;
    rupees %= 10000000;
  }
  if (rupees >= 100000) {
    result += `${convertLessThanThousand(Math.floor(rupees / 100000))} Lakh `;
    rupees %= 100000;
  }
  if (rupees >= 1000) {
    result += `${convertLessThanThousand(Math.floor(rupees / 1000))} Thousand `;
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertLessThanThousand(rupees);
  }

  result = `${result.trim()} Rupees`;
  if (paise > 0) {
    result += ` and ${convertLessThanThousand(paise)} Paise`;
  }

  return `${result} Only`;
};

const safeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDisplayDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const iconBoxStyle = (accentSoft: string, borderColor: string): React.CSSProperties => ({
  width: '28px',
  height: '28px',
  borderRadius: '9px',
  background: accentSoft,
  border: `1px solid ${borderColor}`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const sectionTitleStyle = (accent: string): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: accent,
  margin: 0,
});

const InvoiceTemplateIN: React.FC<{ data: InvoiceData }> = ({ data }) => {
  if (!data) {
    return <div style={{ padding: 24, color: '#b91c1c', textAlign: 'center' }}>Invoice data is missing.</div>;
  }

  const {
    invoiceNumber = 'INV-000',
    invoiceDate = new Date().toISOString(),
    dueDate = new Date().toISOString(),
    company,
    customer,
    items = [],
    subtotal = 0,
    taxAmount = 0,
    deliveryCharges = 0,
    expressSurcharge = 0,
    total = 0,
    paymentTerms,
    notes,
    qrCode,
    enableGST = false,
    franchiseId,
    isExpressOrder = false,
    fulfillmentType = 'pickup',
    deliveryAddress,
    paymentBreakdown,
  } = data;

  const franchise = getFranchiseById(franchiseId);
  const accent = isExpressOrder ? '#c2410c' : '#0f766e';
  const accentSoft = isExpressOrder ? '#fff7ed' : '#ecfdf5';
  const accentBorder = isExpressOrder ? '#fdba74' : '#99f6e4';
  const headingInk = '#0f172a';
  const bodyInk = '#334155';
  const mutedInk = '#64748b';
  const panel = '#ffffff';
  const panelSoft = '#f8fafc';
  const line = '#e2e8f0';
  const shadow = '0 22px 60px rgba(15, 23, 42, 0.08)';

  const safeItems = Array.isArray(items) ? items : [];
  const customerAddress = parseAndFormatAddress(customer?.address);
  const resolvedDeliveryAddress = typeof deliveryAddress === 'string'
    ? deliveryAddress
    : parseAndFormatAddress(deliveryAddress);

  const companyDetails = {
    name: company?.name || 'Fab Clean',
    branchName: franchise?.name || company?.name || 'Fab Clean',
    address: franchise ? getFormattedAddress(franchise) : company?.address || 'Pollachi, Tamil Nadu',
    phone: franchise?.phone || company?.phone || '+91 93630 59595',
    email: franchise?.email || company?.email || 'support@myfabclean.com',
    gstin: company?.taxId || COMPANY_GSTIN,
    pan: COMPANY_PAN,
    logo: company?.logo || '/assets/logo.webp',
  };

  const itemSubtotal = safeItems.reduce((sum, item) => sum + safeNumber(item?.total), 0);
  const serviceSubtotal = safeNumber(subtotal) > 0 ? safeNumber(subtotal) : itemSubtotal;
  const deliveryTotal = Math.max(0, safeNumber(deliveryCharges));
  const expressTotal = Math.max(0, safeNumber(expressSurcharge));
  const chargeSubtotal = deliveryTotal + expressTotal;
  const derivedTax = Math.max(0, safeNumber(taxAmount) || (enableGST ? Math.max(0, safeNumber(total) - serviceSubtotal - chargeSubtotal) : 0));
  const grandTotal = Math.max(0, safeNumber(total) || (serviceSubtotal + chargeSubtotal + derivedTax));
  const cgstAmount = enableGST ? derivedTax / 2 : 0;
  const sgstAmount = enableGST ? derivedTax / 2 : 0;
  const orderCode = invoiceNumber ? invoiceNumber.slice(-5) : 'INVC';

  const paymentStatus = paymentBreakdown
    ? paymentBreakdown.creditOutstanding > 0
      ? 'Credit Pending'
      : 'Paid'
    : 'Pending';

  const invoiceMetaRows: Array<{ label: string; value: string; Icon: LucideIcon }> = [
    { label: 'Issued On', value: formatDisplayDate(invoiceDate), Icon: CalendarDays },
    { label: 'Due / Pickup', value: formatDisplayDate(dueDate), Icon: Clock3 },
    { label: 'Fulfillment', value: fulfillmentType === 'delivery' ? 'Home Delivery' : 'Store Pickup', Icon: fulfillmentType === 'delivery' ? Truck : Store },
    { label: 'Payment Status', value: paymentStatus, Icon: CircleDollarSign },
  ];

  return (
    <div
      style={{
        width: '210mm',
        margin: '0 auto',
        background: '#f4f8fb',
        color: bodyInk,
        fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        @page {
          size: A4;
          margin: 9mm 8mm 12mm;
        }

        .invoice-shell {
          background: #ffffff;
          box-shadow: ${shadow};
          min-height: 297mm;
          position: relative;
          overflow: hidden;
        }

        .invoice-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top right, ${isExpressOrder ? 'rgba(251,146,60,0.14)' : 'rgba(20,184,166,0.12)'} 0%, transparent 26%),
            radial-gradient(circle at bottom left, rgba(148, 163, 184, 0.08) 0%, transparent 20%);
          pointer-events: none;
        }

        .invoice-body {
          position: relative;
          z-index: 1;
          padding: 18mm 16mm 14mm;
        }

        .invoice-section,
        .invoice-card,
        .invoice-summary-card,
        .invoice-notes-card,
        .invoice-totals-card,
        .invoice-payment-card {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .invoice-items-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          border: 1px solid ${line};
          border-radius: 16px;
          overflow: hidden;
        }

        .invoice-items-table thead {
          display: table-header-group;
        }

        .invoice-items-table tr,
        .invoice-items-table td,
        .invoice-items-table th {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .invoice-items-table th {
          background: ${headingInk};
          color: #ffffff;
        }

        .invoice-items-table tbody tr:nth-child(even) {
          background: ${panelSoft};
        }

        .invoice-footer {
          border-top: 1px solid ${line};
          margin-top: 14mm;
          padding-top: 6mm;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .invoice-shell {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="invoice-shell">
        <div className="invoice-body">
          <header
            className="invoice-section"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 0.85fr',
              gap: '18px',
              marginBottom: '18px',
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${headingInk} 0%, ${accent} 100%)`,
                color: '#ffffff',
                borderRadius: '22px',
                padding: '20px 22px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(130deg, rgba(255,255,255,0.12), transparent 55%)',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.96)',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 14px 26px rgba(15, 23, 42, 0.18)',
                  }}
                >
                  <img src={companyDetails.logo} alt="Fab Clean" style={{ width: '54px', height: 'auto', objectFit: 'contain' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.78 }}>
                    Premium Garment Care
                  </p>
                  <h1 style={{ margin: '4px 0 0', fontSize: '34px', lineHeight: 1.05, fontWeight: 900 }}>
                    {companyDetails.name}
                  </h1>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.86 }}>
                    Crisp invoices for pickup, delivery, and express orders.
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: '18px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Branch</p>
                  <p style={{ margin: '5px 0 0', fontSize: '16px', fontWeight: 800 }}>{companyDetails.branchName}</p>
                  <p style={{ margin: '8px 0 0', fontSize: '12px', lineHeight: 1.55, opacity: 0.9 }}>{companyDetails.address}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Contact</p>
                  <p style={{ margin: '5px 0 0', fontSize: '14px', fontWeight: 700 }}>{companyDetails.phone}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>{companyDetails.email}</p>
                  {enableGST && (
                    <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.88 }}>
                      GSTIN {companyDetails.gstin}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div
              className="invoice-card"
              style={{
                background: panel,
                border: `1px solid ${line}`,
                borderRadius: '22px',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 11px',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      background: accentSoft,
                      border: `1px solid ${accentBorder}`,
                      color: accent,
                    }}
                  >
                    {enableGST ? 'Tax Invoice' : 'Invoice'}
                  </span>
                  {isExpressOrder && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 11px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: 900,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        background: '#fff1f2',
                        border: '1px solid #fdba74',
                        color: '#c2410c',
                      }}
                    >
                      Express Priority
                    </span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '11px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  Invoice Number
                </p>
                <h2 style={{ margin: '6px 0 0', fontSize: '28px', lineHeight: 1.05, fontWeight: 900, color: headingInk }}>
                  #{orderCode}
                </h2>
              </div>

              <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
                {invoiceMetaRows.map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      paddingBottom: '10px',
                      borderBottom: `1px dashed ${line}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={iconBoxStyle(accentSoft, accentBorder)}>
                        <Icon size={14} color={accent} strokeWidth={2.2} />
                      </span>
                      <span style={{ fontSize: '12px', color: mutedInk }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: headingInk, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <section
            className="invoice-section"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '14px',
            }}
          >
            <div
              className="invoice-card"
              style={{
                background: panel,
                border: `1px solid ${line}`,
                borderRadius: '18px',
                padding: '18px 18px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={iconBoxStyle(accentSoft, accentBorder)}>
                  <UserRound size={14} color={accent} strokeWidth={2.2} />
                </span>
                <p style={sectionTitleStyle(accent)}>Billed To</p>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', color: headingInk, fontWeight: 900 }}>{customer?.name || 'Customer'}</h3>
                  {customer?.id && (
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '999px',
                        background: panelSoft,
                        border: `1px solid ${line}`,
                        color: mutedInk,
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: '"IBM Plex Mono", monospace',
                      }}
                    >
                      {customer.id}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={iconBoxStyle(panelSoft, line)}>
                      <MapPin size={14} color={accent} strokeWidth={2.2} />
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Address</p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: 1.65, color: headingInk, fontWeight: 600 }}>{customerAddress}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={iconBoxStyle(panelSoft, line)}>
                        <Phone size={14} color={accent} strokeWidth={2.2} />
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone</p>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: headingInk }}>{customer?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={iconBoxStyle(panelSoft, line)}>
                        <Mail size={14} color={accent} strokeWidth={2.2} />
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</p>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: headingInk, wordBreak: 'break-word' }}>{customer?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="invoice-card"
              style={{
                background: accentSoft,
                border: `1px solid ${accentBorder}`,
                borderRadius: '18px',
                padding: '18px 18px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={iconBoxStyle('#ffffffcc', accentBorder)}>
                  <ReceiptText size={14} color={accent} strokeWidth={2.2} />
                </span>
                <p style={sectionTitleStyle(accent)}>Order Snapshot</p>
              </div>
              <div style={{ marginTop: '12px', display: 'grid', gap: '12px' }}>
                <div
                  className="invoice-summary-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '10px',
                  }}
                >
                  {[
                    ['Items', `${safeItems.length}`],
                    ['Pieces', `${safeItems.reduce((sum, item) => sum + safeNumber(item.quantity), 0)}`],
                    ['Grand Total', formatCompactCurrency(grandTotal)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        background: '#ffffffcc',
                        borderRadius: '14px',
                        padding: '12px 10px',
                        border: `1px solid ${accentBorder}`,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
                      <p style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: 900, color: headingInk }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  <div
                    style={{
                      background: '#ffffffcc',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      border: `1px solid ${accentBorder}`,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Fulfillment Details</p>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', lineHeight: 1.55, color: headingInk, fontWeight: 700 }}>
                      {fulfillmentType === 'delivery'
                        ? (resolvedDeliveryAddress || customerAddress || 'Delivery address will be confirmed')
                        : 'Collect your order from the store on or before the due date.'}
                    </p>
                  </div>
                  {(notes || paymentTerms) && (
                    <div
                      className="invoice-notes-card"
                      style={{
                        background: '#ffffffcc',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        border: `1px solid ${accentBorder}`,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Notes</p>
                      <p style={{ margin: '6px 0 0', fontSize: '12px', lineHeight: 1.6, color: bodyInk }}>
                        {notes || paymentTerms}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="invoice-section" style={{ marginBottom: '14px' }}>
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={iconBoxStyle(accentSoft, accentBorder)}>
                  <Shirt size={14} color={accent} strokeWidth={2.2} />
                </span>
                <p style={sectionTitleStyle(accent)}>Service Summary</p>
              </div>
              {enableGST && (
                <span
                  style={{
                    fontSize: '11px',
                    color: mutedInk,
                    background: panelSoft,
                    border: `1px solid ${line}`,
                    padding: '6px 10px',
                    borderRadius: '999px',
                  }}
                >
                  HSN / SAC 998314
                </span>
              )}
            </div>

            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th style={{ width: '8%', textAlign: 'left', padding: '13px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>No.</th>
                  <th style={{ width: enableGST ? '44%' : '48%', textAlign: 'left', padding: '13px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Description</th>
                  {enableGST && (
                    <th style={{ width: '12%', textAlign: 'center', padding: '13px 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>HSN</th>
                  )}
                  <th style={{ width: '10%', textAlign: 'center', padding: '13px 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ width: '13%', textAlign: 'right', padding: '13px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rate</th>
                  <th style={{ width: '13%', textAlign: 'right', padding: '13px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {safeItems.map((item, index) => (
                  <tr key={`${item.description}-${index}`}>
                    <td style={{ padding: '14px', fontSize: '13px', color: mutedInk, verticalAlign: 'top' }}>{index + 1}</td>
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: headingInk, lineHeight: 1.45, wordBreak: 'break-word' }}>{item.description}</div>
                      {enableGST && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: mutedInk }}>
                          Laundry care service
                        </div>
                      )}
                    </td>
                    {enableGST && (
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '12px', color: mutedInk, fontFamily: '"IBM Plex Mono", monospace', verticalAlign: 'top' }}>
                        {item.hsn || '998314'}
                      </td>
                    )}
                    <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px', fontWeight: 800, color: accent, verticalAlign: 'top' }}>
                      {safeNumber(item.quantity)}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right', fontSize: '13px', color: mutedInk, fontFamily: '"IBM Plex Mono", monospace', verticalAlign: 'top' }}>
                      {formatIndianCurrency(safeNumber(item.unitPrice))}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: headingInk, fontFamily: '"IBM Plex Mono", monospace', verticalAlign: 'top' }}>
                      {formatIndianCurrency(safeNumber(item.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            className="invoice-section"
            style={{
              display: 'grid',
              gridTemplateColumns: '0.9fr 1.1fr',
              gap: '14px',
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'grid', gap: '14px' }}>
              <div
                className="invoice-payment-card"
                style={{
                  background: panel,
                  border: `1px solid ${line}`,
                  borderRadius: '18px',
                  padding: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={iconBoxStyle(accentSoft, accentBorder)}>
                    <FileText size={14} color={accent} strokeWidth={2.2} />
                  </span>
                  <p style={sectionTitleStyle(accent)}>Payment & Terms</p>
                </div>
                <div style={{ marginTop: '14px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {qrCode && (
                    <div
                      style={{
                        width: '104px',
                        minWidth: '104px',
                        height: '104px',
                        borderRadius: '18px',
                        background: '#ffffff',
                        border: `1px solid ${line}`,
                        display: 'grid',
                        placeItems: 'center',
                        padding: '8px',
                      }}
                    >
                      <img src={qrCode} alt="Payment QR" style={{ width: '88px', height: '88px', display: 'block' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '15px', color: headingInk, fontWeight: 900 }}>Scan to pay or settle at counter</p>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: bodyInk, lineHeight: 1.65 }}>
                      {paymentTerms || 'Payment due on or before delivery / pickup.'}
                    </p>
                    <p style={{ margin: '10px 0 0', fontSize: '11px', color: mutedInk }}>
                      For support, contact {companyDetails.phone} or {companyDetails.email}.
                    </p>
                  </div>
                </div>
              </div>

              {paymentBreakdown && (
                <div
                  className="invoice-payment-card"
                  style={{
                    background: panelSoft,
                    border: `1px solid ${line}`,
                    borderRadius: '18px',
                    padding: '18px',
                  }}
                >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={iconBoxStyle(panel, line)}>
                    <CircleDollarSign size={14} color={accent} strokeWidth={2.2} />
                  </span>
                  <p style={sectionTitleStyle(accent)}>Payment Breakdown</p>
                </div>
                  <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
                    {paymentBreakdown.walletDeducted > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                        <span style={{ color: bodyInk }}>Wallet used</span>
                        <strong style={{ color: '#7c3aed', fontFamily: '"IBM Plex Mono", monospace' }}>- {formatIndianCurrency(paymentBreakdown.walletDeducted)}</strong>
                      </div>
                    )}
                    {paymentBreakdown.cashPaid > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                        <span style={{ color: bodyInk }}>{paymentBreakdown.paymentMethod || 'Cash'} paid</span>
                        <strong style={{ color: '#15803d', fontFamily: '"IBM Plex Mono", monospace' }}>- {formatIndianCurrency(paymentBreakdown.cashPaid)}</strong>
                      </div>
                    )}
                    {paymentBreakdown.creditOutstanding > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                        <span style={{ color: bodyInk }}>Added to outstanding</span>
                        <strong style={{ color: '#b45309', fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(paymentBreakdown.creditOutstanding)}</strong>
                      </div>
                    )}
                    <div style={{ borderTop: `1px dashed ${line}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                      <span style={{ color: mutedInk }}>Customer outstanding balance</span>
                      <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>
                        {formatIndianCurrency(paymentBreakdown.newOutstanding || 0)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className="invoice-totals-card"
              style={{
                background: panel,
                border: `1px solid ${line}`,
                borderRadius: '22px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(180deg, ${isExpressOrder ? 'rgba(251,146,60,0.10)' : 'rgba(20,184,166,0.08)'} 0%, transparent 50%)`,
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={iconBoxStyle(accentSoft, accentBorder)}>
                      <ReceiptText size={14} color={accent} strokeWidth={2.2} />
                    </span>
                    <p style={sectionTitleStyle(accent)}>Billing Summary</p>
                  </div>
                  {isExpressOrder && (
                    <span
                      style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        background: '#fff7ed',
                        border: '1px solid #fdba74',
                        color: '#c2410c',
                        fontSize: '10px',
                        fontWeight: 900,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Express
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', fontSize: '14px' }}>
                    <span style={{ color: mutedInk }}>Service subtotal</span>
                    <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(serviceSubtotal)}</strong>
                  </div>

                  {deliveryTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', fontSize: '14px' }}>
                      <span style={{ color: mutedInk }}>Delivery charges</span>
                      <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(deliveryTotal)}</strong>
                    </div>
                  )}

                  {expressTotal > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '14px',
                        fontSize: '14px',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: '14px',
                        padding: '10px 12px',
                      }}
                    >
                      <span style={{ color: '#c2410c', fontWeight: 700 }}>Express surcharge</span>
                      <strong style={{ color: '#c2410c', fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(expressTotal)}</strong>
                    </div>
                  )}

                  {enableGST && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', fontSize: '14px' }}>
                        <span style={{ color: mutedInk }}>CGST @ 9%</span>
                        <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(cgstAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', fontSize: '14px' }}>
                        <span style={{ color: mutedInk }}>SGST @ 9%</span>
                        <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(sgstAmount)}</strong>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ margin: '18px 0 14px', height: '4px', borderRadius: '999px', background: `linear-gradient(90deg, ${headingInk} 0%, ${accent} 100%)` }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Grand Total</p>
                    <p style={{ margin: '6px 0 0', fontSize: '31px', lineHeight: 1, fontWeight: 900, color: accent, fontFamily: '"IBM Plex Mono", monospace' }}>
                      {formatIndianCurrency(grandTotal)}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '8px 12px',
                      background: accentSoft,
                      border: `1px solid ${accentBorder}`,
                      borderRadius: '14px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Amount in Words</p>
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: headingInk, fontWeight: 700, maxWidth: '190px', lineHeight: 1.55 }}>
                      {convertToWords(grandTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="invoice-footer">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                gap: '14px',
                alignItems: 'end',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: bodyInk, fontWeight: 700 }}>
                  Thank you for choosing Fab Clean.
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: mutedInk, lineHeight: 1.7 }}>
                  Garments should be checked at the time of delivery or pickup. Natural wear, hidden defects, and pre-existing damage may become visible during processing. For detailed terms, visit myfabclean.com/terms.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '11px', color: mutedInk }}>Computer-generated invoice</p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: mutedInk }}>No physical signature required</p>
                {enableGST && (
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: mutedInk }}>
                    PAN {companyDetails.pan} {companyDetails.gstin ? `• GSTIN ${companyDetails.gstin}` : ''}
                  </p>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateIN;
