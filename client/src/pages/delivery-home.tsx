import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Phone, MapPin, Package, CheckCircle2, Loader2, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function DeliveryHome() {
    const { employee } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: response, isLoading } = useQuery({
        queryKey: ['/api/deliveries/me/active'],
        refetchInterval: 15000, // Auto-refresh every 15s
    });

    const orders = (response as any)?.data || [];

    const deliverMutation = useMutation({
        mutationFn: async (orderId: string) => {
            const res = await apiRequest('PATCH', `/api/orders/${orderId}/deliver`);
            return res.json();
        },
        onSuccess: (_, orderId) => {
            toast({ title: '✅ Delivery Complete', description: 'Order marked as delivered successfully.' });
            queryClient.invalidateQueries({ queryKey: ['/api/deliveries/me/active'] });
            queryClient.invalidateQueries({ queryKey: ['/api/deliveries/me/history'] });
        },
        onError: (error: any) => {
            toast({ title: 'Delivery Failed', description: error.message || 'Something went wrong.', variant: 'destructive' });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold">My Deliveries</h1>
                <p className="text-sm text-muted-foreground">
                    Hello, {employee?.fullName || 'Driver'} 👋
                </p>
                <Badge variant="outline" className="text-xs">
                    {orders.length} active {orders.length === 1 ? 'delivery' : 'deliveries'}
                </Badge>
            </div>

            <Separator />

            {/* Orders */}
            {orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground">No active deliveries right now.</p>
                    <p className="text-xs text-muted-foreground">New assignments will appear here automatically.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order: any) => (
                        <Card key={order.id} className="overflow-hidden border-l-4 border-l-blue-500">
                            <CardContent className="p-4 space-y-3">
                                {/* Order Header */}
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm">{order.orderNumber}</span>
                                    <Badge className="text-xs capitalize">
                                        {order.status?.replace(/_/g, ' ')}
                                    </Badge>
                                </div>

                                {/* Customer Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{order.customerName}</span>
                                    </div>

                                    {order.customerPhone && (
                                        <a
                                            href={`tel:${order.customerPhone}`}
                                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                        >
                                            <Phone className="h-4 w-4" />
                                            {order.customerPhone}
                                        </a>
                                    )}

                                    {order.deliveryAddress && (
                                        <a
                                            href={`https://maps.google.com/?q=${encodeURIComponent(
                                                typeof order.deliveryAddress === 'object'
                                                    ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}`
                                                    : String(order.deliveryAddress)
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-2 text-sm text-emerald-600 hover:underline"
                                        >
                                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                            <span>
                                                {typeof order.deliveryAddress === 'object'
                                                    ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}`
                                                    : String(order.deliveryAddress)}
                                            </span>
                                        </a>
                                    )}
                                </div>

                                {/* Amount & Action */}
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Amount: </span>
                                        <span className="font-bold">₹{parseFloat(order.totalAmount || '0').toLocaleString('en-IN')}</span>
                                        {order.isCreditOrder && (
                                            <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700">Credit</Badge>
                                        )}
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => deliverMutation.mutate(order.id)}
                                        disabled={deliverMutation.isPending}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {deliverMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                        )}
                                        Delivered
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
