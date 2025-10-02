/**
 * Franchise Owner Dashboard - Refactored Version
 * 
 * A comprehensive dashboard for franchise owners with key metrics, charts, and quick actions.
 * This refactored version uses smaller, focused components for better maintainability.
 * 
 * @component
 */

import React, { useCallback } from "react";
import { RefreshCw, Filter, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition, FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboard } from "@/hooks/use-dashboard";
import { customersApi, ordersApi, formatCurrency } from '@/lib/data-service';
import { DateRange } from "@/types/dashboard";

// Import the new split components
import { DashboardMetricsSection, createDefaultMetrics } from "@/components/dashboard/dashboard-metrics-section";
import { QuickActionsSection } from "@/components/dashboard/quick-actions-section";
import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section";
import { RecentActivitySection } from "@/components/dashboard/recent-activity-section";
import DateRangeFilter from "@/components/dashboard/date-range-filter";

/**
 * Dashboard Header Component
 * 
 * Contains the dashboard title, refresh button, and filters.
 */
const DashboardHeader: React.FC<{
  isLoading: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
  onDateRangeChange: (dateRange: DateRange) => void;
  filters: any;
}> = ({ isLoading, lastUpdated, onRefresh, onDateRangeChange, filters }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight" data-testid="dashboard-title">
          Franchise Dashboard
        </h1>
      </div>
      {lastUpdated && (
        <Badge variant="outline" className="text-xs" data-testid="last-updated-badge">
          <Clock className="h-3 w-3 mr-1" />
          Updated {new Date(lastUpdated).toLocaleTimeString()}
        </Badge>
      )}
    </div>
    
    <div className="flex items-center gap-3">
      <DateRangeFilter
        value={filters.dateRange}
        onChange={onDateRangeChange}
        data-testid="dashboard-date-filter"
      />
      <Button
        onClick={onRefresh}
        disabled={isLoading}
        variant="outline"
        size="sm"
        data-testid="refresh-dashboard-button"
        aria-label="Refresh dashboard data"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  </div>
);

/**
 * Dashboard Stats Summary Component
 * 
 * Shows a quick summary of key statistics.
 */
const DashboardStatsSummary: React.FC<{
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  isLoading: boolean;
}> = ({ totalRevenue, totalOrders, totalCustomers, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="mb-6" data-testid="dashboard-stats-loading">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6" data-testid="dashboard-stats-summary">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div data-testid="total-revenue-stat">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
          <div data-testid="total-orders-stat">
            <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
            <div className="text-sm text-muted-foreground">Total Orders</div>
          </div>
          <div data-testid="total-customers-stat">
            <div className="text-2xl font-bold text-purple-600">{totalCustomers}</div>
            <div className="text-sm text-muted-foreground">Total Customers</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Franchise Owner Dashboard Component
 */
export default React.memo(function FranchiseOwnerDashboardRefactored() {
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
    isLoading,
    lastUpdated,
    updateFilters,
    refreshData,
    setQuickActionForms,
  } = useDashboard();

  // Date range handler
  const handleDateRangeChange = useCallback((dateRange: DateRange) => {
    updateFilters({ dateRange });
  }, [updateFilters]);

  // Quick action handlers
  const handleCreateCustomer = useCallback(async () => {
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
        
        // Reset form and refresh data
        setQuickActionForms(prev => ({
          ...prev,
          customer: { name: '', phone: '', email: '' }
        }));
        
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    }
  }, [quickActionForms.customer, toast, queryClient, setQuickActionForms]);

  const handleCreateOrder = useCallback(async () => {
    try {
      const orderData = {
        customerName: quickActionForms.order.customerName,
        customerPhone: quickActionForms.order.customerPhone,
        items: [
          {
            name: quickActionForms.order.service,
            quantity: quickActionForms.order.quantity,
            price: 50.00 // Default price
          }
        ],
        totalAmount: (50.00 * quickActionForms.order.quantity).toString(),
        status: 'pending' as const,
        pickupDate: quickActionForms.order.pickupDate,
        paymentStatus: 'pending' as const
      };

      const newOrder = await ordersApi.create(orderData);
      
      if (newOrder) {
        toast({
          title: "Success!",
          description: `Order ${newOrder.orderNumber} has been created successfully.`,
        });
        
        // Reset form and refresh data
        setQuickActionForms(prev => ({
          ...prev,
          order: { 
            customerName: '', 
            customerPhone: '', 
            service: '', 
            quantity: 1, 
            pickupDate: new Date().toISOString().split('T')[0] 
          }
        }));
        
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (error: any) {
      console.error('Failed to create order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  }, [quickActionForms.order, toast, queryClient, setQuickActionForms]);

  const handleCreateEmployee = useCallback(async () => {
    try {
      // This would typically call an employee API
      // For now, just show success message
      toast({
        title: "Success!",
        description: `Employee ${quickActionForms.employee.name} has been created successfully.`,
      });
      
      // Reset form
      setQuickActionForms(prev => ({
        ...prev,
        employee: { name: '', phone: '', email: '', position: '', salary: '' }
      }));
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create employee. Please try again.",
        variant: "destructive",
      });
    }
  }, [quickActionForms.employee, toast, setQuickActionForms]);

  // Create metrics data for the metrics section
  const metricsData = createDefaultMetrics({
    totalRevenue: metrics.totalRevenue || 0,
    totalOrders: metrics.totalOrders || 0,
    totalCustomers: metrics.totalCustomers || 0,
    averageOrderValue: metrics.averageOrderValue || 0,
    // Add previous values if available for trend calculation
    previousRevenue: metrics.previousRevenue,
    previousOrders: metrics.previousOrders,
    previousCustomers: metrics.previousCustomers,
    previousAverageOrderValue: metrics.previousAverageOrderValue,
  });

  return (
    <PageTransition>
      <div className="space-y-8 p-6" data-testid="franchise-owner-dashboard">
        {/* Dashboard Header */}
        <FadeIn>
          <DashboardHeader
            isLoading={isLoading}
            lastUpdated={lastUpdated}
            onRefresh={refreshData}
            onDateRangeChange={handleDateRangeChange}
            filters={filters}
          />
        </FadeIn>

        {/* Dashboard Stats Summary */}
        <FadeIn delay={0.1}>
          <DashboardStatsSummary
            totalRevenue={metrics.totalRevenue || 0}
            totalOrders={metrics.totalOrders || 0}
            totalCustomers={metrics.totalCustomers || 0}
            isLoading={isLoading}
          />
        </FadeIn>

        {/* Key Metrics Section */}
        <FadeIn delay={0.2}>
          <DashboardMetricsSection
            metrics={metricsData}
            isLoading={isLoading}
            columns={4}
            className="mb-8"
          />
        </FadeIn>

        {/* Quick Actions Section */}
        <FadeIn delay={0.3}>
          <QuickActionsSection
            quickActionForms={quickActionForms}
            setQuickActionForms={setQuickActionForms}
            handleCreateCustomer={handleCreateCustomer}
            handleCreateOrder={handleCreateOrder}
            handleCreateEmployee={handleCreateEmployee}
            isLoading={{
              customer: false,
              order: false,
              employee: false
            }}
          />
        </FadeIn>

        {/* Charts Section */}
        <FadeIn delay={0.4}>
          <DashboardChartsSection
            salesData={salesData}
            orderStatusData={orderStatusData}
            servicePopularityData={servicePopularityData}
            isLoading={isLoading}
            layout="grid"
            className="mb-8"
          />
        </FadeIn>

        {/* Recent Activity Section */}
        <FadeIn delay={0.5}>
          <RecentActivitySection
            recentOrders={recentOrders}
            dueTodayOrders={dueTodayOrders}
            isLoading={isLoading}
            layout="horizontal"
            itemLimit={5}
            showViewAll={true}
          />
        </FadeIn>
      </div>
    </PageTransition>
  );
});

// Set display name for debugging
FranchiseOwnerDashboardRefactored.displayName = 'FranchiseOwnerDashboardRefactored';
