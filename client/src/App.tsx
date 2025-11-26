import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { NotificationProvider } from "@/hooks/use-notifications";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { AuthProvider } from "@/contexts/auth-context";
import ErrorBoundary from "@/components/ui/error-boundary";
import { ProtectedRoute } from "@/components/auth/protected-route";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import UnauthorizedPage from "@/pages/unauthorized";
import AccountInactivePage from "@/pages/account-inactive";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Services from "@/pages/services";
import CreateOrder from "@/pages/create-order";
import Tracking from "@/pages/tracking";
import LiveTracking from "@/pages/live-tracking";
import Documents from "@/pages/documents";
import Customers from "@/pages/customers";
import Analytics from "@/pages/analytics";
import { MainLayout } from "@/components/layout/main-layout";
import Inventory from "@/pages/inventory";
import Logistics from "@/pages/logistics";
import TransitOrders from "@/pages/transit-orders";
import DebugPage from "@/pages/debug";
import EmployeeDashboardPage from "@/pages/employee-dashboard";
import UserManagementPage from "@/pages/user-management";
import FranchiseDashboard from "@/pages/franchise-dashboard";
import Settings from "@/pages/settings";
import DatabaseStatus from "@/pages/database-status";
import PerformanceAnalytics from "@/components/analytics";
import Accounting from "@/pages/accounting";
import { InvoiceGenerator } from "@/components/invoice-generator";
import CustomerPortal from "@/pages/customer-portal";
import WorkerPortal from "@/pages/worker-portal";
import BillView from "@/pages/bill-view";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/unauthorized" component={UnauthorizedPage}
      />
      <Route path="/account-inactive" component={AccountInactivePage} />
      <Route path="/bill/:orderNumber" component={BillView} />

      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/orders">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager', 'factory_manager']}>
          <MainLayout>
            <Orders />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/orders/:id">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager', 'factory_manager']}>
          <MainLayout>
            <OrderDetail />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/inventory">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager', 'factory_manager']}>
          <MainLayout>
            <Inventory />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/customers">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager']}>
          <MainLayout>
            <Customers />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/analytics">
        <ProtectedRoute allowedRoles={['admin', 'franchise_manager', 'factory_manager']}>
          <MainLayout>
            <Analytics />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/services">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager']}>
          <MainLayout>
            <Services />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/create-order">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager']}>
          <MainLayout>
            <CreateOrder />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/tracking">
        <ProtectedRoute>
          <MainLayout>
            <Tracking />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/live-tracking">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager', 'driver']}>
          <MainLayout>
            <LiveTracking />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/documents">
        <ProtectedRoute>
          <MainLayout>
            <Documents />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/accounting">
        <ProtectedRoute allowedRoles={['admin', 'franchise_manager']}>
          <MainLayout>
            <Accounting />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/logistics">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager']}>
          <MainLayout>
            <Logistics />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/transit-orders">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager', 'factory_manager']}>
          <MainLayout>
            <TransitOrders />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/employee-dashboard">
        <ProtectedRoute allowedRoles={['employee']}>
          <MainLayout>
            <EmployeeDashboardPage />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/users">
        <ProtectedRoute allowedRoles={['admin', 'franchise_manager', 'factory_manager']}>
          <MainLayout>
            <UserManagementPage />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/franchise-dashboard">
        <ProtectedRoute allowedRoles={['franchise_manager']}>
          <MainLayout>
            <FranchiseDashboard />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/database-status">
        <ProtectedRoute allowedRoles={['admin']}>
          <MainLayout>
            <DatabaseStatus />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/debug">
        <ProtectedRoute allowedRoles={['admin']}>
          <MainLayout>
            <DebugPage />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/invoice-generator">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager']}>
          <MainLayout>
            <InvoiceGenerator />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/customer-portal">
        <ProtectedRoute allowedRoles={['customer']}>
          <MainLayout>
            <CustomerPortal />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/worker-portal">
        <ProtectedRoute allowedRoles={['driver', 'employee']}>
          <MainLayout>
            <WorkerPortal />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Error handler for the global error boundary
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Global Error Boundary caught:', error);
      console.error('Error Info:', errorInfo);
    }

    // In production, you might want to send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
  };

  return (
    <ErrorBoundary
      onError={handleError}
      resetOnPropsChange={true}
    >
      <QueryClientProvider client={queryClient}>
        {/* Nest additional error boundaries for critical sections */}
        <ErrorBoundary>
          <AuthProvider>
            <RealtimeProvider>
              <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
                <TooltipProvider>
                  <NotificationProvider>
                    <Toaster />
                    <ErrorBoundary>
                      <Router />
                    </ErrorBoundary>
                    <ErrorBoundary>
                      <PerformanceAnalytics />
                    </ErrorBoundary>
                  </NotificationProvider>
                </TooltipProvider>
              </ThemeProvider>
            </RealtimeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
