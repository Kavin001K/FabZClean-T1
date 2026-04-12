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
import { CheckCircle, Printer, FileText, Tag, Loader2, CheckCircle2, Zap, Ban } from 'lucide-react';
import JsBarcode from 'jsbarcode';
// @ts-ignore
import QRCode from 'qrcode';
import { Order } from '@shared/schema';
import { formatCurrency, customersApi } from '@/lib/data-service';
import { WhatsAppService, MAX_WHATSAPP_SENDS } from '@/lib/whatsapp-service';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { printDriver } from '@/lib/print-driver';
import { GarmentTagPrint } from './garment-tag-print';
import { generateUPIUrl, PAYMENT_CONFIG } from '@/lib/franchise-config';
import { resolveOrderStoreCodeFromOrder } from '@/lib/order-store';
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
    const [whatsappSendCount, setWhatsappSendCount] = useState(0);
    const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
    const [whatsappError, setWhatsappError] = useState<string | null>(null);
    const [autoSendTriggered, setAutoSendTriggered] = useState(false);
    const lastPdfUrlRef = useRef<string | null>(null);
    const lastFailureStageRef = useRef<'pdf' | 'send' | null>(null);
    const { toast } = useToast();

    // ALWAYS fetch full customer data from DB when customerId exists.
    // This ensures name, phone, email, and address are ALL available for:
    // 1. Invoice PDF generation
    // 2. WhatsApp bill sending
    // 3. Printed bills
    // Name and phone are MANDATORY — we never generate a bill without them.
    const { data: customerData } = useQuery({
        queryKey: ['customer', order?.customerId],
        queryFn: () => order?.customerId ? customersApi.get(order.customerId) : null,
        enabled: !!order?.customerId,
    });

    // Get effective customer details — order-level fields take priority, then DB customer fields
    const customerPhone = order?.customerPhone || customerData?.phone;
    const secondaryPhone = (customerData as any)?.secondaryPhone || (order as any)?.secondaryPhone || '';
    const customerName = order?.customerName || customerData?.name || 'Valued Customer';
    const customerEmail = order?.customerEmail || customerData?.email || '';
    const customerAddress = (order as any)?.deliveryAddress || (order as any)?.shippingAddress || customerData?.address || '';

    // Check if more sends are allowed
    const canSendWhatsApp = whatsappSendCount < MAX_WHATSAPP_SENDS;
    const remainingSends = MAX_WHATSAPP_SENDS - whatsappSendCount;

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

    // Sync WhatsApp state from the newly created order and reset cleanly on close.
    useEffect(() => {
        if (!open) {
            setWhatsappSendCount(0);
            setWhatsappStatus('idle');
            setWhatsappError(null);
            setAutoSendTriggered(false);
            return;
        }

        const persistedSendCount = Number((order as any)?.whatsappMessageCount || 0);
        const normalizedSendCount = Number.isFinite(persistedSendCount) ? Math.max(0, persistedSendCount) : 0;
        const lastStatus = String((order as any)?.lastWhatsappStatus || '').trim();

        setWhatsappSendCount(normalizedSendCount);
        setWhatsappError(lastStatus.includes('Failed') ? lastStatus : null);
        setAutoSendTriggered(false);

        if (lastStatus.includes('Sent')) {
            setWhatsappStatus('sent');
            return;
        }

        if (lastStatus.includes('Failed')) {
            setWhatsappStatus('failed');
            return;
        }

        setWhatsappStatus('idle');
    }, [open, order]);

    const handlePrintBill = async () => {
        if (!order) return;

        try {
            console.log('Converting order to invoice data...', order);
            // Import the conversion function
            const { convertOrderToInvoiceData } = await import('@/lib/print-driver');

            // Enrich order with customer DB data before conversion
            const enrichedOrder = {
                ...order,
                customerName: customerName,
                customerPhone: customerPhone || '',
                customerEmail: customerEmail || '',
                customerAddress: customerAddress || '',
                deliveryAddress: (order as any)?.deliveryAddress || customerAddress || '',
            };

            // Convert order to invoice data format with GST setting
            const invoiceData = convertOrderToInvoiceData(enrichedOrder, enableGST);

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
            setWhatsappStatus('failed');
            setWhatsappError("Missing order or customer phone number");
            return;
        }

        // Check if we've reached the limit
        if (!canSendWhatsApp) {
            toast({
                title: "Limit Reached",
                description: `Maximum ${MAX_WHATSAPP_SENDS} WhatsApp messages already sent for this order.`,
                variant: "destructive",
            });
            setWhatsappStatus('failed');
            setWhatsappError(`Maximum ${MAX_WHATSAPP_SENDS} WhatsApp messages already sent.`);
            return;
        }

        setSendingWhatsApp(true);
        setWhatsappStatus('sending');
        setWhatsappError(null);

        const orderNum = order.orderNumber || order.id || 'N/A';
        const billUrl = `${window.location.origin}/bill/${orderNum}?enableGST=${enableGST}`;

        try {
            console.log(`[WhatsApp] Send #${whatsappSendCount + 1} starting...`);

            let pdfUrl: string | undefined;

            if (lastPdfUrlRef.current && lastFailureStageRef.current === 'send') {
                pdfUrl = lastPdfUrlRef.current;
                console.log('[WhatsApp] Reusing previously uploaded PDF:', pdfUrl);
            } else {
                try {
                    console.log('[WhatsApp] Generating invoice PDF...');
                    const { convertOrderToInvoiceData } = await import('@/lib/print-driver');

                    const safeOrder = {
                        ...order,
                        customerName: customerName,
                        customerPhone: customerPhone || '',
                        customerEmail: customerEmail || '',
                        customerAddress: customerAddress || '',
                        deliveryAddress: (order as any)?.deliveryAddress || customerAddress || '',
                        orderNumber: orderNum,
                        totalAmount: totalAmount.toString(),
                        items: Array.isArray(order.items) ? order.items : [],
                    };

                    const invoiceData = convertOrderToInvoiceData(safeOrder, enableGST);

                    if (!invoiceData || !(invoiceData as any).customerInfo) {
                        throw new Error('Invalid invoice data generated');
                    }

                    const uploadedDoc = await printDriver.generateInvoiceDocument(invoiceData, 'invoice', {
                        outputMode: 'none',
                    });

                    pdfUrl = uploadedDoc?.document?.fileUrl || uploadedDoc?.fileUrl;
                    if (pdfUrl) {
                        lastPdfUrlRef.current = pdfUrl;
                        lastFailureStageRef.current = null;
                        console.log('[WhatsApp] PDF uploaded:', pdfUrl);
                    }
                } catch (pdfError) {
                    lastFailureStageRef.current = 'pdf';
                    console.error('[WhatsApp] PDF generation failed:', pdfError);
                }
            }

            if (!pdfUrl) {
                const errorMessage = 'Invoice PDF generation/upload failed. WhatsApp cannot be sent without the PDF.';
                setWhatsappStatus('failed');
                setWhatsappError(errorMessage);
                toast({
                    title: "PDF Required",
                    description: errorMessage,
                    variant: "destructive",
                });
                return;
            }

            // Smart Item Summarization
            const mainItemName = smartItemSummary(order.items as any[]);
            console.log(`[WhatsApp] Item summary: "${mainItemName}"`);

            // Send WhatsApp message with current send count
            console.log(`[WhatsApp] Sending message (sendCount: ${whatsappSendCount})...`);
            const result = await WhatsAppService.sendOrderBill(
                customerPhone,
                orderNum,
                customerName,
                totalAmount,
                billUrl,
                pdfUrl,
                mainItemName,
                secondaryPhone,
                whatsappSendCount // Pass current send count
            );

            if (result.success) {
                lastFailureStageRef.current = null;
                // Update send count
                const newCount = result.newSendCount ?? (whatsappSendCount + 1);
                setWhatsappSendCount(newCount);

                const templateName = result.templateUsed || 'Confirmation';

                toast({
                    title: "Sent!",
                    description: result.canResendAgain
                        ? `${result.warning || `WhatsApp ${templateName} sent.`} ${MAX_WHATSAPP_SENDS - newCount} resend(s) remaining.`
                        : `${result.warning || `WhatsApp ${templateName} sent.`} No more resends available.`,
                });
                setWhatsappStatus('sent');
            } else {
                lastFailureStageRef.current = 'send';
                toast({
                    title: "Failed",
                    description: result.error || "Could not send WhatsApp message. Please try again.",
                    variant: "destructive",
                });
                setWhatsappStatus('failed');
                setWhatsappError(result.error || "Could not send WhatsApp message.");
            }
        } catch (error) {
            lastFailureStageRef.current = lastPdfUrlRef.current ? 'send' : 'pdf';
            console.error("[WhatsApp] Error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An error occurred while sending message.",
                variant: "destructive",
            });
            setWhatsappStatus('failed');
            setWhatsappError(error instanceof Error ? error.message : "An error occurred while sending message.");
        } finally {
            setSendingWhatsApp(false);
        }
    };

    useEffect(() => {
        if (!open || !order || !customerPhone || autoSendTriggered) {
            return;
        }

        const persistedStatus = String((order as any)?.lastWhatsappStatus || '').trim();
        const hasExistingAttempt = whatsappSendCount > 0 || persistedStatus.length > 0;

        if (hasExistingAttempt || whatsappStatus === 'sending' || whatsappStatus === 'sent' || !canSendWhatsApp) {
            return;
        }

        setAutoSendTriggered(true);
        void handleSendWhatsApp();
    }, [
        open,
        order,
        customerPhone,
        autoSendTriggered,
        whatsappSendCount,
        whatsappStatus,
        canSendWhatsApp,
    ]);

    useEffect(() => {
        if (open) {
            lastPdfUrlRef.current = null;
            lastFailureStageRef.current = null;
        }
    }, [open, order?.id]);

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
                            data-print-button
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
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                        {!customerPhone && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Ban className="h-4 w-4" />
                                WhatsApp unavailable (missing customer phone).
                            </div>
                        )}
                        {customerPhone && whatsappStatus === 'sending' && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending WhatsApp message automatically...
                            </div>
                        )}
                        {customerPhone && whatsappStatus === 'sent' && (
                            <div className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle className="h-4 w-4" />
                                WhatsApp message sent successfully.
                            </div>
                        )}
                        {customerPhone && whatsappStatus === 'failed' && (
                            <div className="flex flex-col gap-2 text-red-600">
                                <div className="flex items-center gap-2">
                                    <Ban className="h-4 w-4" />
                                    Failed to send WhatsApp message.
                                </div>
                                {whatsappError && (
                                    <div className="text-xs text-red-500">{whatsappError}</div>
                                )}
                                <Button
                                    onClick={handleSendWhatsApp}
                                    disabled={sendingWhatsApp || !customerPhone || !canSendWhatsApp}
                                    className={`w-full font-bold shadow-sm hover:shadow-md transition-all ${canSendWhatsApp
                                        ? 'bg-[#25D366] hover:bg-[#128C7E] text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {sendingWhatsApp ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : !canSendWhatsApp ? (
                                        <>
                                            <Ban className="h-4 w-4 mr-2" />
                                            Limit Reached ({MAX_WHATSAPP_SENDS}/{MAX_WHATSAPP_SENDS})
                                        </>
                                    ) : (
                                        <>Retry WhatsApp ({remainingSends} left)</>
                                    )}
                                </Button>
                            </div>
                        )}
                        {customerPhone && whatsappStatus === 'idle' && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Preparing WhatsApp message...
                            </div>
                        )}
                    </div>
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
                customerName={customerName}
                customerAddress={customerAddress}
                franchiseId={(order as any)?.franchiseId || (order as any)?.franchise_id || null}
                storeCode={resolveOrderStoreCodeFromOrder(order)}
                commonNote={(order as any)?.specialInstructions || (order as any)?.special_instructions || undefined}
                isExpressOrder={(order as any)?.isExpressOrder || (order as any)?.is_express_order || false}
                billDate={order?.createdAt ? String(order.createdAt) : undefined}
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
