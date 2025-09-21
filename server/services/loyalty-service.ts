import { eq, and, desc, asc, sql, count, sum, gte, lte, inArray } from "drizzle-orm";
import type {
  Customer, LoyaltyProgram, LoyaltyTransaction,
  InsertLoyaltyTransaction, InsertCustomer
} from "../../shared/schema";
import {
  customers, loyaltyProgram, loyaltyTransactions, orders
} from "../../shared/schema";
import { db } from "../database";

export interface LoyaltyTier {
  tier: string;
  name: string;
  minSpent: number;
  pointsPerRupee: number;
  bonusMultiplier: number;
  discountPercentage: number;
  benefits: string[];
  color: string;
}

export interface LoyaltyStats {
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  progressToNext: number; // 0-100
  expiringPoints: number;
  recentTransactions: LoyaltyTransaction[];
}

export interface PointsCalculation {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  tierBonus: number;
  description: string[];
}

export class LoyaltyService {
  private loyaltyTiers: LoyaltyTier[] = [
    {
      tier: "bronze",
      name: "Bronze Member",
      minSpent: 0,
      pointsPerRupee: 1,
      bonusMultiplier: 1,
      discountPercentage: 0,
      benefits: ["Basic rewards", "Birthday points"],
      color: "#cd7f32"
    },
    {
      tier: "silver",
      name: "Silver Member",
      minSpent: 5000,
      pointsPerRupee: 1.2,
      bonusMultiplier: 1.2,
      discountPercentage: 5,
      benefits: ["5% discount", "Priority service", "Extended points validity"],
      color: "#c0c0c0"
    },
    {
      tier: "gold",
      name: "Gold Member",
      minSpent: 15000,
      pointsPerRupee: 1.5,
      bonusMultiplier: 1.5,
      discountPercentage: 10,
      benefits: ["10% discount", "Free home pickup", "Bonus points on referrals"],
      color: "#ffd700"
    },
    {
      tier: "platinum",
      name: "Platinum Member",
      minSpent: 50000,
      pointsPerRupee: 2,
      bonusMultiplier: 2,
      discountPercentage: 15,
      benefits: ["15% discount", "Premium packaging", "Dedicated support"],
      color: "#e5e4e2"
    },
    {
      tier: "diamond",
      name: "Diamond Member",
      minSpent: 100000,
      pointsPerRupee: 2.5,
      bonusMultiplier: 2.5,
      discountPercentage: 20,
      benefits: ["20% discount", "Same-day service", "Exclusive offers"],
      color: "#b9f2ff"
    }
  ];

  /**
   * Calculate points for an order
   */
  async calculatePoints(customerId: string, orderAmount: number, isSpecialEvent = false): Promise<PointsCalculation> {
    const customer = await this.getCustomerWithLoyalty(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const tier = this.getTierInfo(customer.loyaltyTier || "bronze");
    const basePoints = Math.floor(orderAmount * tier.pointsPerRupee);

    let bonusPoints = 0;
    const description: string[] = [`Base points: ${basePoints} (${tier.pointsPerRupee}x rate)`];

    // Tier bonus
    if (tier.bonusMultiplier > 1) {
      const tierBonus = Math.floor(basePoints * (tier.bonusMultiplier - 1));
      bonusPoints += tierBonus;
      description.push(`${tier.name} tier bonus: ${tierBonus} points`);
    }

    // Special event bonus (birthday, anniversary, etc.)
    if (isSpecialEvent) {
      const eventBonus = Math.floor(basePoints * 0.5); // 50% bonus
      bonusPoints += eventBonus;
      description.push(`Special event bonus: ${eventBonus} points`);
    }

    // Weekly bonus (example: 20% bonus on weekends)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      const weekendBonus = Math.floor(basePoints * 0.2);
      bonusPoints += weekendBonus;
      description.push(`Weekend bonus: ${weekendBonus} points`);
    }

    return {
      basePoints,
      bonusPoints,
      totalPoints: basePoints + bonusPoints,
      tierBonus: tier.bonusMultiplier,
      description
    };
  }

  /**
   * Award points for an order
   */
  async awardPoints(
    customerId: string,
    orderId: string,
    orderAmount: number,
    isSpecialEvent = false
  ): Promise<LoyaltyTransaction> {
    const pointsCalc = await this.calculatePoints(customerId, orderAmount, isSpecialEvent);

    // Create loyalty transaction
    const transaction: InsertLoyaltyTransaction = {
      customerId,
      orderId,
      transactionType: "earned",
      points: pointsCalc.totalPoints,
      description: `Points earned for order (${pointsCalc.description.join(", ")})`,
      expiryDate: this.calculatePointsExpiry()
    };

    const [loyaltyTransaction] = await db.insert(loyaltyTransactions)
      .values(transaction)
      .returning();

    // Update customer points and check for tier upgrade
    await this.updateCustomerPoints(customerId, pointsCalc.totalPoints);
    await this.checkAndUpgradeTier(customerId);

    return loyaltyTransaction;
  }

  /**
   * Redeem points
   */
  async redeemPoints(
    customerId: string,
    pointsToRedeem: number,
    orderId?: string,
    description = "Points redeemed"
  ): Promise<{ success: boolean; transaction?: LoyaltyTransaction; error?: string }> {
    const customer = await this.getCustomerWithLoyalty(customerId);
    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    if (customer.loyaltyPoints < pointsToRedeem) {
      return { success: false, error: "Insufficient points" };
    }

    // Create redemption transaction
    const transaction: InsertLoyaltyTransaction = {
      customerId,
      orderId,
      transactionType: "redeemed",
      points: -pointsToRedeem,
      description
    };

    const [loyaltyTransaction] = await db.insert(loyaltyTransactions)
      .values(transaction)
      .returning();

    // Update customer points
    await this.updateCustomerPoints(customerId, -pointsToRedeem);

    return { success: true, transaction: loyaltyTransaction };
  }

  /**
   * Get customer loyalty statistics
   */
  async getLoyaltyStats(customerId: string): Promise<LoyaltyStats | null> {
    const customer = await this.getCustomerWithLoyalty(customerId);
    if (!customer) return null;

    const currentTier = this.getTierInfo(customer.loyaltyTier || "bronze");
    const nextTier = this.getNextTier(currentTier.tier);

    let progressToNext = 100;
    if (nextTier) {
      const spent = parseFloat(customer.totalSpent || "0");
      const remaining = nextTier.minSpent - spent;
      progressToNext = Math.min(100, Math.max(0, (spent / nextTier.minSpent) * 100));
    }

    // Get expiring points (points expiring in next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringPointsResult = await db
      .select({ points: sum(loyaltyTransactions.points) })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.customerId, customerId),
          eq(loyaltyTransactions.transactionType, "earned"),
          eq(loyaltyTransactions.isExpired, false),
          lte(loyaltyTransactions.expiryDate, thirtyDaysFromNow)
        )
      );

    // Get recent transactions
    const recentTransactions = await db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.customerId, customerId))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(10);

    return {
      currentPoints: customer.loyaltyPoints || 0,
      totalEarned: customer.totalEarnedPoints || 0,
      totalRedeemed: customer.totalRedeemedPoints || 0,
      currentTier,
      nextTier,
      progressToNext: Math.round(progressToNext),
      expiringPoints: parseInt(expiringPointsResult[0]?.points?.toString() || "0"),
      recentTransactions
    };
  }

  /**
   * Get points value in currency
   */
  getPointsValue(points: number): number {
    return points * 0.1; // 1 point = ₹0.10
  }

  /**
   * Get currency value in points
   */
  getCurrencyInPoints(amount: number): number {
    return Math.floor(amount / 0.1); // ₹1 = 10 points
  }

  /**
   * Check and upgrade customer tier
   */
  async checkAndUpgradeTier(customerId: string): Promise<{ upgraded: boolean; oldTier?: string; newTier?: string }> {
    const customer = await this.getCustomerWithLoyalty(customerId);
    if (!customer) return { upgraded: false };

    const currentTier = customer.loyaltyTier || "bronze";
    const totalSpent = parseFloat(customer.totalSpent || "0");

    // Find the highest tier the customer qualifies for
    const qualifiedTiers = this.loyaltyTiers.filter(tier => totalSpent >= tier.minSpent);
    const newTierInfo = qualifiedTiers[qualifiedTiers.length - 1];

    if (newTierInfo.tier !== currentTier) {
      // Update customer tier
      await db.update(customers)
        .set({
          loyaltyTier: newTierInfo.tier as any,
          updatedAt: new Date()
        })
        .where(eq(customers.id, customerId));

      // Award tier upgrade bonus points
      const bonusPoints = this.getTierUpgradeBonus(newTierInfo.tier);
      if (bonusPoints > 0) {
        await db.insert(loyaltyTransactions).values({
          customerId,
          transactionType: "bonus",
          points: bonusPoints,
          description: `${newTierInfo.name} tier upgrade bonus`,
          expiryDate: this.calculatePointsExpiry()
        });

        await this.updateCustomerPoints(customerId, bonusPoints);
      }

      return {
        upgraded: true,
        oldTier: currentTier,
        newTier: newTierInfo.tier
      };
    }

    return { upgraded: false };
  }

  /**
   * Generate loyalty recommendations
   */
  async getLoyaltyRecommendations(customerId: string): Promise<{
    suggestions: string[];
    offers: string[];
    milestones: string[];
  }> {
    const stats = await this.getLoyaltyStats(customerId);
    if (!stats) return { suggestions: [], offers: [], milestones: [] };

    const suggestions: string[] = [];
    const offers: string[] = [];
    const milestones: string[] = [];

    // Points about to expire
    if (stats.expiringPoints > 0) {
      suggestions.push(`You have ${stats.expiringPoints} points expiring soon. Use them before they expire!`);
    }

    // Tier upgrade opportunity
    if (stats.nextTier) {
      const customer = await this.getCustomerWithLoyalty(customerId);
      const spent = parseFloat(customer?.totalSpent || "0");
      const remaining = stats.nextTier.minSpent - spent;

      if (remaining <= 2000) { // Close to upgrade
        milestones.push(`Spend ₹${remaining.toFixed(0)} more to reach ${stats.nextTier.name}!`);
      }
    }

    // Point balance recommendations
    const pointsValue = this.getPointsValue(stats.currentPoints);
    if (stats.currentPoints >= 500) {
      offers.push(`Redeem ${stats.currentPoints} points for ₹${pointsValue.toFixed(2)} discount on your next order`);
    }

    // Tier-specific offers
    if (stats.currentTier.tier === "gold" || stats.currentTier.tier === "platinum" || stats.currentTier.tier === "diamond") {
      offers.push("Free home pickup and delivery available for premium members");
    }

    return { suggestions, offers, milestones };
  }

  /**
   * Expire old points
   */
  async expireOldPoints(): Promise<number> {
    const expiredTransactions = await db
      .select()
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.transactionType, "earned"),
          eq(loyaltyTransactions.isExpired, false),
          lte(loyaltyTransactions.expiryDate, new Date())
        )
      );

    let totalExpiredPoints = 0;

    for (const transaction of expiredTransactions) {
      // Mark transaction as expired
      await db.update(loyaltyTransactions)
        .set({ isExpired: true })
        .where(eq(loyaltyTransactions.id, transaction.id));

      // Create expiry transaction
      await db.insert(loyaltyTransactions).values({
        customerId: transaction.customerId,
        transactionType: "expired",
        points: -transaction.points,
        description: "Points expired",
      });

      // Update customer points
      await this.updateCustomerPoints(transaction.customerId, -transaction.points);
      totalExpiredPoints += transaction.points;
    }

    return totalExpiredPoints;
  }

  // Private helper methods

  private getTierInfo(tier: string): LoyaltyTier {
    return this.loyaltyTiers.find(t => t.tier === tier) || this.loyaltyTiers[0];
  }

  private getNextTier(currentTier: string): LoyaltyTier | null {
    const currentIndex = this.loyaltyTiers.findIndex(t => t.tier === currentTier);
    return currentIndex < this.loyaltyTiers.length - 1 ? this.loyaltyTiers[currentIndex + 1] : null;
  }

  private getTierUpgradeBonus(tier: string): number {
    const bonuses = {
      silver: 200,
      gold: 500,
      platinum: 1000,
      diamond: 2000
    };
    return bonuses[tier as keyof typeof bonuses] || 0;
  }

  private calculatePointsExpiry(): Date {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1); // 1 year from now
    return expiry;
  }

  private async getCustomerWithLoyalty(customerId: string): Promise<Customer | null> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));

    return customer || null;
  }

  private async updateCustomerPoints(customerId: string, pointsDelta: number): Promise<void> {
    await db.update(customers)
      .set({
        loyaltyPoints: sql`${customers.loyaltyPoints} + ${pointsDelta}`,
        totalEarnedPoints: pointsDelta > 0
          ? sql`${customers.totalEarnedPoints} + ${pointsDelta}`
          : customers.totalEarnedPoints,
        totalRedeemedPoints: pointsDelta < 0
          ? sql`${customers.totalRedeemedPoints} + ${Math.abs(pointsDelta)}`
          : customers.totalRedeemedPoints,
        updatedAt: new Date()
      })
      .where(eq(customers.id, customerId));
  }

  /**
   * Generate customer number
   */
  generateCustomerNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CUS${timestamp}${random}`;
  }

  /**
   * Create a new customer with loyalty setup
   */
  async createCustomerWithLoyalty(customerData: Partial<InsertCustomer>): Promise<Customer> {
    const customerNumber = this.generateCustomerNumber();

    const [customer] = await db.insert(customers)
      .values({
        ...customerData,
        customerNumber,
        loyaltyTier: "bronze",
        loyaltyPoints: 0,
        totalEarnedPoints: 0,
        totalRedeemedPoints: 0,
        memberSince: new Date(),
        customerSegment: "new"
      })
      .returning();

    // Award welcome bonus
    const welcomeBonus = 100;
    await this.awardWelcomeBonus(customer.id, welcomeBonus);

    return customer;
  }

  private async awardWelcomeBonus(customerId: string, points: number): Promise<void> {
    await db.insert(loyaltyTransactions).values({
      customerId,
      transactionType: "bonus",
      points,
      description: "Welcome bonus for new member",
      expiryDate: this.calculatePointsExpiry()
    });

    await this.updateCustomerPoints(customerId, points);
  }
}

// Export singleton instance
export const loyaltyService = new LoyaltyService();