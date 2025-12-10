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
}

// Format status for display - converts snake_case to Human Readable
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
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    case 'in_transit': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ready_for_transit': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'ready_for_pickup': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'out_for_delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'in_store': return 'bg-teal-100 text-teal-800 border-teal-200';
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
}: OrderDetailsDialogProps) {
  const { printInvoice } = useInvoicePrint({
    onSuccess: (invoiceData) => {
      console.log('Invoice printed successfully:', invoiceData);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order Details: {order.id}
            <Badge className={cn("border", getStatusColor(order.status))}>
              <span className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                <span>{formatStatusDisplay(order.status)}</span>
              </span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View detailed information about the order.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
          {/* Order Information Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Information</p>
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-semibold">{order.customerName || (order as any).customers?.name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">Order #{order.orderNumber || order.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Priority</p>
                <div className="mt-2">
                  <Badge className={getPriorityColor((order as any).priority || 'Normal')}>
                    {(order as any).priority || 'Normal'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                <p className="text-lg font-semibold">
                  {formatDate(order.createdAt ? order.createdAt.toString() : new Date().toString())}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-semibold">
                    {formatDate((order as any).pickupDate ? new Date((order as any).pickupDate).toString() : (order.createdAt ? order.createdAt.toString() : new Date().toString()))}
                  </p>
                  {(order as any).pickupDate && (
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      new Date((order as any).pickupDate) < new Date() && order.status !== 'completed' && order.status !== 'delivered' ? "bg-red-100 text-red-800 border-red-200" :
                        new Date((order as any).pickupDate).toDateString() === new Date().toDateString() && order.status !== 'completed' && order.status !== 'delivered' ? "bg-orange-100 text-orange-800 border-orange-200" :
                          "bg-gray-100 text-gray-800 border-gray-200"
                    )}>
                      {new Date((order as any).pickupDate) < new Date() && order.status !== 'completed' && order.status !== 'delivered' ? "Overdue" :
                        new Date((order as any).pickupDate).toDateString() === new Date().toDateString() && order.status !== 'completed' && order.status !== 'delivered' ? "Due Today" :
                          "Scheduled"}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency((() => {
                    const total = parseFloat(order.totalAmount || "0");
                    if (total > 0) return total;
                    if (Array.isArray((order as any).items)) {
                      return (order as any).items.reduce((sum: number, item: any) => {
                        return sum + (parseFloat(item.price || item.unitPrice || 0) * parseFloat(item.quantity || 1));
                      }, 0);
                    }
                    return 0;
                  })())}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
            {(order as any).items && Array.isArray((order as any).items) && (order as any).items.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {(order as any).items.map((item: any, index: number) => (
                  <div key={index} className="p-3 flex justify-between items-center bg-muted/20">
                    <div>
                      <p className="font-medium">{item.name || item.serviceName || `Item ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description && <span className="mr-2">{item.description}</span>}
                        Qty: {item.quantity || 1}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.price || item.unitPrice || 0)}</p>
                      {(item.quantity || 1) > 1 && (
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency((parseFloat(item.price || item.unitPrice || 0)) * (item.quantity || 1))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="font-medium">
                  {(order as any).service || 'Dry Cleaning'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Quantity: {(order as any).quantity || 1}
                </p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Payment Information</p>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="font-medium">
                  {(order as any).paymentStatus || 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">
                  {(order as any).paymentMethod || 'Cash'}
                </p>
              </div>
              {(order as any).advancePaid && (
                <div>
                  <p className="text-sm text-muted-foreground">Advance Paid</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency((order as any).advancePaid)}
                  </p>
                </div>
              )}
              {(order as any).advancePaid && (
                <div>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="font-medium text-orange-600">
                    {formatCurrency(parseFloat(order.totalAmount || "0") - ((order as any).advancePaid || 0))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Type & Delivery Info */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Fulfillment Details</p>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fulfillment Type</p>
                  <Badge className={cn(
                    "mt-1",
                    (order as any).fulfillmentType === 'delivery'
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-green-100 text-green-800 border-green-200"
                  )}>
                    {(order as any).fulfillmentType === 'delivery' ? '🚚 Home Delivery' : '🏪 Self Pickup'}
                  </Badge>
                </div>
                {(order as any).deliveryCharges && parseFloat((order as any).deliveryCharges) > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Charges</p>
                    <p className="font-medium">{formatCurrency((order as any).deliveryCharges)}</p>
                  </div>
                )}
              </div>
              {(order as any).fulfillmentType === 'delivery' && (order as any).deliveryAddress && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Delivery Address</p>
                  <p className="font-medium mt-1">
                    {typeof (order as any).deliveryAddress === 'object'
                      ? `${(order as any).deliveryAddress.street || ''}${(order as any).deliveryAddress.city ? `, ${(order as any).deliveryAddress.city}` : ''}${(order as any).deliveryAddress.zip ? ` - ${(order as any).deliveryAddress.zip}` : ''}`
                      : (order as any).deliveryAddress
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {(order as any).notes && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{(order as any).notes}</p>
              </div>
            </div>
          )}

          {/* Transit Information */}
          {['processing', 'shipped', 'out_for_delivery', 'in_transit'].includes(order.status) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Transit Status</p>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg dark:bg-blue-900/20 dark:border-blue-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900 dark:text-blue-400">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">In Transit</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Order is currently being processed or is on its way.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/tracking/${order.id}`, '_blank')}>
                    Track Order
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {/* Payment Warning for completion */}
            {(order.status === 'ready_for_pickup' || order.status === 'out_for_delivery') &&
              (order as any).paymentStatus !== 'paid' && (
                <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2 dark:bg-amber-900/20 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <strong>Payment Required:</strong> Order must be marked as "Paid" before it can be completed or delivered.
                  </p>
                </div>
              )}

            {/* Next Step Button with context-aware label */}
            {nextStatus && (
              <Button
                onClick={() => onNextStep(order)}
                className="gap-2"
                disabled={
                  (nextStatus === 'completed' || nextStatus === 'delivered') &&
                  (order as any).paymentStatus !== 'paid'
                }
              >
                <PlusCircle className="h-4 w-4" />
                {order.status === 'ready_for_pickup' && (order as any).fulfillmentType === 'delivery'
                  ? 'Start Delivery'
                  : order.status === 'ready_for_pickup'
                    ? 'Hand Over to Customer'
                    : order.status === 'out_for_delivery'
                      ? 'Mark as Delivered'
                      : `Move to ${nextStatus.replace(/_/g, ' ')}`
                }
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => onEdit(order)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Order
            </Button>

            <Button
              variant="outline"
              onClick={handlePrintInvoice}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>

            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button
                variant="outline"
                onClick={() => onCancel(order)}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
