# FabClean Frontend Architecture Documentation

## Table of Contents
1. [Overview of Frontend Structure](#1-overview-of-frontend-structure)
2. [Frontend Technologies](#2-frontend-technologies)
3. [Architecture Patterns](#3-architecture-patterns)
4. [Data Handling](#4-data-handling)
5. [Routing](#5-routing)
6. [Component Structure](#6-component-structure)
7. [Styling Approach](#7-styling-approach)
8. [Code Examples](#8-code-examples)
9. [Best Practices](#9-best-practices)
10. [Common Challenges and Solutions](#10-common-challenges-and-solutions)
11. [Conclusion](#11-conclusion)

---

## 1. Overview of Frontend Structure

### Single Page Application (SPA) Architecture

The FabClean frontend is built as a modern Single Page Application using React 18 with TypeScript, providing a seamless user experience without full page reloads. The architecture follows a component-based design pattern that promotes reusability, maintainability, and scalability.

### Multi-Application Setup

The project implements a multi-application architecture where a single backend API serves four distinct frontend applications:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Portal │    │ Employee Portal │    │ Customer Portal │    │ Worker Portal   │
│   (Admin UI)    │    │   (Staff UI)    │    │ (Self-Service)  │    │ (Mobile UI)     │
│                 │    │                 │    │                 │    │                 │
│ • Dashboard     │    │ • Orders        │    │ • Order Status  │    │ • Scan Orders   │
│ • Analytics     │    │ • Transit       │    │ • History       │    │ • Update Status │
│ • Management    │    │ • Tracking      │    │ • Services      │    │ • Location      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │
          └──────────────────────┼──────────────────────┼──────────────────────┘
                                 │                      │
                    ┌─────────────▼─────────────────────▼─────────────┐
                    │           Shared Backend API                     │
                    │         (Flask/Python)                          │
                    └─────────────────────┬───────────────────────────┘
                                          │
                              ┌───────────▼───────────┐
                              │    Database           │
                              │   (SQLite/PostgreSQL) │
                              └───────────────────────┘
```

### Component-Based Architecture

The frontend follows a hierarchical component structure that promotes separation of concerns and code reusability:

```
App (Root Component)
├── Providers (Context Providers)
│   ├── QueryClientProvider (TanStack Query)
│   ├── ThemeProvider (Theme Context)
│   └── TooltipProvider (UI Context)
├── MainLayout (Layout Wrapper)
│   ├── Header (Navigation Header)
│   ├── Sidebar (Navigation Menu)
│   └── Main Content Area
│       └── Pages (Route Components)
│           ├── Dashboard
│           ├── Orders
│           ├── Customers
│           ├── Services
│           └── Analytics
└── UI Components (Reusable Components)
    ├── Button
    ├── Card
    ├── Dialog
    ├── Form
    └── Table
```

### File Organization Pattern

The project follows a well-structured file organization that separates concerns and promotes maintainability:

```
client/src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── form.tsx
│   ├── layout/          # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── main-layout.tsx
│   └── dashboard/       # Feature-specific components
│       ├── kpi-card.tsx
│       ├── sales-chart.tsx
│       └── order-summary.tsx
├── pages/               # Route components
│   ├── dashboard.tsx
│   ├── orders.tsx
│   ├── customers.tsx
│   └── analytics.tsx
├── hooks/               # Custom React hooks
│   ├── use-toast.ts
│   └── use-theme.tsx
├── lib/                 # Utility functions and configurations
│   ├── api.ts
│   ├── queryClient.ts
│   ├── utils.ts
│   └── data.ts
├── App.tsx              # Root component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

---

## 2. Frontend Technologies

### Core Technologies

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **React** | 18.3.1 | UI Framework | Modern React with hooks, concurrent features, and excellent ecosystem |
| **TypeScript** | 5.9.2 | Type Safety | Compile-time error checking, better IDE support, and maintainable code |
| **Vite** | 5.4.19 | Build Tool | Fast development server, optimized builds, and modern tooling |

### Routing and Navigation

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Wouter** | 3.3.5 | Client-side Routing | Lightweight, fast, and simple routing solution |

**Why Wouter over React Router?**
- **Size**: ~2KB vs ~50KB for React Router
- **Simplicity**: Minimal API with hooks-based navigation
- **Performance**: Faster route matching and rendering
- **Modern**: Built for modern React patterns

### State Management

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **TanStack Query** | 5.60.5 | Server State Management | Powerful caching, background updates, and optimistic updates |
| **React Hooks** | Built-in | Local State Management | useState, useReducer for component-level state |

**State Management Strategy:**
- **Server State**: TanStack Query for API data
- **Local State**: React hooks for component state
- **Global State**: Context API for theme and app-wide state
- **Persistent State**: localStorage for user preferences

### Styling and UI

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Tailwind CSS** | 3.4.17 | Utility-first CSS | Rapid development, consistent design, and small bundle size |
| **Shadcn UI** | Latest | Component Library | Accessible, customizable components built on Radix UI |
| **Radix UI** | Various | UI Primitives | Unstyled, accessible components for complex UI patterns |

### Forms and Validation

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **React Hook Form** | 7.55.0 | Form Management | Performance-focused form library with minimal re-renders |
| **Zod** | 3.24.2 | Schema Validation | TypeScript-first schema validation with runtime type checking |

### Data Visualization

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Recharts** | 2.15.2 | Chart Library | React-native charting library with good TypeScript support |

### Desktop Application

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Electron** | Latest | Desktop Framework | Cross-platform desktop apps using web technologies |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESBuild** | 0.25.9 | Fast JavaScript bundler |
| **PostCSS** | 8.4.47 | CSS processing |
| **Autoprefixer** | 10.4.20 | CSS vendor prefixing |

---

## 3. Architecture Patterns

### Component Hierarchy Pattern

The application follows a clear component hierarchy that separates concerns and promotes reusability:

```
Pages (Smart Components)
├── Handle business logic
├── Manage state and side effects
├── Coordinate data fetching
└── Compose layout and UI components

Layout Components
├── Provide consistent structure
├── Handle navigation and routing
├── Manage responsive behavior
└── Wrap page content

UI Components (Presentational Components)
├── Focus on rendering and user interaction
├── Receive data via props
├── Emit events via callbacks
└── Are highly reusable and testable
```

### Smart vs Presentational Components

#### Smart Components (Container Components)
```typescript
// Example: Orders page (smart component)
export default function OrdersTable() {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Side effects
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Business logic
  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      setOrders(orders.filter(o => o.id !== orderId));
      toast({ title: "Order deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete order", variant: "destructive" });
    }
  };
  
  return (
    <div>
      <OrdersTableHeader onExport={handleExport} />
      <OrdersTableContent 
        orders={orders} 
        loading={loading}
        onDelete={handleDeleteOrder}
      />
    </div>
  );
}
```

#### Presentational Components (UI Components)
```typescript
// Example: Card component (presentational)
interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ title, description, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    >
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-6 pt-0">{children}</div>
    </div>
  )
);
```

### Custom Hooks Pattern

Custom hooks encapsulate reusable logic and state management:

```typescript
// Example: useToast hook
export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

// Usage in components
function MyComponent() {
  const { toast } = useToast();
  
  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Operation completed successfully",
    });
  };
  
  return <button onClick={handleSuccess}>Save</button>;
}
```

### Provider Pattern

The application uses the Provider pattern for dependency injection and context management:

```typescript
// App.tsx - Provider composition
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
          <SpeedInsights />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Composition over Inheritance

The application favors composition patterns over inheritance:

```typescript
// Compound component pattern
const Card = ({ children, ...props }) => <div {...props}>{children}</div>;
const CardHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
const CardTitle = ({ children, ...props }) => <h3 {...props}>{children}</h3>;
const CardContent = ({ children, ...props }) => <div {...props}>{children}</div>;

// Usage
<Card>
  <CardHeader>
    <CardTitle>Order Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Order information here...</p>
  </CardContent>
</Card>
```

---

## 4. Data Handling

### Server State Management with TanStack Query

TanStack Query (formerly React Query) handles all server state management, providing powerful caching, background updates, and optimistic updates.

#### Query Client Configuration

```typescript
// lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Custom query function with error handling
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
```

#### Data Fetching Patterns

```typescript
// Example: Fetching orders with TanStack Query
export default function OrdersTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  // Mutate order (delete)
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete order');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Order deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete order", variant: "destructive" });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading orders</div>;

  return (
    <div>
      {orders.map(order => (
        <OrderCard 
          key={order.id} 
          order={order}
          onDelete={() => deleteOrderMutation.mutate(order.id)}
        />
      ))}
    </div>
  );
}
```

### Local State Management

React hooks manage component-level state:

```typescript
// Example: Complex state management in transit orders
export default function TransitOrdersPage() {
  // Multiple state variables for different concerns
  const [currentBatch, setCurrentBatch] = useState<any[]>(() => {
    const saved = localStorage.getItem('currentTransitBatch');
    return saved ? JSON.parse(saved) : [];
  });

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [preppingForReturn, setPreppingForReturn] = useState<string[]>([]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('currentTransitBatch', JSON.stringify(currentBatch));
  }, [currentBatch]);

  // Derived state with useMemo
  const availableOrders = useMemo(() => {
    if (isLoadingOrders) return [];
    const ids = new Set(currentBatch.map((o) => o.id));
    return allOrders.filter((o) => o.status === 'At Store' && !ids.has(o.id));
  }, [allOrders, currentBatch, isLoadingOrders]);
}
```

### Global State with Context API

```typescript
// Theme context for global theme state
type ThemeProviderState = {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "fab-z-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeProviderState["theme"]>(
    () => (localStorage.getItem(storageKey) as ThemeProviderState["theme"]) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: ThemeProviderState["theme"]) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
```

### API Integration Patterns

#### Centralized API Functions

```typescript
// lib/api.ts
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

// Usage in components
const fetchOrders = async () => {
  return apiFetch('/api/orders');
};

const createOrder = async (orderData: CreateOrderData) => {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};
```

#### Error Handling Patterns

```typescript
// Error boundary for catching React errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bento-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Button onClick={this.resetError} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

---

## 5. Routing

### Wouter Implementation

Wouter provides lightweight, hook-based routing for the application:

```typescript
// App.tsx - Router setup
import { Switch, Route, Link } from "wouter";
import { useLocation } from "wouter";

function Router() {
  const [, setLocation] = useLocation(); // For programmatic navigation

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/customers" component={Customers} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/services" component={Services} />
        <Route path="/employees" component={Employees} />
        <Route path="/create-order" component={CreateOrder} />
        <Route path="/tracking" component={Tracking} />
        <Route path="/logistics" component={Logistics} />
        <Route path="/transit-orders" component={TransitOrders} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}
```

### Programmatic Navigation

```typescript
// Example: Programmatic navigation
function OrdersPage() {
  const [, setLocation] = useLocation();

  const handleCreateOrder = () => {
    setLocation("/create-order");
  };

  const handleViewOrder = (orderId: string) => {
    setLocation(`/orders/${orderId}`);
  };

  return (
    <div>
      <Button onClick={handleCreateOrder}>
        Create New Order
      </Button>
      {/* Order list with navigation */}
    </div>
  );
}
```

### Route Configuration

Routes are organized by feature and follow RESTful conventions:

```typescript
// Route structure
const routes = {
  // Dashboard routes
  dashboard: "/dashboard",
  
  // Resource routes
  orders: "/orders",
  orderDetail: "/orders/:id",
  createOrder: "/create-order",
  
  customers: "/customers",
  customerDetail: "/customers/:id",
  
  services: "/services",
  serviceDetail: "/services/:id",
  
  // Feature routes
  analytics: "/analytics",
  inventory: "/inventory",
  logistics: "/logistics",
  transitOrders: "/transit-orders",
  tracking: "/tracking",
};
```

### Protected Routes Pattern

While Wouter doesn't have built-in route guards, the application implements protection through component composition:

```typescript
// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'employee' | 'customer';
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
}

// Usage
<Route path="/admin/*">
  <ProtectedRoute requiredRole="admin">
    <AdminRoutes />
  </ProtectedRoute>
</Route>
```

---

## 6. Component Structure

### Shadcn UI Component Library

The application uses Shadcn UI, a collection of reusable components built on top of Radix UI primitives:

#### Component Architecture

```typescript
// Example: Card component structure
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";
```

#### Component Composition Patterns

```typescript
// Compound component pattern
export const Card = ({ children, ...props }) => <div {...props}>{children}</div>;
export const CardHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
export const CardTitle = ({ children, ...props }) => <h3 {...props}>{children}</h3>;
export const CardDescription = ({ children, ...props }) => <p {...props}>{children}</p>;
export const CardContent = ({ children, ...props }) => <div {...props}>{children}</div>;
export const CardFooter = ({ children, ...props }) => <div {...props}>{children}</div>;

// Usage
<Card>
  <CardHeader>
    <CardTitle>Order Details</CardTitle>
    <CardDescription>View and manage order information</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Order content here...</p>
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

### Props and TypeScript Interfaces

```typescript
// Example: Button component with comprehensive props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

### Forward Refs Pattern

All components use `React.forwardRef` for proper ref forwarding:

```typescript
// Example: Input component with ref forwarding
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
```

### Layout Components

```typescript
// Main layout component
interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {isSidebarVisible && <Sidebar />}
      <div className={`flex flex-col w-full transition-all duration-300 ease-in-out ${
        isSidebarVisible ? 'pl-60' : 'pl-0'
      }`}>
        <Header onToggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
```

---

## 7. Styling Approach

### Tailwind CSS Utility-First Approach

The application uses Tailwind CSS for styling, following a utility-first approach that promotes consistency and rapid development:

#### Design System with CSS Variables

```css
/* index.css - CSS variables for theming */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

#### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: [
    "./client/index.html", 
    "./client/src/**/*.{js,jsx,ts,tsx}", 
    "./employee/index.html", 
    "./employee/src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
        },
        // ... more color definitions
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        h1: ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        h2: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        h3: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        // ... more font size definitions
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-in-out",
        "slide-in-from-left": "slide-in-from-left 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
```

### Theme Support (Light/Dark Mode)

```typescript
// Theme provider implementation
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "fab-z-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeProviderState["theme"]>(
    () => (localStorage.getItem(storageKey) as ThemeProviderState["theme"]) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: ThemeProviderState["theme"]) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
```

### Responsive Design Patterns

```typescript
// Responsive component example
function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$12,345</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Animation and Transitions

```typescript
// Animation utilities
const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      transition={{ duration: 0.5 }}
      className="rounded-lg border bg-card shadow-sm"
    >
      {children}
    </motion.div>
  );
}
```

---

## 8. Code Examples

### Application Setup (App.tsx)

```typescript
// App.tsx - Complete application setup
import React, { useEffect } from "react";
import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Services from "@/pages/services";
import CreateOrder from "@/pages/create-order";
import Tracking from "@/pages/tracking";
import Customers from "@/pages/customers";
import Analytics from "@/pages/analytics";
import { MainLayout } from "@/components/layout/main-layout";
import Inventory from "@/pages/inventory";
import Logistics from "@/pages/logistics";
import TransitOrders from "@/pages/transit-orders";
import SpeedInsights from "@/components/speed-insights";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

function redir() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);

  return null;
}

function Router() {
  const [, setLocation] = useLocation();

  return (
    <MainLayout>
      <div className="p-4">
        <Button onClick={() => setLocation("/create-order")}>
          Create New Order
        </Button>
      </div>

      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/customers" component={Customers} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/services" component={Services} />
        <Route path="/employees" component={Employees} />
        <Route path="/create-order" component={CreateOrder} />
        <Route path="/tracking" component={Tracking} />
        <Route path="/logistics" component={Logistics} />
        <Route path="/transit-orders" component={TransitOrders} />
        <Route component={redir} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
          <SpeedInsights />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Complex Page with State Management (orders.tsx)

```typescript
// orders.tsx - Complex page with comprehensive state management
type SortField = keyof Order;

export default function OrdersTable() {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isPrintQRModalOpen, setIsPrintQRModalOpen] = useState(false);

  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Fetch services
  const fetchServices = async () => {
    try {
      const data: Service[] = await adminFetch("/api/services");
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive",
      });
    }
  };

  // Fetch orders with loading state
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data: Order[] = await adminFetch("/api/orders");
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  useEffect(() => {
    let filtered = orders;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customerName.toLowerCase().includes(query) ||
          order.customerEmail.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  // Sort logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedOrders = useMemo(() => {
    if (!sortField) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortField, sortDirection]);

  // CRUD operations
  const handleDeleteOrder = async (order: Order) => {
    try {
      await adminFetch(`/api/orders/${order.id}`, { method: "DELETE" });
      setOrders(orders.filter((o) => o.id !== order.id));
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrder = async () => {
    if (!orderToEdit) return;

    try {
      const updatedOrder = await adminFetch(`/api/orders/${orderToEdit.id}`, {
        method: "PUT",
        body: JSON.stringify(editFormData),
      });

      setOrders(
        orders.map((o) => (o.id === orderToEdit.id ? updatedOrder : o))
      );
      setOrderToEdit(null);
      setEditFormData({});
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  // Export functionality
  const handleExport = async (format: "csv" | "pdf") => {
    setExportLoading(true);
    try {
      if (format === "csv") {
        const csv = convertToCSV(sortedOrders);
        downloadCSV(csv, "orders.csv");
      } else {
        await generatePDF(sortedOrders);
      }
      toast({
        title: "Success",
        description: `Orders exported as ${format.toUpperCase()}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to export orders",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchServices();
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowExportDialog(true)}>
            Export
          </Button>
          <Button onClick={() => setLocation("/create-order")}>
            Create Order
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="At Store">At Store</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Ready for Delivery">Ready for Delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("id")}
                    className="h-auto p-0 font-semibold"
                  >
                    Order ID
                    {sortField === "id" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("customerName")}
                    className="h-auto p-0 font-semibold"
                  >
                    Customer
                    {sortField === "customerName" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Services</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("total")}
                    className="h-auto p-0 font-semibold"
                  >
                    Total
                    {sortField === "total" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("status")}
                    className="h-auto p-0 font-semibold"
                  >
                    Status
                    {sortField === "status" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading orders...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.service?.map((service, index) => (
                          <Badge key={index} variant="secondary">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>${order.total}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "Ready for Delivery"
                            ? "default"
                            : order.status === "Processing"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setViewOrder(order)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setOrderToEdit(order);
                              setEditFormData(order);
                              setSelectedServiceIds(order.serviceId || []);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setIsPrintQRModalOpen(true)}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Print QR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setOrderToDelete(order)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals and dialogs */}
      {viewOrder && (
        <OrderViewDialog
          order={viewOrder}
          open={!!viewOrder}
          onOpenChange={() => setViewOrder(null)}
        />
      )}

      {orderToEdit && (
        <OrderEditDialog
          order={orderToEdit}
          services={services}
          formData={editFormData}
          setFormData={setEditFormData}
          selectedServiceIds={selectedServiceIds}
          setSelectedServiceIds={setSelectedServiceIds}
          open={!!orderToEdit}
          onOpenChange={() => {
            setOrderToEdit(null);
            setEditFormData({});
          }}
          onSave={handleUpdateOrder}
        />
      )}

      {orderToDelete && (
        <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete order {orderToDelete.id}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleDeleteOrder(orderToDelete);
                  setOrderToDelete(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showExportDialog && (
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          onExport={handleExport}
          loading={exportLoading}
        />
      )}
    </div>
  );
}
```

### Layout Composition (main-layout.tsx)

```typescript
// main-layout.tsx - Layout composition pattern
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import ErrorBoundary from '@/components/ui/error-boundary';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Establishes the primary desktop layout with a toggleable sidebar and main content area.
 * The main content div adjusts its left padding based on sidebar visibility.
 */
export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {isSidebarVisible && <Sidebar />}
      <div className={`flex flex-col w-full transition-all duration-300 ease-in-out ${
        isSidebarVisible ? 'pl-60' : 'pl-0'
      }`}>
        <Header onToggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
```

### Reusable Component Pattern (card.tsx)

```typescript
// card.tsx - Reusable component with compound pattern
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---

## 9. Best Practices

### TypeScript Type Safety

#### Comprehensive Type Definitions

```typescript
// Define comprehensive types for all data structures
export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string[];
  service: string[];
  pickupDate: string;
  specialInstructions: string;
  total: number;
  status: "At Store" | "Processing" | "Ready for Delivery" | "Delivered";
  createdAt: string;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: string;
  status: "Active" | "Inactive";
  usage_count: number;
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};
```

#### Generic Type Utilities

```typescript
// Utility types for API responses
type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

// Usage
const fetchOrders = async (): Promise<ApiResponse<Order[]>> => {
  const response = await fetch('/api/orders');
  return response.json();
};
```

### Component Composition

#### Compound Component Pattern

```typescript
// Create compound components for complex UI elements
const Table = ({ children, ...props }) => <table {...props}>{children}</table>;
const TableHeader = ({ children, ...props }) => <thead {...props}>{children}</thead>;
const TableBody = ({ children, ...props }) => <tbody {...props}>{children}</tbody>;
const TableRow = ({ children, ...props }) => <tr {...props}>{children}</tr>;
const TableHead = ({ children, ...props }) => <th {...props}>{children}</th>;
const TableCell = ({ children, ...props }) => <td {...props}>{children}</td>;

// Usage
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### Render Props Pattern

```typescript
// Use render props for flexible component composition
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  renderRow?: (item: T) => React.ReactNode;
}

function DataTable<T>({ data, columns, renderRow }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.title}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            {renderRow ? renderRow(item) : (
              columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render ? column.render(item) : item[column.key]}
                </TableCell>
              ))
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Custom Hooks for Reusability

#### Data Fetching Hook

```typescript
// Custom hook for data fetching with error handling
function useApiData<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, JSON.stringify(options)]);

  return { data, loading, error, refetch: () => fetchData() };
}

// Usage
function OrdersPage() {
  const { data: orders, loading, error } = useApiData<Order[]>('/api/orders');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <OrdersList orders={orders} />;
}
```

#### Form Management Hook

```typescript
// Custom hook for form management
function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: any
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const setFieldTouched = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validate = () => {
    if (!validationSchema) return true;
    
    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        err.errors.forEach((error) => {
          newErrors[error.path[0] as keyof T] = error.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}
```

### Error Boundaries

```typescript
// Comprehensive error boundary with fallback UI
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error reporting service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <Card className="bento-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex gap-2">
              <Button onClick={this.resetError} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

### Accessibility with Radix UI

```typescript
// Accessible dialog component
const AccessibleDialog = ({ children, open, onOpenChange }: DialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This dialog provides accessible content with proper ARIA attributes.
          </DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### Performance Optimization

#### Memoization Patterns

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data, onUpdate }: Props) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: expensiveCalculation(item),
    }));
  }, [data]);

  return (
    <div>
      {processedData.map(item => (
        <ItemComponent key={item.id} item={item} onUpdate={onUpdate} />
      ))}
    </div>
  );
});

// Use useCallback for event handlers
function ParentComponent() {
  const [items, setItems] = useState([]);
  
  const handleUpdate = useCallback((id: string, updates: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  return <ExpensiveComponent data={items} onUpdate={handleUpdate} />;
}
```

#### Lazy Loading

```typescript
// Lazy load components for better performance
const LazyAnalytics = lazy(() => import('@/pages/analytics'));
const LazyInventory = lazy(() => import('@/pages/inventory'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/analytics" component={LazyAnalytics} />
        <Route path="/inventory" component={LazyInventory} />
      </Switch>
    </Suspense>
  );
}
```

---

## 10. Common Challenges and Solutions

### Type Safety with API Responses

#### Challenge: Ensuring API response types match frontend expectations

**Problem:**
```typescript
// Backend returns different structure than expected
const response = await fetch('/api/orders');
const orders = await response.json(); // Type is 'any'
```

**Solution:**
```typescript
// Define API response types
type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

// Create typed API functions
async function fetchOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders');
  const result: ApiResponse<Order[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch orders');
  }
  
  return result.data;
}

// Usage with proper typing
const orders: Order[] = await fetchOrders();
```

### State Synchronization

#### Challenge: Keeping local state in sync with server state

**Problem:**
```typescript
// Local state gets out of sync with server
const [orders, setOrders] = useState([]);

const deleteOrder = async (id) => {
  await api.deleteOrder(id);
  setOrders(orders.filter(o => o.id !== id)); // Might be stale
};
```

**Solution:**
```typescript
// Use TanStack Query for automatic synchronization
const { data: orders, refetch } = useQuery({
  queryKey: ['orders'],
  queryFn: fetchOrders,
});

const deleteOrderMutation = useMutation({
  mutationFn: deleteOrder,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});

// Or use optimistic updates
const deleteOrderMutation = useMutation({
  mutationFn: deleteOrder,
  onMutate: async (orderId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['orders'] });
    
    // Snapshot previous value
    const previousOrders = queryClient.getQueryData(['orders']);
    
    // Optimistically update
    queryClient.setQueryData(['orders'], (old: Order[]) => 
      old.filter(order => order.id !== orderId)
    );
    
    return { previousOrders };
  },
  onError: (err, orderId, context) => {
    // Rollback on error
    queryClient.setQueryData(['orders'], context.previousOrders);
  },
});
```

### Form Validation

#### Challenge: Complex form validation with multiple fields

**Problem:**
```typescript
// Manual validation is error-prone and repetitive
const [errors, setErrors] = useState({});

const validateForm = () => {
  const newErrors = {};
  if (!formData.name) newErrors.name = 'Name is required';
  if (!formData.email) newErrors.email = 'Email is required';
  if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email';
  // ... more validation
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Solution:**
```typescript
// Use Zod for schema validation
import { z } from 'zod';

const orderSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  serviceIds: z.array(z.string()).min(1, 'At least one service is required'),
  pickupDate: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

// Use with React Hook Form
function OrderForm() {
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      serviceIds: [],
    },
  });

  const onSubmit = (data: OrderFormData) => {
    // Data is guaranteed to be valid
    createOrder(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields */}
      </form>
    </Form>
  );
}
```

### Error Handling Patterns

#### Challenge: Consistent error handling across the application

**Problem:**
```typescript
// Inconsistent error handling
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  console.error(error); // Not user-friendly
}
```

**Solution:**
```typescript
// Centralized error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error handling utility
async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Log error for debugging
    console.error('API Error:', error);
    
    // Throw user-friendly error
    throw new ApiError(errorMessage, 500);
  }
}

// Usage with toast notifications
const { toast } = useToast();

const handleAction = async () => {
  try {
    await handleApiCall(
      () => api.deleteOrder(orderId),
      'Failed to delete order'
    );
    toast({ title: 'Order deleted successfully' });
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }
};
```

### Build Optimization

#### Challenge: Large bundle sizes affecting performance

**Problem:**
```typescript
// Importing entire libraries
import * as lodash from 'lodash';
import { Chart } from 'recharts';
```

**Solution:**
```typescript
// Tree-shakeable imports
import { debounce } from 'lodash/debounce';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

// Dynamic imports for code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Bundle analysis
// Add to package.json scripts:
// "analyze": "npx vite-bundle-analyzer"

// Vite configuration for optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
        },
      },
    },
  },
});
```

### Memory Leaks Prevention

#### Challenge: Preventing memory leaks in React components

**Problem:**
```typescript
// Memory leak from uncleaned subscriptions
useEffect(() => {
  const subscription = eventEmitter.subscribe(handleEvent);
  // Missing cleanup
}, []);
```

**Solution:**
```typescript
// Proper cleanup in useEffect
useEffect(() => {
  const subscription = eventEmitter.subscribe(handleEvent);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Cleanup timers
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);
  
  return () => clearInterval(timer);
}, []);

// Cleanup event listeners
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

---

## 11. Conclusion

### Summary of Key Takeaways

The FabClean frontend architecture demonstrates a modern, scalable approach to building React applications with TypeScript. Key architectural decisions include:

1. **Component-Based Architecture**: Promotes reusability and maintainability through well-structured component hierarchies
2. **TypeScript Integration**: Provides compile-time safety and better developer experience
3. **Modern State Management**: TanStack Query for server state, React hooks for local state
4. **Utility-First Styling**: Tailwind CSS with Shadcn UI for consistent, accessible design
5. **Lightweight Routing**: Wouter provides fast, simple client-side routing
6. **Performance Optimization**: Lazy loading, memoization, and proper cleanup patterns

### Architecture Benefits

#### Scalability
- **Modular Structure**: Easy to add new features and components
- **Type Safety**: Prevents runtime errors and improves maintainability
- **Code Splitting**: Reduces initial bundle size and improves performance

#### Developer Experience
- **Hot Reloading**: Fast development with Vite
- **TypeScript Support**: Better IDE integration and error detection
- **Component Library**: Consistent UI components with Shadcn UI

#### User Experience
- **Responsive Design**: Works across all device sizes
- **Accessibility**: Built-in accessibility with Radix UI primitives
- **Performance**: Optimized loading and rendering

### How to Adapt for Other Projects

#### 1. Template Structure
Use this architecture as a template by:
- Copying the component structure and patterns
- Adapting the routing configuration for your domain
- Customizing the design system and theme
- Modifying the state management patterns

#### 2. Key Components to Reuse
- **Layout System**: MainLayout with sidebar and header
- **Component Library**: Shadcn UI components with custom styling
- **State Management**: TanStack Query configuration and patterns
- **Form Handling**: React Hook Form with Zod validation
- **Error Handling**: Error boundaries and API error patterns

#### 3. Customization Points
- **Theme System**: Modify CSS variables and Tailwind configuration
- **Routing**: Add protected routes and nested routing
- **API Integration**: Adapt API patterns for your backend
- **Component Library**: Extend Shadcn UI with custom components

#### 4. Development Workflow
1. **Start Simple**: Begin with basic components and routing
2. **Add TypeScript**: Gradually add type definitions
3. **Implement State Management**: Add TanStack Query for data fetching
4. **Enhance UI**: Customize design system and add animations
5. **Optimize Performance**: Implement lazy loading and code splitting

### Final Recommendations

#### For New Projects
1. **Use This Architecture**: It provides a solid foundation for most React applications
2. **Start with TypeScript**: Type safety from the beginning prevents many issues
3. **Implement Error Boundaries**: Catch and handle errors gracefully
4. **Follow Component Patterns**: Use compound components and custom hooks
5. **Plan for Performance**: Consider bundle size and loading strategies

#### For Existing Projects
1. **Gradual Migration**: Move to this pattern incrementally
2. **Add TypeScript**: Start with strict type checking
3. **Refactor Components**: Break down large components into smaller ones
4. **Implement State Management**: Add TanStack Query for better data handling
5. **Improve Accessibility**: Use Radix UI primitives for accessible components

This frontend architecture provides a robust, scalable foundation that can be adapted for various business domains while maintaining consistency, performance, and developer productivity. The patterns and practices demonstrated here represent modern React development best practices and can be confidently applied to new development efforts.

---

*This documentation serves as a comprehensive guide for understanding, implementing, and adapting the FabClean frontend architecture for other projects. The patterns, practices, and code examples provided here represent industry best practices and can be confidently applied to new development efforts.*
