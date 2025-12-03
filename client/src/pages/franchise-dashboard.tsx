import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Truck,
  DollarSign,
  BarChart3,
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/data";
import EmployeeManagement from "@/components/employee-management";
import AttendanceTracker from "@/components/attendance-tracker";

interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day';
  location?: string;
}

interface FranchiseMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  totalRevenue: number;
  activeDeliveries: number;
  customerSatisfaction: number;
  averageOrderValue: number;
}

import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "@/lib/data-service";

import { DashboardDueToday } from "@/components/dashboard/components/dashboard-due-today";
import { DashboardRecentOrders } from "@/components/dashboard/components/dashboard-recent-orders";

export default function FranchiseDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.getAll()
  });

  // Fetch orders for the widgets
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['franchise-orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  const dueTodayOrders = orders.filter((order: any) => {
    if (!order.pickupDate && !order.deliveryDate) return false;
    const date = new Date(order.pickupDate || order.deliveryDate);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  });

  const recentOrders = [...orders].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  // Calculate real franchise metrics
  const franchiseMetrics: FranchiseMetrics = React.useMemo(() => {
    if (!orders || !employees) return {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      totalRevenue: 0,
      activeDeliveries: 0,
      customerSatisfaction: 0,
      averageOrderValue: 0
    };

    const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || '0'), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Active deliveries: orders in 'out_for_delivery' or 'in_transit' status
    const activeDeliveries = orders.filter((o: any) =>
      o.status === 'out_for_delivery' || o.status === 'in_transit'
    ).length;

    return {
      totalEmployees: employees.length,
      presentToday: 0, // Needs attendance API
      absentToday: 0, // Needs attendance API
      lateToday: 0, // Needs attendance API
      totalRevenue,
      activeDeliveries,
      customerSatisfaction: 4.8, // Placeholder until feedback API
      averageOrderValue
    };
  }, [orders, employees]);

  // Placeholder attendance data for demonstration
  const attendanceData: EmployeeAttendance[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'half_day': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'absent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'half_day': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const attendanceMetrics = {
    present: attendanceData.filter(emp => emp.status === 'present').length,
    late: attendanceData.filter(emp => emp.status === 'late').length,
    absent: attendanceData.filter(emp => emp.status === 'absent').length,
    halfDay: attendanceData.filter(emp => emp.status === 'half_day').length
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Franchise Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your franchise operations and employee management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(new Date(selectedDate), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(date) => setSelectedDate(date ? date.toISOString().split('T')[0] : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Due Today & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardDueToday
          orders={orders}
          isLoading={isLoadingOrders}
        />
        <DashboardRecentOrders
          recentOrders={recentOrders}
          isLoading={isLoadingOrders}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{franchiseMetrics.totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{franchiseMetrics.presentToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">{franchiseMetrics.absentToday}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(franchiseMetrics.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance Summary */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Present</span>
                  </div>
                  <span className="font-bold text-green-600">{attendanceMetrics.present}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Late</span>
                  </div>
                  <span className="font-bold text-yellow-600">{attendanceMetrics.late}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">Absent</span>
                  </div>
                  <span className="font-bold text-red-600">{attendanceMetrics.absent}</span>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <span className="font-bold">
                      {Math.round((attendanceMetrics.present / franchiseMetrics.totalEmployees) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Employee Attendance - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceData.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {employee.employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{employee.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.position} • {employee.employeeId}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{employee.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {employee.checkIn && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">In:</span> {employee.checkIn}
                            </p>
                          )}
                          {employee.checkOut && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Out:</span> {employee.checkOut}
                            </p>
                          )}
                          <p className="text-sm font-medium">
                            {employee.totalHours}h worked
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusIcon(employee.status)}
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status ? employee.status.replace('_', ' ') : 'Unknown'}
                          </Badge>
                        </div>

                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <EmployeeManagement />
        </TabsContent>

        {/* Tracker Tab */}
        <TabsContent value="tracker" className="space-y-6">
          {isLoadingEmployees ? (
            <div className="flex justify-center p-8">Loading employees...</div>
          ) : (
            <AttendanceTracker employees={(employees as any[]).map(emp => ({
              id: emp.id,
              employeeId: emp.employeeId,
              name: emp.fullName || emp.username,
              position: emp.position || 'Employee',
              salaryType: emp.salaryType || 'monthly',
              baseSalary: Number(emp.baseSalary) || 0,
              hourlyRate: Number(emp.hourlyRate) || 0,
              workingHours: Number(emp.workingHours) || 8
            }))} />
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Sarah Johnson', rating: 4.9, tasks: 156, revenue: 12500 },
                    { name: 'Mike Chen', rating: 4.8, tasks: 142, revenue: 11800 },
                    { name: 'Maria Garcia', rating: 4.7, tasks: 138, revenue: 11200 }
                  ].map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {performer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {performer.tasks} tasks • {formatCurrency(performer.revenue)} revenue
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-600">{performer.rating}/5.0</p>
                        <p className="text-sm text-muted-foreground">Rating</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="font-bold text-green-600">{franchiseMetrics.customerSatisfaction}/5.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Order Value</span>
                    <span className="font-bold">{formatCurrency(franchiseMetrics.averageOrderValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Deliveries</span>
                    <span className="font-bold text-blue-600">{franchiseMetrics.activeDeliveries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Employee Retention</span>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Active Deliveries</span>
                    <span className="font-bold">{franchiseMetrics.activeDeliveries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Completed Today</span>
                    <span className="font-bold text-green-600">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">On-Time Rate</span>
                    <span className="font-bold text-green-600">96%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Delivery Time</span>
                    <span className="font-bold">28 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Daily Revenue</span>
                    <span className="font-bold">{formatCurrency(4200)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Monthly Target</span>
                    <span className="font-bold">{formatCurrency(150000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Target Progress</span>
                    <span className="font-bold text-green-600">83%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Operating Costs</span>
                    <span className="font-bold text-red-600">{formatCurrency(45000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold mb-2">Attendance Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Monthly attendance summary and trends
                </p>
                <Button variant="outline" size="sm">Generate</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-semibold mb-2">Performance Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Employee performance metrics and KPIs
                </p>
                <Button variant="outline" size="sm">Generate</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold mb-2">Financial Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Revenue, costs, and profitability analysis
                </p>
                <Button variant="outline" size="sm">Generate</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>

  );
}
