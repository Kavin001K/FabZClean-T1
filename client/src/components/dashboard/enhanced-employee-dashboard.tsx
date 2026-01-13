import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  User,
  Award,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Clock4,
  Star,
  Timer,
  Users,
  Briefcase,
  Package,
  Truck,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  MapPin,
  Navigation,
  Zap,
  Activity,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  StopCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';

// Import our new algorithm components
import { SearchInput, SearchFilters, SearchResultsList } from '../search/SearchComponents';
import { Pagination, PaginationInfo, CompactPagination } from '../pagination/PaginationComponents';
import { CacheStats, CacheManager } from '../cache/CacheComponents';
import { useFuzzySearch, useHybridSearch } from '../../hooks/use-fuzzy-search';
import { useClientPagination, useServerPagination } from '../../hooks/use-pagination';
import { useClientCache, useCachedQuery } from '../../hooks/use-cache';

import { useAuth } from '@/contexts/auth-context';

import { DashboardDueToday } from "./components/dashboard-due-today";
import { DashboardRecentOrders } from "./components/dashboard-recent-orders";
import { DashboardReadyOrders } from "./components/dashboard-ready-orders";

interface DashboardOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  status: string;
  service?: string | string[];
  createdAt: string;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  totalItems?: number;
  totalAmount?: string | number;
}

interface DashboardTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  estimatedHours: number;
  actualHours?: number;
  dueDate?: string | null;
}

// Enhanced Employee Dashboard Component
export default function EnhancedEmployeeDashboard() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const { employee } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Employee data
  const employeeData = {
    name: employee?.fullName || employee?.username || "Employee",
    position: employee?.position || "Staff Member",
    department: employee?.department || "General",
    employeeId: employee?.employeeId || "EMP-000",
    hireDate: employee?.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    salary: employee?.baseSalary || 0,
    hourlyRate: employee?.hourlyRate || 0,
    performanceRating: 0.0, // This would come from performance API
    manager: "Manager", // This would come from manager relation
    status: employee?.isActive ? "active" : "inactive"
  };

  // Fetch orders with caching
  const { data: orders = [], isLoading: ordersLoading } = useCachedQuery(
    ['employee-orders'],
    async () => {
      const token = localStorage.getItem('employee_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/orders', { headers });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      // Handle paginated response or direct array
      return Array.isArray(data) ? data : (data.data || []);
    },
    {
      cacheName: 'orders',
      ttl: 5 * 60 * 1000, // 5 minutes
      staleTime: 30000
    }
  );

  const dueTodayOrders = orders.filter((order: DashboardOrder) => {
    if (!order.pickupDate && !order.deliveryDate) return false;
    const dateStr = order.pickupDate || order.deliveryDate;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  });

  const recentOrders = [...orders].sort((a: DashboardOrder, b: DashboardOrder) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  // Calculate real stats from orders
  const todayStats = useMemo(() => {
    if (!orders) return {
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksPending: 0,
      ordersProcessed: 0,
      efficiency: 0,
      hoursWorked: 0,
      hoursRemaining: 8, // Standard shift
      attendanceStatus: 'Present' // Assumed since they are logged in
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = orders.filter((order: DashboardOrder) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    });

    const completed = todaysOrders.filter((o: DashboardOrder) => o.status === 'completed' || o.status === 'delivered').length;
    const inProgress = todaysOrders.filter((o: DashboardOrder) => o.status === 'processing' || o.status === 'in_transit').length;
    const pending = todaysOrders.filter((o: DashboardOrder) => o.status === 'pending' || o.status === 'confirmed').length;

    // Simple efficiency calculation: (completed / total assigned today) * 100
    const totalToday = todaysOrders.length;
    const efficiency = totalToday > 0 ? Math.round((completed / totalToday) * 100) : 0;

    return {
      tasksCompleted: completed,
      tasksInProgress: inProgress,
      tasksPending: pending,
      ordersProcessed: completed,
      efficiency,
      hoursWorked: 0, // Placeholder until we have attendance API
      hoursRemaining: 8,
      attendanceStatus: 'Present'
    };
  }, [orders]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    if (!orders) return {
      salaryEarned: 0,
      bonus: 0,
      ordersProcessed: 0,
      totalHours: 0,
      performanceScore: 0
    };

    // This would ideally come from a payroll API
    // For now, we can estimate based on completed orders if we had commission data
    return {
      salaryEarned: 0, // Placeholder
      bonus: 0,
      ordersProcessed: 0,
      totalHours: 0,
      performanceScore: 0
    };
  }, [orders]);

  // Fetch transit orders
  const { data: transitOrders = [], isLoading: transitLoading } = useCachedQuery(
    ['employee-transit-orders'],
    async () => {
      const token = localStorage.getItem('employee_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/transit', { headers });
      if (!response.ok) throw new Error('Failed to fetch transit orders');
      return response.json();
    },
    {
      cacheName: 'transit-orders',
      ttl: 2 * 60 * 1000, // 2 minutes
      staleTime: 15000
    }
  );

  // Search functionality
  const searchFields = ['orderNumber', 'customerName', 'customerEmail', 'status', 'service'];
  const { results: searchResults, isLoading: searchLoading } = useHybridSearch(
    orders,
    searchFields,
    '/api/v1/search/orders',
    searchQuery,
    {
      preferServer: true,
      minQueryLength: 2,
      threshold: 0.7,
      maxResults: 50
    }
  );

  // Pagination for orders
  const {
    data: paginatedOrders,
    pagination,
    goToPage,
    goToNextPage,
    goToPreviousPage
  } = useClientPagination(searchResults.length > 0 ? searchResults : orders, {
    pageSize: 10,
    maxVisiblePages: 5
  });

  // Cache management
  const { get: getCache, set: setCache, metrics: cacheMetrics } = useClientCache('employee-dashboard');

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useCachedQuery(
    ['employee-tasks'],
    async () => {
      const token = localStorage.getItem('employee_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/tasks', { headers });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    {
      cacheName: 'employee-tasks',
      ttl: 2 * 60 * 1000 // 2 minutes
    }
  );

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const token = localStorage.getItem('employee_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'completed' })
      });

      if (!response.ok) throw new Error('Failed to complete task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-tasks'] });
      addNotification({
        type: 'success',
        title: 'Task Completed!',
        message: 'Great work! Task has been marked as completed.',
      });
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete task.",
      });
    }
  });

  // Handle task completion
  const handleTaskComplete = (taskId: string) => {
    completeTaskMutation.mutate(taskId);
  };

  // Performance data - Mock data for now
  const recentPerformance = [
    { month: "Jan", rating: 4.1, tasks: 142, orders: 89 },
    { month: "Feb", rating: 4.3, tasks: 158, orders: 95 },
    { month: "Mar", rating: 4.2, tasks: 156, orders: 92 },
    { month: "Apr", rating: 4.4, tasks: 162, orders: 98 }
  ];

  // Utility functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "in_transit": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "ready_for_delivery": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Handle order selection
  const handleOrderSelect = (order: DashboardOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };


  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {employeeData.name}! Here's your daily overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{todayStats.attendanceStatus}</span>
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </motion.div>

      {/* Employee Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{employeeData.name}</h2>
                <p className="text-muted-foreground">{employeeData.position} • {employeeData.department}</p>
                <p className="text-sm text-muted-foreground">ID: {employeeData.employeeId} • Manager: {employeeData.manager}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-semibold">{employeeData.performanceRating}/5.0</span>
              </div>
              <p className="text-sm text-muted-foreground">Performance Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="transit">Transit</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Due Today & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardDueToday
              orders={orders}
              isLoading={ordersLoading}
            />
            <DashboardRecentOrders
              recentOrders={recentOrders}
              isLoading={ordersLoading}
            />
          </div>

          {/* Ready for Pickup/Delivery */}
          <DashboardReadyOrders />

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.ordersProcessed}</div>
                <p className="text-xs text-muted-foreground">
                  {todayStats.tasksPending > 0 ? Math.round((todayStats.ordersProcessed / (todayStats.ordersProcessed + todayStats.tasksPending)) * 100) : 100}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
                <Clock4 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.hoursWorked}h</div>
                <p className="text-xs text-muted-foreground">
                  {todayStats.hoursRemaining}h remaining today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyStats.salaryEarned)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatCurrency(monthlyStats.bonus)} bonus this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.efficiency}%</div>
                <p className="text-xs text-muted-foreground">
                  Based on today's tasks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance & Insights */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Monthly Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Orders Processed</span>
                    <span className="text-sm font-bold">{monthlyStats.ordersProcessed || 0}</span>
                  </div>
                  <Progress value={((monthlyStats.ordersProcessed || 0) / 120) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Hours</span>
                    <span className="text-sm font-bold">{monthlyStats.totalHours || 0}h</span>
                  </div>
                  <Progress value={((monthlyStats.totalHours || 0) / 176) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Performance Rating</span>
                    <span className="text-sm font-bold flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span>{monthlyStats.performanceScore || 0}/5.0</span>
                    </span>
                  </div>
                  <Progress value={((monthlyStats.performanceScore || 0) / 5) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Performance Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPerformance.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-sm">{month.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{month.orders} orders</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PlayCircle className="w-5 h-5" />
                <span>Current Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.slice(0, 3).map((task: DashboardTask) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="font-medium">{task.title}</p>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Est: {task.estimatedHours || 0}h</span>
                        <span>Actual: {task.actualHours || 0}h</span>
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {(task.status === "in_progress" || task.status === "pending") && task.estimatedHours > 0 && (
                        <div className="mt-2">
                          <Progress value={((task.actualHours || 0) / task.estimatedHours) * 100} className="h-1" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status ? task.status.replace('_', ' ') : 'Unknown'}
                      </Badge>
                      {(task.status === "in_progress" || task.status === "pending") && (
                        <Button size="sm" onClick={() => handleTaskComplete(task.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Order Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <SearchInput
                    data={orders}
                    searchFields={searchFields}
                    onResultSelect={handleOrderSelect}
                    placeholder="Search orders by ID, customer name, or status..."
                    showSuggestions={true}
                    showRecentSearches={true}
                    maxResults={20}
                    threshold={0.7}
                  />
                </div>
                <SearchFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>

              {/* Cache Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>Cache Hit Rate: {Math.round(cacheMetrics.hitRate * 100)}%</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <RefreshCw className="w-3 h-3" />
                    <span>{orders.length} orders loaded</span>
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['employee-orders'] })}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Orders</span>
                <PaginationInfo pagination={pagination} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order: any) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>
                          {Array.isArray(order.service) ? order.service.join(', ') : order.service}
                        </TableCell>
                        <TableCell>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOrderSelect(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Handle edit order
                                toast({
                                  title: "Edit Order",
                                  description: `Editing order ${order.orderNumber}`,
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4">
                <Pagination
                  pagination={pagination}
                  onPageChange={goToPage}
                  showPageSizeSelector={true}
                  showPageInfo={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transit Tab */}
        <TabsContent value="transit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>Transit Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">In Transit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {transitOrders.filter((t: any) => t.status === 'in_transit').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {transitOrders.filter((t: any) => t.status === 'completed').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {transitOrders.reduce((sum: number, t: any) => sum + (t.totalItems || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Button className="w-full" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Transit Batch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transit Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transit Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transitOrders.slice(0, 5).map((transit: any) => (
                  <div key={transit.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{transit.transitId}</h4>
                        <Badge
                          variant={transit.status === 'completed' ? 'default' : 'secondary'}
                          className={transit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {transit.status === 'completed' ? 'Completed' : 'In Transit'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transit.type === 'store_to_factory' ? 'Store → Factory' : 'Factory → Store'} •
                        {transit.totalItems || 0} items •
                        {new Date(transit.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Task Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task: DashboardTask) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="font-medium">{task.title}</p>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Est: {task.estimatedHours || 0}h</span>
                        <span>Actual: {task.actualHours || 0}h</span>
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {(task.status === "in_progress" || task.status === "pending") && task.estimatedHours > 0 && (
                        <div className="mt-2">
                          <Progress value={((task.actualHours || 0) / task.estimatedHours) * 100} className="h-1" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status ? task.status.replace('_', ' ') : 'Unknown'}
                      </Badge>
                      {(task.status === "in_progress" || task.status === "pending") && (
                        <Button size="sm" onClick={() => handleTaskComplete(task.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {task.status === "pending" && (
                        <Button size="sm" variant="outline">
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <CacheStats cacheName="employee-dashboard" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Performance Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Orders Processed Today</span>
                    <span className="text-sm font-bold">{todayStats.ordersProcessed}</span>
                  </div>
                  <Progress value={(todayStats.ordersProcessed / 20) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Efficiency Rate</span>
                    <span className="text-sm font-bold">{todayStats.efficiency}%</span>
                  </div>
                  <Progress value={todayStats.efficiency} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Task Completion</span>
                    <span className="text-sm font-bold">
                      {Math.round((todayStats.tasksCompleted / (todayStats.tasksCompleted + todayStats.tasksPending)) * 100)}%
                    </span>
                  </div>
                  <Progress value={(todayStats.tasksCompleted / (todayStats.tasksCompleted + todayStats.tasksPending)) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View comprehensive details about the selected order.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={getOrderStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                  <p className="font-medium">{formatCurrency(Number(selectedOrder.totalAmount || 0))}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Services</label>
                <p className="font-medium">
                  {Array.isArray(selectedOrder.service) ? selectedOrder.service.join(', ') : selectedOrder.service}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
