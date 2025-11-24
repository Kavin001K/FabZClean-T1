import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { safeGetInitials, safeSlice } from "@/lib/safe-utils";
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
  Clock,
  Sparkles,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition, FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/page-transition";
import SalesChart from "@/components/dashboard/sales-chart";
import RevenueChartRealtime from "@/components/dashboard/revenue-chart-realtime";
import RecentOrders from "@/components/dashboard/recent-orders";
import DueTodayOrders from "@/components/dashboard/due-today-orders";
import KpiCard from "@/components/dashboard/kpi-card";
import OrderStatusChart from "@/components/dashboard/order-status-chart";
import ServicePopularityChart from "@/components/dashboard/service-popularity-chart";
import DateRangeFilter from "@/components/dashboard/date-range-filter";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboard } from "@/hooks/use-dashboard";
import { analyticsApi, ordersApi, customersApi, employeesApi, formatCurrency } from '@/lib/data-service';
import { exportDashboardReport } from '@/lib/enhanced-pdf-export';
import { exportDashboardToExcel } from '@/lib/excel-exports';
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
    dueTodayOrders,
    customers,
    ordersTodayCount,
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

  // Form submission states
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  // Date range handler
  const handleDateRangeChange = useCallback((dateRange: DateRange) => {
    updateFilters({ dateRange });
  }, [updateFilters]);

  const handleSaveCustomer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingCustomer) return;

    setIsSubmittingCustomer(true);
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

        // Refresh dashboard data and customers list
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });

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
    } finally {
      setIsSubmittingCustomer(false);
    }
  }, [quickActionForms.customer, toast, queryClient, resetQuickActionForm, isSubmittingCustomer]);

  const handleSaveOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrder) return;

    setIsSubmittingOrder(true);
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

        // Refresh dashboard data and orders list
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/recent-orders"] });

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
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [quickActionForms.order, toast, queryClient, resetQuickActionForm, isSubmittingOrder]);

  const handleSaveEmployee = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEmployee) return;

    setIsSubmittingEmployee(true);
    try {
      const employeeData = {
        name: quickActionForms.employee.name,
        phone: quickActionForms.employee.phone,
        email: quickActionForms.employee.email,
        position: quickActionForms.employee.position,
        salary: parseFloat(quickActionForms.employee.salary).toString(),
        joinDate: new Date().toISOString(),
        status: 'active'
      };

      const newEmployee = await employeesApi.create(employeeData);

      if (newEmployee) {
        toast({
          title: "Success!",
          description: `Employee ${newEmployee.name} has been created successfully.`,
        });

        // Refresh dashboard data and employees list
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard/metrics"] });

        // Reset form
        resetQuickActionForm('employee');
        setIsEmployeeDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      toast({
        title: "Error",
        description: "Failed to create employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingEmployee(false);
    }
  }, [quickActionForms.employee, toast, queryClient, resetQuickActionForm, isSubmittingEmployee]);

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
          <RevenueChartRealtime height={200} showArea />
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
              <p className="text-2xl font-bold">{ordersTodayCount}</p>
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
              {safeSlice(customers, 0, 5).map((customer) => (
                <div key={customer.id} className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {safeGetInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{customer.name || 'Unknown Customer'}</span>
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
    <PageTransition>
      <div className="min-h-screen bg-background gradient-mesh">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-8 w-8 text-primary" />
                </motion.div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Franchise Owner Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground mt-1 text-lg">
                Welcome back! Here's what's happening with your business today.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => {
                    const dashboardData = {
                      metrics,
                      recentOrders,
                      topCustomers: (Array.isArray(customers) ? customers : []).slice(0, 10),
                      salesData,
                      servicePopularity: servicePopularityData,
                    };
                    exportDashboardToExcel(dashboardData);
                    toast({
                      title: "Dashboard Exported",
                      description: "Excel report has been downloaded successfully",
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover-lift"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => {
                    exportDashboardReport(metrics);
                    toast({
                      title: "Dashboard Report Exported",
                      description: "PDF report has been downloaded successfully",
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover-lift"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={refreshData}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover-lift"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </motion.div>
              {lastUpdated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs text-muted-foreground flex items-center gap-1 bg-card px-3 py-2 rounded-lg border"
                >
                  <Clock className="h-3 w-3" />
                  Updated {lastUpdated.toLocaleTimeString()}
                </motion.div>
              )}
            </div>
          </motion.div>

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
          <FadeIn delay={0.2}>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚡
                </motion.div>
                Quick Actions
              </h2>
              {isLoading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <LoadingSkeleton.QuickActionSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <StaggerChildren>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {/* Transit Order Quick Action */}
                    <StaggerItem>
                      <Link to="/transit-orders">
                        <motion.div
                          whileHover={{ scale: 1.03, y: -5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Card className="cursor-pointer hover:shadow-xl hover-glow transition-all duration-300 border-2 hover:border-primary/50 glass">
                            <CardContent className="p-6 flex items-center gap-4">
                              <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="bg-primary/10 p-3 rounded-xl"
                              >
                                <Truck className="h-8 w-8 text-primary" />
                              </motion.div>
                              <div>
                                <h3 className="font-semibold text-lg">Transit Orders</h3>
                                <p className="text-sm text-muted-foreground">Manage delivery & logistics</p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Link>
                    </StaggerItem>

                    {/* New Customer Quick Action */}
                    <StaggerItem>
                      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                        <DialogTrigger asChild>
                          <motion.div
                            whileHover={{ scale: 1.03, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <Card className="cursor-pointer hover:shadow-xl hover-glow transition-all duration-300 border-2 hover:border-primary/50 glass">
                              <CardContent className="p-6 flex items-center gap-4">
                                <motion.div
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                  className="bg-accent/10 p-3 rounded-xl"
                                >
                                  <UserPlus className="h-8 w-8 text-accent" />
                                </motion.div>
                                <div>
                                  <h3 className="font-semibold text-lg">New Customer</h3>
                                  <p className="text-sm text-muted-foreground">Add a new customer profile</p>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                            <DialogDescription>
                              Create a new customer profile for order management.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSaveCustomer} className="py-4 space-y-4" aria-label="Add new customer form">
                            <div>
                              <Label htmlFor="customerName">Name</Label>
                              <Input
                                id="customerName"
                                name="name"
                                placeholder="e.g., Jane Doe"
                                value={quickActionForms.customer.name}
                                onChange={(e) => updateQuickActionForm('customer', { name: e.target.value })}
                                required
                                aria-required="true"
                                aria-label="Customer name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="customerPhone">Phone</Label>
                              <Input
                                id="customerPhone"
                                name="phone"
                                type="tel"
                                placeholder="e.g., +91 98765 43210"
                                value={quickActionForms.customer.phone}
                                onChange={(e) => updateQuickActionForm('customer', { phone: e.target.value })}
                                required
                                aria-required="true"
                                aria-label="Customer phone number"
                              />
                            </div>
                            <div>
                              <Label htmlFor="customerEmail">Email (Optional)</Label>
                              <Input
                                id="customerEmail"
                                name="email"
                                type="email"
                                placeholder="e.g., jane@example.com"
                                value={quickActionForms.customer.email}
                                onChange={(e) => updateQuickActionForm('customer', { email: e.target.value })}
                                aria-label="Customer email (optional)"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1" disabled={isSubmittingCustomer}>
                                {isSubmittingCustomer ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save Customer'
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCustomerDialogOpen(false)}
                                disabled={isSubmittingCustomer}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </StaggerItem>

                    {/* New Employee Quick Action */}
                    <StaggerItem>
                      <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                        <DialogTrigger asChild>
                          <motion.div
                            whileHover={{ scale: 1.03, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <Card className="cursor-pointer hover:shadow-xl hover-glow transition-all duration-300 border-2 hover:border-success/50 glass">
                              <CardContent className="p-6 flex items-center gap-4">
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                  className="bg-success/10 p-3 rounded-xl"
                                >
                                  <Users className="h-8 w-8 text-success" />
                                </motion.div>
                                <div>
                                  <h3 className="font-semibold text-lg">New Employee</h3>
                                  <p className="text-sm text-muted-foreground">Add a new employee</p>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                              Register a new employee in the system.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSaveEmployee} className="py-4 space-y-4" aria-label="Add new employee form">
                            <div>
                              <Label htmlFor="employeeName">Name</Label>
                              <Input
                                id="employeeName"
                                name="name"
                                placeholder="e.g., John Smith"
                                value={quickActionForms.employee.name}
                                onChange={(e) => updateQuickActionForm('employee', { name: e.target.value })}
                                required
                                aria-required="true"
                                aria-label="Employee name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="employeePhone">Phone</Label>
                              <Input
                                id="employeePhone"
                                name="phone"
                                type="tel"
                                placeholder="e.g., +91 98765 43210"
                                value={quickActionForms.employee.phone}
                                onChange={(e) => updateQuickActionForm('employee', { phone: e.target.value })}
                                required
                                aria-required="true"
                                aria-label="Employee phone number"
                              />
                            </div>
                            <div>
                              <Label htmlFor="employeeEmail">Email</Label>
                              <Input
                                id="employeeEmail"
                                name="email"
                                type="email"
                                placeholder="e.g., john@fabzclean.com"
                                value={quickActionForms.employee.email}
                                onChange={(e) => updateQuickActionForm('employee', { email: e.target.value })}
                                required
                                aria-required="true"
                                aria-label="Employee email"
                              />
                            </div>
                            <div>
                              <Label htmlFor="employeePosition">Position</Label>
                              <Input
                                id="employeePosition"
                                name="position"
                                placeholder="e.g., Driver, Manager"
                                value={quickActionForms.employee.position}
                                onChange={(e) => updateQuickActionForm('employee', { position: e.target.value })}
                                required
                                aria-required="true"
                                aria-label="Employee position"
                              />
                            </div>
                            <div>
                              <Label htmlFor="employeeSalary">Salary (₹)</Label>
                              <Input
                                id="employeeSalary"
                                name="salary"
                                type="number"
                                placeholder="e.g., 25000"
                                value={quickActionForms.employee.salary}
                                onChange={(e) => updateQuickActionForm('employee', { salary: e.target.value })}
                                required
                                aria-required="true"
                                aria-label="Employee salary"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1" disabled={isSubmittingEmployee}>
                                {isSubmittingEmployee ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save Employee'
                                )}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setIsEmployeeDialogOpen(false)} disabled={isSubmittingEmployee}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </StaggerItem>

                    {/* Advanced Order Creation */}
                    <StaggerItem>
                      <Link to="/create-order">
                        <motion.div
                          whileHover={{ scale: 1.03, y: -5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Card className="cursor-pointer hover:shadow-xl hover-glow transition-all duration-300 border-2 hover:border-warning/50 glass">
                            <CardContent className="p-6 flex items-center gap-4">
                              <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="bg-warning/10 p-3 rounded-xl"
                              >
                                <ShoppingBag className="h-8 w-8 text-warning" />
                              </motion.div>
                              <div>
                                <h3 className="font-semibold text-lg">Advanced Order</h3>
                                <p className="text-sm text-muted-foreground">Create order with full details</p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Link>
                    </StaggerItem>
                  </div>
                </StaggerChildren>
              )}
            </div>
          </FadeIn>

          {/* KPI Cards Section */}
          <FadeIn delay={0.3}>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  📊
                </motion.div>
                Key Performance Indicators
              </h2>
              {isLoading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <LoadingSkeleton.KpiCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <StaggerChildren>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {kpiCards.map((kpi, index) => (
                      <StaggerItem key={kpi.title}>
                        <motion.div
                          whileHover={{ scale: 1.02, y: -5 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <KpiCard
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
                        </motion.div>
                      </StaggerItem>
                    ))}
                  </div>
                </StaggerChildren>
              )}
            </div>
          </FadeIn>

          {/* Charts Section */}
          <FadeIn delay={0.4}>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Sales Chart */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="col-span-1 lg:col-span-2"
              >
                <RevenueChartRealtime
                  title="Revenue Trend"
                  className="hover-lift"
                  showArea={true}
                />
              </motion.div>

              {/* Order Status Chart */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <OrderStatusChart
                  data={orderStatusData}
                  isLoading={isLoading}
                />
              </motion.div>

              {/* Service Popularity Chart */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <ServicePopularityChart
                  data={servicePopularityData}
                  isLoading={isLoading}
                />
              </motion.div>
            </div>
          </FadeIn>

          {/* Recent Orders and Due Today */}
          <FadeIn delay={0.5}>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <RecentOrders
                  orders={recentOrders}
                  isLoading={isLoading}
                  limit={5}
                />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <DueTodayOrders
                  orders={dueTodayOrders}
                  isLoading={isLoading}
                  limit={5}
                  showDateSelector={true}
                />
              </motion.div>
            </div>
          </FadeIn>

          {/* Additional Stats */}
          <FadeIn delay={0.6}>
            <div className="grid gap-6 grid-cols-1">
              {/* Quick Stats Card */}
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="hover:shadow-xl transition-shadow duration-300 glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                      </motion.div>
                      Today's Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-6 rounded-xl gradient-primary text-white shadow-lg"
                      >
                        <motion.div
                          className="text-3xl font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.7 }}
                        >
                          {Math.floor(metrics.totalOrders / 30)}
                        </motion.div>
                        <div className="text-sm opacity-90">Orders Today</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-6 rounded-xl gradient-accent text-white shadow-lg"
                      >
                        <motion.div
                          className="text-3xl font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.8 }}
                        >
                          ₹{Math.floor(metrics.totalRevenue / 30).toLocaleString()}
                        </motion.div>
                        <div className="text-sm opacity-90">Revenue Today</div>
                      </motion.div>
                    </div>

                    <div className="space-y-3">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm text-muted-foreground">Orders Completed</span>
                        <span className="text-sm font-semibold text-success">
                          {Math.floor(metrics.totalOrders * 0.85)}
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm text-muted-foreground">Pending Orders</span>
                        <span className="text-sm font-semibold text-warning">
                          {Math.floor(metrics.totalOrders * 0.15)}
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm text-muted-foreground">New Customers</span>
                        <span className="text-sm font-semibold text-primary">
                          {Math.floor(metrics.newCustomers / 30)}
                        </span>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
});