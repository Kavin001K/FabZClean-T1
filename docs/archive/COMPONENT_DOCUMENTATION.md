# FabZClean Component Documentation

This document provides comprehensive documentation for all React components in the FabZClean application, including new algorithm-enhanced components and performance optimizations.

## Table of Contents

1. [UI Components](#ui-components)
2. [Dashboard Components](#dashboard-components)
3. [Order Management Components](#order-management-components)
4. [Customer Portal Components](#customer-portal-components)
5. [Worker Portal Components](#worker-portal-components)
6. [Search Components](#search-components)
7. [Performance Components](#performance-components)
8. [Hooks](#hooks)
9. [Utilities](#utilities)

## UI Components

### VirtualScroll
A high-performance virtual scrolling component for large lists.

**Props:**
```typescript
interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}
```

**Usage:**
```tsx
<VirtualScroll
  items={orders}
  itemHeight={60}
  containerHeight={400}
  renderItem={(order, index) => <OrderItem order={order} />}
  overscan={5}
  loading={isLoading}
  emptyMessage="No orders found"
/>
```

### LazyLoad
Lazy loading component using Intersection Observer API.

**Props:**
```typescript
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  delay?: number;
  once?: boolean;
  onVisible?: () => void;
}
```

**Usage:**
```tsx
<LazyLoad
  fallback={<LoadingSpinner />}
  threshold={0.1}
  rootMargin="50px"
  delay={500}
  onVisible={() => console.log('Component visible')}
>
  <ExpensiveChart data={chartData} />
</LazyLoad>
```

### LazyImage
Optimized image loading with lazy loading and error handling.

**Props:**
```typescript
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}
```

**Usage:**
```tsx
<LazyImage
  src="/images/product.jpg"
  alt="Product image"
  fallbackSrc="/images/placeholder.jpg"
  threshold={0.1}
  onLoad={() => console.log('Image loaded')}
/>
```

### PerformanceMonitor
Real-time performance monitoring component.

**Props:**
```typescript
interface PerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}
```

**Usage:**
```tsx
<PerformanceMonitor
  enabled={process.env.NODE_ENV === 'development'}
  position="top-right"
  showDetails={true}
/>
```

## Dashboard Components

### EnhancedEmployeeDashboard
Comprehensive employee dashboard with performance metrics and task management.

**Props:**
```typescript
interface EnhancedEmployeeDashboardProps {
  className?: string;
  showPerformanceMetrics?: boolean;
  enableRealTimeUpdates?: boolean;
}
```

**Features:**
- Real-time performance metrics
- Task management interface
- Order management integration
- Transit management tools
- Analytics and reporting
- Responsive design

**Usage:**
```tsx
<EnhancedEmployeeDashboard
  showPerformanceMetrics={true}
  enableRealTimeUpdates={true}
/>
```

### DashboardMetrics
Performance metrics display component.

**Props:**
```typescript
interface DashboardMetricsProps {
  metrics: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    customerSatisfaction: number;
  };
  loading?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<DashboardMetrics
  metrics={dashboardData}
  loading={isLoading}
/>
```

## Order Management Components

### EmployeeOrderManagement
Enhanced order management interface for employees.

**Props:**
```typescript
interface EmployeeOrderManagementProps {
  orders: Order[];
  loading?: boolean;
  onOrderUpdate?: (orderId: string, updates: Partial<Order>) => void;
  onOrderDelete?: (orderId: string) => void;
  className?: string;
}
```

**Features:**
- Advanced search and filtering
- Bulk operations
- Real-time updates
- Export functionality
- Responsive design

**Usage:**
```tsx
<EmployeeOrderManagement
  orders={orders}
  loading={isLoading}
  onOrderUpdate={handleOrderUpdate}
  onOrderDelete={handleOrderDelete}
/>
```

### OrderFilters
Advanced filtering component for orders.

**Props:**
```typescript
interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  className?: string;
}
```

**Usage:**
```tsx
<OrderFilters
  filters={currentFilters}
  onFiltersChange={setFilters}
/>
```

### OrderSorting
Sorting component for orders.

**Props:**
```typescript
interface OrderSortingProps {
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  className?: string;
}
```

**Usage:**
```tsx
<OrderSorting
  sortField="createdAt"
  sortOrder="desc"
  onSortChange={handleSortChange}
/>
```

## Customer Portal Components

### CustomerOrderTracking
Order tracking interface for customers.

**Props:**
```typescript
interface CustomerOrderTrackingProps {
  orders: Order[];
  customer: Customer;
  onOrderSelect?: (order: Order) => void;
  className?: string;
}
```

**Features:**
- Order status tracking
- Progress visualization
- Order details modal
- Search and filtering
- Pagination

**Usage:**
```tsx
<CustomerOrderTracking
  orders={customerOrders}
  customer={currentCustomer}
  onOrderSelect={handleOrderSelect}
/>
```

### CustomerServiceBooking
Service booking interface for customers.

**Props:**
```typescript
interface CustomerServiceBookingProps {
  customer: Customer;
  onBookingComplete?: (booking: ServiceBooking) => void;
  className?: string;
}
```

**Features:**
- Service selection
- Date/time picker
- Address management
- Price calculation
- Booking confirmation

**Usage:**
```tsx
<CustomerServiceBooking
  customer={currentCustomer}
  onBookingComplete={handleBookingComplete}
/>
```

### CustomerAccountManagement
Account management interface for customers.

**Props:**
```typescript
interface CustomerAccountManagementProps {
  customer: Customer;
  onCustomerUpdate?: (updates: Partial<Customer>) => void;
  className?: string;
}
```

**Features:**
- Profile editing
- Address management
- Loyalty points display
- Order history
- Preferences settings

**Usage:**
```tsx
<CustomerAccountManagement
  customer={currentCustomer}
  onCustomerUpdate={handleCustomerUpdate}
/>
```

## Worker Portal Components

### WorkerDeliveryManagement
Delivery management interface for workers.

**Props:**
```typescript
interface WorkerDeliveryManagementProps {
  deliveries: Delivery[];
  driver: Driver;
  onDeliveryUpdate?: (deliveryId: string, updates: Partial<Delivery>) => void;
  className?: string;
}
```

**Features:**
- Delivery list
- Route optimization
- QR code scanning
- Status updates
- Real-time tracking

**Usage:**
```tsx
<WorkerDeliveryManagement
  deliveries={assignedDeliveries}
  driver={currentDriver}
  onDeliveryUpdate={handleDeliveryUpdate}
/>
```

### RouteOptimization
Route optimization component for delivery planning.

**Props:**
```typescript
interface RouteOptimizationProps {
  deliveries: Delivery[];
  driverLocation: { latitude: number; longitude: number };
  onRouteOptimized?: (optimizedRoute: OptimizedRoute) => void;
  className?: string;
}
```

**Usage:**
```tsx
<RouteOptimization
  deliveries={pendingDeliveries}
  driverLocation={currentLocation}
  onRouteOptimized={handleRouteOptimized}
/>
```

## Search Components

### FuzzySearch
Advanced fuzzy search component with autocomplete.

**Props:**
```typescript
interface FuzzySearchProps<T> {
  items: T[];
  searchFields: (keyof T)[];
  onSearch: (query: string, results: T[]) => void;
  placeholder?: string;
  className?: string;
  threshold?: number;
  maxResults?: number;
}
```

**Usage:**
```tsx
<FuzzySearch
  items={orders}
  searchFields={['customerName', 'customerEmail', 'orderNumber']}
  onSearch={handleSearch}
  placeholder="Search orders..."
  threshold={0.7}
  maxResults={50}
/>
```

### SearchSuggestions
Search suggestions component with recent searches.

**Props:**
```typescript
interface SearchSuggestionsProps {
  suggestions: string[];
  recentSearches: string[];
  onSuggestionSelect: (suggestion: string) => void;
  onRecentSearchSelect: (search: string) => void;
  className?: string;
}
```

**Usage:**
```tsx
<SearchSuggestions
  suggestions={searchSuggestions}
  recentSearches={recentSearches}
  onSuggestionSelect={handleSuggestionSelect}
  onRecentSearchSelect={handleRecentSearchSelect}
/>
```

### AdvancedFilters
Advanced filtering component with multiple criteria.

**Props:**
```typescript
interface AdvancedFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  availableFilters: FilterOption[];
  className?: string;
}
```

**Usage:**
```tsx
<AdvancedFilters
  filters={currentFilters}
  onFiltersChange={setFilters}
  availableFilters={filterOptions}
/>
```

## Performance Components

### MemoizedList
Memoized list component for performance optimization.

**Props:**
```typescript
interface MemoizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  emptyMessage?: string;
}
```

**Usage:**
```tsx
<MemoizedList
  items={orders}
  renderItem={(order, index) => <OrderItem order={order} />}
  keyExtractor={(order) => order.id}
  emptyMessage="No orders found"
/>
```

### OptimizedTable
Performance-optimized table component.

**Props:**
```typescript
interface OptimizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (field: keyof T, order: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  loading?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<OptimizedTable
  data={orders}
  columns={orderColumns}
  onSort={handleSort}
  onFilter={handleFilter}
  loading={isLoading}
/>
```

## Hooks

### useFuzzySearch
Hook for fuzzy search functionality.

**Parameters:**
```typescript
interface UseFuzzySearchOptions {
  threshold?: number;
  maxResults?: number;
  caseSensitive?: boolean;
}
```

**Returns:**
```typescript
interface UseFuzzySearchReturn<T> {
  search: (query: string) => T[];
  results: T[];
  loading: boolean;
  error: string | null;
}
```

**Usage:**
```tsx
const { search, results, loading } = useFuzzySearch(orders, {
  threshold: 0.7,
  maxResults: 50,
  caseSensitive: false
});
```

### usePagination
Hook for pagination functionality.

**Parameters:**
```typescript
interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
}
```

**Returns:**
```typescript
interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

**Usage:**
```tsx
const {
  currentPage,
  totalPages,
  paginatedData,
  goToPage,
  nextPage,
  prevPage
} = usePagination(orders, { pageSize: 20 });
```

### useCache
Hook for caching functionality.

**Parameters:**
```typescript
interface UseCacheOptions {
  ttl?: number;
  maxSize?: number;
}
```

**Returns:**
```typescript
interface UseCacheReturn<T> {
  get: (key: string) => T | null;
  set: (key: string, value: T) => void;
  clear: () => void;
  has: (key: string) => boolean;
  size: number;
}
```

**Usage:**
```tsx
const { get, set, clear } = useCache<Order[]>({ ttl: 3600000 });
```

### useMemoization
Hook for memoization utilities.

**Returns:**
```typescript
interface UseMemoizationReturn {
  useDebounce: <T>(value: T, delay: number) => T;
  useThrottle: <T extends (...args: any[]) => any>(callback: T, delay: number) => T;
  useMemoizedSearch: <T>(items: T[], searchQuery: string, searchFields: (keyof T)[]) => T[];
  useMemoizedSort: <T>(items: T[], sortField: keyof T, sortOrder: 'asc' | 'desc') => T[];
  useMemoizedFilter: <T>(items: T[], filters: Record<string, any>) => T[];
}
```

**Usage:**
```tsx
const { useDebounce, useMemoizedSearch } = useMemoization();
const debouncedQuery = useDebounce(searchQuery, 300);
const searchResults = useMemoizedSearch(orders, debouncedQuery, ['customerName']);
```

### useProgressiveLoading
Hook for progressive loading of data.

**Parameters:**
```typescript
interface UseProgressiveLoadingOptions {
  batchSize?: number;
  delay?: number;
  initialLoad?: number;
}
```

**Returns:**
```typescript
interface UseProgressiveLoadingReturn<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  loadInitial: () => void;
  reset: () => void;
}
```

**Usage:**
```tsx
const {
  items,
  loading,
  hasMore,
  loadMore,
  loadInitial
} = useProgressiveLoading(loadOrders, {
  batchSize: 20,
  delay: 1000,
  initialLoad: 50
});
```

## Utilities

### Bundle Optimization
Utilities for bundle optimization and code splitting.

**Functions:**
```typescript
// Dynamic imports
dynamicImports.dashboard()
dynamicImports.orderManagement()
dynamicImports.customerPortal()

// Preloading
preloadComponents.preloadCritical()
preloadComponents.preloadByRole('admin')

// Resource hints
addResourceHints()

// Bundle analysis
bundleAnalyzer.trackBundleSize('main', 1024000)
bundleAnalyzer.analyzeChunks(chunks)
```

### Performance Monitoring
Utilities for performance monitoring and optimization.

**Functions:**
```typescript
// Component load measurement
performanceMonitor.measureComponentLoad('Dashboard', loadFn)

// Bundle size measurement
performanceMonitor.measureBundleSize(bundle)

// Memory usage monitoring
performanceMonitor.monitorMemoryUsage()
```

### Cache Management
Utilities for cache management and optimization.

**Functions:**
```typescript
// Service worker setup
cacheOptimization.setupServiceWorkerCache()

// Cache headers
cacheOptimization.getCacheHeaders('static')

// Local storage cache
cacheOptimization.localStorageCache.set('key', value, ttl)
cacheOptimization.localStorageCache.get('key')
cacheOptimization.localStorageCache.clear()
```

## Component Architecture

### Design Principles
1. **Performance First**: All components are optimized for performance
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Responsive Design**: Mobile-first approach
4. **Type Safety**: Full TypeScript support
5. **Reusability**: Modular and reusable components
6. **Testing**: Comprehensive test coverage

### Component Structure
```
components/
├── ui/                    # Base UI components
│   ├── virtual-scroll.tsx
│   ├── lazy-load.tsx
│   ├── performance-monitor.tsx
│   └── ...
├── dashboard/             # Dashboard components
│   ├── enhanced-employee-dashboard.tsx
│   ├── dashboard-metrics.tsx
│   └── ...
├── orders/                # Order management components
│   ├── employee-order-management.tsx
│   ├── order-filters.tsx
│   └── ...
├── customer-portal/       # Customer portal components
│   ├── customer-order-tracking.tsx
│   ├── customer-service-booking.tsx
│   └── ...
├── worker-portal/         # Worker portal components
│   ├── worker-delivery-management.tsx
│   ├── route-optimization.tsx
│   └── ...
└── search/                # Search components
    ├── fuzzy-search.tsx
    ├── search-suggestions.tsx
    └── ...
```

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Component library
- **Radix UI**: Headless UI components
- **Framer Motion**: Animation library
- **Custom CSS**: Component-specific styles

### State Management
- **React Query**: Server state management
- **React Context**: Global state management
- **React Hooks**: Local state management
- **Zustand**: Alternative state management (optional)

This comprehensive component documentation provides all the information needed to understand and use the FabZClean application's React components effectively.