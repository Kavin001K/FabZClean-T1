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
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Printer, MessageCircle, FileText, Tag, Loader2, CheckCircle2, QrCode, Zap } from 'lucide-react';
import JsBarcode from 'jsbarcode';
// @ts-ignore
import QRCode from 'qrcode';
import { Order } from '../../../../shared/schema';
import { formatCurrency, customersApi } from '@/lib/data-service';
import { WhatsAppService } from '@/lib/whatsapp-service';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { printDriver } from '@/lib/print-driver';
import { GarmentTagPrint } from './garment-tag-print';
import { generateUPIUrl, PAYMENT_CONFIG } from '@/lib/franchise-config';
import { smartItemSummary } from '@/lib/item-summarizer';

interface OrderConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order | null;
    onClose: () => void;
    enableGST?: boolean;
}

export function OrderConfirmationDialog({
    open,
    onOpenChange,
    order,
    onClose,
    enableGST = true,
}: OrderConfirmationDialogProps) {
    const barcodeRef = useRef<SVGSVGElement>(null);
    const qrcodeRef = useRef<HTMLCanvasElement>(null);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [showTagPrint, setShowTagPrint] = useState(false);
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

    // Generate barcode and QR code with 300ms timeout
    // Generate barcode and QR code with 300ms timeout
    useEffect(() => {
        if (!open || !order) return;

        // WAIT 300ms for the dialog animation to finish
        const timer = setTimeout(() => {
            // Generate Barcode
            if (barcodeRef.current && order.orderNumber) {
                try {
                    JsBarcode(barcodeRef.current, order.orderNumber, {
                        format: "CODE128",
                        width: 2,
                        height: 60,
                        displayValue: true,
                        background: "transparent"
                    });
                } catch (e) {
                    console.error("Barcode error:", e);
                }
            }

            // Generate UPI QR Code
            if (qrcodeRef.current) {
                try {
                    const advancePaid = order.advancePaid ? parseFloat(String(order.advancePaid)) : 0;
                    const balanceDue = Math.max(0, totalAmount - advancePaid);

                    // Only generate QR if there is a balance due
                    if (balanceDue > 0) {
                        const upiUrl = generateUPIUrl(balanceDue, order.orderNumber, `Order-${order.orderNumber}`);

                        QRCode.toCanvas(qrcodeRef.current, upiUrl, {
                            width: 100,
                            margin: 0,
                            color: {
                                dark: '#000000',
                                light: '#ffffff'
                            }
                        });
                    } else {
                        // Clear canvas if no balance due
                        const ctx = qrcodeRef.current.getContext('2d');
                        if (ctx) ctx.clearRect(0, 0, qrcodeRef.current.width, qrcodeRef.current.height);
                    }
                } catch (e) {
                    console.error("QR Code generation failed:", e);
                }
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [open, order, totalAmount]);

    // Auto-send WhatsApp when dialog opens
    useEffect(() => {
        if (open && order && customerPhone && !sendingWhatsApp) {
            // Optional: Auto-send logic can be placed here if desired
        }
    }, [open, order, customerPhone, sendingWhatsApp]);

    const handlePrintBill = async () => {
        if (!order) return;

        try {
            console.log('Converting order to invoice data...', order);
            // Import the conversion function
            const { convertOrderToInvoiceData } = await import('@/lib/print-driver');

            // Convert order to invoice data format with GST setting
            const invoiceData = convertOrderToInvoiceData(order, enableGST);

            console.log('Invoice data converted:', invoiceData);

            // Use the print driver to print the invoice
            await printDriver.printInvoice(invoiceData);

            toast({
                title: enableGST ? "GST Invoice Printed" : "Invoice Printed",
                description: `Invoice ${invoiceData.invoiceNumber} has been generated.`,
            });
        } catch (error) {
            console.error("Print failed:", error);
            toast({
                title: "Print Error",
                description: "Failed to generate invoice. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handlePrintTags = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!order) return;

        if (!Array.isArray(order.items) || order.items.length === 0) {
            toast({
                title: "No Items",
                description: "No items found in this order to print tags for.",
                variant: "destructive",
            });
            return;
        }

        setShowTagPrint(true);
    };

    const handleSendWhatsApp = async () => {
        if (!order || !customerPhone) {
            toast({
                title: "Error",
                description: "Missing order or customer phone number",
                variant: "destructive",
            });
            return;
        }

        setSendingWhatsApp(true);

        const customerName = order.customerName || 'Valued Customer';
        const orderNum = order.orderNumber || order.id || 'N/A';
        const billUrl = `${window.location.origin}/bill/${orderNum}?enableGST=${enableGST}`;

        try {
            console.log('📱 Starting WhatsApp send process...');

            let pdfUrl: string | undefined;

            // Try to generate and upload PDF (with error fallback)
            try {
                console.log('📄 Generating invoice PDF...');
                const { convertOrderToInvoiceData } = await import('@/lib/print-driver');

                // Ensure order has required fields for invoice
                const safeOrder = {
                    ...order,
                    customerName: customerName,
                    orderNumber: orderNum,
                    totalAmount: totalAmount.toString(),
                    items: Array.isArray(order.items) ? order.items : [],
                };

                const invoiceData = convertOrderToInvoiceData(safeOrder);

                // Validate invoice data
                if (!invoiceData || !(invoiceData as any).customer) {
                    throw new Error('Invalid invoice data generated');
                }

                // Generate QR Code for PDF
                try {
                    const QRCodeModule = await import('qrcode');
                    const toDataURL = QRCodeModule.toDataURL || (QRCodeModule.default && QRCodeModule.default.toDataURL);
                    if (toDataURL) {
                        const upiUrl = generateUPIUrl(totalAmount);
                        invoiceData.qrCode = await toDataURL(upiUrl);
                    }
                } catch (e) {
                    console.warn("QR gen failed for PDF (non-blocking)", e);
                }

                // Generate PDF blob
                const pdfBlob = await generatePDFBlob(invoiceData);

                // Upload PDF to server
                console.log('☁️ Uploading PDF to server...');
                const uploadedDoc = await uploadPDFToServer(pdfBlob, invoiceData);

                if (uploadedDoc?.fileUrl) {
                    pdfUrl = uploadedDoc.fileUrl;
                    console.log('✅ PDF uploaded successfully:', pdfUrl);
                }
            } catch (pdfError) {
                console.error('⚠️ PDF generation/upload failed (will send text only):', pdfError);
                // Continue without PDF - will send text message
            }

            // Smart Item Summarization using shared utility
            // Strategy: 1 item = full name, 2 items = "A & B", 3+ items = "A & X others"
            const mainItemName = smartItemSummary(order.items as any[]);
            console.log(`📦 Item summary: "${mainItemName}" (${Array.isArray(order.items) ? order.items.length : 0} items)`);

            // Send WhatsApp message (with or without PDF)
            console.log('💬 Sending WhatsApp message...');
            const success = await WhatsAppService.sendOrderBill(
                customerPhone,
                orderNum,
                customerName,
                totalAmount,
                billUrl,
                pdfUrl, // May be undefined if PDF failed
                mainItemName
            );

            if (success) {
                toast({
                    title: "Sent!",
                    description: pdfUrl
                        ? "WhatsApp message with bill sent successfully."
                        : "WhatsApp message sent (bill link only).",
                });
            } else {
                // Fallback: Try sending simple text via backend
                console.log('⚠️ Standard send failed, trying fallback...');
                try {
                    const fallbackResponse = await fetch('/api/whatsapp/send-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            phone: customerPhone,
                            message: `🧾 *FabZClean Invoice*\n\nHi ${customerName}!\n\nYour order *#${orderNum}* for ₹${totalAmount.toFixed(2)} has been confirmed.\n\n📋 View Bill: ${billUrl}\n\nThank you for choosing FabZClean!`
                        })
                    });

                    if (fallbackResponse.ok) {
                        toast({
                            title: "Sent!",
                            description: "WhatsApp message sent successfully.",
                        });
                    } else {
                        throw new Error('Fallback also failed');
                    }
                } catch (fallbackError) {
                    toast({
                        title: "Failed",
                        description: "Could not send WhatsApp message. Please try again.",
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            console.error("WhatsApp error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An error occurred while sending message.",
                variant: "destructive",
            });
        } finally {
            setSendingWhatsApp(false);
        }
    };

    // Helper function to generate PDF blob
    // Helper function to generate PDF blob - OPTIMIZED for lightweight files
    const generatePDFBlob = async (invoiceData: any): Promise<Blob> => {
        const jsPDF = (await import('jspdf')).default;
        const html2canvas = (await import('html2canvas')).default;
        const { createRoot } = await import('react-dom/client');
        const React = await import('react');
        const { default: InvoiceTemplateIN } = await import('@/components/print/invoice-template-in');

        // Create temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '210mm';
        container.style.background = 'white';
        document.body.appendChild(container);

        // Render React component
        const root = createRoot(container);
        await new Promise<void>((resolve) => {
            root.render(React.createElement(InvoiceTemplateIN, { data: invoiceData }));
            setTimeout(resolve, 1500);
        });

        // Convert to canvas - OPTIMIZED settings
        const canvas = await html2canvas(container, {
            scale: 1.5, // Reduced from 2 for smaller file size
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 5000,
        });

        // Create PDF with compression
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true // Enable compression
        });

        // Always use JPEG with compression for smaller file size
        const imgData = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        const imgFormat: 'JPEG' = 'JPEG';

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add image with FAST compression
        pdf.addImage(imgData, imgFormat, 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        // Handle multi-page if content is longer
        while (heightLeft > 5) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, imgFormat, 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }

        // Cleanup
        root.unmount();
        document.body.removeChild(container);

        const pdfBlob = pdf.output('blob');
        console.log(`📊 PDF size: ${(pdfBlob.size / (1024 * 1024)).toFixed(2)} MB`);

        return pdfBlob;
    };

    // Helper function to upload PDF to server
    const uploadPDFToServer = async (pdfBlob: Blob, invoiceData: any): Promise<any> => {
        const formData = new FormData();
        const filename = `invoice-${invoiceData.invoiceNumber}-${Date.now()}.pdf`;
        formData.append('file', pdfBlob, filename);
        formData.append('type', 'invoice');
        formData.append('metadata', JSON.stringify({
            invoiceNumber: invoiceData.invoiceNumber,
            orderNumber: order?.orderNumber,
            customerName: invoiceData.customer.name,
            amount: invoiceData.total,
            status: 'sent',
        }));

        const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.document;
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border-2 border-gray-100 shadow-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-2 border-b border-gray-100 pb-4">
                    <div className="mx-auto relative">
                        <div className="absolute inset-0 bg-emerald-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 rounded-full shadow-md">
                            <CheckCircle2 className="h-7 w-7 text-white" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="text-center space-y-1">
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            Order Confirmed!
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Order <span className="font-mono font-bold text-emerald-600">#{order.orderNumber}</span> has been created.
                        </DialogDescription>
                        {/* Express Order Badge */}
                        {((order as any)?.isExpressOrder || (order as any)?.is_express_order) && (
                            <div className="flex justify-center pt-2">
                                <Badge className="bg-orange-500 text-white animate-pulse gap-1">
                                    <Zap className="h-3 w-3" />
                                    EXPRESS ORDER - PRIORITY
                                </Badge>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-4 space-y-6">
                    {/* Barcode Display */}
                    <div className="w-full flex justify-center bg-white p-4 rounded-xl border border-dashed border-gray-300 shadow-sm">
                        <svg ref={barcodeRef} className="w-full max-w-[240px]"></svg>
                    </div>

                    {/* --- UI ENHANCEMENT: Digital Receipt Style --- */}
                    <div className="w-full border-t-2 border-dashed border-gray-200 pt-6">
                        <div className="flex justify-between items-end">
                            <div className="text-left">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-sm font-bold text-emerald-700">CONFIRMED</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                                <div className="flex items-center justify-end gap-1 text-gray-900">
                                    <span className="text-lg font-medium">₹</span>
                                    <span className="text-4xl font-extrabold tracking-tight">
                                        {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code moved to a cleaner spot */}
                        <div className="mt-6 flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="text-xs text-gray-500">
                                <p className="font-bold text-gray-700">Payment Link</p>
                                <p>Scan to pay via UPI</p>
                            </div>
                            <canvas ref={qrcodeRef} className="w-14 h-14" />
                        </div>
                    </div>
                    {/* --------------------------------------------- */}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            onClick={handlePrintBill}
                            variant="outline"
                            className="w-full border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all font-medium"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Print Bill
                        </Button>
                        <Button
                            type="button"
                            onClick={handlePrintTags}
                            variant="outline"
                            className="w-full border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all font-medium"
                        >
                            <Tag className="h-4 w-4 mr-2" />
                            Print Tags
                        </Button>
                    </div>
                    <Button
                        onClick={handleSendWhatsApp}
                        disabled={sendingWhatsApp || !customerPhone}
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold shadow-sm hover:shadow-md transition-all"
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
                        className="w-full text-gray-400 hover:text-gray-600 hover:bg-transparent text-xs"
                    >
                        Close & Start New Order
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Garment Tags Print Dialog */}
            <GarmentTagPrint
                open={showTagPrint}
                onOpenChange={setShowTagPrint}
                orderNumber={order?.orderNumber || ''}
                customerName={order?.customerName}
                storeCode={order?.franchiseId || 'STORE'}
                commonNote={(order as any)?.specialInstructions || (order as any)?.special_instructions || undefined}
                isExpressOrder={(order as any)?.isExpressOrder || (order as any)?.is_express_order || false}
                dueDate={order?.pickupDate ? String(order.pickupDate) : (order as any)?.dueDate ? String((order as any).dueDate) : undefined}
                items={(order?.items || []).map((item: any) => ({
                    orderNumber: order?.orderNumber || '',
                    serviceName: item.customName || item.serviceName || item.service_name || 'Unknown Service',
                    tagNote: item.tagNote || item.tag_note,
                    quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1,
                    customerName: order?.customerName,
                }))}
            />
        </Dialog>
    );
}
