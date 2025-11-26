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

        let tagsHtml = '';
        order.items.forEach((item: any) => {
            const qty = parseInt(String(item.quantity || 1));
            const itemName = item.productName || item.name || 'Item';

            for (let i = 1; i <= qty; i++) {
                tagsHtml += `
          <div class="tag-page">
            <div class="tag-container">
              <div class="tag-header">
                <div class="company-name">FabZClean</div>
                <div class="tag-title">LAUNDRY TAG</div>
              </div>
              <div class="tag-body">
                <div class="section"><div class="label">Customer:</div><div class="value customer-name">${order.customerName || 'Customer'}</div></div>
                <div class="section"><div class="label">Phone:</div><div class="value">${customerPhone || ''}</div></div>
                <div class="section item-section"><div class="label">Item:</div><div class="value item-name">${itemName}</div></div>
                <div class="section"><div class="label">Piece:</div><div class="value piece-count">${i} of ${qty}</div></div>
                <div class="section"><div class="label">Order ID:</div><div class="value order-number">${order.orderNumber}</div></div>
              </div>
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
            @page { size: 58mm auto; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; }
            .tag-page { width: 58mm; min-height: 80mm; page-break-after: always; padding: 2mm; box-sizing: border-box; }
            .tag-container { border: 2px solid #000; padding: 2mm; }
            .tag-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 2mm; margin-bottom: 2mm; }
            .company-name { font-size: 12pt; font-weight: bold; }
            .tag-title { font-size: 8pt; }
            .section { margin: 1mm 0; display: flex; }
            .label { font-size: 8pt; font-weight: bold; width: 15mm; flex-shrink: 0; }
            .value { font-size: 9pt; flex: 1; word-wrap: break-word; }
            .customer-name { font-size: 10pt; font-weight: bold; }
            .item-section { background: #eee; padding: 1mm; border-left: 2px solid #000; }
            .item-name { font-weight: bold; }
            .order-number { font-family: monospace; }
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
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <div className="mx-auto bg-green-100 p-3 rounded-full mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Order Created Successfully!</DialogTitle>
                    <DialogDescription className="text-center">
                        Order #{order.orderNumber} has been saved.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-6 py-4">
                    {/* Barcode Section */}
                    <div className="w-full flex justify-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <svg ref={barcodeRef} className="w-full max-w-[250px]"></svg>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-4 w-full">
                        {/* REPLACEMENT START: Better Total Amount Display */}
                        <div className="flex items-center justify-between border-t pt-4 mt-4">
                            <span className="text-muted-foreground text-base">Total Amount:</span>
                            <div className="text-right">
                                <span className="block text-3xl font-bold text-primary">
                                    {/* Formats as ₹1,250.00 */}
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount || 0)}
                                </span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                    {order.paymentStatus || 'Pending'}
                                </span>
                            </div>
                        </div>
                        {/* REPLACEMENT END */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-200 text-[10px] px-2 py-0.5 rounded-bl-lg text-emerald-800 font-bold">UPI</div>
                            <canvas ref={qrcodeRef} className="w-20 h-20"></canvas>
                            <p className="text-[10px] text-emerald-700 mt-1 font-medium">Scan to Pay</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-3 sm:flex-col">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button onClick={handlePrintBill} variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                            <FileText className="h-4 w-4 mr-2 text-gray-600" />
                            Print Bill
                        </Button>
                        <Button onClick={handlePrintTags} variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                            <Tag className="h-4 w-4 mr-2 text-gray-600" />
                            Print Tags
                        </Button>
                    </div>

                    <Button
                        onClick={handleWhatsApp}
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold shadow-md transition-all active:scale-[0.98]"
                        disabled={sendingWhatsApp}
                    >
                        {sendingWhatsApp ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-5 w-5 mr-2" />
                                Send on WhatsApp
                            </>
                        )}
                    </Button>

                    <Button onClick={onClose} variant="ghost" className="w-full text-gray-500 hover:text-gray-700">
                        Close & Start New Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
