import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/data-service';
import type { InvoicePrintData } from '@/lib/print-driver';

interface InvoicePreviewProps {
  invoiceData: InvoicePrintData;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}

export default function InvoicePreview({
  invoiceData,
  onPrint,
  onDownload,
  className
}: InvoicePreviewProps) {
  return (
    <Card className={`max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Invoice Preview</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{invoiceData.companyInfo.name}</h1>
            <p className="text-muted-foreground">{invoiceData.companyInfo.address}</p>
            <p className="text-muted-foreground">Phone: {invoiceData.companyInfo.phone}</p>
            <p className="text-muted-foreground">Email: {invoiceData.companyInfo.email}</p>
            {invoiceData.companyInfo.website && (
              <p className="text-muted-foreground">Website: {invoiceData.companyInfo.website}</p>
            )}
          </div>

          <div className="text-right">
            <h2 className="text-2xl font-bold">INVOICE</h2>
            <p className="text-sm text-muted-foreground">Invoice #: {invoiceData.invoiceNumber ? invoiceData.invoiceNumber.slice(-10) : ''}</p>
            <p className="text-sm text-muted-foreground">Date: {invoiceData.invoiceDate}</p>
            {invoiceData.orderNumber && (
              <p className="text-sm text-muted-foreground">Order #: {invoiceData.orderNumber.slice(-10)}</p>
            )}
            {invoiceData.dueDate && (
              <p className="text-sm text-muted-foreground">Due Date: {invoiceData.dueDate}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Customer Information */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
            <div className="space-y-1">
              <p className="font-medium">{invoiceData.customerInfo.name}</p>
              <p className="text-muted-foreground">{invoiceData.customerInfo.address}</p>
              <p className="text-muted-foreground">Phone: {invoiceData.customerInfo.phone}</p>
              <p className="text-muted-foreground">Email: {invoiceData.customerInfo.email}</p>
            </div>
          </div>

          <div className="text-right">
            {invoiceData.paymentStatus && (
              <div className="mb-4">
                <Badge
                  variant={invoiceData.paymentStatus.toLowerCase() === 'paid' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  Status: {invoiceData.paymentStatus.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Items Table */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Items</h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-4 grid grid-cols-4 gap-4 font-semibold border-b">
              <div>Item/Description</div>
              <div className="text-center">Qty</div>
              <div className="text-right">Unit Price</div>
              <div className="text-right">Total</div>
            </div>

            {invoiceData.items.map((item, index) => (
              <div key={index} className="p-4 grid grid-cols-4 gap-4 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <div className="text-center">{item.quantity}</div>
                <div className="text-right">{formatCurrency(item.unitPrice)}</div>
                <div className="text-right font-medium">{formatCurrency(item.total)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-80 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoiceData.subtotal)}</span>
            </div>

            {invoiceData.discount && invoiceData.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(invoiceData.discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatCurrency(invoiceData.tax)}</span>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(invoiceData.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {(invoiceData.paymentMethod || invoiceData.paymentStatus) && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {invoiceData.paymentMethod && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{invoiceData.paymentMethod}</p>
                </div>
              )}
              {invoiceData.paymentStatus && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <p className="font-medium">{invoiceData.paymentStatus}</p>
                </div>
              )}
              {invoiceData.qrCode && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment QR</p>
                  <img src={invoiceData.qrCode} alt="Payment QR" className="w-24 h-24 mt-1 border rounded" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Breakdown (Wallet / Cash / Credit Split) */}
        {invoiceData.paymentBreakdown && (invoiceData.paymentBreakdown.walletDeducted > 0 || invoiceData.paymentBreakdown.creditOutstanding > 0) && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Payment Breakdown</h3>
            <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
              {invoiceData.paymentBreakdown.walletDeducted > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">WALLET</Badge>
                    <span className="text-sm">Deducted from Wallet</span>
                  </div>
                  <span className="font-semibold text-purple-600">−{formatCurrency(invoiceData.paymentBreakdown.walletDeducted)}</span>
                </div>
              )}
              {invoiceData.paymentBreakdown.cashPaid > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">{invoiceData.paymentBreakdown.paymentMethod || 'CASH'}</Badge>
                    <span className="text-sm">Paid</span>
                  </div>
                  <span className="font-semibold text-green-600">−{formatCurrency(invoiceData.paymentBreakdown.cashPaid)}</span>
                </div>
              )}
              {invoiceData.paymentBreakdown.creditOutstanding > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">CREDIT</Badge>
                    <span className="text-sm">Added to Outstanding</span>
                  </div>
                  <span className="font-bold text-amber-600">{formatCurrency(invoiceData.paymentBreakdown.creditOutstanding)}</span>
                </div>
              )}
              {invoiceData.paymentBreakdown.creditOutstanding > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center bg-amber-50 rounded-md p-3 border border-amber-200">
                    <div>
                      <p className="text-xs font-semibold text-amber-800">CUSTOMER OUTSTANDING BALANCE</p>
                      {invoiceData.paymentBreakdown.previousOutstanding > 0 && (
                        <p className="text-xs text-amber-600">Previous: {formatCurrency(invoiceData.paymentBreakdown.previousOutstanding)}</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-amber-800">{formatCurrency(invoiceData.paymentBreakdown.newOutstanding)}</span>
                  </div>
                </>
              )}
              {invoiceData.paymentBreakdown.creditOutstanding === 0 && (
                <div className="flex justify-center p-2 bg-green-50 rounded-md border border-green-200">
                  <span className="text-sm font-bold text-green-600">✅ FULLY PAID</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoiceData.notes && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Notes</h3>
            <p className="text-muted-foreground">{invoiceData.notes}</p>
          </div>
        )}

        {/* Terms */}
        {invoiceData.terms && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Terms & Conditions</h3>
            <p className="text-sm text-muted-foreground">{invoiceData.terms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
