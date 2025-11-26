/**
 * Central Analytics Engine Hook
 * 
 * Fetches raw data from Supabase (orders, services) and processes it using
 * specific algorithms to generate chart-ready data for the Dashboard.
 * 
 * Features:
 * - Realtime subscriptions to orders and services tables
 * - Automatic recalculation when data changes
 * - Three processing algorithms (Status Distribution, Service Performance, KPIs)
 * - Returns zero-safe defaults (empty arrays, 0 values) if database is empty
 */

import { useMemo } from 'react';
import { useRealtime } from './use-realtime';

// Type definitions
interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  items?: any; // JSON column - array of items with service info
  serviceId?: string;
  service?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: number | string;
  status: string;
}

// Algorithm A: Status Distribution (Pie Chart)
interface StatusDistributionItem {
  name: string;
  value: number;
  status: string;
  color: string;
  percentage: number;
}

/**
 * Algorithm A: Status Distribution
 * 
 * Input: Array of Orders
 * Logic: Create frequency map of status column, calculate percentages
 * Output: [{ name: 'Pending', value: 12, color: '#...', percentage: 15.5 }, ...]
 */
function calculateStatusDistribution(orders: Order[]): StatusDistributionItem[] {
  // ✅ Safety: Ensure orders is an array
  if (!Array.isArray(orders) || orders.length === 0) {
    return [];
  }

  // Status color mapping
  const statusColors: Record<string, string> = {
    pending: '#FFBB28',
    processing: '#0088FE',
    completed: '#00C49F',
    cancelled: '#FF8042',
    delivered: '#82CA9D',
    in_progress: '#8884D8',
  };

  // Status name mapping
  const statusNames: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    delivered: 'Delivered',
    in_progress: 'In Progress',
  };

  // Create frequency map
  const statusMap: Record<string, number> = {};

  orders.forEach((order) => {
    const status = (order.status || 'pending').toLowerCase();
    statusMap[status] = (statusMap[status] || 0) + 1;
  });

  // Calculate total for percentage calculation
  const total = orders.length;

  // Convert to array format with percentages
  const distribution = Object.entries(statusMap).map(([status, count]) => ({
    name: statusNames[status] || status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    status: status,
    color: statusColors[status] || '#888888',
    percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
  }));

  // Sort by value (descending)
  return distribution.sort((a, b) => b.value - a.value);
}

// Algorithm B: Service Performance (Bar Chart)
interface ServicePerformanceItem {
  name: string;
  revenue: number;
  count: number;
  avgOrderValue: number;
  fill?: string;
}

/**
 * Algorithm B: Service Performance
 * 
 * Input: Array of Orders + Array of Services
 * Logic: Group orders by service_type (from items JSON or service relation), sum totalAmount
 * Output: [{ name: 'Dry Cleaning', revenue: 5000, count: 45 }, ...]
 */
function calculateServicePerformance(
  orders: Order[],
  services: Service[]
): ServicePerformanceItem[] {
  // ✅ Safety: Ensure inputs are arrays
  if (!Array.isArray(orders) || orders.length === 0) {
    return [];
  }

  // Create service lookup map
  const serviceMap = new Map<string, Service>();
  if (Array.isArray(services)) {
    services.forEach((service) => {
      serviceMap.set(service.id, service);
      serviceMap.set(service.name.toLowerCase(), service);
    });
  }

  // Service performance map
  const performanceMap: Record<string, { revenue: number; count: number }> = {};

  orders.forEach((order) => {
    let serviceName = 'Unknown Service';

    // Try to get service name from different sources
    if (order.service) {
      serviceName = order.service;
    } else if (order.serviceId && serviceMap.has(order.serviceId)) {
      serviceName = serviceMap.get(order.serviceId)!.name;
    } else if (order.items && Array.isArray(order.items)) {
      // Extract service from items JSON
      const firstItem = order.items[0];
      if (firstItem?.serviceName) {
        serviceName = firstItem.serviceName;
      } else if (firstItem?.service) {
        serviceName = firstItem.service;
      } else if (firstItem?.serviceId && serviceMap.has(firstItem.serviceId)) {
        serviceName = serviceMap.get(firstItem.serviceId)!.name;
      }
    }

    // Clean service name
    serviceName = serviceName.trim() || 'Unknown Service';

    // Calculate amount
    let amount = 0;
    if (typeof order.totalAmount === 'number') {
      amount = order.totalAmount;
    } else if (typeof order.totalAmount === 'string') {
      // Remove currency symbols, commas, and convert
      const cleaned = order.totalAmount.replace(/[₹,\s]/g, '');
      amount = parseFloat(cleaned) || 0;
    }

    // Add to performance map
    if (!performanceMap[serviceName]) {
      performanceMap[serviceName] = { revenue: 0, count: 0 };
    }
    performanceMap[serviceName].revenue += amount;
    performanceMap[serviceName].count += 1;
  });

  // Convert to array format
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const performance = Object.entries(performanceMap).map(([name, data], index) => ({
    name,
    revenue: data.revenue,
    count: data.count,
    avgOrderValue: data.count > 0 ? data.revenue / data.count : 0,
    fill: colors[index % colors.length],
  }));

  // Sort by revenue (descending)
  return performance.sort((a, b) => b.revenue - a.revenue);
}

// Algorithm C: KPI Cards
interface KPIMetrics {
  totalOrders: number;
  totalRevenue: number;
  successRate: number;
  averageOrderValue: number;
}

/**
 * Algorithm C: KPI Cards
 * 
 * Calculate:
 * - Total Orders (count)
 * - Total Revenue (sum of totalAmount where paymentStatus is 'paid')
 * - Success Rate (percentage of orders where status is 'completed' or 'delivered')
 * - Average Order Value
 */
function calculateKPIMetrics(orders: Order[]): KPIMetrics {
  // ✅ Safety: Ensure orders is an array
  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      successRate: 0,
      averageOrderValue: 0,
    };
  }

  let totalRevenue = 0;
  let paidOrdersCount = 0;
  let completedOrdersCount = 0;

  orders.forEach((order) => {
    // Calculate total revenue from paid orders
    const isPaid =
      order.paymentStatus?.toLowerCase() === 'paid' ||
      order.paymentStatus?.toLowerCase() === 'completed';

    if (isPaid) {
      let amount = 0;
      if (typeof order.totalAmount === 'number') {
        amount = order.totalAmount;
      } else if (typeof order.totalAmount === 'string') {
        const cleaned = order.totalAmount.replace(/[₹,\s]/g, '');
        amount = parseFloat(cleaned) || 0;
      }
      totalRevenue += amount;
      paidOrdersCount++;
    }

    // Count completed/delivered orders
    const status = (order.status || '').toLowerCase();
    if (status === 'completed' || status === 'delivered') {
      completedOrdersCount++;
    }
  });

  const totalOrders = orders.length;
  const successRate = totalOrders > 0
    ? Math.round((completedOrdersCount / totalOrders) * 100 * 10) / 10
    : 0;
  const averageOrderValue = paidOrdersCount > 0
    ? totalRevenue / paidOrdersCount
    : 0;

  return {
    totalOrders,
    totalRevenue,
    successRate,
    averageOrderValue,
  };
}

// Main hook interface
interface UseAnalyticsEngineReturn {
  // Algorithm A output
  statusDistribution: StatusDistributionItem[];

  // Algorithm B output
  servicePerformance: ServicePerformanceItem[];

  // Algorithm C output
  kpiMetrics: KPIMetrics;

  // Raw data (for advanced use cases)
  orders: Order[];
  services: Service[];

  // Loading and error states
  isLoading: boolean;
  error: Error | null;
}

/**
 * Central Analytics Engine Hook
 * 
 * Fetches orders and services from Supabase with realtime subscriptions,
 * processes them using the three algorithms, and returns chart-ready data.
 */
export function useAnalyticsEngine(): UseAnalyticsEngineReturn {
  // ✅ All hooks called at top level (Rules of Hooks compliance)

  // Fetch orders with realtime subscription
  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useRealtime<Order>({
    tableName: 'orders',
    selectQuery: '*', // Select all columns to ensure service info is available
    orderBy: 'createdAt.desc',
  });

  // Fetch services with realtime subscription
  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useRealtime<Service>({
    tableName: 'services',
    selectQuery: '*',
    orderBy: 'name.asc',
  });

  // Combined loading state
  const isLoading = ordersLoading || servicesLoading;

  // Combined error state
  const error = ordersError || servicesError || null;

  // ✅ Algorithm A: Status Distribution
  const statusDistribution = useMemo(() => {
    return calculateStatusDistribution(orders);
  }, [orders]);

  // ✅ Algorithm B: Service Performance
  const servicePerformance = useMemo(() => {
    return calculateServicePerformance(orders, services);
  }, [orders, services]);

  // ✅ Algorithm C: KPI Metrics
  const kpiMetrics = useMemo(() => {
    return calculateKPIMetrics(orders);
  }, [orders]);

  // ✅ Safety: Always return arrays/zero values, never null/undefined
  return {
    statusDistribution: Array.isArray(statusDistribution) ? statusDistribution : [],
    servicePerformance: Array.isArray(servicePerformance) ? servicePerformance : [],
    kpiMetrics: kpiMetrics || {
      totalOrders: 0,
      totalRevenue: 0,
      successRate: 0,
      averageOrderValue: 0,
    },
    orders: Array.isArray(orders) ? orders : [],
    services: Array.isArray(services) ? services : [],
    isLoading,
    error,
  };
}

// Export algorithm functions for testing/reuse
export {
  calculateStatusDistribution,
  calculateServicePerformance,
  calculateKPIMetrics,
};

// Export types
export type {
  StatusDistributionItem,
  ServicePerformanceItem,
  KPIMetrics,
  UseAnalyticsEngineReturn,
};

