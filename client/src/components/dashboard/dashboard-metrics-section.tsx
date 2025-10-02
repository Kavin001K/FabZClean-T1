/**
 * Dashboard Metrics Section Component
 * 
 * Displays key performance indicators (KPIs) in a grid layout.
 * Shows metrics like total revenue, orders, customers, and average order value.
 * 
 * @component
 */

import React from "react";
import { DollarSign, Users, CreditCard, Package, TrendingUp, TrendingDown } from "lucide-react";
import KpiCard from "@/components/dashboard/kpi-card";
import { StaggerChildren, StaggerItem } from "@/components/ui/page-transition";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";

interface DashboardMetric {
  /** Unique identifier for the metric */
  id: string;
  /** Display title of the metric */
  title: string;
  /** Current value of the metric */
  value: string | number;
  /** Previous value for comparison */
  previousValue?: string | number;
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Color theme for the card */
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  /** Format type for the value */
  format?: 'currency' | 'number' | 'percentage';
  /** Additional description or subtitle */
  description?: string;
}

interface DashboardMetricsSectionProps {
  /** Array of metrics to display */
  metrics: DashboardMetric[];
  /** Loading state */
  isLoading?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Number of columns in the grid */
  columns?: 2 | 3 | 4;
}

/**
 * Dashboard Metrics Section Component
 * 
 * Renders a grid of KPI cards with loading states and animations.
 */
export const DashboardMetricsSection: React.FC<DashboardMetricsSectionProps> = ({
  metrics,
  isLoading = false,
  className = "",
  columns = 4
}) => {
  // Grid column classes based on the columns prop
  const gridClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  /**
   * Calculate percentage change between current and previous values
   */
  const calculateChange = (current: string | number, previous?: string | number): number | null => {
    if (!previous || previous === 0) return null;
    
    const currentNum = typeof current === 'string' ? parseFloat(current.replace(/[^0-9.-]+/g, '')) : current;
    const previousNum = typeof previous === 'string' ? parseFloat(previous.replace(/[^0-9.-]+/g, '')) : previous;
    
    if (isNaN(currentNum) || isNaN(previousNum)) return null;
    
    return ((currentNum - previousNum) / previousNum) * 100;
  };

  /**
   * Format the change percentage for display
   */
  const formatChange = (change: number | null): string => {
    if (change === null) return "";
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  /**
   * Get the trend icon based on change value
   */
  const getTrendIcon = (change: number | null) => {
    if (change === null) return null;
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  if (isLoading) {
    return (
      <div className={`grid gap-6 ${gridClasses[columns]} ${className}`} data-testid="dashboard-metrics-loading">
        {Array.from({ length: columns }).map((_, index) => (
          <LoadingSkeleton.KpiCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <StaggerChildren className={`grid gap-6 ${gridClasses[columns]} ${className}`} data-testid="dashboard-metrics-section">
      {metrics.map((metric) => {
        const change = calculateChange(metric.value, metric.previousValue);
        const TrendIcon = getTrendIcon(change);
        
        return (
          <StaggerItem key={metric.id}>
            <KpiCard
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              format={metric.format}
              description={metric.description}
              change={change !== null ? formatChange(change) : undefined}
              trend={change !== null ? (change >= 0 ? 'up' : 'down') : undefined}
              data-testid={`metric-card-${metric.id}`}
            />
          </StaggerItem>
        );
      })}
    </StaggerChildren>
  );
};

/**
 * Default metrics configuration for common dashboard use cases
 */
export const createDefaultMetrics = (data: {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  previousRevenue?: number;
  previousOrders?: number;
  previousCustomers?: number;
  previousAverageOrderValue?: number;
}): DashboardMetric[] => [
  {
    id: 'total-revenue',
    title: 'Total Revenue',
    value: data.totalRevenue,
    previousValue: data.previousRevenue,
    icon: DollarSign,
    color: 'green',
    format: 'currency',
    description: 'Total revenue generated'
  },
  {
    id: 'total-orders',
    title: 'Total Orders',
    value: data.totalOrders,
    previousValue: data.previousOrders,
    icon: Package,
    color: 'blue',
    format: 'number',
    description: 'Number of orders processed'
  },
  {
    id: 'total-customers',
    title: 'Total Customers',
    value: data.totalCustomers,
    previousValue: data.previousCustomers,
    icon: Users,
    color: 'purple',
    format: 'number',
    description: 'Active customer base'
  },
  {
    id: 'average-order-value',
    title: 'Avg Order Value',
    value: data.averageOrderValue,
    previousValue: data.previousAverageOrderValue,
    icon: CreditCard,
    color: 'orange',
    format: 'currency',
    description: 'Average value per order'
  }
];
