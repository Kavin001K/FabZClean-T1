import { DollarSign, Landmark, CreditCard, Package, ClipboardList, Truck, UserPlus, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import KpiCard from "@/components/dashboard/kpi-card";
import OrderStatusChart from "@/components/dashboard/order-status-chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Button } from "@/components/ui/button";

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Order
          </Button>
          <Button variant="secondary">
            <UserPlus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
          <Button variant="secondary">
            <Truck className="h-4 w-4 mr-2" />
            New Shipment
          </Button>
          <Button variant="secondary">
            <ClipboardList className="h-4 w-4 mr-2" />
            New Service
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Revenue"
          value="₹1,259,430.50"
          change="+20.1% from last month"
          changeType="positive"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Total Franchises"
          value="+2"
          change="+2 this month"
          changeType="positive"
          icon={<Landmark className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Total Orders"
          value="+12,234"
          change="+19% from last month"
          changeType="positive"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Pending Pickups"
          value="+573"
          change="+201 since last hour"
          changeType="positive"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Total Services"
          value="24"
          change="+5 this month"
          changeType="positive"
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Shipments in Transit"
          value="42"
          change="15 arriving today"
          changeType="positive"
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
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
        {/* Other charts can be added here */}
      </div>
    </div>
  );
}
