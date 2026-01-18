import { Router } from 'express';
import { z } from 'zod';
import { db as storage } from '../db';
import {
  adminLoginRequired,
  jwtRequired,
  validateInput,
  rateLimit
} from '../middleware/auth';
import {
  createPaginatedResponse,
  createErrorResponse,
  createSuccessResponse
} from '../services/serialization';
import { realtimeServer } from '../websocket-server';
import { AuthService } from '../auth-service';

const router = Router();

// Apply rate limiting
router.use(rateLimit(60000, 100));

// Get all transit orders (for employee dashboard)
router.get('/', jwtRequired, async (req, res) => {
  try {
    const transitOrders = await storage.listTransitOrders();
    res.json(transitOrders);
  } catch (error) {
    console.error('Get transit orders error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch transit orders', 500));
  }
});

// Transit batch schema
const transitBatchSchema = z.object({
  orderIds: z.array(z.string()),
  type: z.enum(['STORE_TO_FACTORY', 'FACTORY_TO_STORE']),
  createdBy: z.string(),
  notes: z.string().optional()
});

// Get transit batches
router.get('/batches', adminLoginRequired, async (req, res) => {
  try {
    const {
      cursor,
      limit = 20,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let batches = await storage.listTransitBatches();

    // Apply status filter
    if (status && status !== 'all') {
      batches = batches.filter(batch => batch.status === status);
    }

    // Apply type filter
    if (type && type !== 'all') {
      batches = batches.filter(batch => batch.type === type);
    }

    // Apply sorting
    batches.sort((a, b) => {
      const aValue = a[sortBy as string];
      const bValue = b[sortBy as string];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const limitNum = parseInt(limit as string) || 20;
    const startIndex = cursor ? batches.findIndex(b => b.id === cursor) + 1 : 0;
    const endIndex = startIndex + limitNum;

    const paginatedBatches = batches.slice(startIndex, endIndex);
    const hasMore = endIndex < batches.length;
    const nextCursor = hasMore ? paginatedBatches[paginatedBatches.length - 1]?.id : undefined;

    // Return paginated response
    const response = createPaginatedResponse(paginatedBatches, {
      cursor: nextCursor,
      hasMore,
      total: batches.length,
      limit: limitNum
    });

    res.json(response);
  } catch (error) {
    console.error('Get transit batches error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch transit batches', 500));
  }
});

// Get single transit batch
router.get('/batches/:id', adminLoginRequired, async (req, res) => {
  try {
    const batch = await storage.getTransitBatch(req.params.id);

    if (!batch) {
      return res.status(404).json(createErrorResponse('Transit batch not found', 404));
    }

    // Get associated orders
    const transitOrders = await storage.listTransitOrders();
    const batchTransitOrders = transitOrders.filter(to => to.transitBatchId === batch.id);

    // Get order details
    const orders = await storage.listOrders();
    const batchOrders = batchTransitOrders.map(to => {
      const order = orders.find(o => o.id === to.orderId);
      return order ? { ...to, order } : to;
    });

    const response = {
      ...batch,
      orders: batchOrders
    };

    res.json(createSuccessResponse(response));
  } catch (error) {
    console.error('Get transit batch error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch transit batch', 500));
  }
});

// Create transit batch
router.post('/batches', adminLoginRequired, validateInput(transitBatchSchema), async (req, res) => {
  try {
    const { orderIds, type, createdBy, notes } = req.body;

    // Validate that all orders exist and are in correct status
    const orders = await storage.listOrders();
    const validOrders = orderIds.filter((orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      return order && ['At Store', 'Processing'].includes(order.status);
    });

    if (validOrders.length !== orderIds.length) {
      return res.status(400).json(createErrorResponse('Some orders are invalid or not in correct status', 400));
    }

    // Create transit batch
    const batch = await storage.createTransitBatch({
      orderIds,
      type,
      createdBy,
      notes,
      status: 'PENDING'
    });

    // Create transit orders for each order in the batch
    for (const orderId of orderIds) {
      await storage.createTransitOrder({
        transitBatchId: batch.id,
        orderId,
        status: 'PENDING'
      });
    }

    // Update order statuses
    for (const orderId of orderIds) {
      await storage.updateOrder(orderId, { status: 'In Transit' });
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('transit_batches', 'created', batch);

    // Log action
    if ((req as any).employee) {
      await AuthService.logAction(
        (req as any).employee.employeeId,
        (req as any).employee.username,
        'create_transit_batch',
        'transit_batch',
        batch.id,
        {
          type,
          orderCount: orderIds.length,
          orderIds: orderIds,
          notes
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.status(201).json(createSuccessResponse(batch, 'Transit batch created successfully'));
  } catch (error) {
    console.error('Create transit batch error:', error);
    res.status(500).json(createErrorResponse('Failed to create transit batch', 500));
  }
});

// Initiate transit batch
router.put('/batches/:id/initiate', adminLoginRequired, async (req, res) => {
  try {
    const batchId = req.params.id;

    const batch = await storage.getTransitBatch(batchId);
    if (!batch) {
      return res.status(404).json(createErrorResponse('Transit batch not found', 404));
    }

    if (batch.status !== 'PENDING') {
      return res.status(400).json(createErrorResponse('Transit can only be initiated from PENDING status', 400));
    }

    // Update batch status
    const updatedBatch = await storage.updateTransitBatch(batchId, {
      status: 'IN_TRANSIT',
      initiatedAt: new Date().toISOString()
    });

    // Update transit orders status
    const transitOrders = await storage.listTransitOrders();
    const batchTransitOrders = transitOrders.filter(to => to.transitBatchId === batchId);

    for (const transitOrder of batchTransitOrders) {
      await storage.updateTransitOrder(transitOrder.id, { status: 'IN_TRANSIT' });
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('transit_batches', 'initiated', {
      batchId,
      status: 'IN_TRANSIT'
    });

    // Log action
    if ((req as any).employee) {
      await AuthService.logAction(
        (req as any).employee.employeeId,
        (req as any).employee.username,
        'initiate_transit_batch',
        'transit_batch',
        batchId,
        {
          status: 'IN_TRANSIT',
          initiatedAt: updatedBatch.initiatedAt
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(createSuccessResponse(updatedBatch, 'Transit batch initiated successfully'));
  } catch (error) {
    console.error('Initiate transit batch error:', error);
    res.status(500).json(createErrorResponse('Failed to initiate transit batch', 500));
  }
});

// Complete transit batch
router.put('/batches/:id/complete', adminLoginRequired, async (req, res) => {
  try {
    const batchId = req.params.id;

    const batch = await storage.getTransitBatch(batchId);
    if (!batch) {
      return res.status(404).json(createErrorResponse('Transit batch not found', 404));
    }

    if (batch.status !== 'IN_TRANSIT') {
      return res.status(400).json(createErrorResponse('Transit can only be completed from IN_TRANSIT status', 400));
    }

    // Update batch status
    const updatedBatch = await storage.updateTransitBatch(batchId, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    });

    // Update transit orders status
    const transitOrders = await storage.listTransitOrders();
    const batchTransitOrders = transitOrders.filter(to => to.transitBatchId === batchId);

    for (const transitOrder of batchTransitOrders) {
      await storage.updateTransitOrder(transitOrder.id, { status: 'COMPLETED' });
    }

    // Update order statuses based on batch type
    const newOrderStatus = batch.type === 'STORE_TO_FACTORY' ? 'Processing' : 'Ready for Delivery';
    for (const transitOrder of batchTransitOrders) {
      await storage.updateOrder(transitOrder.orderId, { status: newOrderStatus });
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('transit_batches', 'completed', {
      batchId,
      status: 'COMPLETED',
      newOrderStatus
    });

    // Log action
    if ((req as any).employee) {
      await AuthService.logAction(
        (req as any).employee.employeeId,
        (req as any).employee.username,
        'complete_transit_batch',
        'transit_batch',
        batchId,
        {
          status: 'COMPLETED',
          completedAt: updatedBatch.completedAt,
          newOrderStatus
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(createSuccessResponse(updatedBatch, 'Transit batch completed successfully'));
  } catch (error) {
    console.error('Complete transit batch error:', error);
    res.status(500).json(createErrorResponse('Failed to complete transit batch', 500));
  }
});

// Delete transit batch
router.delete('/batches/:id', adminLoginRequired, async (req, res) => {
  try {
    const batchId = req.params.id;

    const batch = await storage.getTransitBatch(batchId);
    if (!batch) {
      return res.status(404).json(createErrorResponse('Transit batch not found', 404));
    }

    if (batch.status === 'IN_TRANSIT') {
      return res.status(400).json(createErrorResponse('Cannot delete transit batch in progress', 400));
    }

    // Delete associated transit orders
    const transitOrders = await storage.listTransitOrders();
    const batchTransitOrders = transitOrders.filter(to => to.transitBatchId === batchId);

    for (const transitOrder of batchTransitOrders) {
      await storage.deleteTransitOrder(transitOrder.id);
    }

    // Delete the batch
    const deleted = await storage.deleteTransitBatch(batchId);

    if (!deleted) {
      return res.status(500).json(createErrorResponse('Failed to delete transit batch', 500));
    }

    // Reset order statuses if batch was pending
    if (batch.status === 'PENDING') {
      for (const transitOrder of batchTransitOrders) {
        await storage.updateOrder(transitOrder.orderId, { status: 'At Store' });
      }
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('transit_batches', 'deleted', { batchId });

    // Log action
    if ((req as any).employee) {
      await AuthService.logAction(
        (req as any).employee.employeeId,
        (req as any).employee.username,
        'delete_transit_batch',
        'transit_batch',
        batchId,
        {
          status: batch.status
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(createSuccessResponse(null, 'Transit batch deleted successfully'));
  } catch (error) {
    console.error('Delete transit batch error:', error);
    res.status(500).json(createErrorResponse('Failed to delete transit batch', 500));
  }
});

// Get transit analytics
router.get('/analytics/overview', adminLoginRequired, async (req, res) => {
  try {
    const batches = await storage.listTransitBatches();
    const transitOrders = await storage.listTransitOrders();

    const analytics = {
      totalBatches: batches.length,
      batchesByStatus: batches.reduce((acc, batch) => {
        acc[batch.status] = (acc[batch.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      batchesByType: batches.reduce((acc, batch) => {
        acc[batch.type] = (acc[batch.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalOrdersInTransit: transitOrders.filter(to => to.status === 'IN_TRANSIT').length,
      pendingBatches: batches.filter(b => b.status === 'PENDING').length,
      inTransitBatches: batches.filter(b => b.status === 'IN_TRANSIT').length,
      completedToday: batches.filter(batch => {
        const today = new Date().toISOString().split('T')[0];
        return batch.completedAt && batch.completedAt.startsWith(today);
      }).length
    };

    res.json(createSuccessResponse(analytics));
  } catch (error) {
    console.error('Get transit analytics error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch transit analytics', 500));
  }
});

// Get orders available for transit
router.get('/available-orders', adminLoginRequired, async (req, res) => {
  try {
    const { type = 'STORE_TO_FACTORY' } = req.query;

    const orders = await storage.listOrders();
    const transitOrders = await storage.listTransitOrders();

    // Get orders already in transit
    const ordersInTransit = new Set(
      transitOrders
        .filter(to => to.status === 'PENDING' || to.status === 'IN_TRANSIT')
        .map(to => to.orderId)
    );

    // Filter orders based on type and status
    let availableOrders;
    if (type === 'STORE_TO_FACTORY') {
      availableOrders = orders.filter(order =>
        order.status === 'At Store' && !ordersInTransit.has(order.id)
      );
    } else {
      availableOrders = orders.filter(order =>
        order.status === 'Processing' && !ordersInTransit.has(order.id)
      );
    }

    // Sort by creation date (oldest first for priority)
    availableOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Limit to reasonable number
    availableOrders = availableOrders.slice(0, 50);

    res.json(createSuccessResponse(availableOrders));
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch available orders', 500));
  }
});

export default router;
