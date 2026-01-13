import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/data-service";
import type { Order } from "@shared/schema";

export interface OrdersKPIProps {
  orders: Order[];
  className?: string;
}

export default React.memo(function OrdersKPI({ orders, className }: OrdersKPIProps) {
  const kpiData = React.useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate percentage changes (mock data for demo)
    const totalOrdersChange = 12.5;
    const pendingOrdersChange = -2.1;
    const completedOrdersChange = 8.2;
    const revenueChange = 15.3;

    return [
      {
        title: "Total Orders",
        value: totalOrders.toString(),
        change: `${totalOrdersChange > 0 ? '+' : ''}${totalOrdersChange}%`,
        changeType: totalOrdersChange > 0 ? "positive" : "negative",
        icon: <Package className="h-4 w-4" />,
        description: "Total number of orders",
      },
      {
        title: "Pending Orders",
        value: pendingOrders.toString(),
        change: `${pendingOrdersChange > 0 ? '+' : ''}${pendingOrdersChange}%`,
        changeType: pendingOrdersChange > 0 ? "positive" : "negative",
        icon: <Clock className="h-4 w-4" />,
        description: "Orders awaiting processing",
      },
      {
        title: "Completed Orders",
        value: completedOrders.toString(),
        change: `${completedOrdersChange > 0 ? '+' : ''}${completedOrdersChange}%`,
        changeType: completedOrdersChange > 0 ? "positive" : "negative",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Successfully completed orders",
      },
      {
        title: "Average Order Value",
        value: formatCurrency(averageOrderValue),
        change: `${revenueChange > 0 ? '+' : ''}${revenueChange}%`,
        changeType: revenueChange > 0 ? "positive" : "negative",
        icon: <TrendingUp className="h-4 w-4" />,
        description: "Average value per order",
      },
    ];
  }, [orders]);

  return (
    <div className={`grid gap-4 grid-cols-4 ${className || ''}`}>
      {kpiData.map((kpi, index) => (
        <Card key={kpi.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className="text-muted-foreground">
              {kpi.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center space-x-1 text-xs">
              {kpi.changeType === "positive" ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={kpi.changeType === "positive" ? "text-green-600" : "text-red-600"}>
                {kpi.change} from last month
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
