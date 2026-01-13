/**
 * Dashboard Header Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filters
 * @param {Function} props.onDateRangeChange - Date range change handler
 * @param {Function} props.onRefresh - Refresh handler
 * @param {Date} props.lastUpdated - Last updated timestamp
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} Rendered header component
 * 
 * @example
 * ```tsx
 * <DashboardHeader
 *   filters={filters}
 *   onDateRangeChange={handleDateRangeChange}
 *   onRefresh={refreshData}
 *   lastUpdated={lastUpdated}
 *   isLoading={false}
 * />
 * ```
 */

import React from 'react';
import { RefreshCw, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { createHeaderComponent } from '@/lib/component-splitting';

interface DashboardHeaderProps {
  /** Current filters */
  filters: any;
  /** Date range change handler */
  onDateRangeChange: (dateRange: any) => void;
  /** Refresh handler */
  onRefresh: () => void;
  /** Last updated timestamp */
  lastUpdated: Date;
  /** Loading state */
  isLoading: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  filters,
  onDateRangeChange,
  onRefresh,
  lastUpdated,
  isLoading,
}) => {
  const handleRefresh = () => {
    onRefresh();
  };

  const handleDateRangeChange = (dateRange: any) => {
    onDateRangeChange(dateRange);
  };

  return (
    <Card 
      className="border-0 shadow-none"
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'header')}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Franchise Dashboard</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your business.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              data-testid={getTestId(TEST_IDS.BUTTON.REFRESH)}
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateRangeChange(filters.dateRange)}
              data-testid={getTestId(TEST_IDS.BUTTON.FILTER)}
              aria-label="Change date range"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {filters.dateRange?.from ? 'Change Range' : 'Select Range'}
            </Button>
          </div>
        </div>
        
        {lastUpdated && (
          <div className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        )}
      </CardHeader>
    </Card>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
