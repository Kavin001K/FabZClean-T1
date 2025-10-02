/**
 * Recent Activity Section Component
 * 
 * Displays recent orders and due today orders in a side-by-side layout.
 * Provides quick access to order management and tracking.
 * 
 * @component
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaggerChildren, StaggerItem } from "@/components/ui/page-transition";
import RecentOrders from "@/components/dashboard/recent-orders";
import DueTodayOrders from "@/components/dashboard/due-today-orders";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";
import { Clock, Calendar } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: string | number;
  createdAt: Date | string;
  pickupDate?: Date | string;
}

interface RecentActivitySectionProps {
  /** Recent orders data */
  recentOrders?: Order[];
  /** Due today orders data */
  dueTodayOrders?: Order[];
  /** Loading state */
  isLoading?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Layout configuration */
  layout?: 'horizontal' | 'vertical';
  /** Number of items to show in each section */
  itemLimit?: number;
  /** Whether to show view all buttons */
  showViewAll?: boolean;
}

/**
 * Recent Activity Section Component
 * 
 * Renders recent orders and due today orders with loading states.
 */
export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({
  recentOrders = [],
  dueTodayOrders = [],
  isLoading = false,
  className = "",
  layout = 'horizontal',
  itemLimit = 5,
  showViewAll = true
}) => {
  const containerClasses = layout === 'horizontal' 
    ? "grid gap-6 grid-cols-1 lg:grid-cols-2"
    : "space-y-6";

  if (isLoading) {
    return (
      <div className={`${containerClasses} ${className}`} data-testid="recent-activity-loading">
        <LoadingSkeleton.OrdersList />
        <LoadingSkeleton.OrdersList />
      </div>
    );
  }

  return (
    <StaggerChildren 
      className={`${containerClasses} ${className}`} 
      data-testid="recent-activity-section"
    >
      {/* Recent Orders */}
      <StaggerItem>
        <Card data-testid="recent-orders-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrders 
              orders={recentOrders}
              isLoading={isLoading}
              limit={itemLimit}
              showViewAll={showViewAll}
              data-testid="recent-orders-list"
            />
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Due Today Orders */}
      <StaggerItem>
        <Card data-testid="due-today-orders-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DueTodayOrders 
              orders={dueTodayOrders}
              isLoading={isLoading}
              limit={itemLimit}
              showViewAll={showViewAll}
              showDateSelector={true}
              data-testid="due-today-orders-list"
            />
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerChildren>
  );
};

/**
 * Activity Summary Component
 * 
 * Displays a summary of recent activity with key metrics.
 */
interface ActivitySummaryProps {
  /** Total number of recent orders */
  totalRecentOrders: number;
  /** Total number of due today orders */
  totalDueTodayOrders: number;
  /** Number of overdue orders */
  overdueOrders?: number;
  /** Loading state */
  isLoading?: boolean;
}

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({
  totalRecentOrders,
  totalDueTodayOrders,
  overdueOrders = 0,
  isLoading = false
}) => {
  if (isLoading) {
    return <LoadingSkeleton.Skeleton className="h-16 w-full" data-testid="activity-summary-loading" />;
  }

  return (
    <Card className="mb-6" data-testid="activity-summary">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div data-testid="recent-orders-summary">
            <div className="text-2xl font-bold text-blue-600">{totalRecentOrders}</div>
            <div className="text-sm text-muted-foreground">Recent Orders</div>
          </div>
          <div data-testid="due-today-summary">
            <div className="text-2xl font-bold text-green-600">{totalDueTodayOrders}</div>
            <div className="text-sm text-muted-foreground">Due Today</div>
          </div>
          <div data-testid="overdue-summary">
            <div className="text-2xl font-bold text-red-600">{overdueOrders}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Activity Filter Component
 * 
 * Provides filtering options for the activity section.
 */
interface ActivityFilterProps {
  /** Current filter value */
  filter: string;
  /** Filter change handler */
  onFilterChange: (filter: string) => void;
  /** Available filter options */
  filterOptions?: Array<{ value: string; label: string }>;
}

export const ActivityFilter: React.FC<ActivityFilterProps> = ({
  filter,
  onFilterChange,
  filterOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' }
  ]
}) => {
  return (
    <div className="flex gap-2 mb-4" data-testid="activity-filter">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            filter === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          data-testid={`filter-${option.value}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
