/**
 * Revenue Chart with Realtime Data from Supabase
 * 
 * This component:
 * 1. Fetches orders from Supabase using useRealtime hook
 * 2. Aggregates orders by month
 * 3. Calculates revenue per month
 * 4. Handles forecast/trend lines appropriately
 * 5. Updates automatically when new orders come in
 */

import React, { useMemo } from 'react';
import { useRealtime } from '@/hooks/use-realtime';
import SalesChart, { type SalesData } from './sales-chart';

interface Order {
  id: string;
  createdAt: string;
  totalAmount: number | string;
  paymentStatus?: string;
  status?: string;
}

/**
 * Process raw orders data into monthly revenue chart data
 * Groups orders by month and sums the totalAmount
 */
function processRevenueData(orders: Order[]): SalesData[] {
  // ✅ Safety: Ensure orders is an array
  if (!Array.isArray(orders) || orders.length === 0) {
    return [];
  }

  const monthlyData: Record<string, { revenue: number; orders: number }> = {};

  orders.forEach((order) => {
    try {
      // 1. Get the month name (e.g., "Jan", "Nov")
      const date = new Date(order.createdAt);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for order:', order.id);
        return;
      }

      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthKey = `${month} ${year}`; // Include year to handle multi-year data

      // 2. Clean the price string (remove "₹" and commas) and convert to float
      let amount = 0;
      if (typeof order.totalAmount === 'number') {
        amount = order.totalAmount;
      } else if (typeof order.totalAmount === 'string') {
        // Remove currency symbols, commas, and convert to number
        const cleaned = order.totalAmount.replace(/[₹,\s]/g, '');
        amount = parseFloat(cleaned) || 0;
      }

      // 3. Add to monthly total
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, orders: 0 };
      }
      monthlyData[monthKey].revenue += amount;
      monthlyData[monthKey].orders += 1;
    } catch (error) {
      console.error('Error processing order:', order.id, error);
    }
  });

  // 4. Convert to array and sort chronologically
  const chartData = Object.keys(monthlyData)
    .map((monthKey) => {
      const [month, year] = monthKey.split(' ');
      return {
        month,
        year: parseInt(year),
        monthKey,
        revenue: monthlyData[monthKey].revenue,
        orders: monthlyData[monthKey].orders,
      };
    })
    .sort((a, b) => {
      // Sort by year first, then by month
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      // Month comparison (Jan=0, Feb=1, etc.)
      const monthOrder: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      return (monthOrder[a.month] || 0) - (monthOrder[b.month] || 0);
    })
    .map((item) => ({
      month: item.month,
      revenue: item.revenue,
      orders: item.orders,
    }));

  return chartData;
}

interface RevenueChartRealtimeProps {
  showArea?: boolean;
  height?: number;
  title?: string;
  className?: string;
  /** Minimum months of data required to show forecast/trend lines */
  minMonthsForForecast?: number;
}

/**
 * Revenue Chart Component with Realtime Supabase Data
 * 
 * Fetches orders from Supabase, aggregates by month, and displays in a chart.
 * Automatically updates when new orders are created/updated/deleted.
 */
export default function RevenueChartRealtime({
  showArea = false,
  height = 350,
  title = "Revenue Trend",
  className,
  minMonthsForForecast = 3,
}: RevenueChartRealtimeProps) {
  // ✅ Hook called at top level (Rules of Hooks compliance)
  // Fetch only completed/paid orders for revenue calculation
  const { data: orders, isLoading, error } = useRealtime<Order>({
    tableName: 'orders',
    selectQuery: 'id, createdAt, totalAmount, paymentStatus, status',
    // Filter for completed/paid orders only
    // Note: Adjust filter based on your schema - you might need to use paymentStatus or status
    // filter: 'paymentStatus.eq.paid', // Uncomment if you have paymentStatus column
    orderBy: 'createdAt.desc',
  });

  // ✅ Process orders into monthly revenue data
  const chartData = useMemo(() => {
    // Filter for completed/paid orders
    const completedOrders = orders.filter((order) => {
      // Check both paymentStatus and status fields
      const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'Paid';
      const isCompleted = order.status === 'completed' || order.status === 'Completed';
      return isPaid || isCompleted;
    });

    return processRevenueData(completedOrders);
  }, [orders]);

  // ✅ Determine if we have enough data for forecast/trend
  const hasEnoughData = useMemo(() => {
    return chartData.length >= minMonthsForForecast;
  }, [chartData.length, minMonthsForForecast]);

  // ✅ Handle zero state - show flat line at 0 if no data
  const displayData = useMemo(() => {
    if (chartData.length === 0 && !isLoading) {
      // Return zero data for last 6 months to show flat line
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map((month) => ({
        month,
        revenue: 0,
        orders: 0,
      }));
    }
    return chartData;
  }, [chartData, isLoading]);

  // ✅ All hooks called before conditional returns
  if (error) {
    return (
      <div className={className}>
        <div className="text-center text-destructive p-4">
          <p className="font-medium">Error loading revenue data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Pass data to SalesChart component
  // The SalesChart will handle forecast/trend lines based on data availability
  return (
    <SalesChart
      data={displayData}
      isLoading={isLoading}
      showArea={showArea}
      height={height}
      title={title}
      className={className}
    />
  );
}

/**
 * Export the processing function for use in other components
 */
export { processRevenueData };

