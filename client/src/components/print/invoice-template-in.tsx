
import React from 'react';
import { calculateGST, formatIndianCurrency, isInterStateTransaction, validateGSTIN } from '@/../../shared/gst-utils';

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
    const gstBreakdown = calculateGST(item.total, gstRate as any, isInterState);
    return {
      ...item,
      gstBreakdown
    };
  });

  // Calculate totals
  const totalCGST = itemsWithGST.reduce((sum, item) => sum + item.gstBreakdown.cgst, 0);
  const totalSGST = itemsWithGST.reduce((sum, item) => sum + item.gstBreakdown.sgst, 0);
  const totalIGST = itemsWithGST.reduce((sum, item) => sum + item.gstBreakdown.igst, 0);

  const renderHeader = () => (
    <div className="border-b-2 border-gray-800 pb-6 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          {company.logo && (
            <img src={company.logo} alt="Company Logo" className="w-20 h-20 object-contain" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="whitespace-pre-line">{company.address}</p>
              <p>Phone: {company.phone}</p>
              <p>Email: {company.email}</p>
              <p className="font-semibold">GSTIN: {company.taxId}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-lg mb-2">
            <h2 className="text-2xl font-bold">TAX INVOICE</h2>
          </div>
          <p className="text-sm text-gray-600">Invoice No.</p>
          <p className="text-xl font-bold text-gray-900">{invoiceNumber}</p>
        </div>
      </div>
    </div>
  );

  const renderCustomerInfo = () => (
    <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Bill To:</h3>
        <div className="text-sm space-y-1">
          <p className="font-bold text-gray-900">{customer.name}</p>
          <p className="text-gray-700 whitespace-pre-line">{customer.address}</p>
          <p className="text-gray-700">Phone: {customer.phone}</p>
          <p className="text-gray-700">Email: {customer.email}</p>
          {customer.taxId && <p className="font-semibold text-gray-900">GSTIN: {customer.taxId}</p>}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Invoice Details:</h3>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice Date:</span>
            <span className="font-semibold text-gray-900">{new Date(invoiceDate).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Due Date:</span>
            <span className="font-semibold text-gray-900">{new Date(dueDate).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Terms:</span>
            <span className="font-semibold text-gray-900">{paymentTerms}</span>
          </div>
          {isInterState && (
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction Type:</span>
              <span className="font-semibold text-orange-600">Inter-State (IGST)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderItemsTable = () => (
    <div className="mb-6">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="p-3 border border-gray-700 text-left w-12">#</th>
            <th className="p-3 border border-gray-700 text-left">Item & Description</th>
            <th className="p-3 border border-gray-700 text-center w-24">HSN/SAC</th>
            <th className="p-3 border border-gray-700 text-center w-16">Qty</th>
            <th className="p-3 border border-gray-700 text-right w-24">Rate (₹)</th>
            <th className="p-3 border border-gray-700 text-right w-24">Amount (₹)</th>
            <th className="p-3 border border-gray-700 text-center w-20">GST %</th>
            {isInterState ? (
              <th className="p-3 border border-gray-700 text-right w-24">IGST (₹)</th>
            ) : (
              <>
                <th className="p-3 border border-gray-700 text-right w-24">CGST (₹)</th>
                <th className="p-3 border border-gray-700 text-right w-24">SGST (₹)</th>
              </>
            )}
            <th className="p-3 border border-gray-700 text-right w-28">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {itemsWithGST.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="p-3 border border-gray-300 text-center">{index + 1}</td>
              <td className="p-3 border border-gray-300">{item.description}</td>
              <td className="p-3 border border-gray-300 text-center font-mono">{item.hsn || '-'}</td>
              <td className="p-3 border border-gray-300 text-center">{item.quantity}</td>
              <td className="p-3 border border-gray-300 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
              <td className="p-3 border border-gray-300 text-right font-mono">{item.total.toFixed(2)}</td>
              <td className="p-3 border border-gray-300 text-center">{item.gstBreakdown.gstRate}%</td>
              {isInterState ? (
                <td className="p-3 border border-gray-300 text-right font-mono">{item.gstBreakdown.igst.toFixed(2)}</td>
              ) : (
                <>
                  <td className="p-3 border border-gray-300 text-right font-mono">{item.gstBreakdown.cgst.toFixed(2)}</td>
                  <td className="p-3 border border-gray-300 text-right font-mono">{item.gstBreakdown.sgst.toFixed(2)}</td>
                </>
              )}
              <td className="p-3 border border-gray-300 text-right font-mono font-semibold">{item.gstBreakdown.totalAmount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTotals = () => (
    <div className="flex justify-end mb-6">
      <div className="w-96">
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Subtotal (before tax):</span>
            <span className="font-mono">{formatIndianCurrency(subtotal)}</span>
          </div>

          {isInterState ? (
            <div className="flex justify-between">
              <span className="text-gray-700">IGST:</span>
              <span className="font-mono">{formatIndianCurrency(totalIGST)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-gray-700">CGST:</span>
                <span className="font-mono">{formatIndianCurrency(totalCGST)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">SGST:</span>
                <span className="font-mono">{formatIndianCurrency(totalSGST)}</span>
              </div>
            </>
          )}

          <div className="border-t-2 border-gray-300 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900 font-mono">{formatIndianCurrency(total)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-300">
            <p className="font-semibold">Amount in Words:</p>
            <p className="italic">{convertToWords(total)} Only</p>
          </div>
        </div>
      </div>
    </div>
  );

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

  const renderFooter = () => (
    <div className="border-t-2 border-gray-300 pt-6">
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Terms & Conditions */}
        <div className="col-span-2">
          <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase">Terms & Conditions</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Payment Terms: {paymentTerms}</p>
            <p>• Please make cheques/drafts payable to "{company.name}"</p>
            <p>• Interest @ 18% p.a. will be charged on delayed payments</p>
            <p>• All disputes subject to local jurisdiction only</p>
            <p>• Goods once sold will not be taken back or exchanged</p>
          </div>
          {notes && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-700">Notes:</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">{notes}</p>
            </div>
          )}
        </div>

        {/* QR Code for Payment */}
        <div className="text-center">
          {qrCode && (
            <div>
              <img src={qrCode} alt="Payment QR Code" className="w-32 h-32 mx-auto mb-2 border border-gray-300" />
              <p className="text-xs text-gray-600">Scan to Pay</p>
            </div>
          )}
        </div>
      </div>

      {/* Bank Details and Signature */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase">Bank Details</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><span className="font-semibold">Bank Name:</span> HDFC Bank</p>
            <p><span className="font-semibold">Account No:</span> XXXX XXXX XXXX 1234</p>
            <p><span className="font-semibold">IFSC Code:</span> HDFC0001234</p>
            <p><span className="font-semibold">Branch:</span> Sample Branch</p>
          </div>
        </div>

        <div className="text-right">
          <div className="mb-4">
            {signature && (
              <img src={signature} alt="Authorized Signature" className="w-40 h-20 ml-auto" />
            )}
          </div>
          <div className="border-t border-gray-400 pt-2">
            <p className="text-sm font-bold text-gray-800">Authorized Signatory</p>
            <p className="text-xs text-gray-600">For {company.name}</p>
          </div>
        </div>
      </div>

      {/* Declaration */}
      <div className="bg-gray-100 p-3 rounded text-xs text-gray-700">
        <p className="font-semibold mb-1">Declaration:</p>
        <p>
          We declare that this invoice shows the actual price of the goods described and that all particulars
          are true and correct. This is a computer generated invoice and does not require a physical signature.
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-300 pt-3">
        <p>This is a computer generated document. No signature is required.</p>
        <p className="mt-1">Thank you for your business!</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-8 mx-auto border-2 border-gray-300 shadow-lg print:shadow-none print:border-gray-400" style={{ maxWidth: '210mm', minHeight: '297mm' }}>
      {renderHeader()}
      {renderCustomerInfo()}
      {renderItemsTable()}
      {renderTotals()}
      {renderFooter()}

      {/* Print styles */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-gray-400 {
            border-color: #9ca3af !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceTemplateIN;
