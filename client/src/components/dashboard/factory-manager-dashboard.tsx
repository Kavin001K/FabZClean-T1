import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    Shirt,
    Wind,
    Truck,
    Users,
    Clock,
    CheckCircle2,
    ArrowRight,
    Factory,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import DashboardOrdersByDate from "./components/orders-by-date";
import DashboardNewCustomers from "./components/new-customers";

/** Processing pipeline status config */
const PIPELINE_STAGES = [
    { key: "pending", label: "Incoming", icon: Package, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
    { key: "processing", label: "Processing", icon: Shirt, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { key: "ready_for_transit", label: "Ready to Ship", icon: Wind, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { key: "in_transit", label: "In Transit", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
];

export default function FactoryManagerDashboard() {
    const { employee } = useAuth();

    // Fetch all orders (factory manager can see all orders)
    const { data: ordersRes } = useQuery({
        queryKey: ["/api/orders"],
    });
    const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any)?.data || [];

    // Fetch employees (factory staff)
    const { data: employeesRes } = useQuery({
        queryKey: ["/api/employees"],
    });
    const employees = Array.isArray(employeesRes) ? employeesRes : (employeesRes as any)?.data || [];

    // Count orders in each pipeline stage
    const stageCounts: Record<string, number> = {};
    for (const stage of PIPELINE_STAGES) {
        const statuses =
            stage.key === "completed"
                ? ["completed", "delivered", "ready_for_pickup", "ready_for_delivery"]
                : [stage.key];
        stageCounts[stage.key] = orders.filter((o: any) => statuses.includes(o.status)).length;
    }

    const totalInPipeline = PIPELINE_STAGES.filter(s => s.key !== "completed").reduce(
        (sum, s) => sum + (stageCounts[s.key] || 0),
        0
    );

    const factoryStaff = employees.filter(
        (e: any) =>
            (e.role === "factory_staff" || e.position === "Factory Staff") &&
            (e.status === "active" || !e.status)
    );

    const today = new Date().toISOString().split("T")[0];
    const todaysIncoming = orders.filter((o: any) => {
        const created = new Date(o.createdAt || o.created_at || 0);
        return created.toISOString().split("T")[0] === today;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Factory className="h-6 w-6 text-primary" />
                    Factory Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                    Welcome, {employee?.fullName || "Manager"} — Live processing overview
                </p>
            </div>

            {/* Pipeline Cards */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {PIPELINE_STAGES.map((stage) => {
                    const Icon = stage.icon;
                    return (
                        <Card key={stage.key} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full ${stage.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`h-5 w-5 ${stage.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">{stage.label}</p>
                                        <p className="text-xl font-bold">{stageCounts[stage.key] || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Capacity & Today */}
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Active Pipeline Load</p>
                                <p className="text-2xl font-bold mt-1">{totalInPipeline} orders</p>
                                <p className="text-xs text-muted-foreground">across all processing stages</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Today's Incoming</p>
                                <p className="text-2xl font-bold mt-1">{todaysIncoming.length} orders</p>
                                <p className="text-xs text-muted-foreground">received today from stores</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Incoming Orders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
                        <Link href="/orders">
                            <Button variant="ghost" size="sm" className="text-xs">
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                        {orders.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No orders</p>
                        ) : (
                            orders.slice(0, 8).map((o: any) => (
                                <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-medium">{o.orderNumber || o.order_number}</p>
                                        <p className="text-xs text-muted-foreground">{o.customerName || o.customer_name}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs capitalize">
                                        {o.status?.replace(/_/g, " ")}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Factory Workforce */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Factory Workforce</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {factoryStaff.length} staff
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                        {factoryStaff.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No factory staff registered</p>
                        ) : (
                            factoryStaff.map((e: any) => (
                                <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {(e.firstName || e.first_name || "?")[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {e.firstName || e.first_name} {e.lastName || e.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Factory Staff</p>
                                        </div>
                                    </div>
                                    <Badge variant="default" className="text-xs">Active</Badge>
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
        </div>
    );
}
