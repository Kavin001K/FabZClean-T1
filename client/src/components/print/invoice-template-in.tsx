import React from 'react';
import { getFranchiseById, getFormattedAddress } from '@/lib/franchise-config';
import { parseAndFormatAddress } from '@/lib/address-utils';
import { DEFAULT_INVOICE_TEMPLATE_CONFIG, type InvoiceTemplateConfig, type InvoiceTemplatePresetKey } from '@shared/business-config';
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
    note?: string;
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
  isUpdate?: boolean;
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

const InvoiceTemplateIN: React.FC<{ data: InvoiceData; preset?: InvoiceTemplatePresetKey; config?: Partial<InvoiceTemplateConfig> }> = ({
  data,
  preset = 'classic',
  config,
}) => {
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
    isUpdate = false,
    fulfillmentType = 'pickup',
    deliveryAddress,
    paymentBreakdown,
  } = data;

  const templateConfig = {
    ...DEFAULT_INVOICE_TEMPLATE_CONFIG,
    ...(config || {}),
  };
  const franchise = getFranchiseById(franchiseId);
  const isEditedInvoice = preset === 'edited' || isUpdate;
  const visualPreset: InvoiceTemplatePresetKey = isEditedInvoice
    ? 'edited'
    : (preset === 'express' || isExpressOrder ? 'express' : preset);
  const presetVisuals: Record<InvoiceTemplatePresetKey, {
    accent: string;
    accentSoft: string;
    accentBorder: string;
    headerGradient: string;
    pageBackground: string;
    shellShadow: string;
  }> = {
    classic: {
      accent: '#0f766e',
      accentSoft: '#ecfdf5',
      accentBorder: '#99f6e4',
      headerGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      pageBackground: '#f6f8fb',
      shellShadow: '0 22px 60px rgba(15, 23, 42, 0.08)',
    },
    modern: {
      accent: '#1d4ed8',
      accentSoft: '#eff6ff',
      accentBorder: '#bfdbfe',
      headerGradient: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
      pageBackground: '#f4f7fb',
      shellShadow: '0 20px 54px rgba(29, 78, 216, 0.10)',
    },
    compact: {
      accent: '#334155',
      accentSoft: '#f8fafc',
      accentBorder: '#cbd5e1',
      headerGradient: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
      pageBackground: '#f8fafc',
      shellShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    },
    express: {
      accent: '#c2410c',
      accentSoft: '#fff7ed',
      accentBorder: '#fdba74',
      headerGradient: 'linear-gradient(135deg, #c2410c 0%, #fb923c 100%)',
      pageBackground: '#fffaf5',
      shellShadow: '0 20px 54px rgba(194, 65, 12, 0.16)',
    },
    edited: {
      accent: '#7c3aed',
      accentSoft: '#f5f3ff',
      accentBorder: '#c4b5fd',
      headerGradient: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)',
      pageBackground: '#f7f7ff',
      shellShadow: '0 20px 54px rgba(76, 29, 149, 0.12)',
    },
  };
  const visual = presetVisuals[visualPreset];
  const accent = visual.accent;
  const accentSoft = visual.accentSoft;
  const accentBorder = visual.accentBorder;
  const headingInk = '#0f172a';
  const bodyInk = '#334155';
  const mutedInk = '#64748b';
  const panel = '#ffffff';
  const panelSoft = '#f8fafc';
  const line = '#e2e8f0';
  const shadow = visual.shellShadow;

  const safeItems = Array.isArray(items) ? items : [];
  const customerAddress = parseAndFormatAddress(customer?.address);
  const resolvedDeliveryAddress = typeof deliveryAddress === 'string'
    ? deliveryAddress
    : parseAndFormatAddress(deliveryAddress);

  const companyDetails = {
    name: company?.name || 'Fab Clean',
    branchName: company?.name || franchise?.name || 'Fab Clean',
    address: company?.address || (franchise ? getFormattedAddress(franchise) : 'Pollachi, Tamil Nadu'),
    phone: company?.phone || franchise?.phone || '+91 93630 59595',
    email: company?.email || franchise?.email || 'support@myfabclean.com',
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
  const FulfillmentIcon = fulfillmentType === 'delivery' ? Truck : Store;

  const invoiceMetaRows: Array<{ label: string; value: string; Icon: LucideIcon }> = [
    { label: 'Issued On', value: formatDisplayDate(invoiceDate), Icon: CalendarDays },
    { label: 'Due / Pickup', value: formatDisplayDate(dueDate), Icon: Clock3 },
    { label: 'Fulfillment', value: fulfillmentType === 'delivery' ? 'Home Delivery' : 'Store Pickup', Icon: fulfillmentType === 'delivery' ? Truck : Store },
    { label: 'Payment Status', value: paymentStatus, Icon: CircleDollarSign },
  ];
  const documentTitle = visualPreset === 'express'
    ? 'Express Bill'
    : isEditedInvoice
      ? 'Edited Order Bill'
      : 'Invoice';
  const heroTitle = visualPreset === 'express'
    ? 'Priority processing enabled'
    : isEditedInvoice
      ? 'Latest approved revision'
      : 'Ready for billing and collection';
  const heroCopy = visualPreset === 'express'
    ? 'Fast-turnaround handling is reflected on this bill. Pickup timing and totals already include express service uplift.'
    : isEditedInvoice
      ? 'This document supersedes the previous bill for the same order and reflects the latest confirmed order changes.'
      : 'This preset keeps billing clean, branded, and easy to scan at the counter.';

  return (
    <div
      style={{
        width: '210mm',
        margin: '0 auto',
        background: visual.pageBackground,
        color: bodyInk,
        fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        @page {
          size: A4;
          margin: 8mm;
        }

        .invoice-shell {
          background: #ffffff;
          box-shadow: ${shadow};
          min-height: 297mm;
          overflow: hidden;
        }

        .invoice-body {
          padding: 0;
        }

        .invoice-section,
        .invoice-card,
        .invoice-totals-card,
        .invoice-payment-card,
        .invoice-summary-card {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .invoice-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .invoice-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .invoice-items-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          border: 1px solid ${line};
          border-radius: 14px;
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
              background: visual.headerGradient,
              color: '#ffffff',
              padding: '18px 22px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                {templateConfig.showLogo && (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      minWidth: preset === 'compact' ? '76px' : '112px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 18px rgba(15, 23, 42, 0.14)',
                    }}
                  >
                    <img
                      src={companyDetails.logo}
                      alt={companyDetails.name}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                      style={{ width: preset === 'compact' ? '64px' : '92px', height: 'auto', objectFit: 'contain' }}
                    />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, lineHeight: 1.05 }}>{companyDetails.name}</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.94 }}>
                    Premium Laundry & Dry Cleaning Services
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {isExpressOrder && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.92)',
                        color: '#c2410c',
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      <Clock3 size={12} strokeWidth={2.3} />
                      Express Order
                    </span>
                  )}
                  {isEditedInvoice && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.92)',
                        color: '#6d28d9',
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      <ReceiptText size={12} strokeWidth={2.3} />
                      Revised Bill
                    </span>
                  )}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '5px 10px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.16)',
                      border: '1px solid rgba(255,255,255,0.28)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {documentTitle}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', opacity: 0.78, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  Order Ref
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, letterSpacing: '0.03em' }}>
                  #{orderCode}
                </p>
              </div>
            </div>
          </header>

          {(visualPreset === 'express' || isEditedInvoice) && (
            <section className="invoice-section" style={{ padding: '14px 18px 0' }}>
              <div
                className="invoice-card"
                style={{
                  background: accentSoft,
                  border: `1px solid ${accentBorder}`,
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '18px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={sectionTitleStyle(accent)}>{documentTitle}</p>
                  <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 900, color: headingInk }}>{heroTitle}</p>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', lineHeight: 1.7, color: bodyInk, maxWidth: '540px' }}>{heroCopy}</p>
                </div>
                <div
                  style={{
                    minWidth: '160px',
                    textAlign: 'right',
                    alignSelf: 'stretch',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {visualPreset === 'express' ? 'Priority By' : 'Revision Date'}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: 900, color: accent }}>
                    {formatDisplayDate(visualPreset === 'express' ? dueDate : invoiceDate)}
                  </p>
                </div>
              </div>
            </section>
          )}

          <div style={{ padding: '16px 18px 0' }}>
            <section className="invoice-section invoice-grid-2" style={{ marginBottom: '12px' }}>
              <div
                className="invoice-card"
                style={{
                  background: panel,
                  border: `1px solid ${line}`,
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <p style={sectionTitleStyle(mutedInk)}>From</p>
                <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={iconBoxStyle(panelSoft, line)}>
                      <Store size={14} color={accent} strokeWidth={2.2} />
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: headingInk }}>{companyDetails.branchName}</p>
                      {templateConfig.showStoreAddress && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.65, color: bodyInk }}>{companyDetails.address}</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={iconBoxStyle(panelSoft, line)}>
                        <Phone size={14} color={accent} strokeWidth={2.2} />
                      </span>
                      <span style={{ fontSize: '12px', color: bodyInk, fontWeight: 600 }}>{companyDetails.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={iconBoxStyle(panelSoft, line)}>
                        <Mail size={14} color={accent} strokeWidth={2.2} />
                      </span>
                      <span style={{ fontSize: '12px', color: bodyInk, fontWeight: 600 }}>{companyDetails.email}</span>
                    </div>
                    {enableGST && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={iconBoxStyle(panelSoft, line)}>
                          <FileText size={14} color={accent} strokeWidth={2.2} />
                        </span>
                        <span style={{ fontSize: '12px', color: bodyInk, fontWeight: 600 }}>
                          GSTIN {companyDetails.gstin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="invoice-card"
                style={{
                  background: panel,
                  border: `1px solid ${line}`,
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <p style={sectionTitleStyle(accent)}>Bill To</p>
                <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={iconBoxStyle(panelSoft, line)}>
                      <UserRound size={14} color={accent} strokeWidth={2.2} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: headingInk, lineHeight: 1.25 }}>{customer?.name || 'Customer'}</p>
                      {templateConfig.showCustomerAddress && customerAddress && customerAddress !== 'N/A' && customerAddress !== 'Address not provided' && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: bodyInk, lineHeight: 1.65 }}>{customerAddress}</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '10px', ...(customer?.email && customer.email !== 'N/A' ? { gridTemplateColumns: '1fr 1fr' } : {}) }}>
                    {/* Phone - ALWAYS shown (mandatory field) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={iconBoxStyle(panelSoft, line)}>
                        <Phone size={14} color={accent} strokeWidth={2.2} />
                      </span>
                      <span style={{ fontSize: '12px', color: bodyInk, fontWeight: 600 }}>{customer?.phone || 'N/A'}</span>
                    </div>
                    {/* Email - only shown when available */}
                    {customer?.email && customer.email !== 'N/A' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={iconBoxStyle(panelSoft, line)}>
                          <Mail size={14} color={accent} strokeWidth={2.2} />
                        </span>
                        <span style={{ fontSize: '12px', color: bodyInk, fontWeight: 600, wordBreak: 'break-word' }}>{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="invoice-section invoice-meta-grid" style={{ marginBottom: '12px' }}>
              {invoiceMetaRows.slice(0, 2).map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="invoice-card"
                  style={{
                    background: panel,
                    border: `1px solid ${line}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={iconBoxStyle(accentSoft, accentBorder)}>
                      <Icon size={14} color={accent} strokeWidth={2.2} />
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '18px', color: headingInk, fontWeight: 800 }}>{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {templateConfig.showDeliveryBlock && (
            <section
              className="invoice-section invoice-card"
              style={{
                marginBottom: '12px',
                background: panel,
                border: `1px solid ${line}`,
                borderRadius: '10px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={iconBoxStyle(accentSoft, accentBorder)}>
                    <FulfillmentIcon size={14} color={accent} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Fulfillment Method</p>
                    <p style={{ margin: '4px 0 0', fontSize: '16px', color: headingInk, fontWeight: 800 }}>
                      {fulfillmentType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
                    </p>
                  </div>
                </div>
                {fulfillmentType === 'delivery' && (
                  <div style={{ textAlign: 'right', maxWidth: '58%' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Destination</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: bodyInk, lineHeight: 1.55 }}>
                      {resolvedDeliveryAddress || customerAddress}
                    </p>
                  </div>
                )}
              </div>
            </section>
            )}

            <section className="invoice-section" style={{ marginBottom: '12px' }}>
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '8%', textAlign: 'left', padding: '12px 14px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>#</th>
                    <th style={{ width: enableGST ? '46%' : '50%', textAlign: 'left', padding: '12px 14px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Description</th>
                    {enableGST && (
                      <th style={{ width: '10%', textAlign: 'center', padding: '12px 10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>HSN</th>
                    )}
                    <th style={{ width: '10%', textAlign: 'center', padding: '12px 10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ width: '13%', textAlign: 'right', padding: '12px 14px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Rate</th>
                    <th style={{ width: '13%', textAlign: 'right', padding: '12px 14px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {safeItems.map((item, index) => (
                    <tr key={`${item.description}-${index}`}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: mutedInk, verticalAlign: 'top' }}>{index + 1}</td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: headingInk, lineHeight: 1.45 }}>
                          {item.description || 'Laundry Service'}
                        </div>
                        {templateConfig.showItemNotes && item.note && (
                          <div style={{ marginTop: '4px', fontSize: '11px', color: mutedInk, lineHeight: 1.5 }}>
                            {item.note}
                          </div>
                        )}
                      </td>
                      {enableGST && (
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '12px', color: mutedInk, fontFamily: '"IBM Plex Mono", monospace', verticalAlign: 'top' }}>
                          {item.hsn || '998314'}
                        </td>
                      )}
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '14px', fontWeight: 800, color: accent, verticalAlign: 'top' }}>
                        {safeNumber(item.quantity)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', color: mutedInk, fontFamily: '"IBM Plex Mono", monospace', verticalAlign: 'top' }}>
                        {formatIndianCurrency(safeNumber(item.unitPrice))}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: headingInk, fontFamily: '"IBM Plex Mono", monospace', verticalAlign: 'top' }}>
                        {formatIndianCurrency(safeNumber(item.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="invoice-section invoice-grid-2" style={{ alignItems: 'start', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div
                  className="invoice-payment-card"
                  style={{
                    background: panel,
                    border: `1px solid ${line}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {templateConfig.showPaymentQr && qrCode && (
                      <div
                        style={{
                          width: '92px',
                          height: '92px',
                          borderRadius: '10px',
                          background: '#ffffff',
                          border: `1px solid ${line}`,
                          display: 'grid',
                          placeItems: 'center',
                          padding: '6px',
                        }}
                      >
                        <img src={qrCode} alt="Payment QR" style={{ width: '78px', height: '78px', display: 'block' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', color: accent, fontWeight: 900 }}>{templateConfig.paymentQrLabel || 'Scan to Pay'}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: mutedInk }}>UPI / GPay / PhonePe</p>
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: headingInk, fontWeight: 700 }}>{companyDetails.name}</p>
                    </div>
                  </div>
                </div>

                {templateConfig.showTerms && (
                <div
                  className="invoice-payment-card"
                  style={{
                    background: panel,
                    border: `1px dashed ${line}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  <p style={sectionTitleStyle(accent)}>Terms & Conditions</p>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: bodyInk, lineHeight: 1.7 }}>
                    <div>1. Payment due on delivery or pickup.</div>
                    <div>2. We are not responsible for natural wear and tear.</div>
                    <div>3. Review garments at the time of handover.</div>
                    {(notes || paymentTerms) && <div>4. {paymentTerms || notes}</div>}
                    {templateConfig.footerNote && <div>5. {templateConfig.footerNote}</div>}
                  </div>
                </div>
                )}
              </div>

              <div
                className="invoice-totals-card"
                style={{
                  background: panel,
                  border: `1px solid ${line}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  position: 'relative',
                }}
              >
                {visualPreset === 'express' && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      border: '2px solid rgba(234,88,12,0.45)',
                      boxShadow: 'inset 0 0 0 3px rgba(234,88,12,0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'rotate(12deg)',
                      opacity: 0.78,
                    }}
                  >
                    <div style={{ textAlign: 'center', color: '#c2410c', lineHeight: 1.1 }}>
                      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.18em' }}>EXPRESS</div>
                      <div style={{ fontSize: '16px', fontWeight: 900 }}>PRIORITY</div>
                      <div style={{ fontSize: '8px', fontWeight: 800 }}>FAB CLEAN</div>
                    </div>
                  </div>
                )}
                {isEditedInvoice && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: '#f5f3ff',
                      border: '1px solid #c4b5fd',
                      color: '#6d28d9',
                      transform: 'rotate(5deg)',
                      opacity: 0.9,
                    }}
                  >
                    <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.16em' }}>REVISED</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1.1 }}>LATEST BILL</div>
                  </div>
                )}

                <div style={{ display: 'grid', gap: '10px', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: mutedInk }}>Subtotal</span>
                    <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(serviceSubtotal)}</strong>
                  </div>
                  {deliveryTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: mutedInk }}>Delivery Charges</span>
                      <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(deliveryTotal)}</strong>
                    </div>
                  )}
                  {expressTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#c2410c' }}>
                      <span style={{ fontWeight: 700 }}>Express Surcharge</span>
                      <strong style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(expressTotal)}</strong>
                    </div>
                  )}
                  {enableGST && templateConfig.showGstBreakup && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: mutedInk }}>CGST @ 9%</span>
                        <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(cgstAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: mutedInk }}>SGST @ 9%</span>
                        <strong style={{ color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(sgstAmount)}</strong>
                      </div>
                    </>
                  )}
                  <div style={{ height: '3px', background: accent, borderRadius: '999px', marginTop: '4px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: headingInk, textTransform: 'uppercase' }}>Grand Total</span>
                    <span style={{ fontSize: '34px', fontWeight: 900, color: accent, fontFamily: '"IBM Plex Mono", monospace' }}>
                      {formatIndianCurrency(grandTotal)}
                    </span>
                  </div>
                  <div
                    style={{
                      background: panelSoft,
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '10px',
                      color: mutedInk,
                      textAlign: 'center',
                      fontStyle: 'italic',
                    }}
                  >
                    {convertToWords(grandTotal)}
                  </div>
                </div>
              </div>
            </section>

            {templateConfig.showPaymentBreakdown && paymentBreakdown && (
              <section
                className="invoice-section invoice-payment-card"
                style={{
                  background: panelSoft,
                  border: `1px solid ${line}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '14px',
                }}
              >
                <p style={sectionTitleStyle(accent)}>Payment Summary</p>
                <div className="invoice-grid-2" style={{ marginTop: '12px', alignItems: 'start' }}>
                  <div
                    className="invoice-summary-card"
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${line}`,
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Invoice Total</p>
                    <p style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: 900, color: headingInk, fontFamily: '"IBM Plex Mono", monospace' }}>
                      {formatIndianCurrency(grandTotal)}
                    </p>
                  </div>
                  <div
                    className="invoice-summary-card"
                    style={{
                      background: paymentBreakdown.creditOutstanding > 0 ? '#fffbeb' : '#f0fdf4',
                      border: `1px solid ${paymentBreakdown.creditOutstanding > 0 ? '#fde68a' : '#bbf7d0'}`,
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '10px', color: mutedInk, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Status</p>
                    <p style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: 900, color: paymentBreakdown.creditOutstanding > 0 ? '#b45309' : '#15803d' }}>
                      {paymentBreakdown.creditOutstanding > 0 ? 'Credit' : 'Paid'}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                  {paymentBreakdown.walletDeducted > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: bodyInk }}>Wallet Deducted</span>
                      <strong style={{ color: '#7c3aed', fontFamily: '"IBM Plex Mono", monospace' }}>- {formatIndianCurrency(paymentBreakdown.walletDeducted)}</strong>
                    </div>
                  )}
                  {paymentBreakdown.cashPaid > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: bodyInk }}>{paymentBreakdown.paymentMethod || 'Cash'} Paid</span>
                      <strong style={{ color: '#15803d', fontFamily: '"IBM Plex Mono", monospace' }}>- {formatIndianCurrency(paymentBreakdown.cashPaid)}</strong>
                    </div>
                  )}
                  {paymentBreakdown.creditOutstanding > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: bodyInk }}>Added to Outstanding</span>
                      <strong style={{ color: '#b45309', fontFamily: '"IBM Plex Mono", monospace' }}>{formatIndianCurrency(paymentBreakdown.creditOutstanding)}</strong>
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Customer Outstanding Balance
                    </span>
                    <strong style={{ fontSize: '18px', color: '#92400e', fontFamily: '"IBM Plex Mono", monospace' }}>
                      {formatIndianCurrency(paymentBreakdown.newOutstanding || 0)}
                    </strong>
                  </div>
                </div>
              </section>
            )}
          </div>

          <footer
            style={{
              background: '#1e293b',
              color: '#ffffff',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '14px',
              alignItems: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{templateConfig.footerNote || `Thank you for choosing ${companyDetails.name}.`}</p>
            <p style={{ margin: 0, fontSize: '10px', opacity: 0.72 }}>
              {templateConfig.showSignature ? 'Authorised signature not required for computer-generated invoice.' : 'This is a computer-generated invoice.'}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateIN;
