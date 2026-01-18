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
  DollarSign
} from "lucide-react";
import { formatCurrency, formatDate, getNextStatus } from "@/lib/data-service";
import type { Order } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useInvoicePrint } from "@/hooks/use-invoice-print";

export interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onCancel: (order: Order) => void;
  onNextStep: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
  onUpdatePaymentStatus: (order: Order, status: 'paid' | 'credit') => void;
}

// Format status for display
const formatStatusDisplay = (status: string) => {
  const statusLabels: Record<string, string> = {
    'pending': 'Pending',
    'in_transit': 'In Transit',
    'processing': 'Processing',
    'ready_for_transit': 'Ready to Ship',
    'ready_for_pickup': 'Ready for Pickup',
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
  onUpdatePaymentStatus
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

  const nextStatus = getNextStatus(order.status);
  const anyOrder = order as any; // Helper casting for dynamic fields

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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order Details: {order.id.substring(0, 8).toUpperCase()}
            <Badge className={cn("border ml-2", getStatusColor(order.status))}>
              <span className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                <span>{formatStatusDisplay(order.status)}</span>
              </span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Created on {formatDate(order.createdAt?.toString() || new Date().toISOString())}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="font-semibold text-lg">{order.customerName || anyOrder.customers?.name || "Guest Customer"}</p>
                  {(anyOrder.customers?.phone || anyOrder.phone) && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {anyOrder.customers?.phone || anyOrder.phone}
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
            </div>

            {/* Dates Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">
                      {anyOrder.pickupDate ? formatDate(anyOrder.pickupDate) : 'Not Scheduled'}
                    </p>
                  </div>
                  {anyOrder.pickupDate && (
                    <Badge variant="outline" className={cn(
                      "text-xs mt-1",
                      new Date(anyOrder.pickupDate) < new Date() && !['completed', 'delivered', 'cancelled'].includes(order.status)
                        ? "bg-red-100 text-red-800 border-red-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    )}>
                      {new Date(anyOrder.pickupDate) < new Date() && !['completed', 'delivered', 'cancelled'].includes(order.status)
                        ? "Overdue"
                        : "Scheduled"}
                    </Badge>
                  )}
                </div>
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
            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-sm">Payment Details</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={anyOrder.paymentStatus === 'paid' ? 'default' : anyOrder.paymentStatus === 'credit' ? 'secondary' : 'destructive'}
                  className={anyOrder.paymentStatus === 'credit' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : ''}>
                  {anyOrder.paymentStatus ? anyOrder.paymentStatus.toUpperCase() : 'PENDING'}
                </Badge>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{anyOrder.paymentMethod || 'Cash'}</span>
              </div>

              {anyOrder.advancePaid && (
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Advance Paid</span>
                  <span className="text-green-600 font-medium">{formatCurrency(anyOrder.advancePaid)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span>Total Amount</span>
                <span className="text-primary">{formatCurrency(parseFloat(order.totalAmount || "0"))}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
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
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
              <p className="text-xs font-bold text-yellow-800 dark:text-yellow-500 mb-1">ORDER NOTES</p>
              <p className="text-sm text-yellow-900 dark:text-yellow-200">{anyOrder.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4 pt-4 border-t mt-2">
          {/* WARNING: UNPAID COMPLETION */}
          {(order.status === 'ready_for_pickup' || order.status === 'out_for_delivery') &&
            anyOrder.paymentStatus !== 'paid' && anyOrder.paymentStatus !== 'credit' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-bold text-sm">Payment Required to Complete</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between ml-6">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Settle payment to complete this order.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 bg-green-600 hover:bg-green-700 text-white border-0"
                        onClick={() => onUpdatePaymentStatus(order, 'paid')}
                      >
                        Mark Paid
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-amber-300 text-amber-800 hover:bg-amber-100"
                        onClick={() => onUpdatePaymentStatus(order, 'credit')}
                      >
                        Mark Credit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          <div className="flex justify-end gap-2 flex-wrap">
            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button variant="ghost" onClick={() => onCancel(order)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <XCircle className="h-4 w-4 mr-2" /> Cancel
              </Button>
            )}

            <Button variant="outline" onClick={() => onEdit(order)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>

            <Button variant="outline" onClick={handlePrintInvoice}>
              <Printer className="h-4 w-4 mr-2" /> Invoice
            </Button>

            {nextStatus && (
              <Button
                onClick={() => onNextStep(order)}
                disabled={
                  (nextStatus === 'completed' || nextStatus === 'delivered') &&
                  anyOrder.paymentStatus !== 'paid' && anyOrder.paymentStatus !== 'credit'
                }
              >
                <PlusCircle className="h-4 w-4 mr-2" />
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
