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
import { formatCurrency } from '@/lib/data-service';

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

  // Get total amount, handle both string and number types
  const getTotalAmount = () => {
    if (!order) return 0;
    const amount = order.totalAmount;
    if (typeof amount === 'string') {
      return parseFloat(amount) || 0;
    }
    return Number(amount) || 0;
  };

  const totalAmount = getTotalAmount();

  useEffect(() => {
    if (open && order && order.orderNumber && barcodeRef.current) {
      try {
        // Clear previous barcode
        barcodeRef.current.innerHTML = '';
        JsBarcode(barcodeRef.current, order.orderNumber, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
        console.log('Barcode generated for:', order.orderNumber);
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    }

    if (open && order && qrcodeRef.current && totalAmount > 0) {
      try {
        // Clear previous QR code
        const ctx = qrcodeRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, qrcodeRef.current.width, qrcodeRef.current.height);
        }

        const qrData = `upi://pay?pa=fabzclean@upi&pn=FabZClean&am=${totalAmount}&tr=${order.orderNumber}&tn=Order ${order.orderNumber}`;
        QRCode.toCanvas(qrcodeRef.current, qrData, {
          width: 128,
          margin: 2,
          color: {
            dark: '#16a34a',
            light: '#ffffff'
          }
        }, (error: any) => {
          if (error) {
            console.error("QR Code generation failed", error);
          } else {
            console.log('QR Code generated for amount:', totalAmount);
          }
        });
      } catch (e) {
        console.error("QR Code generation error", e);
      }
    }
  }, [open, order, totalAmount]);

  const handlePrintBill = () => {
    if (!order || !order.orderNumber) return;
    // Open the dedicated bill view page
    const url = `${window.location.origin}/bill/${order.orderNumber}`;
    window.open(url, '_blank');
  };

  const handlePrintTags = () => {
    if (!order) {
      console.error('No order data available for printing tags');
      return;
    }

    console.log('Printing tags for order:', order);
    console.log('Order items:', order.items);

    // Check if items exist
    if (!Array.isArray(order.items) || order.items.length === 0) {
      alert('No items found in this order to print tags for.');
      return;
    }

    // Generate tags HTML - one tag per item quantity
    let tagsHtml = '';
    let totalTags = 0;

    order.items.forEach((item: any, itemIndex: number) => {
      const qty = parseInt(String(item.quantity || 1));
      const itemName = item.productName || item.name || 'Item';

      for (let i = 1; i <= qty; i++) {
        totalTags++;
        tagsHtml += `
          <div class="tag-page">
            <div class="tag-container">
              <div class="tag-header">
                <div class="company-name">FabZClean</div>
                <div class="tag-title">LAUNDRY TAG</div>
              </div>
              
              <div class="tag-body">
                <div class="section">
                  <div class="label">Customer:</div>
                  <div class="value customer-name">${order.customerName || 'Customer'}</div>
                </div>
                
                <div class="section">
                  <div class="label">Phone:</div>
                  <div class="value">${order.customerPhone || ''}</div>
                </div>
                
                <div class="section item-section">
                  <div class="label">Item:</div>
                  <div class="value item-name">${itemName}</div>
                </div>
                
                <div class="section">
                  <div class="label">Piece:</div>
                  <div class="value piece-count">${i} of ${qty}</div>
                </div>
                
                <div class="section">
                  <div class="label">Order ID:</div>
                  <div class="value order-number">${order.orderNumber}</div>
                </div>
              </div>
              
              <div class="tag-footer">
                <div class="footer-text">Please verify items before leaving</div>
              </div>
            </div>
          </div>
        `;
      }
    });

    console.log(`Generated ${totalTags} tags`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Laundry Tags - ${order.orderNumber}</title>
          <style>
            /* Reset */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            /* Body - Default for 58mm thermal printer */
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif; 
              background: white;
              margin: 0;
              padding: 0;
            }
            
            /* Tag Page - Each tag on separate page */
            .tag-page {
              width: 58mm;
              min-height: 80mm;
              page-break-after: always;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2mm;
            }
            
            /* Tag Container */
            .tag-container {
              width: 100%;
              border: 2px solid #000;
              padding: 3mm;
              background: white;
            }
            
            /* Header */
            .tag-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 2mm;
              margin-bottom: 3mm;
            }
            
            .company-name {
              font-size: 14pt;
              font-weight: bold;
              letter-spacing: 1px;
            }
            
            .tag-title {
              font-size: 8pt;
              margin-top: 1mm;
              color: #666;
            }
            
            /* Body Sections */
            .tag-body {
              margin: 3mm 0;
            }
            
            .section {
              margin: 2mm 0;
              display: flex;
              align-items: baseline;
            }
            
            .label {
              font-size: 8pt;
              font-weight: bold;
              width: 15mm;
              flex-shrink: 0;
            }
            
            .value {
              font-size: 9pt;
              flex: 1;
              word-wrap: break-word;
            }
            
            .customer-name {
              font-size: 11pt;
              font-weight: bold;
            }
            
            .item-section {
              background: #f0f0f0;
              padding: 2mm;
              margin: 3mm -3mm;
              border-left: 3px solid #000;
            }
            
            .item-name {
              font-size: 10pt;
              font-weight: bold;
            }
            
            .piece-count {
              font-size: 11pt;
              font-weight: bold;
              color: #000;
            }
            
            .order-number {
              font-family: 'Courier New', monospace;
              font-size: 8pt;
            }
            
            /* Footer */
            .tag-footer {
              border-top: 1px dashed #666;
              padding-top: 2mm;
              margin-top: 3mm;
              text-align: center;
            }
            
            .footer-text {
              font-size: 7pt;
              color: #666;
              font-style: italic;
            }
            
            /* Print-specific styles */
            @media print {
              @page {
                size: 58mm auto;
                margin: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
              }
              
              .tag-page {
                page-break-after: always;
                margin: 0;
                padding: 2mm;
              }
              
              .tag-container {
                border: 2px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .item-section {
                background: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            
            /* 80mm thermal printer alternative */
            @media print and (min-width: 80mm) {
              @page {
                size: 80mm auto;
              }
              
              .tag-page {
                width: 80mm;
              }
              
              .company-name {
                font-size: 16pt;
              }
              
              .value {
                font-size: 10pt;
              }
              
              .customer-name {
                font-size: 12pt;
              }
              
              .item-name {
                font-size: 11pt;
              }
            }
          </style>
        </head>
        <body>
          ${tagsHtml}
          <script>
            console.log('Tag print window loaded with ${totalTags} tags');
            
            // Auto-print after content loads
            window.addEventListener('load', function() {
              setTimeout(function() {
                console.log('Triggering print dialog...');
                window.print();
              }, 300);
            });
            
            // Log when print dialog closes
            window.addEventListener('afterprint', function() {
              console.log('Print dialog closed');
            });
          </script>
        </body>
      </html>
    `;

    // Open new window with proper dimensions
    const printWindow = window.open('', 'TagPrint', 'width=600,height=800,scrollbars=yes');

    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print tags.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    console.log('Tags window opened successfully');
  };

  const handleWhatsApp = () => {
    if (!order) return;
    const billUrl = `${window.location.origin}/bill/${order.orderNumber}`;
    const phone = order.customerPhone?.replace(/\D/g, ''); // Remove non-digits

    const message = `Hello ${order.customerName || 'Valued Customer'},

Your order *${order.orderNumber}* has been created successfully! ✅

*Total Amount:* ${formatCurrency(totalAmount)}

📄 View and download your bill here:
${billUrl}

Thank you for choosing FabZClean! 🌟`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!order) return null;

  console.log('Order data in dialog:', order);
  console.log('Total amount:', totalAmount);

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
          <div className="bg-white p-2 rounded-lg border w-full flex justify-center">
            <svg ref={barcodeRef} className="max-w-[200px]"></svg>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="border rounded-lg p-3 text-center flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground mb-2">Scan to Pay</p>
              <canvas ref={qrcodeRef} width="128" height="128" className="max-w-[80px] max-h-[80px]"></canvas>
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
