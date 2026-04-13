import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  PlusCircle,
  Printer,
  Navigation,
  Package,
  Store,
  CreditCard,
  Wallet,
  Phone,
  MapPin,
  Calendar,
  User,
  IndianRupee,
  Send,
  Loader2
} from "lucide-react";
import { formatCurrency, formatDate, getNextStatus } from "@/lib/data-service";
import type { Order } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useInvoicePrint } from "@/hooks/use-invoice-print";
import { getOrderStoreLabel, resolveOrderStoreCodeFromOrder } from "@/lib/order-store";
import { MAX_WHATSAPP_SENDS } from "@/lib/whatsapp-service";

export interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onCancel: (order: Order) => void;
  onNextStep: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
  onUpdatePaymentStatus?: (order: Order, status: 'paid' | 'credit') => void;
  /** Callback to resend WhatsApp bill — caller handles the mutation */
  onResendBill?: (order: Order) => void;
  /** Whether a bill resend is currently in progress */
  isResendingBill?: boolean;
}

// Format status for display
const formatStatusDisplay = (status: string) => {
  const statusLabels: Record<string, string> = {
    'pending': 'Pending',
    'in_transit': 'In Transit',
    'processing': 'Processing',
    'ready_for_transit': 'Ready to Ship',
    'ready_for_pickup': 'Ready for Pickup',
    'ready_for_delivery': 'Ready for Delivery',
    'out_for_delivery': 'Out for Delivery',
    'completed': 'Completed',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'in_store': 'At Store',
    'assigned': 'Assigned',
    'shipped': 'Shipped'
  };
  return statusLabels[status] || status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    case 'delivered': return <CheckCircle className="h-4 w-4" />;
    case 'processing': return <Clock className="h-4 w-4" />;
    case 'pending': return <AlertCircle className="h-4 w-4" />;
    case 'cancelled': return <XCircle className="h-4 w-4" />;
    case 'in_transit': return <Navigation className="h-4 w-4" />;
    case 'ready_for_transit': return <Package className="h-4 w-4" />;
    case 'ready_for_pickup': return <CheckCircle className="h-4 w-4" />;
    case 'out_for_delivery': return <Navigation className="h-4 w-4" />;
    case 'in_store': return <Store className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    case 'in_transit': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    case 'ready_for_transit': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
    case 'ready_for_pickup': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    case 'ready_for_delivery': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    case 'out_for_delivery': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
    case 'in_store': return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'bg-red-100 text-red-800 border-red-200';
    case 'Normal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export default React.memo(function OrderDetailsDialog({
  order,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  onNextStep,
  onPrintInvoice,
  onUpdatePaymentStatus,
  onResendBill,
  isResendingBill,
}: OrderDetailsDialogProps) {
  const { printInvoice } = useInvoicePrint({
    onSuccess: (invoiceData) => {
      // Call the original onPrintInvoice callback if provided
      if (order) onPrintInvoice(order);
    },
    onError: (error) => {
      console.error('Invoice print failed:', error);
    }
  });

  const handlePrintInvoice = async () => {
    if (order) {
      printInvoice(order);
      // Log the print action
      try {
        await import("@/lib/data-service").then(({ ordersApi }) =>
          ordersApi.logPrintAction(order.id, 'invoice')
        );
      } catch (err) {
        console.error('Failed to log print action:', err);
      }
    }
  };

  if (!order) return null;

  const anyOrder = order as any; // Helper casting for dynamic fields
  const nextStatus = getNextStatus(order.status, anyOrder.fulfillmentType);
  const parseMoney = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const totalAmount = parseMoney(order.totalAmount);
  const advancePaid = parseMoney(anyOrder.advancePaid);
  const walletUsed = parseMoney(anyOrder.walletUsed);
  const creditUsed = parseMoney(anyOrder.creditUsed);
  const calculatedDue = Math.max(0, totalAmount - advancePaid - walletUsed);
  const outstandingAmount = Math.max(creditUsed, calculatedDue);
  const canMarkPaid = anyOrder.paymentStatus !== 'paid' && outstandingAmount > 0;
  const storeLabel = getOrderStoreLabel(resolveOrderStoreCodeFromOrder(anyOrder));
  const resolvedCustomerPhone = order.customerPhone || anyOrder.customerPhone || anyOrder.customers?.phone || "";

  // Parse Address Helper
  const formatAddress = (addr: any) => {
    let addressObj = addr;
    if (typeof addr === 'string') {
      try {
        addressObj = JSON.parse(addr);
      } catch {
        return addr;
      }
    }
    if (typeof addressObj === 'object' && addressObj !== null) {
      const parts = [];
      if (addressObj.street || addressObj.address) parts.push(addressObj.street || addressObj.address);
      if (addressObj.landmark) parts.push(addressObj.landmark);
      if (addressObj.city) parts.push(addressObj.city);
      if (addressObj.state) parts.push(addressObj.state);
      if (addressObj.zip || addressObj.pincode) parts.push(`- ${addressObj.zip || addressObj.pincode}`);
      return parts.join(', ').replace(', -', ' -') || 'Address not available';
    }
    return String(addr || '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-6 pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Order <span className="text-primary">#{order.orderNumber || order.id.substring(0, 8).toUpperCase()}</span>
              </DialogTitle>
              <Badge className={cn("px-4 py-1.5 text-xs font-black uppercase tracking-widest border-2 shadow-sm rounded-full", getStatusColor(order.status))}>
                <span className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <span>{formatStatusDisplay(order.status)}</span>
                </span>
              </Badge>
            </div>
            <DialogDescription className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booked on {formatDate(order.createdAt?.toString() || new Date().toISOString())}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Column */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Profile</p>
                    <p className="font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-tight">
                      {order.customerName || anyOrder.customers?.name || "Guest Customer"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {(anyOrder.customers?.phone || anyOrder.phone || anyOrder.customerPhone || order.customerPhone) && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-300">
                        {anyOrder.customers?.phone || anyOrder.phone || anyOrder.customerPhone || order.customerPhone}
                      </span>
                    </div>
                  )}
                  
                  {(order.customerId || anyOrder.customers?.id) && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID:</span>
                      <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {order.customerId || anyOrder.customers?.id}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Priority</p>
                <Badge className={getPriorityColor(anyOrder.priority || 'Normal')}>
                  {anyOrder.priority || 'Normal'}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Store</p>
                <Badge variant="outline" className="font-bold border-slate-300 bg-slate-900 text-white">
                  {storeLabel}
                </Badge>
              </div>
            </div>

            {/* Dates & Quick Stats Column */}
              <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expected Delivery</p>
                      <p className="font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-tight">
                        {anyOrder.pickupDate ? formatDate(anyOrder.pickupDate) : 'Not Scheduled'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {anyOrder.pickupDate && (
                      <Badge className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-2",
                        new Date(anyOrder.pickupDate) < new Date() && !['completed', 'delivered', 'cancelled'].includes(order.status)
                          ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        {new Date(anyOrder.pickupDate) < new Date() && !['completed', 'delivered', 'cancelled'].includes(order.status)
                          ? "Overdue Alert"
                          : "On Schedule"}
                      </Badge>
                    )}
                    <Badge variant="outline" className="font-black border-slate-900 bg-slate-900 text-white dark:bg-slate-800 dark:border-slate-700 text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
                      {storeLabel}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</span>
                  <Badge className={cn("font-black tracking-widest uppercase text-[10px] px-3 py-1", getPriorityColor(anyOrder.priority || 'Normal'))}>
                    {anyOrder.priority || 'Normal'}
                  </Badge>
                </div>
              </div>
            </div>

          {/* Items Section */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Order Items</p>
            <div className="rounded-lg border bg-card">
              {anyOrder.items && Array.isArray(anyOrder.items) && anyOrder.items.length > 0 ? (
                <div className="divide-y">
                  {anyOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/50 transition-colors">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name || item.serviceName || "Service Item"}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(item.price || item.unitPrice || 0)}</div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-muted-foreground">x {item.quantity}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Summary Row inside table */}
                  <div className="p-3 bg-muted/20 flex justify-between items-center font-medium">
                    <span>Subtotal</span>
                    <span>{formatCurrency(parseFloat(order.totalAmount || "0"))}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>{anyOrder.service || "Dry Cleaning"}</p>
                  <p className="text-xs">Approx quantity: {anyOrder.quantity || 1}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Charges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-muted/40 border shadow-sm space-y-4 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                <p className="font-bold text-base uppercase tracking-wider text-slate-800 dark:text-slate-200">Payment Details</p>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-500 uppercase tracking-widest text-[10px]">Status</span>
                <Badge variant={anyOrder.paymentStatus === 'paid' ? 'default' : anyOrder.paymentStatus === 'credit' ? 'secondary' : 'destructive'}
                  className={cn("px-2.5 py-0.5 text-xs font-black uppercase tracking-wider", anyOrder.paymentStatus === 'credit' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : '')}>
                  {anyOrder.paymentStatus ? anyOrder.paymentStatus.toUpperCase() : 'PENDING'}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-500 uppercase tracking-widest text-[10px]">Method</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{anyOrder.paymentMethod || 'Cash'}</span>
              </div>

              {anyOrder.walletUsed && parseFloat(anyOrder.walletUsed) > 0 && (
                <div className="flex justify-between text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-slate-500 uppercase tracking-widest text-[10px]">Wallet Used</span>
                  <span className="text-emerald-600 font-bold">-{formatCurrency(anyOrder.walletUsed)}</span>
                </div>
              )}

              {anyOrder.advancePaid && parseFloat(anyOrder.advancePaid) > 0 && (
                <div className="flex justify-between text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-slate-500 uppercase tracking-widest text-[10px]">Advance/Cash Paid</span>
                  <span className="text-emerald-700 font-bold">{formatCurrency(anyOrder.advancePaid)}</span>
                </div>
              )}

              {anyOrder.creditUsed && parseFloat(anyOrder.creditUsed) > 0 && (
                <div className="flex justify-between text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-slate-500 uppercase tracking-widest text-[10px]">Credit Assigned</span>
                  <span className="text-red-600 font-bold">{formatCurrency(anyOrder.creditUsed)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xl font-black pt-4 border-t-2 border-slate-200 dark:border-slate-800 mt-auto">
                <span className="uppercase tracking-widest text-[12px] text-slate-500">Total Amount</span>
                <span className="text-primary">{formatCurrency(parseFloat(order.totalAmount || "0"))}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 space-y-3 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-sm">Fulfillment</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium flex items-center gap-1">
                  {anyOrder.fulfillmentType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                </span>
              </div>

              {anyOrder.fulfillmentType === 'delivery' && (
                <div className="text-sm pt-2 border-t mt-2">
                  <p className="text-muted-foreground text-xs mb-1">Delivery Address</p>
                  <p className="leading-snug">{formatAddress(anyOrder.deliveryAddress)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {anyOrder.notes && (
            <div className="relative overflow-hidden bg-amber-50 dark:bg-amber-950/20 p-5 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <AlertCircle className="h-12 w-12" />
              </div>
              <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2">Special Instructions</p>
              <p className="text-base font-bold text-amber-900 dark:text-amber-200 leading-relaxed italic">"{anyOrder.notes}"</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky bottom-0">
          <div className="flex flex-col gap-4">
            {/* Row 1: Primary Action & Print */}
            <div className="flex gap-3 w-full">
              {nextStatus && (
                <Button
                  className="flex-1 h-14 text-sm font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] border-b-4 border-primary/70"
                  onClick={() => onNextStep(order)}
                  disabled={
                    (nextStatus === 'completed' || nextStatus === 'delivered') &&
                    anyOrder.paymentStatus !== 'paid' && anyOrder.paymentStatus !== 'credit'
                  }
                >
                  <PlusCircle className="h-5 w-5 mr-3" />
                  {order.status === 'ready_for_pickup' && anyOrder.fulfillmentType === 'delivery'
                    ? 'Start Delivery'
                    : order.status === 'ready_for_pickup'
                      ? 'Hand Over'
                      : order.status === 'out_for_delivery'
                        ? 'Mark Delivered'
                        : `Move to ${formatStatusDisplay(nextStatus)}`
                  }
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="icon"
                className="h-14 w-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-950 flex-shrink-0 hover:bg-slate-50 transition-all hover:border-primary/30"
                onClick={handlePrintInvoice}
                title="Print Invoice"
              >
                <Printer className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </Button>
            </div>

            {/* Row 2: Secondary Support Actions - Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Button 
                variant="secondary" 
                className="h-11 font-bold uppercase tracking-widest text-[10px] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => onEdit(order)}
              >
                <Edit className="h-3.5 w-3.5 mr-2" /> Edit Order
              </Button>

              {onResendBill && (() => {
                const sendCount = Number((order as any).whatsappMessageCount || 0);
                const hasPhone = Boolean(resolvedCustomerPhone);
                const limitReached = sendCount >= MAX_WHATSAPP_SENDS;
                const canResend = hasPhone && !limitReached;
                return (
                  <Button
                    variant="outline"
                    onClick={() => onResendBill(order)}
                    disabled={!canResend || isResendingBill}
                    className={cn(
                      "h-11 font-bold uppercase tracking-widest text-[10px] rounded-xl border border-slate-200 shadow-sm transition-all",
                      canResend
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                        : "opacity-50"
                    )}
                  >
                    {isResendingBill ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-2" />
                    )}
                    WhatsApp Bill ({sendCount}/{MAX_WHATSAPP_SENDS})
                  </Button>
                );
              })()}

              <Button
                variant="outline"
                className="h-11 font-bold uppercase tracking-widest text-[10px] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                onClick={() => window.open(`https://erp.myfabclean.com/trackorder/${order.orderNumber || order.id}`, '_blank')}
              >
                <Navigation className="h-3.5 w-3.5 mr-2" /> Track Order
              </Button>

              {canMarkPaid && onUpdatePaymentStatus && (
                <Button
                  variant="outline"
                  onClick={() => onUpdatePaymentStatus(order, 'paid')}
                  className="col-span-1 sm:col-span-2 h-11 font-black uppercase tracking-widest text-[10px] rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-sm"
                >
                  <CreditCard className="h-3.5 w-3.5 mr-2 text-blue-800" />
                  Mark Paid (₹{outstandingAmount.toFixed(2)})
                </Button>
              )}

              {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'delivered' && (
                <Button 
                  variant="outline" 
                  onClick={() => onCancel(order)} 
                  className={cn(
                    "h-11 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm",
                    !canMarkPaid && "col-span-2 sm:col-span-1"
                  )}
                >
                  <XCircle className="h-3.5 w-3.5 mr-2 text-rose-500" /> Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
