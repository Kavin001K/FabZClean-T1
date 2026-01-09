import { useState, useEffect, useCallback } from 'react';
import { useDebouncedSearch } from './use-debounce';
import { log } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase-auth';

export interface SearchResult {
  id: string;
  type: 'order' | 'customer' | 'product' | 'service';
  title: string;
  subtitle: string;
  description: string;
  url: string;
  createdAt?: string;
}

export function useGlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { debouncedQuery, isSearching } = useDebouncedSearch(searchQuery, 300);
  const [loading, setLoading] = useState(false);

  // Search function using the dedicated API or direct Supabase
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    log.debug('Performing global search', { query });

    try {
      let allResults: SearchResult[] = [];

      if (apiClient.isDirectSupabaseMode()) {
        // Direct Supabase Search (Universal)
        const [orders, customers, products, services] = await Promise.all([
          // Search Orders
          supabase.from('orders')
            .select('id,order_number,customer_name,status')
            .or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%`)
            .limit(5)
            .then(({ data }) => (data || []).map((o: any) => ({
              id: o.id,
              type: 'order' as const,
              title: o.order_number,
              subtitle: o.customer_name,
              description: `Status: ${o.status}`,
              url: `/orders/${o.id}`,
            }))),

          // Search Customers
          supabase.from('customers')
            .select('id,name,phone,email')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
            .limit(5)
            .then(({ data }) => (data || []).map((c: any) => ({
              id: c.id,
              type: 'customer' as const,
              title: c.name,
              subtitle: c.phone || c.email,
              description: c.email || '',
              url: `/customers/${c.id}`,
            }))),

          // Search Products/Inventory
          supabase.from('products') // Assuming 'products' or 'inventory' table matches backend schema
            .select('id,name,sku,category')
            .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
            .limit(5)
            .then(({ data }) => (data || []).map((p: any) => ({
              id: p.id,
              type: 'product' as const,
              title: p.name,
              subtitle: p.sku || '',
              description: p.category || '',
              url: `/inventory/${p.id}`,
            }))),

          // Search Services
          supabase.from('services')
            .select('id,name,category,price')
            .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
            .limit(5)
            .then(({ data }) => (data || []).map((s: any) => ({
              id: s.id,
              type: 'service' as const,
              title: s.name,
              subtitle: s.category,
              description: `Price: ${s.price}`,
              url: `/services?highlight=${s.id}` // Link to services page
            })))
        ]);

        allResults = [...orders, ...customers, ...products, ...services];

      } else {
        // Backend API Search
        // Use apiClient.get if /api/search was supported by it, or direct fetch for custom endpoint
        // Since apiClient adds /api prefix by default and supports auth headers:
        const data = await apiClient.get(`/search?q=${encodeURIComponent(query)}&limit=10`);

        // Combine all results into a single array
        allResults = [
          ...(data.orders || []),
          ...(data.customers || []),
          ...(data.products || []),
          ...(data.services || [])
        ];
      }

      setSearchResults(allResults);
      log.info('Global search completed', { query, resultCount: allResults.length });
    } catch (error) {
      log.error('Search failed', error as Error, { query });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setLoading(false);
    log.debug('Search cleared');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching: loading || isSearching,
    clearSearch,
    search
  };
}
