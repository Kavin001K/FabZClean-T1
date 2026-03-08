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
const CreateOrder = lazy(() => retryDynamicImport(() => import("@/pages/create-order")));
const Customers = lazy(() => retryDynamicImport(() => import("@/pages/customers")));
const Services = lazy(() => retryDynamicImport(() => import("@/pages/services")));
const PrintQueue = lazy(() => retryDynamicImport(() => import("@/pages/print-queue")));
const UserManagement = lazy(() => retryDynamicImport(() => import("@/pages/user-management")));
const WalletManagement = lazy(() => retryDynamicImport(() => import("@/pages/wallet-management")));

const Settings = lazy(() => retryDynamicImport(() => import("@/pages/settings")));
const PerformanceAnalytics = lazy(() => retryDynamicImport(() => import("@/components/analytics")));
const BillView = lazy(() => retryDynamicImport(() => import("@/pages/bill-view")));

const OrderTracking = lazy(() => retryDynamicImport(() => import("@/pages/order-tracking")));
const TermsPage = lazy(() => retryDynamicImport(() => import("@/pages/terms")));
const PrivacyPage = lazy(() => retryDynamicImport(() => import("@/pages/privacy")));
const RefundPage = lazy(() => retryDynamicImport(() => import("@/pages/refund")));
const CookiesPage = lazy(() => retryDynamicImport(() => import("@/pages/cookies")));
const PublicOrderTracking = lazy(() => retryDynamicImport(() => import("@/pages/public-order-tracking")));
const ProfilePage = lazy(() => retryDynamicImport(() => import("@/pages/profile")));
const DeliveriesManagement = lazy(() => retryDynamicImport(() => import("@/pages/deliveries-management")));
const DeliveryHome = lazy(() => retryDynamicImport(() => import("@/pages/delivery-home")));
const DeliveryHistory = lazy(() => retryDynamicImport(() => import("@/pages/delivery-history")));

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
      <Route path="/unauthorized" component={UnauthorizedPage} />
      <Route path="/account-inactive" component={AccountInactivePage} />
      <Route path="/bill/:orderNumber" component={BillView} />
      <Route path="/tracking/:id" component={OrderTracking} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/refund" component={RefundPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/trackorder" component={PublicOrderTracking} />
      <Route path="/trackorder/:orderNumber" component={PublicOrderTracking} />

      {/* Protected routes - all authenticated users */}
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
        <ProtectedRoute>
          <MainLayout>
            <Orders />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/orders/:id">
        <ProtectedRoute>
          <MainLayout>
            <OrderDetail />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/create-order">
        <ProtectedRoute>
          <MainLayout>
            <CreateOrder />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/customers">
        <ProtectedRoute>
          <MainLayout>
            <Customers />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/wallet-management">
        <ProtectedRoute>
          <MainLayout>
            <WalletManagement />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/credits">
        <ProtectedRoute>
          <MainLayout>
            <WalletManagement />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/services">
        <ProtectedRoute>
          <MainLayout>
            <Services />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/user-management">
        <ProtectedRoute allowedRoles={["admin"]}>
          <MainLayout>
            <UserManagement />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/print-queue">
        <ProtectedRoute>
          <MainLayout>
            <PrintQueue />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/deliveries">
        <ProtectedRoute>
          <MainLayout>
            <DeliveriesManagement />
          </MainLayout>
        </ProtectedRoute>
      </Route>

      {/* Delivery Partner Routes (mobile-first, no sidebar) */}
      <Route path="/delivery-home">
        <ProtectedRoute>
          <DeliveryHome />
        </ProtectedRoute>
      </Route>

      <Route path="/delivery-history">
        <ProtectedRoute>
          <DeliveryHistory />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <MainLayout>
            <Settings />
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
