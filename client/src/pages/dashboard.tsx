import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingBag, Truck, RotateCcw } from "lucide-react";
import KPICard from "@/components/dashboard/kpi-card";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import InventoryStatus from "@/components/dashboard/inventory-status";
import DeliveryTracking from "@/components/dashboard/delivery-tracking";
import POSIntegration from "@/components/dashboard/pos-integration";
import { formatCurrency, formatPercentage } from "@/lib/data";

interface DashboardMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  onTimeDelivery: number;
  inventoryTurnover: number;
  ordersToday: number;
  posTransactionsToday: number;
  dailyRevenue: number;
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  return (
    <div className="p-8 animate-fade-in" data-testid="dashboard-page">
      {/* Command Center Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-expressive text-4xl text-foreground mb-2">
              Unified Command Center
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time business intelligence and operational oversight
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="status-indicator-enhanced bg-green-500"></div>
            <span className="text-sm font-medium text-foreground">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* KPI Banner - Enhanced Bento Box Layout */}
      <div className="kpi-banner animate-slide-up">
        <KPICard
          title="Total Revenue"
          value={metrics ? formatCurrency(metrics.totalRevenue) : "$0"}
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-primary"
          subtitle="vs. last month"
        />
        <KPICard
          title="Average Order Value"
          value={metrics ? formatCurrency(metrics.averageOrderValue) : "$0"}
          change="+8.2%"
          changeType="positive"
          icon={ShoppingBag}
          iconColor="text-blue-600 dark:text-blue-400"
          subtitle="vs. last month"
        />
        <KPICard
          title="On-Time Delivery"
          value={metrics ? formatPercentage(metrics.onTimeDelivery) : "0%"}
          change={formatPercentage(metrics?.onTimeDelivery || 0)}
          changeType="positive"
          icon={Truck}
          iconColor="text-green-600 dark:text-green-400"
          subtitle="7-day average"
        />
        <KPICard
          title="Inventory Turnover"
          value={metrics ? `${metrics.inventoryTurnover}x` : "0x"}
          change="-2.1%"
          changeType="negative"
          icon={RotateCcw}
          iconColor="text-purple-600 dark:text-purple-400"
          subtitle="monthly rate"
        />
      </div>

      {/* Main Command Center Grid - Enhanced Bento Box Layout */}
      <div className="command-center-grid animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Sales Chart - Primary Focus Area */}
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        
        {/* Live Order Feed */}
        <RecentOrders />
        
        {/* Inventory Intelligence */}
        <InventoryStatus />
        
        {/* Logistics Snapshot */}
        <DeliveryTracking />
        
        {/* POS Integration Hub */}
        <POSIntegration />
      </div>
    </div>
  );
}
