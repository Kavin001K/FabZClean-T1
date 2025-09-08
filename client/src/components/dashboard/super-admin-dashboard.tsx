import { DollarSign, Landmark, CreditCard, Package, ClipboardList, Truck, UserPlus, PlusCircle, FileText, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import KpiCard from "@/components/dashboard/kpi-card";
import OrderStatusChart from "@/components/dashboard/order-status-chart";
import FranchisePerformance from "@/components/dashboard/franchise-performance";
import ServicePopularityChart from "@/components/dashboard/service-popularity-chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const revenueData = [
  { name: 'Week 1', revenue: 4000 },
  { name: 'Week 2', revenue: 3000 },
  { name: 'Week 3', revenue: 2000 },
  { name: 'Week 4', revenue: 2780 },
];

const franchiseDetailsData = [
  { name: "Downtown Central", revenue: "₹450,231.89", status: "Active", newCustomers: 120 },
  { name: "Northside Hub", revenue: "₹320,112.45", status: "Active", newCustomers: 95 },
  { name: "Eastwood Branch", revenue: "₹280,543.21", status: "Warning", newCustomers: 50 },
];

const recentOrdersData = [
  { orderId: "ORD001", customer: "Liam Johnson", amount: "₹250.00", status: "Fulfilled" },
  { orderId: "ORD002", customer: "Olivia Smith", amount: "₹150.00", status: "Pending" },
  { orderId: "ORD003", customer: "Noah Williams", amount: "₹350.00", status: "Fulfilled" },
];

const pendingPickupsData = [
  { customer: "Emma Brown", location: "123 Main St", time: "2:00 PM" },
  { customer: "Lucas Jones", location: "456 Oak Ave", time: "4:30 PM" },
];

const deliveryPerformanceData = [
  { month: 'Jan', rate: 95.2 },
  { month: 'Feb', rate: 96.5 },
  { month: 'Mar', rate: 97.1 },
  { month: 'Apr', rate: 98.2 },
];

const servicesDetailsData = [
  { name: "Dry Cleaning", monthlyOrders: 1200, revenue: "₹150,000" },
  { name: "Premium Laundry", monthlyOrders: 850, revenue: "₹120,000" },
  { name: "Steam Ironing", monthlyOrders: 700, revenue: "₹50,000" },
];

const shipmentsDetailsData = [
  { id: "SHP001", destination: "Northside Hub", status: "In Transit", eta: "2 hours" },
  { id: "SHP002", destination: "Downtown Central", status: "Delayed", eta: "5 hours" },
  { id: "SHP003", destination: "Eastwood Branch", status: "In Transit", eta: "1 hour" },
];

const activeStoresData = [
  { name: "Downtown Central", manager: "John Doe", monthlyRevenue: "₹120,000" },
  { name: "Northside Hub", manager: "Jane Smith", monthlyRevenue: "₹95,000" },
  { name: "Eastwood Branch", manager: "Peter Jones", monthlyRevenue: "₹80,000" },
];

const consolidatedSalaryData = [
  { id: "EMP001", name: "David Miller", franchise: "Downtown Central", salary: "₹28,000" },
  { id: "EMP005", name: "Helen Clark", franchise: "Northside Hub", salary: "₹29,500" },
  { id: "EMP009", name: "Ivy Green", franchise: "Eastwood Branch", salary: "₹27,000" },
];

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Franchises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Franchises</SelectItem>
            <SelectItem value="fr-1">Franchise 1</SelectItem>
            <SelectItem value="fr-2">Franchise 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <PlusCircle className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">New Order</h3>
                <p className="text-sm text-muted-foreground">Create a new service order</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <UserPlus className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">New Customer</h3>
                <p className="text-sm text-muted-foreground">Add a new customer profile</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Manage Franchises</h3>
                <p className="text-sm text-muted-foreground">Oversee franchise operations</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Generate Report</h3>
                <p className="text-sm text-muted-foreground">Create and export reports</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Revenue"
          value="₹1,259,430.50"
          change="+20.1% from last month"
          changeType="positive"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          animationDelay={0}
          details={
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-center">Monthly Revenue Trend</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          }
        />
        <KpiCard
          title="Total Franchises"
          value="+2"
          change="+2 this month"
          changeType="positive"
          icon={<Landmark className="h-4 w-4 text-muted-foreground" />}
          animationDelay={100}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Franchise</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchiseDetailsData.map((franchise) => (
                    <TableRow key={franchise.name}>
                      <TableCell className="font-medium">{franchise.name}</TableCell>
                      <TableCell>{franchise.status}</TableCell>
                      <TableCell className="text-right">{franchise.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Total Orders"
          value="+12,234"
          change="+19% from last month"
          changeType="positive"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          animationDelay={200}
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
                  {recentOrdersData.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell className="text-right">{order.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Pending Pickups"
          value="+573"
          change="+201 since last hour"
          changeType="positive"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          animationDelay={300}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPickupsData.map((pickup) => (
                    <TableRow key={pickup.customer}>
                      <TableCell className="font-medium">{pickup.customer}</TableCell>
                      <TableCell>{pickup.location}</TableCell>
                      <TableCell className="text-right">{pickup.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Total Services"
          value="24"
          change="+5 this month"
          changeType="positive"
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
          animationDelay={400}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Monthly Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicesDetailsData.map((service) => (
                    <TableRow key={service.name}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.monthlyOrders}</TableCell>
                      <TableCell className="text-right">{service.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Shipments in Transit"
          value="42"
          change="15 arriving today"
          changeType="positive"
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          animationDelay={500}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">ETA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipmentsDetailsData.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.id}</TableCell>
                      <TableCell>{shipment.destination}</TableCell>
                      <TableCell>{shipment.status}</TableCell>
                      <TableCell className="text-right">{shipment.eta}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Active Stores"
          value="12"
          change="+1 this quarter"
          changeType="positive"
          icon={<Landmark className="h-4 w-4 text-muted-foreground" />}
          animationDelay={600}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead className="text-right">Monthly Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStoresData.map((store) => (
                    <TableRow key={store.name}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>{store.manager}</TableCell>
                      <TableCell className="text-right">{store.monthlyRevenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Washing Capacity"
          value="85%"
          change="Approaching peak"
          changeType="negative"
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
          animationDelay={700}
          details={
            <div className="py-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Current Utilization</h4>
                <Progress value={85} />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Insights</h4>
                <p>Capacity is currently high. Consider optimizing schedules or expanding to meet demand.</p>
              </div>
            </div>
          }
        />
        <KpiCard
          title="On-Time Delivery"
          value="98.2%"
          change="+1.5% this month"
          changeType="positive"
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          animationDelay={800}
          details={
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-center">Monthly Delivery Performance</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deliveryPerformanceData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 animate-fade-in" style={{ animationDelay: "600ms" }}>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 animate-fade-in" style={{ animationDelay: "700ms" }}>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrders />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <OrderStatusChart />
        <FranchisePerformance />
        <ServicePopularityChart />
        <Card>
          <CardHeader>
            <CardTitle>Consolidated Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Franchise</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidatedSalaryData.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">{employee.id}</div>
                    </TableCell>
                    <TableCell>{employee.franchise}</TableCell>
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
