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
            <p className="text-sm text-muted-foreground">Invoice #: {invoiceData.invoiceNumber}</p>
            <p className="text-sm text-muted-foreground">Date: {invoiceData.invoiceDate}</p>
            {invoiceData.orderNumber && (
              <p className="text-sm text-muted-foreground">Order #: {invoiceData.orderNumber}</p>
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
