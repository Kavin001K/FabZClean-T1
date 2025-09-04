import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusColor } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import type { Order } from "@shared/schema";

export default function RecentOrders() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data) => data?.slice(0, 4) || [], // Show only 4 most recent orders
  });

  if (isLoading) {
    return (
      <Card className="bento-card" data-testid="recent-orders">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display font-semibold text-lg text-foreground">
              Recent Orders
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div>
                    <div className="w-24 h-4 bg-muted rounded"></div>
                    <div className="w-20 h-3 bg-muted rounded mt-1"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 h-4 bg-muted rounded"></div>
                  <div className="w-12 h-5 bg-muted rounded mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bento-card" data-testid="recent-orders">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display font-semibold text-lg text-foreground">
            Recent Orders
          </CardTitle>
          <Button variant="link" size="sm" data-testid="view-all-orders">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders?.map((order) => (
            <div 
              key={order.id} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              data-testid={`order-${order.orderNumber}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-medium">
                    {order.customerName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm text-foreground">
                  {formatCurrency(parseFloat(order.totalAmount))}
                </p>
                <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
