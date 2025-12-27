import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import {
    Search,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    Phone,
    MessageCircle,
    Calendar,
    CreditCard,
    ArrowRight,
    Sparkles,
    Factory,
    Home,
    Star,
    Shield,
    Zap,
    PartyPopper,
    Timer,
    MapPin,
    Info,
    ChevronDown,
    ChevronUp,
    Bell,
    Shirt,
    Droplets,
    Wind,
    ThumbsUp,
    RefreshCw,
    ExternalLink
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

        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            @keyframes pulse-ring {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(1.5); opacity: 0; }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes confetti {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
            }
            @keyframes slide-up {
                0% { transform: translateY(20px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes bounce-in {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes gradient-x {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            @keyframes ripple {
                0% { transform: scale(0.8); opacity: 1; }
                100% { transform: scale(2.4); opacity: 0; }
            }
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.5); }
                50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.6); }
            }
            .animate-shimmer {
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                background-size: 200% 100%;
                animation: shimmer 2s infinite;
            }
            .animate-float { animation: float 3s ease-in-out infinite; }
            .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
            .animate-bounce-in { animation: bounce-in 0.6s ease-out forwards; }
            .animate-gradient { 
                background-size: 200% 200%;
                animation: gradient-x 3s ease infinite;
            }
            .animate-glow { animation: glow 2s ease-in-out infinite; }
            .delay-100 { animation-delay: 0.1s; }
            .delay-200 { animation-delay: 0.2s; }
            .delay-300 { animation-delay: 0.3s; }
            .delay-400 { animation-delay: 0.4s; }
            .delay-500 { animation-delay: 0.5s; }
            .progress-cursor {
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .progress-cursor:hover {
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.title = "Fab Clean - Premium Laundry & Dry Cleaning";
            style.remove();
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

// Status step configuration with detailed info
const statusSteps = [
    {
        id: 'pending',
        label: 'Order Placed',
        icon: Package,
        emoji: '📦',
        color: 'from-amber-400 to-orange-500',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        description: 'Your order has been received',
        detailedInfo: 'We have received your order and are preparing to process it. You will be notified once we start working on your items.',
        estimatedTime: '~30 mins'
    },
    {
        id: 'processing',
        label: 'In Process',
        icon: Factory,
        emoji: '🧺',
        color: 'from-blue-400 to-indigo-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        description: 'Expert care for your garments',
        detailedInfo: 'Our cleaning experts are now carefully handling your garments using premium detergents and state-of-the-art equipment.',
        estimatedTime: '24-48 hours'
    },
    {
        id: 'ready_for_pickup',
        label: 'Ready',
        icon: CheckCircle2,
        emoji: '✨',
        color: 'from-emerald-400 to-green-500',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        description: 'Ready for collection',
        detailedInfo: 'Great news! Your freshly cleaned items are ready and waiting for you. Pick them up at your convenience or wait for delivery.',
        estimatedTime: 'Ready now!'
    },
    {
        id: 'out_for_delivery',
        label: 'On The Way',
        icon: Truck,
        emoji: '🚚',
        color: 'from-purple-400 to-violet-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        description: 'Out for delivery',
        detailedInfo: 'Your order is on its way! Our delivery partner will reach you shortly. Please keep your phone nearby.',
        estimatedTime: '30-60 mins'
    },
    {
        id: 'completed',
        label: 'Delivered',
        icon: PartyPopper,
        emoji: '🎉',
        color: 'from-green-400 to-emerald-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        description: 'Successfully delivered!',
        detailedInfo: 'Your order has been delivered successfully. Thank you for choosing Fab Clean! We hope to serve you again soon.',
        estimatedTime: 'Completed'
    },
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

// Confetti component for completed orders
const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {[...Array(30)].map((_, i) => (
            <div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: '-20px',
                    backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#8b5cf6'][Math.floor(Math.random() * 6)],
                    animation: `confetti ${2 + Math.random() * 2}s ease-out forwards`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                }}
            />
        ))}
    </div>
);

// Interactive Progress Step Component
const ProgressStep = ({
    step,
    index,
    currentIndex,
    isSelected,
    onSelect
}: {
    step: typeof statusSteps[0];
    index: number;
    currentIndex: number;
    isSelected: boolean;
    onSelect: () => void;
}) => {
    const isCompleted = index <= currentIndex;
    const isCurrent = index === currentIndex;
    const isPast = index < currentIndex;
    const StepIcon = step.icon;

    return (
        <div
            className="flex flex-col items-center group progress-cursor relative"
            style={{ width: `${100 / statusSteps.length}%` }}
            onClick={onSelect}
        >
            {/* Ripple effect on click */}
            {isSelected && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-emerald-400/20 animate-ping" />
            )}

            {/* Step Circle */}
            <div className="relative mb-4">
                {/* Glow effect for current */}
                {isCurrent && (
                    <>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-30"
                            style={{ background: `linear-gradient(135deg, ${step.color.includes('amber') ? '#f59e0b' : step.color.includes('blue') ? '#3b82f6' : step.color.includes('emerald') ? '#10b981' : step.color.includes('purple') ? '#8b5cf6' : '#10b981'}, transparent)`, transform: 'scale(1.5)' }}
                        />
                        <div className="absolute inset-0 rounded-full animate-glow" />
                    </>
                )}

                {/* Checkmark badge for completed */}
                {isPast && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg z-10 border-2 border-white animate-bounce-in">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                )}

                {/* Main circle */}
                <div className={cn(
                    "relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                    isCompleted
                        ? `bg-gradient-to-br ${step.color} text-white border-white shadow-xl`
                        : "bg-white text-slate-300 border-slate-200 shadow-md",
                    isCurrent && "scale-110 border-emerald-200 animate-glow",
                    isSelected && "ring-4 ring-emerald-300 ring-offset-2",
                    "group-hover:scale-110 group-hover:shadow-2xl"
                )}>
                    <StepIcon className={cn(
                        "w-7 h-7 md:w-8 md:h-8 transition-transform duration-300",
                        "group-hover:scale-110",
                        isCurrent && "animate-pulse"
                    )} />
                </div>

                {/* Emoji badge */}
                {isCompleted && (
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xl animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                        {step.emoji}
                    </span>
                )}
            </div>

            {/* Step Label */}
            <span className={cn(
                "text-xs md:text-sm font-bold text-center transition-all duration-300 px-1 mt-2",
                isCompleted ? "text-slate-800" : "text-slate-400",
                isSelected && "text-emerald-600",
                "group-hover:text-emerald-600"
            )}>
                {step.label}
            </span>

            {/* Current/Time badge */}
            {isCurrent ? (
                <span className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full animate-pulse">
                    Current
                </span>
            ) : isCompleted ? (
                <span className="mt-2 text-xs text-slate-500">
                    ✓ Done
                </span>
            ) : (
                <span className="mt-2 text-xs text-slate-400">
                    {step.estimatedTime}
                </span>
            )}
        </div>
    );
};

export default function PublicOrderTracking() {
    useTrackingSEO();
    const params = useParams<{ orderNumber?: string }>();
    const [orderNumber, setOrderNumber] = useState(params.orderNumber || '');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [selectedStep, setSelectedStep] = useState<number | null>(null);
    const [showTimeline, setShowTimeline] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        if (params.orderNumber) {
            setOrderNumber(params.orderNumber);
            handleSearch(params.orderNumber);
        }
    }, [params.orderNumber]);

    useEffect(() => {
        if (order && getStatusIndex(order.status) === 4) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
        }
        // Auto-select current step
        if (order) {
            setSelectedStep(getStatusIndex(order.status));
        }
    }, [order]);

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

    const handleRefresh = async () => {
        if (!order?.orderNumber) return;
        setRefreshing(true);
        await handleSearch(order.orderNumber);
        setTimeout(() => setRefreshing(false), 500);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatAmount = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `₹${num?.toLocaleString('en-IN') || '0'}`;
    };

    const getCurrentStepIndex = () => order ? getStatusIndex(order.status) : -1;

    const getStatusBadgeStyle = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
            processing: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
            ready_for_pickup: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
            out_for_delivery: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
            completed: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
            delivered: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
        };
        return styles[status?.toLowerCase()] || 'bg-gradient-to-r from-slate-500 to-slate-600 text-white';
    };

    const getSelectedStepInfo = () => {
        if (selectedStep === null) return null;
        return statusSteps[selectedStep];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 overflow-x-hidden">
            {showConfetti && <Confetti />}

            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
                    <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src="/assets/logo.webp" alt="Fab Clean" className="h-12" />
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-gradient text-white py-16 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }} />
                </div>

                <div className="relative max-w-5xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span className="text-sm font-medium">Real-time Order Tracking</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Track Your Order</h1>
                    <p className="text-emerald-100 text-lg max-w-xl mx-auto">
                        Enter your order number to see live status updates
                    </p>
                </div>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto px-6 -mt-10 relative z-20">
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5" />
                    <CardContent className="relative p-6">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Search className="w-5 h-5 text-emerald-600" />
                                </div>
                                <Input
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Enter order number (e.g., FZC-2025POL9926A)"
                                    className="pl-16 h-14 text-lg border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
                                />
                            </div>
                            <Button
                                onClick={() => handleSearch()}
                                disabled={loading || !orderNumber.trim()}
                                className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
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
            <main className="relative max-w-5xl mx-auto px-6 py-10">
                {/* Error State */}
                {error && (
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-rose-50 mb-8 animate-slide-up overflow-hidden">
                        <CardContent className="p-8 text-center">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mb-4 rotate-3">
                                <Package className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-red-700 mb-2">Order Not Found</h3>
                            <p className="text-red-600/80 mb-4">Please check your order number and try again</p>
                            <div className="flex items-center justify-center gap-2 text-sm text-red-500">
                                <Info className="w-4 h-4" />
                                <span>Order numbers look like: FZC-2025POL9926A</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Order Found */}
                {order && (
                    <div className="space-y-6">
                        {/* Customer Greeting Card */}
                        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/50 overflow-hidden animate-slide-up">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <CardContent className="relative p-8">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div>
                                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg mb-3 text-sm px-4 py-1">
                                            {order.orderNumber}
                                        </Badge>
                                        <h2 className="text-3xl font-bold text-slate-800 mb-1">
                                            Hello, {order.customerName?.split(' ')[0] || 'Customer'}!
                                            <span className="inline-block ml-2 animate-float">{statusSteps[getCurrentStepIndex()]?.emoji || '👋'}</span>
                                        </h2>
                                        <p className="text-slate-500 text-lg">Track your laundry order status in real-time</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={cn('text-base px-5 py-2 font-semibold shadow-lg border-0', getStatusBadgeStyle(order.status))}>
                                            {statusSteps[getCurrentStepIndex()]?.label || 'Processing'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRefresh}
                                            className="text-slate-500 hover:text-emerald-600"
                                        >
                                            <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interactive Progress Tracker */}
                        <Card className="border-0 shadow-xl bg-white overflow-hidden animate-slide-up delay-100">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                                            <Timer className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">Order Progress</h3>
                                            <p className="text-sm text-slate-500">Click on any step for details</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Bell className="w-4 h-4 text-emerald-500" />
                                        <span>WhatsApp updates enabled</span>
                                    </div>
                                </div>

                                {/* Progress Bar with Cursor Interaction */}
                                <div ref={progressRef} className="relative py-8">
                                    {/* Background Track */}
                                    <div className="absolute top-1/2 left-0 right-0 h-4 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-full transform -translate-y-1/2 shadow-inner" />

                                    {/* Animated Progress Fill */}
                                    <div
                                        className="absolute top-1/2 left-0 h-4 rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-out overflow-hidden shadow-lg"
                                        style={{ width: `${(getCurrentStepIndex() / (statusSteps.length - 1)) * 100}%` }}
                                    >
                                        <div className="h-full w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                        </div>
                                    </div>

                                    {/* Interactive Steps */}
                                    <div className="relative flex justify-between items-center">
                                        {statusSteps.map((step, index) => (
                                            <ProgressStep
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                currentIndex={getCurrentStepIndex()}
                                                isSelected={selectedStep === index}
                                                onSelect={() => setSelectedStep(index)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Selected Step Details Panel */}
                                {selectedStep !== null && (
                                    <div className={cn(
                                        "mt-6 p-6 rounded-2xl border-2 transition-all duration-500 animate-slide-up",
                                        statusSteps[selectedStep].bgColor,
                                        "border-opacity-50"
                                    )} style={{ borderColor: selectedStep <= getCurrentStepIndex() ? '#10b981' : '#e2e8f0' }}>
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0",
                                                `bg-gradient-to-br ${statusSteps[selectedStep].color}`
                                            )}>
                                                {(() => {
                                                    const StepIcon = statusSteps[selectedStep].icon;
                                                    return <StepIcon className="w-8 h-8 text-white" />;
                                                })()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className={cn("text-xl font-bold", statusSteps[selectedStep].textColor)}>
                                                        {statusSteps[selectedStep].emoji} {statusSteps[selectedStep].label}
                                                    </h4>
                                                    {selectedStep === getCurrentStepIndex() && (
                                                        <Badge className="bg-emerald-500 text-white text-xs">Current</Badge>
                                                    )}
                                                    {selectedStep < getCurrentStepIndex() && (
                                                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Completed</Badge>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 mb-3">{statusSteps[selectedStep].detailedInfo}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className={cn("flex items-center gap-1", statusSteps[selectedStep].textColor)}>
                                                        <Timer className="w-4 h-4" />
                                                        Est. Time: {statusSteps[selectedStep].estimatedTime}
                                                    </span>
                                                    {selectedStep === getCurrentStepIndex() && order.updatedAt && (
                                                        <span className="text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            Updated: {formatDateTime(order.updatedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Summary */}
                                <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-full bg-white shadow-lg border-4 border-emerald-100 flex items-center justify-center">
                                            <span className="text-xl font-bold text-emerald-600">
                                                {Math.round((getCurrentStepIndex() / (statusSteps.length - 1)) * 100)}%
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">Progress Complete</p>
                                            <p className="text-sm text-slate-500">Step {getCurrentStepIndex() + 1} of {statusSteps.length}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowTimeline(!showTimeline)}
                                        className="text-slate-600"
                                    >
                                        {showTimeline ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                        {showTimeline ? 'Hide' : 'Show'} Timeline
                                    </Button>
                                </div>

                                {/* Timeline (Expandable) */}
                                {showTimeline && (
                                    <div className="mt-4 space-y-3 animate-slide-up">
                                        {statusSteps.slice(0, getCurrentStepIndex() + 1).map((step, index) => (
                                            <div key={step.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-100">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                                    `bg-gradient-to-br ${step.color}`
                                                )}>
                                                    {(() => {
                                                        const StepIcon = step.icon;
                                                        return <StepIcon className="w-5 h-5 text-white" />;
                                                    })()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-800">{step.label}</p>
                                                    <p className="text-sm text-slate-500">{step.description}</p>
                                                </div>
                                                <div className="text-right text-sm text-slate-400">
                                                    {index === getCurrentStepIndex() ? (
                                                        <span className="text-emerald-600 font-medium">Now</span>
                                                    ) : (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Order Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Order Info */}
                            <Card className="border-0 shadow-xl bg-white overflow-hidden animate-slide-up delay-200 group hover:shadow-2xl transition-shadow">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow">
                                            <Calendar className="w-5 h-5 text-white" />
                                        </div>
                                        Order Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Order Date
                                            </span>
                                            <span className="font-semibold text-slate-800">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <CreditCard className="w-4 h-4" /> Total Amount
                                            </span>
                                            <span className="font-bold text-2xl text-emerald-600">{formatAmount(order.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                            <span className="text-slate-500">Payment</span>
                                            <Badge className={order.paymentStatus === 'paid'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                            }>
                                                {order.paymentStatus?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                            <span className="text-slate-500">Fulfillment</span>
                                            <div className="flex items-center gap-2">
                                                {order.fulfillmentType === 'delivery' ? (
                                                    <Truck className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <Home className="w-4 h-4 text-emerald-600" />
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
                            <Card className="border-0 shadow-xl bg-white overflow-hidden animate-slide-up delay-300 group hover:shadow-2xl transition-shadow">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow">
                                            <Package className="w-5 h-5 text-white" />
                                        </div>
                                        Order Items
                                        <Badge variant="outline" className="ml-auto">{order.items?.length || 0} items</Badge>
                                    </h3>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {order.items?.length > 0 ? (
                                            order.items.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors cursor-default group/item"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/item:shadow-md transition-shadow">
                                                            <Shirt className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800">{item.serviceName}</p>
                                                            <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold text-slate-700">{formatAmount(item.price)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-slate-400">
                                                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>No items to display</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Service Features */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up delay-400">
                            {[
                                { icon: Droplets, label: 'Premium Wash', desc: 'Eco-friendly detergents', color: 'from-blue-400 to-cyan-500' },
                                { icon: Wind, label: 'Fresh & Clean', desc: 'Ozone sanitization', color: 'from-emerald-400 to-green-500' },
                                { icon: Shield, label: 'Care Guarantee', desc: '100% quality assured', color: 'from-purple-400 to-violet-500' },
                                { icon: Truck, label: 'Free Delivery', desc: 'Doorstep service', color: 'from-amber-400 to-orange-500' },
                            ].map((feature) => (
                                <Card key={feature.label} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-default">
                                    <CardContent className="p-4 text-center">
                                        <div className={cn(
                                            "w-12 h-12 mx-auto rounded-xl flex items-center justify-center shadow-lg mb-3",
                                            `bg-gradient-to-br ${feature.color}`
                                        )}>
                                            <feature.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-sm">{feature.label}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Need Help */}
                        <Card className="border-0 shadow-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-gradient text-white overflow-hidden animate-slide-up delay-500">
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }} />
                            </div>
                            <CardContent className="relative p-8">
                                <div className="flex items-center justify-between flex-wrap gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-5 h-5" />
                                            <span className="text-emerald-100">Premium Support</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-1">Need Help?</h3>
                                        <p className="text-emerald-100">We're here to assist you 24/7</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shadow-lg"
                                            onClick={() => window.open('tel:+919363059595')}
                                        >
                                            <Phone className="w-5 h-5 mr-2" />
                                            Call Now
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
                                            onClick={() => window.open('https://wa.me/919363059595')}
                                        >
                                            <MessageCircle className="w-5 h-5 mr-2" />
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
                    <div className="text-center py-16 animate-slide-up">
                        <div className="max-w-lg mx-auto">
                            <div className="relative w-28 h-28 mx-auto mb-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl rotate-6 opacity-30" />
                                <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                    <Sparkles className="w-14 h-14 text-white animate-float" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-3">Track Your Order</h3>
                            <p className="text-slate-500 text-lg mb-10">
                                Enter your order number above to see the current status of your laundry
                            </p>

                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    { icon: Zap, label: 'Fast Pickup', desc: 'Free doorstep service', color: 'from-amber-400 to-orange-500' },
                                    { icon: Star, label: 'Expert Care', desc: 'Professional cleaning', color: 'from-blue-400 to-indigo-500' },
                                    { icon: Truck, label: 'Quick Delivery', desc: 'On-time guarantee', color: 'from-emerald-400 to-teal-500' },
                                ].map((feature) => (
                                    <div
                                        key={feature.label}
                                        className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-default"
                                    >
                                        <div className={cn(
                                            'w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110',
                                            `bg-gradient-to-br ${feature.color}`
                                        )}>
                                            <feature.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-slate-800">{feature.label}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-14 mt-auto">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-10 mb-10">
                        <div>
                            <img src="/assets/logo.webp" alt="Fab Clean" className="h-10 mb-4 brightness-0 invert opacity-80" />
                            <p className="text-slate-400">Premium laundry and dry cleaning services committed to quality and customer satisfaction.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4 text-lg">Legal</h4>
                            <ul className="space-y-3 text-slate-400">
                                <li><a href="/terms" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><ExternalLink className="w-3 h-3" />Terms & Conditions</a></li>
                                <li><a href="/privacy" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><ExternalLink className="w-3 h-3" />Privacy Policy</a></li>
                                <li><a href="/refund" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><ExternalLink className="w-3 h-3" />Refund Policy</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4 text-lg">Contact</h4>
                            <ul className="space-y-3 text-slate-400">
                                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400" /> +91 93630 59595</li>
                                <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-emerald-400" /> support@myfabclean.com</li>
                                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /> Pollachi, Tamil Nadu</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-center">
                        <p className="text-slate-500">© {currentYear} Fab Clean. All rights reserved. | Premium Laundry Service</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
