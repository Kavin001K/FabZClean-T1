# useRealtime Hook & formatData Utility Guide

## Overview

This guide explains how to use the `useRealtime` hook and `formatData` utility to build robust, realtime data-driven components in your React app.

## Features

✅ **Realtime Updates**: Automatically syncs with Supabase database changes  
✅ **Optimistic UI**: Updates immediately without full re-fetch  
✅ **Type Safe**: Full TypeScript support  
✅ **Crash Proof**: Always returns arrays, never null/undefined  
✅ **Clean Display**: FormatData utility handles missing values gracefully  

---

## 1. useRealtime Hook

### Basic Usage

```tsx
import { useRealtime } from '@/hooks/use-realtime';

function MyComponent() {
  // ✅ Hook MUST be called at top level (Rules of Hooks)
  const { data, isLoading, error } = useRealtime({
    tableName: 'orders',
    selectQuery: '*', // Optional, defaults to '*'
  });

  // ✅ All hooks called before conditional returns
  if (isLoading) return <Loader />;
  if (error) return <Error message={error.message} />;

  // ✅ Data is always an array - safe to use .slice(), .map(), etc.
  return (
    <div>
      {data.slice(0, 10).map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tableName` | `string` | ✅ Yes | - | Supabase table name |
| `selectQuery` | `string` | ❌ No | `'*'` | SQL select query (e.g., `'id, name, email'`) |
| `filter` | `string` | ❌ No | - | Filter format: `'column.operator.value'` |
| `orderBy` | `string` | ❌ No | - | Order format: `'column.direction'` (e.g., `'createdAt.desc'`) |
| `limit` | `number` | ❌ No | - | Maximum number of rows to fetch |

### Filter Examples

```tsx
// Equal to
filter: 'status.eq.completed'

// Greater than
filter: 'totalAmount.gt.1000'

// Less than
filter: 'createdAt.lt.2024-01-01'

// Not equal
filter: 'role.neq.admin'

// Like (contains)
filter: 'name.like.%John%'
```

### Order By Examples

```tsx
// Ascending
orderBy: 'createdAt.asc'

// Descending
orderBy: 'createdAt.desc'
```

### Return Values

```tsx
{
  data: T[];        // Always an array (never null/undefined)
  isLoading: boolean;
  error: Error | null;
}
```

---

## 2. formatData Utility

### Basic Usage

```tsx
import { formatData, formatCurrency, formatText, formatNumber } from '@/lib/format-data';

// Smart formatter (auto-detects type)
formatData(value, 'currency') // Returns "₹0" if null

// Specific formatters
formatCurrency(1000)        // "₹1,000"
formatText(null)            // "Nill"
formatNumber(1234.56)        // "1,234.56"
formatStatus(undefined)     // "NI"
formatDate(new Date())      // "25 Oct 2024"
formatPercentage(85.5)      // "85.5%"
```

### Available Formatters

| Function | Input | Output (if null/undefined) | Example |
|----------|-------|----------------------------|---------|
| `formatText()` | `string \| null \| undefined` | `"Nill"` | `formatText("John")` → `"John"` |
| `formatNumber()` | `number \| string \| null` | `"0"` | `formatNumber(1234)` → `"1,234"` |
| `formatCurrency()` | `number \| string \| null` | `"₹0"` | `formatCurrency(1000)` → `"₹1,000"` |
| `formatStatus()` | `string \| null \| undefined` | `"NI"` | `formatStatus("active")` → `"active"` |
| `formatDate()` | `Date \| string \| null` | `"Nill"` | `formatDate(new Date())` → `"25 Oct 2024"` |
| `formatDateTime()` | `Date \| string \| null` | `"Nill"` | `formatDateTime(date)` → `"25 Oct 2024, 10:30 AM"` |
| `formatPercentage()` | `number \| string \| null` | `"0%"` | `formatPercentage(85.5)` → `"85.5%"` |

---

## 3. Complete Example: Dashboard with Recent Orders & Revenue

```tsx
import React from 'react';
import { useRealtime } from '@/hooks/use-realtime';
import { formatData } from '@/lib/format-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  // ✅ Recent Orders - Hook called at top level
  const { 
    data: recentOrders, 
    isLoading: ordersLoading, 
    error: ordersError 
  } = useRealtime<Order>({
    tableName: 'orders',
    selectQuery: 'id, orderNumber, customerName, totalAmount, status, createdAt',
    orderBy: 'createdAt.desc',
    limit: 10,
  });

  // ✅ Revenue Calculation - Hook called at top level
  const { 
    data: allOrders, 
    isLoading: revenueLoading 
  } = useRealtime<Order>({
    tableName: 'orders',
    selectQuery: 'id, totalAmount, status',
    filter: 'status.eq.completed',
  });

  // ✅ Calculate revenue (useMemo for performance)
  const totalRevenue = React.useMemo(() => {
    if (!Array.isArray(allOrders)) return 0;
    
    return allOrders.reduce((sum, order) => {
      const amount = typeof order.totalAmount === 'number' 
        ? order.totalAmount 
        : parseFloat(String(order.totalAmount || 0));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [allOrders]);

  // ✅ All hooks called before conditional returns
  if (ordersLoading || revenueLoading) {
    return <div>Loading...</div>;
  }

  if (ordersError) {
    return <div>Error: {ordersError.message}</div>;
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Revenue Card */}
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatData(totalRevenue, 'currency')}
          </div>
          <div className="text-sm text-muted-foreground">
            From {formatData(allOrders.length, 'number')} completed orders
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between">
                  <div>
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
    </div>
  );
}
```

---

## 4. How It Works (The Algorithm)

### Initial Fetch
1. Component mounts → Hook fetches initial data from Supabase
2. Data is stored in state as an array (always safe)

### Realtime Subscription
1. Hook creates a Supabase channel for the table
2. Listens for `INSERT`, `UPDATE`, `DELETE` events
3. Updates local state optimistically (no re-fetch needed)

### Merge Algorithm

**INSERT Event:**
```tsx
// New item added to database
setData([...currentData, newItem]);
```

**UPDATE Event:**
```tsx
// Item updated in database
setData(currentData.map(item => 
  item.id === updatedItem.id ? updatedItem : item
));
```

**DELETE Event:**
```tsx
// Item deleted from database
setData(currentData.filter(item => item.id !== deletedId));
```

### Cleanup
- When component unmounts, subscription is automatically removed
- Prevents memory leaks

---

## 5. Safety Features

### ✅ Always Returns Array
```tsx
// ❌ Before (could crash)
const data = await fetchOrders();
data.slice(0, 5); // Error if data is null!

// ✅ After (always safe)
const { data } = useRealtime({ tableName: 'orders' });
data.slice(0, 5); // Always works - data is always an array
```

### ✅ Handles Missing Values
```tsx
// ❌ Before (shows blank/undefined)
<div>{order.customerName}</div> // Shows nothing if null

// ✅ After (shows "Nill")
<div>{formatData(order.customerName, 'text')}</div> // Shows "Nill"
```

---

## 6. Rules of Hooks Compliance

✅ **DO:**
```tsx
function Component() {
  // ✅ All hooks at top level
  const { data } = useRealtime({ tableName: 'orders' });
  const [state, setState] = useState();
  
  // ✅ Conditional returns AFTER hooks
  if (loading) return <Loader />;
  
  return <div>{data.map(...)}</div>;
}
```

❌ **DON'T:**
```tsx
function Component() {
  if (loading) return <Loader />; // ❌ Early return
  
  const { data } = useRealtime({ tableName: 'orders' }); // ❌ Hook after return
}
```

---

## 7. Environment Setup

Make sure you have Supabase credentials in your `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 8. Troubleshooting

### Hook not updating?
- Check Supabase Realtime is enabled for your table
- Verify table name matches exactly
- Check browser console for subscription errors

### Data is null/undefined?
- The hook always returns an array, but check your `selectQuery`
- Verify table has data
- Check Supabase permissions (RLS policies)

### Formatting not working?
- Ensure you're using `formatData()` for all display values
- Check the type parameter matches your data type

---

## Summary

✅ Use `useRealtime` for any table that needs realtime updates  
✅ Always call hooks at the top level (before any returns)  
✅ Use `formatData` for all display values to prevent blank UI  
✅ Data is always an array - safe to use `.slice()`, `.map()`, etc.  
✅ Realtime updates happen automatically - no manual refresh needed  

Happy coding! 🚀

