/**
 * Dashboard Footer Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Date} props.lastUpdated - Last updated timestamp
 * @param {Function} props.onRefresh - Refresh handler
 * @returns {JSX.Element} Rendered footer component
 * 
 * @example
 * ```tsx
 * <DashboardFooter
 *   lastUpdated={lastUpdated}
 *   onRefresh={refreshData}
 * />
 * ```
 */

import React from 'react';
import { RefreshCw, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TEST_IDS, getTestId } from '@/lib/test-ids';

interface DashboardFooterProps {
  /** Last updated timestamp */
  lastUpdated: Date;
  /** Refresh handler */
  onRefresh: () => void;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = React.memo(({
  lastUpdated,
  onRefresh,
}) => {
  const handleRefresh = () => {
    onRefresh();
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card 
      className="border-0 shadow-none bg-muted/30"
      data-testid={getTestId(TEST_IDS.DASHBOARD.WIDGET, 'footer')}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Last updated: {getTimeAgo(lastUpdated)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Live data</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            data-testid={getTestId(TEST_IDS.BUTTON.REFRESH, 'footer')}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

DashboardFooter.displayName = 'DashboardFooter';
