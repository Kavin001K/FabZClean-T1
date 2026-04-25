import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Truck, Search, Filter, AlertTriangle,
    MapPin, Phone, User, CheckCircle2, Navigation
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PageTransition, FadeIn } from "@/components/ui/page-transition";

export default function DeliveriesManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedPartnerId, setSelectedPartnerId] = useState("");

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Orders
    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['orders'],
    });

    // Fetch Delivery Employees
    const { data: employeesData } = useQuery({
        queryKey: ['employees'],
    });

    // Extract orders list (handling paginated response if applicable)
    const ordersList = (ordersData as any)?.data || ordersData || [];
    const employeesList = (employeesData as any)?.data || employeesData || [];

    // Filter explicitly for home delivery orders
    const deliveryOrders = ordersList.filter((order: any) =>
        order.fulfillmentType === 'delivery' &&
        ['ready_for_delivery', 'out_for_delivery'].includes(order.status)
    );

    // Filter exclusively for Employees with the "delivery" position
    const deliveryPartners = employeesList.filter((emp: any) =>
        emp.position?.toLowerCase() === 'delivery' &&
        emp.status === 'active'
    );

    // Apply search/status UI filters
    const filteredOrders = deliveryOrders.filter((order: any) => {
        const matchesSearch =
            order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;

        return true;
    });

    // Mutation to assign delivery partner
    const assignDeliveryPartnerMutation = useMutation({
        mutationFn: async ({ orderId, partnerId }: { orderId: string, partnerId: string }) => {
            const response = await fetch(`/api/orders/${orderId}/assign-delivery`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryPartnerId: partnerId })
            });
            if (!response.ok) throw new Error(await response.text());
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Delivery partner assigned successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setIsAssignModalOpen(false);
            setSelectedOrder(null);
            setSelectedPartnerId("");
        },
        onError: (err) => {
            toast({
                title: "Error",
                description: "Failed to assign partner. Please try again.",
                variant: "destructive"
            });
        }
    });

    const handleAssignClick = (order: any) => {
        setSelectedOrder(order);
        setSelectedPartnerId(order.deliveryPartnerId || "");
        setIsAssignModalOpen(true);
    };

    const handleAssignConfirm = () => {
        if (!selectedOrder || !selectedPartnerId) return;
        assignDeliveryPartnerMutation.mutate({
            orderId: selectedOrder.id,
            partnerId: selectedPartnerId
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Assigned</Badge>;
            case 'out_for_delivery':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Out for Delivery</Badge>;
            case 'delivered':
                return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Delivered</Badge>;
            case 'failed':
                return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Failed</Badge>;
            default:
                return <Badge className="bg-slate-100 text-slate-800 border-slate-200 uppercase">{status}</Badge>;
        }
    };

    return (
        <PageTransition>
            <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto pb-10">
                <FadeIn>
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Delivery Management</h1>
                            <p className="text-muted-foreground mt-1">Assign and monitor active home delivery orders</p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    className="pl-9 bg-background/50 backdrop-blur-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px] bg-background/50 backdrop-blur-sm">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="ready_for_delivery">Ready for Delivery</SelectItem>
                                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <Card className="glass overflow-hidden border-border/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left align-middle">
                                <thead>
                                    <tr className="border-b border-border/50 text-muted-foreground bg-muted/20">
                                        <th className="h-12 px-4 font-medium">Order ID</th>
                                        <th className="h-12 px-4 font-medium">Customer</th>
                                        <th className="h-12 px-4 font-medium">Delivery Address</th>
                                        <th className="h-12 px-4 font-medium">Amount</th>
                                        <th className="h-12 px-4 font-medium">Status</th>
                                        <th className="h-12 px-4 font-medium">Assigned To</th>
                                        <th className="h-12 px-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingOrders ? (
                                        <tr>
                                            <td colSpan={7} className="h-32 text-center text-muted-foreground">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="h-4 w-4 rounded-full border-2 border-primary border-r-transparent animate-spin" />
                                                    Loading orders...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="h-32 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Truck className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                                    No active delivery orders found.
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order: any, idx: number) => {
                                            const assignee = employeesList.find((e: any) => e.id === order.deliveryPartnerId);

                                            return (
                                                <tr
                                                    key={order.id}
                                                    className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                                                >
                                                    <td className="p-4 font-medium">
                                                        {order.orderNumber}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-foreground">{order.customerName}</span>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Phone className="h-3 w-3" /> {order.customerPhone}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 max-w-[250px] truncate">
                                                        {order.deliveryAddress ? (
                                                            <span className="text-muted-foreground">{order.deliveryAddress.street || 'Address saved'}, {order.deliveryAddress.city}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground italic text-xs">No address specified</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground">Rs. {order.totalAmount}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{order.paymentStatus}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {getStatusBadge(order.status)}
                                                    </td>
                                                    <td className="p-4">
                                                        {assignee ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                                                    {assignee.firstName?.charAt(0)}
                                                                </div>
                                                                <span className="text-sm">{assignee.firstName} {assignee.lastName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button
                                                            variant={(order.status === 'ready_for_delivery' || !order.deliveryPartnerId) ? "default" : "outline"}
                                                            size="sm"
                                                            className="w-full max-w-[120px]"
                                                            onClick={() => handleAssignClick(order)}
                                                        >
                                                            {assignee ? 'Reassign Captain' : 'Assign Captain'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </FadeIn>
            </div>

            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Assign Delivery Captain</DialogTitle>
                        <DialogDescription>
                            Assign the order {selectedOrder?.orderNumber} to a delivery partner. Only employees with 'Delivery' roles are shown.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Select Partner
                            </label>
                            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a delivery partner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {deliveryPartners.length === 0 ? (
                                        <SelectItem value="none" disabled>No active delivery partners found</SelectItem>
                                    ) : (
                                        deliveryPartners.map((partner: any) => (
                                            <SelectItem key={partner.id} value={partner.id}>
                                                {partner.firstName} {partner.lastName} ({partner.employeeId})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleAssignConfirm}
                            disabled={!selectedPartnerId || assignDeliveryPartnerMutation.isPending}
                        >
                            {assignDeliveryPartnerMutation.isPending ? 'Assigning...' : 'Assign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTransition>
    );
}
