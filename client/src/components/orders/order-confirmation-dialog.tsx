import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, MessageCircle, FileText, Tag } from 'lucide-react';
import JsBarcode from 'jsbarcode';
// @ts-ignore
import QRCode from 'qrcode';
import { Order } from '../../../../shared/schema';
import { formatCurrency, formatDate } from '@/lib/data-service';

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onClose: () => void;
}

export function OrderConfirmationDialog({
  open,
  onOpenChange,
  order,
  onClose,
}: OrderConfirmationDialogProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrcodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && order && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, order.orderNumber, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    }

    if (open && order && qrcodeRef.current) {
      // Generate QR code for payment or order tracking
      // For now, let's encode the order ID or a payment link
      const qrData = `upi://pay?pa=fabzclean@upi&pn=FabZClean&am=${order.totalAmount}&tr=${order.orderNumber}&tn=Order ${order.orderNumber}`;
      QRCode.toCanvas(qrcodeRef.current, qrData, { width: 128 }, (error: any) => {
        if (error) console.error("QR Code generation failed", error);
      });
    }
  }, [open, order]);

  const handlePrintBill = () => {
    if (!order) return;
    // Open the dedicated bill view page
    const url = `${window.location.origin}/bill/${order.orderNumber}`;
    window.open(url, '_blank');
  };

  const handlePrintTags = () => {
    if (!order) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate tags HTML
    let tagsHtml = '';

    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const qty = item.quantity;
        for (let i = 1; i <= qty; i++) {
          tagsHtml += `
            <div class="tag">
              <div class="customer">${order.customerName}</div>
              <div class="phone">${order.customerPhone}</div>
              <div class="item">${item.productName}</div>
              <div class="count">${i} of ${qty}</div>
              <div class="order-id">${order.orderNumber}</div>
            </div>
            <div class="page-break"></div>
          `;
        }
      });
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Tags - ${order.orderNumber}</title>
          <style>
            body { 
              font-family: monospace; 
              margin: 0; 
              padding: 0; 
              width: 58mm; /* Standard thermal paper width */
            }
            .tag { 
              padding: 5px; 
              text-align: center; 
              border-bottom: 1px dashed #000;
              margin-bottom: 5px;
            }
            .customer { font-weight: bold; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .phone { font-size: 12px; }
            .item { font-size: 12px; margin-top: 2px; font-weight: bold; }
            .count { font-size: 14px; font-weight: bold; margin-top: 2px; }
            .order-id { font-size: 10px; margin-top: 2px; }
            .page-break { page-break-after: always; }
            @media print {
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${tagsHtml}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleWhatsApp = () => {
    if (!order) return;
    const billUrl = `${window.location.origin}/bill/${order.orderNumber}`;
    const message = `Hello ${order.customerName}, your order ${order.orderNumber} has been created successfully!
    
Total Amount: ${formatCurrency(Number(order.totalAmount))}

You can view and download your bill here:
${billUrl}

Thank you for choosing FabZClean!`;

    const url = `https://wa.me/${order.customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl">Order Created Successfully!</DialogTitle>
          <DialogDescription className="text-center">
            Order #{order.orderNumber} has been saved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="bg-white p-2 rounded-lg border">
            <svg ref={barcodeRef} className="w-full max-w-[200px]"></svg>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(Number(order.totalAmount))}</p>
            </div>
            <div className="border rounded-lg p-3 text-center flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground mb-1">Scan to Pay</p>
              <canvas ref={qrcodeRef} className="h-12 w-12"></canvas>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={handlePrintBill} variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Print Bill
            </Button>
            <Button onClick={handlePrintTags} variant="outline" className="w-full">
              <Tag className="h-4 w-4 mr-2" />
              Print Tags
            </Button>
          </div>
          <Button onClick={handleWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send on WhatsApp
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Close & Start New Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
