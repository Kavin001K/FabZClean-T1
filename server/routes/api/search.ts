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
import { db as storage } from '../../db';

const router = Router();

// Apply rate limiting
router.use(rateLimit(60000, 200)); // 200 requests per minute for search

// Helper to parse dates from queries like "what is 04.07.2026"
function extractDateFromQuery(query: string): string | null {
  const q = query.toLowerCase().trim();
  
  // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmYRegex = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/;
  const match = q.match(dmYRegex);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`; // ISO format YYYY-MM-DD
  }

  // YYYY.MM.DD or YYYY/MM/DD or YYYY-MM-DD
  const ymdRegex = /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/;
  const ymdMatch = q.match(ymdRegex);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Relative keywords in Indian Standard Time context
  const today = new Date();
  const formatIso = (d: Date) => {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // Returns YYYY-MM-DD
  };

  if (q.includes('today')) {
    return formatIso(today);
  }
  if (q.includes('yesterday')) {
    const d = new Date(today);
    d.setDate(today.getDate() - 1);
    return formatIso(d);
  }
  if (q.includes('tomorrow')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    return formatIso(d);
  }

  return null;
}

// Helper to query Gemini API
async function callGemini(prompt: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!geminiApiKey) {
    throw new Error('Gemini API key is not configured');
  }

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
          temperature: 0.3,
        },
      }),
    }
  );

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Gemini request failed: ${raw || response.statusText}`);
  }

  const envelope = await response.json();
  const aiText = envelope?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
  return aiText.trim();
}

// AI suggestion endpoint
router.get('/ai-suggest', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json(createSuccessResponse(null, 'Query too short for AI suggestion'));
    }

    const cleanedQuery = q.trim();
    
    // 1. Check if the query asks about a specific date
    const dateStr = extractDateFromQuery(cleanedQuery);

    if (dateStr) {
      let resultText = '';
      // Fetch stats for this date
      const orders = (await storage.listOrders()) as any[];
      const targetFormatted = dateStr; // YYYY-MM-DD

      const matchingOrders = orders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        return orderDate === targetFormatted && order.status !== 'cancelled';
      });

      const totalRevenue = matchingOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
      
      const statusCounts: Record<string, number> = {};
      matchingOrders.forEach((o) => {
        const status = o.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      const statusSummary = Object.entries(statusCounts)
        .map(([status, count]) => `${count} ${status}`)
        .join(', ') || '0 orders';

      const customerNames = Array.from(new Set(matchingOrders.map((o) => o.customerName || 'Unknown'))).slice(0, 3).join(', ');

      const dateStats = {
        date: dateStr,
        ordersCount: matchingOrders.length,
        totalRevenue,
        statusSummary,
        customerNames
      };

      const dateFormattedDisplay = new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const isGeminiConfigured = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
      if (isGeminiConfigured) {
        try {
          const prompt = `You are an AI business search assistant for FabZClean dry cleaning business.
The user typed: "${cleanedQuery}".
Here is the database data for the date ${dateFormattedDisplay}:
- Total orders placed: ${dateStats.ordersCount}
- Revenue: ₹${dateStats.totalRevenue.toLocaleString('en-IN')}
- Order status breakdown: ${dateStats.statusSummary}
- Customers: ${dateStats.customerNames}

Provide a concise 1-2 sentence response summarizing this data. Format the response as a clear suggestion for the search bar dropdown. Do not use markdown tags, bullet points, HTML or headers. Be extremely brief (under 150 characters if possible).`;
          
          resultText = await callGemini(prompt);
        } catch (geminiError: any) {
          console.warn('Gemini search suggestion failed, using heuristic fallback:', geminiError.message || geminiError);
        }
      }

      if (!resultText) {
        if (dateStats.ordersCount === 0) {
          resultText = `On ${dateFormattedDisplay}, there were no orders placed.`;
        } else {
          resultText = `On ${dateFormattedDisplay}: ${dateStats.ordersCount} orders placed generating ₹${dateStats.totalRevenue.toLocaleString('en-IN')}. Statuses: ${dateStats.statusSummary}.`;
        }
      }

      const suggestionItem = {
        id: `ai-suggest-date-${dateStr}`,
        type: 'ai_insight' as const,
        title: 'Ace Date Insight',
        subtitle: resultText,
        description: 'Click to open in Reports Ask Ace',
        url: `/reports?tab=ace&q=${encodeURIComponent(cleanedQuery)}`
      };

      return res.json(createSuccessResponse(suggestionItem, 'AI date suggestion generated'));
    }

    // Local helpers for AI suggestions
    const getStoreName = (code: string): string => {
      if (!code) return "Unknown";
      switch (code.toUpperCase()) {
        case "POL": return "Pollachi";
        case "KIN": return "Kinathukadavu";
        case "MCET": return "MCET";
        case "UDM": return "Udumalpet";
        default: return code;
      }
    };

    const listAllCustomers = async (): Promise<any[]> => {
      const pageSize = 1000;
      let offset = 0;
      let totalCount = Number.POSITIVE_INFINITY;
      const all: any[] = [];
      while (offset < totalCount) {
        const response = await (storage as any).listCustomers(undefined, {
          limit: pageSize,
          offset,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        const rows = response?.data || [];
        totalCount = Number(response?.totalCount ?? all.length + rows.length);
        all.push(...rows);
        if (rows.length < pageSize) break;
        offset += pageSize;
      }
      return all;
    };

    // 2. If no date is found, check if it is a general natural language query or contains entities
    const isNlQuery = /how|what|who|where|why|which|average|total|revenue|sales|profit|expense|credit|best|top|growth/i.test(cleanedQuery);
    
    // Stop words for clean search-token matching
    const STOP_WORDS = new Set([
      'all', 'with', 'name', 'their', 'list', 'show', 'find', 'get', 'who', 'which', 
      'what', 'how', 'where', 'why', 'the', 'for', 'and', 'this', 'that', 'them', 
      'they', 'here', 'info', 'details', 'detail', 'profile', 'profiles', 'customer', 
      'customers', 'store', 'stores', 'employee', 'employees', 'order', 'orders', 
      'about', 'some', 'from', 'have', 'has', 'had', 'been', 'were', 'was', 'are', 'is'
    ]);
    
    const queryTokens = cleanedQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    
    // We fetch data to provide rich dynamic context
    const orders = (await storage.listOrders()) as any[];
    const activeOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded' && o.status !== 'deleted');
    
    let specialContext: any = null;
    let queryType = 'general';

    // A. Check for Credit/Dues intent
    const isCreditIntent = /owe|credit|due|outstanding|debt/i.test(cleanedQuery);
    if (isCreditIntent) {
      const allCustomers = await listAllCustomers();
      const debtors = allCustomers
        .filter(c => (Number(c.creditBalance || c.credit_balance) || 0) > 0)
        .sort((a, b) => (Number(b.creditBalance || b.credit_balance) || 0) - (Number(a.creditBalance || a.credit_balance) || 0));
      const totalCredit = debtors.reduce((sum, c) => sum + (Number(c.creditBalance || c.credit_balance) || 0), 0);
      
      specialContext = {
        totalOutstandingCredit: totalCredit,
        debtorsCount: debtors.length,
        topDebtors: debtors.slice(0, 3).map(c => ({ name: c.name, credit: c.creditBalance || c.credit_balance }))
      };
      queryType = 'credit';
    }
    // B. Check for store keywords
    else if (/store|location|franchise|pol|kin|mcet|udm/i.test(cleanedQuery)) {
      let catalogStores: any[] = [];
      try {
        catalogStores = await (storage as any).listStores?.({ isActive: true }) || [];
      } catch {
        catalogStores = [];
      }
      
      let matchedStore: any = null;
      for (const s of catalogStores) {
        const sName = String(s.name || '').toLowerCase();
        const sCode = String(s.code || s.id || '').toLowerCase();
        if (cleanedQuery.toLowerCase().includes(sName) || cleanedQuery.toLowerCase().includes(sCode)) {
          matchedStore = s;
          break;
        }
      }
      
      if (!matchedStore) {
        const storeCodes = ["POL", "KIN", "MCET", "UDM"];
        for (const code of storeCodes) {
          const name = getStoreName(code).toLowerCase();
          if (cleanedQuery.toLowerCase().includes(code.toLowerCase()) || cleanedQuery.toLowerCase().includes(name)) {
            matchedStore = { code, name: getStoreName(code) };
            break;
          }
        }
      }
      
      if (matchedStore) {
        const code = String(matchedStore.code || matchedStore.id).toUpperCase();
        const sOrders = activeOrders.filter(o => String(o.storeCode || o.storeId || '').toUpperCase() === code);
        const revenue = sOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        specialContext = {
          storeName: matchedStore.name,
          storeCode: code,
          totalRevenue: revenue,
          ordersCount: sOrders.length
        };
        queryType = 'store';
      }
    }
    // C. Check for customer names in query
    else if (queryTokens.length > 0) {
      const allCustomers = await listAllCustomers();
      const matchedCustomers: any[] = [];
      
      for (const c of allCustomers) {
        if (!c.name) continue;
        const cNameLower = c.name.toLowerCase();
        const wordMatch = queryTokens.some(qw => {
          const nameWords = cNameLower.split(/\s+/);
          return nameWords.some(nw => nw === qw || (qw.length >= 4 && (nw.startsWith(qw) || nw.includes(qw))));
        });
        if (wordMatch) {
          matchedCustomers.push(c);
        }
      }
      
      if (matchedCustomers.length > 0) {
        specialContext = {
          matchedCount: matchedCustomers.length,
          customers: matchedCustomers.slice(0, 3).map(c => ({
            name: c.name,
            phone: c.phone,
            credit: c.creditBalance || c.credit_balance || 0,
            spent: c.totalSpent || c.total_spent || 0
          }))
        };
        queryType = 'customer';
      }
    }

    // If no special context matches, but it is an NL query, calculate standard summary
    if (!specialContext && isNlQuery) {
      const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const completedCount = activeOrders.filter((o) => ['completed', 'delivered'].includes(o.status)).length;
      specialContext = {
        totalRevenue,
        ordersCount: activeOrders.length,
        completedCount,
        pendingCount: activeOrders.length - completedCount
      };
    }

    if (specialContext || isNlQuery) {
      let resultText = '';
      const isGeminiConfigured = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
      if (isGeminiConfigured) {
        try {
          const prompt = `You are an AI business search assistant for FabZClean dry cleaning business.
The user typed query: "${cleanedQuery}".
Here is specific context retrieved from the database related to their query type "${queryType}":
${JSON.stringify(specialContext, null, 2)}

Provide a concise 1-2 sentence response summarizing this data. Format the response as a clear suggestion for the search bar dropdown. Do not use markdown tags, bullet points, HTML or headers. Be extremely brief (under 150 characters if possible).`;
          
          resultText = await callGemini(prompt);
        } catch (geminiError: any) {
          console.warn('Gemini search suggestion failed, using dynamic heuristic fallback:', geminiError.message || geminiError);
        }
      }

      if (!resultText) {
        if (queryType === 'credit') {
          resultText = `Outstanding credit: ₹${Math.round(specialContext.totalOutstandingCredit).toLocaleString('en-IN')} across ${specialContext.debtorsCount} debtors. Top: ${specialContext.topDebtors[0]?.name || 'N/A'}.`;
        } else if (queryType === 'store') {
          resultText = `Store ${specialContext.storeName} (${specialContext.storeCode}): ₹${Math.round(specialContext.totalRevenue).toLocaleString('en-IN')} sales across ${specialContext.ordersCount} orders.`;
        } else if (queryType === 'customer') {
          if (specialContext.matchedCount === 1) {
            const c = specialContext.customers[0];
            resultText = `Customer ${c.name}: phone ${c.phone}, spent ₹${Math.round(c.spent)}, credit ₹${Math.round(c.credit)}.`;
          } else {
            resultText = `Found ${specialContext.matchedCount} matching customers: ${specialContext.customers.map((c: any) => c.name).join(', ')}.`;
          }
        } else {
          // General fallback
          const totalRev = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
          resultText = `Business stats: ₹${totalRev.toLocaleString('en-IN')} revenue, ${activeOrders.length} orders. Click to open reports.`;
        }
      }

      const suggestionItem = {
        id: `ai-suggest-${queryType}`,
        type: 'ai_insight' as const,
        title: queryType === 'credit' ? 'Ace Credit Insight' : queryType === 'store' ? 'Ace Store Insight' : queryType === 'customer' ? 'Ace Customer Insight' : 'Ace Business Insight',
        subtitle: resultText,
        description: 'Click to open in Reports Ask Ace',
        url: `/reports?tab=ace&q=${encodeURIComponent(cleanedQuery)}`
      };

      return res.json(createSuccessResponse(suggestionItem, 'AI suggestion generated'));
    }

    // 3. For generic short keyword search queries (not NL or date), we do not inject a full AI response to avoid cluttering standard results.
    // Instead, return a helpful quick action suggestion to let the user ask AI.
    const suggestionItem = {
      id: 'ai-suggest-prompt',
      type: 'ai_insight' as const,
      title: `Ask Ace: "${cleanedQuery}"`,
      subtitle: `Process "${cleanedQuery}" using database-aware Ace in the reports workspace.`,
      description: 'Click to open in Reports Ask Ace',
      url: `/reports?tab=ace&q=${encodeURIComponent(cleanedQuery)}`
    };

    return res.json(createSuccessResponse(suggestionItem, 'AI prompt suggestion generated'));

  } catch (error: any) {
    console.error('AI suggestion route error:', error);
    res.status(500).json(createErrorResponse('AI suggestion failed', 500));
  }
});

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
