import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Package, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/data-service";
import { cn } from "@/lib/utils";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/data-service";

interface DashboardReadyOrdersProps {
  franchiseId?: string;
  className?: string;
}

export default function DashboardReadyOrders({ franchiseId, className }: DashboardReadyOrdersProps) {
  // Fetch all orders and filter client-side for now, or use a specific API if available
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['ready-orders', franchiseId],
    queryFn: () => ordersApi.getAll(), // Ideally filter by status 'ready' via API
    enabled: !!franchiseId
  });

  const readyOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    // Filter for orders that are 'ready', 'processed', or 'ready_for_pickup'
    return orders.filter((order: any) =>
      ['ready', 'ready_for_pickup', 'processed'].includes(order.status?.toLowerCase()) ||
      (order.status === 'processing' && order.progress === 100) // Hypothetical
    ).slice(0, 5);
  }, [orders]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ready for Pickup/Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton.TableSkeleton rows={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Ready Orders
        </CardTitle>
        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
          {readyOrders.length} Ready
        </Badge>
      </CardHeader>
      <CardContent>
        {readyOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
            <Package className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No orders ready</p>
            <p className="text-xs">Orders marked as ready will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {readyOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">#{order.orderNumber}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-200 text-green-700 bg-green-50">
                      Paid
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-medium block">{formatCurrency(order.totalAmount || order.total)}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-2 border-t text-center">
          <Link href="/orders?status=ready">
            <Button variant="link" size="sm" className="text-xs text-muted-foreground h-auto p-0">
              View all ready orders
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
