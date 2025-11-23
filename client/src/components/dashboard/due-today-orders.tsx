import React, { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/data-service";
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Calendar, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
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
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'delivered';
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

const getStatusIcon = (status: DueTodayOrder['status']) => {
  switch (status) {
    case 'pending': return <Clock className="h-3 w-3" />;
    case 'processing': return <AlertCircle className="h-3 w-3" />;
    case 'completed': 
    case 'delivered': return <CheckCircle className="h-3 w-3" />;
    case 'cancelled': return <XCircle className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
};

const getStatusColor = (status: DueTodayOrder['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed': 
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusColor = (status: DueTodayOrder['paymentStatus']) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 border-green-200';
    case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
  if (isOverdue(pickupDate)) return { label: 'Overdue', color: 'text-red-600 bg-red-50 border-red-200' };
  if (isDueToday(pickupDate)) return { label: 'Due Today', color: 'text-orange-600 bg-orange-50 border-orange-200' };
  if (isDueTomorrow(pickupDate)) return { label: 'Due Tomorrow', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  return { label: 'Upcoming', color: 'text-gray-600 bg-gray-50 border-gray-200' };
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
      <Card className={className}>
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {getDateDisplayText()}
            </CardTitle>
            {showViewAll && (
              <Link to="/orders?filter=due">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
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
                    "text-xs",
                    selectedDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] && "bg-blue-100 text-blue-700"
                  )}
                >
                  Yesterday
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(0)}
                  className={cn(
                    "text-xs",
                    selectedDate === new Date().toISOString().split('T')[0] && "bg-orange-100 text-orange-700"
                  )}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(1)}
                  className={cn(
                    "text-xs",
                    selectedDate === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] && "bg-green-100 text-green-700"
                  )}
                >
                  Tomorrow
                </Button>
              </div>
              
              {/* Date Navigation with Calendar */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 h-8 justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
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
                      className="rounded-md border"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-lg font-medium">No orders {getDateDisplayText().toLowerCase()}</p>
              <p className="text-sm">All caught up! 🎉</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {getDateDisplayText()} ({displayOrders.length})
          </CardTitle>
          {showViewAll && (
            <Link to="/orders?filter=due">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
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
                  "text-xs",
                  selectedDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] && "bg-blue-100 text-blue-700"
                )}
              >
                Yesterday
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDate(0)}
                className={cn(
                  "text-xs",
                  selectedDate === new Date().toISOString().split('T')[0] && "bg-orange-100 text-orange-700"
                )}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDate(1)}
                className={cn(
                  "text-xs",
                  selectedDate === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] && "bg-green-100 text-green-700"
                )}
              >
                Tomorrow
              </Button>
            </div>
            
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 h-8 justify-start text-left font-normal"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
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
                    className="rounded-md border"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayOrders.map((order, index) => {
            const dueStatus = getDueStatus(order.pickupDate);
            return (
              <div 
                key={order.id || index} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">
                      {order.customerName ? 
                        order.customerName.split(' ').map(n => n[0]).join('').toUpperCase() :
                        'N/A'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-medium leading-none truncate">
                        {order.customerName || 'Unknown Customer'}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs border", getStatusColor(order.status))}
                      >
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <p className="text-xs text-muted-foreground">
                        #{order.orderNumber || (order.id ? order.id.slice(-8) : 'N/A')}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {order.service || 'Dry Cleaning'}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : 'No Date'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs border w-fit", getPaymentStatusColor(order.paymentStatus))}
                      >
                        Payment: {order.paymentStatus || 'Unknown'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs border w-fit", dueStatus.color)}
                      >
                        {dueStatus.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {formatCurrency(order.total || 0)}
                    </div>
                  </div>
                  <Link to={order.id ? `/orders/${order.id}` : '#'}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View
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
