import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/data-service";
import { Loader2, Printer, Share2 } from "lucide-react";
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
            // We need to find the order by orderNumber. 
            // Since API gets by ID, we might need to search or list and filter.
            // For now, let's assume we can fetch by ID or the API supports orderNumber lookup.
            // If not, we'll fetch all and find it (inefficient but works for now).
            const orders = await ordersApi.getAll();
            return orders.find(o => o.orderNumber === orderNumber);
        },
        enabled: !!orderNumber
    });

    useEffect(() => {
        if (order && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, order.orderNumber, {
                    format: "CODE128",
                    width: 2,
                    height: 40,
                    displayValue: true,
                    fontSize: 14,
                    margin: 10,
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }

        if (order && qrcodeRef.current) {
            const qrData = `upi://pay?pa=fabzclean@upi&pn=FabZClean&am=${order.totalAmount}&tr=${order.orderNumber}&tn=Order ${order.orderNumber}`;
            QRCode.toCanvas(qrcodeRef.current, qrData, { width: 100 }, (error: any) => {
                if (error) console.error("QR Code generation failed", error);
            });
        }
    }, [order]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <p>Could not find order #{orderNumber}</p>
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
            // Fallback to WhatsApp
            const message = `Here is your bill: ${window.location.href}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white print:p-0">
            {/* Actions Bar (Hidden in Print) */}
            <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Button onClick={() => window.history.back()} variant="outline">Back</Button>
                <div className="flex gap-2">
                    <Button onClick={handleShare} variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Bill Content */}
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
                {/* Header */}
                <div className="bg-primary/5 p-8 text-center border-b">
                    <h1 className="text-3xl font-bold text-primary mb-2">FabZClean</h1>
                    <p className="text-muted-foreground">Dry Clean & Laundry Service</p>
                    <p className="text-sm text-muted-foreground mt-1">123 Main St, City, State, ZIP</p>
                    <p className="text-sm text-muted-foreground">Phone: (555) 123-4567</p>
                </div>

                {/* Invoice Details */}
                <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">INVOICE</h2>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-semibold w-24 inline-block">Order #:</span> {order.orderNumber}</p>
                                <p><span className="font-semibold w-24 inline-block">Date:</span> {order.createdAt ? formatDate(new Date(order.createdAt).toISOString()) : 'N/A'}</p>
                                <p><span className="font-semibold w-24 inline-block">Status:</span> <span className="uppercase">{order.status}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="font-semibold text-gray-800 mb-2">Bill To:</h3>
                            <div className="space-y-1 text-sm">
                                <p className="font-bold">{order.customerName}</p>
                                <p>{order.customerPhone}</p>
                                {order.customerEmail && <p>{order.customerEmail}</p>}
                                {/* Address would go here if available in order object */}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-3 font-semibold text-gray-600">Item Description</th>
                                <th className="text-center py-3 font-semibold text-gray-600">Qty</th>
                                <th className="text-right py-3 font-semibold text-gray-600">Price</th>
                                <th className="text-right py-3 font-semibold text-gray-600">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                                <tr key={index} className="border-b border-gray-100">
                                    <td className="py-3">{item.productName}</td>
                                    <td className="text-center py-3">{item.quantity}</td>
                                    <td className="text-right py-3">{formatCurrency(item.price)}</td>
                                    <td className="text-right py-3">{formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-semibold">{formatCurrency(Number(order.totalAmount))}</span>
                            </div>
                            {/* Add discount/tax logic here if available in order object */}
                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                <span>Total:</span>
                                <span className="text-primary">{formatCurrency(Number(order.totalAmount))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / QR / Barcode */}
                    <div className="grid grid-cols-2 gap-8 border-t pt-8">
                        <div>
                            <p className="font-semibold mb-2 text-sm">Payment Options:</p>
                            <div className="flex items-center gap-4">
                                <canvas ref={qrcodeRef} className="h-24 w-24 border rounded"></canvas>
                                <div className="text-xs text-muted-foreground">
                                    <p>Scan to pay via UPI</p>
                                    <p className="mt-1">Accepted: GPay, PhonePe, Paytm</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end justify-end">
                            <svg ref={barcodeRef} className="w-full max-w-[200px]"></svg>
                            <p className="text-xs text-muted-foreground mt-2">Thank you for your business!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
