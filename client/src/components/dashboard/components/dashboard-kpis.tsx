/**
 * Dashboard KPIs Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.metrics - Dashboard metrics
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} Rendered KPIs component
 * 
 * @example
 * ```tsx
 * <DashboardKPIs
 *   metrics={metrics}
 *   isLoading={false}
 * />
 * ```
 */

import React from 'react';
import { DollarSign, Users, CreditCard, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { formatCurrency } from '@/lib/data-service';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';

interface DashboardKPIsProps {
  /** Dashboard metrics */
  metrics: any;
  /** Loading state */
  isLoading: boolean;
}

const KPI_CARDS = [
  {
    id: 'revenue',
    title: 'Total Revenue',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'customers',
    title: 'Total Customers',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'orders',
    title: 'Total Orders',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'products',
    title: 'Products Sold',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
] as const;

export const DashboardKPIs: React.FC<DashboardKPIsProps> = React.memo(({
  metrics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid={getTestId(TEST_IDS.DASHBOARD.KPI, 'loading')}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-6">
            <LoadingSkeleton.CardSkeleton />
          </Card>
        ))}
      </div>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      data-testid={getTestId(TEST_IDS.DASHBOARD.KPI)}
    >
      {KPI_CARDS.map((card) => {
        const Icon = card.icon;
        const value = metrics[card.id]?.value || 0;
        const change = metrics[card.id]?.change || 0;
        const changeText = metrics[card.id]?.changeText || '0%';

        return (
          <Card 
            key={card.id}
            className="relative overflow-hidden"
            data-testid={getTestId(TEST_IDS.DASHBOARD.KPI, card.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.id === 'revenue' ? formatCurrency(value) : value.toLocaleString()}
              </div>
              <div className="flex items-center space-x-1 text-xs">
                {getTrendIcon(change)}
                <span className={getTrendColor(change)}>
                  {changeText}
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

DashboardKPIs.displayName = 'DashboardKPIs';
