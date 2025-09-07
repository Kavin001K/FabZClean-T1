import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart as PieChartIcon
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage, SAMPLE_SALES_DATA } from "@/lib/data";
import type { Product, Order, Customer, PosTransaction } from "@shared/schema";

export default function Analytics() {
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: posTransactions, isLoading: posLoading } = useQuery<PosTransaction[]>({
    queryKey: ["/api/pos/transactions"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!orders || !products || !customers || !posTransactions) {
      return null;
    }

    // Revenue by time period
    const revenueByMonth = orders.reduce((acc, order) => {
      if (!order.createdAt) return acc;
      const month = new Date(order.createdAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + parseFloat(order.totalAmount);
      return acc;
    }, {} as Record<string, number>);

    // Product performance
    const productSales = products.map(product => {
      const productOrders = orders.filter(order => 
        order.items && Array.isArray(order.items) && 
        order.items.some((item: any) => item.productId === product.id)
      );
      const totalSold = productOrders.reduce((sum, order) => {
        const item = (order.items as any[]).find((item: any) => item.productId === product.id);
        return sum + (item?.quantity || 0);
      }, 0);
      const revenue = productOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      
      return {
        name: product.name,
        sold: totalSold,
        revenue,
        stock: product.stockQuantity,
        category: product.category
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Category performance
    const categoryPerformance = products.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = { name: category, revenue: 0, products: 0 };
      }
      acc[category].products += 1;
      
      const productOrders = orders.filter(order => 
        order.items && Array.isArray(order.items) && 
        order.items.some((item: any) => item.productId === product.id)
      );
      acc[category].revenue += productOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      
      return acc;
    }, {} as Record<string, { name: string; revenue: number; products: number }>);

    // Customer segments
    const customerSegments = customers.map(customer => ({
      name: customer.name,
      totalSpent: parseFloat(customer.totalSpent || "0"),
      totalOrders: customer.totalOrders || 0,
      avgOrderValue: (customer.totalOrders || 0) > 0 ? parseFloat(customer.totalSpent || "0") / (customer.totalOrders || 1) : 0
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    // Order status distribution
    const orderStatusDistribution = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })),
      productSales: productSales.slice(0, 10),
      categoryPerformance: Object.values(categoryPerformance),
      customerSegments: customerSegments.slice(0, 10),
      orderStatusDistribution: Object.entries(orderStatusDistribution).map(([status, count]) => ({ status, count })),
    };
  }, [orders, products, customers, posTransactions]);

  const isLoading = productsLoading || ordersLoading || customersLoading || posLoading;

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
          <h1 className="font-display font-bold text-3xl text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Business intelligence and performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-indicator status-online"></div>
          <span className="text-sm text-muted-foreground">Real-time Data</span>
        </div>
      </div>

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
          <TabsTrigger value="products" data-testid="products-tab">Products</TabsTrigger>
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
                    <AreaChart data={SAMPLE_SALES_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `$${(value / 1000)}k`} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value) => [`$${(value as number / 1000).toFixed(1)}k`, "Revenue"]}
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
        </TabsContent>

        {/* Product Analytics */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="font-display font-semibold text-lg text-foreground">
                  Top Performing Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.productSales || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `$${value}`} />
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

          {/* Product Performance Table */}
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="font-display font-semibold text-lg text-foreground">
                Product Performance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.productSales.slice(0, 5).map((product, index) => (
                  <div 
                    key={product.name}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                    data-testid={`product-performance-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-bold">#{index + 1}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{product.sold} units sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `$${value}`} />
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
                      <span className="font-medium text-foreground">$47.20</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="font-display font-semibold text-lg text-foreground">
                High-Value Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.customerSegments.slice(0, 5).map((customer, index) => (
                  <div 
                    key={customer.name}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                    data-testid={`top-customer-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-medium">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.totalOrders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-sm text-muted-foreground">
                        Avg: {formatCurrency(customer.avgOrderValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

          {/* Key Performance Indicators */}
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="font-display font-semibold text-lg text-foreground">
                Key Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border border-border rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                  <p className="text-xl font-display font-bold text-foreground mb-1">24</p>
                  <p className="text-sm text-muted-foreground">Avg. Days to Fulfill</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingDown className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">-2 days vs last month</span>
                  </div>
                </div>
                
                <div className="text-center p-6 border border-border rounded-lg">
                  <Package className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                  <p className="text-xl font-display font-bold text-foreground mb-1">
                    {products?.filter(p => p.stockQuantity <= p.reorderLevel).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Items Need Restocking</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-500">+3 vs last week</span>
                  </div>
                </div>
                
                <div className="text-center p-6 border border-border rounded-lg">
                  <Target className="w-8 h-8 mx-auto mb-3 text-red-500" />
                  <p className="text-xl font-display font-bold text-foreground mb-1">95.2%</p>
                  <p className="text-sm text-muted-foreground">Quality Score</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+1.3% this month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
