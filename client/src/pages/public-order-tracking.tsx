import { useState, useEffect, useRef, TouchEvent } from 'react';
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
    RefreshCw,
    ExternalLink,
    X,
    ChevronLeft,
    ChevronRight,
    Download,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mobile detection hook
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

// SEO and Mobile Meta Tags Hook
const useTrackingSEO = () => {
    useEffect(() => {
        document.title = "Track Your Order | Fab Clean - Premium Laundry Services";

        // Ensure viewport meta is set for mobile
        let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

        // Add theme color for mobile browsers
        let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (!themeColor) {
            themeColor = document.createElement('meta');
            themeColor.name = 'theme-color';
            document.head.appendChild(themeColor);
        }
        themeColor.content = '#10b981';

        // Add apple mobile web app capable
        let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement;
        if (!appleMeta) {
            appleMeta = document.createElement('meta');
            appleMeta.name = 'apple-mobile-web-app-capable';
            appleMeta.content = 'yes';
            document.head.appendChild(appleMeta);
        }

        const style = document.createElement('style');
        style.id = 'tracking-styles';
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            @keyframes slide-up {
                0% { transform: translateY(20px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes slide-up-mobile {
                0% { transform: translateY(10px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes bounce-in {
                0% { transform: scale(0.5); opacity: 0; }
                70% { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes gradient-x {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            @keyframes pulse-soft {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            @keyframes confetti {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
            }
            .animate-shimmer {
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                background-size: 200% 100%;
                animation: shimmer 2s infinite;
            }
            .animate-float { animation: float 3s ease-in-out infinite; }
            .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
            .animate-bounce-in { animation: bounce-in 0.4s ease-out forwards; }
            .animate-gradient { 
                background-size: 200% 200%;
                animation: gradient-x 4s ease infinite;
            }
            .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
            
            /* Mobile optimizations */
            @media (max-width: 767px) {
                .animate-slide-up { animation: slide-up-mobile 0.3s ease-out forwards; }
                .animate-float { animation: float 4s ease-in-out infinite; }
            }
            
            /* Touch-friendly tap targets */
            .touch-target {
                min-height: 44px;
                min-width: 44px;
            }
            
            /* Safe area padding for notched devices */
            .safe-area-bottom {
                padding-bottom: env(safe-area-inset-bottom, 16px);
            }
            .safe-area-top {
                padding-top: env(safe-area-inset-top, 0px);
            }
            
            /* Smooth scrolling */
            html {
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
            }
            
            /* Hide scrollbar on mobile */
            .hide-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .hide-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            
            /* Bottom sheet styles */
            .bottom-sheet {
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .bottom-sheet-backdrop {
                transition: opacity 0.3s ease;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.title = "Fab Clean - Premium Laundry & Dry Cleaning";
            const existingStyle = document.getElementById('tracking-styles');
            if (existingStyle) existingStyle.remove();
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
    invoiceUrl?: string;
    lastWhatsappStatus?: string;
    lastWhatsappSentAt?: string;
}

// Status step configuration
// Status step configuration template - base for mapping
const STATUS_META = {
    pending: {
        id: 'pending',
        label: 'Placed',
        fullLabel: 'Order Placed',
        icon: Package,
        emoji: '📦',
        color: 'from-amber-400 to-orange-500',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        description: 'Order received',
        detailedInfo: 'We have received your order and are preparing to process it.',
        estimatedTime: '~30 mins'
    },
    processing: {
        id: 'processing',
        label: 'Process',
        fullLabel: 'In Process',
        icon: Factory,
        emoji: '🧺',
        color: 'from-blue-400 to-indigo-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        description: 'Cleaning in progress',
        detailedInfo: 'Our experts are carefully handling your garments with premium care.',
        estimatedTime: '24-48 hrs'
    },
    ready_for_pickup: {
        id: 'ready_for_pickup',
        label: 'Ready',
        fullLabel: 'Ready for Pickup',
        icon: CheckCircle2,
        emoji: '✨',
        color: 'from-emerald-400 to-green-500',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        description: 'Ready for pickup',
        detailedInfo: 'Your freshly cleaned items are ready and waiting for you!',
        estimatedTime: 'Ready now!'
    },
    out_for_delivery: {
        id: 'out_for_delivery',
        label: 'On Way',
        fullLabel: 'Out for Delivery',
        icon: Truck,
        emoji: '🚚',
        color: 'from-purple-400 to-violet-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        description: 'Out for delivery',
        detailedInfo: 'Your order is on its way! Our delivery partner will reach you shortly.',
        estimatedTime: '30-60 mins'
    },
    completed: {
        id: 'completed',
        label: 'Done',
        fullLabel: 'Completed',
        icon: PartyPopper,
        emoji: '🎉',
        color: 'from-green-400 to-emerald-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        description: 'Order completed!',
        detailedInfo: 'Your order has been finished successfully. Thank you for choosing Fab Clean!',
        estimatedTime: 'Done'
    },
};

const getStatusStepsForFulfillment = (fulfillmentType?: string) => {
    const isPickup = fulfillmentType === 'pickup' || fulfillmentType === 'store_pickup';
    
    // For pickup: Placed -> Process -> Ready -> Completed
    if (isPickup) {
        return [STATUS_META.pending, STATUS_META.processing, STATUS_META.ready_for_pickup, STATUS_META.completed];
    }
    
    // For delivery: Placed -> Process -> Out for Delivery -> Completed
    return [STATUS_META.pending, STATUS_META.processing, STATUS_META.out_for_delivery, STATUS_META.completed];
};

const getStatusIndexForSteps = (status: string, steps: any[]): number => {
    const normalizedStatus = status?.toLowerCase().replace(/[\s-_]/g, '');
    const statusMap: Record<string, string> = {
        'pending': 'pending', 'received': 'pending', 'orderplaced': 'pending', 'new': 'pending',
        'processing': 'processing', 'inprocess': 'processing', 'cleaning': 'processing', 'inprogress': 'processing',
        'readyforpickup': 'ready_for_pickup', 'ready': 'ready_for_pickup', 'readyforcollection': 'ready_for_pickup',
        'outfordelivery': 'out_for_delivery', 'intransit': 'out_for_delivery', 'shipping': 'out_for_delivery', 'dispatched': 'out_for_delivery',
        'completed': 'completed', 'delivered': 'completed', 'done': 'completed', 'finished': 'completed',
    };
    
    const baseId = statusMap[normalizedStatus] || 'pending';
    const index = steps.findIndex(s => s.id === baseId);
    
    // If exact status not in steps (e.g., ready_for_pickup in a delivery flow), find nearest or return based on map
    if (index === -1) {
        if (baseId === 'ready_for_pickup' && steps.some(s => s.id === 'out_for_delivery')) return 1; // Show still in process or transition
        if (baseId === 'out_for_delivery' && steps.some(s => s.id === 'ready_for_pickup')) return 2; // Show ready if somehow tracked here
        return 0;
    }
    return index;
};

// Confetti component
const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {[...Array(20)].map((_, i) => (
            <div
                key={i}
                className="absolute w-2 h-2 md:w-3 md:h-3 rounded-sm"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4'][Math.floor(Math.random() * 5)],
                    animation: `confetti ${1.5 + Math.random() * 1.5}s ease-out forwards`,
                    animationDelay: `${Math.random() * 0.3}s`,
                }}
            />
        ))}
    </div>
);

// Mobile Bottom Sheet Component
const BottomSheet = ({
    isOpen,
    onClose,
    step,
    isCurrent
}: {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    isCurrent: boolean;
}) => {
    if (!step) return null;

    const StepIcon = step.icon;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/40 z-50 bottom-sheet-backdrop",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 bottom-sheet safe-area-bottom",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* Handle */}
                <div className="flex justify-center py-3">
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                {/* Content */}
                <div className="px-6 pb-8">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0",
                            `bg-gradient-to-br ${step.color}`
                        )}>
                            <StepIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={cn("text-xl font-bold", step.textColor)}>
                                    {step.emoji} {step.fullLabel}
                                </h3>
                                {isCurrent && (
                                    <Badge className="bg-emerald-500 text-white text-xs">Current</Badge>
                                )}
                            </div>
                            <p className="text-slate-600 mt-2 leading-relaxed">{step.detailedInfo}</p>
                            <div className="flex items-center gap-2 mt-3 text-sm">
                                <Timer className={cn("w-4 h-4", step.textColor)} />
                                <span className={step.textColor}>Est. Time: {step.estimatedTime}</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full mt-6 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </>
    );
};

export default function PublicOrderTracking() {
    useTrackingSEO();
    const isMobile = useIsMobile();
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
    const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        if (params.orderNumber) {
            setOrderNumber(params.orderNumber);
            handleSearch(params.orderNumber);
        }
    }, [params.orderNumber]);

    const currentSteps = getStatusStepsForFulfillment(order?.fulfillmentType);
    const currentStepIndex = order ? getStatusIndexForSteps(order.status, currentSteps) : -1;

    useEffect(() => {
        if (order && currentStepIndex === currentSteps.length - 1) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }
    }, [order, currentStepIndex, currentSteps.length]);

    const [honeypot, setHoneypot] = useState('');

    const handleSearch = async (searchNumber?: string) => {
        // Honeypot check - Trap bots silently
        if (honeypot) {
            // Simulate network delay to keep them waiting
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                setError('Order not found');
            }, 2000);
            return;
        }

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

    const handleStepClick = (index: number) => {
        setSelectedStep(index);
        if (isMobile) {
            setBottomSheetOpen(true);
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

    // Replaced static helpers with local calculation

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

    return (
        <div className="min-h-screen overflow-x-hidden relative">
            {/* Premium Background */}
            <div className="fixed inset-0 -z-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582735689146-2771d9d968dd?auto=format&fit=crop&q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="fixed inset-0 bg-green-50/85 backdrop-blur-md -z-10" />

            {showConfetti && <Confetti />}

            {/* Mobile Bottom Sheet */}
            {isMobile && (
                <BottomSheet
                    isOpen={bottomSheetOpen}
                    onClose={() => setBottomSheetOpen(false)}
                    step={selectedStep !== null ? currentSteps[selectedStep] : null}
                    isCurrent={selectedStep === currentStepIndex}
                />
            )}

            {/* Decorative Background - Clean & Subtle */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-64 md:w-[500px] h-64 md:h-[500px] bg-gradient-to-br from-emerald-100/40 to-teal-100/30 rounded-full blur-[80px] md:blur-[120px]" />
                <div className="absolute top-1/2 -left-32 w-56 md:w-[400px] h-56 md:h-[400px] bg-gradient-to-br from-blue-100/25 to-indigo-100/20 rounded-full blur-[80px] md:blur-[120px]" />
                <div className="absolute -bottom-32 right-1/4 w-48 md:w-[350px] h-48 md:h-[350px] bg-gradient-to-br from-teal-100/20 to-cyan-100/15 rounded-full blur-[80px] md:blur-[120px]" />
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 safe-area-top shadow-sm">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-center">
                    <a href="/" className="flex items-center gap-2 active:opacity-70 transition-opacity">
                        <img src="/assets/logo.webp" alt="Fab Clean" className="h-9 md:h-12" />
                    </a>
                </div>
            </header>

            {/* Hero Section - Compact on mobile */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700 text-white py-8 md:py-16 overflow-hidden">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.08]">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }} />
                </div>
                {/* Decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-white/10 rounded-full blur-[100px]" />

                <div className="relative max-w-5xl mx-auto px-4 md:px-6 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 mb-3 border border-white/10">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse-soft" />
                        <span className="text-xs md:text-sm font-medium tracking-wide">Real-time Tracking</span>
                    </div>
                    <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4 tracking-tight">Track Your Order</h1>
                    <p className="text-emerald-100/90 text-sm md:text-lg max-w-xl mx-auto">
                        Enter your order number for live updates
                    </p>
                </div>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto px-4 md:px-6 -mt-6 md:-mt-10 relative z-20">
                <Card className="shadow-xl md:shadow-2xl border border-slate-100 bg-white/98 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 bg-emerald-100 rounded-lg md:rounded-xl flex items-center justify-center">
                                    <Search className="w-4 md:w-5 h-4 md:h-5 text-emerald-600" />
                                </div>
                                {/* Honeypot Field - Traps bots */}
                                <input
                                    type="text"
                                    name="website_url"
                                    value={honeypot}
                                    onChange={(e) => setHoneypot(e.target.value)}
                                    style={{ display: 'none' }}
                                    autoComplete="off"
                                    tabIndex={-1}
                                />
                                <Input
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Order number (FZC-2025...)"
                                    className="pl-12 md:pl-16 h-12 md:h-14 text-base md:text-lg border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
                                />
                            </div>
                            <Button
                                onClick={() => handleSearch()}
                                disabled={loading || !orderNumber.trim()}
                                className="h-12 md:h-14 px-6 md:px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 touch-target"
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
            <main className="relative max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
                {/* Error State */}
                {error && (
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 mb-6 animate-slide-up overflow-hidden">
                        <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center mb-3">
                                <Package className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-red-700 mb-1">Order Not Found</h3>
                            <p className="text-red-600/80 text-sm">Please check your order number</p>
                        </CardContent>
                    </Card>
                )}

                {/* Order Found */}
                {order && (
                    <div className="space-y-4 md:space-y-6">
                        {/* Customer Greeting Card */}
                        <Card className="border border-slate-100 shadow-md md:shadow-lg bg-white overflow-hidden animate-slide-up">
                            <CardContent className="p-4 md:p-8">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div>
                                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow mb-2 text-xs md:text-sm px-3 py-0.5">
                                            {order.orderNumber}
                                        </Badge>
                                        <h2 className="text-xl md:text-3xl font-bold text-slate-800">
                                            Hello, {order.customerName?.split(' ')[0] || 'there'}!
                                            <span className="inline-block ml-2 animate-float text-lg md:text-2xl">{currentSteps[currentStepIndex]?.emoji || '👋'}</span>
                                        </h2>
                                        <p className="text-slate-500 text-sm md:text-lg mt-1">Track your order in real-time</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn('text-sm md:text-base px-3 md:px-5 py-1.5 md:py-2 font-semibold shadow border-0', getStatusBadgeStyle(order.status))}>
                                            {currentSteps[currentStepIndex]?.fullLabel || 'Processing'}
                                        </Badge>
                                        <Badge className={cn(
                                            "text-sm md:text-base px-3 md:px-5 py-1.5 md:py-2 font-bold shadow border-0 ml-1 md:ml-3",
                                            order.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                        )}>
                                            {order.paymentStatus === 'paid' ? '💰 PAID' : '💳 PENDING PAYMENT'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRefresh}
                                            className="text-slate-500 hover:text-emerald-600 h-10 w-10 p-0 touch-target"
                                        >
                                            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Progress Tracker - Mobile Optimized */}
                        <Card className="border border-slate-100 shadow-md md:shadow-lg bg-white overflow-hidden animate-slide-up">
                            <CardContent className="p-4 md:p-8">
                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                                            <Timer className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-base md:text-xl font-bold text-slate-800">Order Progress</h3>
                                            <p className="text-xs md:text-sm text-slate-500 hidden md:block">Tap any step for details</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Bell className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="hidden sm:inline">WhatsApp updates</span>
                                    </div>
                                </div>

                                {/* Mobile-Optimized Progress Steps */}
                                <div ref={progressRef} className="relative py-4 md:py-8">
                                    {/* Progress Track */}
                                    <div className="absolute top-6 md:top-10 left-4 right-4 md:left-0 md:right-0 h-2 md:h-3 bg-slate-100 rounded-full" />

                                    {/* Progress Fill */}
                                    <div
                                        className="absolute top-6 md:top-10 left-4 md:left-0 h-2 md:h-3 rounded-full transition-all duration-700 ease-out overflow-hidden"
                                        style={{ width: `calc(${(currentStepIndex / (currentSteps.length - 1)) * 100}% - 32px)`, marginLeft: '0' }}
                                    >
                                        <div className="h-full w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 relative">
                                            <div className="absolute inset-0 animate-shimmer" />
                                        </div>
                                    </div>

                                    {/* Steps */}
                                    <div className="relative flex justify-between items-start px-0">
                                        {currentSteps.map((step, index) => {
                                            const isCompleted = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;
                                            const isPast = index < currentStepIndex;
                                            const StepIcon = step.icon;

                                            return (
                                                <button
                                                    key={step.id}
                                                    className="flex flex-col items-center text-center focus:outline-none touch-target group"
                                                    style={{ width: `${100 / currentSteps.length}%` }}
                                                    onClick={() => handleStepClick(index)}
                                                >
                                                    {/* Step Circle */}
                                                    <div className="relative">
                                                        {isCurrent && (
                                                            <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" style={{ transform: 'scale(1.3)' }} />
                                                        )}

                                                        {isPast && (
                                                            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full flex items-center justify-center z-10 border-2 border-white">
                                                                <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                                            </div>
                                                        )}

                                                        <div className={cn(
                                                            "relative w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 border-2 md:border-4",
                                                            isCompleted
                                                                ? `bg-gradient-to-br ${step.color} text-white border-white shadow-lg`
                                                                : "bg-white text-slate-300 border-slate-200",
                                                            isCurrent && "scale-110 ring-2 ring-emerald-200 ring-offset-1",
                                                            "active:scale-95"
                                                        )}>
                                                            <StepIcon className={cn(
                                                                "w-5 h-5 md:w-7 md:h-7",
                                                                isCurrent && "animate-pulse-soft"
                                                            )} />
                                                        </div>
                                                    </div>

                                                    {/* Label */}
                                                    <span className={cn(
                                                        "mt-2 text-[10px] md:text-sm font-semibold transition-colors",
                                                        isCompleted ? "text-slate-800" : "text-slate-400"
                                                    )}>
                                                        {isMobile ? step.label : step.fullLabel}
                                                    </span>

                                                    {isCurrent && (
                                                        <span className="mt-1 text-[9px] md:text-xs font-bold text-emerald-600 bg-emerald-100 px-1.5 md:px-2 py-0.5 rounded-full">
                                                            Now
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step Details - Desktop Only */}
                                {!isMobile && selectedStep !== null && (
                                    <div className={cn(
                                        "mt-4 p-4 md:p-5 rounded-xl border-2 transition-all duration-300 animate-slide-up",
                                        currentSteps[selectedStep].bgColor,
                                        currentSteps[selectedStep].borderColor
                                    )}>
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0",
                                                `bg-gradient-to-br ${currentSteps[selectedStep].color}`
                                            )}>
                                                {(() => {
                                                    const StepIcon = currentSteps[selectedStep].icon;
                                                    return <StepIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />;
                                                })()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className={cn("text-lg font-bold", currentSteps[selectedStep].textColor)}>
                                                        {currentSteps[selectedStep].emoji} {currentSteps[selectedStep].fullLabel}
                                                    </h4>
                                                    {selectedStep === currentStepIndex && (
                                                        <Badge className="bg-emerald-500 text-white text-xs">Current</Badge>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 mt-1 text-sm">{currentSteps[selectedStep].detailedInfo}</p>
                                                <p className={cn("text-xs mt-2 flex items-center gap-1", currentSteps[selectedStep].textColor)}>
                                                    <Timer className="w-3 h-3" />
                                                    Est: {currentSteps[selectedStep].estimatedTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Summary */}
                                <div className="mt-4 md:mt-6 flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", currentSteps[currentStepIndex]?.bgColor)}>
                                            {(() => {
                                                const StepIcon = currentSteps[currentStepIndex]?.icon || Package;
                                                return <StepIcon className={cn("w-5 h-5", currentSteps[currentStepIndex]?.textColor)} />;
                                            })()}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Status</p>
                                            <p className={cn("font-bold", currentSteps[currentStepIndex]?.textColor)}>
                                                {currentSteps[currentStepIndex]?.fullLabel}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowTimeline(!showTimeline)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm"
                                    >
                                        {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        Timeline
                                    </button>
                                </div>

                                {/* Timeline */}
                                {showTimeline && (
                                    <div className="mt-3 md:mt-4 space-y-4 animate-slide-up bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        {currentSteps.map((step, index) => {
                                            const isCompleted = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;
                                            const StepIcon = step.icon;

                                            return (
                                                <div key={step.id} className="relative pl-10">
                                                    {index !== currentSteps.length - 1 && (
                                                        <div className={cn(
                                                            "absolute left-[19px] top-10 bottom-0 w-0.5",
                                                            index < currentStepIndex ? "bg-emerald-500" : "bg-slate-200"
                                                        )} />
                                                    )}
                                                    <div className={cn(
                                                        "absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300",
                                                        isCompleted ? `bg-gradient-to-br ${step.color} text-white shadow-lg` : "bg-white border-2 border-slate-200 text-slate-300"
                                                    )}>
                                                        <StepIcon className={cn("w-5 h-5", isCurrent && "animate-pulse-soft")} />
                                                    </div>
                                                    <div className="py-1">
                                                        <div className="flex items-center gap-2">
                                                            <h5 className={cn("font-bold text-sm md:text-base", isCompleted ? "text-slate-800" : "text-slate-400")}>
                                                                {step.fullLabel}
                                                            </h5>
                                                            {isCurrent && (
                                                                <Badge className="bg-emerald-500 text-[10px] h-4 animate-pulse-soft text-white">LIVE</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Order Details - Stacked on Mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Order Info */}
                            <Card className="border border-slate-100 shadow-md bg-white overflow-hidden animate-slide-up">
                                <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                                <CardContent className="p-4 md:p-6">
                                    <h3 className="text-base md:text-lg font-bold text-slate-800 mb-3 md:mb-5 flex items-center gap-2">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                        Order Details
                                    </h3>
                                    <div className="space-y-2.5 md:space-y-4">
                                        <div className="flex justify-between items-center p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl">
                                            <span className="text-slate-500 text-sm flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" /> Order Date
                                            </span>
                                            <span className="font-semibold text-slate-800 text-sm">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 md:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg md:rounded-xl border border-emerald-100">
                                            <span className="text-slate-500 text-sm flex items-center gap-1.5">
                                                <CreditCard className="w-3.5 h-3.5" /> Total
                                            </span>
                                            <span className="font-bold text-xl md:text-2xl text-emerald-600">{formatAmount(order.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl">
                                            <span className="text-slate-500 text-sm">Payment</span>
                                            <Badge className={cn(
                                                "text-xs",
                                                order.paymentStatus === 'paid'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            )}>
                                                {order.paymentStatus?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl">
                                            <span className="text-slate-500 text-sm">Delivery</span>
                                            <span className="font-medium text-slate-800 text-sm flex items-center gap-1.5">
                                                {order.fulfillmentType === 'delivery' ? (
                                                    <><Truck className="w-3.5 h-3.5 text-emerald-600" /> Home Delivery</>
                                                ) : (
                                                    <><Home className="w-3.5 h-3.5 text-emerald-600" /> Store Pickup</>
                                                )}
                                            </span>
                                        </div>

                                        {/* Download Invoice Button */}
                                        {order.invoiceUrl ? (
                                            // Use saved invoice from server
                                            <Button
                                                variant="outline"
                                                className="w-full h-12 mt-2 border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl transition-all active:scale-95 touch-target"
                                                onClick={() => window.open(order.invoiceUrl, '_blank')}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Invoice
                                            </Button>
                                        ) : (
                                            // Fallback to generated invoice
                                            <Button
                                                variant="outline"
                                                className="w-full h-12 mt-2 border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition-all active:scale-95 touch-target"
                                                onClick={() => {
                                                    const invoiceUrl = `/api/public/invoice/${encodeURIComponent(order.orderNumber)}`;
                                                    window.open(invoiceUrl, '_blank');
                                                }}
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                View Invoice
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Items */}
                            <Card className="border border-slate-100 shadow-md bg-white overflow-hidden animate-slide-up">
                                <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                                <CardContent className="p-4 md:p-6">
                                    <h3 className="text-base md:text-lg font-bold text-slate-800 mb-3 md:mb-5 flex items-center gap-2">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                                            <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                        Items
                                        <Badge variant="outline" className="ml-auto text-xs">{order.items?.length || 0}</Badge>
                                    </h3>
                                    <div className="space-y-2 max-h-[200px] md:max-h-[300px] overflow-y-auto hide-scrollbar">
                                        {order.items?.length > 0 ? (
                                            order.items.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-sm flex-shrink-0">
                                                            <Shirt className="w-4 h-4 text-blue-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-800 text-sm truncate">{item.serviceName}</p>
                                                            <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold text-slate-700 text-sm flex-shrink-0">{formatAmount(item.price)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-slate-400">
                                                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No items</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Service Features - Horizontal scroll on mobile */}
                        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                            <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 min-w-max md:min-w-0 animate-slide-up">
                                {[
                                    { icon: Droplets, label: 'Premium Wash', color: 'from-blue-400 to-cyan-500' },
                                    { icon: Wind, label: 'Fresh & Clean', color: 'from-emerald-400 to-green-500' },
                                    { icon: Shield, label: 'Care Guarantee', color: 'from-purple-400 to-violet-500' },
                                    { icon: Truck, label: 'Free Delivery', color: 'from-amber-400 to-orange-500' },
                                ].map((feature) => (
                                    <Card key={feature.label} className="border border-slate-100 shadow-sm bg-white/90 w-28 md:w-auto flex-shrink-0">
                                        <CardContent className="p-3 md:p-4 text-center">
                                            <div className={cn(
                                                "w-10 h-10 md:w-12 md:h-12 mx-auto rounded-lg md:rounded-xl flex items-center justify-center shadow mb-2",
                                                `bg-gradient-to-br ${feature.color}`
                                            )}>
                                                <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                            </div>
                                            <h4 className="font-semibold text-slate-800 text-xs md:text-sm">{feature.label}</h4>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Initial State */}
                {!order && !error && !hasSearched && (
                    <div className="text-center py-10 md:py-16 animate-slide-up">
                        <div className="max-w-lg mx-auto px-4">
                            <div className="relative w-20 h-20 md:w-28 md:h-28 mx-auto mb-6 md:mb-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl md:rounded-3xl rotate-6 opacity-30" />
                                <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl">
                                    <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-white animate-float" />
                                </div>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Track Your Order</h3>
                            <p className="text-slate-500 text-sm md:text-lg mb-8">
                                Enter your order number above to see real-time status
                            </p>

                            <div className="grid grid-cols-3 gap-3 md:gap-6">
                                {[
                                    { icon: Zap, label: 'Fast Pickup', color: 'from-amber-400 to-orange-500' },
                                    { icon: Star, label: 'Expert Care', color: 'from-blue-400 to-indigo-500' },
                                    { icon: Truck, label: 'Quick Delivery', color: 'from-emerald-400 to-teal-500' },
                                ].map((feature) => (
                                    <div key={feature.label} className="p-3 md:p-6 bg-white rounded-xl md:rounded-2xl shadow">
                                        <div className={cn(
                                            'w-10 h-10 md:w-14 md:h-14 mx-auto rounded-lg md:rounded-xl flex items-center justify-center shadow mb-2 md:mb-4',
                                            `bg-gradient-to-br ${feature.color}`
                                        )}>
                                            <feature.icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-xs md:text-base">{feature.label}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Fixed Bottom CTA - Mobile Only */}
            {order && isMobile && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-40 safe-area-bottom">
                    <div className="flex gap-3 max-w-lg mx-auto">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 border-slate-200 text-slate-700 touch-target"
                            onClick={() => window.open('tel:+919363059595')}
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                        </Button>
                        <Button
                            className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white touch-target"
                            onClick={() => window.open('https://wa.me/919363059595')}
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                        </Button>
                    </div>
                </div>
            )}

            {/* Help Section - Desktop */}
            {order && !isMobile && (
                <div className="max-w-5xl mx-auto px-6 pb-10">
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-gradient text-white overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between flex-wrap gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-5 h-5" />
                                        <span className="text-emerald-100">Premium Support</span>
                                    </div>
                                    <h3 className="text-2xl font-bold">Need Help?</h3>
                                    <p className="text-emerald-100">We're here 24/7</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                                        onClick={() => window.open('tel:+919363059595')}
                                    >
                                        <Phone className="w-5 h-5 mr-2" />
                                        Call Now
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="bg-green-500 hover:bg-green-600 text-white shadow-lg"
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

            {/* Footer */}
            <footer className={cn(
                "bg-slate-900 text-white py-10 md:py-14",
                order && isMobile && "pb-28" // Extra padding for fixed bottom bar
            )}>
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 mb-8">
                        <div className="col-span-2 md:col-span-1">
                            <img src="/assets/logo.webp" alt="Fab Clean" className="h-8 md:h-10 mb-3 brightness-0 invert opacity-80" />
                            <p className="text-slate-400 text-sm">Premium laundry services committed to quality.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3 text-sm md:text-base">Legal</h4>
                            <ul className="space-y-2 text-xs md:text-sm text-slate-400">
                                <li><a href="/terms" className="hover:text-emerald-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" />Terms</a></li>
                                <li><a href="/privacy" className="hover:text-emerald-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" />Privacy</a></li>
                                <li><a href="/refund" className="hover:text-emerald-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" />Refunds</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3 text-sm md:text-base">Contact</h4>
                            <ul className="space-y-2 text-xs md:text-sm text-slate-400">
                                <li className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-emerald-400" /> +91 93630 59595</li>
                                <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-emerald-400" /> Pollachi, TN</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-6 text-center">
                        <p className="text-slate-500 text-xs md:text-sm">© {currentYear} Fab Clean. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
