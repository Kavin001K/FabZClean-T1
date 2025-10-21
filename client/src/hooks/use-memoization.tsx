import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized search hook
export function useMemoizedSearch<T>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[],
  options: {
    caseSensitive?: boolean;
    threshold?: number;
    maxResults?: number;
  } = {}
) {
  const {
    caseSensitive = false,
    threshold = 0.3,
    maxResults = 50
  } = options;

  const debouncedQuery = useDebounce(searchQuery, 300);

  return useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    const query = caseSensitive ? debouncedQuery : debouncedQuery.toLowerCase();
    const results: Array<{ item: T; score: number }> = [];

    for (const item of items) {
      let bestScore = 0;

      for (const field of searchFields) {
        const value = item[field];
        if (typeof value === 'string') {
          const itemValue = caseSensitive ? value : value.toLowerCase();
          
          // Exact match
          if (itemValue === query) {
            bestScore = Math.max(bestScore, 1.0);
          }
          // Starts with
          else if (itemValue.startsWith(query)) {
            bestScore = Math.max(bestScore, 0.8);
          }
          // Contains
          else if (itemValue.includes(query)) {
            bestScore = Math.max(bestScore, 0.6);
          }
          // Fuzzy match (simple Levenshtein distance)
          else {
            const distance = levenshteinDistance(query, itemValue);
            const maxLength = Math.max(query.length, itemValue.length);
            const similarity = maxLength > 0 ? 1 - (distance / maxLength) : 0;
            
            if (similarity > threshold) {
              bestScore = Math.max(bestScore, similarity * 0.5);
            }
          }
        }
      }

      if (bestScore >= threshold) {
        results.push({ item, score: bestScore });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(result => result.item);
  }, [items, debouncedQuery, searchFields, caseSensitive, threshold, maxResults]);
}

// Memoized sorting hook
export function useMemoizedSort<T>(
  items: T[],
  sortField: keyof T,
  sortDirection: 'asc' | 'desc' = 'asc'
) {
  return useMemo(() => {
    if (!sortField) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? -1 : 1;

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime();
      }

      // Fallback to string comparison
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortField, sortDirection]);
}

// Memoized filtering hook
export function useMemoizedFilter<T>(
  items: T[],
  filters: Record<string, any>
) {
  return useMemo(() => {
    if (!filters || Object.keys(filters).length === 0) {
      return items;
    }

    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return true;
        }

        const itemValue = (item as any)[key];
        
        if (typeof value === 'string') {
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        }

        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }

        return itemValue === value;
      });
    });
  }, [items, filters]);
}

// Memoized pagination hook
export function useMemoizedPagination<T>(
  items: T[],
  page: number,
  pageSize: number
) {
  return useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / pageSize);

    return {
      items: paginatedItems,
      totalItems: items.length,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }, [items, page, pageSize]);
}

// Memoized computation hook with cache
export function useMemoizedComputation<T, R>(
  computation: (input: T) => R,
  input: T,
  cacheKey?: string
) {
  const cacheRef = useRef<Map<string, R>>(new Map());

  return useMemo(() => {
    const key = cacheKey || JSON.stringify(input);
    
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }

    const result = computation(input);
    cacheRef.current.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cacheRef.current.size > 100) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    return result;
  }, [computation, input, cacheKey]);
}

// Memoized callback with dependency tracking
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Utility function for Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// Export all hooks
export {
  useDebounce,
  useThrottle,
  useMemoizedSearch,
  useMemoizedSort,
  useMemoizedFilter,
  useMemoizedPagination,
  useMemoizedComputation,
  useMemoizedCallback
};
