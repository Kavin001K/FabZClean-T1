import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi, ordersApi, customersApi } from '@/lib/data-service';
import { 
  DashboardState, 
  DashboardFilters, 
  DateRange, 
  QuickActionForm,
  DashboardMetrics,
  SalesData,
  OrderStatusData,
  ServicePopularityData
} from '@/types/dashboard';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// Default date range (last 30 days)
const getDefaultDateRange = (): DateRange => ({
  from: startOfDay(subDays(new Date(), 29)),
  to: endOfDay(new Date()),
});

export function useDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: getDefaultDateRange(),
  });
  
  const [quickActionForms, setQuickActionForms] = useState<QuickActionForm>({
    customer: { name: '', phone: '', email: '' },
    order: { customerName: '', customerPhone: '', service: '', quantity: 1, pickupDate: new Date().toISOString().split('T')[0] },
    employee: { name: '', phone: '', email: '', position: '', salary: '' },
  });

  // Data fetching with React Query
  const {
    data: dashboardMetrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['dashboard/metrics', filters.dateRange],
    queryFn: () => analyticsApi.getDashboardMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useQuery({
    queryKey: ['dashboard/sales', filters.dateRange],
    queryFn: () => analyticsApi.getSalesData(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  const {
    data: orderStatusData,
    isLoading: orderStatusLoading,
    error: orderStatusError,
  } = useQuery({
    queryKey: ['dashboard/order-status', filters.dateRange],
    queryFn: () => analyticsApi.getOrderStatusData(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  const {
    data: servicePopularityData,
    isLoading: serviceLoading,
    error: serviceError,
  } = useQuery({
    queryKey: ['dashboard/service-popularity', filters.dateRange],
    queryFn: () => analyticsApi.getServicePopularityData(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  const {
    data: recentOrders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ['dashboard/recent-orders'],
    queryFn: () => ordersApi.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });

  // Due today orders - filter from recent orders
  const dueTodayOrders = useMemo(() => {
    if (!recentOrders) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return recentOrders.filter(order => {
      if (!order.pickupDate) return false;
      const pickup = new Date(order.pickupDate);
      pickup.setHours(0, 0, 0, 0);
      return pickup <= today; // Include overdue and due today
    });
  }, [recentOrders]);

  const {
    data: customers,
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ['dashboard/customers'],
    queryFn: () => customersApi.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Computed state
  const isLoading = useMemo(() => 
    metricsLoading || salesLoading || orderStatusLoading || serviceLoading || ordersLoading || customersLoading,
    [metricsLoading, salesLoading, orderStatusLoading, serviceLoading, ordersLoading, customersLoading]
  );

  const error = useMemo(() => {
    const errors = [metricsError, salesError, orderStatusError, serviceError, ordersError, customersError];
    const firstError = errors.find(err => err !== null && err !== undefined);
    return firstError || null;
  }, [metricsError, salesError, orderStatusError, serviceError, ordersError, customersError]);

  // Enhanced metrics with calculations
  const enhancedMetrics = useMemo((): DashboardMetrics => {
    if (!dashboardMetrics || typeof dashboardMetrics !== 'object') {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        newCustomers: 0,
        inventoryItems: 0,
        averageOrderValue: 0,
        onTimeDelivery: 0,
        customerSatisfaction: 0,
        dueDateStats: {
          today: 0,
          tomorrow: 0,
          overdue: 0,
          upcoming: 0,
        },
      };
    }

    try {
      const averageOrderValue = (dashboardMetrics.totalOrders && dashboardMetrics.totalOrders > 0) 
        ? dashboardMetrics.totalRevenue / dashboardMetrics.totalOrders 
        : 0;

      return {
        totalRevenue: dashboardMetrics.totalRevenue || 0,
        totalOrders: dashboardMetrics.totalOrders || 0,
        newCustomers: dashboardMetrics.newCustomers || 0,
        inventoryItems: dashboardMetrics.inventoryItems || 0,
        averageOrderValue: Math.round(averageOrderValue),
        onTimeDelivery: 95, // Mock data - would come from delivery tracking
        customerSatisfaction: 4.2, // Mock data - would come from feedback
        dueDateStats: dashboardMetrics.dueDateStats || {
          today: 0,
          tomorrow: 0,
          overdue: 0,
          upcoming: 0,
        },
      };
    } catch (error) {
      console.error('Error processing dashboard metrics:', error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        newCustomers: 0,
        inventoryItems: 0,
        averageOrderValue: 0,
        onTimeDelivery: 0,
        customerSatisfaction: 0,
        dueDateStats: {
          today: 0,
          tomorrow: 0,
          overdue: 0,
          upcoming: 0,
        },
      };
    }
  }, [dashboardMetrics]);

  // Processed data with fallbacks
  const processedSalesData = useMemo((): SalesData[] => {
    if (!salesData || !Array.isArray(salesData)) return [];
    return salesData.map(item => ({
      month: item.month || item.date || '',
      revenue: item.revenue || 0,
      orders: item.orders || 0,
    }));
  }, [salesData]);

  const processedOrderStatusData = useMemo((): OrderStatusData[] => {
    if (!orderStatusData || !Array.isArray(orderStatusData)) return [];
    return orderStatusData.map(item => ({
      status: item.status || '',
      value: item.value || 0,
      color: item.color,
    }));
  }, [orderStatusData]);

  const processedServiceData = useMemo((): ServicePopularityData[] => {
    if (!servicePopularityData || !Array.isArray(servicePopularityData)) return [];
    const total = servicePopularityData.reduce((sum, item) => sum + (item.value || 0), 0);
    return servicePopularityData.map(item => ({
      name: item.name || '',
      value: item.value || 0,
      fill: item.fill || '#8884d8',
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [servicePopularityData]);

  const processedRecentOrders = useMemo(() => {
    if (!recentOrders || !Array.isArray(recentOrders)) return [];
    return recentOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [recentOrders]);

  // Actions
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    toast({
      title: "Data Refreshed",
      description: "Dashboard data has been updated successfully.",
    });
  }, [queryClient, toast]);

  const updateQuickActionForm = useCallback((formType: keyof QuickActionForm, updates: Partial<QuickActionForm[keyof QuickActionForm]>) => {
    setQuickActionForms(prev => ({
      ...prev,
      [formType]: { ...prev[formType], ...updates },
    }));
  }, []);

  const resetQuickActionForm = useCallback((formType: keyof QuickActionForm) => {
    setQuickActionForms(prev => ({
      ...prev,
      [formType]: {
        customer: { name: '', phone: '', email: '' },
        order: { customerName: '', customerPhone: '', service: '', quantity: 1, pickupDate: '' },
        employee: { name: '', phone: '', email: '', position: '', salary: '' },
      }[formType],
    }));
  }, []);

  // Error handling
  useEffect(() => {
    if (error) {
      console.error('Dashboard data fetch error:', error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load some dashboard data. Please try refreshing.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return {
    // State
    filters,
    quickActionForms,
    
    // Data
    metrics: enhancedMetrics,
    salesData: processedSalesData,
    orderStatusData: processedOrderStatusData,
    servicePopularityData: processedServiceData,
    recentOrders: processedRecentOrders,
    dueTodayOrders: dueTodayOrders || [],
    customers: customers || [],
    
    // Loading states
    isLoading,
    metricsLoading,
    salesLoading,
    orderStatusLoading,
    serviceLoading,
    ordersLoading,
    customersLoading,
    
    // Error states
    error,
    metricsError,
    salesError,
    orderStatusError,
    serviceError,
    ordersError,
    customersError,
    
    // Actions
    updateFilters,
    refreshData,
    updateQuickActionForm,
    resetQuickActionForm,
    
    // Computed
    hasData: !isLoading && !error,
    lastUpdated: new Date(),
  };
}
