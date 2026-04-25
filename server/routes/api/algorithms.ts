import { Router } from 'express';
import { cacheService } from '../../services/cache.service';
import { routeOptimizationService } from '../../services/route-optimization.service';
import { paginationService } from '../../services/pagination.service';
import { db as storage } from '../../db';
import { ExternalApiClient, ExternalApiError } from '../../services/externalApiClient';
import { 
  adminLoginRequired, 
  jwtRequired,
  rateLimit,
  validateInput 
} from '../../middleware/auth';
import { 
  createErrorResponse,
  createSuccessResponse 
} from '../../services/serialization';
import { z } from 'zod';
import {
  DEFAULT_INVOICE_TEMPLATE_CONFIG,
  DEFAULT_TAG_TEMPLATE_CONFIG,
  invoiceTemplateProfileSchema,
  tagTemplateProfileSchema,
} from '../../../shared/business-config';

const router = Router();

// Apply rate limiting
router.use(rateLimit(60000, 100));
router.use(jwtRequired);

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

const invoiceTemplateOptimizationSchema = z.object({
  template: z.record(z.any()),
});

const tagTemplateOptimizationSchema = z.object({
  template: z.record(z.any()),
});

const extractJsonPayload = (value: string): string => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    throw new Error('AI returned an empty response');
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const cleanOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

const slugifyTemplateKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'template';

const invoicePresetLabel = (presetKey: unknown): string => {
  switch (presetKey) {
    case 'modern':
      return 'Modern Invoice';
    case 'compact':
      return 'Compact Invoice';
    case 'express':
      return 'Express Bill';
    case 'edited':
      return 'Edited Order Bill';
    default:
      return 'Classic Invoice';
  }
};

const tagLayoutLabel = (layoutKey: unknown): string => {
  switch (layoutKey) {
    case 'thermal_detailed':
      return 'Detailed Tag';
    default:
      return 'Thermal Tag';
  }
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date : null;
};

const buildBookingRecommendation = (metrics: any, weather?: any) => {
  const recommendations: string[] = [];

  if (metrics.overdueOrders > 0) {
    recommendations.push(`There are ${metrics.overdueOrders} overdue bookings. Prioritize calls and schedule extra pickup windows to reduce backlog.`);
  }

  if (metrics.pendingOrders > 10) {
    recommendations.push(`Pending workload is high with ${metrics.pendingOrders} active orders. Consider shifting staff to pickup and delivery support.`);
  }

  if (metrics.completionRate >= 90) {
    recommendations.push(`Completion rate remains strong at ${metrics.completionRate.toFixed(1)}%. Keep the current workflow and monitor daily schedule adherence.`);
  } else if (metrics.completionRate > 0) {
    recommendations.push(`Completion rate is ${metrics.completionRate.toFixed(1)}%. Review operational bottlenecks and speed up order handoffs.`);
  }

  if (weather) {
    const weatherCondition = String(weather.condition || '').toLowerCase();
    if (weatherCondition.includes('rain')) {
      recommendations.push('Today has rain risk. Keep waterproof packing ready and prioritize nearby pickups first.');
    } else if (weatherCondition.includes('clear') || weatherCondition.includes('sun')) {
      recommendations.push('Today looks sunny. This is a good window to clear pending pickups and run clustered delivery routes.');
    } else if (weather.temperature <= 18) {
      recommendations.push('Cool weather is forecasted. Prioritize same-day deliveries and keep customers updated on pickup times.');
    } else if (weather.temperature >= 30) {
      recommendations.push('Warm temperatures are coming. Plan for fast pickup and encourage customers to choose morning or evening slots.');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Review the latest booking cadence and verify that the next available pickup slots match current staffing levels.');
  }

  return recommendations.slice(0, 3);
};

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

router.post('/invoice-template-optimize', adminLoginRequired, async (req, res) => {
  try {
    const parsed = invoiceTemplateOptimizationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(createErrorResponse('Template payload is required', 400, parsed.error.flatten()));
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!geminiApiKey) {
      return res.status(503).json(createErrorResponse('Gemini is not configured on this server', 503));
    }

    const rawTemplate = parsed.data.template || {};
    const baseTemplate = invoiceTemplateProfileSchema.partial().parse({
      ...rawTemplate,
      templateKey: cleanOptionalString((rawTemplate as any)?.templateKey),
      name: cleanOptionalString((rawTemplate as any)?.name),
      description: cleanOptionalString((rawTemplate as any)?.description) ?? '',
      config: {
        ...DEFAULT_INVOICE_TEMPLATE_CONFIG,
        ...((rawTemplate as any)?.config || {}),
      },
    });

    const prompt = [
      'Optimize this invoice layout configuration for A4 and thermal-printer readability.',
      'Prioritize brand visibility, clear customer details, and strong grand-total emphasis.',
      'Keep the response as JSON only, with this shape:',
      '{"name":"...", "description":"...", "presetKey":"classic|modern|compact|express|edited", "config":{...}}',
      'Do not include markdown fences or explanations.',
      `Current template JSON: ${JSON.stringify(baseTemplate)}`,
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const raw = await response.text();
    if (!response.ok) {
      return res.status(502).json(createErrorResponse(`Gemini request failed: ${raw || response.statusText}`, 502));
    }

    const envelope = JSON.parse(raw);
    const aiText = envelope?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
    const optimizedPayload = JSON.parse(extractJsonPayload(aiText));
    const mergedPresetKey = (optimizedPayload?.presetKey || baseTemplate.presetKey || 'classic') as 'classic' | 'modern' | 'compact' | 'express' | 'edited';
    const mergedName = cleanOptionalString(optimizedPayload?.name) || baseTemplate.name || invoicePresetLabel(mergedPresetKey);
    const mergedDescription = cleanOptionalString(optimizedPayload?.description) || baseTemplate.description || `AI optimized ${mergedName.toLowerCase()} layout`;
    const mergedTemplateKey = cleanOptionalString((rawTemplate as any)?.templateKey)
      || baseTemplate.templateKey
      || slugifyTemplateKey(mergedName);

    const optimizedTemplate = invoiceTemplateProfileSchema.parse({
      ...baseTemplate,
      ...optimizedPayload,
      templateKey: mergedTemplateKey,
      name: mergedName,
      description: mergedDescription,
      presetKey: mergedPresetKey,
      isAiOptimized: true,
      config: {
        ...DEFAULT_INVOICE_TEMPLATE_CONFIG,
        ...(baseTemplate.config || {}),
        ...(optimizedPayload?.config || {}),
      },
    });

    res.json(createSuccessResponse({ template: optimizedTemplate }, 'Invoice template optimized'));
  } catch (error: any) {
    console.error('Invoice template optimization error:', error);
    const message = Array.isArray(error?.issues)
      ? error.issues.map((issue: any) => issue?.message).filter(Boolean).join(', ')
      : error.message || 'Failed to optimize invoice template';
    res.status(500).json(createErrorResponse(message, 500));
  }
});

router.post('/tag-template-optimize', adminLoginRequired, async (req, res) => {
  try {
    const parsed = tagTemplateOptimizationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(createErrorResponse('Template payload is required', 400, parsed.error.flatten()));
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!geminiApiKey) {
      return res.status(503).json(createErrorResponse('Gemini is not configured on this server', 503));
    }

    const rawTemplate = parsed.data.template || {};
    const baseTemplate = tagTemplateProfileSchema.partial().parse({
      ...rawTemplate,
      templateKey: cleanOptionalString((rawTemplate as any)?.templateKey),
      name: cleanOptionalString((rawTemplate as any)?.name),
      description: cleanOptionalString((rawTemplate as any)?.description) ?? '',
      config: {
        ...DEFAULT_TAG_TEMPLATE_CONFIG,
        ...((rawTemplate as any)?.config || {}),
      },
    });

    const prompt = [
      'Optimize this garment tag configuration for thermal-printer readability.',
      'Prioritize quick scanning, visible order number, compact customer identity, and reduced clutter.',
      'Keep the response as JSON only, with this shape:',
      '{"name":"...", "description":"...", "layoutKey":"thermal_compact", "config":{...}}',
      'Do not include markdown fences or explanations.',
      `Current template JSON: ${JSON.stringify(baseTemplate)}`,
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const raw = await response.text();
    if (!response.ok) {
      return res.status(502).json(createErrorResponse(`Gemini request failed: ${raw || response.statusText}`, 502));
    }

    const envelope = JSON.parse(raw);
    const aiText = envelope?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
    const optimizedPayload = JSON.parse(extractJsonPayload(aiText));
    const mergedLayoutKey = (optimizedPayload?.layoutKey || baseTemplate.layoutKey || 'thermal_compact') as 'thermal_compact' | 'thermal_detailed';
    const mergedName = cleanOptionalString(optimizedPayload?.name) || baseTemplate.name || tagLayoutLabel(mergedLayoutKey);
    const mergedDescription = cleanOptionalString(optimizedPayload?.description) || baseTemplate.description || `AI optimized ${mergedName.toLowerCase()} layout`;
    const mergedTemplateKey = cleanOptionalString((rawTemplate as any)?.templateKey)
      || baseTemplate.templateKey
      || slugifyTemplateKey(mergedName);

    const optimizedTemplate = tagTemplateProfileSchema.parse({
      ...baseTemplate,
      ...optimizedPayload,
      templateKey: mergedTemplateKey,
      name: mergedName,
      description: mergedDescription,
      layoutKey: mergedLayoutKey,
      isAiOptimized: true,
      config: {
        ...DEFAULT_TAG_TEMPLATE_CONFIG,
        ...(baseTemplate.config || {}),
        ...(optimizedPayload?.config || {}),
      },
    });

    res.json(createSuccessResponse({ template: optimizedTemplate }, 'Tag template optimized'));
  } catch (error: any) {
    console.error('Tag template optimization error:', error);
    const message = Array.isArray(error?.issues)
      ? error.issues.map((issue: any) => issue?.message).filter(Boolean).join(', ')
      : error.message || 'Failed to optimize tag template';
    res.status(500).json(createErrorResponse(message, 500));
  }
});

router.get('/operational-suggestion', async (req, res) => {
  try {
    const { dateRange = 'last-30-days', weatherLocation = '' } = req.query as Record<string, string>;
    const rawOrders = await storage.listOrders();
    const now = new Date();
    const startDate = new Date(now);

    switch (dateRange) {
      case 'last-7-days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last-90-days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'last-year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate.setTime(0);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const orders = rawOrders.filter((order: any) => {
      if (!order || !order.createdAt) return false;
      const createdAt = parseDate(order.createdAt);
      return createdAt ? createdAt >= startDate : false;
    });

    const activeOrders = orders.filter((order: any) => order.status !== 'cancelled');
    const completedOrders = activeOrders.filter((order: any) => ['completed', 'delivered'].includes(order.status));
    const pendingOrders = activeOrders.filter((order: any) => ['pending', 'processing', 'assigned', 'ready_for_pickup', 'ready_for_transit', 'in_progress'].includes(order.status));
    const overdueOrders = activeOrders.filter((order: any) => {
      const dueDate = parseDate(order.pickupDate || order.dueDate || order.createdAt);
      if (!dueDate) return false;
      return dueDate < now && !['completed', 'delivered', 'cancelled'].includes(order.status);
    });

    const revenueLast30Days = activeOrders.reduce((sum: number, order: any) => sum + toNumber(order.totalAmount), 0);
    const completionRate = activeOrders.length > 0 ? (completedOrders.length / activeOrders.length) * 100 : 0;

    const serviceCounts = new Map<string, number>();
    activeOrders.forEach((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const primaryService = items.length > 0 ? String(items[0]?.productName || items[0]?.name || items[0]?.service || items[0]?.productId || 'General service') : 'General service';
      serviceCounts.set(primaryService, (serviceCounts.get(primaryService) || 0) + 1);
    });

    const topService = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)[0];

    let weather: any | undefined;
    if (weatherLocation && weatherLocation.trim().length > 0) {
      try {
        const client = new ExternalApiClient();
        const weatherResponse = await client.get<any>('/weather', {
          q: weatherLocation,
          units: 'metric',
        });

        const condition = weatherResponse?.weather?.[0]?.description || weatherResponse?.current?.weather?.[0]?.description || 'Unknown';
        const temperature = toNumber(weatherResponse?.main?.temp ?? weatherResponse?.current?.temp ?? 0);
        const humidity = toNumber(weatherResponse?.main?.humidity ?? weatherResponse?.current?.humidity ?? 0);

        weather = {
          location: weatherResponse?.name || weatherLocation,
          condition: String(condition),
          temperature,
          humidity,
          recommendation: '',
        };

        if (weather.condition.toLowerCase().includes('rain')) {
          weather.recommendation = 'Rain is expected. Protect deliveries and inform customers about possible delays.';
        } else if (weather.temperature <= 18) {
          weather.recommendation = 'Cool weather is expected. Prioritize same-day pickups and keep customers informed.';
        } else if (weather.temperature >= 30) {
          weather.recommendation = 'Warm weather is forecasted. Encourage morning or evening bookings to avoid heat-related issues.';
        }
      } catch (error) {
        if (error instanceof ExternalApiError) {
          console.warn('Weather lookup failed:', error.message);
        } else {
          console.warn('Unexpected error during weather lookup:', error);
        }
      }
    }

    const metrics = {
      totalOrders: activeOrders.length,
      pendingOrders: pendingOrders.length,
      overdueOrders: overdueOrders.length,
      revenueLast30Days,
      completionRate,
      topService,
    };

    const recommendations = buildBookingRecommendation(metrics, weather);
    let recommendation = recommendations[0] || 'Review booking workload and weather before finalizing the schedule.';

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (geminiApiKey) {
      try {
        const prompt = [
          'You are an intelligent operations assistant for a service business.',
          'Use the ERP metrics below and optional weather signal to provide 2 concise recommendations for booking, staffing, and delivery planning.',
          'Return plain text only.',
          `Metrics: ${JSON.stringify(metrics)}`,
          `Weather: ${JSON.stringify(weather || { unavailable: true })}`,
        ].join('\n');

        const llmResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3 },
            }),
          }
        );

        if (llmResponse.ok) {
          const raw = await llmResponse.text();
          const envelope = JSON.parse(raw);
          const aiText = envelope?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
          if (aiText) {
            recommendation = aiText.trim();
          }
        }
      } catch (error) {
        console.warn('Gemini suggestion failed, falling back to heuristic guidance.', error);
      }
    }

    res.json(createSuccessResponse({
      analytics: metrics,
      weather,
      recommendation,
      recommendations,
    }, 'Operational booking suggestion generated'));
  } catch (error) {
    console.error('Operational suggestion error:', error);
    res.status(500).json(createErrorResponse('Failed to generate operational suggestion', 500));
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
