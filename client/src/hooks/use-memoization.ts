import { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for creating a stable reference to a value that only changes when dependencies change
 * Similar to useMemo but with better TypeScript support and debugging
 */
export function useStableValue<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Hook for creating a stable callback reference that only changes when dependencies change
 * Similar to useCallback but with better TypeScript support and debugging
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Hook for memoizing expensive computations with a custom equality function
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (prev: T, next: T) => boolean
): T {
  const prevValueRef = useRef<T>();
  const prevDepsRef = useRef<React.DependencyList>();

  return useMemo(() => {
    const newValue = factory();
    
    // If we have a custom equality function and the value hasn't changed, return the previous value
    if (isEqual && prevValueRef.current !== undefined && isEqual(prevValueRef.current, newValue)) {
      return prevValueRef.current;
    }

    // Check if dependencies have changed
    const depsChanged = !prevDepsRef.current || 
      deps.length !== prevDepsRef.current.length ||
      deps.some((dep, index) => dep !== prevDepsRef.current![index]);

    if (!depsChanged && prevValueRef.current !== undefined) {
      return prevValueRef.current;
    }

    prevValueRef.current = newValue;
    prevDepsRef.current = deps;
    return newValue;
  }, deps);
}

/**
 * Hook for creating a memoized selector function
 * Useful for selecting specific parts of complex objects
 */
export function useMemoizedSelector<T, R>(
  selector: (value: T) => R,
  value: T,
  isEqual?: (prev: R, next: R) => boolean
): R {
  return useMemoizedValue(
    () => selector(value),
    [value],
    isEqual
  );
}

/**
 * Hook for creating a memoized filter function
 * Useful for filtering arrays with complex logic
 */
export function useMemoizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: React.DependencyList = []
): T[] {
  return useMemoizedValue(
    () => items.filter(filterFn),
    [items, ...deps]
  );
}

/**
 * Hook for creating a memoized sort function
 * Useful for sorting arrays with complex logic
 */
export function useMemoizedSort<T>(
  items: T[],
  sortFn: (a: T, b: T) => number,
  deps: React.DependencyList = []
): T[] {
  return useMemoizedValue(
    () => [...items].sort(sortFn),
    [items, ...deps]
  );
}

/**
 * Hook for creating a memoized group function
 * Useful for grouping arrays by a key
 */
export function useMemoizedGroup<T, K extends string | number>(
  items: T[],
  groupBy: (item: T) => K,
  deps: React.DependencyList = []
): Record<K, T[]> {
  return useMemoizedValue(
    () => {
      const groups = {} as Record<K, T[]>;
      items.forEach(item => {
        const key = groupBy(item);
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      });
      return groups;
    },
    [items, ...deps]
  );
}

/**
 * Hook for creating a memoized search function
 * Useful for searching through arrays with complex logic
 */
export function useMemoizedSearch<T>(
  items: T[],
  searchQuery: string,
  searchFn: (item: T, query: string) => boolean,
  deps: React.DependencyList = []
): T[] {
  return useMemoizedValue(
    () => {
      if (!searchQuery.trim()) return items;
      return items.filter(item => searchFn(item, searchQuery));
    },
    [items, searchQuery, ...deps]
  );
}

/**
 * Hook for creating a memoized pagination function
 * Useful for paginating large arrays
 */
export function useMemoizedPagination<T>(
  items: T[],
  page: number,
  pageSize: number,
  deps: React.DependencyList = []
): { paginatedItems: T[]; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } {
  return useMemoizedValue(
    () => {
      const totalPages = Math.ceil(items.length / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = items.slice(startIndex, endIndex);
      
      return {
        paginatedItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    },
    [items, page, pageSize, ...deps]
  );
}

/**
 * Hook for creating a memoized statistics function
 * Useful for calculating statistics from arrays
 */
export function useMemoizedStats<T>(
  items: T[],
  statsFn: (items: T[]) => { [key: string]: any },
  deps: React.DependencyList = []
): { [key: string]: any } {
  return useMemoizedValue(
    () => statsFn(items),
    [items, ...deps]
  );
}

/**
 * Utility function for deep equality comparison
 * Useful for complex objects that need deep comparison
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Utility function for shallow equality comparison
 * Useful for simple objects that only need shallow comparison
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (a[key] !== b[key]) return false;
  }
  
  return true;
}
