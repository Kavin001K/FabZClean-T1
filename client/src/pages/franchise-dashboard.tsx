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
  Eye,
  Briefcase
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/data";
import EmployeeManagement from "@/components/employee-management";
import TransitOrdersPage from "@/pages/transit-orders";

interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | null;
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi, ordersApi } from "@/lib/data-service";

import { DashboardDueToday } from "@/components/dashboard/components/dashboard-due-today";
import { DashboardRecentOrders } from "@/components/dashboard/components/dashboard-recent-orders";
import { DashboardReadyOrders } from "@/components/dashboard/components/dashboard-ready-orders";
import { DashboardQuickActions } from "@/components/dashboard/components/dashboard-quick-actions";

import { useAuth } from "@/contexts/auth-context";
import { franchisesApi } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";

export default function FranchiseDashboard() {
  const { employee } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: ''
  });

  // Attendance dialog state
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAttendance | null>(null);

  const handleSaveTask = async () => {
    try {
      if (!taskForm.title || !taskForm.assignedTo) {
        alert("Please fill in required fields");
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert("You must be logged in to assign tasks");
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          employeeId: taskForm.assignedTo,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
          estimatedHours: (taskForm.estimatedHours || '0').toString(),
          status: 'pending'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsTaskDialogOpen(false);
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: '',
        estimatedHours: ''
      });
      // Optional: Show success toast
    } catch (error: any) {
      console.error("Error creating task:", error);
      alert(error.message || "Failed to create task");
    }
  };

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['franchise-employees', employee?.franchiseId],
    queryFn: () => employee?.franchiseId ? franchisesApi.getEmployees(employee.franchiseId) : [],
    enabled: !!employee?.franchiseId
  });

  // Fetch orders for the widgets
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['franchise-orders'],
    queryFn: () => ordersApi.getAll()
  });

  // Fetch attendance records
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['franchise-attendance', employee?.franchiseId, selectedDate],
    queryFn: () => employee?.franchiseId ? franchisesApi.getAttendance(employee.franchiseId, selectedDate) : [],
    enabled: !!employee?.franchiseId
  });

  const handleMarkAttendance = async (employeeId: string, status: 'present' | 'absent' | 'late') => {
    if (!employee?.franchiseId) {
      console.error('No franchise ID available');
      return;
    }

    try {
      console.log('handleMarkAttendance called:', {
        employeeId,
        status,
        franchiseId: employee.franchiseId,
        selectedDate
      });

      const now = new Date();
      // Set time only if present/late. Absent doesn't need clock in
      const clockIn = (status === 'present' || status === 'late') ? now.toISOString() : null;

      const payload = {
        employeeId,
        date: new Date(selectedDate),
        status,
        clockIn,
        locationCheckIn: { type: 'manual', by: employee.id }
      };

      console.log('Sending attendance payload:', payload);

      const result = await franchisesApi.markAttendance(employee.franchiseId, payload);

      console.log('Attendance marked successfully:', result);

      toast({
        title: "Attendance Saved",
        description: `Marked as ${status} for ${format(new Date(selectedDate), "PPP")}`,
      });

      await queryClient.invalidateQueries({ queryKey: ['franchise-attendance'] });
      await queryClient.refetchQueries({ queryKey: ['franchise-attendance'] });
    } catch (error) {
      console.error("Failed to mark attendance:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update attendance",
        variant: "destructive"
      });
    }
  };

  const handleViewAttendance = (emp: EmployeeAttendance) => {
    setSelectedEmployee(emp);
    setIsAttendanceDialogOpen(true);
  };

  const handleUpdateAttendance = async (newStatus: 'present' | 'absent' | 'late') => {
    if (!selectedEmployee || !employee?.franchiseId) return;

    try {
      const now = new Date();
      const clockIn = (newStatus === 'present' || newStatus === 'late') ? now.toISOString() : null;

      console.log('Marking attendance:', {
        franchiseId: employee.franchiseId,
        employeeId: selectedEmployee.id,
        date: selectedDate,
        status: newStatus
      });

      // Mark attendance and wait for completion
      const result = await franchisesApi.markAttendance(employee.franchiseId, {
        employeeId: selectedEmployee.id,
        date: new Date(selectedDate),
        status: newStatus,
        clockIn,
        locationCheckIn: { type: 'manual', by: employee.id }
      });

      console.log('Attendance marked result:', result);

      // Wait for queries to invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['franchise-attendance'] });
      await queryClient.refetchQueries({ queryKey: ['franchise-attendance'] });

      toast({
        title: "Attendance Saved",
        description: `Marked as ${newStatus} for ${format(new Date(selectedDate), "PPP")}`,
      });

      // Close dialog immediately after successful save
      setIsAttendanceDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to update attendance:", error);
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive"
      });
    }
  };


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

    // Calculate attendance metrics from fetched records
    const presentToday = attendanceRecords.filter((r: any) => r.status === 'present').length;
    const absentToday = attendanceRecords.filter((r: any) => r.status === 'absent').length;
    const lateToday = attendanceRecords.filter((r: any) => r.status === 'late').length;

    return {
      totalEmployees: employees.length,
      presentToday,
      absentToday,
      lateToday,
      totalRevenue,
      activeDeliveries,
      customerSatisfaction: 4.8, // Placeholder until feedback API
      averageOrderValue
    };
  }, [orders, employees, attendanceRecords]);

  // Combine employees with attendance data
  const attendanceData: EmployeeAttendance[] = employees.map((emp: any) => {
    const record = attendanceRecords.find((r: any) => r.employeeId === emp.id);
    return {
      id: emp.id,
      employeeId: emp.employeeId,
      employeeName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
      position: emp.position,
      date: selectedDate,
      checkIn: record?.clockIn ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      checkOut: record?.clockOut ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      totalHours: record?.totalHours ? parseFloat(record.totalHours) : 0,
      status: record?.status || null, // null means not marked yet
      location: record?.locationCheckIn?.name || 'Store'
    };
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'half_day': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string | null) => {
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
          <Button onClick={() => setIsTaskDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Briefcase className="w-4 h-4 mr-2" />
            Assign Task
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(new Date(selectedDate + "T00:00:00"), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-4" align="start">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                onSelect={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : '')}
                disabled={(date) => date > new Date()}
                initialFocus
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
          <Button>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Actions - Settings Controlled */}
      <DashboardQuickActions />

      {/* Due Today & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardDueToday />
        <DashboardRecentOrders
          recentOrders={recentOrders}
          isLoading={isLoadingOrders}
        />
        <DashboardReadyOrders franchiseId={employee?.franchiseId} />
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
          <TabsTrigger value="transit">Transit</TabsTrigger>
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
                <div className="flex items-center justify-between">
                  <CardTitle>Employee Attendance</CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(new Date(selectedDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                        onSelect={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : '')}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceData.length === 0 && !isLoadingEmployees && (
                    <div className="text-center py-8 text-muted-foreground">
                      No employees found for this franchise.
                    </div>
                  )}
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
                          {employee.totalHours > 0 && (
                            <p className="text-sm font-medium">
                              {employee.totalHours}h worked
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {employee.status ? (
                            <>
                              {getStatusIcon(employee.status)}
                              <Badge className={getStatusColor(employee.status)}>
                                {employee.status.replace('_', ' ')}
                              </Badge>
                              {/* Allow changing status if needed - simplified for now just showing status */}
                            </>
                          ) : (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 px-2 border-green-200 hover:bg-green-50 text-green-700" onClick={() => handleMarkAttendance(employee.id, 'present')}>
                                P
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-yellow-200 hover:bg-yellow-50 text-yellow-700" onClick={() => handleMarkAttendance(employee.id, 'late')}>
                                L
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-red-200 hover:bg-red-50 text-red-700" onClick={() => handleMarkAttendance(employee.id, 'absent')}>
                                A
                              </Button>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAttendance(employee)}
                          title="View/Edit Attendance"
                        >
                          <Eye className="w-4 w-4" />
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
        <TabsContent value="transit" className="space-y-6">
          <div className="bg-background rounded-lg border shadow-sm">
            <TransitOrdersPage />
          </div>
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

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to an employee.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g. Clean main lobby"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Details about the task..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employee">Assign To</Label>
              <Select
                value={taskForm.assignedTo}
                onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName || emp.username || emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hours">Est. Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask}>Assign Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Detail Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              View and edit attendance for {selectedEmployee?.employeeName}
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4 py-4">
              {/* Employee Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-foreground">
                    {selectedEmployee.employeeName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{selectedEmployee.employeeName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.position} • {selectedEmployee.employeeId}
                  </p>
                </div>
              </div>

              {/* Attendance Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm font-semibold">{format(new Date(selectedDate), "PPP")}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Status:</span>
                  <Badge className={getStatusColor(selectedEmployee.status)}>
                    {selectedEmployee.status || 'Not Marked'}
                  </Badge>
                </div>

                {selectedEmployee.checkIn && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Clock In:</span>
                    <span className="text-sm">{selectedEmployee.checkIn}</span>
                  </div>
                )}

                {selectedEmployee.checkOut && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Clock Out:</span>
                    <span className="text-sm">{selectedEmployee.checkOut}</span>
                  </div>
                )}

                {selectedEmployee.totalHours > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Hours:</span>
                    <span className="text-sm font-bold">{selectedEmployee.totalHours}h</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{selectedEmployee.location}</span>
                </div>
              </div>

              {/* Update Status */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-3 block">Update Status:</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedEmployee.status === 'present' ? 'default' : 'outline'}
                    className="flex-1 border-green-200 hover:bg-green-50 text-green-700"
                    onClick={() => handleUpdateAttendance('present')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Present
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEmployee.status === 'late' ? 'default' : 'outline'}
                    className="flex-1 border-yellow-200 hover:bg-yellow-50 text-yellow-700"
                    onClick={() => handleUpdateAttendance('late')}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Late
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEmployee.status === 'absent' ? 'default' : 'outline'}
                    className="flex-1 border-red-200 hover:bg-red-50 text-red-700"
                    onClick={() => handleUpdateAttendance('absent')}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Absent
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}
