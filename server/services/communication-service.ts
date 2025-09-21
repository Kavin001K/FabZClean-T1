import { eq, and, desc, asc, sql, count, inArray, gte, lte } from "drizzle-orm";
import type {
  Customer, Communication, CommunicationTemplate, MarketingCampaign,
  InsertCommunication, InsertCommunicationTemplate, InsertMarketingCampaign
} from "../../shared/schema";
import {
  customers, communications, communicationTemplates, marketingCampaigns,
  orders, loyaltyTransactions
} from "../../shared/schema";
import { db } from "../database";
import { loyaltyService } from "./loyalty-service";

export interface PersonalizedMessage {
  customerId: string;
  type: "email" | "sms" | "whatsapp" | "push";
  subject?: string;
  content: string;
  variables: Record<string, any>;
  scheduledAt?: Date;
}

export interface CommunicationAnalytics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  byChannel: Record<string, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export class CommunicationService {
  private templateVariables: TemplateVariable[] = [
    { name: "customer_name", description: "Customer's full name", example: "John Doe", required: true },
    { name: "customer_first_name", description: "Customer's first name", example: "John", required: false },
    { name: "customer_phone", description: "Customer's phone number", example: "+91 9876543210", required: false },
    { name: "customer_email", description: "Customer's email", example: "john@example.com", required: false },
    { name: "loyalty_tier", description: "Customer's loyalty tier", example: "Gold", required: false },
    { name: "loyalty_points", description: "Current loyalty points", example: "1250", required: false },
    { name: "order_number", description: "Order number", example: "ORD-123456", required: false },
    { name: "order_total", description: "Order total amount", example: "₹1,500", required: false },
    { name: "service_name", description: "Service name", example: "Dry Cleaning", required: false },
    { name: "pickup_date", description: "Pickup date", example: "25th Dec 2024", required: false },
    { name: "delivery_date", description: "Estimated delivery date", example: "27th Dec 2024", required: false },
    { name: "promotion_code", description: "Promotion code", example: "SAVE20", required: false },
    { name: "discount_amount", description: "Discount amount", example: "₹300", required: false },
    { name: "business_name", description: "Business name", example: "FabZClean", required: false },
    { name: "business_phone", description: "Business contact", example: "+91 98765 43210", required: false },
  ];

  /**
   * Create a communication template
   */
  async createTemplate(templateData: InsertCommunicationTemplate): Promise<CommunicationTemplate> {
    const [template] = await db.insert(communicationTemplates)
      .values(templateData)
      .returning();

    return template;
  }

  /**
   * Send personalized message to a customer
   */
  async sendPersonalizedMessage(
    customerId: string,
    templateId: string,
    variables: Record<string, any> = {},
    scheduledAt?: Date
  ): Promise<Communication> {
    const [template] = await db
      .select()
      .from(communicationTemplates)
      .where(eq(communicationTemplates.id, templateId));

    if (!template) {
      throw new Error("Template not found");
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check communication preferences
    const preferences = customer.communicationPreferences as any;
    if (!this.canSendToCustomer(customer, template.type, template.channel)) {
      throw new Error("Customer has opted out of this type of communication");
    }

    // Generate personalized content
    const personalizedContent = await this.personalizeContent(template.content, customer, variables);
    const personalizedSubject = template.subject
      ? await this.personalizeContent(template.subject, customer, variables)
      : undefined;

    // Create communication record
    const communication: InsertCommunication = {
      customerId,
      type: template.type,
      channel: template.channel,
      subject: personalizedSubject,
      content: personalizedContent,
      templateId: template.id,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt,
      metadata: { variables }
    };

    const [sentCommunication] = await db.insert(communications)
      .values(communication)
      .returning();

    // If not scheduled, send immediately
    if (!scheduledAt) {
      await this.sendCommunication(sentCommunication.id);
    }

    return sentCommunication;
  }

  /**
   * Send bulk messages to multiple customers
   */
  async sendBulkMessages(
    customerIds: string[],
    templateId: string,
    globalVariables: Record<string, any> = {},
    scheduledAt?: Date
  ): Promise<Communication[]> {
    const sentCommunications: Communication[] = [];

    for (const customerId of customerIds) {
      try {
        const communication = await this.sendPersonalizedMessage(
          customerId,
          templateId,
          globalVariables,
          scheduledAt
        );
        sentCommunications.push(communication);
      } catch (error) {
        console.error(`Failed to send message to customer ${customerId}:`, error);
      }
    }

    return sentCommunications;
  }

  /**
   * Send automated messages based on triggers
   */
  async sendAutomatedMessages(): Promise<void> {
    await Promise.all([
      this.sendOrderConfirmations(),
      this.sendOrderReminders(),
      this.sendLoyaltyUpdates(),
      this.sendBirthdayWishes(),
      this.sendAnniversaryWishes(),
      this.sendWinbackMessages(),
      this.sendReviewRequests()
    ]);
  }

  /**
   * Create and execute marketing campaign
   */
  async createAndExecuteCampaign(campaignData: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const [campaign] = await db.insert(marketingCampaigns)
      .values(campaignData)
      .returning();

    // If campaign is set to active, execute it immediately
    if (campaignData.status === "active") {
      await this.executeCampaign(campaign.id);
    }

    return campaign;
  }

  /**
   * Execute a marketing campaign
   */
  async executeCampaign(campaignId: string): Promise<void> {
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId));

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Get target customers based on campaign criteria
    const targetCustomers = await this.getTargetCustomers(campaign);

    // Get campaign templates
    const templateIds = campaign.templateIds as string[];
    const channels = campaign.channels as string[];

    let totalSent = 0;

    for (const customer of targetCustomers) {
      for (let i = 0; i < channels.length && i < templateIds.length; i++) {
        try {
          await this.sendPersonalizedMessage(customer.id, templateIds[i]);
          totalSent++;
        } catch (error) {
          console.error(`Failed to send campaign message to ${customer.id}:`, error);
        }
      }
    }

    // Update campaign statistics
    await db.update(marketingCampaigns)
      .set({
        targetAudience: targetCustomers.length,
        totalSent,
        updatedAt: new Date()
      })
      .where(eq(marketingCampaigns.id, campaignId));
  }

  /**
   * Get communication analytics
   */
  async getCommunicationAnalytics(
    dateRange?: { start: Date; end: Date },
    campaignId?: string
  ): Promise<CommunicationAnalytics> {
    let query = db.select().from(communications);

    const conditions: any[] = [];

    if (dateRange) {
      conditions.push(
        and(
          gte(communications.createdAt, dateRange.start),
          lte(communications.createdAt, dateRange.end)
        )
      );
    }

    if (campaignId) {
      conditions.push(eq(communications.campaignId, campaignId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allCommunications = await query;

    const totalSent = allCommunications.filter(c => c.status !== "draft").length;
    const delivered = allCommunications.filter(c => c.status === "delivered").length;
    const opened = allCommunications.filter(c => c.openedAt).length;
    const clicked = allCommunications.filter(c => c.clickedAt).length;

    // Group by channel
    const byChannel: Record<string, any> = {};
    allCommunications.forEach(comm => {
      if (!byChannel[comm.type]) {
        byChannel[comm.type] = { sent: 0, delivered: 0, opened: 0, clicked: 0 };
      }

      if (comm.status !== "draft") byChannel[comm.type].sent++;
      if (comm.status === "delivered") byChannel[comm.type].delivered++;
      if (comm.openedAt) byChannel[comm.type].opened++;
      if (comm.clickedAt) byChannel[comm.type].clicked++;
    });

    return {
      totalSent,
      deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      conversionRate: 0, // Would need order tracking to calculate
      revenue: 0, // Would need order tracking to calculate
      byChannel
    };
  }

  /**
   * Get customer communication history
   */
  async getCustomerCommunications(customerId: string, limit = 20): Promise<Communication[]> {
    return await db
      .select()
      .from(communications)
      .where(eq(communications.customerId, customerId))
      .orderBy(desc(communications.createdAt))
      .limit(limit);
  }

  // Private methods

  private async personalizeContent(
    content: string,
    customer: Customer,
    variables: Record<string, any> = {}
  ): Promise<string> {
    let personalizedContent = content;

    // Customer-specific variables
    const customerVars = {
      customer_name: customer.name,
      customer_first_name: customer.name.split(" ")[0],
      customer_phone: customer.phone || "",
      customer_email: customer.email || "",
      loyalty_tier: this.formatLoyaltyTier(customer.loyaltyTier || "bronze"),
      loyalty_points: customer.loyaltyPoints?.toString() || "0",
      business_name: "FabZClean",
      business_phone: "+91 98765 43210"
    };

    // Merge with provided variables
    const allVariables = { ...customerVars, ...variables };

    // Replace variables in content
    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      personalizedContent = personalizedContent.replace(regex, value?.toString() || "");
    });

    return personalizedContent;
  }

  private canSendToCustomer(customer: Customer, type: string, channel: string): boolean {
    const preferences = customer.communicationPreferences as any;

    // Check global opt-out
    if (channel === "marketing" && !customer.marketingOptIn) {
      return false;
    }

    if (channel === "reminder" && !customer.reminderOptIn) {
      return false;
    }

    // Check channel-specific preferences
    if (preferences && preferences[type] === false) {
      return false;
    }

    return true;
  }

  private formatLoyaltyTier(tier: string): string {
    const tierNames = {
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold",
      platinum: "Platinum",
      diamond: "Diamond"
    };
    return tierNames[tier as keyof typeof tierNames] || "Bronze";
  }

  private async getTargetCustomers(campaign: MarketingCampaign): Promise<Customer[]> {
    let query = db.select().from(customers);
    const conditions: any[] = [eq(customers.isActive, true)];

    // Target by segments
    if (campaign.targetSegments) {
      const segments = campaign.targetSegments as string[];
      conditions.push(inArray(customers.customerSegment, segments));
    }

    // Target by loyalty tiers
    if (campaign.targetLoyaltyTiers) {
      const tiers = campaign.targetLoyaltyTiers as string[];
      conditions.push(inArray(customers.loyaltyTier, tiers));
    }

    // Additional criteria can be added here
    if (campaign.targetCriteria) {
      // Complex targeting logic based on criteria
    }

    return await query.where(and(...conditions));
  }

  private async sendCommunication(communicationId: string): Promise<void> {
    // Simulate sending communication
    // In a real implementation, this would integrate with email/SMS providers
    await db.update(communications)
      .set({
        status: "sent",
        sentAt: new Date()
      })
      .where(eq(communications.id, communicationId));

    // Simulate delivery (in real implementation, this would be webhook-based)
    setTimeout(async () => {
      await db.update(communications)
        .set({
          status: "delivered",
          deliveredAt: new Date()
        })
        .where(eq(communications.id, communicationId));
    }, 1000);
  }

  // Automated message handlers

  private async sendOrderConfirmations(): Promise<void> {
    // Find orders created in the last hour without confirmation sent
    const recentOrders = await db
      .select({
        order: orders,
        customer: customers
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerEmail, customers.email))
      .where(
        and(
          gte(orders.createdAt, sql`NOW() - INTERVAL '1 hour'`),
          eq(orders.status, "pending")
        )
      );

    for (const { order, customer } of recentOrders) {
      if (!customer) continue;

      const template = await this.getTemplateByType("transactional", "order_confirmation");
      if (template) {
        await this.sendPersonalizedMessage(customer.id, template.id, {
          order_number: order.orderNumber,
          order_total: `₹${parseFloat(order.totalAmount).toFixed(2)}`,
          pickup_date: order.createdAt.toLocaleDateString()
        });
      }
    }
  }

  private async sendOrderReminders(): Promise<void> {
    // Find orders ready for pickup/delivery
    const readyOrders = await db
      .select({
        order: orders,
        customer: customers
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerEmail, customers.email))
      .where(eq(orders.status, "completed"));

    for (const { order, customer } of readyOrders) {
      if (!customer) continue;

      const template = await this.getTemplateByType("reminder", "order_ready");
      if (template) {
        await this.sendPersonalizedMessage(customer.id, template.id, {
          order_number: order.orderNumber
        });
      }
    }
  }

  private async sendLoyaltyUpdates(): Promise<void> {
    // Find customers whose loyalty tier was upgraded today
    const upgradedCustomers = await db
      .select()
      .from(loyaltyTransactions)
      .leftJoin(customers, eq(loyaltyTransactions.customerId, customers.id))
      .where(
        and(
          eq(loyaltyTransactions.transactionType, "bonus"),
          gte(loyaltyTransactions.createdAt, sql`CURRENT_DATE`),
          sql`${loyaltyTransactions.description} LIKE '%tier upgrade%'`
        )
      );

    for (const { customers: customer } of upgradedCustomers) {
      if (!customer) continue;

      const template = await this.getTemplateByType("transactional", "loyalty_upgrade");
      if (template) {
        await this.sendPersonalizedMessage(customer.id, template.id);
      }
    }
  }

  private async sendBirthdayWishes(): Promise<void> {
    const today = new Date();
    const birthdayCustomers = await db
      .select()
      .from(customers)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${customers.dateOfBirth}) = ${today.getMonth() + 1}`,
          sql`EXTRACT(DAY FROM ${customers.dateOfBirth}) = ${today.getDate()}`,
          eq(customers.isActive, true)
        )
      );

    for (const customer of birthdayCustomers) {
      const template = await this.getTemplateByType("marketing", "birthday");
      if (template) {
        await this.sendPersonalizedMessage(customer.id, template.id, {
          promotion_code: "BIRTHDAY20",
          discount_amount: "20%"
        });
      }
    }
  }

  private async sendAnniversaryWishes(): Promise<void> {
    const today = new Date();
    const anniversaryCustomers = await db
      .select()
      .from(customers)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${customers.anniversary}) = ${today.getMonth() + 1}`,
          sql`EXTRACT(DAY FROM ${customers.anniversary}) = ${today.getDate()}`,
          eq(customers.isActive, true)
        )
      );

    for (const customer of anniversaryCustomers) {
      const template = await this.getTemplateByType("marketing", "anniversary");
      if (template) {
        await this.sendPersonalizedMessage(customer.id, template.id, {
          promotion_code: "ANNIVERSARY25",
          discount_amount: "25%"
        });
      }
    }
  }

  private async sendWinbackMessages(): Promise<void> {
    // Find customers inactive for 60+ days
    const inactiveCustomers = await db
      .select()
      .from(customers)
      .where(
        and(
          sql`${customers.lastOrder} < NOW() - INTERVAL '60 days'`,
          eq(customers.customerSegment, "inactive"),
          eq(customers.isActive, true)
        )
      );

    for (const customer of inactiveCustomers) {
      const template = await this.getTemplateByType("marketing", "winback");
      if (template) {
        await this.sendPersonalizedMessage(customer.id, template.id, {
          promotion_code: "COMEBACK30",
          discount_amount: "30%"
        });
      }
    }
  }

  private async sendReviewRequests(): Promise<void> {
    // Find completed orders from 2-3 days ago
    const completedOrders = await db
      .select({
        order: orders,
        customer: customers
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerEmail, customers.email))
      .where(
        and(
          eq(orders.status, "completed"),
          gte(orders.actualCompletion, sql`NOW() - INTERVAL '3 days'`),
          lte(orders.actualCompletion, sql`NOW() - INTERVAL '2 days'`)
        )
      );

    for (const { order, customer } of completedOrders) {
      if (!customer) continue;

      const template = await this.getTemplateByType("transactional", "review_request");
      if (template) {
        await this.sendPersonalizedMessage(customer.id, template.id, {
          order_number: order.orderNumber
        });
      }
    }
  }

  private async getTemplateByType(channel: string, templateType: string): Promise<CommunicationTemplate | null> {
    const [template] = await db
      .select()
      .from(communicationTemplates)
      .where(
        and(
          eq(communicationTemplates.channel, channel),
          eq(communicationTemplates.isActive, true),
          sql`${communicationTemplates.name} ILIKE ${`%${templateType}%`}`
        )
      )
      .limit(1);

    return template || null;
  }

  /**
   * Get available template variables
   */
  getTemplateVariables(): TemplateVariable[] {
    return this.templateVariables;
  }

  /**
   * Validate template content
   */
  validateTemplate(content: string): { isValid: boolean; errors: string[]; usedVariables: string[] } {
    const errors: string[] = [];
    const usedVariables: string[] = [];

    // Find all variables in template
    const variableMatches = content.match(/{{.*?}}/g) || [];

    variableMatches.forEach(match => {
      const variableName = match.replace(/[{}]/g, "").trim();
      usedVariables.push(variableName);

      // Check if variable exists
      const variableExists = this.templateVariables.some(v => v.name === variableName);
      if (!variableExists) {
        errors.push(`Unknown variable: ${variableName}`);
      }
    });

    // Check required variables
    const requiredVariables = this.templateVariables.filter(v => v.required);
    requiredVariables.forEach(reqVar => {
      if (!usedVariables.includes(reqVar.name)) {
        errors.push(`Required variable missing: ${reqVar.name}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      usedVariables: [...new Set(usedVariables)]
    };
  }
}

// Export singleton instance
export const communicationService = new CommunicationService();