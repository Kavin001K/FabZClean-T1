import { DollarSign, Users, CreditCard, Activity, Package, Landmark, ClipboardList, Truck, UserPlus, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
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
    <div>
      <header className="sticky top-0 z-10 bg-background/95 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
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

        {/* Quick Actions */}
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
      </header>

      <main className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹1,259,430.50</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Franchises</CardTitle>
                <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+2</div>
                <p className="text-xs text-muted-foreground">+2 this month</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+12,234</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Pickups</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">+201 since last hour</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+5 this month</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shipments in Transit</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">15 arriving today</p>
            </CardContent>
        </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
      </main>
    </div>
  );
}
