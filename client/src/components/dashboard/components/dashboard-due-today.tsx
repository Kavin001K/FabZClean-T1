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

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, AlertTriangle, CheckCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { formatCurrency } from '@/lib/data-service';
import Skeleton from '@/components/ui/loading-skeleton';
import { useLocation } from 'wouter';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardDueTodayProps {
  /** All active orders data */
  orders: any[];
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
  return diffHours; // Allow negative for overdue
};

export const DashboardDueToday: React.FC<DashboardDueTodayProps> = React.memo(({
  orders = [],
  isLoading,
}) => {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  if (isLoading) {
    return (
      <Card data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'due-today')}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-2" />
          <Skeleton className="h-24 w-full mb-2" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Filter orders for the selected date
  const dueOrders = orders.filter(order => {
    const dateToUse = order.pickupDate || order.dueDate;
    if (!dateToUse) return false;
    return isSameDay(new Date(dateToUse), selectedDate);
  });

  // Sort by urgency (closest due time first)
  dueOrders.sort((a, b) => {
    const dateA = new Date(a.pickupDate || a.dueDate).getTime();
    const dateB = new Date(b.pickupDate || b.dueDate).getTime();
    return dateA - dateB;
  });

  const displayOrders = dueOrders.slice(0, 5);
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <Card
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'due-today')}
      className="h-full flex flex-col"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-5 w-5 text-primary" />
          {isToday ? 'Due Today' : `Due: ${format(selectedDate, 'MMM d')}`}
          <Badge variant="secondary" className="ml-2">
            {dueOrders.length}
          </Badge>
        </CardTitle>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 justify-start text-left font-normal px-2",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {selectedDate ? format(selectedDate, "MMM d") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {displayOrders.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground"
            data-testid={getTestId(TEST_IDS.DATA.EMPTY, 'due-today-orders')}
          >
            <CheckCircle className="h-12 w-12 mb-4 text-green-500/50" />
            <p className="font-medium">No orders due on this date!</p>
            <p className="text-sm">Great job staying on top of things.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((order, index) => {
              const hoursLeft = calculateHoursLeft(order.pickupDate || order.dueDate);
              const urgencyColor = getUrgencyColor(hoursLeft);
              const urgencyIcon = getUrgencyIcon(hoursLeft);
              const urgencyText = getUrgencyText(hoursLeft);

              return (
                <div
                  key={order.id || index}
                  className="flex flex-col p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/orders/${order.id}`)}
                  data-testid={getTestId(TEST_IDS.DATA.ITEM, `due-order-${order.id || index}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate max-w-[120px]">
                        {order.customerName || order.customer?.name || 'Unknown'}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px] px-1.5 py-0 h-5", urgencyColor)}
                      >
                        <span className="flex items-center gap-1">
                          {urgencyIcon}
                          {urgencyText}
                        </span>
                      </Badge>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatCurrency(order.totalAmount || order.total || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">#{order.orderNumber || order.id?.slice(0, 8)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[100px]">{order.service || 'Service'}</span>
                    </div>

                    {hoursLeft <= 6 && (
                      <span className={cn(
                        "font-medium",
                        hoursLeft <= 0 ? "text-red-500" : "text-orange-500"
                      )}>
                        {hoursLeft <= 0
                          ? `Overdue ${Math.abs(hoursLeft)}h`
                          : `Due in ${hoursLeft}h`
                        }
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {dueOrders.length > 5 && (
              <Button
                variant="ghost"
                className="w-full text-xs h-8 mt-2"
                onClick={() => setLocation('/orders')}
              >
                View {dueOrders.length - 5} more orders
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DashboardDueToday.displayName = 'DashboardDueToday';
