import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/data-service";
import { Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  date: string;
  status: string; // Relaxed to string to support all statuses like 'assigned', 'in_transit'
  paymentStatus: 'pending' | 'paid' | 'partial' | 'failed';
  total: number;
  service?: string;
  createdAt: string;
}

interface RecentOrdersProps {
  orders?: Order[];
  isLoading?: boolean;
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="h-3 w-3" />;
    case 'processing': return <AlertCircle className="h-3 w-3" />;
    case 'completed':
    case 'delivered': return <CheckCircle className="h-3 w-3" />;
    case 'cancelled': return <XCircle className="h-3 w-3" />;
    case 'assigned': return <Clock className="h-3 w-3" />;
    case 'in_transit': return <Clock className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusColor = (status: Order['paymentStatus']) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 border-green-200';
    case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default React.memo(function RecentOrders({
  orders = [],
  isLoading = false,
  limit = 5,
  showViewAll = true,
  className
}: RecentOrdersProps) {
  // Ensure orders is an array before calling slice
  const displayOrders = Array.isArray(orders) ? orders.slice(0, limit) : [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton.TableSkeleton rows={5} />
        </CardContent>
      </Card>
    );
  }

  if (!displayOrders || displayOrders.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-sm">Orders will appear here once created</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        {showViewAll && (
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayOrders.map((order, index) => (
            <div
              key={order.id || index}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">
                    {order.customerName ?
                      order.customerName.split(' ').map(n => n[0]).join('').toUpperCase() :
                      'N/A'
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center space-x-3">
                    <p className="text-sm font-medium leading-none truncate">
                      {order.customerName || 'Unknown Customer'}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs border", getStatusColor(order.status))}
                    >
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="text-xs text-muted-foreground">
                      #{order.orderNumber || (order.id ? order.id.slice(-8) : 'N/A')}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                      {order.service || 'Dry Cleaning'}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown Date'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs border w-fit", getPaymentStatusColor(order.paymentStatus))}
                  >
                    Payment: {order.paymentStatus || 'Unknown'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatCurrency(order.total || 0)}
                  </div>
                </div>
                <Link to={order.id ? `/orders/${order.id}` : '#'}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
