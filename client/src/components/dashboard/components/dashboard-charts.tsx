/**
 * Dashboard Charts Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.salesData - Sales chart data
 * @param {Array} props.orderStatusData - Order status chart data
 * @param {Array} props.servicePopularityData - Service popularity chart data
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} Rendered charts component
 * 
 * @example
 * ```tsx
 * <DashboardCharts
 *   salesData={salesData}
 *   orderStatusData={orderStatusData}
 *   servicePopularityData={servicePopularityData}
 *   isLoading={false}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';

// Import chart components
import SalesChart from '@/components/dashboard/sales-chart';
import OrderStatusChart from '@/components/dashboard/order-status-chart';
import ServicePopularityChart from '@/components/dashboard/service-popularity-chart';

interface DashboardChartsProps {
  /** Sales chart data */
  salesData: any[];
  /** Order status chart data */
  orderStatusData: any[];
  /** Service popularity chart data */
  servicePopularityData: any[];
  /** Loading state */
  isLoading: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = React.memo(({
  salesData,
  orderStatusData,
  servicePopularityData,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        data-testid={getTestId(TEST_IDS.DASHBOARD.CHART, 'loading')}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-6">
            <LoadingSkeleton.CardSkeleton />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      data-testid={getTestId(TEST_IDS.DASHBOARD.CHART)}
    >
      {/* Sales Chart */}
      <Card 
        className="col-span-1 lg:col-span-2"
        data-testid={getTestId(TEST_IDS.DASHBOARD.CHART, 'sales')}
      >
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={salesData} />
        </CardContent>
      </Card>

      {/* Order Status Chart */}
      <Card 
        className="col-span-1"
        data-testid={getTestId(TEST_IDS.DASHBOARD.CHART, 'order-status')}
      >
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusChart data={orderStatusData} />
        </CardContent>
      </Card>

      {/* Service Popularity Chart */}
      <Card 
        className="col-span-1"
        data-testid={getTestId(TEST_IDS.DASHBOARD.CHART, 'service-popularity')}
      >
        <CardHeader>
          <CardTitle>Service Popularity</CardTitle>
        </CardHeader>
        <CardContent>
          <ServicePopularityChart data={servicePopularityData} />
        </CardContent>
      </Card>
    </div>
  );
});

DashboardCharts.displayName = 'DashboardCharts';
