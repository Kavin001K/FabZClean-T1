import { eq, and, desc, asc, sql, count, gte, lte, inArray, or } from "drizzle-orm";
import type {
  Customer, Promotion, PromotionUsage, Order,
  InsertPromotion, InsertPromotionUsage
} from "../../shared/schema";
import {
  customers, promotions, promotionUsage, orders, services
} from "../../shared/schema";
import { db } from "../database";

export interface PromotionEligibility {
  isEligible: boolean;
  reason?: string;
  discount?: DiscountCalculation;
  requirements?: string[];
}

export interface DiscountCalculation {
  type: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  description: string;
  promotionCode?: string;
}

export interface PromotionRule {
  type: "min_order_value" | "customer_segment" | "loyalty_tier" | "service_type" | "day_of_week" | "time_range" | "usage_limit";
  value: any;
  description: string;
}

export interface AutoPromotionResult {
  applicablePromotions: Promotion[];
  bestPromotion?: Promotion;
  totalDiscount: number;
  savings: string;
}

export class PromotionsService {
  /**
   * Create a new promotion
   */
  async createPromotion(promotionData: InsertPromotion): Promise<Promotion> {
    // Generate promotion code if not provided
    if (!promotionData.promotionCode) {
      promotionData.promotionCode = this.generatePromotionCode();
    }

    const [promotion] = await db.insert(promotions)
      .values(promotionData)
      .returning();

    return promotion;
  }

  /**
   * Check if a promotion is eligible for a customer and order
   */
  async checkPromotionEligibility(
    promotionCode: string,
    customerId: string,
    orderData: {
      totalAmount: number;
      serviceIds: string[];
      orderDate?: Date;
    }
  ): Promise<PromotionEligibility> {
    const [promotion] = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.promotionCode, promotionCode),
          eq(promotions.isActive, true)
        )
      );

    if (!promotion) {
      return { isEligible: false, reason: "Promotion code not found or inactive" };
    }

    // Check date validity
    const now = orderData.orderDate || new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      return { isEligible: false, reason: "Promotion is not valid for this date" };
    }

    // Check usage limits
    if (promotion.usageLimit && promotion.currentUsage >= promotion.usageLimit) {
      return { isEligible: false, reason: "Promotion usage limit reached" };
    }

    // Check customer usage limit
    const customerUsageCount = await this.getCustomerUsageCount(promotion.id, customerId);
    if (promotion.usagePerCustomer && customerUsageCount >= promotion.usagePerCustomer) {
      return { isEligible: false, reason: "You have already used this promotion the maximum number of times" };
    }

    // Check minimum order value
    if (promotion.minOrderValue && orderData.totalAmount < parseFloat(promotion.minOrderValue)) {
      return {
        isEligible: false,
        reason: `Minimum order value of ₹${parseFloat(promotion.minOrderValue).toFixed(2)} required`
      };
    }

    // Get customer details for segment and tier checks
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) {
      return { isEligible: false, reason: "Customer not found" };
    }

    // Check customer segment targeting
    if (promotion.targetCustomerSegments) {
      const segments = promotion.targetCustomerSegments as string[];
      if (!segments.includes(customer.customerSegment || "new")) {
        return { isEligible: false, reason: "This promotion is not available for your customer segment" };
      }
    }

    // Check loyalty tier targeting
    if (promotion.targetLoyaltyTiers) {
      const tiers = promotion.targetLoyaltyTiers as string[];
      if (!tiers.includes(customer.loyaltyTier || "bronze")) {
        return { isEligible: false, reason: "This promotion is not available for your loyalty tier" };
      }
    }

    // Check applicable services
    if (promotion.applicableServices) {
      const applicableServices = promotion.applicableServices as string[];
      const hasApplicableService = orderData.serviceIds.some(id => applicableServices.includes(id));
      if (!hasApplicableService) {
        return { isEligible: false, reason: "This promotion is not applicable to the selected services" };
      }
    }

    // Check excluded services
    if (promotion.excludedServices) {
      const excludedServices = promotion.excludedServices as string[];
      const hasExcludedService = orderData.serviceIds.some(id => excludedServices.includes(id));
      if (hasExcludedService) {
        return { isEligible: false, reason: "This promotion cannot be used with the selected services" };
      }
    }

    // Calculate discount
    const discount = this.calculateDiscount(promotion, orderData.totalAmount);

    return {
      isEligible: true,
      discount,
      requirements: this.getPromotionRequirements(promotion)
    };
  }

  /**
   * Apply promotion to an order
   */
  async applyPromotion(
    promotionCode: string,
    customerId: string,
    orderId: string,
    orderData: {
      totalAmount: number;
      serviceIds: string[];
      orderDate?: Date;
    }
  ): Promise<{ success: boolean; discount?: DiscountCalculation; error?: string }> {
    const eligibility = await this.checkPromotionEligibility(promotionCode, customerId, orderData);

    if (!eligibility.isEligible) {
      return { success: false, error: eligibility.reason };
    }

    const [promotion] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.promotionCode, promotionCode));

    if (!promotion || !eligibility.discount) {
      return { success: false, error: "Invalid promotion" };
    }

    // Record promotion usage
    await db.insert(promotionUsage).values({
      promotionId: promotion.id,
      customerId,
      orderId,
      discountAmount: eligibility.discount.discountAmount.toString()
    });

    // Update promotion usage count
    await db.update(promotions)
      .set({
        currentUsage: sql`${promotions.currentUsage} + 1`,
        updatedAt: new Date()
      })
      .where(eq(promotions.id, promotion.id));

    return { success: true, discount: eligibility.discount };
  }

  /**
   * Get automatic promotions for a customer and order
   */
  async getAutoApplicablePromotions(
    customerId: string,
    orderData: {
      totalAmount: number;
      serviceIds: string[];
      orderDate?: Date;
    }
  ): Promise<AutoPromotionResult> {
    // Get all active auto-apply promotions
    const activePromotions = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          eq(promotions.isAutoApply, true),
          lte(promotions.startDate, orderData.orderDate || new Date()),
          gte(promotions.endDate, orderData.orderDate || new Date())
        )
      );

    const applicablePromotions: Promotion[] = [];
    const discounts: DiscountCalculation[] = [];

    for (const promotion of activePromotions) {
      const eligibility = await this.checkPromotionEligibility(
        promotion.promotionCode!,
        customerId,
        orderData
      );

      if (eligibility.isEligible && eligibility.discount) {
        applicablePromotions.push(promotion);
        discounts.push(eligibility.discount);
      }
    }

    // Find the best promotion (highest discount)
    let bestPromotion: Promotion | undefined;
    let maxDiscount = 0;

    discounts.forEach((discount, index) => {
      if (discount.discountAmount > maxDiscount) {
        maxDiscount = discount.discountAmount;
        bestPromotion = applicablePromotions[index];
      }
    });

    return {
      applicablePromotions,
      bestPromotion,
      totalDiscount: maxDiscount,
      savings: maxDiscount > 0 ? `You save ₹${maxDiscount.toFixed(2)}!` : "No applicable discounts"
    };
  }

  /**
   * Get customer's promotion history
   */
  async getCustomerPromotionHistory(customerId: string, limit = 20): Promise<Array<{
    promotion: Promotion;
    usage: PromotionUsage;
    order?: Order;
  }>> {
    const history = await db
      .select({
        promotion: promotions,
        usage: promotionUsage,
        order: orders
      })
      .from(promotionUsage)
      .leftJoin(promotions, eq(promotionUsage.promotionId, promotions.id))
      .leftJoin(orders, eq(promotionUsage.orderId, orders.id))
      .where(eq(promotionUsage.customerId, customerId))
      .orderBy(desc(promotionUsage.createdAt))
      .limit(limit);

    return history.map(h => ({
      promotion: h.promotion!,
      usage: h.usage,
      order: h.order || undefined
    }));
  }

  /**
   * Get promotion analytics
   */
  async getPromotionAnalytics(promotionId: string): Promise<{
    totalUsage: number;
    totalDiscount: number;
    revenue: number;
    topCustomers: Array<{ customer: Customer; usage: number; discount: number }>;
    usageByDate: Array<{ date: string; usage: number }>;
  }> {
    const [promotion] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.id, promotionId));

    if (!promotion) {
      throw new Error("Promotion not found");
    }

    // Get basic usage stats
    const [usageStats] = await db
      .select({
        totalUsage: count(),
        totalDiscount: sql<number>`SUM(${promotionUsage.discountAmount}::numeric)`
      })
      .from(promotionUsage)
      .where(eq(promotionUsage.promotionId, promotionId));

    // Get revenue (order amounts minus discounts)
    const revenueResult = await db
      .select({
        revenue: sql<number>`SUM(${orders.totalAmount}::numeric - ${promotionUsage.discountAmount}::numeric)`
      })
      .from(promotionUsage)
      .leftJoin(orders, eq(promotionUsage.orderId, orders.id))
      .where(eq(promotionUsage.promotionId, promotionId));

    // Get top customers
    const topCustomers = await db
      .select({
        customer: customers,
        usage: count(),
        discount: sql<number>`SUM(${promotionUsage.discountAmount}::numeric)`
      })
      .from(promotionUsage)
      .leftJoin(customers, eq(promotionUsage.customerId, customers.id))
      .where(eq(promotionUsage.promotionId, promotionId))
      .groupBy(customers.id)
      .orderBy(desc(sql`SUM(${promotionUsage.discountAmount}::numeric)`))
      .limit(10);

    // Get usage by date (last 30 days)
    const usageByDate = await db
      .select({
        date: sql<string>`DATE(${promotionUsage.createdAt})`,
        usage: count()
      })
      .from(promotionUsage)
      .where(
        and(
          eq(promotionUsage.promotionId, promotionId),
          gte(promotionUsage.createdAt, sql`NOW() - INTERVAL '30 days'`)
        )
      )
      .groupBy(sql`DATE(${promotionUsage.createdAt})`)
      .orderBy(sql`DATE(${promotionUsage.createdAt})`);

    return {
      totalUsage: usageStats?.totalUsage || 0,
      totalDiscount: usageStats?.totalDiscount || 0,
      revenue: revenueResult[0]?.revenue || 0,
      topCustomers: topCustomers.map(tc => ({
        customer: tc.customer!,
        usage: tc.usage,
        discount: tc.discount || 0
      })),
      usageByDate: usageByDate.map(ubd => ({
        date: ubd.date,
        usage: ubd.usage
      }))
    };
  }

  /**
   * Create smart promotions based on customer behavior
   */
  async createSmartPromotions(): Promise<Promotion[]> {
    const createdPromotions: Promotion[] = [];

    // 1. Win-back promotion for inactive customers
    const inactiveCustomers = await db
      .select({ count: count() })
      .from(customers)
      .where(
        and(
          eq(customers.customerSegment, "inactive"),
          sql`${customers.lastOrder} < NOW() - INTERVAL '60 days'`
        )
      );

    if (inactiveCustomers[0]?.count > 10) {
      const winbackPromotion = await this.createPromotion({
        name: "Welcome Back - 25% Off",
        description: "We miss you! Get 25% off your next order",
        type: "percentage",
        value: "25",
        minOrderValue: "500",
        targetCustomerSegments: ["inactive"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usagePerCustomer: 1,
        isAutoApply: true
      });
      createdPromotions.push(winbackPromotion);
    }

    // 2. Loyalty tier upgrade incentive
    const goldTierPromotion = await this.createPromotion({
      name: "Gold Member Exclusive - Free Premium Service",
      description: "Complimentary premium packaging for Gold members",
      type: "free_service",
      value: "0",
      targetLoyaltyTiers: ["gold", "platinum", "diamond"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isAutoApply: true
    });
    createdPromotions.push(goldTierPromotion);

    // 3. Bulk order incentive
    const bulkOrderPromotion = await this.createPromotion({
      name: "Bulk Order Discount - 15% Off",
      description: "Save more when you bring more! 15% off orders above ₹2000",
      type: "percentage",
      value: "15",
      minOrderValue: "2000",
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      isAutoApply: true
    });
    createdPromotions.push(bulkOrderPromotion);

    return createdPromotions;
  }

  // Private helper methods

  private calculateDiscount(promotion: Promotion, orderAmount: number): DiscountCalculation {
    const value = parseFloat(promotion.value);
    let discountAmount = 0;
    let description = "";

    switch (promotion.type) {
      case "percentage":
        discountAmount = (orderAmount * value) / 100;
        if (promotion.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, parseFloat(promotion.maxDiscountAmount));
        }
        description = `${value}% discount applied`;
        break;

      case "fixed_amount":
        discountAmount = Math.min(value, orderAmount);
        description = `₹${value} discount applied`;
        break;

      case "free_service":
        // This would need service-specific logic
        discountAmount = 0;
        description = "Free service applied";
        break;

      case "buy_x_get_y":
        // Complex logic for buy X get Y offers
        discountAmount = 0;
        description = "Buy X Get Y offer applied";
        break;

      case "loyalty_bonus":
        // Percentage bonus for loyalty points
        discountAmount = 0;
        description = `${value}% bonus loyalty points`;
        break;
    }

    return {
      type: promotion.type,
      originalAmount: orderAmount,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100,
      description,
      promotionCode: promotion.promotionCode || undefined
    };
  }

  private generatePromotionCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async getCustomerUsageCount(promotionId: string, customerId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(promotionUsage)
      .where(
        and(
          eq(promotionUsage.promotionId, promotionId),
          eq(promotionUsage.customerId, customerId)
        )
      );

    return result?.count || 0;
  }

  private getPromotionRequirements(promotion: Promotion): string[] {
    const requirements: string[] = [];

    if (promotion.minOrderValue) {
      requirements.push(`Minimum order value: ₹${parseFloat(promotion.minOrderValue).toFixed(2)}`);
    }

    if (promotion.targetCustomerSegments) {
      const segments = promotion.targetCustomerSegments as string[];
      requirements.push(`Available for: ${segments.join(", ")} customers`);
    }

    if (promotion.targetLoyaltyTiers) {
      const tiers = promotion.targetLoyaltyTiers as string[];
      requirements.push(`Available for: ${tiers.join(", ")} tier members`);
    }

    if (promotion.usagePerCustomer) {
      requirements.push(`Can be used ${promotion.usagePerCustomer} time(s) per customer`);
    }

    const endDate = new Date(promotion.endDate);
    requirements.push(`Valid until: ${endDate.toLocaleDateString()}`);

    return requirements;
  }

  /**
   * Get active promotions for display
   */
  async getActivePromotions(): Promise<Promotion[]> {
    return await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          lte(promotions.startDate, new Date()),
          gte(promotions.endDate, new Date())
        )
      )
      .orderBy(desc(promotions.createdAt));
  }

  /**
   * Update promotion
   */
  async updatePromotion(promotionId: string, updates: Partial<Promotion>): Promise<Promotion | null> {
    const [promotion] = await db.update(promotions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(promotions.id, promotionId))
      .returning();

    return promotion || null;
  }

  /**
   * Delete promotion
   */
  async deletePromotion(promotionId: string): Promise<boolean> {
    const result = await db.delete(promotions)
      .where(eq(promotions.id, promotionId));

    return result.rowCount ? result.rowCount > 0 : false;
  }
}

// Export singleton instance
export const promotionsService = new PromotionsService();