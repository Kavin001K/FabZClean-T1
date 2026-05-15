/**
 * Order Service Layer
 * Handles business logic for orders, including external API integration and algorithm processing
 */

import { db as storage } from '../db';
import { externalApiClient, ExternalApiError } from './externalApiClient';
import {
  enrichOrderWithAlgorithms,
  enrichOrdersWithAlgorithms,
  calculateOrderPriority,
  calculateOrderScore,
} from '../algorithms';
import { toISTDateString } from '../utils/date-utils';

import { Order, InsertOrder } from '../../shared/schema';

export interface OrderFilters {
  status?: string;
  search?: string;
  customerEmail?: string;
  createdDate?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface CustomerValidationResult {
  isValid: boolean;
  customerId: string;
  reason?: string;
  metadata?: any;
}

/**
 * Order Service
 * Encapsulates business logic for order operations
 */
export class OrderService {
  /**
   * Fetch all orders with optional filters
   * Enriches each order with external API data and algorithm processing
   */
  async findAllOrders(filters: OrderFilters = {}): Promise<Order[]> {
    try {
      console.log('📦 [OrderService] Fetching orders with filters:', filters);

      // Fetch orders from database with filters
      let orders = await storage.listOrders(undefined, {
        status: filters.status,
        search: filters.search,
        customerEmail: filters.customerEmail,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: filters.limit,
        page: filters.cursor ? parseInt(filters.cursor) : undefined
      });

      // Apply createdDate filter if provided (YYYY-MM-DD)
      // This remains in-memory for now to ensure consistency with existing IST logic
      if (filters.createdDate) {
        const targetDate = filters.createdDate;
        orders = orders.filter((order: Order) => {
          const dateStr = toISTDateString(order.createdAt);
          return dateStr === targetDate;
        });
      }

      // Create external data map for batch enrichment
      // const externalDataMap = new Map<string, any>();

      // Fetch external data for each order (with graceful degradation)
      // DISABLED: MyGreenTick is only for messaging, not order storage.
      /*
      const externalDataPromises = orders.map(async (order) => {
        try {
          // Attempt to fetch additional data from external API
          const externalData = await externalApiClient.get(
            `/orders/${order.id}/details`
          );
          externalDataMap.set(order.id, externalData);
        } catch (error) {
          // Log warning but don't fail the request
          if (error instanceof ExternalApiError) {
            console.warn(
              `⚠️  External API unavailable for order ${order.id}:`,
              error.message
            );
          }
          // externalDataMap will not have an entry for this order
        }
      });

      // Wait for all external API calls to complete (or fail gracefully)
      await Promise.allSettled(externalDataPromises);
      */

      // Enrich orders with external data and algorithms
      // Passing empty map as we are skipping external enrichment
      const enrichedOrders = enrichOrdersWithAlgorithms(orders, new Map());

      console.log(
        `✅ [OrderService] Fetched ${enrichedOrders.length} orders`
      );

      return enrichedOrders;
    } catch (error) {
      console.error('❌ [OrderService] Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Fetch a single order by ID
   * Includes external data enrichment and algorithm processing
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      console.log(`📦 [OrderService] Fetching order: ${orderId}`);

      // Fetch order from database
      const order = await storage.getOrder(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Attempt to fetch external data (graceful degradation)
      let externalData: any = undefined;
      // DISABLED: MyGreenTick is only for messaging, not order storage.
      /*
      try {
        externalData = await externalApiClient.get(`/orders/${orderId}/details`);
      } catch (error) {
        console.warn(
          `⚠️  Could not fetch external data for order ${orderId}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      */

      // Enrich with external data and algorithms
      const enrichedOrder = enrichOrderWithAlgorithms(order, externalData);

      console.log(`✅ [OrderService] Fetched order: ${orderId}`);

      return enrichedOrder;
    } catch (error) {
      console.error(`❌ [OrderService] Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new order
   * Validates customer via external API before creating
   */
  async createOrder(orderData: InsertOrder): Promise<Order> {
    try {
      console.log('📦 [OrderService] Creating order for customer:', orderData.customerId);

      // Pre-validate customer via external API if customerId is provided
      // Skip validation if external API is not configured
      /*
      if (orderData.customerId) {
        try {
          const validation = await this.validateCustomer(orderData.customerId);

          // If validation service is unavailable, log warning but continue
          if (validation.reason === 'Validation service unavailable') {
            console.warn(
              `⚠️  [OrderService] External validation unavailable for customer ${orderData.customerId}, continuing with order creation`
            );
          } else if (!validation.isValid) {
            throw new Error(
              `Customer validation failed: ${validation.reason || 'Unknown reason'}`
            );
          } else {
            console.log(
              `✅ [OrderService] Customer validated: ${orderData.customerId}`
            );
          }
        } catch (error) {
          if (error instanceof ExternalApiError) {
            console.warn(
              '⚠️  [OrderService] External API error during validation:',
              error.message,
              '- continuing with order creation'
            );
            // Don't throw - allow order creation to proceed
          } else {
            // Re-throw other errors
            throw error;
          }
        }
      }
      */

      // Create the order
      const order = await storage.createOrder(orderData);

      console.log(`✅ [OrderService] Order created: ${order.id}`);

      // PERF: Defer customer stats refresh
      if (order.customerId) {
        setImmediate(() => this.refreshCustomerStats(order.customerId!));
      }

      // PERF: Skip algorithm enrichment on create path — only needed for list/display
      return order;
    } catch (error) {
      console.error('❌ [OrderService] Error creating order:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Update an existing order
   */
  async updateOrder(orderId: string, updateData: Partial<InsertOrder>): Promise<Order> {
    try {
      console.log(`📦 [OrderService] Updating order: ${orderId}`);

      const order = await storage.getOrder(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      const updatedOrder = await storage.updateOrder(orderId, updateData);

      // If status changed to or from cancelled/refunded, refresh customer stats
      if (
        (updateData.status && updateData.status !== order.status) &&
        (updateData.status === 'cancelled' || updateData.status === 'refunded' || order.status === 'cancelled' || order.status === 'refunded')
      ) {
        if (updatedOrder.customerId) {
          setImmediate(() => this.refreshCustomerStats(updatedOrder.customerId!));
        }
      }

      // Re-enrich with algorithms
      const enrichedOrder = enrichOrderWithAlgorithms(updatedOrder);

      console.log(`✅ [OrderService] Order updated: ${orderId}`);

      return enrichedOrder;
    } catch (error) {
      console.error(`❌ [OrderService] Error updating order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason: string, cancelledBy: string): Promise<Order> {
    try {
      console.log(`📦 [OrderService] Cancelling order: ${orderId}`);

      const updatedOrder = typeof (storage as any).cancelOrder === 'function'
        ? await (storage as any).cancelOrder(orderId, reason, cancelledBy)
        : await storage.updateOrder(orderId, {
            status: 'cancelled',
            cancellationReason: reason,
            cancelledAt: new Date(),
            cancelledBy: cancelledBy,
          });

      if (!updatedOrder) {
        throw new Error(`Failed to cancel order: ${orderId}`);
      }

      // Refresh customer stats after cancellation
      if (updatedOrder.customerId) {
        setImmediate(() => this.refreshCustomerStats(updatedOrder.customerId!));
      }

      console.log(`✅ [OrderService] Order cancelled: ${orderId}`);

      return enrichOrderWithAlgorithms(updatedOrder);
    } catch (error) {
      console.error(`❌ [OrderService] Error cancelling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      console.log(`📦 [OrderService] Deleting order: ${orderId}`);

      const order = await storage.getOrder(orderId);
      const deleted = await storage.deleteOrder(orderId);

      if (!deleted) {
        throw new Error(`Failed to delete order: ${orderId}`);
      }

      // Refresh customer stats after deletion
      if (order?.customerId) {
        setImmediate(() => this.refreshCustomerStats(order.customerId!));
      }

      console.log(`✅ [OrderService] Order deleted: ${orderId}`);

      return deleted;
    } catch (error) {
      console.error(`❌ [OrderService] Error deleting order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Validate customer via external API
   */
  private async validateCustomer(customerId: string): Promise<CustomerValidationResult> {
    try {
      const validation = await externalApiClient.get<CustomerValidationResult>(
        `/customer-validation/${customerId}`
      );

      console.log(`✅ [OrderService] Customer validation result:`, validation);

      return validation;
    } catch (error) {
      if (error instanceof ExternalApiError) {
        console.error(
          `❌ [OrderService] External API validation error for customer ${customerId}:`,
          error.message
        );
      }

      // Return invalid result if validation API fails
      return {
        isValid: false,
        customerId,
        reason: 'Validation service unavailable',
      };
    }
  }

  /**
   * Get order statistics with algorithm-based insights
   */
  async getOrderStatistics(filters: OrderFilters = {}): Promise<any> {
    try {
      const orders = await this.findAllOrders(filters);

      // For stats, we define "valid" orders as non-cancelled and non-refunded
      const validOrders = orders.filter((o: any) => 
        o.status !== 'cancelled' && 
        o.status !== 'refunded'
      );

      const stats = {
        totalOrders: orders.length,
        activeOrders: validOrders.length,
        cancelledOrders: orders.filter((o: any) => o.status === 'cancelled').length,
        refundedOrders: orders.filter((o: any) => o.status === 'refunded').length,
        priorityBreakdown: {
          high: validOrders.filter((o: any) => o.priority === 'high').length,
          medium: validOrders.filter((o: any) => o.priority === 'medium').length,
          normal: validOrders.filter((o: any) => o.priority === 'normal').length,
          low: validOrders.filter((o: any) => o.priority === 'low').length,
        },
        totalValue: validOrders.reduce(
          (sum, order) => sum + parseFloat(order.totalAmount || '0'),
          0
        ),
        ordersWithExternalData: orders.filter((o: any) => o.externalData).length,
      };

      return stats;
    } catch (error) {
      console.error('❌ [OrderService] Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Internal helper to refresh customer statistics from their order history
   */
  private async refreshCustomerStats(customerId: string): Promise<void> {
    try {
      const customer = await storage.getCustomer(customerId);
      if (!customer) return;

      const customerOrders = await storage.listOrders(undefined, {
        customerId: customerId
      });

      // Valid orders for spending/count are non-cancelled, non-refunded
      const validOrders = customerOrders.filter(o => 
        o.status !== 'cancelled' && 
        o.status !== 'refunded'
      );

      const totalSpent = validOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);
      
      await storage.updateCustomer(customerId, {
        totalOrders: validOrders.length,
        totalSpent: totalSpent.toFixed(2),
        lastOrder: validOrders.length > 0 
          ? new Date(Math.max(...validOrders.map(o => new Date(o.createdAt || 0).getTime()))).toISOString()
          : customer.lastOrder
      });
      
      console.log(`✅ [OrderService] Refreshed stats for customer: ${customerId}`);
    } catch (error) {
      console.error(`❌ [OrderService] Failed to refresh customer stats:`, error);
    }
  }
}

/**
 * Singleton instance of OrderService
 */
export const orderService = new OrderService();

