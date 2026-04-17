/**
 * Dashboard Orders By Date Widget
 * 
 * displays orders created on a specific date with a calendar to change the date.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShoppingBag, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Package } from 'lucide-react';
import { ordersApi } from '@/lib/data-service';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { formatCurrency } from '@/lib/data-service';
import Skeleton from '@/components/ui/loading-skeleton';
import { useLocation } from 'wouter';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'processing':
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const DashboardOrdersByDate: React.FC = React.memo(() => {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch orders created on the selected date
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-by-date', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => ordersApi.getAll({
      createdDate: format(selectedDate, 'yyyy-MM-dd'),
      limit: 100
    })
  });

  const isToday = isSameDay(selectedDate, new Date());

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  return (
    <Card
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'orders-by-date')}
      className="flex h-full min-h-[24rem] flex-col overflow-hidden border-border bg-card shadow-sm sm:min-h-[28rem]"
    >
      <CardHeader className="flex flex-col gap-3 border-b border-border/50 pb-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl bg-lime-500/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5 text-lime-600" />
          </div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
            <span className="whitespace-nowrap">
              {isToday ? 'Orders Created Today' : `Created: ${format(selectedDate, 'MMM d')}`}
            </span>
            <Badge variant="secondary" className="bg-lime-500/20 text-lime-600 border-lime-500/20 px-1.5 h-5 font-bold text-[10px]">
              {orders.length}
            </Badge>
          </CardTitle>
        </div>

        <div className="ml-auto flex items-center gap-1 self-end sm:ml-2 sm:self-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-all hover:bg-muted/80"
            onClick={handlePrevDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-full border-border/50 text-[11px] font-bold transition-all hover:bg-muted/80 flex items-center gap-1.5",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
                {selectedDate ? format(selectedDate, "MMM d") : <span>Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-all hover:bg-muted/80"
            onClick={handleNextDay}
            disabled={isToday}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 text-muted-foreground/20" />
            <p className="font-medium text-sm">No orders created on this date</p>
            <Button 
              variant="link" 
              className="mt-2 text-xs text-primary"
              onClick={() => setLocation('/create-order')}
            >
              Create first order for today
            </Button>
          </div>
        ) : (
          <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 sm:pr-2">
            {Array.isArray(orders) && orders.map((order: any) => (
              <div
                key={order.id}
                className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:shadow-sm"
                onClick={() => setLocation(`/orders/${order.id}`)}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {order.customerName || 'Unknown'}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("h-5 border px-2 py-0 text-[10px] font-semibold", getStatusColor(order.status))}
                      >
                        {order.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-foreground/80">
                        #{order.orderNumber}
                      </span>
                      <span className="hidden text-muted-foreground/40 sm:inline">•</span>
                      <span className="line-clamp-2 min-w-0">
                        {order.items?.[0]?.serviceName || 'Service'} {order.items?.length > 1 ? `+${order.items.length - 1} more` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
                    <span className="text-base font-black text-primary">
                      {formatCurrency(order.totalAmount || order.total || 0)}
                    </span>
                    <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {format(new Date(order.createdAt), 'hh:mm a')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-lime-600" />
                    <span>Created {format(new Date(order.createdAt), 'dd MMM yyyy')}</span>
                  </div>
                  <span>{order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DashboardOrdersByDate.displayName = 'DashboardOrdersByDate';

export default DashboardOrdersByDate;
