import React, { useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Printer, X, CheckCircle, Clock, AlertCircle, XCircle, CreditCard, Truck, Package } from 'lucide-react';
import { useInvoicePrint } from '@/hooks/use-invoice-print';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ordersApi } from '@/lib/data-service';
import { formatCurrency, formatDate, getNextStatus } from '@/lib/data-service';
import type { Order } from "@shared/schema";
import { cn } from '@/lib/utils';
import LoadingSkeleton from '@/components/ui/loading-skeleton';

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    case 'processing': return <Clock className="h-4 w-4" />;
    case 'pending': return <AlertCircle className="h-4 w-4" />;
    case 'cancelled': return <XCircle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: order,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { printInvoice } = useInvoicePrint({
    onSuccess: (invoiceData) => {
      console.log('Invoice printed successfully:', invoiceData);
    },
    onError: (error) => {
      console.error('Invoice print failed:', error);
    }
  });

  const handlePrintInvoice = () => {
    if (order) {
      printInvoice(order);
    }
  };

  const { toast } = useToast();

  const updateOrderMutation = useMutation({
    mutationFn: (data: Partial<Order>) => ordersApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({
        title: "Order Updated",
        description: "The order has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update the order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: Order['status']) => {
    updateOrderMutation.mutate({ status: newStatus });
  };

  const handlePaymentStatusChange = (newStatus: 'paid' | 'pending' | 'failed') => {
    updateOrderMutation.mutate({ paymentStatus: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex items-center gap-4 mb-6">
          <LoadingSkeleton className="h-10 w-10" />
          <div className="space-y-2">
            <LoadingSkeleton className="h-6 w-48" />
            <LoadingSkeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <LoadingSkeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-3/4" />
                <LoadingSkeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground text-center mb-4">
              The order you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order ID: {order.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.paymentStatus !== 'paid' && (
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              onClick={() => handlePaymentStatusChange('paid')}
              disabled={updateOrderMutation.isPending}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}

          {order.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('processing')}
              disabled={updateOrderMutation.isPending}
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark Processing
            </Button>
          )}

          {order.status === 'processing' && (
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              onClick={() => handleStatusChange('ready_for_delivery')}
              disabled={updateOrderMutation.isPending}
            >
              <Package className="h-4 w-4 mr-2" />
              Ready for Delivery
            </Button>
          )}

          {order.status === 'ready_for_delivery' && (
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              onClick={() => handleStatusChange('completed')}
              disabled={updateOrderMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Completed
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Order
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Order Status
              <Badge className={cn("border", getStatusColor(order.status))}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{order.status}</span>
                </span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                <p className="text-lg font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-lg font-semibold">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-lg font-semibold">{formatDate(order.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                <p className="text-lg font-semibold">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">{order.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-lg font-semibold">{order.customerPhone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <Badge className={cn(
                  "mt-1",
                  order.paymentStatus === 'paid' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                )}>
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
              <div className="space-y-4">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name || item.serviceName || `Item ${index + 1}`}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity || 1}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(item.price || item.unitPrice || 0)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          Total: {formatCurrency((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No items found for this order.</p>
            )}
          </CardContent>
        </Card>

        {/* Delivery Information */}
        {/* Delivery Information */}
        {((order as any).pickupDate || (order as any).deliveryDate || (order as any).shippingAddress) && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(order as any).pickupDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                    <p className="text-lg font-semibold">{formatDate((order as any).pickupDate)}</p>
                  </div>
                )}
                {(order as any).deliveryDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Date</p>
                    <p className="text-lg font-semibold">{formatDate((order as any).deliveryDate)}</p>
                  </div>
                )}
                {(order as any).shippingAddress && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Shipping Address</p>
                    <p className="text-lg font-semibold">
                      {(() => {
                        const addr = (order as any).shippingAddress;
                        // Parse JSON string if needed
                        let addressObj = addr;
                        if (typeof addr === 'string') {
                          try {
                            addressObj = JSON.parse(addr);
                          } catch {
                            return addr; // Return as-is if not valid JSON
                          }
                        }
                        // Format object to readable address
                        if (typeof addressObj === 'object' && addressObj !== null) {
                          const parts = [];
                          if (addressObj.street || addressObj.line1 || addressObj.address) {
                            parts.push(addressObj.street || addressObj.line1 || addressObj.address);
                          }
                          if (addressObj.landmark) parts.push(addressObj.landmark);
                          if (addressObj.city) parts.push(addressObj.city);
                          if (addressObj.state) parts.push(addressObj.state);
                          if (addressObj.zip || addressObj.pincode || addressObj.zipCode) {
                            parts.push(`- ${addressObj.zip || addressObj.pincode || addressObj.zipCode}`);
                          }
                          if (addressObj.country && addressObj.country !== 'India') {
                            parts.push(addressObj.country);
                          }
                          return parts.join(', ').replace(', -', ' -') || 'Address not available';
                        }
                        return String(addr);
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Notes */}
        {(order as any).notes && (
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{(order as any).notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
