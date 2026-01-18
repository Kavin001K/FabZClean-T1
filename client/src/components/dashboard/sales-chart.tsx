import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, ReferenceArea } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";
import {
  mean,
  movingAverage,
  linearRegression,
  forecastLinear,
  confidenceInterval,
  standardDeviation,
} from "@/lib/statistics";

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
        <p className="font-medium mb-2">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-sm" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="text-sm font-semibold">
              {entry.name.includes('Forecast') || entry.name.includes('MA') || entry.name.includes('Trend')
                ? `₹${entry.value?.toLocaleString()}`
                : entry.name === 'Orders'
                ? entry.value
                : `₹${entry.value?.toLocaleString()}`}
            </span>
          </div>
        ))}
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

  // Calculate statistical metrics
  const statistics = useMemo(() => {
    const revenues = chartData.map(d => d.revenue);

    // Basic statistics
    const totalRevenue = revenues.reduce((sum, val) => sum + val, 0);
    const avgRevenue = mean(revenues);
    const stdDev = standardDeviation(revenues);

    // Growth rate
    const revenueChange = revenues.length >= 2
      ? ((revenues[revenues.length - 1] - revenues[0]) / revenues[0]) * 100
      : 0;

    // 7-day and 30-day moving averages
    const ma7 = movingAverage(revenues, Math.min(7, revenues.length));
    const ma30 = movingAverage(revenues, Math.min(30, revenues.length));

    // ✅ Minimum 3 months of data required for forecast/trend
    const hasEnoughData = chartData.length >= 3 && revenues.some(r => r > 0);

    // Linear regression for trend line (only if enough data)
    let regression = { slope: 0, intercept: 0, r2: 0 };
    let trendLine: (number | null)[] = [];
    let forecast: number[] = [];
    let forecastData: any[] = [];
    let ci = { lower: 0, upper: 0 };

    if (hasEnoughData) {
    const regressionData = revenues.map((revenue, index) => ({ x: index, y: revenue }));
      regression = linearRegression(regressionData);

    // Calculate trend line values
      trendLine = chartData.map((_, index) =>
      regression.slope * index + regression.intercept
    );

    // Forecast next 7 periods
      forecast = forecastLinear(revenues, 7);

    // Confidence interval
      ci = confidenceInterval(revenues, 0.95);

    // Prepare forecast data points (continuing from last actual data point)
      forecastData = forecast.map((value, index) => ({
      month: `F${index + 1}`,
      revenue: null,
      forecast: value,
      isForecast: true,
    }));
    } else {
      // Return null arrays if not enough data
      trendLine = chartData.map(() => null);
      forecastData = [];
    }

    return {
      totalRevenue,
      avgRevenue,
      stdDev,
      revenueChange,
      ma7,
      ma30,
      trendLine,
      forecast,
      forecastData,
      ci,
      regression,
      hasEnoughData, // ✅ Flag to conditionally render forecast/trend lines
    };
  }, [chartData]);

  // Combine actual data with statistical overlays
  const enhancedChartData = useMemo(() => {
    return chartData.map((item, index) => ({
      ...item,
      ma7: statistics.ma7[index] || null,
      ma30: statistics.ma30[index] || null,
      trendLine: statistics.trendLine[index] || null,
      ciLower: statistics.ci.lower || null,
      ciUpper: statistics.ci.upper || null,
    }));
  }, [chartData, statistics]);

  // Combine with forecast for full visualization
  const fullChartData = useMemo(() => {
    return [...enhancedChartData, ...statistics.forecastData];
  }, [enhancedChartData, statistics.forecastData]);

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
              {statistics.revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
              )}
              <span className={statistics.revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(statistics.revenueChange ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="text-right">
              <div className="font-medium">₹{statistics.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Revenue</div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistical Metrics Bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Avg: ₹{statistics.avgRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Badge>
          <Badge variant="outline">
            Std Dev: ₹{statistics.stdDev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Badge>
          <Badge variant="outline">
            R²: {((statistics.regression?.r2 ?? 0) * 100).toFixed(1)}%
          </Badge>
          {statistics.hasEnoughData && statistics.forecast[0] && (
          <Badge variant="secondary">
              Next Forecast: ₹{statistics.forecast[0].toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Badge>
          )}
        </div>

        <div style={{ height: `${Math.max(height, 400)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={fullChartData}
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

              {/* Confidence Interval Band */}
              <ReferenceArea
                y1={statistics.ci.lower}
                y2={statistics.ci.upper}
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                label="95% CI"
              />

              {/* Average Line */}
              <ReferenceLine
                y={statistics.avgRevenue}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{ value: 'Avg', position: 'right', fill: 'hsl(var(--muted-foreground))' }}
              />

              {/* Actual Revenue */}
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
                connectNulls={false}
              />

              {/* 7-Day Moving Average */}
              <Line
                type="monotone"
                dataKey="ma7"
                name="7-Day MA"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                strokeDasharray="3 3"
                connectNulls
              />

              {/* Trend Line - Only show if enough data */}
              {statistics.hasEnoughData && (
              <Line
                type="monotone"
                dataKey="trendLine"
                name="Trend Line"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              )}

              {/* Forecast - Only show if enough data */}
              {statistics.hasEnoughData && (
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                connectNulls
              />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Actual Revenue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500" style={{ width: '16px', height: '2px', borderTop: '2px dashed' }}></div>
            <span>7-Day MA</span>
          </div>
          {statistics.hasEnoughData && (
            <>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-amber-500" style={{ width: '16px', height: '2px', borderTop: '2px dashed' }}></div>
            <span>Trend Line</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-purple-500" style={{ width: '16px', height: '2px', borderTop: '2px dashed' }}></div>
            <span>Forecast</span>
          </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
