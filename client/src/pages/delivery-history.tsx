import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, TrendingUp, IndianRupee, Package, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function DeliveryHistory() {
    const { employee } = useAuth();

    const { data: response, isLoading } = useQuery({
        queryKey: ['/api/deliveries/me/history'],
    });

    const historyData = (response as any)?.data;
    const orders = historyData?.orders || [];
    const earnings = historyData?.earnings || {};

    // Group orders by date
    const groupedOrders: Record<string, any[]> = {};
    for (const order of orders) {
        const date = new Date(order.deliveredAt || order.updatedAt || 0).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
        if (!groupedOrders[date]) groupedOrders[date] = [];
        groupedOrders[date].push(order);
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto space-y-6">
            {/* Earnings Banner */}
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center space-y-2">
                    <p className="text-sm opacity-90">Total Earnings This Month</p>
                    <div className="flex items-center justify-center gap-1">
                        <IndianRupee className="h-8 w-8" />
                        <span className="text-4xl font-bold">
                            {(earnings.totalEarnings || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm opacity-80 pt-2">
                        <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {earnings.totalDeliveries || 0} deliveries
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {earnings.currentMonth || ''}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Order History grouped by date */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Delivery History</h2>

                {Object.keys(groupedOrders).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p>No completed deliveries yet.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                            <div key={date}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{date}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {dateOrders.length} {dateOrders.length === 1 ? 'order' : 'orders'}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {dateOrders.map((order: any) => (
                                        <Card key={order.id} className="overflow-hidden">
                                            <CardContent className="p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm font-medium">{order.orderNumber}</span>
                                                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                                                            <TrendingUp className="h-3 w-3" />
                                                            ₹{(order.deliveryEarningsCalculated || 0).toLocaleString('en-IN')}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            ₹{parseFloat(order.totalAmount || '0').toLocaleString('en-IN')} order
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
