import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi, ordersApi, customersApi } from '@/lib/data-service';
import { useAnalyticsEngine } from '@/hooks/use-analytics-engine';
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

  // ✅ Use the central analytics engine for realtime data processing
  const {
    statusDistribution: rawOrderStatusData,
    servicePerformance: rawServicePopularityData,
    kpiMetrics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalyticsEngine();

  // Sales data is now handled by RevenueChartRealtime component
  // Keep this for backward compatibility but it will be empty
  const salesData: SalesData[] = [];
  const salesLoading = false;
  const salesError = null;

  const orderStatusLoading = analyticsLoading;
  const orderStatusError = analyticsError;

  const serviceLoading = analyticsLoading;
  const serviceError = analyticsError;

  // Convert analytics engine output to expected format
  const orderStatusData = useMemo(() => {
    if (!Array.isArray(rawOrderStatusData)) return [];
    return rawOrderStatusData.map(item => ({
      status: item.status,
      value: item.value,
      name: item.name,
      color: item.color,
      percentage: item.percentage,
    }));
  }, [rawOrderStatusData]);

  const servicePopularityData = useMemo(() => {
    if (!Array.isArray(rawServicePopularityData)) return [];
    return rawServicePopularityData.map(item => ({
      name: item.name,
      value: item.revenue, // Use revenue as the main value
      orders: item.count,
      revenue: item.revenue,
      fill: item.fill,
    }));
  }, [rawServicePopularityData]);

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
    }).map(order => ({
      ...order,
      total: parseFloat(order.totalAmount || '0'),
      customerPhone: order.customerPhone || undefined,
      customerEmail: order.customerEmail || undefined,
      pickupDate: order.pickupDate ? new Date(order.pickupDate).toISOString() : '',
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
    }));
  }, [recentOrders]);

  // Orders created today
  const ordersTodayCount = useMemo(() => {
    if (!recentOrders) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return recentOrders.filter(order => {
      if (!order.createdAt) return false;
      const created = new Date(order.createdAt);
      return created >= today && created < tomorrow;
    }).length;
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

  // Revenue today
  const revenueToday = useMemo(() => {
    if (!recentOrders) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return recentOrders.filter(order => {
      if (!order.createdAt) return false;
      const created = new Date(order.createdAt);
      return created >= today && created < tomorrow;
    }).reduce((sum, order) => sum + (parseFloat(order.totalAmount || '0')), 0);
  }, [recentOrders]);

  const ordersCompletedToday = useMemo(() => {
    if (!recentOrders) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return recentOrders.filter(order => {
      const dateStr = order.updatedAt || order.createdAt;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= today && ['completed', 'delivered'].includes(order.status);
    }).length;
  }, [recentOrders]);

  const pendingOrdersCount = useMemo(() => {
    if (!recentOrders) return 0;
    return recentOrders.filter(order => ['pending', 'processing', 'ready', 'assigned', 'in_transit'].includes(order.status)).length;
  }, [recentOrders]);

  const newCustomersToday = useMemo(() => {
    if (!customers) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return customers.filter(customer => {
      if (!customer.createdAt) return false;
      const created = new Date(customer.createdAt);
      return created >= today;
    }).length;
  }, [customers]);

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
  // ✅ Use KPI metrics from analytics engine as primary source
  const enhancedMetrics = useMemo((): DashboardMetrics => {
    // Merge API metrics with analytics engine KPIs
    const apiMetrics = dashboardMetrics && typeof dashboardMetrics === 'object' ? dashboardMetrics : null;

    // Use analytics engine KPIs (realtime) as primary source
    const totalRevenue = kpiMetrics.totalRevenue || apiMetrics?.totalRevenue || 0;
    const totalOrders = kpiMetrics.totalOrders || apiMetrics?.totalOrders || 0;
    const averageOrderValue = kpiMetrics.averageOrderValue || 0;

    return {
      totalRevenue,
      totalOrders,
      newCustomers: apiMetrics?.newCustomers || 0,
      inventoryItems: apiMetrics?.inventoryItems || 0,
      averageOrderValue: Math.round(averageOrderValue),
      onTimeDelivery: kpiMetrics.successRate || 0, // Use success rate as proxy for on-time delivery
      customerSatisfaction: 0, // Will be calculated from feedback data when available
      dueDateStats: apiMetrics?.dueDateStats || {
        today: 0,
        tomorrow: 0,
        overdue: 0,
        upcoming: 0,
      },
    };
  }, [dashboardMetrics, kpiMetrics]);

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
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(order => ({
        ...order,
        date: order.createdAt ? new Date(order.createdAt).toISOString() : '',
        total: parseFloat(order.totalAmount || '0'),
        customerPhone: order.customerPhone || undefined,
        customerEmail: order.customerEmail || undefined,
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
      }));
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
    ordersTodayCount,
    revenueToday,
    ordersCompletedToday,
    pendingOrdersCount,
    newCustomersToday,

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
