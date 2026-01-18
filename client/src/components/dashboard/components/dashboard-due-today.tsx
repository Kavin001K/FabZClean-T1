import React, { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/data-service";
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Calendar, ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, Package, TrendingUp } from "lucide-react";
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
  status: string;
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
    default: return <Clock className="h-3 w-3" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
    case 'completed':
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getPaymentStatusColor = (status: DueTodayOrder['paymentStatus']) => {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'partial': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
    case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
    case 'failed': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
  }
};

// Helper functions
const normalizeDate = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isOverdue = (pickupDate: string, status: string) => {
  if (status === 'completed' || status === 'delivered' || status === 'cancelled') return false;
  const today = normalizeDate(new Date());
  const pickup = normalizeDate(new Date(pickupDate));
  return pickup < today;
};

const isDueToday = (pickupDate: string) => {
  const today = normalizeDate(new Date());
  const pickup = normalizeDate(new Date(pickupDate));
  return pickup.getTime() === today.getTime();
};

const isDueTomorrow = (pickupDate: string) => {
  const tomorrow = normalizeDate(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pickup = normalizeDate(new Date(pickupDate));
  return pickup.getTime() === tomorrow.getTime();
};

const isUpcoming = (pickupDate: string, daysAhead: number = 7) => {
  const today = normalizeDate(new Date());
  const future = normalizeDate(new Date());
  future.setDate(future.getDate() + daysAhead);
  const pickup = normalizeDate(new Date(pickupDate));
  return pickup > today && pickup <= future;
};

const getDaysUntilDue = (pickupDate: string) => {
  const today = normalizeDate(new Date());
  const pickup = normalizeDate(new Date(pickupDate));
  return Math.ceil((pickup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export default React.memo(function DueTodayOrders({
  orders = [],
  isLoading = false,
  limit = 10,
  showViewAll = true,
  showDateSelector = true,
  className
}: DueTodayOrdersProps) {
  const [activeTab, setActiveTab] = useState<string>("today");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Categorize orders
  const categorizedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return { overdue: [], today: [], tomorrow: [], upcoming: [] };

    const overdue: DueTodayOrder[] = [];
    const today: DueTodayOrder[] = [];
    const tomorrow: DueTodayOrder[] = [];
    const upcoming: DueTodayOrder[] = [];

    orders.forEach(order => {
      if (!order.pickupDate) return;

      if (isOverdue(order.pickupDate, order.status)) {
        overdue.push(order);
      } else if (isDueToday(order.pickupDate)) {
        today.push(order);
      } else if (isDueTomorrow(order.pickupDate)) {
        tomorrow.push(order);
      } else if (isUpcoming(order.pickupDate, 7)) {
        upcoming.push(order);
      }
    });

    // Sort overdue by most overdue first
    overdue.sort((a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime());
    // Sort upcoming by nearest first
    upcoming.sort((a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime());

    return { overdue, today, tomorrow, upcoming };
  }, [orders]);

  // Filter by specific date for calendar view
  const dateFilteredOrders = useMemo(() => {
    if (!orders) return [];
    const targetDate = normalizeDate(new Date(selectedDate));
    return orders.filter(order => {
      if (!order.pickupDate) return false;
      const pickup = normalizeDate(new Date(order.pickupDate));
      return pickup.getTime() === targetDate.getTime();
    });
  }, [orders, selectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const getCurrentOrders = () => {
    switch (activeTab) {
      case 'overdue': return categorizedOrders.overdue;
      case 'today': return categorizedOrders.today;
      case 'tomorrow': return categorizedOrders.tomorrow;
      case 'upcoming': return categorizedOrders.upcoming;
      case 'calendar': return dateFilteredOrders;
      default: return categorizedOrders.today;
    }
  };

  const displayOrders = getCurrentOrders().slice(0, limit);

  const renderOrderCard = (order: DueTodayOrder, index: number) => {
    const daysUntil = getDaysUntilDue(order.pickupDate);
    const isOverdueOrder = isOverdue(order.pickupDate, order.status);

    return (
      <div
        key={order.id || index}
        className={cn(
          "group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-card hover:shadow-md transition-all duration-200 gap-3",
          isOverdueOrder && "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20"
        )}
      >
        <div className="flex items-start space-x-3">
          <Avatar className={cn(
            "h-10 w-10 border-2 shadow-sm mt-1",
            isOverdueOrder ? "border-red-300" : "border-background"
          )}>
            <AvatarFallback className={cn(
              "text-xs font-bold",
              isOverdueOrder ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"
            )}>
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

              {/* Due Date Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 h-auto font-medium border shadow-sm",
                  isOverdueOrder
                    ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400"
                    : daysUntil === 0
                      ? "bg-orange-100 text-orange-700 border-orange-300"
                      : daysUntil === 1
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-green-100 text-green-700 border-green-300"
                )}
              >
                <span className="flex items-center gap-1">
                  {isOverdueOrder ? (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Overdue {Math.abs(daysUntil)} days
                    </>
                  ) : daysUntil === 0 ? (
                    <>
                      <Clock className="h-3 w-3" />
                      Due Today
                    </>
                  ) : daysUntil === 1 ? (
                    <>
                      <Calendar className="h-3 w-3" />
                      Due Tomorrow
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3 w-3" />
                      Due in {daysUntil} days
                    </>
                  )}
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
            <div className="text-[10px] text-muted-foreground">
              {new Date(order.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <Link to={order.id ? `/orders/${order.id}` : '#'}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Order Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton.TableSkeleton rows={5} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Order Schedule
          </CardTitle>
          {showViewAll && (
            <Link to="/orders">
              <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10 hover:text-primary">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View All
              </Button>
            </Link>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div
            className={cn(
              "p-2 rounded-lg text-center cursor-pointer transition-all border",
              activeTab === 'overdue' ? "bg-red-100 border-red-300 shadow-sm" : "bg-red-50 hover:bg-red-100 border-transparent"
            )}
            onClick={() => setActiveTab('overdue')}
          >
            <div className="text-lg font-bold text-red-600">{categorizedOrders.overdue.length}</div>
            <div className="text-[10px] text-red-700 font-medium">Overdue</div>
          </div>
          <div
            className={cn(
              "p-2 rounded-lg text-center cursor-pointer transition-all border",
              activeTab === 'today' ? "bg-orange-100 border-orange-300 shadow-sm" : "bg-orange-50 hover:bg-orange-100 border-transparent"
            )}
            onClick={() => setActiveTab('today')}
          >
            <div className="text-lg font-bold text-orange-600">{categorizedOrders.today.length}</div>
            <div className="text-[10px] text-orange-700 font-medium">Today</div>
          </div>
          <div
            className={cn(
              "p-2 rounded-lg text-center cursor-pointer transition-all border",
              activeTab === 'tomorrow' ? "bg-blue-100 border-blue-300 shadow-sm" : "bg-blue-50 hover:bg-blue-100 border-transparent"
            )}
            onClick={() => setActiveTab('tomorrow')}
          >
            <div className="text-lg font-bold text-blue-600">{categorizedOrders.tomorrow.length}</div>
            <div className="text-[10px] text-blue-700 font-medium">Tomorrow</div>
          </div>
          <div
            className={cn(
              "p-2 rounded-lg text-center cursor-pointer transition-all border",
              activeTab === 'upcoming' ? "bg-green-100 border-green-300 shadow-sm" : "bg-green-50 hover:bg-green-100 border-transparent"
            )}
            onClick={() => setActiveTab('upcoming')}
          >
            <div className="text-lg font-bold text-green-600">{categorizedOrders.upcoming.length}</div>
            <div className="text-[10px] text-green-700 font-medium">This Week</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-3">
            <TabsTrigger value="overdue" className="text-xs data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </TabsTrigger>
            <TabsTrigger value="today" className="text-xs data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <Clock className="h-3 w-3 mr-1" />
              Today
            </TabsTrigger>
            <TabsTrigger value="tomorrow" className="text-xs data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              Tomorrow
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Calendar className="h-3 w-3 mr-1" />
              Week
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs">
              <CalendarDays className="h-3 w-3 mr-1" />
              Pick Date
            </TabsTrigger>
          </TabsList>

          {/* Calendar Date Picker (only visible when calendar tab is active) */}
          {activeTab === 'calendar' && showDateSelector && (
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border mb-3">
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
                <PopoverContent className="w-auto p-0" align="center">
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
          )}

          {displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-muted-foreground/20">
              <div className="bg-background p-3 rounded-full shadow-sm mb-3">
                <CheckCircle className="h-8 w-8 text-green-500/80" />
              </div>
              <p className="text-base font-medium text-foreground/80">All Caught Up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === 'overdue' && "No overdue orders"}
                {activeTab === 'today' && "No orders due today"}
                {activeTab === 'tomorrow' && "No orders due tomorrow"}
                {activeTab === 'upcoming' && "No upcoming orders this week"}
                {activeTab === 'calendar' && `No orders on ${new Date(selectedDate).toLocaleDateString()}`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayOrders.map((order, index) => renderOrderCard(order, index))}

              {getCurrentOrders().length > limit && (
                <div className="text-center pt-2">
                  <Link to="/orders">
                    <Button variant="outline" size="sm" className="text-xs">
                      View {getCurrentOrders().length - limit} more orders
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
});
