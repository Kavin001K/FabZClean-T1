import { DollarSign, Users, CreditCard, Package, ClipboardCheck, ShoppingBag, PlusCircle, UserPlus, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import KpiCard from "@/components/dashboard/kpi-card";
import OrderStatusChart from "@/components/dashboard/order-status-chart";
import ServicePopularityChart from "@/components/dashboard/service-popularity-chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
// Import the data service
import { analyticsApi, ordersApi, customersApi, formatCurrency } from '@/lib/data-service';

const dailyRevenueData = [
  { day: "Mon", revenue: 1250 },
  { day: "Tue", revenue: 1500 },
  { day: "Wed", revenue: 1750 },
  { day: "Thu", revenue: 1600 },
  { day: "Fri", revenue: 2100 },
  { day: "Sat", revenue: 2500 },
  { day: "Sun", revenue: 2300 },
];

const newCustomersData = [
  { name: "Alice Johnson", joinDate: "2023-06-25", totalSpent: "₹1,200" },
  { name: "Bob Williams", joinDate: "2023-06-24", totalSpent: "₹800" },
  { name: "Charlie Brown", joinDate: "2023-06-23", totalSpent: "₹1,500" },
];

const employeeAttendanceData = [
  { name: "David Miller", avatar: "/avatars/01.png", status: "Present" },
  { name: "Emily Garcia", avatar: "/avatars/02.png", status: "Present" },
  { name: "Frank Rodriguez", avatar: "/avatars/03.png", status: "Absent" },
  { name: "Grace Lee", avatar: "/avatars/04.png", status: "Present" },
];

const employeeSalaryData = [
  { id: "EMP001", name: "David Miller", salary: "₹28,000" },
  { id: "EMP002", name: "Emily Garcia", salary: "₹26,500" },
  { id: "EMP003", name: "Frank Rodriguez", salary: "₹24,000" },
  { id: "EMP004", name: "Grace Lee", salary: "₹27,000" },
];

export default function FranchiseOwnerDashboard() {
  const { toast } = useToast();
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  // State for real data
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    newCustomers: 0,
    inventoryItems: 0
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [servicePopularityData, setServicePopularityData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [
          metrics,
          sales,
          orderStatus,
          servicePopularity,
          orders
        ] = await Promise.all([
          analyticsApi.getDashboardMetrics(),
          analyticsApi.getSalesData(),
          analyticsApi.getOrderStatusData(),
          analyticsApi.getServicePopularityData(),
          ordersApi.getAll()
        ]);

        setDashboardMetrics(metrics);
        setSalesData(sales);
        setOrderStatusData(orderStatus);
        setServicePopularityData(servicePopularity);
        setRecentOrders(orders.slice(0, 5)); // Get latest 5 orders
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving customer...");
    toast({
      title: "Success!",
      description: "New customer has been created.",
    });
    setIsCustomerDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Franchise Owner Dashboard</h1>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link to="/create-order">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <PlusCircle className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">New Order</h3>
                  <p className="text-sm text-muted-foreground">Create a new service order</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
            <DialogTrigger asChild>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <UserPlus className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">New Customer</h3>
                    <p className="text-sm text-muted-foreground">Add a new customer profile</p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveCustomer} className="py-4 space-y-4">
                <div>
                  <Label htmlFor="customerName">Name</Label>
                  <Input id="customerName" placeholder="e.g., Jane Doe" required />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input id="customerPhone" type="tel" placeholder="e.g., +91 98765 43210" required />
                </div>
                <Button type="submit">Save Customer</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Link to="/tracking">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <Truck className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">New Shipment</h3>
                  <p className="text-sm text-muted-foreground">Dispatch a new shipment</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
        
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="My Store Revenue"
          value={isLoading ? "Loading..." : formatCurrency(dashboardMetrics.totalRevenue)}
          change="+25.5% from last month"
          changeType="positive"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          details={
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-center">Monthly Revenue</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesData.length > 0 ? salesData : []}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
        <KpiCard
          title="New Customers"
          value={isLoading ? "Loading..." : dashboardMetrics.newCustomers.toString()}
          change="+190.5% from last month"
          changeType="positive"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyCustomers.slice(0, 5).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.joinDate}</TableCell>
                      <TableCell className="text-right">{customer.totalOrders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Active Orders"
          value={isLoading ? "Loading..." : dashboardMetrics.totalOrders.toString()}
          change="+22% from last month"
          changeType="positive"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.length > 0 ? recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No orders available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Pending Pickups"
          value="+286"
          change="+150 since last hour"
          changeType="positive"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          details={<p className="py-4">A list of pending pickups for your store will be shown here.</p>}
        />
        <KpiCard
            title="Services in Progress"
            value="124"
            change="32 completed today"
            changeType="positive"
            icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
            details={<p className="py-4">A breakdown of services currently in progress will be shown here.</p>}
        />
        <KpiCard
            title="Ready for Pickup"
            value="88"
            change="25 picked up today"
            changeType="positive"
            icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
            details={<p className="py-4">A list of orders ready for customer pickup will be shown here.</p>}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-muted-foreground">Loading chart data...</div>
              </div>
            ) : (
              <SalesChart data={salesData.length > 0 ? salesData : []} />
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-muted-foreground">Loading orders...</div>
              </div>
            ) : (
              <RecentOrders orders={recentOrders} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-2 flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Loading charts...</div>
          </div>
        ) : (
          <>
            <OrderStatusChart data={orderStatusData.length > 0 ? orderStatusData : []} />
            <ServicePopularityChart data={servicePopularityData.length > 0 ? servicePopularityData : []} />
          </>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Employee Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeeAttendanceData.map((employee) => (
                <div key={employee.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{employee.name}</p>
                  </div>
                  <Badge variant={employee.status === "Present" ? "default" : "destructive"}>
                    {employee.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employee Salaries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeSalaryData.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">{employee.id}</div>
                    </TableCell>
                    <TableCell className="text-right">{employee.salary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
