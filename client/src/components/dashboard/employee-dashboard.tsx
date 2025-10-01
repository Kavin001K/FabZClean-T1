import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  Users, 
  Package,
  Target,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

// Mock data for employee dashboard
const todayTasks = [
  { id: 1, title: "Process 15 dry cleaning orders", status: "in-progress", priority: "high", timeEstimate: "2h 30m" },
  { id: 2, title: "Quality check finished garments", status: "pending", priority: "medium", timeEstimate: "1h 15m" },
  { id: 3, title: "Update inventory for new arrivals", status: "completed", priority: "low", timeEstimate: "45m" },
  { id: 4, title: "Customer pickup coordination", status: "pending", priority: "high", timeEstimate: "1h" },
  { id: 5, title: "Equipment maintenance check", status: "pending", priority: "medium", timeEstimate: "30m" },
];

const recentOrders = [
  { id: "ORD-001", customer: "John Smith", service: "Dry Cleaning", status: "Processing", timeLeft: "2h 15m" },
  { id: "ORD-002", customer: "Sarah Johnson", service: "Laundry", status: "Ready", timeLeft: "Ready" },
  { id: "ORD-003", customer: "Mike Davis", service: "Ironing", status: "Processing", timeLeft: "45m" },
  { id: "ORD-004", customer: "Lisa Wilson", service: "Dry Cleaning", status: "Quality Check", timeLeft: "1h 30m" },
];

const teamMembers = [
  { name: "David Miller", role: "Senior Staff", status: "online", tasksCompleted: 12 },
  { name: "Emily Garcia", role: "Staff", status: "online", tasksCompleted: 8 },
  { name: "Frank Rodriguez", role: "Staff", status: "offline", tasksCompleted: 6 },
  { name: "Grace Lee", role: "Trainee", status: "online", tasksCompleted: 4 },
];

const performanceData = [
  { week: "Week 1", tasks: 18, efficiency: 92 },
  { week: "Week 2", tasks: 22, efficiency: 88 },
  { week: "Week 3", tasks: 20, efficiency: 95 },
  { week: "Week 4", tasks: 25, efficiency: 90 },
];

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const safeTasks = todayTasks || [];
  const completedTasks = safeTasks.filter(task => task.status === "completed").length;
  const inProgressTasks = safeTasks.filter(task => task.status === "in-progress").length;
  const pendingTasks = safeTasks.filter(task => task.status === "pending").length;
  const totalTasks = safeTasks.length;

  const getPriorityColor = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your daily overview.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono">{currentTime.toLocaleTimeString()}</div>
          <div className="text-sm text-muted-foreground">{currentTime.toLocaleDateString()}</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((completedTasks / totalTasks) * 100)}% of today's tasks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Waiting to be started
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Tasks */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === "completed" ? "bg-green-500" :
                      task.status === "in-progress" ? "bg-blue-500" : "bg-gray-300"
                    }`} />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {task.timeEstimate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status ? task.status.replace(/-/g, " ") : 'Unknown'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/avatars/0${index + 1}.png`} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-2 h-2 rounded-full ${
                      member.status === "online" ? "bg-green-500" : "bg-gray-400"
                    }`} />
                    <p className="text-xs text-muted-foreground">
                      {member.tasksCompleted} tasks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.service}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.timeLeft}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Weekly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.map((week, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{week.week}</span>
                    <span className="font-medium">{week.efficiency}%</span>
                  </div>
                  <Progress value={week.efficiency} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {week.tasks} tasks completed
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/orders">
                <Package className="mr-2 h-4 w-4" />
                View All Orders
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/create-order">
                <User className="mr-2 h-4 w-4" />
                Create New Order
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/inventory">
                <Package className="mr-2 h-4 w-4" />
                Check Inventory
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tracking">
                <Clock className="mr-2 h-4 w-4" />
                Track Orders
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
