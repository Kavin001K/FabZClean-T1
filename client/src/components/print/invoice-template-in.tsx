import React from 'react';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  enableGST?: boolean; // Added toggle
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
  total: number;
  paymentTerms: string;
  notes?: string;
  qrCode?: string;
  signature?: string;
}

// Self-contained utility functions
const formatIndianCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const calculateGST = (amount: number, gstRate: number, isInterState: boolean) => {
  const gstAmount = (amount * gstRate) / 100;

  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      gstRate,
      totalAmount: amount + gstAmount
    };
  } else {
    return {
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      gstRate,
      totalAmount: amount + gstAmount
    };
  }
};

const validateGSTIN = (gstin: string): boolean => {
  if (!gstin) return false;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

const isInterStateTransaction = (companyGSTIN: string, customerGSTIN: string): boolean => {
  if (!validateGSTIN(companyGSTIN) || !validateGSTIN(customerGSTIN)) {
    return false;
  }
  const companyStateCode = companyGSTIN.substring(0, 2);
  const customerStateCode = customerGSTIN.substring(0, 2);
  return companyStateCode !== customerStateCode;
};

const InvoiceTemplateIN: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    customer,
    items,
    subtotal,
    total,
    qrCode,
    enableGST = false, // Default to false
  } = data;

  // HARDCODED COMPANY DETAILS FROM MYFABCLEAN.IN
  const companyDetails = {
    name: "Fab Clean",
    // Added "Opp to HDFC Bank" as requested
    address: "#16, Venkatramana Round Road,\nOpp to HDFC Bank,\nMahalingapuram, Pollachi - 642002",
    phone: "+91 93630 59595",
    email: "support@myfabclean.com",
    taxId: "33AITPD3522F1ZK",
    logo: "/assets/logo.webp"
  };

  const isInterState = enableGST && customer?.taxId && companyDetails.taxId
    ? validateGSTIN(companyDetails.taxId) && validateGSTIN(customer.taxId)
      ? isInterStateTransaction(companyDetails.taxId, customer.taxId)
      : false
    : false;

  // Calculate GST breakdown
  const itemsWithGST = items.map(item => {
    const gstRate = item.taxRate || 18;
    const gstBreakdown = calculateGST(item.total, gstRate, isInterState);
    return {
      ...item,
      gstBreakdown
    };
  });

  // Calculate totals
  const totalCGST = itemsWithGST.reduce((sum, item) => sum + item.gstBreakdown.cgst, 0);
  const totalSGST = itemsWithGST.reduce((sum, item) => sum + item.gstBreakdown.sgst, 0);
  const totalIGST = itemsWithGST.reduce((sum, item) => sum + item.gstBreakdown.igst, 0);

  // Number to words converter
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
    return result;
  };

  // Brand Colors
  const colors = {
    primary: '#84cc16', // Lime Green
    secondary: '#3f6212', // Dark Green
    light: '#ecfccb', // Light Lime
    text: '#1a1a1a',
    gray: '#6b7280'
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '0',
      width: '210mm',
      minHeight: '297mm',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: colors.text,
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden' // Ensure watermark doesn't spill
    }}>
      {/* Top Brand Bar */}
      <div style={{ height: '8px', backgroundColor: colors.primary, width: '100%' }}></div>

      {/* Watermark */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        fontSize: '120px',
        fontWeight: '900',
        color: colors.primary,
        opacity: '0.05',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 0
      }}>
        FAB CLEAN
      </div>

      <div style={{ padding: '40px', position: 'relative', zIndex: 1 }}>
        {/* Header - Left: Info, Center: Logo, Right: Invoice No */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>

          {/* Left: Company Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0', color: colors.secondary, letterSpacing: '-0.5px' }}>
              {companyDetails.name}
            </h1>
            <div style={{ fontSize: '12px', color: colors.gray, marginTop: '8px' }}>
              <p style={{ margin: '2px 0', whiteSpace: 'pre-line', fontWeight: '500' }}>{companyDetails.address}</p>
              <p style={{ margin: '4px 0 2px 0' }}>Ph: {companyDetails.phone}</p>
              <p style={{ margin: '2px 0' }}>Email: {companyDetails.email}</p>
            </div>
          </div>

          {/* Center: Logo */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <img
              src={companyDetails.logo}
              alt="Fab Clean Logo"
              style={{ width: '180px', height: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Right: Invoice Details */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '900', margin: '0', color: colors.primary, lineHeight: '1', letterSpacing: '-1px' }}>INVOICE</h2>
            <p style={{ fontSize: '14px', color: colors.secondary, margin: '8px 0 0 0', fontWeight: '600' }}>#{invoiceNumber}</p>
            {enableGST && companyDetails.taxId && (
              <p style={{ fontSize: '11px', color: colors.gray, margin: '4px 0 0 0' }}>GSTIN: {companyDetails.taxId}</p>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', marginBottom: '40px' }}>
          {/* Bill To */}
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Bill To</h3>
            <div style={{ fontSize: '15px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '18px', color: colors.secondary }}>{customer.name}</p>
              {/* Added full address display logic */}
              <p style={{ margin: '0 0 4px 0', whiteSpace: 'pre-line', color: '#374151', minHeight: '40px' }}>{customer.address || "Address not provided"}</p>
              <p style={{ margin: '0 0 4px 0', color: '#374151' }}>{customer.phone}</p>
              {enableGST && customer.taxId && <p style={{ fontWeight: '600', margin: '8px 0 0 0', fontSize: '13px' }}>GSTIN: {customer.taxId}</p>}
            </div>
          </div>

          {/* Dates */}
          <div style={{ backgroundColor: colors.light, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.primary}30` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', fontSize: '14px' }}>
              <div style={{ color: colors.secondary }}>Invoice Date</div>
              <div style={{ fontWeight: '700', textAlign: 'right' }}>{new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>

              <div style={{ color: colors.secondary }}>Due Date</div>
              <div style={{ fontWeight: '700', textAlign: 'right' }}>{new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '30px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.primary}30` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: colors.secondary, color: 'white' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '14px', textAlign: 'center', width: '80px', fontWeight: '600' }}>Qty</th>
                <th style={{ padding: '14px', textAlign: 'right', width: '100px', fontWeight: '600' }}>Price</th>
                <th style={{ padding: '14px', textAlign: 'right', width: '100px', fontWeight: '600' }}>Total</th>
                {enableGST && <th style={{ padding: '14px', textAlign: 'center', width: '60px', fontWeight: '600' }}>GST</th>}
                {/* Renamed Net to Amount for clarity, or kept Net */}
                <th style={{ padding: '14px 20px', textAlign: 'right', width: '120px', fontWeight: '600' }}>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {itemsWithGST.map((item, index) => (
                <tr key={index} style={{ borderBottom: index === itemsWithGST.length - 1 ? 'none' : '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: colors.text, fontSize: '14px' }}>{item.description}</div>
                    {enableGST && item.hsn && <div style={{ fontSize: '11px', color: colors.gray, marginTop: '2px' }}>HSN: {item.hsn}</div>}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: colors.secondary, fontWeight: '500' }}>{item.quantity}</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace' }}>{item.unitPrice.toFixed(2)}</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace' }}>{item.total.toFixed(2)}</td>
                  {enableGST && <td style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: colors.gray }}>{item.gstBreakdown.gstRate}%</td>}
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: colors.secondary }}>
                    {enableGST ? item.gstBreakdown.totalAmount.toFixed(2) : item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Footer */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          {/* Left Side: QR & Terms */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              {qrCode && (
                <div style={{ border: `1px solid ${colors.primary}30`, padding: '10px', borderRadius: '8px', backgroundColor: 'white' }}>
                  <img src={qrCode} alt="Payment QR" style={{ width: '90px', height: '90px', display: 'block' }} />
                </div>
              )}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '700', color: colors.secondary, margin: '0 0 4px 0' }}>SCAN TO PAY</p>
                <p style={{ fontSize: '11px', color: colors.gray, margin: '0' }}>UPI / GPay / PhonePe</p>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase', marginBottom: '6px' }}>Terms & Conditions</h4>
              <a href="https://myfabclean.com/terms" style={{ fontSize: '13px', color: colors.secondary, textDecoration: 'none', fontWeight: '500' }}>
                myfabclean.com/terms
              </a>
            </div>
          </div>

          {/* Right Side: Totals */}
          <div style={{ width: '300px' }}>
            <div style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: colors.gray }}>
                <span>Subtotal</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '500', color: colors.text }}>{formatIndianCurrency(subtotal)}</span>
              </div>

              {enableGST && (
                isInterState ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: colors.gray }}>
                    <span>IGST</span>
                    <span style={{ fontFamily: 'monospace', color: colors.text }}>{formatIndianCurrency(totalIGST)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: colors.gray }}>
                      <span>CGST</span>
                      <span style={{ fontFamily: 'monospace', color: colors.text }}>{formatIndianCurrency(totalCGST)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: colors.gray }}>
                      <span>SGST</span>
                      <span style={{ fontFamily: 'monospace', color: colors.text }}>{formatIndianCurrency(totalSGST)}</span>
                    </div>
                  </>
                )
              )}

              <div style={{ height: '2px', backgroundColor: colors.primary, margin: '15px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: colors.secondary }}>TOTAL</span>
                {/* Adjust total based on GST inclusion */}
                <span style={{ fontSize: '24px', fontWeight: '900', fontFamily: 'monospace', color: colors.primary }}>
                  {formatIndianCurrency(enableGST ? total : subtotal)}
                </span>
              </div>

              <div style={{ marginTop: '10px', fontSize: '11px', fontStyle: 'italic', color: colors.gray, textAlign: 'right' }}>
                {convertToWords(enableGST ? total : subtotal)} Only
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        backgroundColor: colors.secondary,
        color: 'white',
        padding: '15px 40px',
        fontSize: '12px', // Increased size slightly
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '0.5px' }}>
          Thank you for Choosing Fab Clean!
        </div>
        <div style={{ fontSize: '11px', opacity: 0.9 }}>
          This is a computer generated bill no signature needed
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateIN;
