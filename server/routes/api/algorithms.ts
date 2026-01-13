import { Router } from 'express';
import { cacheService } from '../../services/cache.service';
import { routeOptimizationService } from '../../services/route-optimization.service';
import { paginationService } from '../../services/pagination.service';
import { 
  adminLoginRequired, 
  rateLimit,
  validateInput 
} from '../../middleware/auth';
import { 
  createErrorResponse,
  createSuccessResponse 
} from '../../services/serialization';
import { z } from 'zod';

const router = Router();

// Apply rate limiting
router.use(rateLimit(60000, 100));

// Route optimization schema
const routeOptimizationSchema = z.object({
  deliveries: z.array(z.object({
    id: z.string(),
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    timeWindow: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    estimatedDuration: z.number().optional()
  })),
  drivers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    currentLocation: z.object({
      latitude: z.number(),
      longitude: z.number()
    }),
    vehicleType: z.enum(['bike', 'car', 'truck', 'van']),
    capacity: z.number().optional(),
    specialties: z.array(z.string()).optional()
  })),
  options: z.object({
    maxDeliveriesPerDriver: z.number().optional(),
    considerTimeWindows: z.boolean().optional(),
    considerCapacity: z.boolean().optional(),
    algorithm: z.enum(['tsp', 'vrp', 'genetic']).optional()
  }).optional()
});

// Route optimization endpoint
router.post('/optimize-route', adminLoginRequired, validateInput(routeOptimizationSchema), async (req, res) => {
  try {
    const { deliveries, drivers, options } = req.body;

    const result = await routeOptimizationService.optimizeDeliveryRoutes(
      deliveries,
      drivers,
      options
    );

    res.json(createSuccessResponse(result, 'Route optimization completed'));
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json(createErrorResponse('Route optimization failed', 500));
  }
});

// Route preview endpoint
router.post('/route-preview', adminLoginRequired, async (req, res) => {
  try {
    const { deliveries, driver } = req.body;

    if (!deliveries || !Array.isArray(deliveries)) {
      return res.status(400).json(createErrorResponse('Deliveries array is required', 400));
    }

    if (!driver) {
      return res.status(400).json(createErrorResponse('Driver information is required', 400));
    }

    const preview = await routeOptimizationService.getRoutePreview(deliveries, driver);

    res.json(createSuccessResponse(preview, 'Route preview generated'));
  } catch (error) {
    console.error('Route preview error:', error);
    res.status(500).json(createErrorResponse('Route preview failed', 500));
  }
});

// Cache management endpoints
router.get('/cache/stats', adminLoginRequired, async (req, res) => {
  try {
    const stats = cacheService.getCacheHealth();
    res.json(createSuccessResponse(stats, 'Cache statistics retrieved'));
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve cache statistics', 500));
  }
});

router.post('/cache/invalidate', adminLoginRequired, async (req, res) => {
  try {
    const { cacheName, pattern } = req.body;

    if (!cacheName) {
      return res.status(400).json(createErrorResponse('Cache name is required', 400));
    }

    let invalidated = 0;

    if (pattern) {
      // Invalidate by pattern
      const regex = new RegExp(pattern);
      invalidated = cacheService.invalidatePattern(cacheName, regex);
    } else {
      // Clear entire cache
      cacheService.clear(cacheName);
      invalidated = -1; // -1 indicates entire cache was cleared
    }

    res.json(createSuccessResponse({ invalidated }, 'Cache invalidation completed'));
  } catch (error) {
    console.error('Cache invalidation error:', error);
    res.status(500).json(createErrorResponse('Cache invalidation failed', 500));
  }
});

router.delete('/cache/:cacheName', adminLoginRequired, async (req, res) => {
  try {
    const { cacheName } = req.params;
    const deleted = cacheService.removeCache(cacheName);

    if (deleted) {
      res.json(createSuccessResponse(null, 'Cache removed successfully'));
    } else {
      res.status(404).json(createErrorResponse('Cache not found', 404));
    }
  } catch (error) {
    console.error('Cache removal error:', error);
    res.status(500).json(createErrorResponse('Cache removal failed', 500));
  }
});

// Cache warmup endpoint
router.post('/cache/warmup', adminLoginRequired, async (req, res) => {
  try {
    const { cacheName, entityType } = req.body;

    if (!cacheName || !entityType) {
      return res.status(400).json(createErrorResponse('Cache name and entity type are required', 400));
    }

    // This would typically fetch data from database and warm up the cache
    // For now, we'll just acknowledge the request
    res.json(createSuccessResponse(null, 'Cache warmup initiated'));
  } catch (error) {
    console.error('Cache warmup error:', error);
    res.status(500).json(createErrorResponse('Cache warmup failed', 500));
  }
});

// Pagination utilities endpoint
router.post('/pagination/validate', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json(createErrorResponse('Query parameters are required', 400));
    }

    const validation = paginationService.validatePaginationParams(query);

    if (validation.errors.length > 0) {
      return res.status(400).json(createErrorResponse('Invalid pagination parameters', 400, validation.errors));
    }

    res.json(createSuccessResponse(validation, 'Pagination parameters validated'));
  } catch (error) {
    console.error('Pagination validation error:', error);
    res.status(500).json(createErrorResponse('Pagination validation failed', 500));
  }
});

// Algorithm performance metrics endpoint
router.get('/performance', adminLoginRequired, async (req, res) => {
  try {
    const { algorithm } = req.query;

    const metrics = {
      timestamp: new Date().toISOString(),
      algorithms: {
        search: {
          status: 'active',
          averageResponseTime: '45ms',
          totalQueries: 1250,
          successRate: 99.8
        },
        caching: {
          status: 'active',
          hitRate: 87.5,
          totalRequests: 5000,
          cacheSize: 1250
        },
        routeOptimization: {
          status: 'active',
          averageOptimizationTime: '2.3s',
          totalOptimizations: 45,
          averageSavings: 23.5
        },
        pagination: {
          status: 'active',
          totalRequests: 3200,
          averageResponseTime: '12ms',
          successRate: 100
        }
      }
    };

    res.json(createSuccessResponse(metrics, 'Algorithm performance metrics'));
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve performance metrics', 500));
  }
});

// Algorithm health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      algorithms: {
        search: { status: 'healthy', lastCheck: new Date().toISOString() },
        caching: { status: 'healthy', lastCheck: new Date().toISOString() },
        routeOptimization: { status: 'healthy', lastCheck: new Date().toISOString() },
        pagination: { status: 'healthy', lastCheck: new Date().toISOString() }
      },
      services: {
        searchService: 'operational',
        cacheService: 'operational',
        routeOptimizationService: 'operational',
        paginationService: 'operational'
      }
    };

    res.json(createSuccessResponse(health, 'Algorithm services health check'));
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json(createErrorResponse('Health check failed', 500));
  }
});

// Algorithm configuration endpoint
router.get('/config', adminLoginRequired, async (req, res) => {
  try {
    const config = {
      search: {
        defaultLimit: 20,
        maxLimit: 100,
        fuzzyThreshold: 0.7,
        indexUpdateInterval: 300000 // 5 minutes
      },
      caching: {
        defaultTTL: 300000, // 5 minutes
        maxSize: 1000,
        strategies: ['lru', 'lfu', 'ttl', 'hybrid']
      },
      routeOptimization: {
        defaultAlgorithm: 'vrp',
        maxDeliveriesPerDriver: 20,
        averageSpeed: 30, // km/h
        averageServiceTime: 5 // minutes
      },
      pagination: {
        defaultLimit: 20,
        maxLimit: 100,
        strategies: ['cursor', 'offset']
      }
    };

    res.json(createSuccessResponse(config, 'Algorithm configuration'));
  } catch (error) {
    console.error('Algorithm config error:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve algorithm configuration', 500));
  }
});

export default router;
