/**
 * Dashboard Charts Section Component
 * 
 * Displays various charts and visualizations for dashboard analytics.
 * Includes sales charts, order status charts, and service popularity charts.
 * 
 * @component
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaggerChildren, StaggerItem } from "@/components/ui/page-transition";
import SalesChart from "@/components/dashboard/sales-chart";
import OrderStatusChart from "@/components/dashboard/order-status-chart";
import ServicePopularityChart from "@/components/dashboard/service-popularity-chart";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

interface OrderStatusData {
  status: string;
  count: number;
  color: string;
}

interface ServicePopularityData {
  service: string;
  count: number;
  revenue: number;
}

interface DashboardChartsSectionProps {
  /** Sales data for the sales chart */
  salesData?: SalesData[];
  /** Order status data for the pie chart */
  orderStatusData?: OrderStatusData[];
  /** Service popularity data for the bar chart */
  servicePopularityData?: ServicePopularityData[];
  /** Loading state */
  isLoading?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Chart layout configuration */
  layout?: 'grid' | 'stacked';
}

/**
 * Dashboard Charts Section Component
 * 
 * Renders a collection of charts with loading states and responsive layout.
 */
export const DashboardChartsSection: React.FC<DashboardChartsSectionProps> = ({
  salesData = [],
  orderStatusData = [],
  servicePopularityData = [],
  isLoading = false,
  className = "",
  layout = 'grid'
}) => {
  const containerClasses = layout === 'grid' 
    ? "grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
    : "space-y-6";

  if (isLoading) {
    return (
      <div className={`${containerClasses} ${className}`} data-testid="dashboard-charts-loading">
        <LoadingSkeleton.ChartCard />
        <LoadingSkeleton.ChartCard />
        <LoadingSkeleton.ChartCard />
      </div>
    );
  }

  return (
    <StaggerChildren 
      className={`${containerClasses} ${className}`} 
      data-testid="dashboard-charts-section"
    >
      {/* Sales Chart */}
      <StaggerItem>
        <Card data-testid="sales-chart-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart 
              data={salesData}
              data-testid="sales-chart"
            />
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Order Status Chart */}
      <StaggerItem>
        <Card data-testid="order-status-chart-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusChart 
              data={orderStatusData}
              data-testid="order-status-chart"
            />
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Service Popularity Chart */}
      <StaggerItem>
        <Card data-testid="service-popularity-chart-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Popular Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServicePopularityChart 
              data={servicePopularityData}
              data-testid="service-popularity-chart"
            />
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerChildren>
  );
};

/**
 * Chart Configuration Hook
 * 
 * Provides default configurations and utilities for dashboard charts.
 */
export const useChartConfig = () => {
  /**
   * Generate mock sales data for testing/demo purposes
   */
  const generateMockSalesData = (days: number = 30): SalesData[] => {
    const data: SalesData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 50) + 10
      });
    }
    
    return data;
  };

  /**
   * Generate mock order status data
   */
  const generateMockOrderStatusData = (): OrderStatusData[] => [
    { status: 'Completed', count: 45, color: '#10B981' },
    { status: 'Processing', count: 23, color: '#F59E0B' },
    { status: 'Pending', count: 12, color: '#EF4444' },
    { status: 'Cancelled', count: 5, color: '#6B7280' }
  ];

  /**
   * Generate mock service popularity data
   */
  const generateMockServicePopularityData = (): ServicePopularityData[] => [
    { service: 'Dry Cleaning', count: 156, revenue: 7800 },
    { service: 'Laundry', count: 134, revenue: 4020 },
    { service: 'Alterations', count: 89, revenue: 2670 },
    { service: 'Pressing', count: 67, revenue: 1340 },
    { service: 'Stain Removal', count: 45, revenue: 1350 }
  ];

  return {
    generateMockSalesData,
    generateMockOrderStatusData,
    generateMockServicePopularityData
  };
};
