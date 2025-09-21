import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import { formatCurrency, formatDate, getNextStatus } from "@/lib/data-service";
import type { Order } from "../../../shared/schema";
import { cn } from "@/lib/utils";

export interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onCancel: (order: Order) => void;
  onNextStep: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
}

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    case 'processing': return <Clock className="h-4 w-4" />;
    case 'pending': return <AlertCircle className="h-4 w-4" />;
    case 'cancelled': return <XCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
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
  if (!order) return null;

  const nextStatus = getNextStatus(order.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order Details: {order.id}
            <Badge className={cn("border", getStatusColor(order.status))}>
              <span className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                <span className="capitalize">{order.status}</span>
              </span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Information Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Information</p>
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-semibold">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Details</p>
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-semibold">
                    {(order as any).service || 'Dry Cleaning'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {(order as any).quantity || 1}
                  </p>
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
                  {formatDate(order.createdAt || new Date())}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Pickup Date</p>
                <p className="text-lg font-semibold">
                  {formatDate((order as any).pickupDate || order.createdAt || new Date())}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(parseFloat(order.totalAmount))}
                </p>
              </div>
            </div>
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
                    {formatCurrency(parseFloat(order.totalAmount) - ((order as any).advancePaid || 0))}
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {nextStatus && (
              <Button 
                onClick={() => onNextStep(order)} 
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Next Step: {nextStatus}
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
              onClick={() => onPrintInvoice(order)}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
            
            {order.status !== 'completed' && order.status !== 'cancelled' && (
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
