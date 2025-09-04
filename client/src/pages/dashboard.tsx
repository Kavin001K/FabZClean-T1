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
    <div className="p-8" data-testid="dashboard-page">
      {/* KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart - spans 2 columns */}
        <SalesChart />
        
        {/* Recent Orders */}
        <RecentOrders />
        
        {/* Inventory Status */}
        <InventoryStatus />
        
        {/* Delivery Tracking */}
        <DeliveryTracking />
        
        {/* POS Integration */}
        <POSIntegration />
      </div>
    </div>
  );
}
