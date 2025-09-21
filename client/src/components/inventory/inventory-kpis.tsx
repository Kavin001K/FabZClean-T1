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
}

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description: string;
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = React.memo(({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  description,
  color = "text-primary"
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
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary/40 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className={cn("transition-colors", color)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
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
  isError 
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton.KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="grid gap-6 grid-cols-4">
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

  const kpiData = [
    {
      title: "Total Items",
      value: formatNumber(data.totalItems),
      change: `${formatPercentage(data.totalItemsChange)} this month`,
      changeType: getChangeType(data.totalItemsChange),
      icon: <Package className="h-5 w-5" />,
      description: "All inventory items",
      color: "text-blue-600"
    },
    {
      title: "Total Value",
      value: formatCurrency(data.totalValue),
      change: `${formatPercentage(data.totalValueChange)} this month`,
      changeType: getChangeType(data.totalValueChange),
      icon: <DollarSign className="h-5 w-5" />,
      description: "Inventory value",
      color: "text-green-600"
    },
    {
      title: "In Stock",
      value: formatNumber(data.inStockItems),
      change: `${formatPercentage(data.inStockItemsChange)} this week`,
      changeType: getChangeType(data.inStockItemsChange),
      icon: <CheckCircle className="h-5 w-5" />,
      description: "Items available",
      color: "text-green-600"
    },
    {
      title: "Low Stock",
      value: formatNumber(data.lowStockItems),
      change: `${formatPercentage(data.lowStockItemsChange)} this week`,
      changeType: getChangeType(data.lowStockItemsChange),
      icon: <AlertTriangle className="h-5 w-5" />,
      description: "Items need restocking",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid gap-6 grid-cols-4">
      {kpiData.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
});

export default InventoryKPIs;
