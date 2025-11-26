import React, { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, MessageCircle, FileText, Tag, Loader2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
// @ts-ignore
import QRCode from 'qrcode';
import { Order } from '../../../../shared/schema';
import { formatCurrency, customersApi } from '@/lib/data-service';
import { WhatsAppService } from '@/lib/whatsapp-service';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

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
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const { toast } = useToast();

    // Fetch customer details if phone is missing in order
    const { data: customerData } = useQuery({
        queryKey: ['customer', order?.customerId],
        queryFn: () => order?.customerId ? customersApi.get(order.customerId) : null,
        enabled: !!order?.customerId && !order?.customerPhone,
    });

    // Get effective phone number
    const customerPhone = order?.customerPhone || customerData?.phone;

    // Calculate total amount from order
    const getTotalAmount = (): number => {
        if (!order) return 0;

        let amount = 0;

        // Try totalAmount field first
        if (order.totalAmount) {
            if (typeof order.totalAmount === 'string') {
                amount = parseFloat(order.totalAmount.replace(/[^0-9.]/g, '')) || 0;
            } else {
                amount = Number(order.totalAmount) || 0;
            }
        }

        // Fallback: calculate from items
        if (amount === 0 && Array.isArray(order.items) && order.items.length > 0) {
            amount = order.items.reduce((sum: number, item: any) => {
                const price = parseFloat(String(item.price || 0));
                const qty = parseInt(String(item.quantity || 1));
                return sum + (price * qty);
            }, 0);
        }

        return amount;
    };

    const totalAmount = getTotalAmount();

    const autoSentRef = useRef<string | null>(null);

    // Generate barcode and QR code - MOVED BEFORE auto-send to ensure it runs first
    useEffect(() => {
        if (!open || !order) return;

        console.log('🔄 Starting code generation for order:', order.orderNumber);

        const generateCodes = () => {
            // Barcode - Use SVG for best quality
            if (order.orderNumber && barcodeRef.current) {
                try {
                    console.log('📊 Generating barcode for:', order.orderNumber);
                    console.log('📊 Barcode ref exists:', !!barcodeRef.current);

                    JsBarcode(barcodeRef.current, order.orderNumber, {
                        format: "CODE128",
                        width: 3, // Increased width for better visibility
                        height: 100, // Increased height
                        displayValue: true,
                        fontSize: 20,
                        margin: 10,
                        background: "#ffffff",
                        lineColor: "#000000",
                        textAlign: "center",
                        textPosition: "bottom"
                    });
                    console.log('✅ Barcode generated successfully for:', order.orderNumber);
                } catch (e) {
                    console.error("❌ Barcode generation error:", e);
                    console.error("Order number:", order.orderNumber);
                }
            } else {
                console.warn('⚠️ Barcode generation skipped:', {
                    hasOrderNumber: !!order.orderNumber,
                    hasRef: !!barcodeRef.current
                });
            }

            // Generate QR Code with payment info
            if (qrcodeRef.current && totalAmount > 0) {
                try {
                    const ctx = qrcodeRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, qrcodeRef.current.width, qrcodeRef.current.height);
                    }

                    const amount = totalAmount.toFixed(2);
                    const qrData = `upi://pay?pa=8825702072@kotak811&pn=FabZClean&am=${amount}&tr=${order.orderNumber}&tn=Order ${order.orderNumber}`;

                    QRCode.toCanvas(qrcodeRef.current, qrData, {
                        width: 140,
                        margin: 2,
                        color: {
                            dark: '#16a34a',
                            light: '#ffffff'
                        },
                        errorCorrectionLevel: 'H'
                    }, (error: any) => {
                        if (error) console.error("❌ QR error:", error);
                        else console.log('✅ QR code generated');
                    });
                } catch (e) {
                    console.error("❌ QR generation error:", e);
                }
            }
        };

        // Try immediate generation first
        if (barcodeRef.current) {
            generateCodes();
        } else {
            // Fallback: wait for DOM
            const timer = setTimeout(() => {
                requestAnimationFrame(generateCodes);
            }, 500); // Increased delay

            return () => clearTimeout(timer);
        }

    }, [open, order, totalAmount]);

    // Auto-send WhatsApp when dialog opens - AFTER barcode generation
    useEffect(() => {
        if (open && order && customerPhone && autoSentRef.current !== order.orderNumber) {
            autoSentRef.current = order.orderNumber;
            // Delay to ensure barcode is generated first
            setTimeout(() => {
                handleWhatsApp();
            }, 2000); // Increased delay
        }
    }, [open, order, customerPhone]);

    const handlePrintBill = () => {
        if (!order?.orderNumber) return;
        const url = `${window.location.origin}/bill/${order.orderNumber}`;
        window.open(url, '_blank');
    };

    const handlePrintTags = () => {
        if (!order) return;

        if (!Array.isArray(order.items) || order.items.length === 0) {
            toast({
                title: "No Items",
                description: "No items found in this order to print tags for.",
                variant: "destructive",
            });
            return;
        }

        // Logic to handle "No Notes" cleanly
        const notesSection = (order as any).notes
            ? `<div class="notes"><strong>Note:</strong> ${(order as any).notes}</div>`
            : ''; // Renders nothing if no notes

        let tagsHtml = '';
        order.items.forEach((item: any) => {
            const qty = parseInt(String(item.quantity || 1));
            const itemName = item.productName || item.name || 'Garment';

            for (let i = 1; i <= qty; i++) {
                tagsHtml += `
      <div class="tag-container">
        <div class="header">FabZClean</div>
        <div class="order-id">#${order.orderNumber || order.id}</div>
        
        <div class="details">
          <div><strong>Cust:</strong> ${order.customerName}</div>
          <div><strong>Item:</strong> ${itemName} (${i}/${qty})</div>
          <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
        </div>

        ${notesSection}

        <div class="footer">
          Scan for status tracking
        </div>
      </div>
    `;
            }
        });

        const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Tags - ${order.orderNumber}</title>
      <style>
        /* THERMAL PRINTER OPTIMIZATION */
        @page {
          size: 80mm auto; /* Adjust to 58mm if using a smaller printer */
          margin: 0;
        }
        body {
          font-family: 'Courier New', monospace; /* Monospace is better for receipts */
          width: 72mm; /* Slight margin for 80mm paper */
          margin: 2mm auto;
          padding-bottom: 5mm;
        }
        .tag-container {
          border: 2px dashed #000;
          padding: 10px;
          text-align: center;
          page-break-after: always; /* CRITICAL: Forces cut after each tag */
        }
        .header { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .order-id { font-size: 24px; font-weight: 900; margin: 10px 0; }
        .details { text-align: left; font-size: 14px; margin-top: 10px; }
        .notes {
          margin-top: 10px;
          padding: 5px;
          border: 1px solid #000;
          font-size: 12px;
          text-align: left;
          font-weight: bold;
        }
        .footer { font-size: 10px; margin-top: 10px; }
      </style>
    </head>
    <body>${tagsHtml}<script>window.onload=()=>window.print();</script></body>
  </html>
`;

        const printWindow = window.open('', 'TagPrint', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        }
    };

    const handleWhatsApp = async () => {
        if (!order) return;

        if (!customerPhone) {
            toast({
                title: "No Phone Number",
                description: "Could not find customer phone number.",
                variant: "destructive",
            });
            return;
        }

        setSendingWhatsApp(true);

        try {
            const billUrl = `${window.location.origin}/bill/${order.orderNumber}`;

            toast({ title: "Generating PDF...", description: "Please wait" });

            let pdfUrl: string | undefined;
            try {
                const { PDFService } = await import('@/lib/pdf-service');
                pdfUrl = await PDFService.generateAndUploadBillPDF(order.orderNumber);
            } catch (e) {
                console.warn('PDF generation failed', e);
            }

            const success = await WhatsAppService.sendOrderBill(
                customerPhone,
                order.orderNumber,
                order.customerName || 'Valued Customer',
                totalAmount,
                billUrl,
                pdfUrl
            );

            if (success) {
                toast({
                    title: "WhatsApp Sent! ✅",
                    description: pdfUrl ? "Invoice PDF sent" : "Bill link sent",
                });
            } else {
                const message = `Hello *${order.customerName}*!\n\nOrder *${order.orderNumber}* Created! ✅\nAmount: ${formatCurrency(totalAmount)}\n\nBill: ${billUrl}`;
                window.open(`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
            }
        } catch (error) {
            console.error('WhatsApp error:', error);
            toast({ title: "Error", description: "Failed to send WhatsApp", variant: "destructive" });
        } finally {
            setSendingWhatsApp(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-emerald-50/20 to-blue-50/20 border-2 border-emerald-100/50 shadow-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-2">
                    {/* Success Icon - Smaller */}
                    <div className="mx-auto relative">
                        <div className="absolute inset-0 bg-emerald-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 rounded-full shadow-md">
                            <CheckCircle className="h-7 w-7 text-white" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Title - Compact */}
                    <div className="text-center space-y-1">
                        <DialogTitle className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                            Order Created Successfully!
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            Order <span className="font-mono font-semibold text-emerald-600">#{order.orderNumber}</span> has been saved
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex flex-col space-y-3 py-1">
                    {/* Barcode Section - Compact */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 rounded-xl blur-sm"></div>
                        <div className="relative bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-center items-center min-h-[60px]">
                                <svg ref={barcodeRef} className="w-full max-w-[240px]"></svg>
                            </div>
                            <p className="text-center text-[10px] text-gray-500 mt-1">Scan for tracking</p>
                        </div>
                    </div>

                    {/* Total Amount - Compact Card */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-[1.5px] shadow-md">
                        <div className="bg-white rounded-xl p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg">💰</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Total Amount</p>
                                        <p className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent leading-tight">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(order.totalAmount) || 0)}
                                        </p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.paymentStatus === 'paid'
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                    }`}>
                                    {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* QR Code - Compact */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-xl blur-sm"></div>
                        <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-emerald-100 flex-shrink-0">
                                    <canvas ref={qrcodeRef} className="w-20 h-20"></canvas>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">UPI Payment</p>
                                    </div>
                                    <p className="text-[10px] text-emerald-700 font-medium mb-1.5">Scan with any UPI app:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="text-[9px] bg-white px-1.5 py-0.5 rounded text-emerald-600 font-semibold border border-emerald-200">GPay</span>
                                        <span className="text-[9px] bg-white px-1.5 py-0.5 rounded text-emerald-600 font-semibold border border-emerald-200">PhonePe</span>
                                        <span className="text-[9px] bg-white px-1.5 py-0.5 rounded text-emerald-600 font-semibold border border-emerald-200">Paytm</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col pt-1">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                            onClick={handlePrintBill}
                            variant="outline"
                            size="sm"
                            className="w-full border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                        >
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            <span className="text-xs">Print Bill</span>
                        </Button>
                        <Button
                            onClick={handlePrintTags}
                            variant="outline"
                            size="sm"
                            className="w-full border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all"
                        >
                            <Tag className="h-3.5 w-3.5 mr-1.5" />
                            <span className="text-xs">Print Tags</span>
                        </Button>
                    </div>
                    <Button
                        onClick={handleWhatsApp}
                        disabled={sendingWhatsApp || !customerPhone}
                        size="sm"
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {sendingWhatsApp ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                <span className="text-xs">Sending...</span>
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                                <span className="text-xs">Send on WhatsApp</span>
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="sm"
                        className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs"
                    >
                        Close & Start New Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
