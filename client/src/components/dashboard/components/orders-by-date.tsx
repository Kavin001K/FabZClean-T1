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
      className="h-full overflow-hidden border-border bg-card shadow-sm"
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 border-b border-border pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShoppingBag className="h-5 w-5 text-primary" />
          {isToday ? 'Orders Created Today' : `Created: ${format(selectedDate, 'MMM d, yyyy')}`}
          <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-primary/20">
            {orders.length}
          </Badge>
        </CardTitle>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
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
                  "h-8 justify-start rounded-xl border-border px-3 text-left font-normal",
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
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={handleNextDay}
            disabled={isToday}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
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
          <div className="grid grid-cols-1 gap-3">
            {Array.isArray(orders) && orders.map((order: any) => (
              <div
                key={order.id}
                className="group flex flex-col rounded-2xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:shadow-sm cursor-pointer"
                onClick={() => setLocation(`/orders/${order.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {order.customerName || 'Unknown'}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-2 py-0 h-5 border font-semibold", getStatusColor(order.status))}
                    >
                      {order.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-sm font-black text-primary">
                    {formatCurrency(order.totalAmount || order.total || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-foreground/70 font-mono">
                      #{order.orderNumber}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">
                      {order.items?.[0]?.serviceName || 'Service'} {order.items?.length > 1 ? `+${order.items.length - 1}` : ''}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-70">
                    {format(new Date(order.createdAt), 'hh:mm a')}
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

DashboardOrdersByDate.displayName = 'DashboardOrdersByDate';

export default DashboardOrdersByDate;
