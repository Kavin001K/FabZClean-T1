import { eq, and, desc, asc, sql, count, sum, avg, gte, lte, inArray } from "drizzle-orm";
import type {
  Customer, CustomerSegment, Order,
  InsertCustomerSegment, InsertCustomer
} from "../../shared/schema";
import {
  customers, customerSegments, orders, loyaltyTransactions
} from "../../shared/schema";
import { db } from "../database";

export interface SegmentationCriteria {
  totalSpent?: { min?: number; max?: number };
  totalOrders?: { min?: number; max?: number };
  averageOrderValue?: { min?: number; max?: number };
  lastOrderDays?: { min?: number; max?: number };
  loyaltyTier?: string[];
  customerAge?: { min?: number; max?: number };
  loyaltyPoints?: { min?: number; max?: number };
  registrationDays?: { min?: number; max?: number };
  orderFrequency?: { min?: number; max?: number }; // orders per month
  preferredServices?: string[];
  location?: string[];
  gender?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  marketingOptIn?: boolean;
}

export interface SegmentAnalytics {
  id: string;
  name: string;
  customerCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageLifetimeValue: number;
  retentionRate: number;
  growthRate: number;
  engagementScore: number;
  characteristics: string[];
  recommendations: string[];
}

export interface CustomerInsight {
  customerId: string;
  customerName: string;
  currentSegment: string;
  recommendedSegment?: string;
  riskScore: number;
  lifetimeValue: number;
  predictedValue: number;
  nextBestAction: string[];
}

export class SegmentationService {
  private predefinedSegments = [
    {
      name: "VIP Champions",
      description: "High-value customers with excellent engagement",
      criteria: {
        totalSpent: { min: 50000 },
        totalOrders: { min: 20 },
        lastOrderDays: { max: 30 },
        loyaltyTier: ["platinum", "diamond"]
      },
      color: "#gold"
    },
    {
      name: "Loyal Regulars",
      description: "Consistent customers with regular orders",
      criteria: {
        totalSpent: { min: 15000, max: 49999 },
        totalOrders: { min: 10 },
        lastOrderDays: { max: 60 },
        loyaltyTier: ["silver", "gold"]
      },
      color: "#blue"
    },
    {
      name: "Growing Customers",
      description: "Customers showing positive growth trajectory",
      criteria: {
        totalSpent: { min: 5000, max: 14999 },
        totalOrders: { min: 5 },
        lastOrderDays: { max: 45 }
      },
      color: "#green"
    },
    {
      name: "New Customers",
      description: "Recently acquired customers",
      criteria: {
        registrationDays: { max: 90 },
        totalOrders: { max: 3 }
      },
      color: "#purple"
    },
    {
      name: "At-Risk Customers",
      description: "Previously active customers showing decline",
      criteria: {
        totalSpent: { min: 10000 },
        lastOrderDays: { min: 61, max: 180 },
        totalOrders: { min: 5 }
      },
      color: "#orange"
    },
    {
      name: "Inactive Customers",
      description: "Customers who haven't ordered recently",
      criteria: {
        lastOrderDays: { min: 181 },
        totalOrders: { min: 1 }
      },
      color: "#red"
    },
    {
      name: "High-Value Prospects",
      description: "New customers with high initial spend",
      criteria: {
        averageOrderValue: { min: 3000 },
        totalOrders: { min: 1, max: 5 },
        registrationDays: { max: 180 }
      },
      color: "#cyan"
    }
  ];

  /**
   * Create a new customer segment
   */
  async createSegment(segmentData: InsertCustomerSegment): Promise<CustomerSegment> {
    const [segment] = await db.insert(customerSegments)
      .values(segmentData)
      .returning();

    // Update customer counts
    await this.updateSegmentCounts(segment.id);

    return segment;
  }

  /**
   * Update all customer segments automatically
   */
  async updateAllSegments(): Promise<void> {
    // First, create predefined segments if they don't exist
    await this.createPredefinedSegments();

    // Get all active segments
    const segments = await db.select()
      .from(customerSegments)
      .where(eq(customerSegments.isActive, true));

    // Update each segment
    for (const segment of segments) {
      await this.updateSegmentMembership(segment.id);
    }

    // Update customer segment assignments
    await this.assignCustomersToSegments();
  }

  /**
   * Get customers matching segment criteria
   */
  async getCustomersInSegment(segmentId: string): Promise<Customer[]> {
    const [segment] = await db.select()
      .from(customerSegments)
      .where(eq(customerSegments.id, segmentId));

    if (!segment) {
      throw new Error("Segment not found");
    }

    const criteria = segment.criteria as SegmentationCriteria;
    return await this.getCustomersByCriteria(criteria);
  }

  /**
   * Get segment analytics
   */
  async getSegmentAnalytics(segmentId?: string): Promise<SegmentAnalytics[]> {
    let segments: CustomerSegment[];

    if (segmentId) {
      const [segment] = await db.select()
        .from(customerSegments)
        .where(eq(customerSegments.id, segmentId));
      segments = segment ? [segment] : [];
    } else {
      segments = await db.select()
        .from(customerSegments)
        .where(eq(customerSegments.isActive, true));
    }

    const analytics: SegmentAnalytics[] = [];

    for (const segment of segments) {
      const segmentCustomers = await this.getCustomersInSegment(segment.id);
      const customerIds = segmentCustomers.map(c => c.id);

      if (customerIds.length === 0) {
        analytics.push({
          id: segment.id,
          name: segment.name,
          customerCount: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          averageLifetimeValue: 0,
          retentionRate: 0,
          growthRate: 0,
          engagementScore: 0,
          characteristics: [],
          recommendations: []
        });
        continue;
      }

      // Calculate segment metrics
      const [revenueStats] = await db
        .select({
          totalRevenue: sum(orders.totalAmount),
          avgOrderValue: avg(orders.totalAmount),
          orderCount: count(orders.id)
        })
        .from(orders)
        .where(
          and(
            inArray(sql`${orders.customerEmail}`,
              segmentCustomers.filter(c => c.email).map(c => c.email!)
            )
          )
        );

      const totalRevenue = parseFloat(revenueStats?.totalRevenue?.toString() || "0");
      const avgOrderValue = parseFloat(revenueStats?.avgOrderValue?.toString() || "0");
      const avgLifetimeValue = totalRevenue / segmentCustomers.length;

      // Calculate retention rate (customers with orders in last 90 days)
      const [retentionStats] = await db
        .select({ activeCustomers: count() })
        .from(customers)
        .where(
          and(
            inArray(customers.id, customerIds),
            gte(customers.lastOrder, sql`NOW() - INTERVAL '90 days'`)
          )
        );

      const retentionRate = (retentionStats?.activeCustomers || 0) / segmentCustomers.length * 100;

      // Generate characteristics and recommendations
      const characteristics = this.generateSegmentCharacteristics(segment, segmentCustomers);
      const recommendations = this.generateSegmentRecommendations(segment, {
        customerCount: segmentCustomers.length,
        totalRevenue,
        avgOrderValue,
        retentionRate
      });

      analytics.push({
        id: segment.id,
        name: segment.name,
        customerCount: segmentCustomers.length,
        totalRevenue,
        averageOrderValue: avgOrderValue,
        averageLifetimeValue: avgLifetimeValue,
        retentionRate,
        growthRate: 0, // Would need historical data
        engagementScore: this.calculateEngagementScore(segmentCustomers),
        characteristics,
        recommendations
      });
    }

    return analytics;
  }

  /**
   * Get customer insights with recommendations
   */
  async getCustomerInsights(customerId?: string): Promise<CustomerInsight[]> {
    let customersQuery = db.select().from(customers);

    if (customerId) {
      customersQuery = customersQuery.where(eq(customers.id, customerId));
    } else {
      customersQuery = customersQuery.limit(100); // Limit for performance
    }

    const customersList = await customersQuery;
    const insights: CustomerInsight[] = [];

    for (const customer of customersList) {
      const currentSegment = customer.customerSegment || "unassigned";
      const riskScore = await this.calculateRiskScore(customer);
      const lifetimeValue = parseFloat(customer.lifetimeValue || "0");
      const predictedValue = await this.predictCustomerValue(customer);
      const nextBestActions = this.getNextBestActions(customer, riskScore);

      // Determine if customer should be in a different segment
      const recommendedSegment = await this.getRecommendedSegment(customer);

      insights.push({
        customerId: customer.id,
        customerName: customer.name,
        currentSegment,
        recommendedSegment: recommendedSegment !== currentSegment ? recommendedSegment : undefined,
        riskScore,
        lifetimeValue,
        predictedValue,
        nextBestAction: nextBestActions
      });
    }

    return insights;
  }

  /**
   * Perform RFM (Recency, Frequency, Monetary) analysis
   */
  async performRFMAnalysis(): Promise<Array<{
    customerId: string;
    customerName: string;
    recency: number;
    frequency: number;
    monetary: number;
    rfmScore: string;
    segment: string;
  }>> {
    const customersData = await db
      .select({
        customer: customers,
        lastOrder: sql<Date>`MAX(${orders.createdAt})`,
        orderCount: count(orders.id),
        totalSpent: sum(orders.totalAmount)
      })
      .from(customers)
      .leftJoin(orders, sql`${customers.email} = ${orders.customerEmail}`)
      .groupBy(customers.id)
      .having(sql`COUNT(${orders.id}) > 0`);

    const rfmData = customersData.map(data => {
      const customer = data.customer;
      const lastOrderDate = data.lastOrder;
      const recency = lastOrderDate
        ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const frequency = data.orderCount;
      const monetary = parseFloat(data.totalSpent?.toString() || "0");

      // Calculate RFM scores (1-5 scale)
      const recencyScore = this.calculateRFMScore(recency, [7, 30, 90, 180], true); // Lower is better
      const frequencyScore = this.calculateRFMScore(frequency, [1, 3, 6, 10], false); // Higher is better
      const monetaryScore = this.calculateRFMScore(monetary, [1000, 5000, 15000, 50000], false); // Higher is better

      const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;
      const segment = this.getRFMSegment(recencyScore, frequencyScore, monetaryScore);

      return {
        customerId: customer.id,
        customerName: customer.name,
        recency,
        frequency,
        monetary,
        rfmScore,
        segment
      };
    });

    return rfmData;
  }

  // Private helper methods

  private async createPredefinedSegments(): Promise<void> {
    for (const segmentDef of this.predefinedSegments) {
      const existing = await db.select()
        .from(customerSegments)
        .where(eq(customerSegments.name, segmentDef.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(customerSegments).values({
          name: segmentDef.name,
          description: segmentDef.description,
          criteria: segmentDef.criteria,
          isAutoUpdate: true
        });
      }
    }
  }

  private async getCustomersByCriteria(criteria: SegmentationCriteria): Promise<Customer[]> {
    let query = db.select().from(customers);
    const conditions: any[] = [eq(customers.isActive, true)];

    // Total spent criteria
    if (criteria.totalSpent) {
      if (criteria.totalSpent.min !== undefined) {
        conditions.push(gte(sql`${customers.totalSpent}::numeric`, criteria.totalSpent.min));
      }
      if (criteria.totalSpent.max !== undefined) {
        conditions.push(lte(sql`${customers.totalSpent}::numeric`, criteria.totalSpent.max));
      }
    }

    // Total orders criteria
    if (criteria.totalOrders) {
      if (criteria.totalOrders.min !== undefined) {
        conditions.push(gte(customers.totalOrders, criteria.totalOrders.min));
      }
      if (criteria.totalOrders.max !== undefined) {
        conditions.push(lte(customers.totalOrders, criteria.totalOrders.max));
      }
    }

    // Last order days criteria
    if (criteria.lastOrderDays) {
      if (criteria.lastOrderDays.min !== undefined) {
        conditions.push(lte(customers.lastOrder, sql`NOW() - INTERVAL '${criteria.lastOrderDays.min} days'`));
      }
      if (criteria.lastOrderDays.max !== undefined) {
        conditions.push(gte(customers.lastOrder, sql`NOW() - INTERVAL '${criteria.lastOrderDays.max} days'`));
      }
    }

    // Loyalty tier criteria
    if (criteria.loyaltyTier && criteria.loyaltyTier.length > 0) {
      conditions.push(inArray(customers.loyaltyTier, criteria.loyaltyTier));
    }

    // Registration days criteria
    if (criteria.registrationDays) {
      if (criteria.registrationDays.max !== undefined) {
        conditions.push(gte(customers.createdAt, sql`NOW() - INTERVAL '${criteria.registrationDays.max} days'`));
      }
    }

    // Marketing opt-in criteria
    if (criteria.marketingOptIn !== undefined) {
      conditions.push(eq(customers.marketingOptIn, criteria.marketingOptIn));
    }

    return await query.where(and(...conditions));
  }

  private async updateSegmentCounts(segmentId: string): Promise<void> {
    const customers = await this.getCustomersInSegment(segmentId);

    await db.update(customerSegments)
      .set({
        customerCount: customers.length,
        lastUpdated: new Date(),
        updatedAt: new Date()
      })
      .where(eq(customerSegments.id, segmentId));
  }

  private async updateSegmentMembership(segmentId: string): Promise<void> {
    await this.updateSegmentCounts(segmentId);
  }

  private async assignCustomersToSegments(): Promise<void> {
    // This would assign customers to their primary segment
    // For now, we'll update the customer records with their segment
    const segments = await db.select()
      .from(customerSegments)
      .where(eq(customerSegments.isActive, true))
      .orderBy(desc(customerSegments.createdAt)); // Newer segments have priority

    for (const segment of segments) {
      const segmentCustomers = await this.getCustomersInSegment(segment.id);

      for (const customer of segmentCustomers) {
        // Only update if customer doesn't have a segment or has a lower priority segment
        if (!customer.customerSegment ||
            this.getSegmentPriority(customer.customerSegment) < this.getSegmentPriority(segment.name)) {
          await db.update(customers)
            .set({
              customerSegment: segment.name.toLowerCase().replace(/\s+/g, '_') as any,
              updatedAt: new Date()
            })
            .where(eq(customers.id, customer.id));
        }
      }
    }
  }

  private getSegmentPriority(segmentName: string): number {
    const priorities: Record<string, number> = {
      'vip_champions': 10,
      'loyal_regulars': 8,
      'high_value_prospects': 7,
      'growing_customers': 6,
      'at_risk_customers': 4,
      'new_customers': 3,
      'inactive_customers': 1
    };
    return priorities[segmentName] || 0;
  }

  private async calculateRiskScore(customer: Customer): Promise<number> {
    let riskScore = 0;

    // Days since last order (higher = more risk)
    const daysSinceLastOrder = customer.lastOrder
      ? Math.floor((Date.now() - customer.lastOrder.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastOrder > 180) riskScore += 0.4;
    else if (daysSinceLastOrder > 90) riskScore += 0.2;
    else if (daysSinceLastOrder > 60) riskScore += 0.1;

    // Order frequency decline
    const avgOrderFreq = customer.averageOrderFrequency || 30;
    if (daysSinceLastOrder > avgOrderFreq * 2) riskScore += 0.3;

    // Low engagement
    if (!customer.marketingOptIn) riskScore += 0.1;
    if (!customer.email && !customer.phone) riskScore += 0.2;

    return Math.min(1.0, riskScore);
  }

  private async predictCustomerValue(customer: Customer): Promise<number> {
    const currentValue = parseFloat(customer.lifetimeValue || "0");
    const avgOrderValue = parseFloat(customer.averageOrderValue || "0");
    const orderFreq = customer.averageOrderFrequency || 30;

    // Simple prediction: current value + (avg order value * expected orders in next year)
    const expectedOrdersPerYear = 365 / orderFreq;
    const predictedAdditionalValue = avgOrderValue * expectedOrdersPerYear;

    return currentValue + predictedAdditionalValue;
  }

  private getNextBestActions(customer: Customer, riskScore: number): string[] {
    const actions: string[] = [];

    if (riskScore > 0.5) {
      actions.push("Send win-back campaign");
      actions.push("Offer special discount");
    }

    if (!customer.loyaltyTier || customer.loyaltyTier === "bronze") {
      actions.push("Promote loyalty program benefits");
    }

    if (!customer.email) {
      actions.push("Collect email address");
    }

    if (customer.totalOrders === 1) {
      actions.push("Send second order incentive");
    }

    const daysSinceLastOrder = customer.lastOrder
      ? Math.floor((Date.now() - customer.lastOrder.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysSinceLastOrder > 30 && daysSinceLastOrder < 60) {
      actions.push("Send gentle reminder");
    }

    return actions.length > 0 ? actions : ["Continue regular engagement"];
  }

  private async getRecommendedSegment(customer: Customer): Promise<string> {
    // Check each predefined segment to see if customer fits better
    for (const segmentDef of this.predefinedSegments) {
      const matchingCustomers = await this.getCustomersByCriteria(segmentDef.criteria);
      if (matchingCustomers.some(c => c.id === customer.id)) {
        return segmentDef.name.toLowerCase().replace(/\s+/g, '_');
      }
    }

    return customer.customerSegment || "unassigned";
  }

  private generateSegmentCharacteristics(segment: CustomerSegment, customers: Customer[]): string[] {
    const characteristics: string[] = [];

    if (customers.length === 0) return characteristics;

    const avgSpent = customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || "0"), 0) / customers.length;
    const avgOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / customers.length;

    characteristics.push(`Average spend: ₹${avgSpent.toFixed(0)}`);
    characteristics.push(`Average orders: ${avgOrders.toFixed(1)}`);

    const loyaltyTiers = customers.reduce((acc, c) => {
      acc[c.loyaltyTier || "bronze"] = (acc[c.loyaltyTier || "bronze"] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantTier = Object.entries(loyaltyTiers)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    if (dominantTier) {
      characteristics.push(`Mostly ${dominantTier} tier members`);
    }

    return characteristics;
  }

  private generateSegmentRecommendations(
    segment: CustomerSegment,
    metrics: { customerCount: number; totalRevenue: number; avgOrderValue: number; retentionRate: number }
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.retentionRate < 50) {
      recommendations.push("Focus on retention campaigns");
    }

    if (metrics.avgOrderValue < 1500) {
      recommendations.push("Promote higher-value services");
    }

    if (segment.name.includes("Risk") || segment.name.includes("Inactive")) {
      recommendations.push("Implement win-back strategy");
      recommendations.push("Offer personalized incentives");
    }

    if (segment.name.includes("New")) {
      recommendations.push("Onboarding campaign");
      recommendations.push("Second order incentives");
    }

    if (metrics.customerCount < 50) {
      recommendations.push("Expand targeting criteria");
    }

    return recommendations.length > 0 ? recommendations : ["Continue current strategy"];
  }

  private calculateEngagementScore(customers: Customer[]): number {
    if (customers.length === 0) return 0;

    let totalScore = 0;

    customers.forEach(customer => {
      let score = 0;

      // Email opt-in
      if (customer.marketingOptIn) score += 20;

      // Contact info completeness
      if (customer.email) score += 10;
      if (customer.phone) score += 10;

      // Recent activity
      const daysSinceLastOrder = customer.lastOrder
        ? Math.floor((Date.now() - customer.lastOrder.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastOrder < 30) score += 30;
      else if (daysSinceLastOrder < 60) score += 20;
      else if (daysSinceLastOrder < 90) score += 10;

      // Order frequency
      const avgFreq = customer.averageOrderFrequency || 30;
      if (avgFreq <= 15) score += 30;
      else if (avgFreq <= 30) score += 20;
      else if (avgFreq <= 60) score += 10;

      totalScore += Math.min(100, score);
    });

    return Math.round(totalScore / customers.length);
  }

  private calculateRFMScore(value: number, thresholds: number[], lowerIsBetter: boolean): number {
    if (lowerIsBetter) {
      for (let i = 0; i < thresholds.length; i++) {
        if (value <= thresholds[i]) return 5 - i;
      }
      return 1;
    } else {
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (value >= thresholds[i]) return 5 - (thresholds.length - 1 - i);
      }
      return 1;
    }
  }

  private getRFMSegment(recency: number, frequency: number, monetary: number): string {
    const score = recency + frequency + monetary;

    if (score >= 12 && recency >= 4) return "Champions";
    if (score >= 9 && recency >= 3) return "Loyal Customers";
    if (score >= 8 && frequency >= 3) return "Potential Loyalists";
    if (recency >= 4 && frequency <= 2) return "New Customers";
    if (score >= 6 && recency >= 2) return "Promising";
    if (recency <= 2 && frequency >= 2) return "Need Attention";
    if (recency <= 2 && frequency <= 2 && monetary >= 3) return "About to Sleep";
    if (recency <= 2) return "At Risk";
    if (frequency <= 2) return "Cannot Lose Them";
    return "Lost";
  }
}

// Export singleton instance
export const segmentationService = new SegmentationService();