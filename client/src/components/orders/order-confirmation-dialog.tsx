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
            <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30 border-2 border-emerald-100/50 shadow-2xl">
                <DialogHeader className="space-y-4">
                    {/* Success Icon with Animation */}
                    <div className="mx-auto relative">
                        <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-full shadow-lg">
                            <CheckCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-2">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                            Order Created Successfully!
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-600">
                            Order <span className="font-mono font-semibold text-emerald-600">#{order.orderNumber}</span> has been saved
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex flex-col space-y-5 py-2">
                    {/* Barcode Section - Redesigned */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-2xl blur-sm group-hover:blur-md transition-all"></div>
                        <div className="relative bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                            <div className="flex justify-center items-center min-h-[80px]">
                                <svg ref={barcodeRef} className="w-full max-w-[280px]"></svg>
                            </div>
                            <p className="text-center text-xs text-gray-500 mt-2 font-medium">Scan for order tracking</p>
                        </div>
                    </div>

                    {/* Total Amount - Beautiful Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 p-[2px] shadow-lg">
                        <div className="bg-white rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Amount</p>
                                        <p className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(order.totalAmount) || 0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${order.paymentStatus === 'paid'
                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                                        }`}>
                                        {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Code - Modern Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-2xl blur-sm group-hover:blur-md transition-all"></div>
                        <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-xl shadow-md border border-emerald-100">
                                    <canvas ref={qrcodeRef} className="w-24 h-24"></canvas>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide">UPI Payment</p>
                                    </div>
                                    <p className="text-xs text-emerald-700 font-medium mb-2">Scan with any UPI app:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[10px] bg-white px-2 py-1 rounded-md text-emerald-600 font-semibold border border-emerald-200">GPay</span>
                                        <span className="text-[10px] bg-white px-2 py-1 rounded-md text-emerald-600 font-semibold border border-emerald-200">PhonePe</span>
                                        <span className="text-[10px] bg-white px-2 py-1 rounded-md text-emerald-600 font-semibold border border-emerald-200">Paytm</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-3 sm:flex-col pt-2">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            onClick={handlePrintBill}
                            variant="outline"
                            className="w-full border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                        >
                            <FileText className="h-4 w-4 mr-2 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                            <span className="group-hover:text-emerald-700">Print Bill</span>
                        </Button>
                        <Button
                            onClick={handlePrintTags}
                            variant="outline"
                            className="w-full border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                        >
                            <Tag className="h-4 w-4 mr-2 text-gray-600 group-hover:text-blue-600 transition-colors" />
                            <span className="group-hover:text-blue-700">Print Tags</span>
                        </Button>
                    </div>
                    <Button
                        onClick={handleWhatsApp}
                        disabled={sendingWhatsApp || !customerPhone}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sendingWhatsApp ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send on WhatsApp
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        Close & Start New Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
