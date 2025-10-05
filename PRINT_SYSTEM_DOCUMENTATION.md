# Comprehensive Print Driver System Documentation

## Overview

A complete, production-ready print management system for the FabzClean application. This system provides professional printing capabilities for all major document types including invoices, receipts, reports, financial statements, inventory lists, and more.

## Architecture

### Core Components

1. **Print Driver** (`/client/src/lib/print-driver.ts`)
   - Low-level PDF generation using jsPDF and html2canvas
   - Template management system
   - Support for barcodes, QR codes, labels, and invoices
   - Professional invoice and report generation

2. **Print Service** (`/client/src/lib/print-service.ts`) ⭐ NEW
   - High-level print API for all application pages
   - Browser-based printing (window.print())
   - Centralized settings management
   - Company information configuration

3. **Print Templates** (`/client/src/lib/print-templates.ts`)
   - HTML-based print templates
   - Professional styling with brand colors
   - Responsive and print-optimized layouts

4. **Enhanced Print Templates** (`/client/src/lib/enhanced-print-templates.ts`) ⭐ NEW
   - Advanced templates with modern design
   - Support for statistics, badges, and custom layouts
   - Watermark support
   - Enhanced typography and spacing

### React Hooks

1. **usePrint** (`/client/src/hooks/use-print.tsx`)
   - Generic print hook for barcode, labels, invoices
   - Error handling and loading states
   - Toast notifications

2. **useInvoicePrint** (`/client/src/hooks/use-invoice-print.tsx`)
   - Specialized hook for invoice printing
   - Order-to-invoice conversion
   - Template selection

3. **usePrintService** (`/client/src/hooks/use-print-service.tsx`) ⭐ NEW
   - Comprehensive hook for all print operations
   - Page-specific print functions
   - Settings management

### UI Components

1. **InvoicePreview** (`/client/src/components/print/invoice-preview.tsx`)
   - Visual invoice preview before printing
   - Download and print actions

2. **PrintConfiguration** (`/client/src/components/print/print-configuration.tsx`) ⭐ NEW
   - Settings panel for print preferences
   - Company information editor
   - Template management UI

## Features

### 1. Print Utility Service ✅

**Location:** `/client/src/lib/print-service.ts`

**Features:**
- Generic print function accepting data and template type
- Support for different print templates
- Print preview functionality
- Print settings (margins, orientation, page size)
- Custom CSS for print media
- Browser-based printing with window.print()
- PDF generation with jsPDF
- Settings persistence in localStorage

**Usage Example:**
```typescript
import PrintService from '@/lib/print-service';

// Print order invoice
await PrintService.printOrderInvoice(order);

// Print customer list
PrintService.printCustomerList(customers);

// Print inventory report
PrintService.printInventoryReport(inventory);
```

### 2. Print Templates ✅

**Available Templates:**

#### Invoice/Receipt Template
- Professional invoice with company branding
- Itemized billing table
- Tax calculations
- Payment information
- Customer details
- Terms and conditions

#### Order Details Template
- Order summary with line items
- Customer information
- Payment status
- Service details

#### Customer Details Template
- Customer profile information
- Order history
- Lifetime value statistics
- Contact information

#### Customer List Template
- Sortable customer database
- Total orders and revenue per customer
- Last order date
- Active/inactive status

#### Service Catalog Template
- Complete service listing
- Pricing and duration
- Category grouping
- Service descriptions

#### Service Performance Template
- Revenue by service
- Order count statistics
- Average ratings
- Completion rates

#### Inventory Report Template
- Current stock levels
- Low stock alerts
- Inventory valuation
- Stock movement history

#### Financial Statement Templates
- Profit & Loss statement
- Balance sheet
- Transaction history
- Income vs expenses breakdown

#### Shipment Manifest Template
- Delivery route planning
- Tracking numbers
- Order consolidation
- Carrier information

### 3. Integration Points ✅

**Print buttons have been integrated in the following locations:**

#### Orders Page
```typescript
import { usePrintService } from '@/hooks/use-print-service';

const { printOrderInvoice, printOrderList } = usePrintService();

// Print single order invoice
<Button onClick={() => printOrderInvoice(order)}>
  Print Invoice
</Button>

// Print all orders
<Button onClick={() => printOrderList(orders)}>
  Print Order List
</Button>
```

#### Customers Page
```typescript
// Print customer list
<Button onClick={() => printCustomerList(customers)}>
  Print Customer List
</Button>

// Print customer details
<Button onClick={() => printCustomerDetails(customer)}>
  Print Details
</Button>
```

#### Services Page
```typescript
// Print service catalog
<Button onClick={() => printServiceCatalog(services)}>
  Print Catalog
</Button>

// Print service performance
<Button onClick={() => printServicePerformance(services)}>
  Print Performance Report
</Button>
```

#### Inventory Page
```typescript
// Print inventory report
<Button onClick={() => printInventoryReport(inventory)}>
  Print Inventory Report
</Button>

// Print stock movements
<Button onClick={() => printStockMovement(movements)}>
  Print Stock History
</Button>
```

#### Accounting Pages
```typescript
// Print financial statements
<Button onClick={() => printFinancialStatement(data)}>
  Print Statement
</Button>

<Button onClick={() => printProfitLossStatement(data)}>
  Print P&L
</Button>

<Button onClick={() => printBalanceSheet(data)}>
  Print Balance Sheet
</Button>
```

#### Logistics Page
```typescript
// Print shipment manifest
<Button onClick={() => printShipmentManifest(shipments)}>
  Print Manifest
</Button>

// Print delivery route
<Button onClick={() => printDeliveryRoute(route)}>
  Print Route
</Button>
```

### 4. Print Features ✅

**Professional Formatting:**
- Company logo placeholder (configurable)
- Brand colors and typography
- Consistent spacing and margins
- Professional headers and footers

**Page Management:**
- Proper page breaks
- Avoid breaking tables/sections
- Headers repeat on each page
- Page numbers

**Metadata:**
- Print date and time
- Document ID
- Generated by information
- Page numbers (configurable)

**Paper Size Support:**
- A4 (210 x 297 mm)
- A5 (148 x 210 mm)
- Letter (8.5 x 11 in)
- Legal (8.5 x 14 in)

**Orientation:**
- Portrait
- Landscape

**Customization:**
- Configurable margins
- Show/hide header
- Show/hide footer
- Show/hide logo
- Color/grayscale printing
- Custom company information

### 5. Browser Print Dialog ✅

**Implementation:**
- Uses `window.print()` for native browser printing
- Custom CSS with `@media print` rules
- Hides non-printable elements (buttons, navigation)
- Print-specific styles automatically applied
- Supports print preview before printing

**CSS Features:**
```css
@media print {
  @page {
    size: A4;
    margin: 20mm;
  }

  .no-print {
    display: none !important;
  }

  .page-break {
    page-break-after: always;
  }
}
```

## Usage Guide

### Basic Usage

```typescript
import { usePrintService } from '@/hooks/use-print-service';

function MyComponent() {
  const {
    printOrderInvoice,
    printCustomerList,
    isPrinting
  } = usePrintService();

  return (
    <Button
      onClick={() => printOrderInvoice(order)}
      disabled={isPrinting}
    >
      Print Invoice
    </Button>
  );
}
```

### Advanced Usage with Options

```typescript
import { usePrintService } from '@/hooks/use-print-service';

function MyComponent() {
  const { printOrderInvoice } = usePrintService({
    autoToast: true, // Show success/error toasts
    onSuccess: (type, data) => {
      console.log(`Printed ${type}`, data);
    },
    onError: (error, type) => {
      console.error(`Failed to print ${type}:`, error);
    },
  });

  return <Button onClick={() => printOrderInvoice(order)}>Print</Button>;
}
```

### Print Settings Management

```typescript
import PrintService from '@/lib/print-service';

// Get current settings
const settings = PrintService.getPrintSettings();

// Update settings
PrintService.savePrintSettings({
  pageSize: 'A4',
  orientation: 'landscape',
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  includeHeader: true,
  includeFooter: true,
  includeLogo: true,
  colorPrint: true,
});

// Get company info
const companyInfo = PrintService.getCompanyInfo();

// Update company info
PrintService.saveCompanyInfo({
  name: 'FabzClean Services',
  address: '123 Business Street',
  phone: '+1 (555) 123-4567',
  email: 'info@fabzclean.com',
});
```

### Using Enhanced Templates

```typescript
import { enhancedPrint } from '@/lib/enhanced-print-templates';

enhancedPrint({
  title: 'Monthly Sales Report',
  subtitle: 'January 2024',
  documentType: 'report',
  data: salesData,
  stats: [
    { label: 'Total Revenue', value: '$125,000', icon: '💰' },
    { label: 'Total Orders', value: '450', icon: '📦' },
    { label: 'New Customers', value: '85', icon: '👥' },
    { label: 'Growth Rate', value: '+12%', icon: '📈' },
  ],
  watermark: 'CONFIDENTIAL',
  showCompanyInfo: true,
  showPrintDate: true,
  showPageNumbers: true,
});
```

## Configuration UI

Access the print configuration panel at `/settings` (if integrated) or use the component directly:

```typescript
import PrintConfiguration from '@/components/print/print-configuration';

function SettingsPage() {
  return (
    <div>
      <PrintConfiguration />
    </div>
  );
}
```

**Configuration Options:**

1. **Print Settings Tab**
   - Page size selection
   - Orientation (portrait/landscape)
   - Margin adjustments (top, right, bottom, left)
   - Display options (header, footer, logo, color)

2. **Company Info Tab**
   - Company name
   - Address
   - Phone and email
   - Website (optional)
   - Tax ID (optional)
   - Logo URL (optional)

3. **Templates Tab**
   - Preview available templates
   - Template descriptions
   - Quick access to template types

## API Reference

### PrintService

**Methods:**

- `printOrderInvoice(order, settings?): Promise<void>` - Print order as invoice
- `printOrderReceipt(order, settings?): Promise<void>` - Print order as receipt
- `printOrderList(orders): void` - Print list of orders
- `printOrderDetails(order): void` - Print detailed order information
- `printCustomerList(customers): void` - Print customer database
- `printCustomerDetails(customer): void` - Print customer profile
- `printServiceCatalog(services): void` - Print service catalog
- `printServicePerformance(services): void` - Print service performance report
- `printInventoryReport(inventory): void` - Print inventory report
- `printStockMovement(movements): void` - Print stock movement history
- `printFinancialStatement(data): void` - Print financial statement
- `printProfitLossStatement(data): void` - Print P&L statement
- `printBalanceSheet(data): void` - Print balance sheet
- `printDashboardSummary(metrics): void` - Print dashboard metrics
- `printShipmentManifest(shipments): void` - Print shipment manifest
- `printDeliveryRoute(route): void` - Print delivery route plan
- `getPrintSettings(): PrintSettings` - Get current print settings
- `savePrintSettings(settings): void` - Save print settings
- `getCompanyInfo(): CompanyInfo` - Get company information
- `saveCompanyInfo(info): void` - Save company information

### usePrintService Hook

**Returns:**

```typescript
{
  isPrinting: boolean;
  printOrderInvoice: (order: any) => Promise<void>;
  printOrderReceipt: (order: any) => Promise<void>;
  printOrderList: (orders: any[]) => Promise<void>;
  printOrderDetails: (order: any) => Promise<void>;
  printCustomerList: (customers: any[]) => Promise<void>;
  printCustomerDetails: (customer: any) => Promise<void>;
  printServiceCatalog: (services: any[]) => Promise<void>;
  printServicePerformance: (services: any[]) => Promise<void>;
  printInventoryReport: (inventory: any[]) => Promise<void>;
  printStockMovement: (movements: any[]) => Promise<void>;
  printFinancialStatement: (data: any) => Promise<void>;
  printProfitLossStatement: (data: any) => Promise<void>;
  printBalanceSheet: (data: any) => Promise<void>;
  printDashboardSummary: (metrics: any) => Promise<void>;
  printShipmentManifest: (shipments: any[]) => Promise<void>;
  printDeliveryRoute: (route: any) => Promise<void>;
  getPrintSettings: () => PrintSettings;
  savePrintSettings: (settings: Partial<PrintSettings>) => void;
  getCompanyInfo: () => CompanyInfo;
  saveCompanyInfo: (info: Partial<CompanyInfo>) => void;
}
```

## File Structure

```
client/src/
├── lib/
│   ├── print-driver.ts              (Existing - PDF generation)
│   ├── print-templates.ts           (Existing - Basic HTML templates)
│   ├── print-service.ts             ⭐ NEW - High-level print API
│   └── enhanced-print-templates.ts  ⭐ NEW - Advanced templates
├── hooks/
│   ├── use-print.tsx                (Existing - Generic print hook)
│   ├── use-invoice-print.tsx        (Existing - Invoice hook)
│   └── use-print-service.tsx        ⭐ NEW - Comprehensive hook
└── components/
    └── print/
        ├── invoice-preview.tsx      (Existing - Invoice preview)
        ├── print-settings.tsx       (Existing)
        ├── print-manager.tsx        (Existing)
        └── print-configuration.tsx  ⭐ NEW - Settings UI
```

## Integration Checklist

To add print functionality to a new page:

1. Import the hook:
   ```typescript
   import { usePrintService } from '@/hooks/use-print-service';
   ```

2. Use the appropriate print function:
   ```typescript
   const { printOrderList, isPrinting } = usePrintService();
   ```

3. Add print button:
   ```typescript
   <Button
     onClick={() => printOrderList(data)}
     disabled={isPrinting}
   >
     <Printer className="h-4 w-4 mr-2" />
     Print Report
   </Button>
   ```

4. (Optional) Add custom success/error handling:
   ```typescript
   const { printOrderList } = usePrintService({
     onSuccess: () => console.log('Printed!'),
     onError: (error) => console.error(error),
   });
   ```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Limited (print dialog support varies)

## Performance Considerations

- Print generation is asynchronous (uses Promises)
- Large datasets may take time to render
- PDF generation uses client-side resources
- Consider pagination for very large reports (>1000 rows)

## Security

- Company information stored in localStorage
- No sensitive data sent to external services
- All processing done client-side
- Print settings are user-specific

## Future Enhancements

Potential improvements for the print system:

1. **Template Editor** - Visual template customization
2. **Batch Printing** - Print multiple documents at once
3. **Email Integration** - Send printed documents via email
4. **Cloud Storage** - Save PDFs to cloud storage
5. **Print Queue** - Manage multiple print jobs
6. **Custom Fonts** - Support for custom typography
7. **Multi-language** - Internationalization support
8. **Print Analytics** - Track print usage and costs
9. **Advanced Filters** - Filter data before printing
10. **Export Options** - CSV, Excel export alongside PDF

## Troubleshooting

**Issue: Pop-up blocked**
- Solution: User must allow pop-ups for the site

**Issue: Blank PDF generated**
- Solution: Check that data is properly formatted and not empty

**Issue: Styles not applied**
- Solution: Ensure print media queries are enabled in browser

**Issue: Print settings not persisting**
- Solution: Check localStorage is enabled and not full

**Issue: Company logo not showing**
- Solution: Verify logo URL is accessible and CORS-enabled

## Support

For questions or issues with the print system:
1. Check this documentation
2. Review example implementations in existing pages
3. Check browser console for errors
4. Verify print settings configuration

## Conclusion

The comprehensive print driver system provides a complete, production-ready solution for all printing needs in the FabzClean application. It supports multiple document types, professional templates, customizable settings, and seamless integration with all major application pages.

**Key Benefits:**
- Professional, branded output
- Consistent design across all documents
- Easy integration with existing pages
- Flexible configuration options
- Browser-native printing support
- PDF generation capabilities
- Responsive and print-optimized layouts

The system is designed to be maintainable, extensible, and user-friendly, providing a solid foundation for all document printing requirements.
