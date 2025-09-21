import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Truck, Users, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LoadingSkeleton from '@/components/ui/loading-skeleton';
import type { Route, Driver } from '@/lib/data-service';

interface LogisticsKpiData {
  totalRoutes: number;
  activeRoutes: number;
  completedRoutes: number;
  totalDrivers: number;
  availableDrivers: number;
  onTimeRate: number;
  averageDeliveryTime: number;
  totalRoutesChange: number;
  activeRoutesChange: number;
  completedRoutesChange: number;
  totalDriversChange: number;
  availableDriversChange: number;
  onTimeRateChange: number;
  averageDeliveryTimeChange: number;
}

interface LogisticsKPIsProps {
  data?: LogisticsKpiData;
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

export const LogisticsKPIs: React.FC<LogisticsKPIsProps> = React.memo(({ 
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

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getChangeType = (change: number): 'positive' | 'negative' | 'neutral' => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  const kpiData = [
    {
      title: "Active Routes",
      value: formatNumber(data.activeRoutes),
      change: `${formatPercentage(data.activeRoutesChange)} this hour`,
      changeType: getChangeType(data.activeRoutesChange),
      icon: <Truck className="h-5 w-5" />,
      description: "Routes currently in progress",
      color: "text-blue-600"
    },
    {
      title: "Available Drivers",
      value: formatNumber(data.availableDrivers),
      change: `${formatPercentage(data.availableDriversChange)} this hour`,
      changeType: getChangeType(data.availableDriversChange),
      icon: <Users className="h-5 w-5" />,
      description: "Drivers ready for assignment",
      color: "text-green-600"
    },
    {
      title: "On-Time Rate",
      value: `${data.onTimeRate.toFixed(1)}%`,
      change: `${formatPercentage(data.onTimeRateChange)} today`,
      changeType: getChangeType(data.onTimeRateChange),
      icon: <CheckCircle className="h-5 w-5" />,
      description: "Deliveries completed on time",
      color: "text-green-600"
    },
    {
      title: "Avg Delivery Time",
      value: formatTime(data.averageDeliveryTime),
      change: `${formatPercentage(data.averageDeliveryTimeChange)} vs yesterday`,
      changeType: getChangeType(-data.averageDeliveryTimeChange), // Negative because lower is better
      icon: <Clock className="h-5 w-5" />,
      description: "Average time per delivery",
      color: "text-purple-600"
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

export default LogisticsKPIs;
