import { eq, and, desc, asc, like, inArray, sql, count, sum, avg } from "drizzle-orm";
import type { Order, OrderItem, Garment, Service, InsertOrder, InsertOrderItem } from "../../shared/schema";
import { orders, orderItems, garments, services } from "../../shared/schema";
import { db } from "../database";
import { autoTaggingSystem, type TagSuggestion } from "../utils/tagging-system";

export interface OrderFilters {
  status?: string[];
  orderType?: string[];
  urgency?: string[];
  customerName?: string;
  phoneNumber?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  minAmount?: number;
  maxAmount?: number;
}

export interface OrderSortOptions {
  field: keyof Order;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByType: Record<string, number>;
  topGarmentCategories: Array<{ category: string; count: number; revenue: number }>;
  processingTimes: {
    average: number;
    byUrgency: Record<string, number>;
  };
}

export class OrderService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Create optimized order with automatic tagging and pricing
   */
  async createOptimizedOrder(orderData: InsertOrder, itemsData: InsertOrderItem[]): Promise<Order & { items: OrderItem[]; tags: TagSuggestion[] }> {
    return await db.transaction(async (tx) => {
      // Create the order
      const [order] = await tx.insert(orders).values(orderData).returning();

      // Create order items
      const orderItemsWithOrderId = itemsData.map(item => ({
        ...item,
        orderId: order.id
      }));

      const createdItems = await tx.insert(orderItems).values(orderItemsWithOrderId).returning();

      // Generate automatic tags
      const tags = autoTaggingSystem.generateOrderTags(order, createdItems);

      // Calculate totals based on items
      const totalPieces = createdItems.reduce((sum, item) =>
        sum + (item.itemType === 'piece_based' ? item.quantity : 0), 0);

      const totalWeight = createdItems.reduce((sum, item) =>
        sum + (parseFloat(item.weight?.toString() || '0')), 0);

      const orderType = this.determineOrderType(createdItems);
      const garmentTypes = await this.extractGarmentTypes(createdItems);

      // Get pricing suggestions
      const baseTotalAmount = parseFloat(order.totalAmount);
      const pricingSuggestions = autoTaggingSystem.getPricingSuggestions(tags, baseTotalAmount);

      // Get estimated completion time
      const estimatedCompletion = autoTaggingSystem.getEstimatedCompletion(tags);

      // Update order with calculated values
      const [updatedOrder] = await tx.update(orders)
        .set({
          totalPieces,
          totalWeight: totalWeight.toString(),
          orderType,
          garmentTypes,
          tags: tags.map(t => ({ id: t.tag.id, name: t.tag.name, confidence: t.confidence })),
          totalAmount: pricingSuggestions.adjustedPrice.toString(),
          estimatedCompletion: new Date(Date.now() + estimatedCompletion.estimatedHours * 60 * 60 * 1000),
        })
        .where(eq(orders.id, order.id))
        .returning();

      // Clear relevant caches
      this.clearCacheByPattern('orders_');
      this.clearCacheByPattern('analytics_');

      return {
        ...updatedOrder,
        items: createdItems,
        tags
      };
    });
  }

  /**
   * Get orders with advanced filtering and caching
   */
  async getOrders(
    filters: OrderFilters = {},
    sort: OrderSortOptions = { field: 'createdAt', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    const cacheKey = `orders_${JSON.stringify({ filters, sort, pagination })}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Build optimized query
    let query = db.select().from(orders);

    // Apply filters
    const conditions = this.buildOrderFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = orders[sort.field];
    if (sortColumn) {
      query = sort.direction === 'asc'
        ? query.orderBy(asc(sortColumn))
        : query.orderBy(desc(sortColumn));
    }

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.limit(pagination.limit).offset(offset);

    // Execute queries in parallel
    const [ordersResult, totalResult] = await Promise.all([
      query,
      this.getOrdersCount(filters)
    ]);

    const result = {
      orders: ordersResult,
      total: totalResult,
      pages: Math.ceil(totalResult / pagination.limit)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get order with items and related data
   */
  async getOrderWithDetails(orderId: string): Promise<Order & {
    items: (OrderItem & { garment?: Garment; service?: Service })[];
    analytics: {
      totalItems: number;
      totalWeight: number;
      estimatedCompletion: Date | null;
      tags: TagSuggestion[];
    };
  } | null> {
    const cacheKey = `order_details_${orderId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return null;

    // Get order items with related data
    const orderItemsWithDetails = await db
      .select({
        orderItem: orderItems,
        garment: garments,
        service: services,
      })
      .from(orderItems)
      .leftJoin(garments, eq(orderItems.garmentId, garments.id))
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .where(eq(orderItems.orderId, orderId));

    const items = orderItemsWithDetails.map(({ orderItem, garment, service }) => ({
      ...orderItem,
      garment: garment || undefined,
      service: service || undefined,
    }));

    // Generate fresh tags
    const tags = autoTaggingSystem.generateOrderTags(order, items);

    const result = {
      ...order,
      items,
      analytics: {
        totalItems: items.length,
        totalWeight: items.reduce((sum, item) => sum + parseFloat(item.weight?.toString() || '0'), 0),
        estimatedCompletion: order.estimatedCompletion,
        tags,
      }
    };

    this.setCache(cacheKey, result, 2 * 60 * 1000); // 2 minutes for detailed data
    return result;
  }

  /**
   * Update order with automatic recalculation
   */
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
    const [updatedOrder] = await db.update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    if (updatedOrder) {
      // Clear caches
      this.clearCacheByPattern(`order_${orderId}`);
      this.clearCacheByPattern('orders_');
      this.clearCacheByPattern('analytics_');
    }

    return updatedOrder || null;
  }

  /**
   * Get comprehensive order analytics
   */
  async getOrderAnalytics(dateRange?: { start: Date; end: Date }): Promise<OrderAnalytics> {
    const cacheKey = `analytics_${dateRange ? `${dateRange.start.getTime()}_${dateRange.end.getTime()}` : 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let baseQuery = db.select().from(orders);

    if (dateRange) {
      baseQuery = baseQuery.where(
        and(
          sql`${orders.createdAt} >= ${dateRange.start}`,
          sql`${orders.createdAt} <= ${dateRange.end}`
        )
      );
    }

    // Execute analytics queries in parallel
    const [
      totalOrdersResult,
      revenueResult,
      ordersByStatusResult,
      ordersByTypeResult,
      averageOrderValueResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(orders),
      db.select({ total: sum(orders.totalAmount) }).from(orders),
      db.select({
        status: orders.status,
        count: count()
      }).from(orders).groupBy(orders.status),
      db.select({
        orderType: orders.orderType,
        count: count()
      }).from(orders).groupBy(orders.orderType),
      db.select({ avg: avg(orders.totalAmount) }).from(orders),
    ]);

    // Get garment category analytics
    const garmentAnalytics = await db
      .select({
        category: garments.category,
        count: count(orderItems.id),
        revenue: sum(orderItems.totalPrice),
      })
      .from(orderItems)
      .leftJoin(garments, eq(orderItems.garmentId, garments.id))
      .groupBy(garments.category);

    const result: OrderAnalytics = {
      totalOrders: totalOrdersResult[0]?.count || 0,
      totalRevenue: parseFloat(revenueResult[0]?.total || '0'),
      averageOrderValue: parseFloat(averageOrderValueResult[0]?.avg || '0'),
      ordersByStatus: Object.fromEntries(
        ordersByStatusResult.map(item => [item.status, item.count])
      ),
      ordersByType: Object.fromEntries(
        ordersByTypeResult.map(item => [item.orderType, item.count])
      ),
      topGarmentCategories: garmentAnalytics.map(item => ({
        category: item.category || 'Unknown',
        count: item.count,
        revenue: parseFloat(item.revenue || '0'),
      })),
      processingTimes: {
        average: 24, // TODO: Calculate from actual completion times
        byUrgency: {
          low: 48,
          normal: 24,
          high: 12,
          urgent: 4,
        },
      },
    };

    this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minutes for analytics
    return result;
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(orderIds: string[], updates: Partial<Order>): Promise<Order[]> {
    const updatedOrders = await db.update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(inArray(orders.id, orderIds))
      .returning();

    // Clear caches
    orderIds.forEach(id => this.clearCacheByPattern(`order_${id}`));
    this.clearCacheByPattern('orders_');
    this.clearCacheByPattern('analytics_');

    return updatedOrders;
  }

  /**
   * Search orders with full-text capabilities
   */
  async searchOrders(query: string, limit: number = 20): Promise<Order[]> {
    const cacheKey = `search_${query}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const searchResults = await db.select()
      .from(orders)
      .where(
        sql`(
          ${orders.customerName} ILIKE ${`%${query}%`} OR
          ${orders.customerPhone} ILIKE ${`%${query}%`} OR
          ${orders.customerEmail} ILIKE ${`%${query}%`} OR
          ${orders.orderNumber} ILIKE ${`%${query}%`} OR
          ${orders.specialInstructions} ILIKE ${`%${query}%`}
        )`
      )
      .limit(limit)
      .orderBy(desc(orders.createdAt));

    this.setCache(cacheKey, searchResults, 2 * 60 * 1000); // 2 minutes for search
    return searchResults;
  }

  // Private helper methods

  private buildOrderFilters(filters: OrderFilters): any[] {
    const conditions: any[] = [];

    if (filters.status?.length) {
      conditions.push(inArray(orders.status, filters.status));
    }

    if (filters.orderType?.length) {
      conditions.push(inArray(orders.orderType, filters.orderType));
    }

    if (filters.urgency?.length) {
      conditions.push(inArray(orders.urgency, filters.urgency));
    }

    if (filters.customerName) {
      conditions.push(like(orders.customerName, `%${filters.customerName}%`));
    }

    if (filters.phoneNumber) {
      conditions.push(like(orders.customerPhone, `%${filters.phoneNumber}%`));
    }

    if (filters.dateRange) {
      conditions.push(
        and(
          sql`${orders.createdAt} >= ${filters.dateRange.start}`,
          sql`${orders.createdAt} <= ${filters.dateRange.end}`
        )
      );
    }

    if (filters.minAmount) {
      conditions.push(sql`${orders.totalAmount}::numeric >= ${filters.minAmount}`);
    }

    if (filters.maxAmount) {
      conditions.push(sql`${orders.totalAmount}::numeric <= ${filters.maxAmount}`);
    }

    return conditions;
  }

  private async getOrdersCount(filters: OrderFilters): Promise<number> {
    let query = db.select({ count: count() }).from(orders);

    const conditions = this.buildOrderFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const [result] = await query;
    return result.count;
  }

  private determineOrderType(items: OrderItem[]): "piece_based" | "weight_based" | "mixed" {
    const pieceItems = items.filter(item => item.itemType === 'piece_based');
    const weightItems = items.filter(item => item.itemType === 'weight_based');

    if (pieceItems.length > 0 && weightItems.length > 0) return 'mixed';
    if (weightItems.length > 0) return 'weight_based';
    return 'piece_based';
  }

  private async extractGarmentTypes(items: OrderItem[]): Promise<string[]> {
    const garmentIds = items
      .map(item => item.garmentId)
      .filter((id): id is string => id !== null);

    if (garmentIds.length === 0) return [];

    const garmentsData = await db.select({ category: garments.category })
      .from(garments)
      .where(inArray(garments.id, garmentIds));

    return [...new Set(garmentsData.map(g => g.category))];
  }

  // Cache management methods

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Cleanup old entries
    if (this.cache.size > 1000) { // Prevent memory leaks
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private clearCacheByPattern(pattern: string): void {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const orderService = new OrderService();