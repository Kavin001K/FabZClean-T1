import { Router } from 'express';
import { searchService } from '../../services/search.service';
import { 
  adminLoginRequired, 
  rateLimit,
  validateInput 
} from '../../middleware/auth';
import { 
  createSearchResponse,
  createErrorResponse,
  createSuccessResponse 
} from '../../services/serialization';
import { z } from 'zod';

const router = Router();

// Apply rate limiting
router.use(rateLimit(60000, 200)); // 200 requests per minute for search

// Search validation schema
const searchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  type: z.enum(['orders', 'customers', 'products', 'all']).optional(),
  fuzzy: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

// Global search endpoint
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', fuzzy = false, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(createErrorResponse('Query parameter is required', 400));
    }

    const searchOptions = {
      fuzzy: fuzzy === 'true',
      limit: parseInt(limit as string) || 20
    };

    if (type === 'all') {
      const results = await searchService.globalSearch(q, searchOptions);
      res.json(createSuccessResponse(results, 'Search completed successfully'));
    } else {
      let results;
      switch (type) {
        case 'orders':
          results = await searchService.searchOrders(q, searchOptions);
          break;
        case 'customers':
          results = await searchService.searchCustomers(q, searchOptions);
          break;
        case 'products':
          results = await searchService.searchProducts(q, searchOptions);
          break;
        default:
          return res.status(400).json(createErrorResponse('Invalid search type', 400));
      }
      res.json(createSuccessResponse(results, 'Search completed successfully'));
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json(createErrorResponse('Search failed', 500));
  }
});

// Search orders endpoint
router.get('/orders', async (req, res) => {
  try {
    const { q, fuzzy = false, limit = 20, caseSensitive = false } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(createErrorResponse('Query parameter is required', 400));
    }

    const searchOptions = {
      fuzzy: fuzzy === 'true',
      caseSensitive: caseSensitive === 'true',
      limit: parseInt(limit as string) || 20
    };

    const results = await searchService.searchOrders(q, searchOptions);
    res.json(createSuccessResponse(results, 'Orders search completed'));
  } catch (error) {
    console.error('Orders search error:', error);
    res.status(500).json(createErrorResponse('Orders search failed', 500));
  }
});

// Search customers endpoint
router.get('/customers', adminLoginRequired, async (req, res) => {
  try {
    const { q, fuzzy = false, limit = 20, caseSensitive = false } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(createErrorResponse('Query parameter is required', 400));
    }

    const searchOptions = {
      fuzzy: fuzzy === 'true',
      caseSensitive: caseSensitive === 'true',
      limit: parseInt(limit as string) || 20
    };

    const results = await searchService.searchCustomers(q, searchOptions);
    res.json(createSuccessResponse(results, 'Customers search completed'));
  } catch (error) {
    console.error('Customers search error:', error);
    res.status(500).json(createErrorResponse('Customers search failed', 500));
  }
});

// Search products endpoint
router.get('/products', async (req, res) => {
  try {
    const { q, fuzzy = false, limit = 20, caseSensitive = false } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(createErrorResponse('Query parameter is required', 400));
    }

    const searchOptions = {
      fuzzy: fuzzy === 'true',
      caseSensitive: caseSensitive === 'true',
      limit: parseInt(limit as string) || 20
    };

    const results = await searchService.searchProducts(q, searchOptions);
    res.json(createSuccessResponse(results, 'Products search completed'));
  } catch (error) {
    console.error('Products search error:', error);
    res.status(500).json(createErrorResponse('Products search failed', 500));
  }
});

// Autocomplete endpoint
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, type, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(createErrorResponse('Query parameter is required', 400));
    }

    if (q.length < 2) {
      return res.json(createSuccessResponse([], 'Query too short for autocomplete'));
    }

    const limitNum = parseInt(limit as string) || 10;
    let suggestions: any[] = [];

    if (!type || type === 'all') {
      // Get suggestions from all types
      const [orderSuggestions, customerSuggestions, productSuggestions] = await Promise.all([
        searchService.autocompleteOrders(q, Math.ceil(limitNum / 3)),
        searchService.autocompleteCustomers(q, Math.ceil(limitNum / 3)),
        searchService.autocompleteProducts(q, Math.ceil(limitNum / 3))
      ]);

      suggestions = [...orderSuggestions, ...customerSuggestions, ...productSuggestions];
    } else {
      switch (type) {
        case 'orders':
          suggestions = await searchService.autocompleteOrders(q, limitNum);
          break;
        case 'customers':
          suggestions = await searchService.autocompleteCustomers(q, limitNum);
          break;
        case 'products':
          suggestions = await searchService.autocompleteProducts(q, limitNum);
          break;
        default:
          return res.status(400).json(createErrorResponse('Invalid autocomplete type', 400));
      }
    }

    // Sort by relevance and limit results
    suggestions = suggestions.slice(0, limitNum);

    res.json(createSuccessResponse(suggestions, 'Autocomplete suggestions'));
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json(createErrorResponse('Autocomplete failed', 500));
  }
});

// Search suggestions endpoint
router.get('/suggestions', async (req, res) => {
  try {
    const { q, type, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(createErrorResponse('Query parameter is required', 400));
    }

    if (q.length < 2) {
      return res.json(createSuccessResponse([], 'Query too short for suggestions'));
    }

    const limitNum = parseInt(limit as string) || 10;
    const suggestions = await searchService.getSearchSuggestions(q, type as string);

    res.json(createSuccessResponse(suggestions.slice(0, limitNum), 'Search suggestions'));
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json(createErrorResponse('Search suggestions failed', 500));
  }
});

// Recent searches endpoint
router.get('/recent', async (req, res) => {
  try {
    const { userId } = req.query;
    const recentSearches = await searchService.getRecentSearches(userId as string);

    res.json(createSuccessResponse(recentSearches, 'Recent searches'));
  } catch (error) {
    console.error('Recent searches error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch recent searches', 500));
  }
});

// Save search query endpoint
router.post('/save', async (req, res) => {
  try {
    const { q, userId } = req.body;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(createErrorResponse('Query is required', 400));
    }

    await searchService.saveSearchQuery(q, userId);
    res.json(createSuccessResponse(null, 'Search query saved'));
  } catch (error) {
    console.error('Save search query error:', error);
    res.status(500).json(createErrorResponse('Failed to save search query', 500));
  }
});

// Rebuild search index endpoint (admin only)
router.post('/rebuild-index', adminLoginRequired, async (req, res) => {
  try {
    await searchService.buildSearchIndex();
    res.json(createSuccessResponse(null, 'Search index rebuilt successfully'));
  } catch (error) {
    console.error('Rebuild search index error:', error);
    res.status(500).json(createErrorResponse('Failed to rebuild search index', 500));
  }
});

export default router;
