import React, { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/data-service";
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Calendar, ChevronLeft, ChevronRight, CalendarDays, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export interface DueTodayOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  status: string; // Relaxed type
  paymentStatus: 'pending' | 'paid' | 'partial' | 'failed';
  total: number;
  service?: string;
  pickupDate: string;
  createdAt: string;
}

interface DueTodayOrdersProps {
  orders?: DueTodayOrder[];
  isLoading?: boolean;
  limit?: number;
  showViewAll?: boolean;
  className?: string;
  showDateSelector?: boolean;
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
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'completed':
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
    case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
};

const getPaymentStatusColor = (status: DueTodayOrder['paymentStatus']) => {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'partial': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    case 'failed': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
};

const isOverdue = (pickupDate: string) => {
  const today = new Date();
  const pickup = new Date(pickupDate);
  today.setHours(0, 0, 0, 0);
  pickup.setHours(0, 0, 0, 0);
  return pickup < today;
};

const isDueToday = (pickupDate: string) => {
  const today = new Date();
  const pickup = new Date(pickupDate);
  today.setHours(0, 0, 0, 0);
  pickup.setHours(0, 0, 0, 0);
  return pickup.getTime() === today.getTime();
};

const isDueTomorrow = (pickupDate: string) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pickup = new Date(pickupDate);
  tomorrow.setHours(0, 0, 0, 0);
  pickup.setHours(0, 0, 0, 0);
  return pickup.getTime() === tomorrow.getTime();
};

const getDueStatus = (pickupDate: string) => {
  const dateObj = new Date(pickupDate);
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (isOverdue(pickupDate)) return {
    label: `Overdue (${dateStr})`,
    color: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    icon: <AlertTriangle className="h-3 w-3 mr-1" />
  };
  if (isDueToday(pickupDate)) return {
    label: 'Due Today',
    color: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    icon: <Clock className="h-3 w-3 mr-1" />
  };
  if (isDueTomorrow(pickupDate)) return {
    label: 'Due Tomorrow',
    color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    icon: <Calendar className="h-3 w-3 mr-1" />
  };
  return {
    label: `Due ${dateStr}`,
    color: 'text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    icon: <Calendar className="h-3 w-3 mr-1" />
  };
};

export default React.memo(function DueTodayOrders({
  orders = [],
  isLoading = false,
  limit = 5,
  showViewAll = true,
  showDateSelector = true,
  className
}: DueTodayOrdersProps) {
  // Date selection state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Quick date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // Quick date buttons
  const setQuickDate = (daysOffset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    setSelectedDate(targetDate.toISOString().split('T')[0]);
  };

  // Filter orders based on selected date
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    return orders.filter(order => {
      if (!order.pickupDate) return false;
      const pickup = new Date(order.pickupDate);
      pickup.setHours(0, 0, 0, 0);
      return pickup.getTime() === targetDate.getTime();
    });
  }, [orders, selectedDate]);

  const displayOrders = (Array.isArray(filteredOrders) ? filteredOrders : []).slice(0, limit);

  // Get date display text
  const getDateDisplayText = () => {
    const targetDate = new Date(selectedDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) return 'Due Today';
    if (targetDate.getTime() === yesterday.getTime()) return 'Due Yesterday';
    if (targetDate.getTime() === tomorrow.getTime()) return 'Due Tomorrow';

    return `Due on ${targetDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {getDateDisplayText()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton.TableSkeleton rows={5} />
        </CardContent>
      </Card>
    );
  }

  if (!displayOrders || displayOrders.length === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="space-y-4 pb-2">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              {getDateDisplayText()}
            </CardTitle>
            {showViewAll && (
              <Link to="/orders?filter=due">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10 hover:text-primary">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View All
                </Button>
              </Link>
            )}
          </div>

          {showDateSelector && (
            <div className="space-y-3">
              {/* Quick Date Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(-1)}
                  className={cn(
                    "text-xs h-8 px-3 rounded-full transition-all",
                    selectedDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                      : "hover:bg-muted"
                  )}
                >
                  Yesterday
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(0)}
                  className={cn(
                    "text-xs h-8 px-3 rounded-full transition-all",
                    selectedDate === new Date().toISOString().split('T')[0]
                      ? "bg-orange-100 text-orange-700 border-orange-200 shadow-sm"
                      : "hover:bg-muted"
                  )}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(1)}
                  className={cn(
                    "text-xs h-8 px-3 rounded-full transition-all",
                    selectedDate === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      ? "bg-green-100 text-green-700 border-green-200 shadow-sm"
                      : "hover:bg-muted"
                  )}
                >
                  Tomorrow
                </Button>
              </div>

              {/* Date Navigation with Calendar */}
              <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="h-7 w-7 p-0 hover:bg-background hover:shadow-sm rounded-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex-1 h-7 justify-center text-xs font-medium hover:bg-background hover:shadow-sm rounded-md"
                    >
                      <CalendarDays className="mr-2 h-3.5 w-3.5 opacity-70" />
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      mode="single"
                      selected={new Date(selectedDate)}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date.toISOString().split('T')[0]);
                        }
                      }}
                      className="rounded-md border shadow-lg"
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="h-7 w-7 p-0 hover:bg-background hover:shadow-sm rounded-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-muted-foreground/20 m-1">
            <div className="bg-background p-3 rounded-full shadow-sm mb-3">
              <CheckCircle className="h-8 w-8 text-green-500/80" />
            </div>
            <p className="text-base font-medium text-foreground/80">All Caught Up!</p>
            <p className="text-xs text-muted-foreground mt-1">No orders {getDateDisplayText().toLowerCase()}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="space-y-4 pb-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            {getDateDisplayText()}
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 h-5 min-w-[1.25rem] justify-center">
              {displayOrders.length}
            </Badge>
          </CardTitle>
          {showViewAll && (
            <Link to="/orders?filter=due">
              <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10 hover:text-primary">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View All
              </Button>
            </Link>
          )}
        </div>

        {showDateSelector && (
          <div className="space-y-3">
            {/* Quick Date Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDate(-1)}
                className={cn(
                  "text-xs h-8 px-3 rounded-full transition-all",
                  selectedDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                    : "hover:bg-muted"
                )}
              >
                Yesterday
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDate(0)}
                className={cn(
                  "text-xs h-8 px-3 rounded-full transition-all",
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? "bg-orange-100 text-orange-700 border-orange-200 shadow-sm"
                    : "hover:bg-muted"
                )}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDate(1)}
                className={cn(
                  "text-xs h-8 px-3 rounded-full transition-all",
                  selectedDate === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    ? "bg-green-100 text-green-700 border-green-200 shadow-sm"
                    : "hover:bg-muted"
                )}
              >
                Tomorrow
              </Button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('prev')}
                className="h-7 w-7 p-0 hover:bg-background hover:shadow-sm rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex-1 h-7 justify-center text-xs font-medium hover:bg-background hover:shadow-sm rounded-md"
                  >
                    <CalendarDays className="mr-2 h-3.5 w-3.5 opacity-70" />
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DayPicker
                    mode="single"
                    selected={new Date(selectedDate)}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date.toISOString().split('T')[0]);
                      }
                    }}
                    className="rounded-md border shadow-lg"
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('next')}
                className="h-7 w-7 p-0 hover:bg-background hover:shadow-sm rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-3">
          {displayOrders.map((order, index) => {
            const dueStatus = getDueStatus(order.pickupDate);
            return (
              <div
                key={order.id || index}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/5 hover:shadow-md transition-all duration-200 gap-3"
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm mt-1">
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {order.customerName ?
                        order.customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) :
                        'NA'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="text-sm font-semibold leading-none truncate text-foreground">
                        {order.customerName || 'Unknown Customer'}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px] px-1.5 py-0 h-5 font-medium border", getStatusColor(order.status))}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </Badge>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted/50 px-1 rounded">
                        #{order.orderNumber || (order.id ? order.id.slice(-8) : 'N/A')}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-foreground/80">
                        {order.service || 'Dry Cleaning'}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 pt-1">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2 py-0.5 h-auto font-medium border", getPaymentStatusColor(order.paymentStatus))}
                      >
                        {order.paymentStatus === 'paid' ? 'Paid' : `Payment: ${order.paymentStatus}`}
                      </Badge>

                      {/* Enhanced Due Date Tag */}
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2 py-0.5 h-auto font-medium border shadow-sm", dueStatus.color)}
                      >
                        <span className="flex items-center gap-1">
                          {dueStatus.icon}
                          {dueStatus.label}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">
                      {formatCurrency(order.total || 0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Total Amount</div>
                  </div>
                  <Link to={order.id ? `/orders/${order.id}` : '#'}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
