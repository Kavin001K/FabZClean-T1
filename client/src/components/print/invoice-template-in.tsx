import React from 'react';
import { getFranchiseById, getFormattedAddress } from '@/lib/franchise-config';
import { parseAndFormatAddress } from '@/lib/address-utils';

// Fixed Company GST Number
const COMPANY_GSTIN = '33AITPD3522F1ZK';
const COMPANY_PAN = 'AITPD3522F';

interface InvoiceData {
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
    taxId: string;
    logo?: string;
  };
  customer: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate?: number;
    hsn?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  deliveryCharges?: number;
  expressSurcharge?: number;
  total: number;
  paymentTerms: string;
  notes?: string;
  qrCode?: string;
  signature?: string;
  isExpressOrder?: boolean;
}

// Utility functions
const formatIndianCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCompactCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Number to words converter (Indian format)
const convertToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
  };

  let rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = '';

  if (rupees >= 10000000) {
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
    rupees %= 10000000;
  }
  if (rupees >= 100000) {
    result += convertLessThanThousand(Math.floor(rupees / 100000)) + ' Lakh ';
    rupees %= 100000;
  }
  if (rupees >= 1000) {
    result += convertLessThanThousand(Math.floor(rupees / 1000)) + ' Thousand ';
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertLessThanThousand(rupees);
  }

  result = result.trim() + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }
  return result + ' Only';
};

const InvoiceTemplateIN: React.FC<{ data: InvoiceData }> = ({ data }) => {
  if (!data) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        Error: Invoice data is missing
      </div>
    );
  }

  const {
    invoiceNumber = 'INV-000',
    invoiceDate = new Date().toISOString(),
    dueDate = new Date().toISOString(),
    customer,
    items = [],
    subtotal = 0,
    deliveryCharges = 0,
    expressSurcharge = 0,
    total = 0,
    qrCode,
    enableGST = false,
    franchiseId,
    isExpressOrder = false,
  } = data;

  // Parse customer address
  const formattedAddress = parseAndFormatAddress(customer?.address);

  const safeCustomer = {
    name: customer?.name || 'Customer',
    address: formattedAddress,
    phone: customer?.phone || 'N/A',
    email: customer?.email || '',
  };

  // Get franchise details
  const franchise = getFranchiseById(franchiseId);

  const companyDetails = {
    name: "Fab Clean",
    branchName: franchise?.name || 'Fab Clean',
    address: franchise ? getFormattedAddress(franchise) : 'Pollachi, Tamil Nadu',
    phone: franchise?.phone || '+91 93630 59595',
    email: franchise?.email || "support@myfabclean.com",
    gstin: COMPANY_GSTIN,
    pan: COMPANY_PAN,
  };

  // Calculate GST (18% split as 9% CGST + 9% SGST for intra-state)
  const GST_RATE = 18;
  const safeItems = Array.isArray(items) ? items : [];

  // Calculate totals
  const itemsSubtotal = safeItems.reduce((sum, item) => sum + (item?.total || 0), 0);
  const baseAmount = itemsSubtotal + (deliveryCharges || 0);

  // GST Calculation
  const cgstAmount = enableGST ? (baseAmount * 9) / 100 : 0;
  const sgstAmount = enableGST ? (baseAmount * 9) / 100 : 0;
  const totalGST = cgstAmount + sgstAmount;
  const grandTotal = enableGST ? (baseAmount + totalGST) : baseAmount;

  // Premium color palette
  const colors = {
    primary: isExpressOrder ? '#ea580c' : '#059669',      // Express Orange or Emerald-600
    primaryDark: isExpressOrder ? '#c2410c' : '#047857',  // Dark Orange or Emerald-700
    primaryLight: isExpressOrder ? '#fb923c' : '#10b981', // Light Orange or Emerald-500
    accent: '#f59e0b',       // Amber-500
    dark: '#1f2937',         // Gray-800
    text: '#374151',         // Gray-700
    textLight: '#6b7280',    // Gray-500
    border: '#e5e7eb',       // Gray-200
    background: '#f9fafb',   // Gray-50
    white: '#ffffff',
    success: '#22c55e',      // Green-500
    express: '#ea580c',      // Orange for EXPRESS
    expressLight: '#fff7ed', // Light Orange bg
  };

  // Determine invoice type
  const invoiceType = enableGST ? 'TAX INVOICE' : 'INVOICE';

  return (
    <div style={{
      backgroundColor: colors.white,
      width: '210mm',
      minHeight: '297mm',
      fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: '12px',
      lineHeight: '1.5',
      color: colors.text,
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>

      {/* EXPRESS Watermark Background */}
      {isExpressOrder && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '100px',
          fontWeight: '900',
          color: colors.express,
          opacity: 0.04,
          letterSpacing: '12px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
        }}>
          EXPRESS
        </div>
      )}

      {/* Header Section */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 50%, ${colors.primaryLight} 100%)`,
        color: colors.white,
        padding: '30px 40px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }}></div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Logo Container */}
          <div style={{
            background: colors.white,
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <img
              src="/assets/logo.webp"
              alt="Fab Clean"
              style={{
                height: '50px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>

          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              margin: '0',
              letterSpacing: '-0.5px',
              lineHeight: '1.2'
            }}>
              {companyDetails.name}
            </h1>
            <p style={{ fontSize: '12px', opacity: 0.9, margin: '2px 0 0 0' }}>
              Premium Laundry & Dry Cleaning Services
            </p>
          </div>
        </div>

        {/* Invoice Meta */}
        <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
          {/* EXPRESS Badge */}
          {isExpressOrder && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.95)',
              color: colors.express,
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '800',
              marginBottom: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              letterSpacing: '1.5px',
            }}>
              ⚡ EXPRESS ORDER
            </div>
          )}
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 16px',
            borderRadius: '4px',
            marginBottom: '6px',
            backdropFilter: 'blur(4px)'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '2px' }}>
              {invoiceType}
            </span>
          </div>
          <p style={{ fontSize: '18px', fontWeight: '700', margin: '0', fontFamily: 'monospace' }}>
            #{invoiceNumber}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '30px 40px' }}>

        {/* Company & Customer Info Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>

          {/* From Section */}
          <div style={{
            background: colors.white, // Changed to white for subtlety
            padding: '20px',
            borderRadius: '10px',
            border: `1px solid ${colors.border}`, // Simple border
          }}>
            <h3 style={{
              fontSize: '10px',
              fontWeight: '700',
              color: colors.textLight, // Muted color
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              From
            </h3>
            {/* Removed large Name since it is in Header */}
            <p style={{ margin: '0 0 4px 0', color: colors.text, fontSize: '13px', lineHeight: '1.5' }}>
              <strong>{companyDetails.address.split(',')[0]}</strong><br />
              {companyDetails.address.split(',').slice(1).join(', ')}
            </p>
            <p style={{ margin: '8px 0 2px 0', color: colors.textLight, fontSize: '12px' }}>
              📞 {companyDetails.phone}
            </p>
            <p style={{ margin: '0 0 8px 0', color: colors.textLight, fontSize: '12px' }}>
              ✉️ {companyDetails.email}
            </p>
            {enableGST && (
              <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: `1px dashed ${colors.border}`,
                fontSize: '11px',
                color: colors.textLight
              }}>
                <p style={{ margin: '0 0 2px 0' }}>
                  GSTIN: <span style={{ fontFamily: 'monospace', fontWeight: '600', color: colors.dark }}>{companyDetails.gstin}</span>
                </p>
                <p style={{ margin: '0' }}>
                  PAN: <span style={{ fontFamily: 'monospace', fontWeight: '600', color: colors.dark }}>{companyDetails.pan}</span>
                </p>
              </div>
            )}
          </div>

          {/* Bill To Section */}
          <div style={{
            background: colors.background,
            padding: '20px',
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
          }}>
            <h3 style={{
              fontSize: '10px',
              fontWeight: '700',
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ width: '4px', height: '12px', background: colors.accent, borderRadius: '2px' }}></span>
              Bill To
            </h3>
            <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 8px 0', color: colors.dark }}>
              {safeCustomer.name}
            </p>
            <p style={{ margin: '0 0 4px 0', color: colors.textLight, fontSize: '12px', maxWidth: '250px' }}>
              {safeCustomer.address}
            </p>
            <p style={{ margin: '0', color: colors.textLight, fontSize: '12px' }}>
              📞 {safeCustomer.phone}
            </p>
          </div>
        </div>

        {/* Invoice Details */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '25px',
        }}>
          <div style={{
            flex: 1,
            background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}08 100%)`,
            padding: '15px 20px',
            borderRadius: '8px',
            border: `1px solid ${colors.primary}30`,
          }}>
            <span style={{ fontSize: '10px', color: colors.textLight, textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice Date</span>
            <p style={{ margin: '4px 0 0 0', fontWeight: '700', fontSize: '14px', color: colors.dark }}>
              {new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{
            flex: 1,
            background: `linear-gradient(135deg, ${colors.accent}15 0%, ${colors.accent}08 100%)`,
            padding: '15px 20px',
            borderRadius: '8px',
            border: `1px solid ${colors.accent}30`,
          }}>
            <span style={{ fontSize: '10px', color: colors.textLight, textTransform: 'uppercase', letterSpacing: '1px' }}>Due Date</span>
            <p style={{ margin: '4px 0 0 0', fontWeight: '700', fontSize: '14px', color: colors.dark }}>
              {new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {enableGST && (
            <div style={{
              flex: 1,
              background: `linear-gradient(135deg, ${colors.success}15 0%, ${colors.success}08 100%)`,
              padding: '15px 20px',
              borderRadius: '8px',
              border: `1px solid ${colors.success}30`,
            }}>
              <span style={{ fontSize: '10px', color: colors.textLight, textTransform: 'uppercase', letterSpacing: '1px' }}>Supply Type</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: '700', fontSize: '14px', color: colors.dark }}>
                Intra-State (TN)
              </p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '25px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.dark, color: colors.white }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ padding: '14px', textAlign: 'right', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>Rate</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {safeItems.map((item, index) => (
                <tr key={index} style={{
                  borderBottom: `1px solid ${colors.border}`,
                  backgroundColor: index % 2 === 0 ? colors.white : colors.background,
                }}>
                  <td style={{ padding: '14px 16px', color: colors.textLight, fontSize: '13px' }}>{index + 1}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: '600', color: colors.dark, fontSize: '13px' }}>{item.description}</span>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center', color: colors.primary, fontWeight: '700', fontSize: '14px' }}>{item.quantity}</td>
                  <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace', color: colors.textLight, fontSize: '13px' }}>{formatCompactCurrency(item.unitPrice)}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: colors.dark, fontSize: '13px' }}>{formatIndianCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section: QR + Totals */}
        <div style={{ display: 'flex', gap: '30px' }}>

          {/* Left: QR & Bank Details */}
          <div style={{ flex: 1 }}>
            {qrCode && (
              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                marginBottom: '15px',
                padding: '12px',
                background: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                width: 'fit-content' // Keep it compact
              }}>
                <div style={{
                  padding: '4px',
                  background: colors.white,
                  borderRadius: '4px',
                }}>
                  <img src={qrCode} alt="QR Code" style={{ width: '70px', height: '70px', display: 'block' }} />
                </div>
                <div>
                  <p style={{ fontWeight: '700', color: colors.primary, margin: '0 0 2px 0', fontSize: '13px' }}>Scan to Pay</p>
                  <p style={{ color: colors.textLight, margin: '0', fontSize: '10px' }}>UPI / GPay / PhonePe</p>
                  <p style={{ color: colors.primary, margin: '2px 0 0 0', fontSize: '10px', fontWeight: '600' }}>Fab Clean</p>
                </div>
              </div>
            )}

            <div style={{
              background: colors.background,
              padding: '12px',
              borderRadius: '8px',
              border: `1px dashed ${colors.border}`,
            }}>
              <p style={{ fontWeight: '600', color: colors.primary, margin: '0 0 4px 0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Terms & Conditions</p>
              <p style={{ color: colors.textLight, margin: '0', fontSize: '10px', lineHeight: '1.4' }}>
                1. Payment due on delivery.<br />
                2. We are not responsible for natural wear & tear.<br />
                3. For full terms visit: <a href="https://myfabclean.com/terms" style={{ color: colors.primary, textDecoration: 'none' }}>myfabclean.com/terms</a>
              </p>
            </div>
          </div>

          {/* Right: Totals */}
          <div style={{ width: '300px' }}>
            <div style={{
              background: colors.white,
              padding: '20px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: colors.textLight }}>Subtotal</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{formatIndianCurrency(itemsSubtotal)}</span>
              </div>

              {deliveryCharges > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                  <span style={{ color: colors.textLight }}>Delivery</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{formatIndianCurrency(deliveryCharges)}</span>
                </div>
              )}

              {/* EXPRESS Surcharge */}
              {isExpressOrder && expressSurcharge > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontSize: '12px',
                  padding: '8px 10px',
                  background: colors.expressLight,
                  borderRadius: '6px',
                  border: `1px solid ${colors.express}30`,
                }}>
                  <span style={{
                    color: colors.express,
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>⚡ Express Surcharge (50%)</span>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: '700',
                    color: colors.express
                  }}>{formatIndianCurrency(expressSurcharge)}</span>
                </div>
              )}

              {enableGST && (
                <>
                  <div style={{ height: '1px', background: colors.border, margin: '12px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                    <span style={{ color: colors.textLight }}>CGST @ 9%</span>
                    <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(cgstAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                    <span style={{ color: colors.textLight }}>SGST @ 9%</span>
                    <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(sgstAmount)}</span>
                  </div>
                </>
              )}

              <div style={{
                height: '3px',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
                margin: '15px 0',
                borderRadius: '2px',
              }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: colors.dark, textTransform: 'uppercase' }}>Grand Total</span>
                <span style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  fontFamily: 'monospace',
                  color: colors.primary,
                }}>
                  {formatIndianCurrency(grandTotal)}
                </span>
              </div>

              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: colors.background,
                borderRadius: '6px',
                fontSize: '10px',
                color: colors.textLight,
                fontStyle: 'italic',
                textAlign: 'center',
              }}>
                {convertToWords(grandTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        background: colors.dark,
        color: colors.white,
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600' }}>
          ✨ Thank you for choosing Fab Clean!
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          This is a computer-generated invoice • No signature required
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateIN;
