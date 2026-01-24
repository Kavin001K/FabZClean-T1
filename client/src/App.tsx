import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { NotificationProvider } from "@/hooks/use-notifications";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { AuthProvider } from "@/contexts/auth-context";
import ErrorBoundary from "@/components/ui/error-boundary";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { retryDynamicImport } from "@/lib/dynamic-import";
import { UpdatePrompt } from "@/components/update-prompt";
import { ShortcutsProvider } from "@/components/shortcuts-provider";

// Critical pages - loaded immediately
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import UnauthorizedPage from "@/pages/unauthorized";
import AccountInactivePage from "@/pages/account-inactive";
import Dashboard from "@/pages/dashboard";
import { MainLayout } from "@/components/layout/main-layout";

// Lazy loaded pages - loaded on demand with automatic retry/refresh on chunk load failures
const Orders = lazy(() => retryDynamicImport(() => import("@/pages/orders")));
const OrderDetail = lazy(() => retryDynamicImport(() => import("@/pages/order-detail")));
const Services = lazy(() => retryDynamicImport(() => import("@/pages/services")));
const CreateOrder = lazy(() => retryDynamicImport(() => import("@/pages/create-order")));
const POSPage = lazy(() => retryDynamicImport(() => import("@/pages/pos")));
const Documents = lazy(() => retryDynamicImport(() => import("@/pages/documents")));
const Customers = lazy(() => retryDynamicImport(() => import("@/pages/customers")));
const Analytics = lazy(() => retryDynamicImport(() => import("@/pages/analytics")));
const Inventory = lazy(() => retryDynamicImport(() => import("@/pages/inventory")));
const TransitOrders = lazy(() => retryDynamicImport(() => import("@/pages/transit-orders")));

const EmployeeDashboardPage = lazy(() => retryDynamicImport(() => import("@/pages/employee-dashboard")));
const FactoryDashboard = lazy(() => retryDynamicImport(() => import("@/pages/factory-dashboard")));
const UserManagementPage = lazy(() => retryDynamicImport(() => import("@/pages/user-management")));
const FranchiseDashboard = lazy(() => retryDynamicImport(() => import("@/pages/franchise-dashboard")));
const FranchiseManagement = lazy(() => retryDynamicImport(() => import("@/pages/franchise-management")));
const Settings = lazy(() => retryDynamicImport(() => import("@/pages/settings")));
const ProfilePage = lazy(() => retryDynamicImport(() => import("@/pages/profile")));
const DatabaseStatus = lazy(() => retryDynamicImport(() => import("@/pages/database-status")));
const PerformanceAnalytics = lazy(() => retryDynamicImport(() => import("@/components/analytics")));
const Credits = lazy(() => retryDynamicImport(() => import("@/pages/credits")));
const InvoiceGenerator = lazy(() => retryDynamicImport(() => import("@/components/invoice-generator").then(m => ({ default: m.InvoiceGenerator }))));
const CustomerPortal = lazy(() => retryDynamicImport(() => import("@/pages/customer-portal")));
const WorkerPortal = lazy(() => retryDynamicImport(() => import("@/pages/worker-portal")));
const BillView = lazy(() => retryDynamicImport(() => import("@/pages/bill-view")));

const AuditLogsPage = lazy(() => retryDynamicImport(() => import("@/pages/admin/audit-logs")));
const ReportsPage = lazy(() => retryDynamicImport(() => import("@/pages/reports")));
const BusinessIntelligence = lazy(() => retryDynamicImport(() => import("@/pages/business-intelligence")));
const OrderTracking = lazy(() => retryDynamicImport(() => import("@/pages/order-tracking")));
const TermsPage = lazy(() => retryDynamicImport(() => import("@/pages/terms")));
const PrivacyPage = lazy(() => retryDynamicImport(() => import("@/pages/privacy")));
const RefundPage = lazy(() => retryDynamicImport(() => import("@/pages/refund")));
const CookiesPage = lazy(() => retryDynamicImport(() => import("@/pages/cookies")));
const PublicOrderTracking = lazy(() => retryDynamicImport(() => import("@/pages/public-order-tracking")));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/unauthorized" component={UnauthorizedPage}
      />
      <Route path="/account-inactive" component={AccountInactivePage} />
      <Route path="/bill/:orderNumber" component={BillView} />
      <Route path="/tracking/:id" component={OrderTracking} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/refund" component={RefundPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/trackorder" component={PublicOrderTracking} />
      <Route path="/trackorder/:orderNumber" component={PublicOrderTracking} />

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
        <ProtectedRoute allowedRoles={['admin', 'factory_manager']}>
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

      <Route path="/business-intelligence">
        <ProtectedRoute allowedRoles={['admin', 'franchise_manager']}>
          <MainLayout>
            <BusinessIntelligence />
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

      <Route path="/pos">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager']}>
          <POSPage />
        </ProtectedRoute>
      </Route>

      <Route path="/create-order">
        <ProtectedRoute allowedRoles={['admin', 'employee', 'franchise_manager']}>
          <MainLayout>
            <CreateOrder />
          </MainLayout>
        </ProtectedRoute>
      </Route>



      <Route path="/profile">
        <ProtectedRoute>
          <MainLayout>
            <ProfilePage />
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



      <Route path="/credits">
        <ProtectedRoute allowedRoles={['admin', 'factory_manager', 'franchise_manager']}>
          <MainLayout>
            <Credits />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute allowedRoles={['admin', 'franchise_manager']}>
          <MainLayout>
            <ReportsPage />
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
        <ProtectedRoute allowedRoles={['employee', 'driver', 'staff']}>
          <MainLayout>
            <EmployeeDashboardPage />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/factory-dashboard">
        <ProtectedRoute allowedRoles={['factory_manager']}>
          <MainLayout>
            <FactoryDashboard />
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

      <Route path="/franchise-management">
        <ProtectedRoute allowedRoles={['admin']}>
          <MainLayout>
            <FranchiseManagement />
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



      <Route path="/admin/audit-logs">
        <ProtectedRoute allowedRoles={['admin', 'franchise_manager']}>
          <MainLayout>
            <AuditLogsPage />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch >
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
            <SettingsProvider>
              <RealtimeProvider>
                <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
                  <TooltipProvider>
                    <NotificationProvider>
                      <ShortcutsProvider>
                        <Toaster />
                        <UpdatePrompt />
                        <Suspense fallback={<PageLoader />}>
                          <ErrorBoundary>
                            <Router />
                          </ErrorBoundary>
                          <ErrorBoundary>
                            <PerformanceAnalytics />
                          </ErrorBoundary>
                        </Suspense>
                      </ShortcutsProvider>
                    </NotificationProvider>
                  </TooltipProvider>
                </ThemeProvider>
              </RealtimeProvider>
            </SettingsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
