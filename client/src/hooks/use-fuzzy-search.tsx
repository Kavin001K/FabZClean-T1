import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface FuzzySearchOptions {
  threshold?: number;
  caseSensitive?: boolean;
  maxResults?: number;
  debounceMs?: number;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matchedFields: string[];
  highlights: { [field: string]: string };
}

/**
 * Client-side fuzzy search implementation using Levenshtein distance
 */
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
}

/**
 * Highlight matching text in a string
 */
function highlightText(text: string, query: string): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Client-side fuzzy search hook for instant results
 */
export function useFuzzySearch<T>(
  data: T[],
  query: string,
  searchFields: string[],
  options: FuzzySearchOptions = {}
) {
  const {
    threshold = 0.7,
    caseSensitive = false,
    maxResults = 50,
    debounceMs = 300
  } = options;

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return [];
    }

    const searchTerm = caseSensitive ? debouncedQuery : debouncedQuery.toLowerCase();
    const searchResults: SearchResult<T>[] = [];

    for (const item of data) {
      let bestScore = 0;
      const matchedFields: string[] = [];
      const highlights: { [field: string]: string } = {};

      for (const field of searchFields) {
        const value = getNestedValue(item, field);
        if (typeof value === 'string' && value) {
          const fieldValue = caseSensitive ? value : value.toLowerCase();
          
          // Exact match
          if (fieldValue === searchTerm) {
            bestScore = Math.max(bestScore, 1.0);
            matchedFields.push(field);
            highlights[field] = highlightText(value, debouncedQuery);
          }
          // Starts with
          else if (fieldValue.startsWith(searchTerm)) {
            bestScore = Math.max(bestScore, 0.8);
            matchedFields.push(field);
            highlights[field] = highlightText(value, debouncedQuery);
          }
          // Contains
          else if (fieldValue.includes(searchTerm)) {
            bestScore = Math.max(bestScore, 0.6);
            matchedFields.push(field);
            highlights[field] = highlightText(value, debouncedQuery);
          }
          // Levenshtein distance
          else {
            const distance = calculateLevenshteinDistance(searchTerm, fieldValue);
            const maxLength = Math.max(searchTerm.length, fieldValue.length);
            const similarity = maxLength > 0 ? 1 - (distance / maxLength) : 0;
            
            if (similarity > 0.3) {
              bestScore = Math.max(bestScore, similarity * 0.5);
              matchedFields.push(field);
              highlights[field] = highlightText(value, debouncedQuery);
            }
          }
        }
      }

      if (bestScore >= threshold && matchedFields.length > 0) {
        searchResults.push({
          item,
          score: bestScore,
          matchedFields,
          highlights
        });
      }
    }

    return searchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }, [data, debouncedQuery, searchFields, threshold, caseSensitive, maxResults]);

  return {
    results,
    query: debouncedQuery,
    isLoading: query !== debouncedQuery,
    totalResults: results.length
  };
}

/**
 * Server-side search hook with client-side fallback
 */
export function useServerSearch<T>(
  endpoint: string,
  query: string,
  searchFields: string[],
  options: FuzzySearchOptions & {
    enabled?: boolean;
    staleTime?: number;
  } = {}
) {
  const {
    enabled = true,
    staleTime = 30000,
    ...searchOptions
  } = options;

  const {
    data: serverResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['search', endpoint, query],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        fuzzy: 'true',
        limit: (searchOptions.maxResults || 50).toString()
      });

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      return response.json();
    },
    enabled: enabled && query.length >= 2,
    staleTime,
    retry: 1
  });

  return {
    results: serverResults?.data || [],
    isLoading,
    error,
    refetch,
    totalResults: serverResults?.total || 0,
    searchTime: serverResults?.took || 0
  };
}

/**
 * Hybrid search hook that combines client and server search
 */
export function useHybridSearch<T>(
  localData: T[],
  searchFields: string[],
  serverEndpoint: string,
  query: string,
  options: FuzzySearchOptions & {
    preferServer?: boolean;
    minQueryLength?: number;
  } = {}
) {
  const {
    preferServer = true,
    minQueryLength = 3,
    ...searchOptions
  } = options;

  // Client-side search
  const clientSearch = useFuzzySearch(localData, query, searchFields, searchOptions);

  // Server-side search
  const serverSearch = useServerSearch(serverEndpoint, query, searchFields, {
    ...searchOptions,
    enabled: preferServer && query.length >= minQueryLength
  });

  const useServerResults = preferServer && query.length >= minQueryLength && !serverSearch.isLoading;

  return {
    results: useServerResults ? serverSearch.results : clientSearch.results,
    isLoading: serverSearch.isLoading || clientSearch.isLoading,
    error: serverSearch.error,
    totalResults: useServerResults ? serverSearch.totalResults : clientSearch.totalResults,
    searchTime: useServerResults ? serverSearch.searchTime : 0,
    source: useServerResults ? 'server' : 'client',
    refetch: serverSearch.refetch
  };
}

/**
 * Search suggestions hook
 */
export function useSearchSuggestions(
  query: string,
  options: {
    types?: string[];
    limit?: number;
    debounceMs?: number;
  } = {}
) {
  const { types = ['orders', 'customers', 'products'], limit = 10, debounceMs = 200 } = options;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery, types],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      const params = new URLSearchParams({
        q: debouncedQuery,
        limit: limit.toString()
      });

      if (types.length > 0) {
        params.set('type', types.join(','));
      }

      const response = await fetch(`/api/v1/search/suggestions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000, // Cache for 1 minute
    retry: 1
  });

  return {
    suggestions: suggestions?.data || [],
    isLoading,
    query: debouncedQuery
  };
}

/**
 * Recent searches hook
 */
export function useRecentSearches(userId?: string) {
  const { data: recentSearches } = useQuery({
    queryKey: ['recent-searches', userId],
    queryFn: async () => {
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`/api/v1/search/recent${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent searches');
      }
      return response.json();
    },
    staleTime: 300000, // Cache for 5 minutes
    retry: 1
  });

  const saveSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;

    try {
      await fetch('/api/v1/search/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, userId })
      });
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }, [userId]);

  return {
    recentSearches: recentSearches?.data || [],
    saveSearch
  };
}
