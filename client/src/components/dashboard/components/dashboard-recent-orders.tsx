/**
 * Dashboard Recent Orders Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.recentOrders - Recent orders data
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} Rendered recent orders component
 * 
 * @example
 * ```tsx
 * <DashboardRecentOrders
 *   recentOrders={recentOrders}
 *   isLoading={false}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { formatCurrency } from '@/lib/data-service';
import { Package, ChevronRight } from 'lucide-react';
import Skeleton from '@/components/ui/loading-skeleton';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DashboardRecentOrdersProps {
  /** Recent orders data */
  recentOrders: any[];
  /** Loading state */
  isLoading: boolean;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
};

export const DashboardRecentOrders: React.FC<DashboardRecentOrdersProps> = React.memo(({
  recentOrders,
  isLoading,
}) => {
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Card
        data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'recent-orders')}
        className="flex h-full flex-col overflow-hidden border-border bg-card shadow-sm"
      >
        <CardHeader className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  const displayOrders = Array.isArray(recentOrders) ? recentOrders : [];

  return (
    <Card
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'recent-orders')}
      className="flex h-full flex-col overflow-hidden border-border bg-card shadow-sm"
    >
      <CardHeader className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Package className="h-5 w-5 text-primary" />
          Recent Orders
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-xl text-xs hover:bg-muted"
          onClick={() => setLocation('/orders')}
          data-testid={getTestId(TEST_IDS.BUTTON.VIEW, 'all-orders')}
        >
          View All
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
        {displayOrders.length === 0 ? (
          <div
            className="flex flex-1 items-center justify-center py-8 text-center text-muted-foreground"
            data-testid={getTestId(TEST_IDS.DATA.EMPTY, 'recent-orders')}
          >
            No recent orders found
          </div>
        ) : (
          <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 sm:pr-2">
            {displayOrders.map((order, index) => (
              <div
                key={order.id || index}
                className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:shadow-md"
                onClick={() => setLocation(`/orders/${order.id}`)}
                data-testid={getTestId(TEST_IDS.DATA.ITEM, `order-${order.id || index}`)}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground">
                        {order.customerName || order.customer?.name || 'Unknown Customer'}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn("h-5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight", getStatusColor(order.status))}
                      >
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-primary/80">
                        #{order.orderNumber || order.id?.slice(0, 8)}
                      </span>
                      <span className="hidden text-muted-foreground/40 sm:inline">•</span>
                      <span className="line-clamp-2 min-w-0">{order.service || 'Service'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
                    <div className="text-base font-black text-foreground tabular-nums">
                      {formatCurrency(order.totalAmount || order.total || 0)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {order.createdAt ? format(new Date(order.createdAt), 'dd MMM, hh:mm a') : 'N/A'}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 rounded-full bg-emerald-500/10 px-3 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://erp.myfabclean.com/trackorder/${order.orderNumber || order.id}`, '_blank');
                        }}
                      >
                        Track
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  <span>Recent activity</span>
                  <span>{order.isExpressOrder ? 'Express' : 'Standard'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DashboardRecentOrders.displayName = 'DashboardRecentOrders';

export default DashboardRecentOrders;
