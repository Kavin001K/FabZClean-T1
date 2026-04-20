import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'wouter';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  CircleOff,
  CreditCard,
  ExternalLink,
  Factory,
  FileText,
  Home,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Shirt,
  Store,
  Timer,
  Truck,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  invoiceUrl?: string | null;
  lastWhatsappStatus?: string;
  lastWhatsappSentAt?: string;
}

interface TrackingStep {
  id: string;
  shortLabel: string;
  title: string;
  detail: string;
  eta: string;
  icon: LucideIcon;
  tone: string;
  surface: string;
  border: string;
  text: string;
}

const SUPPORT_PHONE = '+919363059595';

const TRACKING_META: Record<string, TrackingStep> = {
  pending: {
    id: 'pending',
    shortLabel: 'Placed',
    title: 'Order Placed',
    detail: 'Your order has been received and queued for the care team.',
    eta: 'Verification in progress',
    icon: Package,
    tone: 'from-amber-400 via-orange-400 to-amber-500',
    surface: 'bg-amber-50/90',
    border: 'border-amber-200/80',
    text: 'text-amber-700',
  },
  processing: {
    id: 'processing',
    shortLabel: 'In Care',
    title: 'In Process',
    detail: 'Garments are being cleaned and quality checked.',
    eta: 'Usually 24 to 48 hours',
    icon: Factory,
    tone: 'from-[#0f766e] via-[#14b8a6] to-[#84cc16]',
    surface: 'bg-emerald-50/90',
    border: 'border-emerald-200/80',
    text: 'text-emerald-700',
  },
  ready_for_pickup: {
    id: 'ready_for_pickup',
    shortLabel: 'Ready',
    title: 'Ready for Pickup',
    detail: 'Your order is ready at the store and can be collected anytime during working hours.',
    eta: 'Ready now',
    icon: Store,
    tone: 'from-emerald-500 via-green-500 to-teal-500',
    surface: 'bg-emerald-50/90',
    border: 'border-emerald-200/80',
    text: 'text-emerald-700',
  },
  out_for_delivery: {
    id: 'out_for_delivery',
    shortLabel: 'On Route',
    title: 'Out for Delivery',
    detail: 'The delivery team is on the way with your order.',
    eta: 'Approaching delivery',
    icon: Truck,
    tone: 'from-[#f59e0b] via-[#f97316] to-[#fb7185]',
    surface: 'bg-orange-50/90',
    border: 'border-orange-200/80',
    text: 'text-orange-700',
  },
  completed: {
    id: 'completed',
    shortLabel: 'Done',
    title: 'Completed',
    detail: 'The order has been successfully handed over. Thank you for choosing Fab Clean.',
    eta: 'Finished',
    icon: CheckCircle2,
    tone: 'from-emerald-500 via-lime-500 to-green-500',
    surface: 'bg-green-50/90',
    border: 'border-green-200/80',
    text: 'text-green-700',
  },
  cancelled: {
    id: 'cancelled',
    shortLabel: 'Cancelled',
    title: 'Order Cancelled',
    detail: 'This order has been cancelled. Contact support if you need help.',
    eta: 'No further processing',
    icon: CircleOff,
    tone: 'from-rose-500 via-orange-500 to-amber-500',
    surface: 'bg-rose-50/90',
    border: 'border-rose-200/80',
    text: 'text-rose-700',
  },
};

const STATUS_ALIAS: Record<string, keyof typeof TRACKING_META> = {
  pending: 'pending',
  received: 'pending',
  orderplaced: 'pending',
  new: 'pending',
  processing: 'processing',
  inprocess: 'processing',
  inprogress: 'processing',
  cleaning: 'processing',
  ready: 'ready_for_pickup',
  readyforpickup: 'ready_for_pickup',
  readyforcollection: 'ready_for_pickup',
  outfordelivery: 'out_for_delivery',
  intransit: 'out_for_delivery',
  dispatched: 'out_for_delivery',
  shipping: 'out_for_delivery',
  completed: 'completed',
  delivered: 'completed',
  done: 'completed',
  finished: 'completed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
};

const normalizeStatusKey = (status?: string) =>
  STATUS_ALIAS[String(status || '').toLowerCase().replace(/[\s_-]/g, '')] || 'pending';

const getStepsForFulfillment = (fulfillmentType?: string, status?: string) => {
  if (normalizeStatusKey(status) === 'cancelled') {
    return [TRACKING_META.pending, TRACKING_META.processing, TRACKING_META.cancelled];
  }

  const isPickup = fulfillmentType === 'pickup' || fulfillmentType === 'store_pickup';
  return isPickup
    ? [
        TRACKING_META.pending,
        TRACKING_META.processing,
        TRACKING_META.ready_for_pickup,
        TRACKING_META.completed,
      ]
    : [
        TRACKING_META.pending,
        TRACKING_META.processing,
        TRACKING_META.out_for_delivery,
        TRACKING_META.completed,
      ];
};

const formatCurrency = (amount: string | number) => {
  const value = typeof amount === 'number' ? amount : Number(amount);
  return `₹${Number.isFinite(value) ? value.toLocaleString('en-IN') : '0'}`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Just now';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const toTitleCase = (value?: string) =>
  String(value || 'Pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getGreetingName = (value?: string) => {
  const first = String(value || 'Guest').trim().split(/\s+/)[0];
  return first || 'Guest';
};

const getPaymentBadgeClass = (status?: string) =>
  status === 'paid'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

const getStatusBadgeClass = (step: TrackingStep) =>
  cn(step.surface, step.border, step.text, 'border');

function useTrackingMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Track Your Order | Fab Clean';

    let themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const previousTheme = themeMeta?.content;
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = '#8ec63f';

    return () => {
      document.title = previousTitle;
      if (themeMeta) {
        if (previousTheme) {
          themeMeta.content = previousTheme;
        } else {
          themeMeta.remove();
        }
      }
    };
  }, []);
}

function useTrackingMotion() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'public-tracking-motion';
    style.textContent = `
      @keyframes tracking-enter {
        0% { opacity: 0; transform: translateY(16px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes tracking-sweep {
        0% { transform: scaleX(0); opacity: 0.5; }
        100% { transform: scaleX(1); opacity: 1; }
      }
      @keyframes tracking-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(142, 198, 63, 0.14); }
        60% { box-shadow: 0 0 0 14px rgba(142, 198, 63, 0); }
      }
      @keyframes tracking-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes tracking-cancel {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-1px); }
        50% { transform: translateY(1px); }
        75% { transform: translateY(-1px); }
      }
      .tracking-enter {
        animation: tracking-enter 420ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .tracking-sweep {
        transform-origin: left center;
        animation: tracking-sweep 720ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .tracking-pulse {
        animation: tracking-pulse 1.8s ease-out infinite;
      }
      .tracking-float {
        animation: tracking-float 4s ease-in-out infinite;
      }
      .tracking-cancel {
        animation: tracking-cancel 1.2s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .tracking-enter,
        .tracking-sweep,
        .tracking-pulse,
        .tracking-float,
        .tracking-cancel {
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);
}

function DesktopProgress({
  steps,
  currentStepIndex,
  selectedStep,
  onSelect,
  statusKey,
}: {
  steps: TrackingStep[];
  currentStepIndex: number;
  selectedStep: number;
  onSelect: (index: number) => void;
  statusKey: string;
}) {
  const progressPercent = steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="hidden md:block">
      <div className="relative px-3 py-8">
        <div
          className="absolute top-[2.9rem] h-[3px] rounded-full bg-slate-200"
          style={{ left: `${100 / (steps.length * 2)}%`, right: `${100 / (steps.length * 2)}%` }}
        >
          <div
            className="tracking-sweep h-full rounded-full bg-gradient-to-r from-[#8ec63f] via-[#14b8a6] to-[#f59e0b] transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCurrent = index === currentStepIndex;
            const isComplete = index < currentStepIndex;
            const isSelected = index === selectedStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  'group flex flex-col items-center gap-3 rounded-3xl px-3 py-2 text-center transition-all duration-300',
                  isSelected && 'bg-white shadow-sm ring-1 ring-slate-200'
                )}
              >
                <div className="relative">
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md transition-opacity duration-300" />
                  )}
                  <div
                    className={cn(
                      'relative flex h-14 w-14 items-center justify-center rounded-full border-4 transition-all duration-300',
                      isComplete || isCurrent
                        ? 'border-white bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                        : 'border-slate-200 bg-white text-slate-400',
                      isCurrent && statusKey === 'cancelled' && 'tracking-cancel',
                      isCurrent && statusKey !== 'cancelled' && 'tracking-pulse'
                    )}
                  >
                    {isComplete ? <CheckCheck className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className={cn('text-sm font-semibold', isComplete || isCurrent ? 'text-slate-900' : 'text-slate-400')}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500">{step.eta}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileProgress({
  steps,
  currentStepIndex,
  selectedStep,
  onSelect,
  statusKey,
}: {
  steps: TrackingStep[];
  currentStepIndex: number;
  selectedStep: number;
  onSelect: (index: number) => void;
  statusKey: string;
}) {
  return (
    <div className="space-y-3 md:hidden">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isCurrent = index === currentStepIndex;
        const isComplete = index < currentStepIndex;
        const isSelected = index === selectedStep;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              'relative flex w-full items-start gap-3 rounded-3xl border p-4 text-left transition-all duration-300',
              isSelected ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200/80 bg-white/80',
              isCurrent && 'ring-2 ring-emerald-200'
            )}
          >
            {index !== steps.length - 1 && (
              <div
                className={cn(
                  'absolute left-[1.72rem] top-14 h-[calc(100%-2.5rem)] w-px',
                  index < currentStepIndex ? 'bg-emerald-400' : 'bg-slate-200'
                )}
              />
            )}

            <div
              className={cn(
                'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300',
                isComplete || isCurrent
                  ? 'border-transparent bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'border-slate-200 bg-slate-50 text-slate-400',
                isCurrent && statusKey === 'cancelled' && 'tracking-cancel',
                isCurrent && statusKey !== 'cancelled' && 'tracking-pulse'
              )}
            >
              {isComplete ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={cn('text-sm font-semibold', isComplete || isCurrent ? 'text-slate-900' : 'text-slate-500')}>
                  {step.shortLabel}
                </h3>
                {isCurrent && <Badge className="rounded-full bg-emerald-100 px-2 py-0 text-[10px] text-emerald-700">Now</Badge>}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{isSelected || isCurrent ? step.eta : 'Tap for details'}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="tracking-enter space-y-4">
      <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.18)] backdrop-blur">
        <CardContent className="p-5 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="tracking-float flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8ec63f,#14b8a6,#f59e0b)] text-white shadow-lg shadow-lime-900/15">
                <Package className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-full bg-gradient-to-r from-[#8ec63f]/20 via-[#14b8a6]/20 to-[#f59e0b]/20" />
                <div className="h-5 w-36 rounded-full bg-slate-200/80" />
              </div>
            </div>
            <div className="h-8 w-56 rounded-2xl bg-slate-200/80" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="h-3 w-16 rounded-full bg-slate-200" />
                  <div className="mt-3 h-5 w-24 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.18)] backdrop-blur">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="h-6 w-40 rounded-full bg-slate-200" />
            </div>
            <RefreshCw className="h-5 w-5 animate-spin text-[#14b8a6]" />
          </div>

          <div className="relative px-2 py-6">
            <div className="absolute left-[12.5%] right-[12.5%] top-[2.4rem] h-[3px] rounded-full bg-slate-200">
              <div className="tracking-sweep h-full w-1/2 rounded-full bg-gradient-to-r from-[#8ec63f] via-[#14b8a6] to-[#f59e0b]" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-3">
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full border-4',
                      index < 2 ? 'tracking-pulse border-white bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-300'
                    )}
                  >
                    {index < 2 ? <CheckCheck className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                  </div>
                  <div className="h-3 w-16 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PublicOrderTracking() {
  useTrackingMeta();
  useTrackingMotion();

  const params = useParams<{ orderNumber?: string }>();
  const orderSnapshotRef = useRef<{ orderNumber?: string; status?: string; updatedAt?: string } | null>(null);
  const [orderNumber, setOrderNumber] = useState(params.orderNumber || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [selectedStep, setSelectedStep] = useState(0);
  const [viewEpoch, setViewEpoch] = useState(0);
  const [statusPopupOpen, setStatusPopupOpen] = useState(false);

  const steps = useMemo(() => getStepsForFulfillment(order?.fulfillmentType, order?.status), [order?.fulfillmentType, order?.status]);
  const statusKey = useMemo(() => normalizeStatusKey(order?.status), [order?.status]);
  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const currentId = statusKey;
    const exactIndex = steps.findIndex((step) => step.id === currentId);
    if (exactIndex >= 0) return exactIndex;
    if (currentId === 'ready_for_pickup' && steps.some((step) => step.id === 'out_for_delivery')) return 1;
    if (currentId === 'out_for_delivery' && steps.some((step) => step.id === 'ready_for_pickup')) return 2;
    return 0;
  }, [order, statusKey, steps]);
  const activeStepIndex = order ? Math.min(selectedStep, steps.length - 1) : 0;
  const activeStep = steps[activeStepIndex] || steps[0];

  useEffect(() => {
    if (!order) return;
    setSelectedStep(currentStepIndex);
  }, [order, currentStepIndex]);

  const handleSearch = useCallback(
    async (
      searchNumber?: string,
      options?: {
        showQuickStatus?: boolean;
        silent?: boolean;
      }
    ) => {
      if (honeypot) {
        setLoading(true);
        window.setTimeout(() => {
          setLoading(false);
          setError('Order not found');
        }, 1200);
        return;
      }

      const nextNumber = String(searchNumber || orderNumber).trim();
      if (!nextNumber) return;

      if (!options?.silent) {
        setLoading(true);
        setError(null);
        setHasSearched(true);
      }

      try {
        const response = await fetch(`/api/public/track/${encodeURIComponent(nextNumber)}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        const result = await response.json();

        if (!response.ok || result?.error) {
          throw new Error(result?.message || 'Order not found');
        }

        const nextOrder = result.data as Order;
        const previousSnapshot = orderSnapshotRef.current;
        const nextSnapshot = {
          orderNumber: nextOrder?.orderNumber,
          status: nextOrder?.status,
          updatedAt: nextOrder?.updatedAt,
        };
        const hasMeaningfulChange =
          !previousSnapshot ||
          previousSnapshot.orderNumber !== nextSnapshot.orderNumber ||
          previousSnapshot.status !== nextSnapshot.status ||
          previousSnapshot.updatedAt !== nextSnapshot.updatedAt;

        orderSnapshotRef.current = nextSnapshot;

        setOrder(nextOrder);
        setOrderNumber(nextOrder.orderNumber || nextNumber);

        if (hasMeaningfulChange || !options?.silent) {
          setViewEpoch((value) => value + 1);
        }

        if (options?.showQuickStatus) {
          setStatusPopupOpen(true);
        }

        if (result.data?.orderNumber) {
          window.history.replaceState(null, '', `/trackorder/${encodeURIComponent(result.data.orderNumber)}`);
        }
      } catch (fetchError: any) {
        if (!options?.silent) {
          setOrder(null);
          setError(fetchError?.message || 'Unable to fetch order details');
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [honeypot, orderNumber]
  );

  useEffect(() => {
    if (!order?.orderNumber) return;

    const refreshFromRealtimeTrigger = () => {
      if (document.visibilityState === 'visible') {
        void handleSearch(order.orderNumber, { silent: true });
      }
    };

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void handleSearch(order.orderNumber, { silent: true });
      }
    }, 20000);

    window.addEventListener('focus', refreshFromRealtimeTrigger);
    document.addEventListener('visibilitychange', refreshFromRealtimeTrigger);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshFromRealtimeTrigger);
      document.removeEventListener('visibilitychange', refreshFromRealtimeTrigger);
    };
  }, [handleSearch, order?.orderNumber]);

  useEffect(() => {
    if (!params.orderNumber) return;
    setOrderNumber(params.orderNumber);
    void handleSearch(params.orderNumber, { showQuickStatus: true });
  }, [params.orderNumber]);

  const handleRefresh = useCallback(async () => {
    if (!order?.orderNumber) return;
    setRefreshing(true);
    await handleSearch(order.orderNumber, { silent: true });
    window.setTimeout(() => setRefreshing(false), 350);
  }, [handleSearch, order?.orderNumber]);

  const invoiceUrl = order?.invoiceUrl
    ? order.invoiceUrl
    : order?.orderNumber
      ? `/api/public/invoice/${encodeURIComponent(order.orderNumber)}`
      : null;

  const statusBadge = order ? steps[currentStepIndex] || steps[0] : TRACKING_META.pending;
  const fulfillmentLabel = order?.fulfillmentType === 'delivery' ? 'Home delivery' : 'Store pickup';
  const paymentLabel = order?.paymentStatus === 'paid' ? 'Paid' : 'Pending payment';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(142,198,63,0.14),_transparent_28%),radial-gradient(circle_at_right,_rgba(245,158,11,0.10),_transparent_24%),linear-gradient(180deg,_#fbfdf8_0%,_#f4f8f4_38%,_#f9fbf8_100%)] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-12rem] top-24 h-80 w-80 rounded-full bg-lime-200/25 blur-3xl" />
        <div className="absolute right-[-10rem] top-20 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/trackorder" className="transition-opacity hover:opacity-80">
            <img src="/assets/logo.webp" alt="Fab Clean" className="h-10 sm:h-12" />
          </a>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 sm:flex">
            <Bell className="h-3.5 w-3.5 text-emerald-500" />
            Live order updates
          </div>
        </div>
      </header>

      <main className="relative">
        <Dialog open={statusPopupOpen && !!order} onOpenChange={setStatusPopupOpen}>
          <DialogContent className="max-w-[30rem] border-0 bg-transparent p-0 shadow-none">
            {order && (
              <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-[radial-gradient(circle_at_top,_rgba(142,198,63,0.24),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] shadow-[0_30px_90px_-28px_rgba(15,23,42,0.42)] backdrop-blur-xl">
                <div className={cn('h-1.5 w-full bg-gradient-to-r', statusBadge.tone)} />
                <div className="space-y-5 p-5 sm:p-6">
                  <DialogHeader className="space-y-3 text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <Badge className="w-fit rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-white">
                          {order.orderNumber}
                        </Badge>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                              statusBadge.tone,
                              statusKey === 'cancelled' ? 'tracking-cancel' : 'tracking-float'
                            )}
                          >
                            <statusBadge.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-950">
                              {statusBadge.title}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-sm leading-6 text-slate-600">
                              {statusBadge.detail}
                            </DialogDescription>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={cn('rounded-[1.5rem] border p-4 shadow-sm', statusBadge.surface, statusBadge.border)}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Current stage</p>
                      <p className="mt-2 text-lg font-bold text-slate-950">{statusBadge.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{statusBadge.eta}</p>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Customer</p>
                      <p className="mt-2 text-lg font-bold text-slate-950">{getGreetingName(order.customerName)}</p>
                      <p className="mt-1 text-sm text-slate-600">Updated {formatDateTime(order.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Payment</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{paymentLabel}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Fulfillment</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{fulfillmentLabel}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Ready date</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(order.pickupDate)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      onClick={() => setStatusPopupOpen(false)}
                      className="h-12 flex-1 rounded-2xl bg-[linear-gradient(135deg,#8ec63f,#14b8a6,#f59e0b)] text-base font-semibold text-white shadow-lg shadow-lime-900/15"
                    >
                      View full tracking
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleRefresh()}
                      className="h-12 rounded-2xl border-slate-200 bg-white/90 px-4 text-slate-700 hover:bg-slate-50"
                    >
                      <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <section className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div className="space-y-5">
              <Badge className="inline-flex rounded-full border border-lime-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lime-700 shadow-sm">
                Fab clean tracking
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Clear order status, built for glanceable mobile use.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg">
                  Open the link, enter the order number, and see the latest stage instantly.
                </p>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl">
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-2 shadow-inner">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input
                      value={orderNumber}
                      onChange={(event) => !order && setOrderNumber(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && !order && void handleSearch(undefined, { showQuickStatus: true })}
                      placeholder="Order number (FZC-2026...)"
                      disabled={!!order}
                      className={cn(
                        "h-12 border-0 bg-transparent px-0 text-base font-medium shadow-none focus-visible:ring-0",
                        order ? "text-slate-400 cursor-not-allowed select-none opacity-100" : "text-slate-800"
                      )}
                    />
                    <input
                      type="text"
                      name="website_url"
                      value={honeypot}
                      onChange={(event) => setHoneypot(event.target.value)}
                      autoComplete="off"
                      tabIndex={-1}
                      className="hidden"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => void handleSearch(undefined, { showQuickStatus: true })}
                    disabled={loading || !orderNumber.trim()}
                    className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#8ec63f,#14b8a6,#f59e0b)] text-base font-semibold text-white shadow-lg shadow-lime-900/15 transition-transform duration-200 hover:translate-y-[-1px] active:translate-y-0"
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Track order
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">Live progress</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">Easy mobile view</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          {loading && !order && <LoadingState />}

          {error && (
            <Card className="mb-6 rounded-[2rem] border border-rose-200 bg-rose-50/80 shadow-sm backdrop-blur">
              <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-rose-700">Order not found</p>
                  <p className="text-sm text-rose-600">Check the order number and try again.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
                  onClick={() => {
                    setError(null);
                    setHasSearched(false);
                  }}
                >
                  Clear
                </Button>
              </CardContent>
            </Card>
          )}

          {order ? (
            <div key={`${order.orderNumber}-${viewEpoch}`} className="tracking-enter space-y-6">
              <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.28)] backdrop-blur">
                <CardContent className="p-5 sm:p-7">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white">
                          {order.orderNumber}
                        </Badge>
                        <Badge className={cn('rounded-full px-3 py-1 text-xs font-semibold', getStatusBadgeClass(statusBadge))}>
                          {statusBadge.title}
                        </Badge>
                        <Badge className={cn('rounded-full px-3 py-1 text-xs font-semibold border', getPaymentBadgeClass(order.paymentStatus))}>
                          {order.paymentStatus === 'paid' ? 'Paid' : 'Pending payment'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                          Hello, {getGreetingName(order.customerName)}.
                        </h2>
                        <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Current stage: <span className="font-semibold text-slate-900">{statusBadge.title}</span></p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Last update</p>
                        <p className="mt-2 text-base font-semibold text-slate-900">{formatDateTime(order.updatedAt)}</p>
                        <p className="mt-1 text-sm text-slate-500">{statusBadge.eta}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleRefresh()}
                        className="rounded-3xl border border-lime-200 bg-lime-50/80 p-4 text-left transition-transform duration-200 hover:translate-y-[-1px]"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime-700">Refresh</p>
                            <p className="mt-2 text-base font-semibold text-slate-900">Check live status</p>
                          </div>
                          <RefreshCw className={cn('h-5 w-5 text-lime-700', refreshing && 'animate-spin')} />
                        </div>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
                <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.24)] backdrop-blur">
                  <CardContent className="p-5 sm:p-7">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Progress</p>
                        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Order journey</h3>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                        <Bell className="h-3.5 w-3.5 text-emerald-500" />
                        WhatsApp updates enabled
                      </div>
                    </div>

                    <DesktopProgress
                      steps={steps}
                      currentStepIndex={currentStepIndex}
                      selectedStep={activeStepIndex}
                      onSelect={setSelectedStep}
                      statusKey={statusKey}
                    />

                    <MobileProgress
                      steps={steps}
                      currentStepIndex={currentStepIndex}
                      selectedStep={activeStepIndex}
                      onSelect={setSelectedStep}
                      statusKey={statusKey}
                    />

                    <div className={cn('mt-6 rounded-[1.75rem] border p-5', activeStep.surface, activeStep.border)}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                              activeStep.tone,
                              statusKey === 'cancelled' && 'tracking-cancel'
                            )}
                          >
                            <activeStep.icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Selected step</p>
                            <h4 className="text-xl font-bold text-slate-950">{activeStep.title}</h4>
                            <p className="max-w-xl text-sm leading-6 text-slate-600">{activeStep.detail}</p>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Expected</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{activeStep.eta}</p>
                        </div>
                      </div>
                    </div>

                    {statusKey === 'cancelled' && (
                      <div className="tracking-enter mt-4 overflow-hidden rounded-[1.75rem] border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,247,237,0.96))] p-5 shadow-[0_18px_42px_-28px_rgba(244,63,94,0.35)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="tracking-cancel flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ef4444,#f97316,#f59e0b)] text-white shadow-lg shadow-rose-500/20">
                              <CircleOff className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">Cancellation notice</p>
                              <h4 className="mt-2 text-xl font-bold text-slate-950">This order is closed</h4>
                              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                                No more processing steps will run for this order. Support options remain available below if the customer needs help.
                              </p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Status</p>
                            <p className="mt-1 text-sm font-semibold text-rose-600">Cancelled</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.24)] backdrop-blur">
                    <CardContent className="space-y-4 p-5 sm:p-6">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Overview</p>
                        <h3 className="mt-2 text-xl font-bold text-slate-950">Order details</h3>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                                <CalendarDays className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500">Order date</p>
                                <p className="text-sm font-semibold text-slate-900">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                                <CreditCard className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-emerald-700/70">Order total</p>
                                <p className="text-lg font-bold text-emerald-800">{formatCurrency(order.totalAmount)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                                {order.fulfillmentType === 'delivery' ? <Truck className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500">Fulfillment</p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {fulfillmentLabel}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {order.pickupDate && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                                <Timer className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500">Expected ready date</p>
                                <p className="text-sm font-semibold text-slate-900">{formatDate(order.pickupDate)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {order.lastWhatsappStatus && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                                <MessageCircle className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500">Notification status</p>
                                <p className="text-sm font-semibold text-slate-900">{order.lastWhatsappStatus}</p>
                                {order.lastWhatsappSentAt && (
                                  <p className="mt-1 text-xs text-slate-500">Updated {formatDateTime(order.lastWhatsappSentAt)}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.24)] backdrop-blur">
                    <CardContent className="space-y-4 p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Documents</p>
                          <h3 className="mt-2 text-xl font-bold text-slate-950">Invoice & support</h3>
                        </div>
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      </div>

                      <div className="grid gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 justify-between rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-700 hover:bg-slate-100"
                          onClick={() => {
                            if (invoiceUrl) window.open(invoiceUrl, '_blank');
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {order.invoiceUrl ? 'Download invoice' : 'Open invoice'}
                          </span>
                          <ExternalLink className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 justify-between rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-700 hover:bg-slate-100"
                          onClick={() => window.open(`tel:${SUPPORT_PHONE}`)}
                        >
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Call support
                          </span>
                          <ExternalLink className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          className="h-12 justify-between rounded-2xl bg-[#25D366] px-4 text-white hover:bg-[#1fad57]"
                          onClick={() => window.open(`https://wa.me/${SUPPORT_PHONE.replace(/[^\d]/g, '')}`)}
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp support
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.24)] backdrop-blur">
                <CardContent className="p-5 sm:p-7">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Items</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-950">Garments in this order</h3>
                    </div>
                    <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {order.items?.length || 0} line items
                    </Badge>
                  </div>

                  <div className="grid gap-3">
                    {order.items?.length ? (
                      order.items.map((item, index) => (
                        <div
                          key={`${item.serviceName}-${index}`}
                          className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 transition-colors duration-200 hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                              <Shirt className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{item.serviceName}</p>
                              <p className="mt-1 text-xs text-slate-500">Quantity {item.quantity}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                            {formatCurrency(item.price)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
                        No item lines available for this order.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          ) : (
            !error && !loading && (
              <Card className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_18px_56px_-28px_rgba(15,23,42,0.2)] backdrop-blur">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-slate-900 text-white shadow-xl shadow-slate-900/15">
                      <Package className="h-8 w-8" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                        Start with your order number.
                      </h2>
                      <p className="mx-auto max-w-xl text-base leading-7 text-slate-600">
                        Open the link, paste the order number, and view your latest laundry progress instantly.
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      {[
                        { label: 'Status', value: 'Live progress' },
                        { label: 'Bill', value: 'Invoice link' },
                        { label: 'Help', value: 'Call or WhatsApp' },
                      ].map((item) => (
                        <div key={item.label} className="w-40 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </section>
      </main>
    </div>
  );
}
