/**
 * Factory Manager Dashboard
 * A specialized dashboard for factory operations including:
 * - Receiving orders from stores
 * - Processing/cleaning items
 * - Returning cleaned items to stores
 * - Inventory management
 * - Barcode scanning for order lookup
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import {
    Factory,
    Truck,
    Package,
    CheckCircle2,
    Clock,
    Search,
    Barcode,
    ArrowRight,
    AlertCircle,
    RefreshCw,
    Store,
    Shirt,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data types
interface PendingShipment {
    id: string;
    transitId: string;
    storeFrom: string;
    orderCount: number;
    status: string;
    arrivalTime: string;
    orders: Array<{ orderNumber: string; customerName: string; items: number }>;
}

interface ProcessingItem {
    orderId: string;
    orderNumber: string;
    serviceName: string;
    quantity: number;
    status: 'pending' | 'washing' | 'drying' | 'ironing' | 'ready';
    storeDestination: string;
    tagNote?: string;
}

export default function FactoryDashboard() {
    const { employee } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const queryClient = useQueryClient();
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [showDispatchDialog, setShowDispatchDialog] = useState(false);
    const [dispatchForm, setDispatchForm] = useState({ driverName: '', vehicleNumber: '' });
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scannedOrder, setScannedOrder] = useState<any>(null);
    const [showScanDialog, setShowScanDialog] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    const [showShipmentDialog, setShowShipmentDialog] = useState(false);

    // Mutations
    const markReceivedMutation = useMutation({
        mutationFn: async (transitId: string) => {
            const token = localStorage.getItem('employee_token');
            const res = await fetch(`/api/transit-orders/${transitId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: 'Received' })
            });
            if (!res.ok) throw new Error('Failed to update status');
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Success', description: 'Shipment marked as received' });
            queryClient.invalidateQueries({ queryKey: ['factory-incoming-shipments'] });
            queryClient.invalidateQueries({ queryKey: ['factory-all-orders'] });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    });

    const markReadyMutation = useMutation({
        mutationFn: async (orderId: string) => {
            const token = localStorage.getItem('employee_token');
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: 'ready_for_transit' })
            });
            if (!res.ok) throw new Error('Failed to update order');
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Success', description: 'Order marked ready for shipping' });
            queryClient.invalidateQueries({ queryKey: ['factory-all-orders'] });
        }
    });

    const createDispatchMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('employee_token');
            // Find franchiseId from selected orders (assuming single destination)
            const targetOrder = allOrders.find((o: any) => selectedOrders.includes(o.id));

            const res = await fetch('/api/transit-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    type: 'Return to Store',
                    orderIds: selectedOrders,
                    driverName: dispatchForm.driverName,
                    vehicleNumber: dispatchForm.vehicleNumber,
                    status: 'In Transit',
                    franchiseId: targetOrder?.franchiseId, // Use franchiseId of the order
                    destination: targetOrder?.franchiseId // Use franchiseID as destination identifier for now
                })
            });
            if (!res.ok) throw new Error('Failed to create shipment');
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Success', description: 'Dispatch created successfully' });
            setShowDispatchDialog(false);
            setSelectedOrders([]);
            setDispatchForm({ driverName: '', vehicleNumber: '' });
            queryClient.invalidateQueries({ queryKey: ['factory-all-orders'] });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create dispatch', variant: 'destructive' })
    });

    // Fetch pending incoming shipments
    const { data: incomingShipments = [], isLoading: loadingIncoming } = useQuery({
        queryKey: ['factory-incoming-shipments'],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const res = await fetch('/api/transit-orders?type=To Factory&status=in_transit', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) return [];
            const data = await res.json();
            // Handle both array and object response
            const transits = Array.isArray(data) ? data : (data?.transitOrders || data?.orders || []);
            return transits.map((t: any) => ({
                id: t.id,
                transitId: t.transitId || t.id,
                storeFrom: t.origin || 'Unknown Store',
                orderCount: t.totalOrders || 0,
                status: t.status,
                arrivalTime: t.createdAt,
                orders: []
            }));
        }
    });

    // Fetch ALL orders for factory manager (no franchise isolation)
    const { data: allOrders = [], isLoading: loadingOrders } = useQuery({
        queryKey: ['factory-all-orders'],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const res = await fetch('/api/orders', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) return [];
            const data = await res.json();
            // Handle both array and object response
            return Array.isArray(data) ? data : (data?.orders || []);
        }
    });

    // Fetch shipment linked orders when a shipment is selected
    const { data: shipmentOrders = [], isLoading: loadingShipmentOrders } = useQuery({
        queryKey: ['shipment-orders', selectedShipment?.id],
        queryFn: async () => {
            if (!selectedShipment?.id) return [];
            const token = localStorage.getItem('employee_token');
            const res = await fetch(`/api/transit-orders/${selectedShipment.id}/items`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!selectedShipment?.id
    });

    // Filter orders by status
    const processingItems = allOrders.filter((o: any) => o.status === 'processing');
    const readyToShip = allOrders.filter((o: any) => o.status === 'ready_for_transit');
    const loadingProcessing = loadingOrders;
    const loadingReady = loadingOrders;

    // Handle barcode scan
    const handleBarcodeScan = async () => {
        if (!barcodeInput.trim()) {
            toast({ title: 'Error', description: 'Please enter or scan a barcode', variant: 'destructive' });
            return;
        }

        try {
            const token = localStorage.getItem('employee_token');
            const res = await fetch(`/api/orders/search?q=${encodeURIComponent(barcodeInput)}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const orders = await res.json();
                if (orders.length > 0) {
                    setScannedOrder(orders[0]);
                    setShowScanDialog(true);
                } else {
                    toast({ title: 'Not Found', description: 'No order found with this barcode', variant: 'destructive' });
                }
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to search order', variant: 'destructive' });
        }

        setBarcodeInput('');
    };

    // KPI Stats with proper array safety
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedTodayCount = Array.isArray(allOrders)
        ? allOrders.filter((o: any) => {
            if (o.status !== 'completed') return false;
            const updatedAt = o.updatedAt ? new Date(o.updatedAt) : null;
            return updatedAt && updatedAt >= today;
        }).length
        : 0;

    const stats = {
        pendingReceive: Array.isArray(incomingShipments) ? incomingShipments.length : 0,
        inProcessing: Array.isArray(processingItems) ? processingItems.length : 0,
        readyToShip: Array.isArray(readyToShip) ? readyToShip.length : 0,
        totalOrders: Array.isArray(allOrders) ? allOrders.length : 0,
        completedToday: completedTodayCount
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Factory className="h-8 w-8 text-primary" />
                        Factory Operations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome, {employee?.fullName || 'Factory Manager'}
                    </p>
                </div>

                {/* Quick Barcode Scanner */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
                            placeholder="Scan or enter barcode..."
                            className="pl-10 w-64"
                        />
                    </div>
                    <Button onClick={handleBarcodeScan}>
                        <Search className="h-4 w-4 mr-2" />
                        Lookup
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
                                <Truck className="h-4 w-4" />
                                Pending Receive
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-orange-600">{stats.pendingReceive}</p>
                            <p className="text-xs text-muted-foreground">Shipments arriving</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
                                <RefreshCw className="h-4 w-4" />
                                In Processing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-600">{stats.inProcessing}</p>
                            <p className="text-xs text-muted-foreground">Orders being cleaned</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700">
                                <Package className="h-4 w-4" />
                                Ready to Ship
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-600">{stats.readyToShip}</p>
                            <p className="text-xs text-muted-foreground">Awaiting dispatch</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Completed Today
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-purple-600">{stats.completedToday}</p>
                            <p className="text-xs text-muted-foreground">Orders dispatched</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="incoming" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Incoming
                        {stats.pendingReceive > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                                {stats.pendingReceive}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="processing" className="flex items-center gap-2">
                        <Shirt className="h-4 w-4" />
                        Processing
                    </TabsTrigger>
                    <TabsTrigger value="outgoing" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Outgoing
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Workflow Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 text-primary" />
                                    Factory Workflow
                                </CardTitle>
                                <CardDescription>Today's processing pipeline</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-orange-100">
                                                <Truck className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Receive</p>
                                                <p className="text-xs text-muted-foreground">{stats.pendingReceive} pending</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-blue-100">
                                                <Shirt className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Process</p>
                                                <p className="text-xs text-muted-foreground">{stats.inProcessing} active</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-green-100">
                                                <Package className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Ship</p>
                                                <p className="text-xs text-muted-foreground">{stats.readyToShip} ready</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Progress value={65} className="h-2" />
                                    <p className="text-xs text-center text-muted-foreground">65% daily capacity utilized</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-primary" />
                                    Quick Actions
                                </CardTitle>
                                <CardDescription>Common factory operations</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => setActiveTab('incoming')}>
                                    <Truck className="h-6 w-6 text-orange-500" />
                                    <span>Receive Shipment</span>
                                </Button>
                                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => setActiveTab('processing')}>
                                    <Shirt className="h-6 w-6 text-blue-500" />
                                    <span>Update Processing</span>
                                </Button>
                                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => setActiveTab('outgoing')}>
                                    <Store className="h-6 w-6 text-green-500" />
                                    <span>Create Shipment</span>
                                </Button>
                                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                                    <Barcode className="h-6 w-6 text-purple-500" />
                                    <span>Scan Order</span>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Incoming Tab */}
                <TabsContent value="incoming" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-orange-500" />
                                Incoming Shipments
                            </CardTitle>
                            <CardDescription>Shipments from stores awaiting receipt</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingIncoming ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : incomingShipments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mb-4 text-green-500/50" />
                                    <p className="font-medium">No pending shipments!</p>
                                    <p className="text-sm">All incoming orders have been received.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {incomingShipments.map((shipment: PendingShipment) => (
                                        <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                            <div
                                                className="flex items-center gap-4 flex-1 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedShipment(shipment);
                                                    setShowShipmentDialog(true);
                                                }}
                                            >
                                                <div className="p-2 rounded-full bg-orange-100">
                                                    <Truck className="h-5 w-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{shipment.transitId}</p>
                                                    <p className="text-sm text-muted-foreground">From: {shipment.storeFrom}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <Badge variant="outline">{shipment.orderCount} orders</Badge>
                                                    <p className="text-xs text-muted-foreground mt-1">{shipment.status}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        setSelectedShipment(shipment);
                                                        setShowShipmentDialog(true);
                                                    }}
                                                >
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                                {shipment.status?.toLowerCase() === 'received' ? (
                                                    <Badge className="bg-green-600">Received ✓</Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="bg-orange-600 hover:bg-orange-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markReceivedMutation.mutate(shipment.id);
                                                        }}
                                                        disabled={markReceivedMutation.isPending}
                                                    >
                                                        {markReceivedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Received"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Processing Tab */}
                <TabsContent value="processing" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shirt className="h-5 w-5 text-blue-500" />
                                Processing Orders
                            </CardTitle>
                            <CardDescription>Orders currently being cleaned</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingProcessing ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (!Array.isArray(processingItems) || processingItems.length === 0) ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Shirt className="h-12 w-12 mb-4 text-blue-500/50" />
                                    <p className="font-medium">No orders in processing</p>
                                    <p className="text-sm">Receive orders to start processing.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {processingItems.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{item.orderNumber}</p>
                                                <p className="text-sm text-muted-foreground">{item.customerName}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge>{item.status}</Badge>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => markReadyMutation.mutate(item.id)}
                                                    disabled={markReadyMutation.isPending}
                                                >
                                                    {markReadyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Ready"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Outgoing Tab */}
                <TabsContent value="outgoing" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Store className="h-5 w-5 text-green-500" />
                                    Ready for Dispatch
                                </div>
                                {selectedOrders.length > 0 && (
                                    <Button size="sm" onClick={() => setShowDispatchDialog(true)} className="bg-green-600 hover:bg-green-700">
                                        Create Shipment ({selectedOrders.length})
                                    </Button>
                                )}
                            </CardTitle>
                            <CardDescription>Cleaned orders ready to return to stores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingReady ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (!Array.isArray(readyToShip) || readyToShip.length === 0) ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Package className="h-12 w-12 mb-4 text-green-500/50" />
                                    <p className="font-medium">No orders ready to ship</p>
                                    <p className="text-sm">Complete processing to see orders here.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {readyToShip.map((order: any) => (
                                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`details-${order.id}`}
                                                    checked={selectedOrders.includes(order.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedOrders([...selectedOrders, order.id]);
                                                        } else {
                                                            setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                                                        }
                                                    }}
                                                />
                                                <div>
                                                    <p className="font-medium">{order.orderNumber}</p>
                                                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline">{order.franchiseId || 'Store'}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Scanned Order Dialog */}
            <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Barcode className="h-5 w-5" />
                            Order Found
                        </DialogTitle>
                        <DialogDescription>
                            Order details from barcode scan
                        </DialogDescription>
                    </DialogHeader>
                    {scannedOrder && (
                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order Number</p>
                                    <p className="font-bold text-lg">{scannedOrder.orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Customer</p>
                                    <p className="font-medium">{scannedOrder.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Current Status</p>
                                    <Badge className="mt-1">{scannedOrder.status}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Store</p>
                                    <p className="font-medium">{scannedOrder.franchiseId || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Items/Services */}
                            {Array.isArray(scannedOrder.items) && scannedOrder.items.length > 0 && (
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium mb-2">Services ({scannedOrder.items.length})</p>
                                    <div className="space-y-2 max-h-40 overflow-auto">
                                        {scannedOrder.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                                <span>{item.customName || item.serviceName}</span>
                                                <span className="text-muted-foreground">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Status Actions */}
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium mb-2">Quick Actions</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {scannedOrder.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                markReadyMutation.mutate(scannedOrder.id);
                                                setShowScanDialog(false);
                                            }}
                                        >
                                            Start Processing
                                        </Button>
                                    )}
                                    {scannedOrder.status === 'processing' && (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => {
                                                markReadyMutation.mutate(scannedOrder.id);
                                                setShowScanDialog(false);
                                            }}
                                        >
                                            Mark Ready for Transit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowScanDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Dispatch Dialog */}
            <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Dispatch</DialogTitle>
                        <DialogDescription>
                            Create a return shipment for {selectedOrders.length} orders
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Driver Name</Label>
                            <Input
                                value={dispatchForm.driverName}
                                onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                                placeholder="Enter driver name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Vehicle Number</Label>
                            <Input
                                value={dispatchForm.vehicleNumber}
                                onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value })}
                                placeholder="Enter vehicle number"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDispatchDialog(false)}>Cancel</Button>
                        <Button
                            onClick={() => createDispatchMutation.mutate()}
                            disabled={createDispatchMutation.isPending || !dispatchForm.driverName || !dispatchForm.vehicleNumber}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {createDispatchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Create Dispatch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Shipment Details Dialog */}
            <Dialog open={showShipmentDialog} onOpenChange={setShowShipmentDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-orange-500" />
                            Shipment Details
                        </DialogTitle>
                        <DialogDescription>
                            {selectedShipment?.transitId} - From {selectedShipment?.storeFrom}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedShipment && (
                        <div className="space-y-6 py-4">
                            {/* Shipment Overview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-2xl font-bold text-orange-600">{selectedShipment.orderCount}</p>
                                    <p className="text-xs text-muted-foreground">Total Orders</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {loadingShipmentOrders ? '...' : (shipmentOrders?.length || 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Linked Orders</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <Badge className={selectedShipment.status?.toLowerCase() === 'received' ? 'bg-green-600' : 'bg-orange-600'}>
                                        {selectedShipment.status}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">Status</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-sm font-medium">
                                        {selectedShipment.arrivalTime ? new Date(selectedShipment.arrivalTime).toLocaleDateString() : 'N/A'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Date Created</p>
                                </div>
                            </div>

                            {/* Linked Orders */}
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Orders in this Shipment
                                </h4>
                                {loadingShipmentOrders ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : !shipmentOrders || shipmentOrders.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No linked orders found</p>
                                    </div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 sticky top-0">
                                                <tr>
                                                    <th className="text-left p-2 font-medium">Order #</th>
                                                    <th className="text-left p-2 font-medium">Customer</th>
                                                    <th className="text-left p-2 font-medium">Status</th>
                                                    <th className="text-right p-2 font-medium">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {shipmentOrders.map((order: any, idx: number) => (
                                                    <tr key={order.id || idx} className="border-t hover:bg-muted/30">
                                                        <td className="p-2 font-mono text-xs">
                                                            {order.orderNumber || order.id?.substring(0, 12)}
                                                        </td>
                                                        <td className="p-2">
                                                            {order.customerName || order.customers?.name || 'N/A'}
                                                        </td>
                                                        <td className="p-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {order.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2 text-right font-medium">
                                                            ₹{parseFloat(order.totalAmount || 0).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            {shipmentOrders && shipmentOrders.length > 0 && (
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Value</p>
                                            <p className="text-xl font-bold">
                                                ₹{shipmentOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Avg per Order</p>
                                            <p className="text-xl font-bold">
                                                ₹{Math.round(shipmentOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0) / shipmentOrders.length).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {selectedShipment?.status?.toLowerCase() !== 'received' && (
                            <Button
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => {
                                    markReceivedMutation.mutate(selectedShipment.id);
                                    setShowShipmentDialog(false);
                                }}
                                disabled={markReceivedMutation.isPending}
                            >
                                {markReceivedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Mark as Received
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setShowShipmentDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
