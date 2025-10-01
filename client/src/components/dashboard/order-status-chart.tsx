import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CheckCircle, Clock, Play, TrendingUp, TrendingDown } from "lucide-react";
import {
  orderCompletionRate,
  calculateGrowthRate,
  mean,
} from "@/lib/statistics";

const defaultData = [
  { name: "Pending", value: 400, status: "pending" },
  { name: "In Progress", value: 300, status: "in_progress" },
  { name: "Completed", value: 300, status: "completed" },
];

const COLORS = ["#FFBB28", "#00C49F", "#0088FE"];
const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  in_progress: Play,
  completed: CheckCircle,
};

interface OrderStatusChartProps {
  data?: Array<{ status: string; value: number; name?: string }>;
  previousPeriodData?: Array<{ status: string; value: number }>;
}

export default function OrderStatusChart({ data, previousPeriodData }: OrderStatusChartProps) {
  const chartData = data || defaultData;

  // Calculate statistical metrics
  const statistics = useMemo(() => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const completed = chartData.find(item =>
      item.status === 'completed' || item.name?.toLowerCase().includes('completed')
    )?.value || 0;

    const completionRate = orderCompletionRate(completed, total);

    // Calculate distribution percentages
    const distribution = chartData.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }));

    // Calculate average processing time estimate (mock calculation)
    const avgProcessingTime = mean(chartData.map(d => d.value * 2)); // Mock: 2 hours per order

    // Compare with previous period if available
    let completionGrowth = 0;
    if (previousPeriodData) {
      const prevTotal = previousPeriodData.reduce((sum, item) => sum + item.value, 0);
      const prevCompleted = previousPeriodData.find(item =>
        item.status === 'completed'
      )?.value || 0;
      const prevCompletionRate = orderCompletionRate(prevCompleted, prevTotal);
      completionGrowth = completionRate - prevCompletionRate;
    }

    // Find dominant status
    const dominantStatus = chartData.length > 0
      ? chartData.reduce((max, item) =>
          item.value > max.value ? item : max
        , chartData[0])
      : { name: 'N/A', value: 0, status: 'unknown' };

    return {
      total,
      completed,
      completionRate,
      distribution,
      avgProcessingTime,
      completionGrowth,
      dominantStatus,
    };
  }, [chartData, previousPeriodData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm">
              Orders: <span className="font-semibold">{data.value}</span>
            </p>
            <p className="text-sm">
              Percentage: <span className="font-semibold">{data.percentage?.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Status Distribution</span>
          <Badge variant={statistics.completionRate >= 80 ? "default" : "secondary"}>
            {statistics.completionRate.toFixed(1)}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistical Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{statistics.total}</div>
            <div className="text-xs text-muted-foreground">Total Orders</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{statistics.completionRate.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statistics.distribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Status Breakdown with Icons */}
        <div className="space-y-2">
          {statistics.distribution.map((item, index) => {
            const Icon = STATUS_ICONS[item.status] || CheckCircle;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{item.value} orders</span>
                  <Badge variant="outline">{item.percentage.toFixed(1)}%</Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Period Comparison */}
        {previousPeriodData && statistics.completionGrowth !== 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {statistics.completionGrowth > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Period Comparison</span>
            </div>
            <div className={`text-sm font-semibold ${statistics.completionGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {statistics.completionGrowth > 0 ? '+' : ''}{statistics.completionGrowth.toFixed(1)}%
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="text-xs text-muted-foreground space-y-1">
          {statistics.dominantStatus && statistics.dominantStatus.name && (
            <p>
              <strong>Dominant Status:</strong> {statistics.dominantStatus.name} with{' '}
              {statistics.distribution.find(d => d.name === statistics.dominantStatus.name)?.percentage.toFixed(1)}% of orders
            </p>
          )}
          {statistics.completionRate >= 90 && (
            <p className="text-green-600">
              Excellent performance! Completion rate is above 90%
            </p>
          )}
          {statistics.completionRate < 70 && (
            <p className="text-amber-600">
              Attention needed: Consider optimizing order processing workflow
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
