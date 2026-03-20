import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, TrendingUp, IndianRupee, Package, Calendar, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = 'today' | 'this_month' | 'all_time';

export default function DeliveryHistory() {
    const { employee } = useAuth();
    const [filter, setFilter] = useState<FilterType>('today');

    const { data: response, isLoading } = useQuery({
        queryKey: ['deliveries', 'me', 'history'],
    });

    const orders = useMemo(() => {
        return (response as any)?.data?.orders || [];
    }, [response]);

    // Derived State Computations
    const { filteredOrders, groupedOrders, metrics } = useMemo(() => {
        const now = new Date();
        const todayStr = now.toLocaleDateString();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // 1. Filter Orders
        const filtered = orders.filter((order: any) => {
            const deliveredDate = new Date(order.deliveredAt || order.updatedAt || 0);
            if (filter === 'today') {
                return deliveredDate.toLocaleDateString() === todayStr;
            } else if (filter === 'this_month') {
                const orderMonth = `${deliveredDate.getFullYear()}-${String(deliveredDate.getMonth() + 1).padStart(2, '0')}`;
                return orderMonth === currentMonthKey;
            }
            return true; // all_time
        });

        // 2. Metrics Calculation
        let earnings = 0;
        let cashCollected = 0;

        filtered.forEach((order: any) => {
            earnings += (order.deliveryEarningsCalculated || 0);
            cashCollected += parseFloat(order.deliveryCashCollected || '0');
        });

        // 3. Group by Date for display
        const grouped: Record<string, any[]> = {};
        for (const order of filtered) {
            const date = new Date(order.deliveredAt || order.updatedAt || 0).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
            });
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(order);
        }

        return {
            filteredOrders: filtered,
            groupedOrders: grouped,
            metrics: { earnings, cashCollected, count: filtered.length }
        };
    }, [orders, filter]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto space-y-5 pb-24">
            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(val) => setFilter(val as FilterType)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="this_month">This Month</TabsTrigger>
                    <TabsTrigger value="all_time">All Time</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 gap-3">
                {/* Cash Collected Card */}
                <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-md">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 opacity-90 text-[11px] font-semibold uppercase tracking-wider mb-1">
                            <Wallet className="w-3.5 h-3.5" />
                            Cash Collected
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-xl font-medium">₹</span>
                            <span className="text-3xl font-bold leading-none">
                                {metrics.cashCollected.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <p className="text-[10px] opacity-80 pt-1">
                            Handover to cashier
                        </p>
                    </CardContent>
                </Card>

                {/* Earnings Card */}
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 shadow-md">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 opacity-90 text-[11px] font-semibold uppercase tracking-wider mb-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Earnings
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-xl font-medium">₹</span>
                            <span className="text-3xl font-bold leading-none">
                                {metrics.earnings.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <p className="text-[10px] opacity-80 pt-1 flex items-center gap-1">
                            <Package className="w-3 h-3" /> {metrics.count} total deliveries
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Order History */}
            <div>
                {Object.keys(groupedOrders).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-medium">No completed deliveries found.</p>
                        <p className="text-xs mt-1">Change your filter to see more history.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                            <div key={date}>
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{date}</span>
                                    <Badge variant="secondary" className="text-[10px]">
                                        {dateOrders.length} {dateOrders.length === 1 ? 'order' : 'orders'}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {dateOrders.map((order: any) => {
                                        const orderAmount = parseFloat(order.totalAmount || '0');
                                        const cashCollected = parseFloat(order.deliveryCashCollected || '0');
                                        const collectedCash = cashCollected > 0;

                                        return (
                                            <Card key={order.id} className="overflow-hidden shadow-sm border-slate-200">
                                                <CardContent className="p-3.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1 border-r pr-3 border-slate-100 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-slate-800">{order.orderNumber}</span>
                                                                {collectedCash && (
                                                                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0 text-[9px] px-1 py-0 h-4 uppercase">
                                                                        Cash COD
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-medium truncate pr-2">{order.customerName}</p>
                                                        </div>

                                                        <div className="text-right pl-3 space-y-1">
                                                            <div className="flex items-center justify-end gap-1 text-emerald-600 font-black text-sm">
                                                                + ₹{(order.deliveryEarningsCalculated || 0).toLocaleString('en-IN')}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-medium">
                                                                Order: ₹{orderAmount.toLocaleString('en-IN')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
