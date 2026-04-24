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
import { useQuery } from '@tanstack/react-query';
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
import { cn } from '@/lib/utils';
import { format, isSameDay, addDays, subDays } from 'date-fns';

interface DashboardDueTodayProps {
  /** Optional initial orders data (legacy) */
  orders?: any[];
  /** Optional loading state */
  isLoading?: boolean;
}

// Date-based color coding:
// Red: Overdue (past due date)
// Orange: Due today
// Blue: Tomorrow and day after tomorrow
// Green: 3+ days from now
const getUrgencyColor = (hoursLeft: number) => {
  if (hoursLeft < 0) return 'text-red-600 bg-red-100 border-red-200'; // Overdue
  if (hoursLeft < 24) return 'text-orange-600 bg-orange-100 border-orange-200'; // Due today
  if (hoursLeft < 72) return 'text-blue-600 bg-blue-100 border-blue-200'; // Tomorrow & day after
  return 'text-green-600 bg-green-100 border-green-200'; // 3+ days
};

const getUrgencyIcon = (hoursLeft: number) => {
  if (hoursLeft < 0) return <AlertTriangle className="h-4 w-4" />; // Overdue
  if (hoursLeft < 24) return <Clock className="h-4 w-4" />; // Today
  return <CheckCircle className="h-4 w-4" />; // Future
};

const getUrgencyText = (hoursLeft: number) => {
  if (hoursLeft < 0) return 'Overdue';
  if (hoursLeft < 24) return 'Due Today';
  if (hoursLeft < 48) return 'Tomorrow';
  if (hoursLeft < 72) return 'Day After';
  const days = Math.ceil(hoursLeft / 24);
  return `In ${days} days`;
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
  orders: initialOrders = [],
  isLoading: initialLoading,
}) => {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch due orders for the selected date
  const { data: apiData, isLoading: isQueryLoading } = useQuery({
    queryKey: ['due-orders-specific', selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const params = new URLSearchParams({
        type: 'specific',
        date: dateStr,
      });
      const res = await fetch(`/api/due-date-orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch due orders');
      return res.json();
    }
  });

  const isLoading = initialLoading || isQueryLoading;
  const dueOrders = apiData?.orders || [];

  // Sort by urgency (closest due time first)
  // Note: API might return them, but sorting client side ensures correct order if we mix sources
  const sortedOrders = [...dueOrders].sort((a: any, b: any) => {
    const dateA = new Date(a.pickupDate || a.dueDate).getTime();
    const dateB = new Date(b.pickupDate || b.dueDate).getTime();
    return dateA - dateB;
  });

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <Card
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'due-today')}
      className="flex h-full flex-col overflow-hidden border-border bg-card shadow-sm"
    >
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Clock className="h-5 w-5 text-primary" />
          {isToday ? 'Due Today' : `Due: ${format(selectedDate, 'MMM d')}`}
          <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-primary/20">
            {dueOrders.length}
          </Badge>
        </CardTitle>

        <div className="ml-auto flex items-center gap-1 self-end sm:ml-0 sm:self-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
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
                  "h-8 justify-start rounded-xl border-border px-2 text-left font-normal",
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
            className="h-8 w-8 rounded-xl"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : sortedOrders.length === 0 ? (
          <div
            className="flex h-full flex-1 flex-col items-center justify-center py-8 text-muted-foreground"
            data-testid={getTestId(TEST_IDS.DATA.EMPTY, 'due-today-orders')}
          >
            <CheckCircle className="h-12 w-12 mb-4 text-green-500/50" />
            <p className="font-medium">No orders due on this date!</p>
            <p className="text-sm">Great job staying on top of things.</p>
          </div>
        ) : (
          <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 sm:pr-2">
            {sortedOrders.map((order: any, index: number) => {
              const hoursLeft = calculateHoursLeft(order.dueDate || order.pickupDate);
              const urgencyColor = getUrgencyColor(hoursLeft);
              const urgencyIcon = getUrgencyIcon(hoursLeft);
              const urgencyText = getUrgencyText(hoursLeft);

              return (
                <div
                  key={order.id || index}
                  className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:shadow-md"
                  onClick={() => setLocation(`/orders/${order.id}`)}
                  data-testid={getTestId(TEST_IDS.DATA.ITEM, `due-order-${order.id || index}`)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-foreground">
                          {order.customerName || order.customer?.name || 'Unknown'}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn("h-5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight", urgencyColor)}
                        >
                          <span className="flex items-center gap-1">
                            {urgencyIcon}
                            {urgencyText}
                          </span>
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
                      <span className="text-base font-black text-foreground tabular-nums">
                        {formatCurrency(order.totalAmount || order.total || 0)}
                      </span>
                      <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {format(new Date(order.dueDate || order.pickupDate), 'dd MMM, hh:mm a')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border/30 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    <div className="flex min-w-0 items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{hoursLeft <= 0 ? 'Needs action now' : 'Due window active'}</span>
                    </div>

                    {hoursLeft <= 24 && (
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider",
                        hoursLeft <= 0 ? "text-red-500" : "text-amber-500"
                      )}>
                        {hoursLeft <= 0
                          ? `Overdue ${Math.abs(hoursLeft)}h`
                          : `In ${hoursLeft}h`
                        }
                      </span>
                    )}
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

export default DashboardDueToday;
