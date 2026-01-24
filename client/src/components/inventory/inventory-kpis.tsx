import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
import { formatCurrency } from '@/lib/data-service';
import type { InventoryItem } from '@/lib/data-service';

interface InventoryKpiData {
  totalItems: number;
  totalValue: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalItemsChange: number;
  totalValueChange: number;
  inStockItemsChange: number;
  lowStockItemsChange: number;
  outOfStockItemsChange: number;
}

interface InventoryKPIsProps {
  data?: InventoryKpiData;
  isLoading: boolean;
  isError: boolean;
  expiringSoonCount?: number;
}

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description: string;
  color?: string;
  isAlert?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = React.memo(({
  title,
  value,
  change,
  changeType,
  icon,
  description,
  color = "text-primary",
  isAlert = false
}) => {
  const getChangeColor = () => {
    if (changeType === "positive") return "text-green-600";
    if (changeType === "negative") return "text-red-600";
    return "text-muted-foreground";
  };

  const getChangeIcon = () => {
    if (changeType === "positive") return <TrendingUp className="h-3 w-3" />;
    if (changeType === "negative") return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 border-l-4 group",
      isAlert ? "border-l-red-500 bg-red-50/50" : "border-l-primary/20 hover:border-l-primary/40"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className={cn("transition-colors", isAlert ? "text-red-600 animate-pulse" : color)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold transition-colors", isAlert ? "text-red-700" : "text-foreground group-hover:text-primary")}>
          {value}
        </div>
        <div className={cn("flex items-center text-xs mt-1", getChangeColor())}>
          {getChangeIcon()}
          <span className="ml-1">{change}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/80 transition-colors">
          {description}
        </p>
      </CardContent>
    </Card>
  );
});

export const InventoryKPIs: React.FC<InventoryKPIsProps> = React.memo(({
  data,
  isLoading,
  isError,
  expiringSoonCount = 0
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton.KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="flex items-center justify-center h-24">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Failed to load</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getChangeType = (change: number): 'positive' | 'negative' | 'neutral' => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  const criticalItems = data.lowStockItems + data.outOfStockItems;

  const kpiData = [
    {
      title: "Critical Alerts",
      value: formatNumber(criticalItems),
      change: `${criticalItems > 5 ? 'Action Needed' : 'Stable'}`,
      changeType: criticalItems > 0 ? 'negative' : 'neutral' as any,
      icon: <AlertTriangle className="h-5 w-5" />,
      description: "Low stock & Out of stock",
      color: "text-red-600",
      isAlert: criticalItems > 0
    },
    {
      title: "Upcoming Expiries",
      value: formatNumber(expiringSoonCount),
      change: "Next 15 Days",
      changeType: "neutral" as any,
      icon: <AlertTriangle className="h-5 w-5" />,
      description: "Chemicals expiring soon",
      color: "text-orange-600"
    },
    {
      title: "Inventory Value",
      value: formatCurrency(data.totalValue),
      change: `${formatPercentage(data.totalValueChange)} vs last month`,
      changeType: getChangeType(data.totalValueChange),
      icon: <DollarSign className="h-5 w-5" />,
      description: "Total asset value",
      color: "text-green-600"
    },
    {
      title: "Total Items",
      value: formatNumber(data.totalItems),
      change: `${formatPercentage(data.totalItemsChange)} vs last month`,
      changeType: getChangeType(data.totalItemsChange),
      icon: <Package className="h-5 w-5" />,
      description: "Tracked SKUs",
      color: "text-blue-600"
    }
  ];

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
});

export default InventoryKPIs;
