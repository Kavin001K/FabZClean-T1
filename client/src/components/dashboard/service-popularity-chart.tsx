import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { TrendingUp, Award, Target, Percent } from "lucide-react";
import {
  mean,
  calculateGrowthRate,
  correlation,
} from "@/lib/statistics";

// ✅ Removed hardcoded defaultData - always use provided data or empty array
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface ServicePopularityChartProps {
  data?: Array<{ name: string; value?: number; orders?: number; revenue?: number; fill?: string }>;
  previousPeriodData?: Array<{ name: string; value?: number; orders?: number }>;
}

export default function ServicePopularityChart({ data, previousPeriodData }: ServicePopularityChartProps) {
  const chartData = useMemo(() => {
    // ✅ Safety: Always use provided data or empty array (no mock data)
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data.map(item => ({
      ...item,
      value: item.value || item.orders || 0,
      orders: item.orders || item.value || 0,
      revenue: item.revenue || 0,
      fill: item.fill || "hsl(var(--primary))"
    }));
  }, [data]);

  // Calculate comprehensive statistics
  const statistics = useMemo(() => {
    // ✅ Safety: Handle empty data
    if (!Array.isArray(chartData) || chartData.length === 0) {
      return {
        servicesWithStats: [],
        sortedByOrders: [],
        sortedByRevenue: [],
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        topService: null,
        fastestGrowing: null,
        orderRevenueCorrelation: 0,
        avgOrders: 0,
        avgRevenue: 0,
      };
    }
    
    const totalOrders = chartData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const totalRevenue = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);

    // Calculate market share for each service
    const servicesWithStats = chartData.map((service, index) => {
      const marketShare = totalOrders > 0 ? (service.orders / totalOrders) * 100 : 0;
      const avgOrderValue = service.orders > 0 ? (service.revenue || 0) / service.orders : 0;

      // Calculate growth if previous period data exists
      let growth = 0;
      if (previousPeriodData) {
        const prevService = previousPeriodData.find(p => p.name === service.name);
        if (prevService) {
          const prevValue = prevService.value || prevService.orders || 0;
          growth = calculateGrowthRate(service.orders, prevValue);
        }
      }

      return {
        ...service,
        marketShare,
        avgOrderValue,
        growth,
        color: COLORS[index % COLORS.length],
      };
    });

    // Sort by orders to find top performers
    const sortedByOrders = [...servicesWithStats].sort((a, b) => b.orders - a.orders);
    const topService = sortedByOrders[0];

    // Find fastest growing service
    const fastestGrowing = previousPeriodData
      ? [...servicesWithStats].sort((a, b) => b.growth - a.growth)[0]
      : null;

    // Calculate correlation between order volume and revenue
    const orderVolumes = servicesWithStats.map(s => s.orders);
    const revenues = servicesWithStats.map(s => s.revenue || 0);
    const orderRevenueCorrelation = correlation(orderVolumes, revenues);

    // Calculate average metrics
    const avgOrders = mean(orderVolumes);
    const avgRevenue = mean(revenues);

    return {
      servicesWithStats,
      sortedByOrders,
      totalOrders,
      totalRevenue,
      topService,
      fastestGrowing,
      orderRevenueCorrelation,
      avgOrders,
      avgRevenue,
    };
  }, [chartData, previousPeriodData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p>Orders: <span className="font-semibold">{data.orders}</span></p>
            <p>Revenue: <span className="font-semibold">₹{data.revenue?.toLocaleString()}</span></p>
            <p>Market Share: <span className="font-semibold">{(data.marketShare ?? 0).toFixed(1)}%</span></p>
            <p>Avg Order: <span className="font-semibold">₹{(data.avgOrderValue ?? 0).toFixed(0)}</span></p>
            {data.growth !== 0 && (
              <p className={data.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                Growth: <span className="font-semibold">{data.growth > 0 ? '+' : ''}{(data.growth ?? 0).toFixed(1)}%</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Service Popularity & Performance</span>
          {statistics.topService && (
          <Badge variant="default" className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            {statistics.topService.name}
          </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-xl font-bold">{statistics.totalOrders}</div>
            <div className="text-xs text-muted-foreground">Total Orders</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-xl font-bold">₹{((statistics.totalRevenue ?? 0) / 1000).toFixed(0)}K</div>
            <div className="text-xs text-muted-foreground">Total Revenue</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-xl font-bold">{chartData.length}</div>
            <div className="text-xs text-muted-foreground">Services</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-xl font-bold">
              {((statistics.orderRevenueCorrelation ?? 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Correlation</div>
          </div>
        </div>

        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={statistics.servicesWithStats || []}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="name"
              fontSize={11}
              angle={-20}
              textAnchor="end"
              height={80}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              fontSize={12}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" radius={[8, 8, 0, 0]}>
              {(statistics.servicesWithStats || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="orders" position="top" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Service Rankings */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Top Performers
          </h4>
          {statistics.sortedByOrders.slice(0, 3).map((service, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: service.color }}
                />
                <span className="text-sm font-medium">{service.name}</span>
                {index === 0 && <Award className="h-3 w-3 text-yellow-500" />}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold">{service.orders} orders</div>
                  <div className="text-xs text-muted-foreground">
                    {(service.marketShare ?? 0).toFixed(1)}% share
                  </div>
                </div>
                {service.growth !== 0 && (
                  <Badge
                    variant={service.growth > 0 ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {service.growth > 0 ? '+' : ''}{(service.growth ?? 0).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Fastest Growing Service */}
        {statistics.fastestGrowing && statistics.fastestGrowing.growth > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Fastest Growing</span>
            </div>
            <p className="text-sm text-green-700">
              <strong>{statistics.fastestGrowing.name}</strong> is growing at{' '}
              <strong>{(statistics.fastestGrowing.growth ?? 0).toFixed(1)}%</strong> compared to previous period
            </p>
          </div>
        )}

        {/* Statistical Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Market Share Analysis
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(statistics.servicesWithStats || []).map((service, index) => (
              <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                <span className="truncate">{service.name}</span>
                <Badge variant="outline" className="ml-2">
                  {(service.marketShare ?? 0).toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Correlation Insight */}
        {(statistics.orderRevenueCorrelation ?? 0) > 0.7 && (
          <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-700">
              <strong>Strong correlation ({((statistics.orderRevenueCorrelation ?? 0) * 100).toFixed(0)}%)</strong>{' '}
              between order volume and revenue indicates consistent pricing strategy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
