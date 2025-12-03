/**
 * Franchise Owner Dashboard - Split into smaller components
 * This demonstrates how to break down a large component into smaller, manageable pieces
 */

import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboard } from "@/hooks/use-dashboard";
import { PageTransition, FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/page-transition";
import { TEST_IDS, getTestId } from "@/lib/test-ids";
import { createHeaderComponent, createContentSection, createFooterComponent } from "@/lib/component-splitting";

// Import split components
import { DashboardHeader } from "./components/dashboard-header";
import { DashboardKPIs } from "./components/dashboard-kpis";
import { DashboardCharts } from "./components/dashboard-charts";
import { DashboardQuickActions } from "./components/dashboard-quick-actions";
import { DashboardRecentOrders } from "./components/dashboard-recent-orders";
import { DashboardDueToday } from "./components/dashboard-due-today";
import { DashboardFooter } from "./components/dashboard-footer";

/**
 * Main Franchise Owner Dashboard Component
 * 
 * @component
 * @returns {JSX.Element} Rendered dashboard component
 * 
 * @example
 * ```tsx
 * <FranchiseOwnerDashboard />
 * ```
 */
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
  const handleDateRangeChange = useCallback((dateRange: any) => {
    updateFilters({ dateRange });
  }, [updateFilters]);

  // Quick action handlers
  const handleQuickAction = useCallback((action: string, data: any) => {
    switch (action) {
      case 'customer':
        setIsCustomerDialogOpen(true);
        break;
      case 'order':
        setIsOrderDialogOpen(true);
        break;
      case 'employee':
        setIsEmployeeDialogOpen(true);
        break;
      default:
        console.warn('Unknown quick action:', action);
    }
  }, []);

  // Dialog handlers
  const handleCloseDialog = useCallback((dialogType: string) => {
    switch (dialogType) {
      case 'customer':
        setIsCustomerDialogOpen(false);
        resetQuickActionForm('customer');
        break;
      case 'order':
        setIsOrderDialogOpen(false);
        resetQuickActionForm('order');
        break;
      case 'employee':
        setIsEmployeeDialogOpen(false);
        resetQuickActionForm('employee');
        break;
    }
  }, [resetQuickActionForm]);

  // Memoized props for child components
  const dashboardHeaderProps = useMemo(() => ({
    filters,
    onDateRangeChange: handleDateRangeChange,
    onRefresh: refreshData,
    lastUpdated,
    isLoading,
  }), [filters, handleDateRangeChange, refreshData, lastUpdated, isLoading]);

  const dashboardKPIsProps = useMemo(() => ({
    metrics,
    isLoading,
  }), [metrics, isLoading]);

  const dashboardChartsProps = useMemo(() => ({
    salesData,
    orderStatusData,
    servicePopularityData,
    isLoading,
  }), [salesData, orderStatusData, servicePopularityData, isLoading]);

  const dashboardQuickActionsProps = useMemo(() => ({
    onQuickAction: handleQuickAction,
    isCustomerDialogOpen,
    isOrderDialogOpen,
    isEmployeeDialogOpen,
    onCloseDialog: handleCloseDialog,
    quickActionForms,
    updateQuickActionForm: updateQuickActionForm as (formType: string, updates: any) => void,
    resetQuickActionForm: resetQuickActionForm as (formType: string) => void,
    isSubmittingCustomer,
    isSubmittingOrder,
    isSubmittingEmployee,
  }), [
    handleQuickAction,
    isCustomerDialogOpen,
    isOrderDialogOpen,
    isEmployeeDialogOpen,
    handleCloseDialog,
    quickActionForms,
    updateQuickActionForm,
    resetQuickActionForm,
    isSubmittingCustomer,
    isSubmittingOrder,
    isSubmittingEmployee,
  ]);

  const dashboardRecentOrdersProps = useMemo(() => ({
    recentOrders,
    isLoading,
  }), [recentOrders, isLoading]);

  const dashboardDueTodayProps = useMemo(() => ({
    orders: recentOrders, // Using recentOrders as a proxy for all orders since we don't have all orders here
    isLoading,
  }), [recentOrders, isLoading]);

  const dashboardFooterProps = useMemo(() => ({
    lastUpdated,
    onRefresh: refreshData,
  }), [lastUpdated, refreshData]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        data-testid={getTestId(TEST_IDS.DASHBOARD.CONTAINER, 'loading')}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div
        className="space-y-6 p-6"
        data-testid={getTestId(TEST_IDS.DASHBOARD.CONTAINER)}
      >
        {/* Dashboard Header */}
        <DashboardHeader {...dashboardHeaderProps} />

        {/* Main Content */}
        <div className="space-y-6">
          {/* KPIs Section */}
          <DashboardKPIs {...dashboardKPIsProps} />

          {/* Charts Section */}
          <DashboardCharts {...dashboardChartsProps} />

          {/* Quick Actions Section */}
          <DashboardQuickActions {...dashboardQuickActionsProps} />

          {/* Recent Orders and Due Today Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardRecentOrders {...dashboardRecentOrdersProps} />
            <DashboardDueToday {...dashboardDueTodayProps} />
          </div>
        </div>

        {/* Dashboard Footer */}
        <DashboardFooter {...dashboardFooterProps} />
      </div>
    </PageTransition>
  );
});
