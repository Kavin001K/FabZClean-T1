import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";

const SAMPLE_SALES_DATA = [
  { month: "Jan", revenue: 12000, orders: 45 },
  { month: "Feb", revenue: 15000, orders: 52 },
  { month: "Mar", revenue: 18000, orders: 61 },
  { month: "Apr", revenue: 16000, orders: 48 },
  { month: "May", revenue: 20000, orders: 67 },
  { month: "Jun", revenue: 22000, orders: 73 },
];

export interface SalesData {
  month: string;
  revenue: number;
  orders?: number;
  date?: string;
}

interface SalesChartProps {
  data?: SalesData[];
  isLoading?: boolean;
  showArea?: boolean;
  height?: number;
  title?: string;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{`${label}`}</p>
        <p className="text-sm text-primary">
          Revenue: ₹{payload[0].value?.toLocaleString()}
        </p>
        {payload[1] && (
          <p className="text-sm text-muted-foreground">
            Orders: {payload[1].value}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default React.memo(function SalesChart({ 
  data, 
  isLoading = false, 
  showArea = false,
  height = 350,
  title = "Revenue Trend",
  className 
}: SalesChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return SAMPLE_SALES_DATA;
    return data.map(item => ({
      month: item.month || item.date || '',
      revenue: item.revenue || 0,
      orders: item.orders || 0,
    }));
  }, [data]);

  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.revenue, 0);
  }, [chartData]);

  const revenueChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].revenue;
    const last = chartData[chartData.length - 1].revenue;
    return ((last - first) / first) * 100;
  }, [chartData]);

  if (isLoading) {
    return <LoadingSkeleton.ChartSkeleton />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1" />
              No data available
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No sales data available</p>
              <p className="text-sm">Data will appear here once orders are created</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = showArea ? AreaChart : LineChart;
  const DataComponent = showArea ? Area : Line;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              {revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
              )}
              <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(revenueChange).toFixed(1)}%
              </span>
            </div>
            <div className="text-right">
              <div className="font-medium">₹{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Revenue</div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${Math.max(height, 400)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--muted))" 
                opacity={0.3}
              />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {showArea ? (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ 
                    r: 6, 
                    fill: 'hsl(var(--primary))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2
                  }}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
