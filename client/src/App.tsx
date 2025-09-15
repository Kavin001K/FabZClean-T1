import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { NotificationProvider } from "@/hooks/use-notifications";
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
import DebugPage from "@/pages/debug";
import EmployeeDashboardPage from "@/pages/employee-dashboard";
import DatabaseStatus from "@/pages/database-status";
import SpeedInsights from "@/components/speed-insights";

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
        <Route path="/logistics" component={Logistics} />
        <Route path="/employee-dashboard" component={EmployeeDashboardPage} />
        <Route path="/database-status" component={DatabaseStatus} />
        <Route path="/debug" component={DebugPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
        <TooltipProvider>
          <NotificationProvider>
            <Toaster />
            <Router />
            <SpeedInsights />
          </NotificationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
