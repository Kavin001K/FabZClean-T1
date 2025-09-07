import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import ErrorBoundary from "@/components/ui/error-boundary";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Services from "@/pages/services";
import POS from "@/pages/pos";
import Tracking from "@/pages/tracking";
import Customers from "@/pages/customers";
import Analytics from "@/pages/analytics";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden main-content">
        <Header 
          sidebarCollapsed={sidebarCollapsed} 
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/orders" component={Orders} />
              <Route path="/services" component={Services} />
              <Route path="/pos" component={POS} />
              <Route path="/tracking" component={Tracking} />
              <Route path="/customers" component={Customers} />
              <Route path="/analytics" component={Analytics} />
              <Route component={NotFound} />
            </Switch>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
