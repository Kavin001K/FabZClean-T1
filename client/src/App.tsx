import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { NotificationProvider } from "@/hooks/use-notifications";
import ErrorBoundary from "@/components/ui/error-boundary";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
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
import DebugPage from "@/pages/debug";
import EmployeeDashboardPage from "@/pages/employee-dashboard";
import FranchiseDashboard from "@/pages/franchise-dashboard";
import Settings from "@/pages/settings";
import DatabaseStatus from "@/pages/database-status";
import PerformanceAnalytics from "@/components/analytics";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/customers" component={Customers} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/services" component={Services} />
        <Route path="/create-order" component={CreateOrder} />
        <Route path="/tracking" component={Tracking} />
        <Route path="/live-tracking" component={LiveTracking} />
        <Route path="/documents" component={Documents} />
        <Route path="/logistics" component={Logistics} />
        <Route path="/employee-dashboard" component={EmployeeDashboardPage} />
        <Route path="/franchise-dashboard" component={FranchiseDashboard} />
        <Route path="/settings" component={Settings} />
        <Route path="/database-status" component={DatabaseStatus} />
        <Route path="/debug" component={DebugPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
          <TooltipProvider>
            <NotificationProvider>
              <Toaster />
              <Router />
              <PerformanceAnalytics />
            </NotificationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
