import { Router } from 'express';
import { z } from 'zod';
import { db as storage } from '../db';
import { 
  adminLoginRequired, 
  validateInput,
  rateLimit 
} from '../middleware/auth';
import { 
  serializeDelivery, 
  createPaginatedResponse, 
  createErrorResponse,
  createSuccessResponse 
} from '../services/serialization';
import { realtimeServer } from '../websocket-server';

const router = Router();

// Apply rate limiting
router.use(rateLimit(60000, 100));

// Delivery schema
const deliverySchema = z.object({
  orderId: z.string(),
  driverId: z.string().optional(),
  customerAddress: z.string(),
  scheduledDate: z.string(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

// Get deliveries
router.get('/', adminLoginRequired, async (req, res) => {
  try {
    const { 
      cursor, 
      limit = 20, 
      status,
      driverId,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    let deliveries = await storage.listDeliveries();

    // Apply status filter
    if (status && status !== 'all') {
      deliveries = deliveries.filter(delivery => delivery.status === status);
    }

    // Apply driver filter
    if (driverId) {
      deliveries = deliveries.filter(delivery => delivery.driverId === driverId);
    }

    // Apply sorting
    deliveries.sort((a, b) => {
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
    const startIndex = cursor ? deliveries.findIndex(d => d.id === cursor) + 1 : 0;
    const endIndex = startIndex + limitNum;
    
    const paginatedDeliveries = deliveries.slice(startIndex, endIndex);
    const hasMore = endIndex < deliveries.length;
    const nextCursor = hasMore ? paginatedDeliveries[paginatedDeliveries.length - 1]?.id : undefined;

    // Serialize deliveries
    const serializedDeliveries = paginatedDeliveries.map(delivery => 
      serializeDelivery(delivery, true, false)
    );

    // Return paginated response
    const response = createPaginatedResponse(serializedDeliveries, {
      cursor: nextCursor,
      hasMore,
      total: deliveries.length,
      limit: limitNum
    });

    res.json(response);
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch deliveries', 500));
  }
});

// Get single delivery
router.get('/:id', adminLoginRequired, async (req, res) => {
  try {
    const delivery = await storage.getDelivery(req.params.id);
    
    if (!delivery) {
      return res.status(404).json(createErrorResponse('Delivery not found', 404));
    }

    const serializedDelivery = serializeDelivery(delivery, true, true);
    res.json(createSuccessResponse(serializedDelivery));
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch delivery', 500));
  }
});

// Create delivery
router.post('/', adminLoginRequired, validateInput(deliverySchema), async (req, res) => {
  try {
    const deliveryData = req.body;

    // Verify order exists and is ready for delivery
    const order = await storage.getOrder(deliveryData.orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    if (order.status !== 'Ready for Delivery') {
      return res.status(400).json(createErrorResponse('Order is not ready for delivery', 400));
    }

    const delivery = await storage.createDelivery({
      ...deliveryData,
      status: 'scheduled'
    });

    // Update order status
    await storage.updateOrder(deliveryData.orderId, { status: 'Out for Delivery' });

    // Notify real-time clients
    realtimeServer.triggerUpdate('deliveries', 'created', delivery);

    const serializedDelivery = serializeDelivery(delivery);
    res.status(201).json(createSuccessResponse(serializedDelivery, 'Delivery created successfully'));
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json(createErrorResponse('Failed to create delivery', 500));
  }
});

// Update delivery
router.put('/:id', adminLoginRequired, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const updateData = req.body;

    const delivery = await storage.getDelivery(deliveryId);
    if (!delivery) {
      return res.status(404).json(createErrorResponse('Delivery not found', 404));
    }

    const updatedDelivery = await storage.updateDelivery(deliveryId, updateData);

    // Notify real-time clients
    realtimeServer.triggerUpdate('deliveries', 'updated', updatedDelivery);

    const serializedDelivery = serializeDelivery(updatedDelivery);
    res.json(createSuccessResponse(serializedDelivery, 'Delivery updated successfully'));
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json(createErrorResponse('Failed to update delivery', 500));
  }
});

// Assign driver to delivery
router.patch('/:id/assign-driver', adminLoginRequired, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json(createErrorResponse('Driver ID is required', 400));
    }

    // Verify driver exists
    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json(createErrorResponse('Driver not found', 404));
    }

    if (driver.status !== 'available') {
      return res.status(400).json(createErrorResponse('Driver is not available', 400));
    }

    const delivery = await storage.getDelivery(deliveryId);
    if (!delivery) {
      return res.status(404).json(createErrorResponse('Delivery not found', 404));
    }

    // Update delivery with driver assignment
    const updatedDelivery = await storage.updateDelivery(deliveryId, { 
      driverId,
      status: 'assigned',
      assignedAt: new Date().toISOString()
    });

    // Update driver status
    await storage.updateDriver(driverId, { status: 'busy' });

    // Notify real-time clients
    realtimeServer.triggerUpdate('deliveries', 'driver_assigned', {
      deliveryId,
      driverId,
      status: 'assigned'
    });

    const serializedDelivery = serializeDelivery(updatedDelivery, true);
    res.json(createSuccessResponse(serializedDelivery, 'Driver assigned successfully'));
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json(createErrorResponse('Failed to assign driver', 500));
  }
});

// Update delivery status
router.patch('/:id/status', adminLoginRequired, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json(createErrorResponse('Status is required', 400));
    }

    const delivery = await storage.getDelivery(deliveryId);
    if (!delivery) {
      return res.status(404).json(createErrorResponse('Delivery not found', 404));
    }

    const updatedDelivery = await storage.updateDelivery(deliveryId, { 
      status,
      statusUpdatedAt: new Date().toISOString()
    });

    // Update order status based on delivery status
    if (status === 'delivered') {
      await storage.updateOrder(delivery.orderId, { status: 'Delivered' });
    } else if (status === 'failed') {
      await storage.updateOrder(delivery.orderId, { status: 'Delivery Failed' });
    }

    // Update driver status if delivery completed
    if (delivery.driverId && (status === 'delivered' || status === 'failed')) {
      await storage.updateDriver(delivery.driverId, { status: 'available' });
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('deliveries', 'status_updated', {
      deliveryId,
      status,
      previousStatus: delivery.status
    });

    const serializedDelivery = serializeDelivery(updatedDelivery);
    res.json(createSuccessResponse(serializedDelivery, 'Delivery status updated successfully'));
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json(createErrorResponse('Failed to update delivery status', 500));
  }
});

// Delete delivery
router.delete('/:id', adminLoginRequired, async (req, res) => {
  try {
    const deliveryId = req.params.id;

    const delivery = await storage.getDelivery(deliveryId);
    if (!delivery) {
      return res.status(404).json(createErrorResponse('Delivery not found', 404));
    }

    // Only allow deletion of scheduled deliveries
    if (delivery.status !== 'scheduled') {
      return res.status(400).json(createErrorResponse('Only scheduled deliveries can be deleted', 400));
    }

    const deleted = await storage.deleteDelivery(deliveryId);

    if (!deleted) {
      return res.status(500).json(createErrorResponse('Failed to delete delivery', 500));
    }

    // Reset order status
    await storage.updateOrder(delivery.orderId, { status: 'Ready for Delivery' });

    // Notify real-time clients
    realtimeServer.triggerUpdate('deliveries', 'deleted', { deliveryId });

    res.json(createSuccessResponse(null, 'Delivery deleted successfully'));
  } catch (error) {
    console.error('Delete delivery error:', error);
    res.status(500).json(createErrorResponse('Failed to delete delivery', 500));
  }
});

// Get delivery analytics
router.get('/analytics/overview', adminLoginRequired, async (req, res) => {
  try {
    const deliveries = await storage.listDeliveries();
    const drivers = await storage.listDrivers();

    const analytics = {
      totalDeliveries: deliveries.length,
      deliveriesByStatus: deliveries.reduce((acc, delivery) => {
        acc[delivery.status] = (acc[delivery.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      activeDrivers: drivers.filter(d => d.status === 'busy').length,
      availableDrivers: drivers.filter(d => d.status === 'available').length,
      deliveriesToday: deliveries.filter(delivery => {
        const today = new Date().toISOString().split('T')[0];
        return delivery.scheduledDate.startsWith(today);
      }).length,
      completedToday: deliveries.filter(delivery => {
        const today = new Date().toISOString().split('T')[0];
        return delivery.statusUpdatedAt && delivery.statusUpdatedAt.startsWith(today) && delivery.status === 'delivered';
      }).length
    };

    res.json(createSuccessResponse(analytics));
  } catch (error) {
    console.error('Get delivery analytics error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch delivery analytics', 500));
  }
});

// Get deliveries for driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, limit = 20 } = req.query;

    const deliveries = await storage.listDeliveries();
    let driverDeliveries = deliveries.filter(delivery => delivery.driverId === driverId);

    // Apply status filter
    if (status && status !== 'all') {
      driverDeliveries = driverDeliveries.filter(delivery => delivery.status === status);
    }

    // Sort by scheduled date
    driverDeliveries.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    // Apply limit
    const limitNum = parseInt(limit as string) || 20;
    driverDeliveries = driverDeliveries.slice(0, limitNum);

    // Serialize deliveries
    const serializedDeliveries = driverDeliveries.map(delivery => 
      serializeDelivery(delivery, false, true)
    );

    res.json(createSuccessResponse(serializedDeliveries));
  } catch (error) {
    console.error('Get driver deliveries error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch driver deliveries', 500));
  }
});

export default router;
