import { useMemo, useState } from "react";
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
  Area
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
  FileText
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage, SAMPLE_SALES_DATA } from "@/lib/data";
import type { Service, Order, Customer, PosTransaction } from "@shared/schema";
// Import the dummy data
import { 
  dummyOrders, 
  dummySalesData, 
  dummyOrderStatusData, 
  dummyServicePopularityData, 
  dummyCustomers,
  dummyInventory,
  generateInsights,
  type Order as DummyOrder,
  type Customer as DummyCustomer,
  type InventoryItem
} from '@/lib/dummy-data';

export default function Analytics() {
  // Filter states
  const [dateRange, setDateRange] = useState("last-30-days");
  const [franchise, setFranchise] = useState("all");
  const [serviceType, setServiceType] = useState("all");
  const [insights, setInsights] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  // Use dummy data instead of API calls for now
  const services = [
    { id: "1", name: "Dry Cleaning", category: "Premium", price: 250 },
    { id: "2", name: "Wash & Fold", category: "Standard", price: 150 },
    { id: "3", name: "Ironing", category: "Standard", price: 100 },
    { id: "4", name: "Premium Laundry", category: "Premium", price: 300 },
  ];

  const orders = dummyOrders;
  const customers = dummyCustomers;
  const metrics = {
    onTimeDelivery: 95.2,
    inventoryTurnover: 4.2,
  };

  const isLoading = false; // No loading state needed with dummy data

  // Calculate analytics data using dummy data
  const analyticsData = useMemo(() => {
    // Revenue by time period (using dummy sales data)
    const revenueByMonth = dummySalesData;

    // Service performance (using dummy service popularity data)
    const servicePerformance = dummyServicePopularityData.map(item => ({
      name: item.name,
      orders: item.value,
      revenue: item.value * 50, // Approximate revenue calculation
    }));

    // Category performance
    const categoryPerformance = [
      { name: "Premium", revenue: 120000, services: 2 },
      { name: "Standard", revenue: 80000, services: 2 },
    ];

    // Customer segments (using dummy customers)
    const customerSegments = customers.map(customer => ({
      name: customer.name,
      totalSpent: customer.totalOrders * 2000, // Approximate calculation
      totalOrders: customer.totalOrders,
      avgOrderValue: 2000,
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    // Order status distribution (using dummy order status data)
    const orderStatusDistribution = dummyOrderStatusData.map(item => ({
      status: item.status,
      count: item.value,
    }));

    return {
      revenueByMonth,
      servicePerformance: servicePerformance.slice(0, 10),
      categoryPerformance,
      customerSegments: customerSegments.slice(0, 10),
      orderStatusDistribution,
    };
  }, [customers]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (isLoading) {
    return (
      <div className="p-8" data-testid="analytics-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Business intelligence and performance insights</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="analytics-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">Business intelligence and performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-indicator status-online"></div>
          <span className="text-sm text-muted-foreground">Real-time Data</span>
        </div>
      </div>

      {/* Filters and Export Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-range" className="text-sm">Date Range:</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="franchise" className="text-sm">Franchise:</Label>
                  <Select value={franchise} onValueChange={setFranchise}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Franchises</SelectItem>
                      <SelectItem value="downtown">Downtown Central</SelectItem>
                      <SelectItem value="northside">Northside Hub</SelectItem>
                      <SelectItem value="eastwood">Eastwood Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="service-type" className="text-sm">Service:</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="dry-cleaning">Dry Cleaning</SelectItem>
                      <SelectItem value="wash-fold">Wash & Fold</SelectItem>
                      <SelectItem value="ironing">Ironing</SelectItem>
                      <SelectItem value="premium">Premium Laundry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const generatedInsights = generateInsights();
                  setInsights(generatedInsights);
                  setShowInsights(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Insights
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Section */}
      {showInsights && insights.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI-Powered Business Insights
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowInsights(false)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Revenue Growth</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">+24.3%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 text-green-500" />
                  <span className="text-xs text-green-500">vs last month</span>
                </div>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">3.2%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 text-green-500" />
                  <span className="text-xs text-green-500">+0.4% this week</span>
                </div>
              </div>
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Customer Retention</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">89.5%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="w-2 h-2 sm:w-3 sm:h-3 text-red-500" />
                  <span className="text-xs text-red-500">-1.2% this month</span>
                </div>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Inventory Efficiency</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground">94.7%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 text-green-500" />
                  <span className="text-xs text-green-500">+2.1% this week</span>
                </div>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue" data-testid="revenue-tab">Revenue</TabsTrigger>
          <TabsTrigger value="services" data-testid="services-tab">Services</TabsTrigger>
          <TabsTrigger value="customers" data-testid="customers-tab">Customers</TabsTrigger>
          <TabsTrigger value="operations" data-testid="operations-tab">Operations</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.revenueByMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `₹${(value / 1000)}k`} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value) => [`₹${(value as number / 1000).toFixed(1)}k`, "Revenue"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1) / 0.2)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Order Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData?.orderStatusDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData?.orderStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Monthly Revenue Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData?.revenueByMonth.map((item, index) => (
                      <TableRow key={item.month}>
                        <TableCell className="font-medium">{item.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm ${index > 0 && item.revenue > analyticsData.revenueByMonth[index - 1].revenue ? 'text-green-500' : 'text-red-500'}`}>
                            {index > 0 ? 
                              `${(((item.revenue - analyticsData.revenueByMonth[index - 1].revenue) / analyticsData.revenueByMonth[index - 1].revenue) * 100).toFixed(1)}%` 
                              : '-'
                            }
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Order Status Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData?.orderStatusDistribution.map((item) => {
                      const total = analyticsData.orderStatusDistribution.reduce((sum, order) => sum + order.count, 0);
                      const percentage = ((item.count / total) * 100).toFixed(1);
                      return (
                        <TableRow key={item.status}>
                          <TableCell className="font-medium">{item.status}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">{percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service Analytics */}
        <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bento-card">
                    <CardHeader>
                        <CardTitle className="font-display font-semibold text-lg text-foreground">
                            Top Performing Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsData?.servicePerformance || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="hsl(var(--muted-foreground))"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px"
                                        }}
                                        formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(var(--chart-2))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bento-card">
                    <CardHeader>
                        <CardTitle className="font-display font-semibold text-lg text-foreground">
                            Category Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analyticsData?.categoryPerformance || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="revenue"
                                    >
                                        {analyticsData?.categoryPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px"
                                        }}
                                        formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Service Data Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bento-card">
                    <CardHeader>
                        <CardTitle className="font-display font-semibold text-lg text-foreground">
                            Service Performance Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Avg. Order Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyticsData?.servicePerformance.map((service) => (
                                    <TableRow key={service.name}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell className="text-right">{service.orders}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(service.revenue)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(service.revenue / service.orders)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="bento-card">
                    <CardHeader>
                        <CardTitle className="font-display font-semibold text-lg text-foreground">
                            Category Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Services</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Market Share</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyticsData?.categoryPerformance.map((category) => {
                                    const totalRevenue = analyticsData.categoryPerformance.reduce((sum, cat) => sum + cat.revenue, 0);
                                    const marketShare = ((category.revenue / totalRevenue) * 100).toFixed(1);
                                    return (
                                        <TableRow key={category.name}>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell className="text-right">{category.services}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(category.revenue)}</TableCell>
                                            <TableCell className="text-right">{marketShare}%</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* Customer Analytics */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Customer Value Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.customerSegments.slice(0, 8) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `₹${value}`} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value) => [formatCurrency(value as number), "Total Spent"]}
                      />
                      <Bar dataKey="totalSpent" fill="hsl(var(--chart-3))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Customer Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-2xl font-display font-bold text-foreground mb-2">
                      {customers?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Customer Value</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(analyticsData?.customerSegments.reduce((sum, c) => sum + c.totalSpent, 0) / (analyticsData?.customerSegments.length || 1) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Repeat Purchase Rate</span>
                      <span className="font-medium text-foreground">76.3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Customer Acquisition Cost</span>
                      <span className="font-medium text-foreground">₹47.20</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Customer Value Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total Orders</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Avg. Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData?.customerSegments.slice(0, 8).map((customer) => (
                      <TableRow key={customer.name}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-right">{customer.totalOrders}</TableCell>
                        <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(customer.avgOrderValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Customer Insights Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">{customers?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Customers</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(analyticsData?.customerSegments.reduce((sum, c) => sum + c.totalSpent, 0) / (analyticsData?.customerSegments.length || 1) || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg. Customer Value</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Repeat Purchase Rate</span>
                      <span className="font-medium text-foreground">76.3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Customer Acquisition Cost</span>
                      <span className="font-medium text-foreground">₹47.20</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Customer Lifetime Value</span>
                      <span className="font-medium text-foreground">₹2,450</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Analytics */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Operational Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-2xl font-display font-bold text-foreground mb-2">
                      {formatPercentage(metrics?.onTimeDelivery || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Overall Efficiency Score</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Order Processing Time</span>
                      <span className="font-medium text-foreground">2.4 hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Inventory Accuracy</span>
                      <span className="font-medium text-foreground">98.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Stock Turnover Rate</span>
                      <span className="font-medium text-foreground">
                        {metrics?.inventoryTurnover || 0}x/month
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Return Rate</span>
                      <span className="font-medium text-foreground">2.1%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={SAMPLE_SALES_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="hsl(var(--chart-4))" 
                        strokeWidth={2}
                        name="Orders"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operations Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Inventory Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dummyInventory.slice(0, 6).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.stock}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                            item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === 'Out of Stock' && (
                            <Button size="sm" variant="outline">Reorder</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-lg font-bold text-foreground">24</p>
                      <p className="text-xs text-muted-foreground">Avg. Days to Fulfill</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Package className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                      <p className="text-lg font-bold text-foreground">5</p>
                      <p className="text-xs text-muted-foreground">Low Stock Items</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Order Processing Time</span>
                      <span className="font-medium text-foreground">2.4 hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Inventory Accuracy</span>
                      <span className="font-medium text-foreground">98.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Quality Score</span>
                      <span className="font-medium text-foreground">95.2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
