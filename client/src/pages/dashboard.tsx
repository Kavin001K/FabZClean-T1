import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingBag, Truck, RotateCcw, Plus, BarChart3, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import KPICard from "@/components/dashboard/kpi-card";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import ServiceStatus from "@/components/dashboard/inventory-status";
import DeliveryTracking from "@/components/dashboard/delivery-tracking";
import POSIntegration from "@/components/dashboard/pos-integration";
import { KPISkeleton } from "@/components/ui/loading-skeleton";
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

  if (isLoading) {
    return (
      <div className="p-2 sm:p-4 lg:p-6 animate-fade-in max-w-full" data-testid="dashboard-page">
        {/* Quick Actions Panel - Loading State */}
        <div className="mb-4 p-3 sm:p-4 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted rounded-full animate-pulse"></div>
              <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-lg animate-pulse"></div>
                <div className="h-3 w-12 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Compact Header - Loading State */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-5 w-48 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 w-64 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* KPI Banner - Loading State */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 mb-4">
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
        </div>

        {/* Compact Status Bar - Loading State */}
        <div className="mb-4 p-2 sm:p-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-500 dark:to-blue-500 border border-green-300 dark:border-green-400 rounded-lg shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted rounded-full animate-pulse"></div>
              <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Wide Main Dashboard Grid - Loading State */}
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
          <div className="lg:col-span-3 xl:col-span-4 2xl:col-span-5">
            <div className="bento-card">
              <div className="p-3 sm:p-4">
                <div className="h-4 w-32 bg-muted rounded animate-pulse mb-3"></div>
                <div className="h-64 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3 space-y-3 sm:space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bento-card">
                <div className="p-3 sm:p-4">
                  <div className="h-4 w-1/2 mb-3 bg-muted rounded animate-pulse"></div>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-3 w-3/4 bg-muted rounded animate-pulse mb-1"></div>
                          <div className="h-2 w-1/2 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 animate-fade-in dashboard-content max-w-full" data-testid="dashboard-page">
      {/* Compact Quick Actions Panel - Optimized for Space */}
      <div className="mb-4 p-3 sm:p-4 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Frequently used operations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-indicator-enhanced bg-green-500"></div>
            <span className="text-xs text-foreground">All Systems Operational</span>
          </div>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-3">
          <Button 
            className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-accent transition-colors"
            onClick={() => window.location.href = '/pos'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            </div>
            <span className="text-xs font-medium">New Order</span>
          </Button>
          
          <Button 
            className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-accent transition-colors"
            onClick={() => window.location.href = '/tracking'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <span className="text-xs font-medium">Track</span>
          </Button>
          
          <Button 
            className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-accent transition-colors"
            onClick={() => window.location.href = '/analytics'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
            </div>
            <span className="text-xs font-medium">Revenue</span>
          </Button>
          
          <Button 
            className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-accent transition-colors"
            onClick={() => window.location.href = '/pos'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
            </div>
            <span className="text-xs font-medium">POS</span>
          </Button>
          
          <Button 
            className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-accent transition-colors"
            onClick={() => window.location.href = '/analytics'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
            </div>
            <span className="text-xs font-medium">Analytics</span>
          </Button>
          
          <Button 
            className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-accent transition-colors"
            onClick={() => window.location.href = '/customers'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-teal-500" />
            </div>
            <span className="text-xs font-medium">Customers</span>
          </Button>
          
          <Button 
            className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-accent transition-colors"
            onClick={() => window.location.href = '/services'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
            </div>
            <span className="text-xs font-medium">Services</span>
          </Button>
          
          <Button 
            className="h-auto p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-accent transition-colors"
            onClick={() => window.location.href = '/orders'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-500/10 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
            </div>
            <span className="text-xs font-medium">Orders</span>
          </Button>
        </div>
      </div>

      {/* Compact Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Operations Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Real-time business intelligence</p>
          </div>
        </div>
      </div>

      {/* Wide KPI Banner - Optimized for Horizontal Space */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 mb-4 animate-slide-up">
        <KPICard
          title="Total Revenue"
          value={metrics ? formatCurrency(metrics.totalRevenue) : "₹0"}
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-primary"
          subtitle="vs. last month"
          details={{
            description: "Total revenue generated from all dry cleaning services, including walk-in customers, online orders, and corporate clients.",
            insights: [
              "Revenue increased by ₹45,000 compared to last month",
              "Corporate clients contribute 35% of total revenue",
              "Weekend orders show 25% higher average value",
              "Express service premium pricing drives 18% revenue growth"
            ],
            trends: [
              { period: "This Month", value: 991350, change: 12.5 },
              { period: "Last Month", value: 881200, change: 8.2 },
              { period: "3 Months Ago", value: 756800, change: -2.1 }
            ],
            recommendations: [
              "Consider expanding express service hours to capture more weekend revenue",
              "Implement loyalty program for corporate clients to increase retention",
              "Analyze peak hours to optimize staffing and service delivery"
            ]
          }}
        />
        <KPICard
          title="Avg Order Value"
          value={metrics ? formatCurrency(metrics.averageOrderValue) : "₹0"}
          change="+8.2%"
          changeType="positive"
          icon={ShoppingBag}
          iconColor="text-blue-600 dark:text-blue-400"
          subtitle="vs. last month"
          details={{
            description: "Average monetary value per customer order, indicating customer spending patterns and service mix preferences.",
            insights: [
              "AOV increased due to premium service upgrades",
              "Wedding dress cleaning drives highest AOV",
              "Bulk orders from corporate clients average ₹2,500",
              "Seasonal variations show 15% higher AOV in winter"
            ],
            trends: [
              { period: "This Month", value: 1850, change: 8.2 },
              { period: "Last Month", value: 1710, change: 5.1 },
              { period: "3 Months Ago", value: 1625, change: -1.8 }
            ],
            recommendations: [
              "Promote premium services during peak seasons",
              "Create bundled service packages to increase AOV",
              "Implement upselling strategies at POS"
            ]
          }}
        />
        <KPICard
          title="On-Time Delivery"
          value={metrics ? formatPercentage(metrics.onTimeDelivery) : "0%"}
          change={formatPercentage(metrics?.onTimeDelivery || 0)}
          changeType="positive"
          icon={Truck}
          iconColor="text-green-600 dark:text-green-400"
          subtitle="7-day average"
          details={{
            description: "Percentage of orders delivered within the promised timeframe, reflecting operational efficiency and customer satisfaction.",
            insights: [
              "On-time delivery improved by 5% this month",
              "Express orders have 95% on-time delivery rate",
              "Weather delays affected 3% of deliveries last week",
              "Route optimization reduced delivery time by 12 minutes"
            ],
            trends: [
              { period: "This Week", value: 94, change: 2.1 },
              { period: "Last Week", value: 92, change: 1.8 },
              { period: "3 Weeks Ago", value: 89, change: -1.2 }
            ],
            recommendations: [
              "Implement real-time tracking for customer transparency",
              "Optimize delivery routes using GPS data",
              "Establish backup delivery partners for peak periods"
            ]
          }}
        />
        <KPICard
          title="Service Efficiency"
          value={metrics ? `${metrics.inventoryTurnover}x` : "0x"}
          change="-2.1%"
          changeType="negative"
          icon={RotateCcw}
          iconColor="text-purple-600 dark:text-purple-400"
          subtitle="monthly rate"
          details={{
            description: "Service efficiency metric measuring how quickly orders are processed and completed, indicating operational productivity.",
            insights: [
              "Service efficiency decreased due to equipment maintenance",
              "New staff training reduced efficiency by 8% temporarily",
              "Automated processes improved efficiency by 12%",
              "Peak hours show 20% lower efficiency due to volume"
            ],
            trends: [
              { period: "This Month", value: 4.2, change: -2.1 },
              { period: "Last Month", value: 4.3, change: 1.5 },
              { period: "3 Months Ago", value: 4.1, change: 0.8 }
            ],
            recommendations: [
              "Complete equipment maintenance schedule",
              "Implement cross-training for staff flexibility",
              "Optimize workflow during peak hours"
            ]
          }}
        />
      </div>

      {/* Compact Status Bar */}
      <div className="mb-4 p-2 sm:p-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-500 dark:to-blue-500 border border-green-300 dark:border-green-400 rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 dark:bg-white rounded-full animate-pulse"></div>
            <span className="text-xs text-green-900 dark:text-white font-semibold">Live Updates</span>
            <span className="text-xs text-green-800 dark:text-white">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 text-xs text-green-900 dark:text-white font-semibold">
            <span>Orders Today: {metrics?.ordersToday || 0}</span>
            <span>POS: {metrics?.posTransactionsToday || 0}</span>
            <span>Revenue: {metrics ? formatCurrency(metrics.dailyRevenue) : "₹0"}</span>
          </div>
        </div>
      </div>

      {/* Wide Main Dashboard Grid - Maximum Horizontal Space Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Sales Chart - Wide Primary Focus Area */}
        <div className="lg:col-span-3 xl:col-span-4 2xl:col-span-5">
          <SalesChart />
        </div>
        
        {/* Compact Sidebar Cards */}
        <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-3 space-y-3 sm:space-y-4">
          <RecentOrders />
          <ServiceStatus />
          <DeliveryTracking />
          <POSIntegration />
        </div>
      </div>
    </div>
  );
}
