import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items to cache
  strategy?: 'lru' | 'lfu' | 'ttl' | 'hybrid';
  enableMetrics?: boolean;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * Client-side cache implementation
 */
class ClientCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0,
    memoryUsage: 0
  };

  constructor(
    private options: CacheOptions = {}
  ) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      strategy: 'lru',
      enableMetrics: true,
      ...options
    };
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.metrics.hits++;
    this.updateMetrics();
    
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ttl: ttl || this.options.ttl
    };

    // Check if we need to evict
    if (this.cache.size >= this.options.maxSize!) {
      this.evict();
    }

    this.cache.set(key, entry);
    this.updateMetrics();
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.updateMetrics();
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  private evict(): void {
    const entries = Array.from(this.cache.entries());
    
    switch (this.options.strategy) {
      case 'lru':
        // Remove least recently used
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case 'lfu':
        // Remove least frequently used
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'ttl':
        // Remove oldest
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
      case 'hybrid':
        // Hybrid: prioritize by access count, then by recency
        entries.sort((a, b) => {
          const scoreA = a[1].accessCount / (Date.now() - a[1].lastAccessed + 1);
          const scoreB = b[1].accessCount / (Date.now() - b[1].lastAccessed + 1);
          return scoreA - scoreB;
        });
        break;
    }

    const [keyToEvict] = entries[0];
    this.cache.delete(keyToEvict);
    this.metrics.evictions++;
  }

  private updateMetrics(): void {
    this.metrics.size = this.cache.size;
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
    
    // Estimate memory usage (rough calculation)
    this.metrics.memoryUsage = this.cache.size * 1024; // Assume 1KB per entry
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getStats(): { keys: string[]; size: number; metrics: CacheMetrics } {
    return {
      keys: Array.from(this.cache.keys()),
      size: this.cache.size,
      metrics: this.getMetrics()
    };
  }
}

/**
 * Cache manager for multiple caches
 */
class CacheManager {
  private caches = new Map<string, ClientCache<any>>();

  getCache<T>(name: string, options?: CacheOptions): ClientCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new ClientCache<T>(options));
    }
    return this.caches.get(name)!;
  }

  clearCache(name: string): void {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
    }
  }

  clearAllCaches(): void {
    this.caches.forEach(cache => cache.clear());
  }

  getCacheStats(name: string) {
    const cache = this.caches.get(name);
    return cache ? cache.getStats() : null;
  }

  getAllCacheStats() {
    const stats: Record<string, any> = {};
    this.caches.forEach((cache, name) => {
      stats[name] = cache.getStats();
    });
    return stats;
  }
}

// Global cache manager instance
const cacheManager = new CacheManager();

/**
 * Hook for client-side caching
 */
export function useClientCache<T>(
  cacheName: string,
  options?: CacheOptions
) {
  const cache = useMemo(() => {
    return cacheManager.getCache<T>(cacheName, options);
  }, [cacheName, options?.ttl, options?.maxSize, options?.strategy]);

  const get = useCallback((key: string): T | null => {
    return cache.get(key);
  }, [cache]);

  const set = useCallback((key: string, value: T, ttl?: number): void => {
    cache.set(key, value, ttl);
  }, [cache]);

  const remove = useCallback((key: string): boolean => {
    return cache.delete(key);
  }, [cache]);

  const clear = useCallback((): void => {
    cache.clear();
  }, [cache]);

  const has = useCallback((key: string): boolean => {
    return cache.has(key);
  }, [cache]);

  const metrics = useMemo(() => {
    return cache.getMetrics();
  }, [cache]);

  return {
    get,
    set,
    remove,
    clear,
    has,
    metrics
  };
}

/**
 * Hook for cached API calls
 */
export function useCachedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: {
    cacheName?: string;
    cacheKey?: string;
    ttl?: number;
    staleTime?: number;
    enabled?: boolean;
  } = {}
) {
  const {
    cacheName = 'default',
    cacheKey = queryKey.join('-'),
    ttl = 5 * 60 * 1000,
    staleTime = 30000,
    enabled = true
  } = options;

  const { get, set } = useClientCache<T>(cacheName, { ttl });
  
  const [cachedData, setCachedData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check cache first
  useEffect(() => {
    if (enabled) {
      const cached = get(cacheKey);
      if (cached) {
        setCachedData(cached);
      }
    }
  }, [enabled, cacheKey, get]);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await queryFn();
      set(cacheKey, data, ttl);
      setCachedData(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, queryFn, cacheKey, set, ttl]);

  // Use TanStack Query for additional caching and background updates
  const queryClient = useQueryClient();
  
  const {
    data: queryData,
    isLoading: queryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey,
    queryFn,
    enabled: enabled && !cachedData,
    staleTime,
    retry: 1
  });

  // Update cache when query data changes
  useEffect(() => {
    if (queryData) {
      set(cacheKey, queryData, ttl);
      setCachedData(queryData);
    }
  }, [queryData, cacheKey, set, ttl]);

  return {
    data: cachedData || queryData,
    isLoading: isLoading || queryLoading,
    error: error || queryError,
    refetch: async () => {
      // Clear cache and refetch
      cacheManager.clearCache(cacheName);
      setCachedData(null);
      await fetchData();
      return refetch();
    },
    invalidateCache: () => {
      cacheManager.clearCache(cacheName);
      setCachedData(null);
    }
  };
}

/**
 * Hook for cache warming
 */
export function useCacheWarming<T>(
  cacheName: string,
  data: T[],
  keyExtractor: (item: T) => string,
  options: {
    ttl?: number;
    batchSize?: number;
    delay?: number;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, batchSize = 10, delay = 100 } = options;
  const { set } = useClientCache<T>(cacheName, { ttl });
  
  const [isWarming, setIsWarming] = useState(false);
  const [progress, setProgress] = useState(0);

  const warmCache = useCallback(async () => {
    setIsWarming(true);
    setProgress(0);

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      batch.forEach(item => {
        const key = keyExtractor(item);
        set(key, item, ttl);
      });

      setProgress(Math.min(100, ((i + batchSize) / data.length) * 100));
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsWarming(false);
  }, [data, keyExtractor, set, ttl, batchSize, delay]);

  return {
    warmCache,
    isWarming,
    progress
  };
}

/**
 * Hook for cache invalidation patterns
 */
export function useCacheInvalidation(cacheName: string) {
  const { remove, clear } = useClientCache(cacheName);

  const invalidateByPattern = useCallback((pattern: RegExp) => {
    const cache = cacheManager.getCache(cacheName);
    const stats = cache.getStats();
    
    stats.keys.forEach(key => {
      if (pattern.test(key)) {
        remove(key);
      }
    });
  }, [cacheName, remove]);

  const invalidateByPrefix = useCallback((prefix: string) => {
    invalidateByPattern(new RegExp(`^${prefix}`));
  }, [invalidateByPattern]);

  const invalidateBySuffix = useCallback((suffix: string) => {
    invalidateByPattern(new RegExp(`${suffix}$`));
  }, [invalidateByPattern]);

  return {
    invalidateByPattern,
    invalidateByPrefix,
    invalidateBySuffix,
    clearCache: clear
  };
}

/**
 * Cache statistics hook
 */
export function useCacheStats(cacheName?: string) {
  const [stats, setStats] = useState<Record<string, any>>({});

  const updateStats = useCallback(() => {
    if (cacheName) {
      const cacheStats = cacheManager.getCacheStats(cacheName);
      if (cacheStats) {
        setStats({ [cacheName]: cacheStats });
      }
    } else {
      setStats(cacheManager.getAllCacheStats());
    }
  }, [cacheName]);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    stats,
    updateStats
  };
}

export { cacheManager };
