import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadialBarChart,
  RadialBar
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users,
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  FileText,
  Activity,
  Clock,
  Star,
  Award
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";
import type { Service, Order, Customer, PosTransaction } from "@shared/schema";
// Import the data service
import { 
  analyticsApi,
  ordersApi,
  customersApi,
  inventoryApi,
  formatDate,
  getStatusColor,
  getPriorityColor,
  type InventoryItem
} from '@/lib/data-service';

// Color schemes for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  // Filter states
  const [dateRange, setDateRange] = useState("last-30-days");
  const [franchise, setFranchise] = useState("all");
  const [serviceType, setServiceType] = useState("all");
  const [insights, setInsights] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  // State for real data
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  // Fetch real data from database
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        
        const [
          ordersData,
          customersData,
          inventoryData
        ] = await Promise.all([
          ordersApi.getAll(),
          customersApi.getAll(),
          inventoryApi.getAll()
        ]);

        setOrders(ordersData);
        setCustomers(customersData);
        setInventory(inventoryData);
        
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [toast]);

  // Calculate comprehensive analytics data using real data
  const analyticsData = useMemo(() => {
    if (isLoading || orders.length === 0) {
      return {
        revenueByMonth: [],
        servicePerformance: [],
        categoryPerformance: [],
        customerSegments: [],
        orderStatusDistribution: [],
        revenueTrend: [],
        customerGrowth: [],
        operationalMetrics: {},
        topCustomers: [],
        serviceEfficiency: [],
        inventoryAnalysis: [],
        timeAnalysis: []
      };
    }

    // 1. REVENUE ANALYSIS
    const revenueByMonth = orders.reduce((acc, order) => {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.revenue += parseFloat(order.totalAmount);
        existing.orders += 1;
      } else {
        acc.push({ month, revenue: parseFloat(order.totalAmount), orders: 1 });
      }
      return acc;
    }, [] as any[]).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // 2. SERVICE PERFORMANCE ANALYSIS
    const servicePerformance = orders.reduce((acc, order) => {
      const serviceName = order.service || 'Unknown Service';
      const existing = acc.find(item => item.name === serviceName);
      if (existing) {
        existing.orders += 1;
        existing.revenue += parseFloat(order.totalAmount);
        existing.avgOrderValue = existing.revenue / existing.orders;
      } else {
        acc.push({ 
          name: serviceName, 
          orders: 1, 
          revenue: parseFloat(order.totalAmount),
          avgOrderValue: parseFloat(order.totalAmount)
        });
      }
      return acc;
    }, [] as any[]).sort((a, b) => b.revenue - a.revenue);

    // 3. CUSTOMER SEGMENTATION
    const customerSegments = customers.reduce((acc, customer) => {
      const totalSpent = parseFloat(customer.totalSpent);
      let segment = 'New';
      if (totalSpent > 1000) segment = 'VIP';
      else if (totalSpent > 500) segment = 'Premium';
      else if (totalSpent > 100) segment = 'Regular';
      
      const existing = acc.find(item => item.segment === segment);
      if (existing) {
        existing.count += 1;
        existing.revenue += totalSpent;
      } else {
        acc.push({ segment, count: 1, revenue: totalSpent });
      }
      return acc;
    }, [] as any[]);

    // 4. ORDER STATUS DISTRIBUTION
    const orderStatusDistribution = orders.reduce((acc, order) => {
      const existing = acc.find(item => item.status === order.status);
      if (existing) {
        existing.count += 1;
        existing.revenue += parseFloat(order.totalAmount);
      } else {
        acc.push({ status: order.status, count: 1, revenue: parseFloat(order.totalAmount) });
      }
      return acc;
    }, [] as any[]);

    // 5. REVENUE TREND (Daily)
    const revenueTrend = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.revenue += parseFloat(order.totalAmount);
        existing.orders += 1;
      } else {
        acc.push({ date, revenue: parseFloat(order.totalAmount), orders: 1 });
      }
      return acc;
    }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 6. CUSTOMER GROWTH
    const customerGrowth = customers.reduce((acc, customer) => {
      const month = new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.newCustomers += 1;
        existing.totalSpent += parseFloat(customer.totalSpent);
      } else {
        acc.push({ month, newCustomers: 1, totalSpent: parseFloat(customer.totalSpent) });
      }
      return acc;
    }, [] as any[]).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // 7. TOP CUSTOMERS
    const topCustomers = customers
      .sort((a, b) => parseFloat(b.totalSpent) - parseFloat(a.totalSpent))
      .slice(0, 10)
      .map(customer => ({
        name: customer.name,
        totalSpent: parseFloat(customer.totalSpent),
        orders: customer.totalOrders,
        avgOrderValue: parseFloat(customer.totalSpent) / customer.totalOrders
      }));

    // 8. SERVICE EFFICIENCY
    const serviceEfficiency = servicePerformance.map(service => ({
      ...service,
      efficiency: service.orders > 0 ? (service.revenue / service.orders) : 0,
      marketShare: (service.orders / orders.length) * 100
    }));

    // 9. INVENTORY ANALYSIS
    const inventoryAnalysis = inventory.map(item => ({
      name: item.name,
      stock: item.stock,
      status: item.status,
      value: item.stock * 25 // Approximate value per unit
    }));

    // 10. TIME ANALYSIS (Hourly distribution)
    const timeAnalysis = orders.reduce((acc, order) => {
      const hour = new Date(order.createdAt).getHours();
      const existing = acc.find(item => item.hour === hour);
      if (existing) {
        existing.orders += 1;
        existing.revenue += parseFloat(order.totalAmount);
      } else {
        acc.push({ hour, orders: 1, revenue: parseFloat(order.totalAmount) });
      }
      return acc;
    }, [] as any[]).sort((a, b) => a.hour - b.hour);

    // 11. OPERATIONAL METRICS
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const avgOrderValue = totalRevenue / orders.length;
    const completionRate = (orders.filter(o => o.status === 'completed').length / orders.length) * 100;
    const customerRetention = customers.filter(c => c.totalOrders > 1).length / customers.length * 100;

    const operationalMetrics = {
      totalRevenue,
      avgOrderValue,
      completionRate,
      customerRetention,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      inventoryValue: inventory.reduce((sum, item) => sum + (item.stock * 25), 0)
    };

    return {
      revenueByMonth,
      servicePerformance,
      categoryPerformance: customerSegments,
      customerSegments,
      orderStatusDistribution,
      revenueTrend,
      customerGrowth,
      operationalMetrics,
      topCustomers,
      serviceEfficiency,
      inventoryAnalysis,
      timeAnalysis
    };
  }, [orders, customers, inventory, isLoading]);

  // Generate AI-powered insights
  const generateInsights = () => {
    const insights = [];
    const { operationalMetrics, servicePerformance, customerSegments } = analyticsData;

    if (operationalMetrics.avgOrderValue > 200) {
      insights.push("High average order value indicates premium service positioning");
    }
    
    if (operationalMetrics.completionRate > 90) {
      insights.push("Excellent completion rate shows strong operational efficiency");
    }
    
    if (customerSegments.find(s => s.segment === 'VIP')?.count > 5) {
      insights.push("Strong VIP customer base indicates high-value service delivery");
    }

    const topService = servicePerformance[0];
    if (topService) {
      insights.push(`${topService.name} is your top-performing service with ${topService.orders} orders`);
    }

    setInsights(insights);
    setShowInsights(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateInsights}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Insights
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.operationalMetrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.operationalMetrics.totalOrders} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.operationalMetrics.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analyticsData.operationalMetrics.completionRate)}</div>
            <p className="text-xs text-muted-foreground">
              Orders completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analyticsData.operationalMetrics.customerRetention)}</div>
            <p className="text-xs text-muted-foreground">
              Repeat customers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="services">Service Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* REVENUE ANALYSIS TAB */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SERVICE PERFORMANCE TAB */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Service Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.servicePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]} />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                      data={analyticsData.servicePerformance}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                      dataKey="orders"
                                    >
                      {analyticsData.servicePerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

          <Card>
                    <CardHeader>
              <CardTitle>Service Efficiency Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={analyticsData.serviceEfficiency}>
                  <CartesianGrid />
                  <XAxis dataKey="orders" name="Orders" />
                  <YAxis dataKey="efficiency" name="Avg Order Value" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter dataKey="efficiency" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
                    </CardContent>
                </Card>
        </TabsContent>

        {/* CUSTOMER ANALYTICS TAB */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, percent }) => `${segment} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.customerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="newCustomers" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
              <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {analyticsData.topCustomers.map((customer, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell>{formatCurrency(customer.avgOrderValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </TabsContent>

        {/* OPERATIONS TAB */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.orderStatusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Order Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.timeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
              <CardHeader>
              <CardTitle>Inventory Analysis</CardTitle>
              </CardHeader>
              <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.inventoryAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Stock']} />
                  <Bar dataKey="stock" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* AI Insights Modal */}
      {showInsights && (
        <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI-Powered Business Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowInsights(false)}>
                Close
              </Button>
                </div>
              </CardContent>
            </Card>
      )}
    </div>
  );
}