import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi, ordersApi, customersApi } from '@/lib/data-service';
import {
  DashboardFilters,
  DateRange,
  QuickActionForm,
  DashboardMetrics,
  SalesData,
  OrderStatusData,
  ServicePopularityData
} from '@/types/dashboard';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import type { Order } from '@shared/schema';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  completed: '#10b981',
  delivered: '#059669',
  cancelled: '#ef4444',
  ready_for_pickup: '#8b5cf6',
  ready_for_delivery: '#6366f1',
};

const SERVICE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6'];
const ACTIVE_ORDER_STATUSES = ['pending', 'processing', 'ready', 'assigned', 'in_transit', 'ready_for_pickup', 'ready_for_delivery'];
const COMPLETED_ORDER_STATUSES = ['completed', 'delivered'];

const getDefaultDateRange = (): DateRange => ({
  from: startOfDay(subDays(new Date(), 29)),
  to: endOfDay(new Date()),
});

const toAmount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isWithinSelectedRange = (value: string | Date | null | undefined, range: DateRange): boolean => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= range.from && date <= range.to;
};

const isNonCancelledOrder = (order: Order) => order.status !== 'cancelled';

export function useDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: getDefaultDateRange(),
  });

  const [quickActionForms, setQuickActionForms] = useState<QuickActionForm>({
    customer: { name: '', phone: '', email: '' },
    order: { customerName: '', customerPhone: '', service: '', quantity: 1, pickupDate: new Date().toISOString().split('T')[0] },
    employee: { name: '', phone: '', email: '', position: '', salary: '' },
  });

  const {
    data: dashboardMetrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['dashboard/metrics'],
    queryFn: () => analyticsApi.getDashboardMetrics(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  const {
    data: allOrders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ['dashboard/all-orders'],
    queryFn: () => ordersApi.getAll(),
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });

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

  const safeOrders = useMemo(() => Array.isArray(allOrders) ? [...allOrders] : [], [allOrders]);
  const safeCustomers = useMemo(() => Array.isArray(customers) ? [...customers] : [], [customers]);

  const filteredOrders = useMemo(() => {
    return safeOrders.filter((order) => {
      if (!isWithinSelectedRange(order.createdAt, filters.dateRange)) return false;
      if (filters.status && order.status !== filters.status) return false;
      if (filters.serviceType) {
        const items = Array.isArray(order.items) ? order.items : [];
        const hasRequestedService = items.some((item: any) =>
          String(item?.serviceName || item?.customName || '').toLowerCase().includes(filters.serviceType!.toLowerCase())
        );
        if (!hasRequestedService) return false;
      }
      return true;
    });
  }, [safeOrders, filters.dateRange, filters.status, filters.serviceType]);

  const activeFilteredOrders = useMemo(
    () => filteredOrders.filter(isNonCancelledOrder),
    [filteredOrders]
  );

  const filteredCustomers = useMemo(() => {
    return safeCustomers.filter((customer) => isWithinSelectedRange(customer.createdAt, filters.dateRange));
  }, [safeCustomers, filters.dateRange]);

  const dueDateStats = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return safeOrders.filter(isNonCancelledOrder).reduce((stats, order) => {
      if (!order.pickupDate) return stats;
      const pickupDate = startOfDay(new Date(order.pickupDate));

      if (pickupDate < today) stats.overdue += 1;
      else if (pickupDate.getTime() === today.getTime()) stats.today += 1;
      else if (pickupDate.getTime() === tomorrow.getTime()) stats.tomorrow += 1;
      else if (pickupDate >= dayAfterTomorrow) stats.upcoming += 1;

      return stats;
    }, {
      today: 0,
      tomorrow: 0,
      overdue: 0,
      upcoming: 0,
    });
  }, [safeOrders]);

  const ordersTodayCount = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return safeOrders.filter((order) =>
      isNonCancelledOrder(order) &&
      order.createdAt &&
      new Date(order.createdAt) >= today &&
      new Date(order.createdAt) < tomorrow
    ).length;
  }, [safeOrders]);

  const revenueToday = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return safeOrders.reduce((sum, order) => {
      if (!isNonCancelledOrder(order) || !order.createdAt) return sum;
      const createdAt = new Date(order.createdAt);
      if (createdAt < today || createdAt >= tomorrow) return sum;
      return sum + toAmount(order.totalAmount);
    }, 0);
  }, [safeOrders]);

  const ordersCompletedToday = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return safeOrders.filter((order) => {
      if (!COMPLETED_ORDER_STATUSES.includes(order.status)) return false;
      const timestamp = order.deliveredAt || order.updatedAt || order.createdAt;
      if (!timestamp) return false;
      const date = new Date(timestamp);
      return date >= today && date < tomorrow;
    }).length;
  }, [safeOrders]);

  const pendingOrdersCount = useMemo(() => {
    return safeOrders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)).length;
  }, [safeOrders]);

  const newCustomersToday = useMemo(() => {
    const today = startOfDay(new Date());
    return safeCustomers.filter((customer) =>
      customer.createdAt && new Date(customer.createdAt) >= today
    ).length;
  }, [safeCustomers]);

  const orderStatusData = useMemo((): OrderStatusData[] => {
    const total = filteredOrders.length;
    const counts = filteredOrders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, value]) => ({
        status,
        value,
        color: STATUS_COLORS[status] || '#64748b',
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      } as OrderStatusData & { percentage: number }));
  }, [filteredOrders]);

  const servicePopularityData = useMemo((): ServicePopularityData[] => {
    const serviceMap = activeFilteredOrders.reduce<Record<string, number>>((acc, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const serviceName = String(item?.serviceName || item?.customName || 'Unknown Service');
        acc[serviceName] = (acc[serviceName] || 0) + toAmount(item?.subtotal || item?.price);
      });
      return acc;
    }, {});

    const total = Object.values(serviceMap).reduce((sum, value) => sum + value, 0);

    return Object.entries(serviceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], index) => ({
        name,
        value,
        fill: SERVICE_COLORS[index % SERVICE_COLORS.length],
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }));
  }, [activeFilteredOrders]);

  const processedSalesData = useMemo((): SalesData[] => {
    const groupedByDay = activeFilteredOrders.reduce<Record<string, { label: string; revenue: number; orders: number }>>((acc, order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return acc;
      const key = createdAt.toISOString().slice(0, 10);
      if (!acc[key]) {
        acc[key] = {
          label: createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          revenue: 0,
          orders: 0,
        };
      }
      acc[key].revenue += toAmount(order.totalAmount);
      acc[key].orders += 1;
      return acc;
    }, {});

    return Object.entries(groupedByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, values]) => ({
        month: values.label,
        revenue: Number(values.revenue.toFixed(2)),
        orders: values.orders,
      }));
  }, [activeFilteredOrders]);

  const processedRecentOrders = useMemo(() => {
    return [...safeOrders]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(order => ({
        ...order,
        date: order.createdAt ? new Date(order.createdAt).toISOString() : '',
        total: toAmount(order.totalAmount),
        customerPhone: order.customerPhone || undefined,
        customerEmail: order.customerEmail || undefined,
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
      }));
  }, [safeOrders]);

  const dueTodayOrders = useMemo(() => {
    const today = startOfDay(new Date());
    return safeOrders
      .filter((order) => {
        if (!isNonCancelledOrder(order) || !order.pickupDate) return false;
        const pickupDate = startOfDay(new Date(order.pickupDate));
        return pickupDate <= today;
      })
      .map((order) => ({
        ...order,
        total: toAmount(order.totalAmount),
        customerPhone: order.customerPhone || undefined,
        customerEmail: order.customerEmail || undefined,
        pickupDate: order.pickupDate ? new Date(order.pickupDate).toISOString() : '',
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
      }));
  }, [safeOrders]);

  const enhancedMetrics = useMemo((): DashboardMetrics => {
    const now = new Date();
    const startOfThisMonth = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const startOfLastMonth = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const thisMonthOrders = safeOrders.filter((order) =>
      isNonCancelledOrder(order) && isWithinSelectedRange(order.createdAt, { from: startOfThisMonth, to: endOfDay(now) })
    );
    const lastMonthOrders = safeOrders.filter((order) => {
      if (!isNonCancelledOrder(order) || !order.createdAt) return false;
      const createdAt = new Date(order.createdAt);
      return createdAt >= startOfLastMonth && createdAt < startOfThisMonth;
    });

    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + toAmount(order.totalAmount), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + toAmount(order.totalAmount), 0);

    const thisMonthCustomers = safeCustomers.filter((customer) =>
      isWithinSelectedRange(customer.createdAt, { from: startOfThisMonth, to: endOfDay(now) })
    );
    const lastMonthCustomers = safeCustomers.filter((customer) => {
      if (!customer.createdAt) return false;
      const createdAt = new Date(customer.createdAt);
      return createdAt >= startOfLastMonth && createdAt < startOfThisMonth;
    });

    const totalRevenue = activeFilteredOrders.reduce((sum, order) => sum + toAmount(order.totalAmount), 0);
    const totalOrders = activeFilteredOrders.length;
    const outstandingCredit = safeCustomers.reduce((sum, customer) => sum + Math.max(0, toAmount(customer.creditBalance)), 0);
    const completedOrders = activeFilteredOrders.filter((order) => COMPLETED_ORDER_STATUSES.includes(order.status)).length;
    const deliveredOrdersWithDueDates = activeFilteredOrders.filter((order) => order.deliveredAt && order.pickupDate);
    const onTimeDeliveries = deliveredOrdersWithDueDates.filter((order) =>
      new Date(order.deliveredAt as Date | string) <= new Date(order.pickupDate as Date | string)
    ).length;

    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const ordersGrowth = lastMonthOrders.length > 0 ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 : 0;
    const customersGrowth = lastMonthCustomers.length > 0 ? ((thisMonthCustomers.length - lastMonthCustomers.length) / lastMonthCustomers.length) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      newCustomers: filteredCustomers.length,
      inventoryItems: dashboardMetrics?.inventoryItems || 0,
      bookedRevenue: totalRevenue,
      outstandingCredit,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      successRate: totalOrders > 0 ? Number(((completedOrders / totalOrders) * 100).toFixed(1)) : 0,
      onTimeDelivery: deliveredOrdersWithDueDates.length > 0
        ? Number(((onTimeDeliveries / deliveredOrdersWithDueDates.length) * 100).toFixed(1))
        : undefined,
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      ordersGrowth: Number(ordersGrowth.toFixed(1)),
      customersGrowth: Number(customersGrowth.toFixed(1)),
      dueDateStats,
    };
  }, [activeFilteredOrders, dashboardMetrics?.inventoryItems, dueDateStats, filteredCustomers.length, safeCustomers, safeOrders]);

  const isLoading = useMemo(
    () => metricsLoading || ordersLoading || customersLoading,
    [metricsLoading, ordersLoading, customersLoading]
  );

  const error = useMemo(() => {
    const errors = [metricsError, ordersError, customersError];
    return errors.find((entry) => entry !== null && entry !== undefined) || null;
  }, [metricsError, ordersError, customersError]);

  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard/metrics'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard/all-orders'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard/customers'] });
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
    filters,
    quickActionForms,
    metrics: enhancedMetrics,
    salesData: processedSalesData,
    orderStatusData,
    servicePopularityData,
    recentOrders: processedRecentOrders,
    dueTodayOrders: dueTodayOrders || [],
    customers: safeCustomers,
    ordersTodayCount,
    revenueToday,
    ordersCompletedToday,
    pendingOrdersCount,
    newCustomersToday,
    allOrders: safeOrders,
    isLoading,
    metricsLoading,
    salesLoading: false,
    orderStatusLoading: ordersLoading,
    serviceLoading: ordersLoading,
    ordersLoading,
    customersLoading,
    error,
    metricsError,
    salesError: null,
    orderStatusError: ordersError,
    serviceError: ordersError,
    ordersError,
    customersError,
    updateFilters,
    refreshData,
    updateQuickActionForm,
    resetQuickActionForm,
    hasData: !isLoading && !error,
    lastUpdated: new Date(),
  };
}
