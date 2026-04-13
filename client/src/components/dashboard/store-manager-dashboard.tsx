import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    IndianRupee,
    ShoppingBag,
    Users,
    Clock,
    TrendingUp,
    TrendingDown,
    Package,
    UserCheck,
    Banknote,
    ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import DashboardOrdersByDate from "./components/orders-by-date";
import DashboardNewCustomers from "./components/new-customers";

export default function StoreManagerDashboard() {
    const { employee } = useAuth();

    // Fetch orders for this store
    const { data: ordersRes } = useQuery({
        queryKey: ["/api/orders"],
    });
    const orders = (ordersRes as any)?.data || ordersRes || [];

    // Fetch employees
    const { data: employeesRes } = useQuery({
        queryKey: ["/api/employees"],
    });
    const employees = (employeesRes as any)?.data || employeesRes || [];

    // Fetch dashboard stats
    const { data: dashRes } = useQuery({
        queryKey: ["/api/dashboard/stats"],
    });
    const dashStats = (dashRes as any)?.data || dashRes || {};

    // Today's orders
    const today = new Date().toISOString().split("T")[0];
    const todaysOrders = Array.isArray(orders)
        ? orders.filter((o: any) => {
            const created = new Date(o.createdAt || o.created_at || 0);
            return created.toISOString().split("T")[0] === today;
        })
        : [];

    const todaysRevenue = todaysOrders.reduce(
        (sum: number, o: any) => sum + parseFloat(o.totalAmount || o.total_amount || "0"),
        0
    );

    const pendingOrders = Array.isArray(orders)
        ? orders.filter((o: any) => ["pending", "processing", "assigned"].includes(o.status))
        : [];

    const readyForDispatch = Array.isArray(orders)
        ? orders.filter((o: any) =>
            ["ready_for_transit", "ready_for_delivery", "ready_for_pickup"].includes(o.status)
        )
        : [];

    const activeStaff = Array.isArray(employees)
        ? employees.filter((e: any) => e.status === "active" || !e.status)
        : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Store Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Welcome back, {employee?.fullName || "Manager"} — Here's your store overview for today
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Today's Revenue</p>
                                <p className="text-2xl font-bold mt-1">₹{todaysRevenue.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <IndianRupee className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Today's Orders</p>
                                <p className="text-2xl font-bold mt-1">{todaysOrders.length}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Pending / Processing</p>
                                <p className="text-2xl font-bold mt-1">{pendingOrders.length}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Ready for Dispatch</p>
                                <p className="text-2xl font-bold mt-1">{readyForDispatch.length}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Pending Orders Queue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Active Orders</CardTitle>
                        <Link href="/orders">
                            <Button variant="ghost" size="sm" className="text-xs">
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                        {pendingOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No pending orders</p>
                        ) : (
                            pendingOrders.slice(0, 8).map((o: any) => (
                                <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-medium">{o.orderNumber || o.order_number}</p>
                                        <p className="text-xs text-muted-foreground">{o.customerName || o.customer_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {o.status?.replace(/_/g, " ")}
                                        </Badge>
                                        <p className="text-xs font-medium mt-1">₹{parseFloat(o.totalAmount || o.total_amount || "0").toLocaleString("en-IN")}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Staff Overview */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Staff Overview</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {activeStaff.length} active
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                        {activeStaff.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No staff data</p>
                        ) : (
                            activeStaff.slice(0, 8).map((e: any) => (
                                <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {(e.firstName || e.first_name || "?")[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {e.firstName || e.first_name} {e.lastName || e.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {e.position || e.role}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={e.status === "active" || !e.status ? "default" : "secondary"} className="text-xs">
                                        {e.status || "active"}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardOrdersByDate />
                <DashboardNewCustomers />
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Link href="/create-order">
                            <Button variant="outline" className="w-full h-16 flex-col gap-1">
                                <ShoppingBag className="h-5 w-5" />
                                <span className="text-xs">New Order</span>
                            </Button>
                        </Link>
                        <Link href="/customers">
                            <Button variant="outline" className="w-full h-16 flex-col gap-1">
                                <Users className="h-5 w-5" />
                                <span className="text-xs">Customers</span>
                            </Button>
                        </Link>
                        <Link href="/wallet-management">
                            <Button variant="outline" className="w-full h-16 flex-col gap-1">
                                <Banknote className="h-5 w-5" />
                                <span className="text-xs">Wallet</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
