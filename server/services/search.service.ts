import { db as storage } from '../db';
import { createSearchResponse } from './serialization';
import { 
  LevenshteinDistance,
  AdvancedSearchEngine
} from '../algorithms/search-algorithms';

export interface SearchOptions {
  fuzzy?: boolean;
  caseSensitive?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  data: T[];
  query: string;
  total: number;
  took: number;
}

class SearchService {
  private searchIndex = new Map<string, any[]>();
  private lastIndexUpdate = 0;
  private indexUpdateInterval = 5 * 60 * 1000; // 5 minutes

  /**
   * Simple fuzzy search implementation
   */
  private fuzzySearch<T>(
    data: T[],
    query: string,
    fields: string[],
    options: { threshold: number; maxResults: number }
  ): T[] {
    const results: Array<{ item: T; score: number }> = [];
    const queryLower = query.toLowerCase();

    for (const item of data) {
      let bestScore = 0;
      
      for (const field of fields) {
        const value = this.getNestedValue(item, field);
        if (typeof value === 'string') {
          const valueLower = value.toLowerCase();
          
          // Exact match
          if (valueLower === queryLower) {
            bestScore = Math.max(bestScore, 1.0);
          }
          // Starts with
          else if (valueLower.startsWith(queryLower)) {
            bestScore = Math.max(bestScore, 0.8);
          }
          // Contains
          else if (valueLower.includes(queryLower)) {
            bestScore = Math.max(bestScore, 0.6);
          }
          // Levenshtein distance
          else {
            const distance = LevenshteinDistance.calculate(queryLower, valueLower);
            const maxLength = Math.max(queryLower.length, valueLower.length);
            const similarity = maxLength > 0 ? 1 - (distance / maxLength) : 0;
            
            if (similarity > 0.3) {
              bestScore = Math.max(bestScore, similarity * 0.5);
            }
          }
        }
      }

      if (bestScore >= options.threshold) {
        results.push({ item, score: bestScore });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxResults)
      .map(result => result.item);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  /**
   * Search orders with fuzzy matching and autocomplete
   */
  async searchOrders(query: string, options: SearchOptions = {}): Promise<SearchResult<any>> {
    const startTime = Date.now();
    
    if (!query || query.trim().length === 0) {
      return createSearchResponse([], query, 0, Date.now() - startTime);
    }

    const orders = await storage.listOrders();
    const searchTerm = options.caseSensitive ? query : query.toLowerCase();
    const limit = options.limit || 50;

    let results: any[] = [];

    if (options.fuzzy) {
      // Use fuzzy search with Levenshtein distance
      results = this.fuzzySearch(orders, searchTerm, [
        'customerName',
        'customerEmail',
        'id'
      ], {
        threshold: 0.7,
        maxResults: limit
      });
    } else {
      // Use exact and partial matching
      results = orders.filter(order => {
        const searchableText = [
          order.customerName || '',
          order.customerEmail || '',
          order.id || '',
          Array.isArray(order.service) ? order.service.join(' ') : ''
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      }).slice(0, limit);
    }

    // Sort by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aRelevance = this.calculateRelevance(a, searchTerm);
      const bRelevance = this.calculateRelevance(b, searchTerm);
      return bRelevance - aRelevance;
    });

    const took = Date.now() - startTime;
    return createSearchResponse(results, query, results.length, took);
  }

  /**
   * Search customers with fuzzy matching
   */
  async searchCustomers(query: string, options: SearchOptions = {}): Promise<SearchResult<any>> {
    const startTime = Date.now();
    
    if (!query || query.trim().length === 0) {
      return createSearchResponse([], query, 0, Date.now() - startTime);
    }

    const customers = await storage.listCustomers();
    const searchTerm = options.caseSensitive ? query : query.toLowerCase();
    const limit = options.limit || 50;

    let results: any[] = [];

    if (options.fuzzy) {
      results = this.fuzzySearch(customers, searchTerm, [
        'name',
        'email',
        'phone'
      ], {
        threshold: 0.7,
        maxResults: limit
      });
    } else {
      results = customers.filter(customer => {
        const searchableText = [
          customer.name || '',
          customer.email || '',
          customer.phone || ''
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      }).slice(0, limit);
    }

    const took = Date.now() - startTime;
    return createSearchResponse(results, query, results.length, took);
  }

  /**
   * Search products/services
   */
  async searchProducts(query: string, options: SearchOptions = {}): Promise<SearchResult<any>> {
    const startTime = Date.now();
    
    if (!query || query.trim().length === 0) {
      return createSearchResponse([], query, 0, Date.now() - startTime);
    }

    const products = await storage.listProducts();
    const searchTerm = options.caseSensitive ? query : query.toLowerCase();
    const limit = options.limit || 50;

    let results: any[] = [];

    if (options.fuzzy) {
      results = this.fuzzySearch(products, searchTerm, [
        'name',
        'description',
        'category'
      ], {
        threshold: 0.7,
        maxResults: limit
      });
    } else {
      results = products.filter(product => {
        const searchableText = [
          product.name,
          product.description || '',
          product.category || ''
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      }).slice(0, limit);
    }

    const took = Date.now() - startTime;
    return createSearchResponse(results, query, results.length, took);
  }

  /**
   * Autocomplete suggestions for orders
   */
  async autocompleteOrders(query: string, limit: number = 10): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const orders = await storage.listOrders();
    const searchTerm = query.toLowerCase();

    // Get unique customer names and emails that match
    const suggestions = new Set<string>();
    
    orders.forEach(order => {
      if (order.customerName.toLowerCase().includes(searchTerm)) {
        suggestions.add(order.customerName);
      }
      if (order.customerEmail.toLowerCase().includes(searchTerm)) {
        suggestions.add(order.customerEmail);
      }
    });

    return Array.from(suggestions).slice(0, limit).map(suggestion => ({
      text: suggestion,
      type: 'customer'
    }));
  }

  /**
   * Autocomplete suggestions for customers
   */
  async autocompleteCustomers(query: string, limit: number = 10): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const customers = await storage.listCustomers();
    const searchTerm = query.toLowerCase();

    const suggestions = customers
      .filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit)
      .map(customer => ({
        text: customer.name,
        subtitle: customer.email,
        type: 'customer',
        id: customer.id
      }));

    return suggestions;
  }

  /**
   * Autocomplete suggestions for products
   */
  async autocompleteProducts(query: string, limit: number = 10): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const products = await storage.listProducts();
    const searchTerm = query.toLowerCase();

    const suggestions = products
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit)
      .map(product => ({
        text: product.name,
        subtitle: product.description,
        type: 'product',
        id: product.id,
        price: product.price
      }));

    return suggestions;
  }

  /**
   * Global search across all entities
   */
  async globalSearch(query: string, options: SearchOptions = {}): Promise<{
    orders: SearchResult<any>;
    customers: SearchResult<any>;
    products: SearchResult<any>;
    totalTime: number;
  }> {
    const startTime = Date.now();

    const [orders, customers, products] = await Promise.all([
      this.searchOrders(query, { ...options, limit: 10 }),
      this.searchCustomers(query, { ...options, limit: 10 }),
      this.searchProducts(query, { ...options, limit: 10 })
    ]);

    const totalTime = Date.now() - startTime;

    return {
      orders,
      customers,
      products,
      totalTime
    };
  }

  /**
   * Build search index for faster searches
   */
  async buildSearchIndex(): Promise<void> {
    try {
      const [orders, customers, products] = await Promise.all([
        storage.listOrders(),
        storage.listCustomers(),
        storage.listProducts()
      ]);

      this.searchIndex.set('orders', orders);
      this.searchIndex.set('customers', customers);
      this.searchIndex.set('products', products);
      this.lastIndexUpdate = Date.now();

      console.log('Search index built successfully');
    } catch (error) {
      console.error('Failed to build search index:', error);
    }
  }

  /**
   * Check if search index needs updating
   */
  private shouldUpdateIndex(): boolean {
    return Date.now() - this.lastIndexUpdate > this.indexUpdateInterval;
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(item: any, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Exact match gets highest score
    if (item.customerName?.toLowerCase() === queryLower) score += 100;
    if (item.name?.toLowerCase() === queryLower) score += 100;
    if (item.email?.toLowerCase() === queryLower) score += 100;

    // Starts with query gets high score
    if (item.customerName?.toLowerCase().startsWith(queryLower)) score += 50;
    if (item.name?.toLowerCase().startsWith(queryLower)) score += 50;

    // Contains query gets medium score
    if (item.customerName?.toLowerCase().includes(queryLower)) score += 25;
    if (item.name?.toLowerCase().includes(queryLower)) score += 25;
    if (item.email?.toLowerCase().includes(queryLower)) score += 25;

    // Partial match in other fields gets lower score
    if (item.id?.toLowerCase().includes(queryLower)) score += 10;
    if (item.phone?.toLowerCase().includes(queryLower)) score += 10;

    return score;
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string, type?: string): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const suggestions = [];

    if (!type || type === 'orders') {
      const orderSuggestions = await this.autocompleteOrders(query, 5);
      suggestions.push(...orderSuggestions);
    }

    if (!type || type === 'customers') {
      const customerSuggestions = await this.autocompleteCustomers(query, 5);
      suggestions.push(...customerSuggestions);
    }

    if (!type || type === 'products') {
      const productSuggestions = await this.autocompleteProducts(query, 5);
      suggestions.push(...productSuggestions);
    }

    return suggestions.slice(0, 10);
  }

  /**
   * Get recent searches (if implemented)
   */
  async getRecentSearches(userId?: string): Promise<string[]> {
    // This would typically be stored in a database
    // For now, return empty array
    return [];
  }

  /**
   * Save search query (if implemented)
   */
  async saveSearchQuery(query: string, userId?: string): Promise<void> {
    // This would typically save to a database
    // For now, do nothing
  }
}

// Export singleton instance
export const searchService = new SearchService();

// Initialize search index on startup
searchService.buildSearchIndex().catch(console.error);
