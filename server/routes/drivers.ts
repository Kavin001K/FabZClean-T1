import { Router } from 'express';
import { z } from 'zod';
import { db as storage } from '../db';
import {
  adminLoginRequired,
  validateInput,
  rateLimit
} from '../middleware/auth';
import {
  createPaginatedResponse,
  createErrorResponse,
  createSuccessResponse
} from '../services/serialization';
import { realtimeServer } from '../websocket-server';

const router = Router();

// Apply rate limiting
router.use(rateLimit(60000, 100));

// Driver schema
const driverSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  licenseNumber: z.string(),
  vehicleNumber: z.string(),
  vehicleType: z.enum(['bike', 'car', 'truck', 'van']),
  vehicleModel: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  experience: z.number().default(0)
});

// Get drivers
router.get('/', adminLoginRequired, async (req, res) => {
  try {
    const {
      cursor,
      limit = 20,
      status,
      vehicleType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let drivers = await storage.listDrivers();

    // Apply status filter
    if (status && status !== 'all') {
      drivers = drivers.filter(driver => driver.status === status);
    }

    // Apply vehicle type filter
    if (vehicleType && vehicleType !== 'all') {
      drivers = drivers.filter(driver => driver.vehicleType === vehicleType);
    }

    // Apply sorting
    drivers.sort((a, b) => {
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
    const startIndex = cursor ? drivers.findIndex(d => d.id === cursor) + 1 : 0;
    const endIndex = startIndex + limitNum;

    const paginatedDrivers = drivers.slice(startIndex, endIndex);
    const hasMore = endIndex < drivers.length;
    const nextCursor = hasMore ? paginatedDrivers[paginatedDrivers.length - 1]?.id : undefined;

    // Return paginated response
    const response = createPaginatedResponse(paginatedDrivers, {
      cursor: nextCursor,
      hasMore,
      total: drivers.length,
      limit: limitNum
    });

    res.json(response);
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch drivers', 500));
  }
});

// Get single driver
router.get('/:id', adminLoginRequired, async (req, res) => {
  try {
    const driver = await storage.getDriver(req.params.id);

    if (!driver) {
      return res.status(404).json(createErrorResponse('Driver not found', 404));
    }

    res.json(createSuccessResponse(driver));
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch driver', 500));
  }
});

// Create driver
router.post('/', adminLoginRequired, validateInput(driverSchema), async (req, res) => {
  try {
    const driverData = req.body;

    // Check if driver with same phone number already exists
    const existingDrivers = await storage.listDrivers();
    const phoneExists = existingDrivers.some(d => d.phone === driverData.phone);

    if (phoneExists) {
      return res.status(400).json(createErrorResponse('Driver with this phone number already exists', 400));
    }

    const driver = await storage.createDriver({
      ...driverData,
      status: 'available',
      rating: 5.0,
      totalDeliveries: 0,
      totalEarnings: 0
    });

    // Notify real-time clients
    realtimeServer.triggerUpdate('drivers', 'created', driver);

    res.status(201).json(createSuccessResponse(driver, 'Driver created successfully'));
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json(createErrorResponse('Failed to create driver', 500));
  }
});

// Update driver
router.put('/:id', adminLoginRequired, async (req, res) => {
  try {
    const driverId = req.params.id;
    const updateData = req.body;

    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json(createErrorResponse('Driver not found', 404));
    }

    const updatedDriver = await storage.updateDriver(driverId, updateData);

    // Notify real-time clients
    realtimeServer.triggerUpdate('drivers', 'updated', updatedDriver);

    res.json(createSuccessResponse(updatedDriver, 'Driver updated successfully'));
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json(createErrorResponse('Failed to update driver', 500));
  }
});

// Update driver location
router.patch('/:id/location', async (req, res) => {
  try {
    const driverId = req.params.id;
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json(createErrorResponse('Valid latitude and longitude are required', 400));
    }

    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json(createErrorResponse('Driver not found', 404));
    }

    const updatedDriver = await storage.updateDriverLocation(driverId, latitude, longitude);

    // Notify real-time clients about location update
    realtimeServer.triggerUpdate('drivers', 'updated', {
      driverId,
      latitude,
      longitude,
      lastActive: new Date().toISOString()
    });

    res.json(createSuccessResponse(updatedDriver, 'Driver location updated successfully'));
  } catch (error) {
    console.error('Update driver location error:', error);
    res.status(500).json(createErrorResponse('Failed to update driver location', 500));
  }
});

// Update driver status
router.patch('/:id/status', adminLoginRequired, async (req, res) => {
  try {
    const driverId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json(createErrorResponse('Status is required', 400));
    }

    const validStatuses = ['available', 'busy', 'offline', 'on_break'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(createErrorResponse('Invalid status', 400));
    }

    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json(createErrorResponse('Driver not found', 404));
    }

    const updatedDriver = await storage.updateDriver(driverId, {
      status,
      lastActive: new Date().toISOString()
    });

    // Notify real-time clients
    realtimeServer.triggerUpdate('drivers', 'status_changed', {
      driverId,
      status,
      previousStatus: driver.status
    });

    res.json(createSuccessResponse(updatedDriver, 'Driver status updated successfully'));
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json(createErrorResponse('Failed to update driver status', 500));
  }
});

// Delete driver
router.delete('/:id', adminLoginRequired, async (req, res) => {
  try {
    const driverId = req.params.id;

    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json(createErrorResponse('Driver not found', 404));
    }

    // Check if driver has active deliveries
    const deliveries = await storage.listDeliveries();
    const activeDeliveries = deliveries.filter(d => d.driverId === driverId && d.status !== 'delivered');

    if (activeDeliveries.length > 0) {
      return res.status(400).json(createErrorResponse('Cannot delete driver with active deliveries', 400));
    }

    const deleted = await storage.deleteDriver(driverId);

    if (!deleted) {
      return res.status(500).json(createErrorResponse('Failed to delete driver', 500));
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('drivers', 'deleted', { driverId });

    res.json(createSuccessResponse(null, 'Driver deleted successfully'));
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json(createErrorResponse('Failed to delete driver', 500));
  }
});

// Get drivers by status
router.get('/status/:status', adminLoginRequired, async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 50 } = req.query;

    const drivers = await storage.getDriversByStatus(status);

    // Apply limit
    const limitNum = parseInt(limit as string) || 50;
    const limitedDrivers = drivers.slice(0, limitNum);

    res.json(createSuccessResponse(limitedDrivers));
  } catch (error) {
    console.error('Get drivers by status error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch drivers by status', 500));
  }
});

// Get driver analytics
router.get('/analytics/overview', adminLoginRequired, async (req, res) => {
  try {
    const drivers = await storage.listDrivers();
    const deliveries = await storage.listDeliveries();

    const analytics = {
      totalDrivers: drivers.length,
      driversByStatus: drivers.reduce((acc, driver) => {
        acc[driver.status] = (acc[driver.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      driversByVehicleType: drivers.reduce((acc, driver) => {
        acc[driver.vehicleType] = (acc[driver.vehicleType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageRating: drivers.length > 0
        ? drivers.reduce((sum, driver) => sum + driver.rating, 0) / drivers.length
        : 0,
      totalDeliveries: drivers.reduce((sum, driver) => sum + driver.totalDeliveries, 0),
      totalEarnings: drivers.reduce((sum, driver) => sum + driver.totalEarnings, 0),
      topPerformers: drivers
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5)
        .map(driver => ({
          id: driver.id,
          name: driver.name,
          rating: driver.rating,
          totalDeliveries: driver.totalDeliveries,
          totalEarnings: driver.totalEarnings
        }))
    };

    res.json(createSuccessResponse(analytics));
  } catch (error) {
    console.error('Get driver analytics error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch driver analytics', 500));
  }
});

// Get driver performance
router.get('/:id/performance', adminLoginRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const driver = await storage.getDriver(id);
    if (!driver) {
      return res.status(404).json(createErrorResponse('Driver not found', 404));
    }

    const deliveries = await storage.listDeliveries();
    const driverDeliveries = deliveries.filter(d => d.driverId === id);

    // Calculate performance metrics
    const daysNum = parseInt(days as string) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);

    const recentDeliveries = driverDeliveries.filter(d =>
      new Date(d.createdAt) >= cutoffDate
    );

    const performance = {
      driverId: id,
      driverName: driver.name,
      period: `${daysNum} days`,
      totalDeliveries: recentDeliveries.length,
      completedDeliveries: recentDeliveries.filter(d => d.status === 'delivered').length,
      failedDeliveries: recentDeliveries.filter(d => d.status === 'failed').length,
      completionRate: recentDeliveries.length > 0
        ? (recentDeliveries.filter(d => d.status === 'delivered').length / recentDeliveries.length) * 100
        : 0,
      averageDeliveryTime: driver.totalDeliveries > 0
        ? driver.totalEarnings / driver.totalDeliveries
        : 0,
      currentRating: driver.rating,
      totalEarnings: driver.totalEarnings,
      recentActivity: recentDeliveries.slice(-10).map(d => ({
        id: d.id,
        status: d.status,
        scheduledDate: d.scheduledDate,
        statusUpdatedAt: d.statusUpdatedAt
      }))
    };

    res.json(createSuccessResponse(performance));
  } catch (error) {
    console.error('Get driver performance error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch driver performance', 500));
  }
});

export default router;
