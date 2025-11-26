import { useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/data-service";
import { Loader2, Printer, Share2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/data-service";
// @ts-ignore
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export default function BillView() {
    const [, params] = useRoute("/bill/:orderNumber");
    const orderNumber = params?.orderNumber;
    const barcodeRef = useRef<SVGSVGElement>(null);
    const qrcodeRef = useRef<HTMLCanvasElement>(null);

    const { data: order, isLoading, error } = useQuery({
        queryKey: ["order", orderNumber],
        queryFn: async () => {
            if (!orderNumber) return null;
            const orders = await ordersApi.getAll();
            return orders.find(o => o.orderNumber === orderNumber);
        },
        enabled: !!orderNumber
    });

    useEffect(() => {
        if (!order) return;

        const generateCodes = () => {
            if (barcodeRef.current) {
                try {
                    // Ensure the element exists and is visible
                    if (barcodeRef.current.clientWidth === 0) {
                        setTimeout(generateCodes, 50);
                        return;
                    }

                    JsBarcode(barcodeRef.current, order.orderNumber, {
                        format: "CODE128",
                        width: 2,
                        height: 50,
                        displayValue: true,
                        fontSize: 16,
                        margin: 10,
                        background: "transparent",
                    });
                } catch (e) {
                    console.error("Barcode generation failed", e);
                }
            }

            if (qrcodeRef.current) {
                const qrData = `upi://pay?pa=8825702072@kotak811&pn=FabZClean&am=${order.totalAmount}&tr=${order.orderNumber}&tn=Order ${order.orderNumber}`;
                QRCode.toCanvas(qrcodeRef.current, qrData, {
                    width: 120,
                    margin: 2,
                    color: {
                        dark: '#10b981',
                        light: '#ffffff'
                    }
                }, (error: any) => {
                    if (error) console.error("QR Code generation failed", error);
                });
            }
        };

        // Small delay to ensure DOM is rendered
        const timer = setTimeout(() => {
            requestAnimationFrame(generateCodes);
        }, 100);

        return () => clearTimeout(timer);
    }, [order]);

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

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Bill - ${order.orderNumber}`,
                text: `Here is your bill for Order #${order.orderNumber}`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            const message = `Here is your bill: ${window.location.href}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }
    };

    const subtotal = Array.isArray(order.items)
        ? order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        : Number(order.totalAmount);

    const discount = order.discountValue ? Number(order.discountValue) : 0;
    const extraCharges = order.extraCharges ? Number(order.extraCharges) : 0;
    const advancePaid = order.advancePaid ? Number(order.advancePaid) : 0;

    return (
        <>
            {/* Print Styles */}
            <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print-hide { display: none !important; }
          .invoice-container { box-shadow: none !important; border-radius: 0 !important; }
          @page { margin: 0.5cm; }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          background-size: 1000px 100%;
        }
      `}</style>

            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8 print:bg-white print:p-0">
                {/* Actions Bar (Hidden in Print) */}
                <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print-hide">
                    <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
                        ← Back
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handleShare} variant="outline" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                        <Button onClick={handlePrint} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                {/* Invoice Container */}
                <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden invoice-container">
                    {/* Premium Header with Gradient */}
                    <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-blue-600 p-8 text-white overflow-hidden">
                        <div className="absolute inset-0 shimmer opacity-20"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold text-center mb-2 tracking-tight">FabZClean</h1>
                            <p className="text-center text-emerald-50 text-lg">Premium Dry Clean & Laundry Service</p>
                            <div className="mt-4 text-center text-sm text-emerald-100 space-y-1">
                                <p>📍 123 Main Street, Business District, City 560001</p>
                                <p>📞 +91 123 456 7890 | ✉️ hello@fabzclean.com</p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Details Section */}
                    <div className="p-8 md:p-12">
                        {/* Header Info Grid */}
                        <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-gray-100">
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
                                        INVOICE
                                    </h2>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-500 w-24">Order #:</span>
                                            <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-500 w-24">Date:</span>
                                            <span className="text-gray-900">{order.createdAt ? formatDate(new Date(order.createdAt).toISOString()) : 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-500 w-24">Status:</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 uppercase">
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                    Bill To
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p className="font-bold text-lg text-gray-900">{order.customerName}</p>
                                    <p className="text-gray-700">📞 {order.customerPhone}</p>
                                    {order.customerEmail && <p className="text-gray-700">✉️ {order.customerEmail}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-emerald-50 to-blue-50">
                                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Description</th>
                                            <th className="text-center py-4 px-4 font-semibold text-gray-700">Qty</th>
                                            <th className="text-right py-4 px-4 font-semibold text-gray-700">Price</th>
                                            <th className="text-right py-4 px-6 font-semibold text-gray-700">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-medium text-gray-900">{item.productName}</div>
                                                </td>
                                                <td className="text-center py-4 px-4 font-medium text-gray-700">
                                                    ×{item.quantity}
                                                </td>
                                                <td className="text-right py-4 px-4 text-gray-700">
                                                    {formatCurrency(item.price)}
                                                </td>
                                                <td className="text-right py-4 px-6 font-semibold text-gray-900">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end mb-8">
                            <div className="w-full md:w-96 space-y-3">
                                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Discount ({order.discountType}):</span>
                                        <span className="font-semibold text-red-600">-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                                {extraCharges > 0 && (
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Extra Charges:</span>
                                        <span className="font-semibold text-gray-900">+{formatCurrency(extraCharges)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold py-4 border-t-2 border-gray-200">
                                    <span className="text-gray-900">Total Amount:</span>
                                    <span className="text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                        {formatCurrency(Number(order.totalAmount))}
                                    </span>
                                </div>
                                {advancePaid > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Advance Paid:</span>
                                            <span className="font-semibold text-green-600">-{formatCurrency(advancePaid)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold py-3 bg-amber-50 px-4 rounded-lg border border-amber-200">
                                            <span className="text-amber-900">Balance Due:</span>
                                            <span className="text-2xl text-amber-600">
                                                {formatCurrency(Number(order.totalAmount) - advancePaid)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* QR Code & Barcode Section */}
                        <div className="grid md:grid-cols-2 gap-8 pt-8 border-t-2 border-gray-100">
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
                                <p className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Scan to Pay (UPI)
                                </p>
                                <div className="flex items-center gap-6">
                                    <div className="bg-white p-3 rounded-lg shadow-md">
                                        <canvas ref={qrcodeRef} className="w-28 h-28"></canvas>
                                    </div>
                                    <div className="text-xs text-gray-700 space-y-1">
                                        <p className="font-semibold">✓ GPay</p>
                                        <p className="font-semibold">✓ PhonePe</p>
                                        <p className="font-semibold">✓ Paytm</p>
                                        <p className="font-semibold">✓ Any UPI App</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-center">
                                <svg ref={barcodeRef} className="w-full max-w-[280px] mb-3"></svg>
                                <p className="text-xs text-gray-500 italic text-center">Order tracking ID</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-600 mb-2">
                                Thank you for choosing FabZClean! 🌟
                            </p>
                            <p className="text-xs text-gray-500">
                                For any queries, contact us at support@fabzclean.com or call +91 123 456 7890
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
                                <span>📧 Email Support</span>
                                <span>•</span>
                                <span>🔒 Secure Payment</span>
                                <span>•</span>
                                <span>♻️ Eco-Friendly</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Watermark for Screen (hidden in print) */}
                <div className="text-center mt-6 print-hide">
                    <p className="text-xs text-gray-400">
                        Generated on {new Date().toLocaleString()} • Invoice #{order.orderNumber}
                    </p>
                </div>
            </div>
        </>
    );
}
