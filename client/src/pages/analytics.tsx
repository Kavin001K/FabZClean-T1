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
import { useWebSocket } from "@/hooks/use-websocket";
import type { Service, Order, Customer } from "@shared/schema";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

  // Real-time state
  const [realtimeKpis, setRealtimeKpis] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { toast } = useToast();

  // WebSocket connection for real-time updates
  const { isConnected, connectionStatus, subscribe } = useWebSocket({
    url: 'ws://localhost:3001',
    onMessage: (message) => {
      if (message.type === 'analytics_update') {
        setRealtimeKpis(message.data.kpis);
        setRecentActivity(message.data.recentActivity);
        setLastUpdate(new Date());
      } else if (message.type === 'order_created' || message.type === 'order_updated') {
        // Refresh orders when new orders are created/updated
        fetchAnalyticsData();
      } else if (message.type === 'customer_created') {
        // Refresh customers when new customers are added
        fetchAnalyticsData();
      }
    },
    onOpen: () => {
      console.log('Connected to real-time analytics');
      subscribe(['analytics_update', 'order_created', 'order_updated', 'customer_created']);
    },
    onClose: () => {
      console.log('Disconnected from real-time analytics');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

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

    // Apply filters to orders
    let filteredOrders = [...orders];
    let filteredCustomers = [...customers];

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'last-7-days':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last-30-days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last-90-days':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'last-year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.createdAt || new Date()) >= startDate
      );
      
      filteredCustomers = filteredCustomers.filter(customer => 
        new Date(customer.createdAt || new Date()) >= startDate
      );
    }

    // Service type filter
    if (serviceType !== 'all') {
      filteredOrders = filteredOrders.filter(order => {
        const orderService = (order as any).service || 'Unknown Service';
        return orderService.toLowerCase().includes(serviceType.toLowerCase());
      });
    }

    // Franchise filter (assuming orders have a franchise field or we can derive it)
    if (franchise !== 'all') {
      // For now, we'll filter by customer location or some other field
      // This would need to be implemented based on your actual data structure
      filteredCustomers = filteredCustomers.filter(customer => {
        // Assuming customers have a franchise field or location
        return (customer as any).franchise === franchise || 
               (customer as any).location?.includes(franchise);
      });
      
      // Filter orders by customers in the selected franchise
      const franchiseCustomerIds = filteredCustomers.map(c => c.id);
      filteredOrders = filteredOrders.filter(order => 
        franchiseCustomerIds.includes(order.customerId)
      );
    }

    // 1. REVENUE ANALYSIS
    const revenueByMonth = filteredOrders.reduce((acc, order) => {
      const month = new Date(order.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
    const servicePerformance = filteredOrders.reduce((acc, order) => {
      const serviceName = (order as any).service || 'Unknown Service';
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
    const customerSegments = filteredCustomers.reduce((acc, customer) => {
      const totalSpent = parseFloat(customer.totalSpent || '0');
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
    const orderStatusDistribution = filteredOrders.reduce((acc, order) => {
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
    const revenueTrend = filteredOrders.reduce((acc, order) => {
      const date = new Date(order.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    const customerGrowth = filteredCustomers.reduce((acc, customer) => {
      const month = new Date(customer.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.newCustomers += 1;
        existing.totalSpent += parseFloat(customer.totalSpent || '0');
      } else {
        acc.push({ month, newCustomers: 1, totalSpent: parseFloat(customer.totalSpent || '0') });
      }
      return acc;
    }, [] as any[]).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // 7. TOP CUSTOMERS
    const topCustomers = filteredCustomers
      .sort((a, b) => parseFloat(b.totalSpent || '0') - parseFloat(a.totalSpent || '0'))
      .slice(0, 10)
      .map(customer => ({
        name: customer.name,
        totalSpent: parseFloat(customer.totalSpent || '0'),
        orders: customer.totalOrders,
        avgOrderValue: parseFloat(customer.totalSpent || '0') / (customer.totalOrders || 1)
      }));

    // 8. SERVICE EFFICIENCY
    const serviceEfficiency = servicePerformance.map(service => ({
      ...service,
      efficiency: service.orders > 0 ? (service.revenue / service.orders) : 0,
      marketShare: (service.orders / filteredOrders.length) * 100
    }));

    // 9. INVENTORY ANALYSIS
    const inventoryAnalysis = inventory.map(item => ({
      name: item.name,
      stock: item.stock,
      status: item.status,
      value: item.stock * 25 // Approximate value per unit
    }));

    // 10. TIME ANALYSIS (Hourly distribution)
    const timeAnalysis = filteredOrders.reduce((acc, order) => {
      const hour = new Date(order.createdAt || new Date()).getHours();
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
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    const completionRate = filteredOrders.length > 0 ? (filteredOrders.filter(o => o.status === 'completed').length / filteredOrders.length) * 100 : 0;
    const customerRetention = filteredCustomers.length > 0 ? filteredCustomers.filter(c => (c.totalOrders || 0) > 1).length / filteredCustomers.length * 100 : 0;

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
  }, [orders, customers, inventory, isLoading, dateRange, franchise, serviceType]);

  // Generate AI-powered insights
  const generateInsights = () => {
    const insights = [];
    const { operationalMetrics, servicePerformance, customerSegments } = analyticsData;

    if ((operationalMetrics as any).avgOrderValue > 200) {
      insights.push("High average order value indicates premium service positioning");
    }
    
    if ((operationalMetrics as any).completionRate > 90) {
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

  // Export analytics as PDF
  const handleExportPDF = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your analytics report...",
      });

      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analytics Dashboard Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Add date and filters info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Date Range: ${dateRange}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Franchise: ${franchise}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Service Type: ${serviceType}`, 20, yPosition);
      yPosition += 15;

      // Add key metrics
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Metrics', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const { operationalMetrics } = analyticsData;
      pdf.text(`Total Revenue: ${formatCurrency((operationalMetrics as any).totalRevenue)}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Average Order Value: ${formatCurrency((operationalMetrics as any).avgOrderValue)}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Completion Rate: ${formatPercentage((operationalMetrics as any).completionRate)}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Customer Retention: ${formatPercentage((operationalMetrics as any).customerRetention)}`, 20, yPosition);
      yPosition += 15;

      // Add service performance
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top Services', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const topServices = analyticsData.servicePerformance.slice(0, 5);
      topServices.forEach((service, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. ${service.name}: ${service.orders} orders, ${formatCurrency(service.revenue)} revenue`, 20, yPosition);
        yPosition += 8;
      });

      // Add customer segments
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Customer Segments', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      analyticsData.customerSegments.forEach((segment) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${segment.segment}: ${segment.count} customers, ${formatCurrency(segment.revenue)} revenue`, 20, yPosition);
        yPosition += 8;
      });

      // Save the PDF
      const fileName = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Generated",
        description: "Your analytics report has been downloaded successfully!",
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Live Updates' : 'Offline'}
            </span>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateInsights}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Insights
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="franchise">Franchise</Label>
              <Select value={franchise} onValueChange={setFranchise}>
                <SelectTrigger>
                  <SelectValue placeholder="Select franchise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Franchises</SelectItem>
                  <SelectItem value="franchise-1">Franchise 1</SelectItem>
                  <SelectItem value="franchise-2">Franchise 2</SelectItem>
                  <SelectItem value="franchise-3">Franchise 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={realtimeKpis ? 'ring-2 ring-green-500 ring-opacity-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {realtimeKpis && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all duration-500">
              {formatCurrency(realtimeKpis?.totalRevenue || (analyticsData.operationalMetrics as any).totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {realtimeKpis?.totalOrders || (analyticsData.operationalMetrics as any).totalOrders} orders
            </p>
          </CardContent>
        </Card>
        <Card className={realtimeKpis ? 'ring-2 ring-green-500 ring-opacity-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              {realtimeKpis && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all duration-500">
              {formatCurrency(realtimeKpis?.avgOrderValue || (analyticsData.operationalMetrics as any).avgOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>
        <Card className={realtimeKpis ? 'ring-2 ring-green-500 ring-opacity-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              {realtimeKpis && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all duration-500">
              {formatPercentage(realtimeKpis?.completionRate || (analyticsData.operationalMetrics as any).completionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders completed
            </p>
          </CardContent>
        </Card>
        <Card className={realtimeKpis ? 'ring-2 ring-green-500 ring-opacity-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {realtimeKpis && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all duration-500">
              {formatPercentage(realtimeKpis?.customerRetention || (analyticsData.operationalMetrics as any).customerRetention)}
            </div>
            <p className="text-xs text-muted-foreground">
              Repeat customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity (Last 5 Minutes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">New Orders ({recentActivity.newOrders})</h4>
                <div className="space-y-2">
                  {recentActivity.orders.length > 0 ? (
                    recentActivity.orders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No new orders in the last 5 minutes</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">New Customers ({recentActivity.newCustomers})</h4>
                <div className="space-y-2">
                  {recentActivity.customers.length > 0 ? (
                    recentActivity.customers.map((customer: any) => (
                      <div key={customer.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No new customers in the last 5 minutes</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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