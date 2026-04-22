import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customersApi, ordersApi } from "@/lib/data-service";
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
    const orderNumber = (params as Record<string, string> | null)?.orderNumber;
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

    // ALWAYS fetch customer data from DB when customerId exists.
    // This ensures name, phone, email, and address are always available
    // even if the order record doesn't carry them.
    const { data: customer, isLoading: isCustomerLoading } = useQuery({
        queryKey: ["bill-customer", order?.customerId],
        queryFn: async () => {
            if (!order?.customerId) return null;
            return customersApi.getById(order.customerId);
        },
        enabled: !!order?.customerId,
        staleTime: 30_000,
    });

    const firstNonEmpty = (...values: unknown[]) => {
        for (const value of values) {
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
        return "";
    };

    const parseAddress = (value: any): string => {
        if (!value) return "";

        if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed || trimmed === "[object Object]") return "";
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                try {
                    return parseAddress(JSON.parse(trimmed));
                } catch {
                    return trimmed;
                }
            }
            return trimmed;
        }

        if (typeof value === "object") {
            const parts = [
                value.street,
                value.line1,
                value.line2,
                value.address,
                value.instructions,
                value.landmark,
                value.city,
                value.state,
                value.zip,
                value.pincode,
                value.country,
            ].filter((part) => typeof part === "string" && part.trim());

            if (parts.length > 0) {
                return parts.join(", ");
            }

            const stringValues = Object.values(value).filter(
                (part) => typeof part === "string" && part.trim()
            ) as string[];

            return stringValues.join(", ");
        }

        return "";
    };

    const buildInvoiceItems = (rawOrder: any) => {
        const rawItems = Array.isArray(rawOrder?.items) ? rawOrder.items : [];

        return rawItems.map((item: any) => {
            const description = firstNonEmpty(
                item?.serviceName,
                item?.service_name,
                item?.customName,
                item?.custom_name,
                item?.productName,
                item?.product_name,
                item?.description,
                item?.name,
                item?.service,
                rawOrder?.serviceName,
                rawOrder?.service,
                "Laundry Service"
            );

            const note = firstNonEmpty(
                item?.tagNote,
                item?.tag_note,
                item?.notes,
                item?.details,
                item?.description && item.description !== description ? item.description : ""
            );

            const quantity = Number(item?.quantity || 1);
            const unitPrice = Number(item?.unitPrice ?? item?.price ?? 0);
            const total = Number(item?.total ?? quantity * unitPrice);

            return {
                description,
                note: note || undefined,
                quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
                unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
                total: Number.isFinite(total) ? total : 0,
                taxRate: 18,
                hsn: item?.hsn || "9601",
            };
        });
    };

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
    // Wait for BOTH order and customer data before rendering the invoice.
    // Customer data is mandatory for a complete bill.
    if (isLoading || (order?.customerId && isCustomerLoading)) {
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
        // Merge customer data from DB with order data.
        // Order-level fields take priority, then DB customer fields, then fallbacks.
        // The customer variable is ALWAYS fetched from DB when customerId exists,
        // so it contains the full customer record (name, phone, email, address).
        const linkedCustomer = customer || (order as any).customer || (order as any).customers || null;
        const invoiceItems = buildInvoiceItems(order);
        const subtotal = invoiceItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
        const formattedAddress = firstNonEmpty(
            parseAddress(order.fulfillmentType === 'delivery' ? order.deliveryAddress : ""),
            parseAddress(order.shippingAddress),
            parseAddress((order as any).address),
            parseAddress((order as any).customerAddress),
            parseAddress(linkedCustomer?.address),
            parseAddress(linkedCustomer?.deliveryAddress),
            ""
        );
        // MANDATORY: name and phone must always be present
        const customerName = firstNonEmpty(order.customerName, linkedCustomer?.name, "") || "Customer";
        const customerPhone = firstNonEmpty(order.customerPhone, linkedCustomer?.phone, (order as any).phone, "") || "N/A";
        // OPTIONAL: email — show if available, otherwise empty string (template handles hiding)
        const customerEmail = firstNonEmpty(order.customerEmail, linkedCustomer?.email, (order as any).email, "");

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
                    address: "Yadvik Traaders, #16, Venketaramana Round Road, Mahalingapuram, Opp. to HDFC Bank, Pollachi – 642 002.",
                    phone: "+91 93630 59595",
                    email: "support@myfabclean.com",
                    taxId: "33AITPD3522F1ZK",
                    logo: "/assets/logo.webp"
                },
                customer: {
                    id: order.customerId,
                    name: customerName,
                    address: formattedAddress,
                    phone: customerPhone,
                    email: customerEmail,
                    taxId: order.gstNumber || undefined
                },
                items: invoiceItems,
                subtotal: subtotal,
                taxAmount: calculatedTax,
                deliveryCharges: deliveryCharges,
                expressSurcharge: (order as any).expressSurcharge ? Number((order as any).expressSurcharge) : 0,
                total: calculatedTotal,
                paymentTerms: "Due on receipt",
                qrCode: qrCodeUrl || undefined,
                isExpressOrder: (order as any).isExpressOrder || (order as any).is_express_order || false,
                fulfillmentType: order.fulfillmentType || 'pickup',
                deliveryAddress: order.deliveryAddress || formattedAddress,
                paymentBreakdown: {
                    walletDeducted: Number(order.walletUsed || 0),
                    cashPaid: Math.max(0, advancePaid - Number(order.walletUsed || 0)),
                    creditOutstanding: Number(order.creditUsed || 0),
                    previousOutstanding: 0, // Not stored on order, will be omitted or 0
                    newOutstanding: Number(order.creditUsed || 0), // At least show this order's credit
                    paymentMethod: (order.paymentMethod || 'CASH').toUpperCase()
                }
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
                    address: "Yadvik Traaders, #16, Venketaramana Round Road, Mahalingapuram, Opp. to HDFC Bank, Pollachi – 642 002.",
                    phone: "+91 93630 59595",
                    email: "support@myfabclean.com",
                    logo: "/assets/logo.webp"
                },
                customer: {
                    id: order.customerId,
                    name: customerName,
                    address: formattedAddress,
                    phone: customerPhone,
                    email: customerEmail
                },
                items: invoiceItems.map((item) => ({
                    ...item,
                    taxRate: 0,
                    hsn: undefined,
                })),
                subtotal: subtotal,
                total: totalAmount, // Use stored total for simple bill
                deliveryCharges: deliveryCharges,
                expressSurcharge: (order as any).expressSurcharge ? Number((order as any).expressSurcharge) : 0,
                paymentTerms: "Due on receipt",
                qrCode: qrCodeUrl || undefined,
                isExpressOrder: (order as any).isExpressOrder || (order as any).is_express_order || false,
                fulfillmentType: order.fulfillmentType || 'pickup',
                deliveryAddress: order.deliveryAddress || formattedAddress,
                paymentBreakdown: {
                    walletDeducted: Number(order.walletUsed || 0),
                    cashPaid: Math.max(0, advancePaid - Number(order.walletUsed || 0)),
                    creditOutstanding: Number(order.creditUsed || 0),
                    previousOutstanding: 0, 
                    newOutstanding: Number(order.creditUsed || 0),
                    paymentMethod: (order.paymentMethod || 'CASH').toUpperCase()
                }
            };

            return <SimpleInvoiceTemplate data={invoiceData} />;
        }
    }

    // Fallback (should never reach here due to early returns above)
    return null;
}
