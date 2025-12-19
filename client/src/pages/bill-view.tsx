import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/data-service";
import { Loader2, Printer, Share2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceTemplateIN from '@/components/print/invoice-template-in';
import SimpleInvoiceTemplate from '@/components/print/simple-invoice-template';
import { formatCurrency, formatDate } from "@/lib/data-service";
// @ts-ignore
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { generateUPIUrl } from '@/lib/franchise-config';

export default function BillView() {
    const [, params] = useRoute("/bill/:orderNumber");
    const orderNumber = params?.orderNumber;
    const barcodeRef = useRef<SVGSVGElement>(null);
    const qrcodeRef = useRef<HTMLCanvasElement>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');



    const { data: order, isLoading, error } = useQuery({
        queryKey: ["order", orderNumber],
        queryFn: async () => {
            if (!orderNumber) return null;
            const orders = await ordersApi.getAll();
            return orders.find(o => o.orderNumber === orderNumber);
        },
        enabled: !!orderNumber
    });

    // Parse query params for GST toggle
    const searchParams = new URLSearchParams(window.location.search);
    const hasGSTParam = searchParams.has('enableGST');
    const paramGST = searchParams.get('enableGST') === 'true';

    // Determine if we should show GST view
    // Priority: 1. Query Param, 2. Order's gstEnabled flag, 3. Default false
    const enableGST = order ? (hasGSTParam ? paramGST : (order.gstEnabled || false)) : false;

    const subtotal = order ? (Array.isArray(order.items)
        ? order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        : Number(order.totalAmount)) : 0;

    const discount = order?.discountValue ? Number(order.discountValue) : 0;
    const extraCharges = order?.extraCharges ? Number(order.extraCharges) : 0;
    const deliveryCharges = order?.deliveryCharges ? Number(order.deliveryCharges) : 0;
    const advancePaid = order?.advancePaid ? Number(order.advancePaid) : 0;
    const totalAmount = order ? Number(order.totalAmount) : 0;
    const balanceDue = Math.max(0, totalAmount - advancePaid);

    useEffect(() => {
        if (!order) return;

        console.log('📄 Bill View: Generating codes for', order.orderNumber);

        const generateCodes = () => {
            if (barcodeRef.current) {
                try {
                    // Ensure the element exists and is visible
                    if (barcodeRef.current.clientWidth === 0) {
                        console.log('⏳ Barcode ref not ready, retrying...');
                        setTimeout(generateCodes, 100);
                        return;
                    }

                    JsBarcode(barcodeRef.current, order.orderNumber, {
                        format: "CODE128",
                        width: 2,
                        height: 50,
                        displayValue: true,
                        fontSize: 14,
                        margin: 5,
                        background: "transparent",
                    });
                    console.log('✅ Bill barcode generated');
                } catch (e) {
                    console.error("❌ Bill barcode error:", e);
                }
            } else {
                console.warn('⚠️ Barcode ref is null');
            }

            if (balanceDue > 0) {
                const qrData = `upi://pay?pa=8825702072@okbizaxis&pn=FabZClean&am=${balanceDue.toFixed(2)}&tr=${order.orderNumber}&tn=Order-${order.orderNumber}`;

                // Generate Data URL for Invoice Template
                QRCode.toDataURL(qrData, {
                    width: 120,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                }, (err: any, url: string) => {
                    if (!err) setQrCodeUrl(url);
                });

                // Generate Canvas for standard view
                if (qrcodeRef.current) {
                    QRCode.toCanvas(qrcodeRef.current, qrData, {
                        width: 120,
                        margin: 2,
                        color: {
                            dark: '#10b981',
                            light: '#ffffff'
                        }
                    }, (error: any) => {
                        if (error) console.error("❌ QR Code error:", error);
                        else console.log('✅ QR code generated');
                    });
                }
            } else {
                setQrCodeUrl('');
                if (qrcodeRef.current) {
                    const ctx = qrcodeRef.current.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, qrcodeRef.current.width, qrcodeRef.current.height);
                }
            }
        };

        // Try immediate generation
        if (barcodeRef.current) {
            generateCodes();
        } else {
            // Fallback with delay
            const timer = setTimeout(() => {
                requestAnimationFrame(generateCodes);
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [order, balanceDue]);

    // Handle loading state first
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading your invoice...</p>
                </div>
            </div>
        );
    }

    // Handle error or missing order
    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
                    <p className="text-gray-600">Could not find order #{orderNumber}</p>
                    <Button onClick={() => window.history.back()} className="mt-6">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // At this point, order is guaranteed to exist
    if (order) {
        const shippingAddress = order.shippingAddress as any;

        // Robust address parsing
        let formattedAddress = "";
        try {
            if (typeof shippingAddress === 'object' && shippingAddress !== null) {
                if (Object.keys(shippingAddress).length > 0) {
                    formattedAddress = [
                        shippingAddress.street || shippingAddress.line1 || shippingAddress.address || shippingAddress.instructions,
                        shippingAddress.city,
                        shippingAddress.state,
                        shippingAddress.zip || shippingAddress.pincode,
                        shippingAddress.country
                    ].filter(Boolean).join(", ");
                }
            } else if (typeof shippingAddress === 'string') {
                if (shippingAddress !== "[object Object]") {
                    formattedAddress = shippingAddress;
                }
            }
        } catch (e) {
            console.error("Error parsing address:", e);
        }

        if (!formattedAddress || formattedAddress === "[object Object]") {
            formattedAddress = "";
        }

        // GST Invoice
        if (enableGST) {
            const calculatedTax = order.gstAmount ? parseFloat(order.gstAmount) : (subtotal * 0.18);
            const calculatedTotal = subtotal + calculatedTax + extraCharges + deliveryCharges - discount;

            const invoiceData = {
                invoiceNumber: order.orderNumber,
                invoiceDate: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
                dueDate: order.pickupDate ? new Date(order.pickupDate).toISOString() : (order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString()),
                enableGST: true,
                company: {
                    name: "Fab Clean",
                    address: "#16, Venkatramana Round Road,\nOpp to HDFC Bank,\nMahalingapuram, Pollachi - 642002",
                    phone: "+91 93630 59595",
                    email: "support@myfabclean.com",
                    taxId: "33AITPD3522F1ZK",
                    logo: "/assets/logo.webp"
                },
                customer: {
                    name: order.customerName,
                    address: formattedAddress,
                    phone: order.customerPhone || "",
                    email: order.customerEmail || "",
                    taxId: order.gstNumber || undefined
                },
                items: Array.isArray(order.items) ? order.items.map((item: any) => ({
                    description: item.productName || item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    total: item.price * item.quantity,
                    taxRate: 18,
                    hsn: "9601"
                })) : [],
                subtotal: subtotal,
                taxAmount: calculatedTax,
                deliveryCharges: deliveryCharges,
                expressSurcharge: (order as any).expressSurcharge ? Number((order as any).expressSurcharge) : 0,
                total: calculatedTotal,
                paymentTerms: "Due on receipt",
                qrCode: qrCodeUrl || undefined,
                isExpressOrder: (order as any).isExpressOrder || (order as any).is_express_order || false
            };

            return <InvoiceTemplateIN data={invoiceData} />;
        }

        // Simple Invoice (Non-GST)
        else {
            const invoiceData = {
                invoiceNumber: order.orderNumber,
                invoiceDate: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
                dueDate: order.pickupDate ? new Date(order.pickupDate).toISOString() : (order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString()),
                company: {
                    name: "Fab Clean",
                    address: "#16, Venkatramana Round Road,\nOpp to HDFC Bank,\nMahalingapuram, Pollachi - 642002",
                    phone: "+91 93630 59595",
                    email: "support@myfabclean.com",
                    logo: "/assets/logo.webp"
                },
                customer: {
                    name: order.customerName,
                    address: formattedAddress,
                    phone: order.customerPhone || "",
                    email: order.customerEmail || ""
                },
                items: Array.isArray(order.items) ? order.items.map((item: any) => ({
                    description: item.productName || item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    total: item.price * item.quantity
                })) : [],
                subtotal: subtotal,
                total: totalAmount, // Use stored total for simple bill
                deliveryCharges: deliveryCharges,
                expressSurcharge: (order as any).expressSurcharge ? Number((order as any).expressSurcharge) : 0,
                paymentTerms: "Due on receipt",
                qrCode: qrCodeUrl || undefined,
                isExpressOrder: (order as any).isExpressOrder || (order as any).is_express_order || false
            };

            return <SimpleInvoiceTemplate data={invoiceData} />;
        }
    }

    // Fallback (should never reach here due to early returns above)
    return null;
}
