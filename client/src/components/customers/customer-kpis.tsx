import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, UserPlus, Repeat, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';

interface CustomerKpiData {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageSpend: number;
  totalCustomersChange: number;
  newCustomersChange: number;
  repeatCustomersChange: number;
  averageSpendChange: number;
  // Additional metrics for demo
  totalRevenue: number;
  totalRevenueChange: number;
  averageOrderValue: number;
  averageOrderValueChange: number;
  customerRetentionRate: number;
  customerRetentionRateChange: number;
}

interface CustomerKPIsProps {
  data?: CustomerKpiData;
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

export const CustomerKPIs: React.FC<CustomerKPIsProps> = React.memo(({ 
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      title: "Total Customers",
      value: formatNumber(data.totalCustomers),
      change: `${formatPercentage(data.totalCustomersChange)} this month`,
      changeType: getChangeType(data.totalCustomersChange),
      icon: <Users className="h-5 w-5" />,
      description: "All registered customers",
      color: "text-blue-600"
    },
    {
      title: "New Customers",
      value: formatNumber(data.newCustomers),
      change: `${formatPercentage(data.newCustomersChange)} this week`,
      changeType: getChangeType(data.newCustomersChange),
      icon: <UserPlus className="h-5 w-5" />,
      description: "Customers joined recently",
      color: "text-green-600"
    },
    {
      title: "Repeat Rate",
      value: `${data.repeatCustomers.toFixed(1)}%`,
      change: `${formatPercentage(data.repeatCustomersChange)} this month`,
      changeType: getChangeType(data.repeatCustomersChange),
      icon: <Repeat className="h-5 w-5" />,
      description: "Customers with multiple orders",
      color: "text-purple-600"
    },
    {
      title: "Average Spend",
      value: formatCurrency(data.averageSpend),
      change: `${formatPercentage(data.averageSpendChange)} from last month`,
      changeType: getChangeType(data.averageSpendChange),
      icon: <DollarSign className="h-5 w-5" />,
      description: "Per customer lifetime value",
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

export default CustomerKPIs;
