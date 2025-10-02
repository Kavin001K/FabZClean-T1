# Component Documentation

This document provides comprehensive documentation for all FabZClean components, including their purpose, usage, props, and examples.

## Table of Contents

1. [Dashboard Components](#dashboard-components)
2. [Layout Components](#layout-components)
3. [UI Components](#ui-components)
4. [Form Components](#form-components)
5. [Data Display Components](#data-display-components)

## Dashboard Components

### DashboardMetricsSection

**Purpose**: Displays key performance indicators (KPIs) in a responsive grid layout.

**Location**: `client/src/components/dashboard/dashboard-metrics-section.tsx`

**Props**:
```typescript
interface DashboardMetricsSectionProps {
  metrics: DashboardMetric[];
  isLoading?: boolean;
  className?: string;
  columns?: 2 | 3 | 4;
}
```

**Usage**:
```tsx
import { DashboardMetricsSection, createDefaultMetrics } from '@/components/dashboard/dashboard-metrics-section';

const metrics = createDefaultMetrics({
  totalRevenue: 12345,
  totalOrders: 123,
  totalCustomers: 456,
  averageOrderValue: 100.37
});

<DashboardMetricsSection 
  metrics={metrics}
  isLoading={false}
  columns={4}
  data-testid="dashboard-metrics"
/>
```

**Test IDs**:
- `dashboard-metrics-section` - Main container
- `dashboard-metrics-loading` - Loading state
- `metric-card-{id}` - Individual metric cards

**Accessibility**:
- Uses semantic HTML structure
- Includes proper ARIA labels
- Supports keyboard navigation

---

### QuickActionsSection

**Purpose**: Provides quick action buttons for creating customers, orders, and employees with modal dialogs.

**Location**: `client/src/components/dashboard/quick-actions-section.tsx`

**Props**:
```typescript
interface QuickActionsSectionProps {
  quickActionForms: QuickActionForm;
  setQuickActionForms: React.Dispatch<React.SetStateAction<QuickActionForm>>;
  handleCreateCustomer: () => Promise<void>;
  handleCreateOrder: () => Promise<void>;
  handleCreateEmployee: () => Promise<void>;
  isLoading?: {
    customer?: boolean;
    order?: boolean;
    employee?: boolean;
  };
}
```

**Usage**:
```tsx
import { QuickActionsSection } from '@/components/dashboard/quick-actions-section';

<QuickActionsSection
  quickActionForms={forms}
  setQuickActionForms={setForms}
  handleCreateCustomer={handleCreateCustomer}
  handleCreateOrder={handleCreateOrder}
  handleCreateEmployee={handleCreateEmployee}
  isLoading={{ customer: false, order: false, employee: false }}
/>
```

**Test IDs**:
- `quick-actions-section` - Main container
- `add-customer-trigger` - Customer creation trigger
- `add-order-trigger` - Order creation trigger
- `add-employee-trigger` - Employee creation trigger
- `add-customer-dialog` - Customer creation modal
- `customer-name-input` - Customer name input field
- `create-customer-button` - Customer creation submit button

**Features**:
- Modal dialogs for each action type
- Form validation
- Loading states
- Hover animations

---

### DashboardChartsSection

**Purpose**: Displays various charts and visualizations for dashboard analytics.

**Location**: `client/src/components/dashboard/dashboard-charts-section.tsx`

**Props**:
```typescript
interface DashboardChartsSectionProps {
  salesData?: SalesData[];
  orderStatusData?: OrderStatusData[];
  servicePopularityData?: ServicePopularityData[];
  isLoading?: boolean;
  className?: string;
  layout?: 'grid' | 'stacked';
}
```

**Usage**:
```tsx
import { DashboardChartsSection, useChartConfig } from '@/components/dashboard/dashboard-charts-section';

const { generateMockSalesData } = useChartConfig();

<DashboardChartsSection
  salesData={generateMockSalesData(30)}
  orderStatusData={orderStatusData}
  servicePopularityData={serviceData}
  isLoading={false}
  layout="grid"
/>
```

**Test IDs**:
- `dashboard-charts-section` - Main container
- `sales-chart-card` - Sales chart container
- `order-status-chart-card` - Order status chart container
- `service-popularity-chart-card` - Service popularity chart container

**Charts Included**:
- Sales overview (line chart)
- Order status distribution (pie chart)
- Service popularity (bar chart)

---

### RecentActivitySection

**Purpose**: Displays recent orders and due today orders in a side-by-side layout.

**Location**: `client/src/components/dashboard/recent-activity-section.tsx`

**Props**:
```typescript
interface RecentActivitySectionProps {
  recentOrders?: Order[];
  dueTodayOrders?: Order[];
  isLoading?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical';
  itemLimit?: number;
  showViewAll?: boolean;
}
```

**Usage**:
```tsx
import { RecentActivitySection } from '@/components/dashboard/recent-activity-section';

<RecentActivitySection
  recentOrders={recentOrders}
  dueTodayOrders={dueTodayOrders}
  isLoading={false}
  layout="horizontal"
  itemLimit={5}
  showViewAll={true}
/>
```

**Test IDs**:
- `recent-activity-section` - Main container
- `recent-orders-card` - Recent orders container
- `due-today-orders-card` - Due today orders container
- `recent-orders-list` - Recent orders list
- `due-today-orders-list` - Due today orders list

**Additional Components**:
- `ActivitySummary` - Summary metrics
- `ActivityFilter` - Filter controls

## Layout Components

### Sidebar

**Purpose**: Main navigation sidebar with links to all application sections.

**Location**: `client/src/components/layout/sidebar.tsx`

**Props**: None (self-contained component)

**Usage**:
```tsx
import { Sidebar } from '@/components/layout/sidebar';

<Sidebar />
```

**Test IDs**:
- `main-sidebar` - Main sidebar container
- `sidebar-header` - Logo/brand section
- `brand-logo-link` - Logo link
- `brand-logo-image` - Logo image
- `main-navigation` - Primary navigation container
- `secondary-navigation` - Secondary navigation container
- `nav-dashboard` - Dashboard navigation link
- `nav-orders` - Orders navigation link
- `nav-customers` - Customers navigation link
- `nav-services` - Services navigation link
- `nav-inventory` - Inventory navigation link
- `nav-logistics` - Logistics navigation link
- `nav-live-tracking` - Live tracking navigation link
- `nav-documents` - Documents navigation link
- `nav-analytics` - Analytics navigation link
- `nav-employee-dashboard` - Employee dashboard navigation link
- `nav-franchise-dashboard` - Franchise dashboard navigation link
- `nav-database-status` - Database status navigation link
- `nav-settings` - Settings navigation link

**Features**:
- Active state indication
- Hover effects
- Keyboard navigation support
- ARIA labels for accessibility
- Responsive design

**Accessibility**:
- `role="navigation"` on sidebar
- `aria-label` for navigation sections
- `aria-current="page"` for active links
- `aria-hidden="true"` on decorative icons

---

### Header

**Purpose**: Application header with breadcrumbs, search, and notifications.

**Location**: `client/src/components/layout/header.tsx`

**Props**:
```typescript
interface HeaderProps {
  onToggleSidebar: () => void;
}
```

**Usage**:
```tsx
import { Header } from '@/components/layout/header';

<Header onToggleSidebar={handleToggleSidebar} />
```

**Features**:
- Dynamic breadcrumb generation
- Global search functionality
- Notification center
- Sidebar toggle button

---

### MainLayout

**Purpose**: Main application layout wrapper that combines sidebar, header, and content area.

**Location**: `client/src/components/layout/main-layout.tsx`

**Props**:
```typescript
interface MainLayoutProps {
  children: React.ReactNode;
}
```

**Usage**:
```tsx
import { MainLayout } from '@/components/layout/main-layout';

<MainLayout>
  <YourPageContent />
</MainLayout>
```

**Features**:
- Responsive layout
- Sidebar toggle functionality
- Content area with proper spacing
- Mobile-friendly design

## UI Components

### Button

**Purpose**: Reusable button component with multiple variants and sizes.

**Location**: `client/src/components/ui/button.tsx`

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  'data-testid'?: string;
}
```

**Usage**:
```tsx
import { Button } from '@/components/ui/button';

<Button 
  variant="primary" 
  size="md" 
  onClick={handleClick}
  data-testid="submit-button"
>
  Submit
</Button>
```

**Variants**:
- `primary` - Main action button (blue)
- `secondary` - Secondary action (gray)
- `destructive` - Dangerous actions (red)
- `outline` - Outlined button
- `ghost` - Minimal styling

**Sizes**:
- `sm` - Small (32px height)
- `md` - Medium (40px height)
- `lg` - Large (48px height)

---

### Card

**Purpose**: Container component for grouping related content.

**Location**: `client/src/components/ui/card.tsx`

**Components**:
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title component
- `CardDescription` - Description component
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage**:
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card data-testid="user-card">
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
  </CardHeader>
  <CardContent>
    <p>User information goes here</p>
  </CardContent>
</Card>
```

---

### Input

**Purpose**: Form input component with validation support.

**Location**: `client/src/components/ui/input.tsx`

**Props**:
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  'data-testid'?: string;
}
```

**Usage**:
```tsx
import { Input } from '@/components/ui/input';

<Input
  type="email"
  placeholder="Enter email address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  data-testid="email-input"
/>
```

**Features**:
- Built-in validation styling
- Error message display
- Disabled state support
- Multiple input types

## Form Components

### Form Validation

All form components support validation through error props and visual feedback:

```tsx
// Error state styling
<Input 
  value={value}
  onChange={onChange}
  error={error}
  className={error ? 'border-red-500' : ''}
/>

// Error message display
{error && (
  <span className="text-red-500 text-sm" data-testid="error-message">
    {error}
  </span>
)}
```

### Form Patterns

**Basic Form Structure**:
```tsx
<form onSubmit={handleSubmit} data-testid="user-form">
  <div className="space-y-4">
    <div>
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        error={errors.name}
        data-testid="name-input"
      />
      {errors.name && (
        <span className="text-red-500 text-sm" data-testid="name-error">
          {errors.name}
        </span>
      )}
    </div>
    
    <Button type="submit" data-testid="submit-button">
      Submit
    </Button>
  </div>
</form>
```

## Data Display Components

### Table

**Purpose**: Display tabular data with sorting, filtering, and pagination.

**Location**: `client/src/components/ui/table.tsx`

**Components**:
- `Table` - Main table container
- `TableHeader` - Header section
- `TableBody` - Body section
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableCell` - Data cell

**Usage**:
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

<Table data-testid="users-table">
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
        <TableCell data-testid={`user-name-${user.id}`}>{user.name}</TableCell>
        <TableCell data-testid={`user-email-${user.id}`}>{user.email}</TableCell>
        <TableCell>
          <Button data-testid={`edit-user-${user.id}`}>Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Badge

**Purpose**: Display status indicators and labels.

**Location**: `client/src/components/ui/badge.tsx`

**Props**:
```typescript
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
  'data-testid'?: string;
}
```

**Usage**:
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default" data-testid="status-badge">
  Active
</Badge>
```

**Variants**:
- `default` - Primary badge (blue)
- `secondary` - Secondary badge (gray)
- `destructive` - Error/warning badge (red)
- `outline` - Outlined badge

## Testing Guidelines

### Component Testing Checklist

For each component, ensure the following tests are included:

1. **Rendering Tests**:
   - Component renders without crashing
   - All required props are displayed correctly
   - Conditional rendering works as expected

2. **Interaction Tests**:
   - Click handlers work correctly
   - Form submissions function properly
   - Keyboard navigation is supported

3. **State Tests**:
   - Component state updates correctly
   - Props changes trigger re-renders
   - Loading states are handled properly

4. **Accessibility Tests**:
   - ARIA labels are present
   - Keyboard navigation works
   - Screen reader compatibility

5. **Error Handling Tests**:
   - Error states are displayed
   - Validation messages appear
   - Graceful degradation

### Test ID Naming Convention

Follow this pattern for consistent test IDs:

```
[component-name]-[element-type]-[identifier]
```

Examples:
- `user-profile-edit-button`
- `order-list-item-123`
- `dashboard-metrics-revenue-card`
- `customer-form-name-input`

## Performance Considerations

### Optimization Techniques

1. **React.memo()**: Use for components with stable props
2. **useMemo()**: For expensive calculations
3. **useCallback()**: For event handlers passed to child components
4. **Code Splitting**: Use dynamic imports for large components
5. **Lazy Loading**: Implement for components below the fold

### Example Optimized Component

```tsx
import React, { memo, useMemo, useCallback } from 'react';

interface OptimizedComponentProps {
  data: DataItem[];
  onItemClick: (id: string) => void;
}

export const OptimizedComponent = memo<OptimizedComponentProps>(({ 
  data, 
  onItemClick 
}) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayName: `${item.firstName} ${item.lastName}`
    }));
  }, [data]);

  // Memoize event handlers
  const handleItemClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  return (
    <div data-testid="optimized-component">
      {processedData.map(item => (
        <div 
          key={item.id}
          onClick={() => handleItemClick(item.id)}
          data-testid={`item-${item.id}`}
        >
          {item.displayName}
        </div>
      ))}
    </div>
  );
});

OptimizedComponent.displayName = 'OptimizedComponent';
```

This documentation serves as a comprehensive guide for understanding, using, and maintaining the FabZClean component library.
