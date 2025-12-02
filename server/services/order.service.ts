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

import { Order, InsertOrder } from '../../shared/schema';

export interface OrderFilters {
  status?: string;
  search?: string;
  customerEmail?: string;
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

      // Fetch orders from database
      let orders = await storage.listOrders();

      // Apply email filter if provided
      if (filters.customerEmail) {
        orders = orders.filter((order: Order) => order.customerEmail === filters.customerEmail);
      }

      // Apply status filter if provided
      if (filters.status && filters.status !== 'all') {
        orders = orders.filter((order: Order) => order.status === filters.status);
      }

      // Apply search filter if provided
      if (filters.search && typeof filters.search === 'string') {
        const searchTerm = filters.search.toLowerCase();
        orders = orders.filter(
          (order: Order) =>
            order.customerName?.toLowerCase().includes(searchTerm) ||
            order.customerEmail?.toLowerCase().includes(searchTerm) ||
            order.id.toLowerCase().includes(searchTerm) ||
            order.orderNumber?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply sorting if provided
      if (filters.sortBy) {
        const sortBy = filters.sortBy as keyof Order;
        const sortOrder = filters.sortOrder || 'desc';
        orders.sort((a: Order, b: Order) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];

          if (aValue === undefined || aValue === null || bValue === undefined || bValue === null) return 0;

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
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

      // Update customer stats if customerId is present
      if (order.customerId) {
        try {
          const customer = await storage.getCustomer(order.customerId);
          if (customer) {
            const currentTotalSpent = parseFloat(customer.totalSpent || '0');
            const orderTotal = parseFloat(order.totalAmount || '0');

            await storage.updateCustomer(order.customerId, {
              totalOrders: (customer.totalOrders || 0) + 1,
              totalSpent: (currentTotalSpent + orderTotal).toString(),
              lastOrder: new Date()
            });
            console.log(`✅ [OrderService] Updated stats for customer: ${order.customerId}`);
          }
        } catch (error) {
          console.error(`❌ [OrderService] Failed to update customer stats:`, error);
          // Don't fail the order creation if stats update fails
        }
      }

      // Enrich with algorithm processing
      const enrichedOrder = enrichOrderWithAlgorithms(order);

      console.log(`✅ [OrderService] Order created: ${order.id}`);

      // WhatsApp confirmation is now handled by the client after PDF generation
      // to ensure the invoice is attached.

      return enrichedOrder;
    } catch (error) {
      console.error('❌ [OrderService] Error creating order:', error);
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
   * Delete an order
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      console.log(`📦 [OrderService] Deleting order: ${orderId}`);

      const deleted = await storage.deleteOrder(orderId);

      if (!deleted) {
        throw new Error(`Failed to delete order: ${orderId}`);
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

      const stats = {
        totalOrders: orders.length,
        priorityBreakdown: {
          high: orders.filter((o: any) => o.priority === 'high').length,
          medium: orders.filter((o: any) => o.medium === 'medium').length,
          normal: orders.filter((o: any) => o.normal === 'normal').length,
          low: orders.filter((o: any) => o.low === 'low').length,
        },
        totalValue: orders.reduce(
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
}

/**
 * Singleton instance of OrderService
 */
export const orderService = new OrderService();

