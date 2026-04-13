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
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
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
    // ... (keep loading state)
  }

  // Ensure recentOrders is an array before calling slice
  const displayOrders = Array.isArray(recentOrders) ? recentOrders.slice(0, 5) : [];

  return (
    <Card
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'recent-orders')}
      className="overflow-hidden border-border bg-card shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
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
      <CardContent className="pt-4">
        {displayOrders.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-testid={getTestId(TEST_IDS.DATA.EMPTY, 'recent-orders')}
          >
            No recent orders found
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order, index) => (
              <div
                key={order.id || index}
                className="group flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:shadow-md cursor-pointer"
                onClick={() => setLocation(`/orders/${order.id}`)}
                data-testid={getTestId(TEST_IDS.DATA.ITEM, `order-${order.id || index}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="truncate text-sm font-bold text-foreground">
                      {order.customerName || order.customer?.name || 'Unknown Customer'}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] px-2 py-0.5 h-5 font-bold uppercase tracking-tight", getStatusColor(order.status))}
                    >
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    <span className="font-mono text-primary/70">#{order.orderNumber || order.id?.slice(0, 8)}</span>
                    <span>•</span>
                    <span className="truncate">{order.service || 'Service'}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-base font-black text-foreground tabular-nums">
                    {formatCurrency(order.totalAmount || order.total || 0)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground/50">
                      {order.createdAt ? format(new Date(order.createdAt), 'dd MMM') : 'N/A'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DashboardRecentOrders.displayName = 'DashboardRecentOrders';

export default DashboardRecentOrders;
