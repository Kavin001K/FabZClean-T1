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
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
import { Link } from 'wouter';

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
  if (isLoading) {
    return (
      <Card 
        data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'recent-orders-loading')}
      >
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <LoadingSkeleton.CardSkeleton />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayOrders = recentOrders?.slice(0, 5) || [];

  return (
    <Card 
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'recent-orders')}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/orders" data-testid={getTestId(TEST_IDS.BUTTON.VIEW, 'all-orders')}>
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
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
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                data-testid={getTestId(TEST_IDS.DATA.ITEM, `order-${order.id || index}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {order.customerName || order.customer?.name || 'Unknown Customer'}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(order.status)}`}
                    >
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Order #{order.id || 'N/A'} • {order.service || 'Service'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(order.totalAmount || order.total || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
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
