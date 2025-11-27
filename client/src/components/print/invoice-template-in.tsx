import React from 'react';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
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

// Self-contained utility functions to avoid import issues
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
    company,
    customer,
    items,
    subtotal,
    taxAmount,
    total,
    paymentTerms,
    notes,
    qrCode,
    signature,
  } = data;

  // Determine if this is an inter-state transaction
  const isInterState = customer.taxId && company.taxId
    ? validateGSTIN(company.taxId) && validateGSTIN(customer.taxId)
      ? isInterStateTransaction(company.taxId, customer.taxId)
      : false
    : false;

  // Calculate GST breakdown for each item
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

  // Helper function to convert number to words (simplified version)
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
      const crores = Math.floor(rupees / 10000000);
      result += convertLessThanThousand(crores) + ' Crore ';
      rupees %= 10000000;
    }

    if (rupees >= 100000) {
      const lakhs = Math.floor(rupees / 100000);
      result += convertLessThanThousand(lakhs) + ' Lakh ';
      rupees %= 100000;
    }

    if (rupees >= 1000) {
      const thousands = Math.floor(rupees / 1000);
      result += convertLessThanThousand(thousands) + ' Thousand ';
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
      padding: '32px',
      maxWidth: '210mm',
      minHeight: '297mm',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#1a1a1a'
    }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{company.name}</h1>
            <div style={{ fontSize: '12px', color: '#4a4a4a' }}>
              <p style={{ margin: '4px 0', whiteSpace: 'pre-line' }}>{company.address}</p>
              <p style={{ margin: '4px 0' }}>Phone: {company.phone}</p>
              <p style={{ margin: '4px 0' }}>Email: {company.email}</p>
              <p style={{ margin: '4px 0', fontWeight: '600' }}>GSTIN: {company.taxId}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '12px 24px', borderRadius: '8px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>TAX INVOICE</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>Invoice No.</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Bill To:</h3>
          <div style={{ fontSize: '12px' }}>
            <p style={{ fontWeight: 'bold', margin: '4px 0' }}>{customer.name}</p>
            <p style={{ margin: '4px 0', whiteSpace: 'pre-line' }}>{customer.address}</p>
            <p style={{ margin: '4px 0' }}>Phone: {customer.phone}</p>
            <p style={{ margin: '4px 0' }}>Email: {customer.email}</p>
            {customer.taxId && <p style={{ fontWeight: '600', margin: '4px 0' }}>GSTIN: {customer.taxId}</p>}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Invoice Details:</h3>
          <div style={{ fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
              <span style={{ color: '#666' }}>Invoice Date:</span>
              <span style={{ fontWeight: '600' }}>{new Date(invoiceDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
              <span style={{ color: '#666' }}>Due Date:</span>
              <span style={{ fontWeight: '600' }}>{new Date(dueDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
              <span style={{ color: '#666' }}>Payment Terms:</span>
              <span style={{ fontWeight: '600' }}>{paymentTerms}</span>
            </div>
            {isInterState && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                <span style={{ color: '#666' }}>Transaction Type:</span>
                <span style={{ fontWeight: '600', color: '#ff6b00' }}>Inter-State (IGST)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'left', width: '48px' }}>#</th>
              <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'left' }}>Item & Description</th>
              <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'center', width: '96px' }}>HSN/SAC</th>
              <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'center', width: '64px' }}>Qty</th>
              <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'right', width: '96px' }}>Rate (₹)</th>
              <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'right', width: '96px' }}>Amount (₹)</th>
              <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'center', width: '80px' }}>GST %</th>
              {isInterState ? (
                <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'right', width: '96px' }}>IGST (₹)</th>
              ) : (
                <>
                  <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'right', width: '96px' }}>CGST (₹)</th>
                  <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'right', width: '96px' }}>SGST (₹)</th>
                </>
              )}
              <th style={{ padding: '12px', border: '1px solid #333', textAlign: 'right', width: '112px' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithGST.map((item, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{item.description}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', fontFamily: 'monospace' }}>{item.hsn || '-'}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{item.total.toFixed(2)}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{item.gstBreakdown.gstRate}%</td>
                {isInterState ? (
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{item.gstBreakdown.igst.toFixed(2)}</td>
                ) : (
                  <>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{item.gstBreakdown.cgst.toFixed(2)}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace' }}>{item.gstBreakdown.sgst.toFixed(2)}</td>
                  </>
                )}
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>{item.gstBreakdown.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <div style={{ width: '384px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
              <span>Subtotal (before tax):</span>
              <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(subtotal)}</span>
            </div>

            {isInterState ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                <span>IGST:</span>
                <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(totalIGST)}</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                  <span>CGST:</span>
                  <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(totalCGST)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                  <span>SGST:</span>
                  <span style={{ fontFamily: 'monospace' }}>{formatIndianCurrency(totalSGST)}</span>
                </div>
              </>
            )}

            <div style={{ borderTop: '2px solid #ddd', paddingTop: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total Amount:</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatIndianCurrency(total)}</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
              <p style={{ fontWeight: '600', margin: '4px 0' }}>Amount in Words:</p>
              <p style={{ fontStyle: 'italic', margin: '4px 0' }}>{convertToWords(total)} Only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px solid #ddd', paddingTop: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Terms & Conditions */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Terms & Conditions</h4>
            <div style={{ fontSize: '11px', color: '#666' }}>
              <p style={{ margin: '4px 0' }}>• Payment Terms: {paymentTerms}</p>
              <p style={{ margin: '4px 0' }}>• Please make cheques/drafts payable to "{company.name}"</p>
              <p style={{ margin: '4px 0' }}>• Interest @ 18% p.a. will be charged on delayed payments</p>
              <p style={{ margin: '4px 0' }}>• All disputes subject to local jurisdiction only</p>
              <p style={{ margin: '4px 0' }}>• Goods once sold will not be taken back or exchanged</p>
            </div>
            {notes && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', margin: '4px 0' }}>Notes:</p>
                <p style={{ fontSize: '11px', color: '#666', whiteSpace: 'pre-line', margin: '4px 0' }}>{notes}</p>
              </div>
            )}
          </div>

          {/* QR Code for Payment */}
          <div style={{ textAlign: 'center' }}>
            {qrCode && (
              <div>
                <img src={qrCode} alt="Payment QR Code" style={{ width: '128px', height: '128px', margin: '0 auto 8px', border: '1px solid #ddd' }} />
                <p style={{ fontSize: '11px', color: '#666' }}>Scan to Pay</p>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details and Signature */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Bank Details</h4>
            <div style={{ fontSize: '11px', color: '#666' }}>
              <p style={{ margin: '4px 0' }}><span style={{ fontWeight: '600' }}>Bank Name:</span> HDFC Bank</p>
              <p style={{ margin: '4px 0' }}><span style={{ fontWeight: '600' }}>Account No:</span> XXXX XXXX XXXX 1234</p>
              <p style={{ margin: '4px 0' }}><span style={{ fontWeight: '600' }}>IFSC Code:</span> HDFC0001234</p>
              <p style={{ margin: '4px 0' }}><span style={{ fontWeight: '600' }}>Branch:</span> Sample Branch</p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '16px' }}>
              {signature && (
                <img src={signature} alt="Authorized Signature" style={{ width: '160px', height: '80px', marginLeft: 'auto' }} />
              )}
            </div>
            <div style={{ borderTop: '1px solid #999', paddingTop: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0' }}>Authorized Signatory</p>
              <p style={{ fontSize: '11px', color: '#666', margin: '4px 0' }}>For {company.name}</p>
            </div>
          </div>
        </div>

        {/* Declaration */}
        <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', fontSize: '11px', color: '#666' }}>
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>Declaration:</p>
          <p>
            We declare that this invoice shows the actual price of the goods described and that all particulars
            are true and correct. This is a computer generated invoice and does not require a physical signature.
          </p>
        </div>

        {/* Footer Info */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#999', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
          <p>This is a computer generated document. No signature is required.</p>
          <p style={{ marginTop: '4px' }}>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateIN;
