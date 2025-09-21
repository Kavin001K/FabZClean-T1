import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, TrendingUp, Users, DollarSign, Package, Clock, Truck, AlertTriangle,
  Settings, BarChart3, Zap, Gauge, CheckCircle2,
  Calendar, MapPin, Bell, Filter, RefreshCw, Download, Eye, Target,
  Machine, Wrench, ThermometerSun, DropletIcon, Timer, Award,
  TrendingDown, ArrowUp, ArrowDown, Minus, AlertCircle, CheckCircle,
  X, PlayCircle, PauseCircle, StopCircle, Power, Layers, Cpu
} from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Charts from recharts
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart
} from "recharts";

// Types
interface DashboardMetrics {
  todayRevenue: number;
  todayOrders: number;
  averageProcessingTime: number;
  capacityUtilization: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;
  revenueGrowthRate: number;
  profitMargin: number;
  activeCustomers: number;
  repeatCustomerRate: number;
  averageOrderValue: number;
  machinesInOperation: number;
  energyEfficiency: number;
  qualityScore: number;
  staffProductivity: number;
  costPerOrder: number;
}

interface EquipmentStatus {
  id: string;
  name: string;
  type: 'washer' | 'dryer' | 'press' | 'steamer';
  status: 'operational' | 'maintenance' | 'offline';
  utilization: number;
  temperature?: number;
  pressure?: number;
  cyclesCompleted: number;
  nextMaintenance: Date;
}

interface DeliveryScheduleItem {
  id: string;
  customerName: string;
  address: string;
  deliveryDate: Date;
  orderValue: number;
  priority: 'high' | 'medium' | 'low';
  status: 'scheduled' | 'in_progress' | 'completed';
  routeAssignment?: string;
}

const ManagerDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("today");
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds
  const [activeTab, setActiveTab] = useState<string>("operations");

  // Mock data - replace with actual API calls
  const mockMetrics: DashboardMetrics = {
    todayRevenue: 12450.75,
    todayOrders: 89,
    averageProcessingTime: 2.3,
    capacityUtilization: 87.5,
    onTimeDeliveryRate: 94.2,
    customerSatisfactionScore: 4.7,
    revenueGrowthRate: 12.8,
    profitMargin: 28.5,
    activeCustomers: 1247,
    repeatCustomerRate: 68.3,
    averageOrderValue: 139.90,
    machinesInOperation: 12,
    energyEfficiency: 92.1,
    qualityScore: 96.8,
    staffProductivity: 89.2,
    costPerOrder: 24.80
  };

  // Fetch dashboard metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/metrics?period=${selectedPeriod}`);
      if (!response.ok) {
        return mockMetrics; // Return mock data if API fails
      }
      return response.json();
    },
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true,
  });

  const displayMetrics = metrics || mockMetrics;

  // Mock revenue data for charts
  const revenueData = [
    { day: 'Mon', revenue: 8400, orders: 67 },
    { day: 'Tue', revenue: 9200, orders: 73 },
    { day: 'Wed', revenue: 7800, orders: 62 },
    { day: 'Thu', revenue: 11200, orders: 89 },
    { day: 'Fri', revenue: 12450, orders: 95 },
    { day: 'Sat', revenue: 9800, orders: 78 },
    { day: 'Sun', revenue: 6200, orders: 49 }
  ];

  const capacityData = [
    { time: '6AM', utilization: 45 },
    { time: '8AM', utilization: 78 },
    { time: '10AM', utilization: 92 },
    { time: '12PM', utilization: 98 },
    { time: '2PM', utilization: 87 },
    { time: '4PM', utilization: 82 },
    { time: '6PM', utilization: 65 },
    { time: '8PM', utilization: 34 }
  ];

  const orderDistribution = [
    { name: 'Dry Cleaning', value: 45, color: '#3B82F6' },
    { name: 'Laundry', value: 30, color: '#10B981' },
    { name: 'Alterations', value: 15, color: '#F59E0B' },
    { name: 'Special Care', value: 10, color: '#EF4444' }
  ];

  const equipmentStatus: EquipmentStatus[] = [
    {
      id: 'W001',
      name: 'Industrial Washer #1',
      type: 'washer',
      status: 'operational',
      utilization: 89,
      temperature: 65,
      cyclesCompleted: 23,
      nextMaintenance: new Date('2024-01-15')
    },
    {
      id: 'D003',
      name: 'Commercial Dryer #3',
      type: 'dryer',
      status: 'maintenance',
      utilization: 0,
      temperature: 0,
      cyclesCompleted: 45,
      nextMaintenance: new Date('2024-01-10')
    },
    {
      id: 'P002',
      name: 'Steam Press #2',
      type: 'press',
      status: 'operational',
      utilization: 76,
      pressure: 4.2,
      cyclesCompleted: 18,
      nextMaintenance: new Date('2024-01-20')
    }
  ];

  const deliverySchedule: DeliveryScheduleItem[] = [
    {
      id: 'D001',
      customerName: 'Smith & Associates',
      address: '123 Business Ave',
      deliveryDate: new Date(),
      orderValue: 245.80,
      priority: 'high',
      status: 'scheduled',
      routeAssignment: 'Route A'
    },
    {
      id: 'D002',
      customerName: 'Johnson Family',
      address: '456 Elm Street',
      deliveryDate: new Date(),
      orderValue: 89.50,
      priority: 'medium',
      status: 'in_progress',
      routeAssignment: 'Route B'
    }
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      operational: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      offline: 'bg-red-100 text-red-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border-0`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend = 'up',
    unit = '',
    format = 'number'
  }: {
    title: string;
    value: number;
    change?: number;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    unit?: string;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `$${val.toLocaleString()}`;
        case 'percentage':
          return `${val}%`;
        default:
          return val.toLocaleString();
      }
    };

    const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
    const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatValue(value)}{unit}
          </div>
          {change !== undefined && (
            <div className={`flex items-center text-xs ${trendColor} mt-1`}>
              <TrendIcon className="w-3 h-3 mr-1" />
              {Math.abs(change)}% from last period
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time operational intelligence for industrial dry cleaning & laundry
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <MetricCard
          title="Today's Revenue"
          value={displayMetrics.todayRevenue}
          change={displayMetrics.revenueGrowthRate}
          icon={DollarSign}
          format="currency"
          trend="up"
        />
        <MetricCard
          title="Orders Today"
          value={displayMetrics.todayOrders}
          change={8.2}
          icon={Package}
          trend="up"
        />
        <MetricCard
          title="Capacity Used"
          value={displayMetrics.capacityUtilization}
          change={5.1}
          icon={Gauge}
          format="percentage"
          trend="up"
        />
        <MetricCard
          title="On-Time Delivery"
          value={displayMetrics.onTimeDeliveryRate}
          change={2.4}
          icon={CheckCircle2}
          format="percentage"
          trend="up"
        />
        <MetricCard
          title="Quality Score"
          value={displayMetrics.qualityScore}
          change={1.2}
          icon={Award}
          format="percentage"
          trend="up"
        />
        <MetricCard
          title="Profit Margin"
          value={displayMetrics.profitMargin}
          change={-0.8}
          icon={TrendingUp}
          format="percentage"
          trend="down"
        />
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Daily Revenue & Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} name="Orders" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="w-5 h-5 mr-2" />
                  Capacity Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={capacityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="utilization" stroke="#F59E0B" fill="#FEF3C7" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Machine className="w-5 h-5 mr-2" />
                  Equipment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipmentStatus.map((equipment) => (
                    <div key={equipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{equipment.name}</span>
                          <span className="text-sm text-muted-foreground">{equipment.id}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{equipment.utilization}%</div>
                          <div className="text-xs text-muted-foreground">Utilization</div>
                        </div>
                        <StatusBadge status={equipment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              title="Processing Time"
              value={displayMetrics.averageProcessingTime}
              change={-12.5}
              icon={Clock}
              unit=" hrs"
              trend="down"
            />
            <MetricCard
              title="Staff Productivity"
              value={displayMetrics.staffProductivity}
              change={7.3}
              icon={Users}
              format="percentage"
              trend="up"
            />
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Average Order Value"
              value={displayMetrics.averageOrderValue}
              change={5.2}
              icon={DollarSign}
              format="currency"
              trend="up"
            />
            <MetricCard
              title="Cost Per Order"
              value={displayMetrics.costPerOrder}
              change={-3.1}
              icon={TrendingDown}
              format="currency"
              trend="down"
            />
            <MetricCard
              title="Repeat Customer Rate"
              value={displayMetrics.repeatCustomerRate}
              change={8.7}
              icon={Users}
              format="percentage"
              trend="up"
            />
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              title="Customer Satisfaction"
              value={displayMetrics.customerSatisfactionScore}
              change={4.2}
              icon={Award}
              unit="/5"
              trend="up"
            />
            <MetricCard
              title="Energy Efficiency"
              value={displayMetrics.energyEfficiency}
              change={2.8}
              icon={Zap}
              format="percentage"
              trend="up"
            />
          </div>
        </TabsContent>

        {/* Logistics Tab */}
        <TabsContent value="logistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Today's Delivery Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliverySchedule.map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{delivery.customerName}</div>
                        <div className="text-sm text-muted-foreground">{delivery.address}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">${delivery.orderValue}</div>
                        <div className="text-xs text-muted-foreground">{delivery.routeAssignment}</div>
                      </div>
                      <StatusBadge status={delivery.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard;