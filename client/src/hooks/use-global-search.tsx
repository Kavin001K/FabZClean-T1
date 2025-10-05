import { useState, useEffect, useCallback } from 'react';
import { useDebouncedSearch } from './use-debounce';
import { log } from '@/lib/logger';

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

  // Search function using the dedicated API
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    log.debug('Performing global search', { query });
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const data = await response.json();
      
      // Combine all results into a single array
      const allResults: SearchResult[] = [
        ...data.orders,
        ...data.customers,
        ...data.products,
        ...data.services
      ];
      
      setSearchResults(allResults);
      log.info('Global search completed', { query, resultCount: allResults.length });
    } catch (error) {
      log.error('Search failed', error as Error, { query });
      setSearchResults([]);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    log.debug('Search cleared');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
    search
  };
}
