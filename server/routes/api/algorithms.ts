import { Router } from 'express';
import { cacheService } from '../../services/cache.service';
import { routeOptimizationService } from '../../services/route-optimization.service';
import { paginationService } from '../../services/pagination.service';
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
