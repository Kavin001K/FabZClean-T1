import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";
import {
  Eye,
  Edit,
  X,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Printer,
  FileText,
  Truck,
  Package,
  Store,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/data-service";
import type { Order } from "@shared/schema";
import { cn } from "@/lib/utils";

export interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  error?: Error | null;
  selectedOrders: string[];
  sortField: keyof Order | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Order) => void;
  onSelectOrder: (orderId: string) => void;
  onSelectAll: () => void;
  onViewOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onRetry?: () => void;
  className?: string;
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
    case 'completed': return <CheckCircle className="h-3 w-3" />;
    case 'delivered': return <CheckCircle className="h-3 w-3" />;
    case 'processing': return <Clock className="h-3 w-3" />;
    case 'pending': return <AlertCircle className="h-3 w-3" />;
    case 'cancelled': return <XCircle className="h-3 w-3" />;
    case 'in_transit': return <Truck className="h-3 w-3" />;
    case 'ready_for_transit': return <Package className="h-3 w-3" />;
    case 'ready_for_pickup': return <CheckCircle className="h-3 w-3" />;
    case 'out_for_delivery': return <Truck className="h-3 w-3" />;
    case 'in_store': return <Store className="h-3 w-3" />;
    default: return <AlertCircle className="h-3 w-3" />;
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

const EmptyState = ({ onRetry, onCreateOrder }: { onRetry?: () => void; onCreateOrder: () => void }) => (
  <TableRow>
    <TableCell colSpan={9} className="text-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <div className="rounded-full bg-muted p-6">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No orders match the current filters</h3>
          <p className="text-muted-foreground max-w-md">
            Try adjusting your search criteria or create a new order to get started.
          </p>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Refresh Data
            </Button>
          )}
          <Button onClick={onCreateOrder}>
            Create New Order
          </Button>
        </div>
      </div>
    </TableCell>
  </TableRow>
);

const ErrorState = ({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
  <TableRow>
    <TableCell colSpan={9} className="text-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <div className="rounded-full bg-red-100 p-6">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-900">Failed to load orders</h3>
          <p className="text-muted-foreground max-w-md">
            {error.message || "Something went wrong while loading the orders data."}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </TableCell>
  </TableRow>
);

export default React.memo(function OrdersTable({
  orders,
  isLoading = false,
  error = null,
  selectedOrders,
  sortField,
  sortDirection,
  onSort,
  onSelectOrder,
  onSelectAll,
  onViewOrder,
  onEditOrder,
  onCancelOrder,
  onPrintInvoice,
  onUpdateStatus,
  onRetry,
  className,
}: OrdersTableProps) {
  const isAllSelected = useMemo(() =>
    orders.length > 0 && selectedOrders.length === orders.length,
    [orders.length, selectedOrders.length]
  );

  const SortIcon = ({ field }: { field: keyof Order }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleRowClick = (order: Order) => {
    onViewOrder(order);
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox disabled />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <LoadingSkeleton.TableSkeleton rows={5} />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox disabled />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <ErrorState error={error} onRetry={onRetry} />
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all orders"
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => onSort('id')}
            >
              <div className="flex items-center gap-2">
                Order ID
                <SortIcon field="id" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => onSort('customerName')}
            >
              <div className="flex items-center gap-2">
                Customer
                <SortIcon field="customerName" />
              </div>
            </TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon field="status" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center gap-2">
                Date
                <SortIcon field="createdAt" />
              </div>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => onSort('totalAmount')}
            >
              <div className="flex items-center justify-end gap-2">
                Amount
                <SortIcon field="totalAmount" />
              </div>
            </TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <EmptyState onCreateOrder={() => window.location.href = '/create-order'} onRetry={onRetry} />
          ) : (
            orders.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleRowClick(order)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={() => onSelectOrder(order.id)}
                    aria-label={`Select order ${order.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {order.id}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customerName || (order as any).customers?.name || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {(order as any).service || 'Dry Cleaning'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getPriorityColor((order as any).priority || 'Normal')}>
                    {(order as any).priority || 'Normal'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn("border", getStatusColor(order.status))}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      <span>{formatStatusDisplay(order.status)}</span>
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(order.createdAt || new Date())}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
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
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewOrder(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditOrder(order)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Order
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrintInvoice(order)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {order.status === 'pending' && (
                        <DropdownMenuItem onClick={() => onUpdateStatus(order.id, 'processing')}>
                          <Clock className="mr-2 h-4 w-4" />
                          Mark as Processing
                        </DropdownMenuItem>
                      )}
                      {order.status === 'processing' && (
                        <DropdownMenuItem onClick={() => onUpdateStatus(order.id, 'completed')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </DropdownMenuItem>
                      )}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <DropdownMenuItem
                          onClick={() => onCancelOrder(order)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel Order
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
});
