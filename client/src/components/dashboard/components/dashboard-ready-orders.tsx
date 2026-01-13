/**
 * Ready for Pickup Orders Component
 * Shows orders that are ready for customer pickup or delivery
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Phone, Truck, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/data-service';
import { useLocation } from 'wouter';

interface ReadyOrdersProps {
    franchiseId?: string;
}

export const DashboardReadyOrders: React.FC<ReadyOrdersProps> = ({ franchiseId }) => {
    const [, setLocation] = useLocation();

    const { data: readyOrders = [], isLoading, refetch } = useQuery({
        queryKey: ['ready-orders', franchiseId],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const url = franchiseId
                ? `/api/orders?status=ready_for_pickup&franchiseId=${franchiseId}&limit=20`
                : '/api/orders?status=ready_for_pickup&limit=20';

            const res = await fetch(url, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) return [];
            const data = await res.json();
            return data.data || data || [];
        },
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    const { data: outForDeliveryOrders = [] } = useQuery({
        queryKey: ['out-for-delivery-orders', franchiseId],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const url = franchiseId
                ? `/api/orders?status=out_for_delivery&franchiseId=${franchiseId}&limit=20`
                : '/api/orders?status=out_for_delivery&limit=20';

            const res = await fetch(url, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) return [];
            const data = await res.json();
            return data.data || data || [];
        },
        refetchInterval: 30000
    });

    const pickupOrders = readyOrders.filter((o: any) =>
        o.fulfillmentType !== 'delivery' || !o.fulfillmentType
    );

    const deliveryPending = readyOrders.filter((o: any) =>
        o.fulfillmentType === 'delivery'
    );

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Ready for Handover
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-emerald-600" />
                        Ready for Handover
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-center">
                        <ShoppingBag className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                        <p className="text-2xl font-bold text-emerald-700">{pickupOrders.length}</p>
                        <p className="text-xs text-muted-foreground">Self Pickup</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-center">
                        <Truck className="h-5 w-5 mx-auto text-orange-600 mb-1" />
                        <p className="text-2xl font-bold text-orange-700">{deliveryPending.length}</p>
                        <p className="text-xs text-muted-foreground">For Delivery</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                        <Truck className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                        <p className="text-2xl font-bold text-blue-700">{outForDeliveryOrders.length}</p>
                        <p className="text-xs text-muted-foreground">Out for Delivery</p>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {pickupOrders.length === 0 && deliveryPending.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No orders waiting for handover</p>
                        </div>
                    ) : (
                        [...pickupOrders, ...deliveryPending].slice(0, 8).map((order: any) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => setLocation(`/orders?view=${order.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${order.fulfillmentType === 'delivery'
                                            ? 'bg-orange-100 text-orange-600'
                                            : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {order.fulfillmentType === 'delivery' ? (
                                            <Truck className="h-4 w-4" />
                                        ) : (
                                            <ShoppingBag className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{order.customerName || 'Customer'}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {order.orderNumber || order.id.substring(0, 10)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{formatCurrency(order.totalAmount || 0)}</p>
                                    {order.paymentStatus !== 'paid' && (
                                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Unpaid
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {(pickupOrders.length + deliveryPending.length) > 8 && (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation('/orders?status=ready_for_pickup')}
                    >
                        View All ({pickupOrders.length + deliveryPending.length} orders)
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default DashboardReadyOrders;
