import React from 'react';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  // We keep the interface for type safety, even though we override company details below
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
  } = data;

  // HARDCODED COMPANY DETAILS FROM MYFABCLEAN.IN
  const companyDetails = {
    name: "Fab Clean",
    address: "#16, Venkatramana Round Road,\nMahalingapuram, Pollachi - 642002",
    phone: "93630 59595",
    email: "info@myfabclean.in",
    taxId: data.company.taxId // We keep the Tax ID dynamic if it comes from DB, or you can hardcode it here
  };

  // Determine if this is an inter-state transaction
  const isInterState = customer.taxId && companyDetails.taxId
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

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '40px',
      maxWidth: '210mm',
      minHeight: '297mm',
      // Optimized font stack for macOS and modern browsers
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#1a1a1a',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>{companyDetails.name}</h1>
            <div style={{ fontSize: '13px', color: '#4a4a4a' }}>
              <p style={{ margin: '4px 0', whiteSpace: 'pre-line' }}>{companyDetails.address}</p>
              <p style={{ margin: '4px 0' }}>Phone: {companyDetails.phone}</p>
              <p style={{ margin: '4px 0' }}>Email: {companyDetails.email}</p>
              {companyDetails.taxId && <p style={{ margin: '4px 0', fontWeight: '600' }}>GSTIN: {companyDetails.taxId}</p>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '8px 20px', borderRadius: '6px', marginBottom: '12px', display: 'inline-block' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>INVOICE</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>Invoice No.</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Customer & Invoice Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Bill To:</h3>
          <div style={{ fontSize: '14px' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '16px' }}>{customer.name}</p>
            <p style={{ margin: '0 0 4px 0', whiteSpace: 'pre-line', color: '#374151' }}>{customer.address}</p>
            <p style={{ margin: '0 0 4px 0', color: '#374151' }}>{customer.phone}</p>
            {customer.taxId && <p style={{ fontWeight: '600', margin: '8px 0 0 0' }}>GSTIN: {customer.taxId}</p>}
          </div>
        </div>

        <div style={{ paddingTop: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', fontSize: '14px' }}>
            <div style={{ color: '#666' }}>Invoice Date:</div>
            <div style={{ fontWeight: '600' }}>{new Date(invoiceDate).toLocaleDateString('en-IN')}</div>

            <div style={{ color: '#666' }}>Due Date:</div>
            <div style={{ fontWeight: '600' }}>{new Date(dueDate).toLocaleDateString('en-IN')}</div>

            {isInterState && (
              <>
                <div style={{ color: '#666' }}>Type:</div>
                <div style={{ fontWeight: '600', color: '#ea580c' }}>Inter-State (IGST)</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderTopLeftRadius: '6px' }}>Item Description</th>
              <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>Qty</th>
              <th style={{ padding: '12px', textAlign: 'right', width: '100px' }}>Price</th>
              <th style={{ padding: '12px', textAlign: 'right', width: '100px' }}>Total</th>
              <th style={{ padding: '12px', textAlign: 'center', width: '60px' }}>GST</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', width: '110px', borderTopRightRadius: '6px' }}>Net</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithGST.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '500' }}>{item.description}</div>
                  {item.hsn && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>HSN: {item.hsn}</div>}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace' }}>{item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace' }}>{item.total.toFixed(2)}</td>
                <td style={{ padding: '16px', textAlign: 'center', fontSize: '11px' }}>{item.gstBreakdown.gstRate}%</td>
                <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                  {item.gstBreakdown.totalAmount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ width: '400px', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '24px' }}>
          <div style={{ fontSize: '13px', spaceY: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#4b5563' }}>Subtotal</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>{formatIndianCurrency(subtotal)}</span>
            </div>

            {isInterState ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#4b5563' }}>IGST</span>
                <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(totalIGST)}</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#4b5563' }}>CGST</span>
                  <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(totalCGST)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#4b5563' }}>SGST</span>
                  <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(totalSGST)}</span>
                </div>
              </>
            )}

            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total</span>
              <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'monospace' }}>{formatIndianCurrency(total)}</span>
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', fontStyle: 'italic', color: '#6b7280' }}>
              {convertToWords(total)} Only
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Terms */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: '#1a1a1a' }}>Terms & Conditions</h4>
          <p style={{ fontSize: '13px', color: '#374151' }}>
            Refer to myfabclean.com/terms
          </p>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center' }}>
          {qrCode && (
            <div>
              <img src={qrCode} alt="Payment QR" style={{ width: '100px', height: '100px', marginBottom: '8px' }} />
              <p style={{ fontSize: '11px', color: '#666', fontWeight: '500' }}>Scan to Pay</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Timestamp */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '20px',
        textAlign: 'center',
        fontSize: '10px',
        color: '#9ca3af'
      }}>
        Printed on: {new Date().toLocaleString('en-IN')}
      </div>
    </div>
  );
};

export default InvoiceTemplateIN;
