# Print System Integration Guide

This guide provides ready-to-use code snippets for integrating print functionality into each page of the FabzClean application.

## Table of Contents

1. [Orders Page Integration](#orders-page-integration)
2. [Order Details Integration](#order-details-integration)
3. [Customers Page Integration](#customers-page-integration)
4. [Services Page Integration](#services-page-integration)
5. [Inventory Page Integration](#inventory-page-integration)
6. [Accounting Pages Integration](#accounting-pages-integration)
7. [Logistics Page Integration](#logistics-page-integration)
8. [Dashboard Integration](#dashboard-integration)
9. [Analytics Page Integration](#analytics-page-integration)

---

## Orders Page Integration

### Location: `/client/src/pages/orders.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function OrdersPage() {
  const { data: orders } = useQuery({ queryKey: ['/api/orders'] });
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);

  const {
    printOrderList,
    printOrderInvoice,
    printOrderReceipt,
    isPrinting
  } = usePrintService();

  return (
    <div>
      {/* Toolbar with Print Options */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Orders</h1>

        <div className="flex gap-2">
          {/* Print All Orders */}
          <Button
            variant="outline"
            onClick={() => printOrderList(orders || [])}
            disabled={isPrinting || !orders?.length}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print All Orders
          </Button>

          {/* Print Selected Orders */}
          {selectedOrders.length > 0 && (
            <Button
              variant="outline"
              onClick={() => printOrderList(selectedOrders)}
              disabled={isPrinting}
            >
              <FileText className="h-4 w-4 mr-2" />
              Print Selected ({selectedOrders.length})
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        data={orders || []}
        columns={[
          // ... existing columns ...
          {
            id: 'actions',
            cell: ({ row }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => printOrderInvoice(row.original)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => printOrderReceipt(row.original)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print Receipt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
        onSelectionChange={setSelectedOrders}
      />
    </div>
  );
}
```

---

## Order Details Integration

### Location: `/client/src/pages/order-detail.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer, Receipt } from 'lucide-react';

function OrderDetailPage() {
  const { orderId } = useParams();
  const { data: order } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
  });

  const {
    printOrderInvoice,
    printOrderReceipt,
    printOrderDetails,
    isPrinting
  } = usePrintService();

  return (
    <div>
      {/* Header with Print Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order #{order?.orderNumber}</h1>
          <p className="text-muted-foreground">
            {order?.customerName} • {new Date(order?.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => printOrderDetails(order)}
            disabled={isPrinting || !order}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Details
          </Button>

          <Button
            onClick={() => printOrderInvoice(order)}
            disabled={isPrinting || !order}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>

          <Button
            variant="outline"
            onClick={() => printOrderReceipt(order)}
            disabled={isPrinting || !order}
          >
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Order Details */}
      {/* ... existing content ... */}
    </div>
  );
}
```

---

## Customers Page Integration

### Location: `/client/src/pages/customers.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer, Users } from 'lucide-react';

function CustomersPage() {
  const { data: customers } = useQuery({ queryKey: ['/api/customers'] });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const {
    printCustomerList,
    printCustomerDetails,
    isPrinting
  } = usePrintService();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>

        <Button
          variant="outline"
          onClick={() => printCustomerList(customers || [])}
          disabled={isPrinting || !customers?.length}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Customer List
        </Button>
      </div>

      {/* Customers Table */}
      <DataTable
        data={customers || []}
        columns={[
          // ... existing columns ...
          {
            id: 'actions',
            cell: ({ row }) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => printCustomerDetails(row.original)}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            ),
          },
        ]}
      />

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCustomer.name}</DialogTitle>
            </DialogHeader>

            {/* Customer details content */}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => printCustomerDetails(selectedCustomer)}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

---

## Services Page Integration

### Location: `/client/src/pages/services.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer, TrendingUp } from 'lucide-react';

function ServicesPage() {
  const { data: services } = useQuery({ queryKey: ['/api/services'] });

  const {
    printServiceCatalog,
    printServicePerformance,
    isPrinting
  } = usePrintService();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Services</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => printServiceCatalog(services || [])}
            disabled={isPrinting || !services?.length}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Catalog
          </Button>

          <Button
            variant="outline"
            onClick={() => printServicePerformance(services || [])}
            disabled={isPrinting || !services?.length}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Print Performance
          </Button>
        </div>
      </div>

      {/* Services Grid/List */}
      {/* ... existing content ... */}
    </div>
  );
}
```

---

## Inventory Page Integration

### Location: `/client/src/pages/inventory.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer, History } from 'lucide-react';

function InventoryPage() {
  const { data: inventory } = useQuery({ queryKey: ['/api/inventory'] });
  const { data: movements } = useQuery({ queryKey: ['/api/inventory/movements'] });

  const {
    printInventoryReport,
    printStockMovement,
    isPrinting
  } = usePrintService();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => printInventoryReport(inventory || [])}
            disabled={isPrinting || !inventory?.length}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Inventory
          </Button>

          <Button
            variant="outline"
            onClick={() => printStockMovement(movements || [])}
            disabled={isPrinting || !movements?.length}
          >
            <History className="h-4 w-4 mr-2" />
            Print Movements
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      {/* ... existing content ... */}
    </div>
  );
}
```

---

## Accounting Pages Integration

### Location: `/client/src/pages/accounting.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer, DollarSign, TrendingUp } from 'lucide-react';

function AccountingPage() {
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });

  const { data: financialData } = useQuery({
    queryKey: ['/api/accounting/financial-statement', dateRange],
  });

  const { data: plData } = useQuery({
    queryKey: ['/api/accounting/profit-loss', dateRange],
  });

  const { data: balanceSheet } = useQuery({
    queryKey: ['/api/accounting/balance-sheet'],
  });

  const {
    printFinancialStatement,
    printProfitLossStatement,
    printBalanceSheet,
    isPrinting
  } = usePrintService();

  return (
    <div>
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">Financial Statement</TabsTrigger>
          <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Financial Statement</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => printFinancialStatement(financialData)}
                  disabled={isPrinting || !financialData}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Statement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Financial statement content */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profit & Loss Statement</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => printProfitLossStatement(plData)}
                  disabled={isPrinting || !plData}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Print P&L
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* P&L content */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Balance Sheet</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => printBalanceSheet(balanceSheet)}
                  disabled={isPrinting || !balanceSheet}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Print Balance Sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Balance sheet content */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Logistics Page Integration

### Location: `/client/src/pages/logistics.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer, MapPin } from 'lucide-react';

function LogisticsPage() {
  const { data: shipments } = useQuery({ queryKey: ['/api/shipments'] });
  const [selectedRoute, setSelectedRoute] = useState<any>(null);

  const {
    printShipmentManifest,
    printDeliveryRoute,
    isPrinting
  } = usePrintService();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Logistics & Delivery</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => printShipmentManifest(shipments || [])}
            disabled={isPrinting || !shipments?.length}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Manifest
          </Button>

          {selectedRoute && (
            <Button
              variant="outline"
              onClick={() => printDeliveryRoute(selectedRoute)}
              disabled={isPrinting}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Print Route
            </Button>
          )}
        </div>
      </div>

      {/* Shipments and Routes */}
      {/* ... existing content ... */}
    </div>
  );
}
```

---

## Dashboard Integration

### Location: `/client/src/pages/dashboard.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer } from 'lucide-react';

function DashboardPage() {
  const { data: metrics } = useQuery({ queryKey: ['/api/dashboard/metrics'] });

  const { printDashboardSummary, isPrinting } = usePrintService();

  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <Button
          variant="outline"
          onClick={() => printDashboardSummary(metrics)}
          disabled={isPrinting || !metrics}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Summary
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ... KPI cards ... */}
      </div>

      {/* Charts and Graphs */}
      {/* ... existing content ... */}
    </div>
  );
}
```

---

## Analytics Page Integration

### Location: `/client/src/pages/analytics.tsx`

```typescript
import { usePrintService } from '@/hooks/use-print-service';
import { Printer, Download } from 'lucide-react';
import { enhancedPrint } from '@/lib/enhanced-print-templates';

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['/api/analytics', dateRange],
  });

  const { isPrinting } = usePrintService();

  const handlePrintAnalytics = () => {
    // Custom enhanced print for analytics
    enhancedPrint({
      title: 'Analytics Report',
      subtitle: `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`,
      documentType: 'report',
      data: analyticsData?.details || [],
      stats: [
        {
          label: 'Total Revenue',
          value: `₹${analyticsData?.totalRevenue || 0}`,
          icon: '💰',
        },
        {
          label: 'Total Orders',
          value: analyticsData?.totalOrders || 0,
          icon: '📦',
        },
        {
          label: 'Growth Rate',
          value: `${analyticsData?.growthRate || 0}%`,
          icon: '📈',
        },
        {
          label: 'Customer Satisfaction',
          value: `${analyticsData?.satisfaction || 0}%`,
          icon: '⭐',
        },
      ],
      watermark: 'CONFIDENTIAL',
      showCompanyInfo: true,
      showPrintDate: true,
      showPageNumbers: true,
    });
  };

  return (
    <div>
      {/* Analytics Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrintAnalytics}
            disabled={isPrinting || !analyticsData}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Analytics Charts and Data */}
      {/* ... existing content ... */}
    </div>
  );
}
```

---

## Common Patterns

### 1. Print with Loading State

```typescript
const { printOrderInvoice, isPrinting } = usePrintService();

<Button
  onClick={() => printOrderInvoice(order)}
  disabled={isPrinting}
>
  {isPrinting ? 'Printing...' : 'Print Invoice'}
</Button>
```

### 2. Print with Confirmation Dialog

```typescript
const [showConfirm, setShowConfirm] = useState(false);
const { printOrderInvoice } = usePrintService();

const handlePrint = async () => {
  setShowConfirm(false);
  await printOrderInvoice(order);
};

<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogTrigger asChild>
    <Button>Print Invoice</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirm Print</AlertDialogTitle>
      <AlertDialogDescription>
        This will print the invoice for order #{order.orderNumber}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handlePrint}>Print</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3. Print with Custom Success Handler

```typescript
const { printCustomerList } = usePrintService({
  onSuccess: (type, data) => {
    console.log(`Successfully printed ${type}`);
    // Track analytics
    trackEvent('print_success', { type, itemCount: data.length });
  },
  onError: (error, type) => {
    console.error(`Failed to print ${type}:`, error);
    // Track analytics
    trackEvent('print_error', { type, error: error.message });
  },
});
```

### 4. Conditional Print Options

```typescript
const { printOrderInvoice, printOrderReceipt } = usePrintService();

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Printer className="h-4 w-4 mr-2" />
      Print Options
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => printOrderInvoice(order)}>
      Print Invoice (A4)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => printOrderReceipt(order)}>
      Print Receipt (Thermal)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Best Practices

1. **Always check for data before printing:**
   ```typescript
   disabled={isPrinting || !data?.length}
   ```

2. **Show loading state during print:**
   ```typescript
   {isPrinting ? 'Printing...' : 'Print Document'}
   ```

3. **Handle errors gracefully:**
   ```typescript
   const { printOrderInvoice } = usePrintService({
     autoToast: true, // Shows error toast automatically
     onError: (error) => {
       // Additional error handling
     },
   });
   ```

4. **Use appropriate icons:**
   ```typescript
   import { Printer, FileText, Receipt, Download } from 'lucide-react';
   ```

5. **Group related print actions:**
   ```typescript
   <div className="flex gap-2">
     <Button onClick={printAction1}>Print Report</Button>
     <Button onClick={printAction2}>Print Summary</Button>
   </div>
   ```

---

## Testing Checklist

When integrating print functionality:

- [ ] Print button is visible and accessible
- [ ] Loading state shows during print operation
- [ ] Error messages display on failure
- [ ] Success message shows on completion
- [ ] Print preview opens correctly
- [ ] Company information appears correctly
- [ ] Data formats correctly in print template
- [ ] Page breaks work properly for long documents
- [ ] Headers and footers display on all pages
- [ ] Print settings are respected
- [ ] Browser compatibility verified

---

## Support

For integration help or issues:
1. Review the [Print System Documentation](./PRINT_SYSTEM_DOCUMENTATION.md)
2. Check existing implementations in other pages
3. Verify data structure matches expected format
4. Test with different browsers
5. Check console for errors

---

## Summary

This integration guide provides ready-to-use code for adding print functionality to all major pages in the FabzClean application. Each example follows best practices and includes:

- Proper import statements
- Hook usage with error handling
- UI components with loading states
- Contextual print options
- Responsive button placement

Simply copy the relevant code snippet, adjust for your specific data structure, and integrate into your page component.
