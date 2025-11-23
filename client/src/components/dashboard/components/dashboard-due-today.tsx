/**
 * Dashboard Due Today Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.dueTodayOrders - Due today orders data
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} Rendered due today component
 * 
 * @example
 * ```tsx
 * <DashboardDueToday
 *   dueTodayOrders={dueTodayOrders}
 *   isLoading={false}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { formatCurrency } from '@/lib/data-service';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
import { Link } from 'wouter';

interface DashboardDueTodayProps {
  /** Due today orders data */
  dueTodayOrders: any[];
  /** Loading state */
  isLoading: boolean;
}

const getUrgencyColor = (hoursLeft: number) => {
  if (hoursLeft <= 2) return 'text-red-600 bg-red-50';
  if (hoursLeft <= 6) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
};

const getUrgencyIcon = (hoursLeft: number) => {
  if (hoursLeft <= 2) return <AlertTriangle className="h-4 w-4" />;
  if (hoursLeft <= 6) return <Clock className="h-4 w-4" />;
  return <CheckCircle className="h-4 w-4" />;
};

const getUrgencyText = (hoursLeft: number) => {
  if (hoursLeft <= 0) return 'Overdue';
  if (hoursLeft <= 2) return 'Urgent';
  if (hoursLeft <= 6) return 'Due Soon';
  return 'On Track';
};

const calculateHoursLeft = (dueDate: string) => {
  if (!dueDate) return 24; // Default to 24 hours if no due date
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  return Math.max(0, diffHours);
};

export const DashboardDueToday: React.FC<DashboardDueTodayProps> = React.memo(({
  dueTodayOrders,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card 
        data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'due-today-loading')}
      >
        <CardHeader>
          <CardTitle>Due Today</CardTitle>
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

  // Ensure dueTodayOrders is an array before calling slice
  const displayOrders = Array.isArray(dueTodayOrders) ? dueTodayOrders.slice(0, 5) : [];

  return (
    <Card 
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'due-today')}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Due Today
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/orders?filter=due-today" data-testid={getTestId(TEST_IDS.BUTTON.VIEW, 'due-today-orders')}>
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {displayOrders.length === 0 ? (
          <div 
            className="text-center py-8 text-muted-foreground"
            data-testid={getTestId(TEST_IDS.DATA.EMPTY, 'due-today-orders')}
          >
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No orders due today!</p>
            <p className="text-sm">Great job staying on top of things.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order, index) => {
              const hoursLeft = calculateHoursLeft(order.dueDate || order.pickupDate);
              const urgencyColor = getUrgencyColor(hoursLeft);
              const urgencyIcon = getUrgencyIcon(hoursLeft);
              const urgencyText = getUrgencyText(hoursLeft);

              return (
                <div 
                  key={order.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={getTestId(TEST_IDS.DATA.ITEM, `due-order-${order.id || index}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {order.customerName || order.customer?.name || 'Unknown Customer'}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${urgencyColor}`}
                      >
                        <span className="flex items-center gap-1">
                          {urgencyIcon}
                          {urgencyText}
                        </span>
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Order #{order.id || 'N/A'} • {order.service || 'Service'}
                    </div>
                    {hoursLeft <= 6 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {hoursLeft <= 0 
                          ? `Overdue by ${Math.abs(hoursLeft)} hours`
                          : `Due in ${hoursLeft} hours`
                        }
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      {formatCurrency(order.totalAmount || order.total || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DashboardDueToday.displayName = 'DashboardDueToday';
