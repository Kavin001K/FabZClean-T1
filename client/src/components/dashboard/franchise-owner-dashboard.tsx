import React, { useState, useCallback, useMemo } from "react";
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  Package, 
  ClipboardCheck, 
  ShoppingBag, 
  PlusCircle, 
  UserPlus, 
  Truck,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import KpiCard from "@/components/dashboard/kpi-card";
import OrderStatusChart from "@/components/dashboard/order-status-chart";
import ServicePopularityChart from "@/components/dashboard/service-popularity-chart";
import DateRangeFilter from "@/components/dashboard/date-range-filter";
import { 
  KpiCardSkeleton, 
  ChartSkeleton, 
  QuickActionSkeleton 
} from "@/components/ui/loading-skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboard } from "@/hooks/use-dashboard";
import { analyticsApi, ordersApi, customersApi, formatCurrency } from '@/lib/data-service';
import { DateRange } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export default React.memo(function FranchiseOwnerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use the enhanced dashboard hook
  const {
    filters,
    quickActionForms,
    metrics,
    salesData,
    orderStatusData,
    servicePopularityData,
    recentOrders,
    customers,
    isLoading,
    hasData,
    lastUpdated,
    updateFilters,
    refreshData,
    updateQuickActionForm,
    resetQuickActionForm,
  } = useDashboard();

  // Dialog states
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

  // Date range handler
  const handleDateRangeChange = useCallback((dateRange: DateRange) => {
    updateFilters({ dateRange });
  }, [updateFilters]);

  const handleSaveCustomer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerData = {
        name: quickActionForms.customer.name,
        phone: quickActionForms.customer.phone,
        email: quickActionForms.customer.email || undefined,
        joinDate: new Date().toISOString(),
        totalSpent: 0,
        loyaltyPoints: 0
      };

      const newCustomer = await customersApi.create(customerData);
      
      if (newCustomer) {
        toast({
          title: "Success!",
          description: `Customer ${newCustomer.name} has been created successfully.`,
        });
        
        // Refresh dashboard data
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        
        // Reset form
        resetQuickActionForm('customer');
        setIsCustomerDialogOpen(false);
      }
      } catch (error) {
      console.error('Failed to create customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    }
  }, [quickActionForms.customer, toast, queryClient, resetQuickActionForm]);

  const handleSaveOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const orderData = {
        customerName: quickActionForms.order.customerName,
        customerPhone: quickActionForms.order.customerPhone,
        customerEmail: undefined,
        serviceId: quickActionForms.order.service,
        quantity: quickActionForms.order.quantity,
        pickupDate: quickActionForms.order.pickupDate,
        status: 'pending',
        paymentStatus: 'pending',
        totalAmount: 0, // Will be calculated by server
        orderNumber: `ORD-${Date.now()}`
      };

      const newOrder = await ordersApi.create(orderData);
      
      if (newOrder) {
        toast({
          title: "Success!",
          description: `Order ${newOrder.orderNumber} has been created successfully.`,
        });
        
        // Refresh dashboard data
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        
        // Reset form
        resetQuickActionForm('order');
        setIsOrderDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  }, [quickActionForms.order, toast, queryClient, resetQuickActionForm]);

  const handleSaveEmployee = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employeeData = {
        name: quickActionForms.employee.name,
        phone: quickActionForms.employee.phone,
        email: quickActionForms.employee.email,
        position: quickActionForms.employee.position,
        salary: parseFloat(quickActionForms.employee.salary),
        joinDate: new Date().toISOString(),
        status: 'active'
      };

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (response.ok) {
    toast({
      title: "Success!",
          description: `Employee ${quickActionForms.employee.name} has been created successfully.`,
        });
        
        // Refresh dashboard data
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        
        // Reset form
        resetQuickActionForm('employee');
        setIsEmployeeDialogOpen(false);
      } else {
        throw new Error('Failed to create employee');
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      toast({
        title: "Error",
        description: "Failed to create employee. Please try again.",
        variant: "destructive",
      });
    }
  }, [quickActionForms.employee, toast, queryClient, resetQuickActionForm]);

  // Memoized KPI cards with proper data
  const kpiCards = useMemo(() => [
    {
      title: "Total Revenue",
      value: metrics.totalRevenue,
      change: "+12.5% from last month",
      changeType: "positive" as const,
      icon: <DollarSign className="h-4 w-4" />,
      description: "Total revenue generated from all orders",
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.averageOrderValue || 0)}</p>
            </div>
          </div>
          <SalesChart data={salesData} height={200} showArea />
        </div>
      ),
    },
    {
      title: "Total Orders",
      value: metrics.totalOrders,
      change: "+8.2% from last month",
      changeType: "positive" as const,
      icon: <Package className="h-4 w-4" />,
      description: "Total number of orders received",
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{metrics.totalOrders}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orders Today</p>
              <p className="text-2xl font-bold">{Math.floor(metrics.totalOrders / 30)}</p>
            </div>
          </div>
          <OrderStatusChart data={orderStatusData} />
        </div>
      ),
    },
    {
      title: "New Customers",
      value: metrics.newCustomers,
      change: "+15.3% from last month",
      changeType: "positive" as const,
      icon: <Users className="h-4 w-4" />,
      description: "New customers registered this month",
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{metrics.newCustomers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Recent Customers</h4>
            <div className="space-y-2">
              {customers.slice(0, 5).map((customer) => (
                <div key={customer.id} className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{customer.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "On-Time Delivery",
      value: `${metrics.onTimeDelivery || 95}%`,
      change: "+2.1% from last month",
      changeType: "positive" as const,
      icon: <Truck className="h-4 w-4" />,
      description: "Percentage of orders delivered on time",
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{metrics.onTimeDelivery || 95}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
              <p className="text-2xl font-bold">{metrics.customerSatisfaction || 4.2}/5</p>
            </div>
          </div>
          <ServicePopularityChart data={servicePopularityData} />
        </div>
      ),
    },
  ], [metrics, salesData, orderStatusData, servicePopularityData, customers]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Franchise Owner Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={refreshData}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {lastUpdated && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <DateRangeFilter 
            dateRange={filters.dateRange}
            onDateRangeChange={handleDateRangeChange}
            className="w-96"
          />
        </div>

        {/* Quick Actions Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          {isLoading ? (
            <div className="grid gap-4 grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <QuickActionSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-4">
              {/* New Order Quick Action */}
              <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="hover:bg-muted/50 transition-all duration-200 cursor-pointer hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <PlusCircle className="h-8 w-8 text-primary" />
                <div>
                        <h3 className="font-semibold">Quick Order</h3>
                  <p className="text-sm text-muted-foreground">Create a new service order</p>
                </div>
              </CardContent>
            </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveOrder} className="py-4 space-y-4">
                    <div>
                      <Label htmlFor="orderCustomerName">Customer Name</Label>
                      <Input 
                        id="orderCustomerName" 
                        placeholder="e.g., Jane Doe" 
                        value={quickActionForms.order.customerName}
                        onChange={(e) => updateQuickActionForm('order', { customerName: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="orderCustomerPhone">Customer Phone</Label>
                      <Input 
                        id="orderCustomerPhone" 
                        type="tel" 
                        placeholder="e.g., +91 98765 43210" 
                        value={quickActionForms.order.customerPhone}
                        onChange={(e) => updateQuickActionForm('order', { customerPhone: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="orderService">Service</Label>
                      <Input 
                        id="orderService" 
                        placeholder="e.g., Dry Cleaning" 
                        value={quickActionForms.order.service}
                        onChange={(e) => updateQuickActionForm('order', { service: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="orderQuantity">Quantity</Label>
                      <Input 
                        id="orderQuantity" 
                        type="number" 
                        min="1"
                        value={quickActionForms.order.quantity}
                        onChange={(e) => updateQuickActionForm('order', { quantity: parseInt(e.target.value) || 1 })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="orderPickupDate">Pickup Date</Label>
                      <Input 
                        id="orderPickupDate" 
                        type="date" 
                        value={quickActionForms.order.pickupDate}
                        onChange={(e) => updateQuickActionForm('order', { pickupDate: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Create Order</Button>
                      <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* New Customer Quick Action */}
          <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
            <DialogTrigger asChild>
                  <Card className="hover:bg-muted/50 transition-all duration-200 cursor-pointer hover:shadow-md">
                <CardContent className="p-4 flex items-center gap-4">
                  <UserPlus className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">New Customer</h3>
                    <p className="text-sm text-muted-foreground">Add a new customer profile</p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
                <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveCustomer} className="py-4 space-y-4">
                <div>
                  <Label htmlFor="customerName">Name</Label>
                      <Input 
                        id="customerName" 
                        placeholder="e.g., Jane Doe" 
                        value={quickActionForms.customer.name}
                        onChange={(e) => updateQuickActionForm('customer', { name: e.target.value })}
                        required 
                      />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                      <Input 
                        id="customerPhone" 
                        type="tel" 
                        placeholder="e.g., +91 98765 43210" 
                        value={quickActionForms.customer.phone}
                        onChange={(e) => updateQuickActionForm('customer', { phone: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email (Optional)</Label>
                      <Input 
                        id="customerEmail" 
                        type="email" 
                        placeholder="e.g., jane@example.com" 
                        value={quickActionForms.customer.email}
                        onChange={(e) => updateQuickActionForm('customer', { email: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Save Customer</Button>
                      <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* New Employee Quick Action */}
              <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="hover:bg-muted/50 transition-all duration-200 cursor-pointer hover:shadow-md">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">New Employee</h3>
                        <p className="text-sm text-muted-foreground">Add a new employee</p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveEmployee} className="py-4 space-y-4">
                    <div>
                      <Label htmlFor="employeeName">Name</Label>
                      <Input 
                        id="employeeName" 
                        placeholder="e.g., John Smith" 
                        value={quickActionForms.employee.name}
                        onChange={(e) => updateQuickActionForm('employee', { name: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeePhone">Phone</Label>
                      <Input 
                        id="employeePhone" 
                        type="tel" 
                        placeholder="e.g., +91 98765 43210" 
                        value={quickActionForms.employee.phone}
                        onChange={(e) => updateQuickActionForm('employee', { phone: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeeEmail">Email</Label>
                      <Input 
                        id="employeeEmail" 
                        type="email" 
                        placeholder="e.g., john@fabzclean.com" 
                        value={quickActionForms.employee.email}
                        onChange={(e) => updateQuickActionForm('employee', { email: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeePosition">Position</Label>
                      <Input 
                        id="employeePosition" 
                        placeholder="e.g., Driver, Manager" 
                        value={quickActionForms.employee.position}
                        onChange={(e) => updateQuickActionForm('employee', { position: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeeSalary">Salary (₹)</Label>
                      <Input 
                        id="employeeSalary" 
                        type="number" 
                        placeholder="e.g., 25000" 
                        value={quickActionForms.employee.salary}
                        onChange={(e) => updateQuickActionForm('employee', { salary: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Save Employee</Button>
                      <Button type="button" variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

              {/* Advanced Order Creation */}
              <Link to="/create-order">
                <Card className="hover:bg-muted/50 transition-all duration-200 cursor-pointer hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                    <ShoppingBag className="h-8 w-8 text-primary" />
                <div>
                      <h3 className="font-semibold">Advanced Order</h3>
                      <p className="text-sm text-muted-foreground">Create order with full details</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
          )}
      </div>
        
        {/* KPI Cards Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
          {isLoading ? (
            <div className="grid gap-4 grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <KpiCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-4">
              {kpiCards.map((kpi, index) => (
                <KpiCard
                  key={kpi.title}
                  title={kpi.title}
                  value={kpi.value}
                  change={kpi.change}
                  changeType={kpi.changeType}
                  icon={kpi.icon}
                  description={kpi.description}
                  details={kpi.details}
                  animationDelay={index * 100}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
            </div>

        {/* Charts Section */}
        <div className="grid gap-6 grid-cols-2">
          {/* Sales Chart */}
          <SalesChart 
            data={salesData} 
            isLoading={isLoading}
            title="Revenue Trend"
            className="col-span-2"
          />
          
          {/* Order Status Chart */}
          <OrderStatusChart 
            data={orderStatusData} 
            isLoading={isLoading}
          />
          
          {/* Service Popularity Chart */}
          <ServicePopularityChart 
            data={servicePopularityData} 
            isLoading={isLoading}
        />
      </div>

        {/* Recent Orders and Activity */}
        <div className="grid gap-6 grid-cols-2">
          <RecentOrders 
            orders={recentOrders} 
            isLoading={isLoading}
            limit={5}
          />
          
          {/* Quick Stats Card */}
          <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Today's Summary
              </CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">
                    {Math.floor(metrics.totalOrders / 30)}
                  </div>
                  <div className="text-sm text-muted-foreground">Orders Today</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(metrics.totalRevenue / 30).toLocaleString()}
              </div>
                  <div className="text-sm text-muted-foreground">Revenue Today</div>
              </div>
      </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Orders Completed</span>
                  <span className="text-sm font-medium">
                    {Math.floor(metrics.totalOrders * 0.85)}
                  </span>
          </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Orders</span>
                  <span className="text-sm font-medium">
                    {Math.floor(metrics.totalOrders * 0.15)}
                  </span>
                  </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Customers</span>
                  <span className="text-sm font-medium">
                    {Math.floor(metrics.newCustomers / 30)}
                  </span>
                </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
});