import { eq, and, desc, asc, sql, count, sum, avg, gte, lte, between } from "drizzle-orm";
import { orders, customers, services, orderItems, employees, loyaltyTransactions } from "../../shared/schema";
import { db } from "../database";

export interface DashboardMetrics {
  // Core Business Metrics
  todayRevenue: number;
  todayOrders: number;
  weeklyRevenue: number;
  monthlyRevenue: number;

  // Operational Metrics
  averageProcessingTime: number;
  capacityUtilization: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;

  // Growth Metrics
  revenueGrowthRate: number;
  customerGrowthRate: number;
  orderGrowthRate: number;
  averageOrderValueGrowth: number;

  // Efficiency Metrics
  ordersPerEmployee: number;
  revenuePerEmployee: number;
  energyEfficiencyScore: number;
  resourceUtilizationRate: number;
}

export interface ProductionMetrics {
  totalCapacity: number;
  currentLoad: number;
  utilizationRate: number;
  bottleneckStations: Array<{
    station: string;
    utilization: number;
    waitingOrders: number;
    estimatedDelay: number;
  }>;
  productionEfficiency: number;
  qualityScore: number;
  throughputPerHour: number;
}

export interface DeliverySchedule {
  date: string;
  ordersToDeliver: number;
  estimatedRevenue: number;
  priorityOrders: number;
  deliveryRoute: string;
  estimatedTime: number;
  driverAssigned: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
}

export interface RealtimeData {
  activeOrders: number;
  pendingPickups: number;
  inProgress: number;
  readyForDelivery: number;
  todayPickups: number;
  todayDeliveries: number;
  currentRevenue: number;
  staffOnDuty: number;
  machineStatus: Array<{
    id: string;
    name: string;
    status: 'running' | 'idle' | 'maintenance' | 'offline';
    currentLoad: number;
    efficiency: number;
    nextMaintenance: Date;
  }>;
}

export interface FinancialAnalytics {
  revenue: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    trend: 'up' | 'down' | 'stable';
    growthRate: number;
  };
  costs: {
    operational: number;
    staff: number;
    utilities: number;
    maintenance: number;
    total: number;
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    margin: number;
    breakeven: number;
  };
  cashFlow: {
    incoming: number;
    outgoing: number;
    balance: number;
    forecast: number[];
  };
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomersToday: number;
  retentionRate: number;
  lifetimeValue: number;
  segmentDistribution: Array<{
    segment: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;
  satisfactionMetrics: {
    overallScore: number;
    responseRate: number;
    npsScore: number;
    commonComplaints: string[];
  };
}

export class DashboardAnalyticsService {

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Core metrics
    const [todayStats] = await db
      .select({
        revenue: sum(orders.totalAmount),
        orderCount: count(orders.id)
      })
      .from(orders)
      .where(gte(orders.createdAt, todayStart));

    const [weeklyStats] = await db
      .select({
        revenue: sum(orders.totalAmount)
      })
      .from(orders)
      .where(gte(orders.createdAt, weekStart));

    const [monthlyStats] = await db
      .select({
        revenue: sum(orders.totalAmount),
        orderCount: count(orders.id)
      })
      .from(orders)
      .where(gte(orders.createdAt, monthStart));

    const [lastMonthStats] = await db
      .select({
        revenue: sum(orders.totalAmount),
        orderCount: count(orders.id)
      })
      .from(orders)
      .where(between(orders.createdAt, lastMonthStart, lastMonthEnd));

    // Calculate growth rates
    const monthlyRevenue = parseFloat(monthlyStats?.revenue?.toString() || "0");
    const lastMonthRevenue = parseFloat(lastMonthStats?.revenue?.toString() || "0");
    const revenueGrowthRate = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // Operational metrics
    const [operationalStats] = await db
      .select({
        avgProcessingTime: avg(sql`EXTRACT(EPOCH FROM (${orders.actualCompletion} - ${orders.createdAt}))/3600`),
        onTimeDelivery: avg(sql`CASE WHEN ${orders.actualCompletion} <= ${orders.estimatedCompletion} THEN 1 ELSE 0 END`)
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, monthStart),
          eq(orders.status, "completed")
        )
      );

    // Employee productivity
    const [employeeStats] = await db
      .select({
        activeEmployees: count(employees.id),
        ordersPerEmployee: sql`${monthlyStats?.orderCount || 0}::float / COUNT(${employees.id})`,
        revenuePerEmployee: sql`${monthlyRevenue}::float / COUNT(${employees.id})`
      })
      .from(employees)
      .where(eq(employees.status, "active"));

    return {
      todayRevenue: parseFloat(todayStats?.revenue?.toString() || "0"),
      todayOrders: todayStats?.orderCount || 0,
      weeklyRevenue: parseFloat(weeklyStats?.revenue?.toString() || "0"),
      monthlyRevenue,

      averageProcessingTime: parseFloat(operationalStats?.avgProcessingTime?.toString() || "24"),
      capacityUtilization: await this.calculateCapacityUtilization(),
      onTimeDeliveryRate: parseFloat(operationalStats?.onTimeDelivery?.toString() || "0.85") * 100,
      customerSatisfactionScore: await this.calculateSatisfactionScore(),

      revenueGrowthRate,
      customerGrowthRate: await this.calculateCustomerGrowthRate(),
      orderGrowthRate: await this.calculateOrderGrowthRate(),
      averageOrderValueGrowth: await this.calculateAOVGrowth(),

      ordersPerEmployee: parseFloat(employeeStats?.ordersPerEmployee?.toString() || "0"),
      revenuePerEmployee: parseFloat(employeeStats?.revenuePerEmployee?.toString() || "0"),
      energyEfficiencyScore: await this.calculateEnergyEfficiency(),
      resourceUtilizationRate: await this.calculateResourceUtilization()
    };
  }

  /**
   * Get real-time operational data
   */
  async getRealtimeData(): Promise<RealtimeData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orderStats] = await db
      .select({
        pending: count(sql`CASE WHEN ${orders.status} = 'pending' THEN 1 END`),
        processing: count(sql`CASE WHEN ${orders.status} = 'processing' THEN 1 END`),
        completed: count(sql`CASE WHEN ${orders.status} = 'completed' THEN 1 END`),
        todayOrders: count(sql`CASE WHEN ${orders.createdAt} >= ${today} THEN 1 END`)
      })
      .from(orders);

    const [staffStats] = await db
      .select({
        onDuty: count(employees.id)
      })
      .from(employees)
      .where(eq(employees.status, "active"));

    return {
      activeOrders: (orderStats?.pending || 0) + (orderStats?.processing || 0),
      pendingPickups: orderStats?.pending || 0,
      inProgress: orderStats?.processing || 0,
      readyForDelivery: orderStats?.completed || 0,
      todayPickups: orderStats?.todayOrders || 0,
      todayDeliveries: await this.getTodayDeliveries(),
      currentRevenue: await this.getCurrentRevenue(),
      staffOnDuty: staffStats?.onDuty || 0,
      machineStatus: await this.getMachineStatus()
    };
  }

  /**
   * Get production metrics
   */
  async getProductionMetrics(): Promise<ProductionMetrics> {
    const totalCapacity = await this.calculateTotalCapacity();
    const currentLoad = await this.calculateCurrentLoad();

    return {
      totalCapacity,
      currentLoad,
      utilizationRate: (currentLoad / totalCapacity) * 100,
      bottleneckStations: await this.identifyBottlenecks(),
      productionEfficiency: await this.calculateProductionEfficiency(),
      qualityScore: await this.calculateQualityScore(),
      throughputPerHour: await this.calculateThroughput()
    };
  }

  /**
   * Get delivery schedule for next 7 days
   */
  async getDeliverySchedule(): Promise<DeliverySchedule[]> {
    const schedule: DeliverySchedule[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const [dayStats] = await db
        .select({
          orderCount: count(orders.id),
          totalRevenue: sum(orders.totalAmount),
          priorityCount: count(sql`CASE WHEN ${orders.urgency} IN ('high', 'urgent') THEN 1 END`)
        })
        .from(orders)
        .where(
          and(
            gte(orders.estimatedCompletion, date),
            lte(orders.estimatedCompletion, new Date(date.getTime() + 24 * 60 * 60 * 1000)),
            eq(orders.status, "completed")
          )
        );

      schedule.push({
        date: date.toISOString().split('T')[0],
        ordersToDeliver: dayStats?.orderCount || 0,
        estimatedRevenue: parseFloat(dayStats?.totalRevenue?.toString() || "0"),
        priorityOrders: dayStats?.priorityCount || 0,
        deliveryRoute: this.generateDeliveryRoute(dayStats?.orderCount || 0),
        estimatedTime: this.estimateDeliveryTime(dayStats?.orderCount || 0),
        driverAssigned: await this.assignDriver(date),
        status: i === 0 ? 'in_progress' : 'scheduled'
      });
    }

    return schedule;
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(): Promise<FinancialAnalytics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Revenue calculations
    const [revenueStats] = await db
      .select({
        today: sum(sql`CASE WHEN ${orders.createdAt} >= ${today} THEN ${orders.totalAmount}::numeric ELSE 0 END`),
        yesterday: sum(sql`CASE WHEN ${orders.createdAt} >= ${yesterday} AND ${orders.createdAt} < ${today} THEN ${orders.totalAmount}::numeric ELSE 0 END`),
        thisWeek: sum(sql`CASE WHEN ${orders.createdAt} >= ${thisWeekStart} THEN ${orders.totalAmount}::numeric ELSE 0 END`),
        lastWeek: sum(sql`CASE WHEN ${orders.createdAt} >= ${lastWeekStart} AND ${orders.createdAt} < ${thisWeekStart} THEN ${orders.totalAmount}::numeric ELSE 0 END`),
        thisMonth: sum(sql`CASE WHEN ${orders.createdAt} >= ${thisMonthStart} THEN ${orders.totalAmount}::numeric ELSE 0 END`),
        lastMonth: sum(sql`CASE WHEN ${orders.createdAt} >= ${lastMonthStart} AND ${orders.createdAt} < ${thisMonthStart} THEN ${orders.totalAmount}::numeric ELSE 0 END`)
      })
      .from(orders);

    const todayRevenue = parseFloat(revenueStats?.today?.toString() || "0");
    const yesterdayRevenue = parseFloat(revenueStats?.yesterday?.toString() || "0");
    const thisMonthRevenue = parseFloat(revenueStats?.thisMonth?.toString() || "0");
    const lastMonthRevenue = parseFloat(revenueStats?.lastMonth?.toString() || "0");

    const growthRate = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // Calculate costs (estimated based on business model)
    const operationalCosts = thisMonthRevenue * 0.3; // 30% of revenue
    const staffCosts = await this.calculateStaffCosts();
    const utilityCosts = thisMonthRevenue * 0.08; // 8% of revenue
    const maintenanceCosts = thisMonthRevenue * 0.05; // 5% of revenue
    const totalCosts = operationalCosts + staffCosts + utilityCosts + maintenanceCosts;

    return {
      revenue: {
        today: todayRevenue,
        yesterday: yesterdayRevenue,
        thisWeek: parseFloat(revenueStats?.thisWeek?.toString() || "0"),
        lastWeek: parseFloat(revenueStats?.lastWeek?.toString() || "0"),
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        thisYear: await this.getYearRevenue(),
        trend: todayRevenue > yesterdayRevenue ? 'up' : todayRevenue < yesterdayRevenue ? 'down' : 'stable',
        growthRate
      },
      costs: {
        operational: operationalCosts,
        staff: staffCosts,
        utilities: utilityCosts,
        maintenance: maintenanceCosts,
        total: totalCosts
      },
      profitability: {
        grossProfit: thisMonthRevenue - totalCosts,
        netProfit: (thisMonthRevenue - totalCosts) * 0.85, // After taxes
        margin: ((thisMonthRevenue - totalCosts) / thisMonthRevenue) * 100,
        breakeven: totalCosts
      },
      cashFlow: {
        incoming: thisMonthRevenue,
        outgoing: totalCosts,
        balance: thisMonthRevenue - totalCosts,
        forecast: await this.generateCashFlowForecast()
      }
    };
  }

  /**
   * Get detailed customer analytics
   */
  async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [customerStats] = await db
      .select({
        total: count(customers.id),
        newToday: count(sql`CASE WHEN ${customers.createdAt} >= ${today} THEN 1 END`),
        avgLifetimeValue: avg(customers.lifetimeValue)
      })
      .from(customers)
      .where(eq(customers.isActive, true));

    return {
      totalCustomers: customerStats?.total || 0,
      newCustomersToday: customerStats?.newToday || 0,
      retentionRate: await this.calculateRetentionRate(),
      lifetimeValue: parseFloat(customerStats?.avgLifetimeValue?.toString() || "0"),
      segmentDistribution: await this.getSegmentDistribution(),
      satisfactionMetrics: {
        overallScore: await this.calculateSatisfactionScore(),
        responseRate: await this.calculateResponseRate(),
        npsScore: await this.calculateNPSScore(),
        commonComplaints: await this.getCommonComplaints()
      }
    };
  }

  // Private helper methods

  private async calculateCapacityUtilization(): Promise<number> {
    // Simulate capacity calculation based on orders vs maximum possible
    const maxDailyCapacity = 200; // orders per day
    const [todayOrders] = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(gte(orders.createdAt, sql`CURRENT_DATE`));

    return ((todayOrders?.count || 0) / maxDailyCapacity) * 100;
  }

  private async calculateSatisfactionScore(): Promise<number> {
    // Simulate satisfaction score calculation
    // In real implementation, this would come from feedback/reviews
    return 4.3; // Out of 5
  }

  private async calculateCustomerGrowthRate(): Promise<number> {
    const thisMonth = new Date();
    const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
    const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    const [thisMonthCustomers] = await db
      .select({ count: count(customers.id) })
      .from(customers)
      .where(gte(customers.createdAt, thisMonthStart));

    const [lastMonthCustomers] = await db
      .select({ count: count(customers.id) })
      .from(customers)
      .where(
        and(
          gte(customers.createdAt, lastMonth),
          lte(customers.createdAt, thisMonthStart)
        )
      );

    const thisCount = thisMonthCustomers?.count || 0;
    const lastCount = lastMonthCustomers?.count || 1;

    return ((thisCount - lastCount) / lastCount) * 100;
  }

  private async calculateOrderGrowthRate(): Promise<number> {
    // Similar calculation for orders
    return 15.2; // Simulated
  }

  private async calculateAOVGrowth(): Promise<number> {
    // Average Order Value growth
    return 8.7; // Simulated
  }

  private async calculateEnergyEfficiency(): Promise<number> {
    // Energy efficiency score
    return 78.5; // Simulated
  }

  private async calculateResourceUtilization(): Promise<number> {
    // Resource utilization rate
    return 82.3; // Simulated
  }

  private async getTodayDeliveries(): Promise<number> {
    const [result] = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(
        and(
          gte(orders.actualCompletion, sql`CURRENT_DATE`),
          eq(orders.status, "completed")
        )
      );
    return result?.count || 0;
  }

  private async getCurrentRevenue(): Promise<number> {
    const [result] = await db
      .select({ revenue: sum(orders.totalAmount) })
      .from(orders)
      .where(gte(orders.createdAt, sql`CURRENT_DATE`));
    return parseFloat(result?.revenue?.toString() || "0");
  }

  private async getMachineStatus(): Promise<Array<{
    id: string;
    name: string;
    status: 'running' | 'idle' | 'maintenance' | 'offline';
    currentLoad: number;
    efficiency: number;
    nextMaintenance: Date;
  }>> {
    // Simulated machine status
    return [
      {
        id: "wash-001",
        name: "Industrial Washer #1",
        status: "running",
        currentLoad: 85,
        efficiency: 94.2,
        nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: "dry-001",
        name: "Commercial Dryer #1",
        status: "running",
        currentLoad: 72,
        efficiency: 91.8,
        nextMaintenance: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: "press-001",
        name: "Steam Press #1",
        status: "idle",
        currentLoad: 0,
        efficiency: 96.5,
        nextMaintenance: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private async calculateTotalCapacity(): Promise<number> {
    return 500; // orders per day
  }

  private async calculateCurrentLoad(): Promise<number> {
    const [result] = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, sql`CURRENT_DATE`),
          eq(orders.status, "processing")
        )
      );
    return result?.count || 0;
  }

  private async identifyBottlenecks(): Promise<Array<{
    station: string;
    utilization: number;
    waitingOrders: number;
    estimatedDelay: number;
  }>> {
    // Simulated bottleneck analysis
    return [
      {
        station: "Quality Check",
        utilization: 95,
        waitingOrders: 12,
        estimatedDelay: 2.5
      },
      {
        station: "Pressing",
        utilization: 88,
        waitingOrders: 8,
        estimatedDelay: 1.8
      }
    ];
  }

  private async calculateProductionEfficiency(): Promise<number> {
    return 87.3; // Simulated
  }

  private async calculateQualityScore(): Promise<number> {
    return 94.7; // Simulated
  }

  private async calculateThroughput(): Promise<number> {
    return 25.6; // orders per hour
  }

  private generateDeliveryRoute(orderCount: number): string {
    const routes = ["Route A (City Center)", "Route B (Suburbs)", "Route C (Industrial)"];
    return routes[orderCount % routes.length];
  }

  private estimateDeliveryTime(orderCount: number): number {
    return Math.ceil(orderCount * 0.3 + 2); // Base 2 hours + 0.3 hours per order
  }

  private async assignDriver(date: Date): Promise<string> {
    const drivers = ["John Smith", "Sarah Johnson", "Mike Wilson"];
    return drivers[date.getDay() % drivers.length];
  }

  private async calculateStaffCosts(): Promise<number> {
    const [result] = await db
      .select({ totalSalary: sum(employees.salary) })
      .from(employees)
      .where(eq(employees.status, "active"));
    return parseFloat(result?.totalSalary?.toString() || "0");
  }

  private async getYearRevenue(): Promise<number> {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const [result] = await db
      .select({ revenue: sum(orders.totalAmount) })
      .from(orders)
      .where(gte(orders.createdAt, yearStart));
    return parseFloat(result?.revenue?.toString() || "0");
  }

  private async generateCashFlowForecast(): Promise<number[]> {
    // Generate 12-month forecast
    const forecast = [];
    const baseRevenue = await this.getCurrentRevenue();

    for (let i = 0; i < 12; i++) {
      const growth = 1 + (Math.random() * 0.1 - 0.05); // ±5% random variation
      forecast.push(baseRevenue * growth * (1 + i * 0.02)); // 2% monthly growth
    }

    return forecast;
  }

  private async calculateRetentionRate(): Promise<number> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [retainedCustomers] = await db
      .select({ count: count(customers.id) })
      .from(customers)
      .where(
        and(
          lte(customers.createdAt, threeMonthsAgo),
          gte(customers.lastOrder, threeMonthsAgo)
        )
      );

    const [totalOldCustomers] = await db
      .select({ count: count(customers.id) })
      .from(customers)
      .where(lte(customers.createdAt, threeMonthsAgo));

    const retained = retainedCustomers?.count || 0;
    const total = totalOldCustomers?.count || 1;

    return (retained / total) * 100;
  }

  private async getSegmentDistribution(): Promise<Array<{
    segment: string;
    count: number;
    percentage: number;
    revenue: number;
  }>> {
    // Simulated segment distribution
    return [
      { segment: "VIP", count: 45, percentage: 8.7, revenue: 450000 },
      { segment: "Regular", count: 234, percentage: 45.2, revenue: 320000 },
      { segment: "New", count: 156, percentage: 30.1, revenue: 180000 },
      { segment: "At Risk", count: 67, percentage: 12.9, revenue: 95000 },
      { segment: "Inactive", count: 16, percentage: 3.1, revenue: 25000 }
    ];
  }

  private async calculateResponseRate(): Promise<number> {
    return 68.4; // Simulated
  }

  private async calculateNPSScore(): Promise<number> {
    return 72; // Simulated Net Promoter Score
  }

  private async getCommonComplaints(): Promise<string[]> {
    return [
      "Delivery delay",
      "Stain not removed",
      "Pricing concerns",
      "Customer service"
    ];
  }
}

// Export singleton instance
export const dashboardAnalytics = new DashboardAnalyticsService();