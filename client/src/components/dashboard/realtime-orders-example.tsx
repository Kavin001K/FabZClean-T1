/**
 * Example component showing how to use useRealtime hook
 * This demonstrates fetching "Recent Orders" and "Revenue" with realtime updates
 */

import React from 'react';
import { useRealtime } from '@/hooks/use-realtime';
import { formatData } from '@/lib/format-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

/**
 * Example: Recent Orders with Realtime Updates
 * 
 * This component automatically:
 * 1. Fetches initial orders from Supabase
 * 2. Subscribes to realtime changes (INSERT, UPDATE, DELETE)
 * 3. Updates the UI optimistically without re-fetching
 */
export function RealtimeRecentOrders() {
  // ✅ Hook called at top level (no conditional hooks)
  const { data: orders, isLoading, error } = useRealtime<Order>({
    tableName: 'orders',
    selectQuery: 'id, orderNumber, customerName, totalAmount, status, createdAt',
    orderBy: 'createdAt.desc', // Most recent first
    limit: 10, // Show only 10 most recent
  });

  // ✅ All hooks must be called before any conditional returns
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            Error: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ Data is always an array (never null/undefined)
  // Safe to use .slice(), .map(), etc.
  const displayOrders = orders.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders (Realtime)</CardTitle>
      </CardHeader>
      <CardContent>
        {displayOrders.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No orders yet
          </div>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {formatData(order.orderNumber, 'text')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatData(order.customerName, 'text')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatData(order.totalAmount, 'currency')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatData(order.status, 'status')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Example: Revenue Calculation with Realtime Updates
 * 
 * This component calculates total revenue from orders
 * and updates automatically when orders change
 */
export function RealtimeRevenue() {
  // ✅ Hook called at top level
  const { data: orders, isLoading, error } = useRealtime<Order>({
    tableName: 'orders',
    selectQuery: 'id, totalAmount, status',
    filter: 'status.eq.completed', // Only count completed orders
  });

  // ✅ Calculate revenue from orders
  const totalRevenue = React.useMemo(() => {
    if (!Array.isArray(orders)) return 0;
    
    return orders.reduce((sum, order) => {
      const amount = typeof order.totalAmount === 'number' 
        ? order.totalAmount 
        : parseFloat(String(order.totalAmount || 0));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [orders]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            Error: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Revenue (Realtime)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {formatData(totalRevenue, 'currency')}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          From {formatData(orders.length, 'number')} completed orders
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example: How to use both components together in Dashboard
 * 
 * Usage in Dashboard.tsx or any component:
 * 
 * ```tsx
 * import { RealtimeRecentOrders, RealtimeRevenue } from '@/components/dashboard/realtime-orders-example';
 * 
 * export default function Dashboard() {
 *   return (
 *     <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
 *       <RealtimeRevenue />
 *       <RealtimeRecentOrders />
 *     </div>
 *   );
 * }
 * ```
 */

