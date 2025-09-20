import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Briefcase
} from "lucide-react";
import { formatCurrency } from "@/lib/data";

export default function EmployeeDashboardSimple() {
  // Mock employee data - in real app, this would come from API
  const employeeData = {
    name: "Sarah Johnson",
    position: "Dry Cleaning Specialist",
    department: "Operations",
    employeeId: "EMP-001",
    hireDate: "2022-03-15",
    salary: 45000,
    hourlyRate: 22.50,
    performanceRating: 4.2,
    manager: "Michael Chen",
    status: "active"
  };

  const todayStats = {
    tasksCompleted: 8,
    tasksInProgress: 2,
    tasksPending: 3,
    efficiency: 92,
    hoursWorked: 7.5,
    hoursRemaining: 0.5,
    attendanceStatus: "present"
  };

  const monthlyStats = {
    totalHours: 160,
    overtimeHours: 8,
    tasksCompleted: 156,
    performanceScore: 4.2,
    salaryEarned: 3750,
    bonus: 150
  };

  const quickActions = [
    { label: "Clock In/Out", icon: Clock, action: () => console.log("Clock action") },
    { label: "Request Time Off", icon: Calendar, action: () => console.log("Time off request") },
    { label: "View Schedule", icon: Timer, action: () => console.log("View schedule") },
    { label: "Submit Report", icon: FileText, action: () => console.log("Submit report") },
    { label: "Update Profile", icon: User, action: () => console.log("Update profile") },
    { label: "View Payslip", icon: DollarSign, action: () => console.log("View payslip") }
  ];

  const currentTasks = [
    {
      id: 1,
      title: "Process 15 dry cleaning orders",
      priority: "high",
      estimatedHours: 2.5,
      actualHours: 1.8,
      status: "in_progress",
      dueDate: "Today 5:00 PM"
    },
    {
      id: 2,
      title: "Quality check finished garments",
      priority: "medium",
      estimatedHours: 1.25,
      actualHours: 0,
      status: "pending",
      dueDate: "Today 6:00 PM"
    },
    {
      id: 3,
      title: "Inventory count - Cleaning supplies",
      priority: "low",
      estimatedHours: 1,
      actualHours: 0,
      status: "pending",
      dueDate: "Tomorrow 10:00 AM"
    }
  ];

  const recentPerformance = [
    { month: "Jan", rating: 4.1, tasks: 142 },
    { month: "Feb", rating: 4.3, tasks: 158 },
    { month: "Mar", rating: 4.2, tasks: 156 },
    { month: "Apr", rating: 4.4, tasks: 162 }
  ];

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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
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
      </div>

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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={action.action}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs text-center">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.tasksCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((todayStats.tasksCompleted / (todayStats.tasksCompleted + todayStats.tasksPending)) * 100)}% of today's tasks
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
              +5% from last week
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
                <span className="text-sm font-medium">Tasks Completed</span>
                <span className="text-sm font-bold">{monthlyStats.tasksCompleted}</span>
              </div>
              <Progress value={(monthlyStats.tasksCompleted / 180) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Hours</span>
                <span className="text-sm font-bold">{monthlyStats.totalHours}h</span>
              </div>
              <Progress value={(monthlyStats.totalHours / 176) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Rating</span>
                <span className="text-sm font-bold flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span>{monthlyStats.performanceScore}/5.0</span>
                </span>
              </div>
              <Progress value={(monthlyStats.performanceScore / 5) * 100} className="h-2" />
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
                    <span className="text-sm text-muted-foreground">{month.tasks} tasks</span>
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
            {currentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="font-medium">{task.title}</p>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Est: {task.estimatedHours}h</span>
                    <span>Actual: {task.actualHours}h</span>
                    <span>Due: {task.dueDate}</span>
                  </div>
                  {task.status === "in_progress" && (
                    <div className="mt-2">
                      <Progress value={(task.actualHours / task.estimatedHours) * 100} className="h-1" />
                    </div>
                  )}
                </div>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Salary & Compensation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Salary & Compensation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{formatCurrency(employeeData.salary)}</div>
              <p className="text-sm text-muted-foreground">Annual Salary</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{formatCurrency(employeeData.hourlyRate)}</div>
              <p className="text-sm text-muted-foreground">Hourly Rate</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{formatCurrency(monthlyStats.bonus)}</div>
              <p className="text-sm text-muted-foreground">This Month's Bonus</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
