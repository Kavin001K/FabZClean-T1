import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import { insertOrderSchema } from "../schema";
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
import type { UserRole } from "../../shared/supabase";

const router = Router();
const orderService = new OrderService();

const ORDER_CREATE_ROLES: UserRole[] = [
  "admin",
  "employee",
  "factory_manager",
  "franchise_manager",
];
const ORDER_UPDATE_ROLES: UserRole[] = ["admin", "factory_manager"];
const ORDER_ANALYTICS_ROLES: UserRole[] = [
  "admin",
  "factory_manager",
  "franchise_manager",
];
const ADMIN_ONLY: UserRole[] = ["admin"];

// Apply rate limiting to all order routes
router.use(rateLimit(60000, 100)); // 100 requests per minute
router.use(jwtRequired);

// Get orders with pagination and search
router.get('/', async (req, res) => {
  try {
    const { 
      email, 
      cursor, 
      limit = 20, 
      search, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Use OrderService to fetch and enrich orders
    const filters = {
      status: status as string | undefined,
      search: search as string | undefined,
      customerEmail: email as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const orders = await orderService.findAllOrders(filters);

    // Apply pagination
    const limitNum = parseInt(limit as string) || 20;
    const startIndex = cursor ? orders.findIndex(o => o.id === cursor) + 1 : 0;
    const endIndex = startIndex + limitNum;
    
    const paginatedOrders = orders.slice(startIndex, endIndex);
    const hasMore = endIndex < orders.length;
    const nextCursor = hasMore ? paginatedOrders[paginatedOrders.length - 1]?.id : undefined;

    // Serialize orders
    const serializedOrders = paginatedOrders.map(order => serializeOrder(order));

    // Return paginated response
    const response = createPaginatedResponse(serializedOrders, {
      cursor: nextCursor,
      hasMore,
      total: orders.length,
      limit: limitNum
    });

    res.json(response);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch orders', 500));
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

    // Use OrderService to create order (includes external validation and enrichment)
    const order = await orderService.createOrder(orderData);

    // Award loyalty points (only if customerId exists)
    if (order.customerId) {
      await loyaltyProgram.processOrderRewards(
        order.customerId,
        parseFloat(order.totalAmount || "0")
      );
    }

    // Generate QR code
    try {
      await barcodeService.generateOrderBarcode(order.id);
    } catch (barcodeError) {
      console.warn('Failed to generate barcode:', barcodeError);
      // Don't fail the order creation if barcode generation fails
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('orders', 'created', order);

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
    
    res.status(500).json(createErrorResponse('Failed to create order', 500));
  }
  },
);

// Update order
router.put('/:id', requireRole(ORDER_UPDATE_ROLES), async (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    const updatedOrder = await storage.updateOrder(orderId, updateData);

    // Notify real-time clients
    realtimeServer.triggerUpdate('orders', 'updated', updatedOrder);

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

    const updatedOrder = await storage.updateOrder(orderId, { status });

    // Notify real-time clients
    realtimeServer.triggerUpdate('orders', 'status_changed', {
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

    // Notify real-time clients
    realtimeServer.triggerUpdate('orders', 'deleted', { orderId });

    res.json(createSuccessResponse(null, 'Order deleted successfully'));
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json(createErrorResponse('Failed to delete order', 500));
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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitNum);

    // Transform orders for suggestions
    const transformedOrders = recentOrders.map(order => {
      const serviceNames = order.service ? order.service.split(',').filter(Boolean) : [];
      const serviceIds = order.serviceId ? order.serviceId.split(',').filter(Boolean) : [];

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
        products: serviceIds.map(id => {
          const product = products.find(p => p.id === id);
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

// Get order analytics
router.get(
  "/analytics/overview",
  requireRole(ORDER_ANALYTICS_ROLES),
  async (req, res) => {
  try {
    const orders = await storage.listOrders();

    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0),
      statusBreakdown: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0) / orders.length 
        : 0,
      ordersToday: orders.filter(order => {
        const today = new Date().toISOString().split('T')[0];
        return order.createdAt.startsWith(today);
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
