import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    Wallet,
    ShoppingBag,
    Users,
    IndianRupee,
    Printer,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";

export default function StoreStaffDashboard() {
    const { employee } = useAuth();

    // Fetch today's orders
    const { data: ordersRes } = useQuery({
        queryKey: ["/api/orders"],
    });
    const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any)?.data || [];

    const today = new Date().toISOString().split("T")[0];

    const todaysOrders = orders.filter((o: any) => {
        const created = new Date(o.createdAt || o.created_at || 0);
        return created.toISOString().split("T")[0] === today;
    });

    const todaysRevenue = todaysOrders.reduce(
        (sum: number, o: any) => sum + parseFloat(o.totalAmount || o.total_amount || "0"),
        0
    );

    const cashOrders = todaysOrders.filter(
        (o: any) => (o.paymentMethod || o.payment_method || "cash").toLowerCase() === "cash"
    );
    const cashCollected = cashOrders.reduce(
        (sum: number, o: any) => sum + parseFloat(o.totalAmount || o.total_amount || "0"),
        0
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Hey, {employee?.fullName?.split(" ")[0] || "Staff"} 👋</h1>
                <p className="text-sm text-muted-foreground">
                    Your shift dashboard — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                </p>
            </div>

            {/* Quick Action Buttons — Main CTA Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link href="/create-order">
                    <Button className="w-full h-20 flex-col gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg">
                        <PlusCircle className="h-6 w-6" />
                        <span className="text-sm font-semibold">New Order</span>
                    </Button>
                </Link>
                <Link href="/wallet-management">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                        <Wallet className="h-6 w-6" />
                        <span className="text-sm font-semibold">Wallet Top-Up</span>
                    </Button>
                </Link>
                <Link href="/customers">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                        <Users className="h-6 w-6" />
                        <span className="text-sm font-semibold">Customers</span>
                    </Button>
                </Link>
                <Link href="/print-queue">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                        <Printer className="h-6 w-6" />
                        <span className="text-sm font-semibold">Print Tags</span>
                    </Button>
                </Link>
            </div>

            {/* Shift Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Orders Today</p>
                                <p className="text-xl font-bold">{todaysOrders.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <IndianRupee className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total Billed</p>
                                <p className="text-xl font-bold">₹{todaysRevenue.toLocaleString("en-IN")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Cash in Hand</p>
                                <p className="text-xl font-bold">₹{cashCollected.toLocaleString("en-IN")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Your Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[350px] overflow-y-auto">
                    {todaysOrders.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No orders created today yet</p>
                            <Link href="/create-order">
                                <Button variant="link" size="sm" className="mt-1">
                                    Create your first order →
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        todaysOrders.slice(0, 10).map((o: any) => (
                            <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="text-sm font-medium">{o.orderNumber || o.order_number}</p>
                                    <p className="text-xs text-muted-foreground">{o.customerName || o.customer_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">₹{parseFloat(o.totalAmount || o.total_amount || "0").toLocaleString("en-IN")}</p>
                                    <Badge variant="outline" className="text-xs capitalize">
                                        {o.status?.replace(/_/g, " ")}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
