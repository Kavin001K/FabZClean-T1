import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { analyticsApi, ordersApi } from "@/lib/data-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react";
import DashboardQuickActions from "./components/dashboard-quick-actions";
import { Badge } from "@/components/ui/badge";

export default function EnhancedEmployeeDashboard() {
  const { employee } = useAuth();

  // Fetch personal stats
  const { data: stats } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => {
      // Direct fetch to match server route
      const res = await fetch('/api/dashboard/employee/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('employee_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });

  // Fetch my pending tasks
  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/tasks/my-pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('employee_token')}` }
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {employee?.firstName}</h1>
          <p className="text-muted-foreground">Here is your daily activity overview.</p>
        </div>
        <div className="flex gap-2">
          {/* Clock In/Out could go here */}
          <Badge variant={employee?.isActive ? "default" : "secondary"}>
            {employee?.isActive ? "On Duty" : "Off Duty"}
          </Badge>
        </div>
      </div>

      {/* Personal Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasks?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasks?.in_progress || 0}</div>
            <p className="text-xs text-muted-foreground">Currently working on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasks?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Tasks finished today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Efficiency score</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions - constrained permissions */}
        <div className="lg:col-span-2">
          <DashboardQuickActions employeeId={employee?.id || ''} employeeName={employee?.firstName || ''} />

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">My Task List</h2>
            <div className="space-y-4">
              {myTasks.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No pending tasks. Great job!
                  </CardContent>
                </Card>
              ) : (
                myTasks.map((task: any) => (
                  <Card key={task.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <Badge variant="outline" className="mt-2">{task.priority}</Badge>
                      </div>
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Announcements / Schedule */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Shift Start</span>
                  <span className="font-semibold">9:00 AM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shift End</span>
                  <span className="font-semibold">6:00 PM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
