import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import { insertOrderSchema, type Order, type Product } from "../../shared/schema";
import {
  jwtRequired,
  validateInput,
  rateLimit,
  requireRole,
} from "../middleware/auth";
import {
  serializeOrder,
  createPaginatedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../services/serialization";
import { realtimeServer } from "../websocket-server";
import { loyaltyProgram } from "../loyalty-program";
import { barcodeService } from "../barcode-service";
import { OrderService } from "../services/order.service";
import { AuthService } from "../auth-service";
import type { UserRole } from "../../shared/supabase";

const router = Router();
const orderService = new OrderService();

const ORDER_CREATE_ROLES: UserRole[] = [
  "admin",
  "employee",
  "factory_manager",
  "franchise_manager",
];
const ORDER_UPDATE_ROLES: UserRole[] = [
  "admin",
  "factory_manager",
  "franchise_manager",
  "employee",
];
const ORDER_ANALYTICS_ROLES: UserRole[] = [
  "admin",
  "factory_manager",
  "franchise_manager",
];
const ADMIN_ONLY: UserRole[] = ["admin"];

// Apply rate limiting to all order routes
router.use(rateLimit(60000, 100)); // 100 requests per minute
router.use(jwtRequired);

// Search orders by query (order number, barcode, customer name, etc.)
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();

    if (!query) {
      return res.json([]);
    }

    const allOrders = await storage.listOrders();
    const queryLower = query.toLowerCase();

    // Search across multiple fields
    const matchingOrders = allOrders.filter((order: Order) => {
      // Match by order number (exact or partial)
      if (order.orderNumber?.toLowerCase().includes(queryLower)) return true;

      // Match by order ID (UUID)
      if (order.id?.toLowerCase() === queryLower) return true;

      // Match by customer name
      if (order.customerName?.toLowerCase().includes(queryLower)) return true;

      // Match by customer phone
      if (order.customerPhone?.includes(query)) return true;

      // Match by customer email
      if (order.customerEmail?.toLowerCase().includes(queryLower)) return true;

      // Search within items (service names, custom names)
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.serviceName?.toLowerCase().includes(queryLower)) return true;
          if ((item as any).customName?.toLowerCase().includes(queryLower)) return true;
        }
      }

      return false;
    });

    // Also search transit orders if the query looks like a transit ID
    let transitMatches: any[] = [];
    if (query.startsWith('TR-') || query.startsWith('tr-')) {
      try {
        const allTransits = await storage.listTransitOrders();
        transitMatches = allTransits.filter((t: any) =>
          t.transitId?.toLowerCase().includes(queryLower)
        );
      } catch (e) {
        console.warn('Transit search failed:', e);
      }
    }

    // Serialize and limit results
    const serializedOrders = matchingOrders.slice(0, 20).map((order: Order) => serializeOrder(order));

    // If searching for transit and found matches, include transit info in response
    if (transitMatches.length > 0) {
      // Find orders that are in the matched transits
      const transitItems = await Promise.all(
        transitMatches.map(async (t: any) => {
          try {
            const items = await storage.getTransitOrderItems(t.id);
            return items.map((item: any) => item.orderId);
          } catch (e) {
            return [];
          }
        })
      );
      const transitOrderIds = new Set(transitItems.flat());

      // Add transit-related orders to results
      const transitRelatedOrders = allOrders.filter((o: Order) => transitOrderIds.has(o.id));
      for (const order of transitRelatedOrders) {
        if (!serializedOrders.find((so: any) => so.id === order.id)) {
          serializedOrders.push(serializeOrder(order));
        }
      }
    }

    res.json(serializedOrders);
  } catch (error) {
    console.error('Search orders error:', error);
    res.status(500).json(createErrorResponse('Failed to search orders', 500));
  }
});

// Get orders with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const customerEmail = req.query.customerEmail as string;

    // Enforce franchise isolation
    const user = (req as any).user;
    let franchiseId = undefined;

    if (user && user.role !== 'admin' && user.role !== 'factory_manager') {
      franchiseId = user.franchiseId;
    } else if (user && (user.role === 'admin' || user.role === 'factory_manager') && req.query.franchiseId) {
      // Allow admin to filter by specific franchise if needed
      franchiseId = req.query.franchiseId as string;
    }

    const filters = {
      limit,
      search,
      status: status === 'all' ? undefined : status,
      customerEmail,
      franchiseId
    };

    const orders = await orderService.findAllOrders(filters);

    // Calculate pagination
    const total = orders.length; // This is an approximation as findAllOrders returns all matches
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    const serializedOrders = paginatedOrders.map(order => serializeOrder(order));

    const response = createPaginatedResponse(serializedOrders, {
      total: orders.length,
      limit: limit
    });

    res.json(response);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch orders', 500));
  }
});

// Get recent orders (for suggestions)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string) || 10;

    const orders = await storage.listOrders();
    const products = await storage.listProducts();

    // Get recent orders sorted by creation date
    const recentOrders = orders
      .sort((a: Order, b: Order) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limitNum);

    // Transform orders for suggestions
    const transformedOrders = recentOrders.map((order: Order) => {
      const serviceNames = order.service ? order.service.split(',').filter(Boolean) : [];
      const serviceIds = (order as any).serviceId ? (order as any).serviceId.split(',').filter(Boolean) : [];

      return {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        services: serviceNames,
        serviceIds: serviceIds,
        total: parseFloat(order.totalAmount || '0'),
        status: order.status,
        createdAt: order.createdAt,
        // Add product information if available
        products: serviceIds.map((id: string) => {
          const product = products.find((p: Product) => p.id === id);
          return product ? {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price || '0')
          } : null;
        }).filter(Boolean)
      };
    });

    res.json(createSuccessResponse(transformedOrders));
  } catch (error) {
    console.error('Fetch recent orders error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch recent orders', 500));
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    // Use OrderService to fetch and enrich single order
    const order = await orderService.getOrderById(req.params.id);

    const serializedOrder = serializeOrder(order);
    res.json(createSuccessResponse(serializedOrder));
  } catch (error) {
    console.error('Get order error:', error);
    if (error instanceof Error && error.message.includes('Order not found')) {
      res.status(404).json(createErrorResponse('Order not found', 404));
    } else {
      res.status(500).json(createErrorResponse('Failed to fetch order', 500));
    }
  }
});

// Create new order
router.post(
  "/",
  requireRole(ORDER_CREATE_ROLES),
  validateInput(insertOrderSchema),
  async (req, res) => {
    try {
      const orderData = req.body;

      // Enforce franchise isolation
      const user = (req as any).user;
      if (user && user.role !== 'admin') {
        orderData.franchiseId = user.franchiseId;
      } else if (user && user.role === 'admin' && !orderData.franchiseId) {
        // Admins should ideally provide a franchiseId, but if missing, standard defaults apply
      }

      // Use OrderService to create order (includes external validation and enrichment)
      const order = await orderService.createOrder(orderData);

      // Log order creation
      if (req.employee) {
        await AuthService.logAction(
          req.employee.employeeId,
          req.employee.username,
          'create_order',
          'order',
          order.id,
          {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            customerName: order.customerName
          },
          req.ip || req.connection.remoteAddress,
          req.get('user-agent')
        );
      }

      // Award loyalty points (only if customerId exists)
      if (order.customerId) {
        try {
          await loyaltyProgram.processOrderRewards(
            order.customerId,
            parseFloat(order.totalAmount || "0")
          );
        } catch (loyaltyError) {
          console.warn('Failed to process loyalty rewards:', loyaltyError);
        }
      }

      // Generate QR code
      try {
        await barcodeService.generateOrderBarcode(order.id);
      } catch (barcodeError) {
        console.warn('Failed to generate barcode:', barcodeError);
        // Don't fail the order creation if barcode generation fails
      }

      // Notify real-time clients
      realtimeServer.triggerUpdate('order', 'created', order);

      const serializedOrder = serializeOrder(order);
      res.status(201).json(createSuccessResponse(serializedOrder, 'Order created successfully'));
    } catch (error) {
      console.error('Create order error:', error);

      // Handle specific validation errors
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          return res.status(400).json(createErrorResponse(error.message, 400));
        }
        if (error.message.includes('Customer validation failed')) {
          return res.status(400).json(createErrorResponse(error.message, 400));
        }
      }

      res.status(500).json(createErrorResponse(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`, 500));
    }
  },
);

// Update order
router.put('/:id', requireRole(ORDER_UPDATE_ROLES), async (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;
    console.log(`[UPDATE ORDER] ID: ${orderId}`, JSON.stringify(updateData, null, 2));

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    const updatedOrder = await storage.updateOrder(orderId, updateData);

    // Log updates
    if (req.employee) {
      const changes: any = {};

      // Check for price change
      if (updateData.totalAmount && updateData.totalAmount !== order.totalAmount) {
        changes.price_changed = {
          from: order.totalAmount,
          to: updateData.totalAmount
        };
      }

      // Check for payment status change
      if (updateData.paymentStatus && updateData.paymentStatus !== order.paymentStatus) {
        changes.payment_status_changed = {
          from: order.paymentStatus,
          to: updateData.paymentStatus
        };

        // If marked as paid, log specifically
        if (updateData.paymentStatus === 'paid') {
          await AuthService.logAction(
            req.employee.employeeId,
            req.employee.username,
            'payment_received',
            'order',
            orderId,
            {
              amount: updatedOrder?.totalAmount,
              method: updatedOrder?.paymentMethod
            },
            req.ip || req.connection.remoteAddress,
            req.get('user-agent')
          );
        }
      }

      // Log general update if there are other changes or just to track activity
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'update_order',
        'order',
        orderId,
        {
          changes,
          updateData
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('order', 'updated', updatedOrder);

    const serializedOrder = serializeOrder(updatedOrder);
    res.json(createSuccessResponse(serializedOrder, 'Order updated successfully'));
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json(createErrorResponse('Failed to update order', 500));
  }
});

// Update order status
router.patch(
  "/:id/status",
  requireRole(ORDER_UPDATE_ROLES),
  async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json(createErrorResponse('Status is required', 400));
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json(createErrorResponse('Order not found', 404));
      }

      /**
       * PAYMENT VALIDATION:
       * Orders cannot be marked as 'completed' or 'delivered' unless payment is 'paid'
       * This ensures no order is handed over without payment being collected
       */
      if ((status === 'completed' || status === 'delivered') && order.paymentStatus !== 'paid') {
        return res.status(400).json(createErrorResponse(
          'Payment must be marked as paid before completing or delivering the order',
          400
        ));
      }

      const updatedOrder = await storage.updateOrder(orderId, { status });

      // Log status change
      if (req.employee) {
        await AuthService.logAction(
          req.employee.employeeId,
          req.employee.username,
          'update_order_status',
          'order',
          orderId,
          {
            from: order.status,
            to: status
          },
          req.ip || req.connection.remoteAddress,
          req.get('user-agent')
        );
      }

      // Notify real-time clients
      realtimeServer.triggerUpdate('order', 'status_changed' as any, {
        orderId: orderId,
        status: status,
        previousStatus: order.status
      });

      const serializedOrder = serializeOrder(updatedOrder);
      res.json(createSuccessResponse(serializedOrder, 'Order status updated successfully'));
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json(createErrorResponse('Failed to update order status', 500));
    }
  },
);

// Log print action (Bill/Invoice)
router.post('/:id/log-print', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { type = 'bill' } = req.body; // bill, invoice, label, etc.

    if (req.employee) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'print_document',
        'order',
        orderId,
        {
          documentType: type
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(createSuccessResponse(null, 'Print action logged'));
  } catch (error) {
    console.error('Log print error:', error);
    res.status(500).json(createErrorResponse('Failed to log print action', 500));
  }
});

// Delete order
router.delete('/:id', requireRole(ADMIN_ONLY), async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    const deleted = await storage.deleteOrder(orderId);

    if (!deleted) {
      return res.status(500).json(createErrorResponse('Failed to delete order', 500));
    }

    // Log deletion
    if (req.employee) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'delete_order',
        'order',
        orderId,
        {
          orderNumber: order.orderNumber
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('order', 'deleted', { orderId });

    res.json(createSuccessResponse(null, 'Order deleted successfully'));
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json(createErrorResponse('Failed to delete order', 500));
  }
});



// Get order analytics
router.get(
  "/analytics/overview",
  requireRole(ORDER_ANALYTICS_ROLES),
  async (req, res) => {
    try {
      const user = (req as any).user;
      let franchiseId = undefined;
      if (user && user.role !== 'admin') {
        franchiseId = user.franchiseId;
      }

      const orders = await storage.listOrders(franchiseId);

      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, order: Order) => sum + parseFloat(order.totalAmount || '0'), 0),
        statusBreakdown: orders.reduce((acc: Record<string, number>, order: Order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageOrderValue: orders.length > 0
          ? orders.reduce((sum: number, order: Order) => sum + parseFloat(order.totalAmount || '0'), 0) / orders.length
          : 0,
        ordersToday: orders.filter((order: Order) => {
          const today = new Date().toISOString().split('T')[0];
          const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : '';
          return orderDate === today;
        }).length
      };

      res.json(createSuccessResponse(analytics));
    } catch (error) {
      console.error('Get order analytics error:', error);
      res.status(500).json(createErrorResponse('Failed to fetch order analytics', 500));
    }
  },
);

export default router;
