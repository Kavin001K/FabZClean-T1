import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import {
    Search,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    Phone,
    MessageCircle,
    MapPin,
    Calendar,
    CreditCard,
    ArrowRight,
    Sparkles,
    Factory,
    Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// SEO Meta Tags Hook
const useTrackingSEO = () => {
    useEffect(() => {
        document.title = "Track Your Order | Fab Clean - Premium Laundry Services";

        const metaTags = [
            { name: "description", content: "Track your Fab Clean laundry order status in real-time. Get updates on pickup, processing, and delivery." },
            { name: "keywords", content: "fab clean tracking, laundry order tracking, dry cleaning status" },
            { property: "og:title", content: "Track Your Order | Fab Clean" },
            { property: "og:description", content: "Real-time order tracking for Fab Clean laundry services." },
            { property: "og:type", content: "website" },
        ];

        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            Object.entries(tag).forEach(([key, value]) => meta.setAttribute(key, value));
            document.head.appendChild(meta);
        });

        return () => {
            document.title = "Fab Clean - Premium Laundry & Dry Cleaning";
        };
    }, []);
};

interface OrderItem {
    serviceName: string;
    quantity: number;
    price: string | number;
}

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    paymentStatus: string;
    totalAmount: string;
    items: OrderItem[];
    fulfillmentType: string;
    createdAt: string;
    updatedAt: string;
    pickupDate?: string;
    lastWhatsappStatus?: string;
    lastWhatsappSentAt?: string;
}

// Status step configuration
const statusSteps = [
    { id: 'pending', label: 'Order Placed', icon: Package, description: 'Your order has been received' },
    { id: 'processing', label: 'In Process', icon: Factory, description: 'Your garments are being cleaned' },
    { id: 'ready_for_pickup', label: 'Ready', icon: CheckCircle2, description: 'Ready for collection/delivery' },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'On the way to you' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, description: 'Order delivered successfully' },
];

const getStatusIndex = (status: string): number => {
    const normalizedStatus = status?.toLowerCase().replace(/[\s-_]/g, '');
    const statusMap: Record<string, number> = {
        'pending': 0, 'received': 0, 'orderplaced': 0, 'new': 0,
        'processing': 1, 'inprocess': 1, 'cleaning': 1, 'inprogress': 1,
        'readyforpickup': 2, 'ready': 2, 'readyforcollection': 2,
        'outfordelivery': 3, 'intransit': 3, 'shipping': 3, 'dispatched': 3,
        'completed': 4, 'delivered': 4, 'done': 4, 'finished': 4,
    };
    return statusMap[normalizedStatus] ?? 0;
};

export default function PublicOrderTracking() {
    useTrackingSEO();
    const params = useParams<{ orderNumber?: string }>();
    const [orderNumber, setOrderNumber] = useState(params.orderNumber || '');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const currentYear = new Date().getFullYear();

    // Auto-search if order number is in URL
    useEffect(() => {
        if (params.orderNumber) {
            setOrderNumber(params.orderNumber);
            handleSearch(params.orderNumber);
        }
    }, [params.orderNumber]);

    const handleSearch = async (searchNumber?: string) => {
        const numToSearch = searchNumber || orderNumber;
        if (!numToSearch.trim()) return;

        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const response = await fetch(`/api/public/track/${encodeURIComponent(numToSearch.trim())}`);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.message || 'Order not found');
            }

            setOrder(data.data);

            // Update URL without reload
            if (data.data?.orderNumber) {
                window.history.replaceState(null, '', `/trackorder/${data.data.orderNumber}`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch order');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const formatAmount = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `₹${num?.toLocaleString('en-IN') || '0'}`;
    };

    const getCurrentStepIndex = () => order ? getStatusIndex(order.status) : -1;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700',
            processing: 'bg-blue-100 text-blue-700',
            ready_for_pickup: 'bg-emerald-100 text-emerald-700',
            out_for_delivery: 'bg-purple-100 text-purple-700',
            completed: 'bg-green-100 text-green-700',
            delivered: 'bg-green-100 text-green-700',
        };
        return colors[status?.toLowerCase()] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-x-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
                    <a href="/" className="flex items-center gap-3">
                        <img src="/assets/logo.webp" alt="Fab Clean" className="h-10" />
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">Track Your Order</h1>
                    <p className="text-emerald-100 text-lg max-w-xl mx-auto">
                        Enter your order number to see real-time status updates
                    </p>
                </div>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto px-6 -mt-8 relative z-10">
                <Card className="shadow-xl border-0">
                    <CardContent className="p-6">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Enter order number (e.g., FZC-2025POL9926A)"
                                    className="pl-12 h-14 text-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            </div>
                            <Button
                                onClick={() => handleSearch()}
                                disabled={loading || !orderNumber.trim()}
                                className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Track
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Error State */}
                {error && (
                    <Card className="border-red-200 bg-red-50 mb-8">
                        <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Package className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-red-700 mb-2">Order Not Found</h3>
                            <p className="text-red-600">Please check your order number and try again</p>
                        </CardContent>
                    </Card>
                )}

                {/* Order Found */}
                {order && (
                    <div className="space-y-6">
                        {/* Customer Greeting */}
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <Badge className="bg-emerald-600 text-white mb-2">{order.orderNumber}</Badge>
                                        <h2 className="text-2xl font-bold text-slate-800">
                                            Hello, {order.customerName?.split(' ')[0] || 'Customer'}! 👋
                                        </h2>
                                        <p className="text-slate-600">Track your laundry order status in real-time</p>
                                    </div>
                                    <Badge className={cn('text-sm px-4 py-2 font-medium', getStatusColor(order.status))}>
                                        {order.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Progress Tracker */}
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Clock className="w-5 h-5 text-emerald-600" />
                                    <h3 className="text-lg font-semibold text-slate-800">Order Progress</h3>
                                </div>

                                <div className="relative">
                                    {/* Progress Line */}
                                    <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200 rounded-full">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${(getCurrentStepIndex() / (statusSteps.length - 1)) * 100}%` }}
                                        />
                                    </div>

                                    {/* Steps */}
                                    <div className="relative flex justify-between">
                                        {statusSteps.map((step, index) => {
                                            const isCompleted = index <= getCurrentStepIndex();
                                            const isCurrent = index === getCurrentStepIndex();
                                            const StepIcon = step.icon;

                                            return (
                                                <div key={step.id} className="flex flex-col items-center text-center w-20">
                                                    <div className={cn(
                                                        'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                                                        isCompleted
                                                            ? 'bg-emerald-500 text-white shadow-lg'
                                                            : 'bg-slate-100 text-slate-400',
                                                        isCurrent && 'ring-4 ring-emerald-200'
                                                    )}>
                                                        <StepIcon className="w-5 h-5" />
                                                    </div>
                                                    <span className={cn(
                                                        'mt-3 text-xs font-medium',
                                                        isCompleted ? 'text-emerald-700' : 'text-slate-400'
                                                    )}>
                                                        {step.label}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="text-xs text-emerald-600 font-medium mt-1">Current</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Current Status Message */}
                                <div className="mt-8 p-4 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            {(() => {
                                                const CurrentIcon = statusSteps[getCurrentStepIndex()]?.icon || Package;
                                                return <CurrentIcon className="w-5 h-5 text-emerald-600" />;
                                            })()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                {statusSteps[getCurrentStepIndex()]?.description || 'Order received'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Last updated: {formatDate(order.updatedAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Order Info */}
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-emerald-600" />
                                        Order Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Order Date</span>
                                            <span className="font-medium text-slate-800">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Total Amount</span>
                                            <span className="font-bold text-emerald-600 text-lg">{formatAmount(order.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Payment Status</span>
                                            <Badge className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                                {order.paymentStatus?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-slate-500">Fulfillment</span>
                                            <div className="flex items-center gap-2">
                                                {order.fulfillmentType === 'delivery' ? (
                                                    <Truck className="w-4 h-4 text-slate-600" />
                                                ) : (
                                                    <Home className="w-4 h-4 text-slate-600" />
                                                )}
                                                <span className="font-medium text-slate-800">
                                                    {order.fulfillmentType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Items */}
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-emerald-600" />
                                        Order Items
                                    </h3>
                                    <div className="space-y-3">
                                        {order.items?.length > 0 ? (
                                            order.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{item.serviceName}</p>
                                                        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                                    </div>
                                                    <span className="font-medium text-slate-700">{formatAmount(item.price)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 text-center py-4">No items to display</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Need Help */}
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Need Help?</h3>
                                        <p className="text-emerald-100">We're here to assist you</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="secondary"
                                            className="bg-white/10 hover:bg-white/20 text-white border-0"
                                            onClick={() => window.open('tel:+919363059595')}
                                        >
                                            <Phone className="w-4 h-4 mr-2" />
                                            Call Us
                                        </Button>
                                        <Button
                                            className="bg-green-500 hover:bg-green-600 text-white"
                                            onClick={() => window.open('https://wa.me/919363059595')}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Initial State */}
                {!order && !error && !hasSearched && (
                    <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                            <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">Track Your Order</h3>
                            <p className="text-slate-600 mb-8">
                                Enter your order number above to see the current status of your laundry order
                            </p>

                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { icon: Package, label: 'Fast Pickup', desc: 'Free doorstep service' },
                                    { icon: Factory, label: 'Expert Care', desc: 'Professional cleaning' },
                                    { icon: Truck, label: 'Quick Delivery', desc: 'On-time guarantee' },
                                ].map((feature) => (
                                    <div key={feature.label} className="p-4 bg-slate-50 rounded-xl text-center">
                                        <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                                            <feature.icon className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <h4 className="font-medium text-slate-800 text-sm">{feature.label}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 mt-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <h4 className="font-semibold mb-4">Fab Clean</h4>
                            <p className="text-slate-400 text-sm">Premium laundry and dry cleaning services committed to quality and customer satisfaction.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="/refund" className="hover:text-white transition-colors">Refund Policy</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>📞 +91 93630 59595</li>
                                <li>✉️ support@myfabclean.com</li>
                                <li>🌐 www.myfabclean.com</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                        <p>© {currentYear} Fab Clean. All rights reserved. | Premium Laundry Service</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
