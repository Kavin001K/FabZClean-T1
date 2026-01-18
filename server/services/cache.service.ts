import { LRUCache, LFUCache, TTLCache, HybridCache } from '../algorithms/caching-algorithms';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
  strategy?: 'lru' | 'lfu' | 'ttl' | 'hybrid';
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  strategy: string;
}

class CacheService {
  private caches = new Map<string, any>();
  private defaultOptions: CacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru'
  };

  /**
   * Get or create a cache instance
   */
  private getCache(name: string, options: CacheOptions = {}): any {
    if (!this.caches.has(name)) {
      const config = { ...this.defaultOptions, ...options };
      let cache;

      switch (config.strategy) {
        case 'lru':
          cache = new LRUCache({ maxSize: config.maxSize!, evictionPolicy: 'lru' });
          break;
        case 'lfu':
          cache = new LFUCache({ maxSize: config.maxSize!, evictionPolicy: 'lfu' });
          break;
        case 'ttl':
          cache = new TTLCache({ maxSize: config.maxSize!, evictionPolicy: 'ttl', defaultTTL: config.ttl! });
          break;
        case 'hybrid':
          cache = new HybridCache({ maxSize: config.maxSize!, evictionPolicy: 'hybrid', defaultTTL: config.ttl! });
          break;
        default:
          cache = new LRUCache({ maxSize: config.maxSize!, evictionPolicy: 'lru' });
      }

      this.caches.set(name, cache);
    }

    return this.caches.get(name);
  }

  /**
   * Get value from cache
   */
  get<T>(cacheName: string, key: string): T | null {
    const cache = this.getCache(cacheName);
    return cache.get(key);
  }

  /**
   * Set value in cache
   */
  set<T>(cacheName: string, key: string, value: T, options?: CacheOptions): void {
    const cache = this.getCache(cacheName, options);
    cache.set(key, value);
  }

  /**
   * Delete value from cache
   */
  delete(cacheName: string, key: string): boolean {
    const cache = this.getCache(cacheName);
    return cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(cacheName: string): void {
    const cache = this.getCache(cacheName);
    cache.clear();
  }

  /**
   * Check if key exists in cache
   */
  has(cacheName: string, key: string): boolean {
    const cache = this.getCache(cacheName);
    return cache.has(key);
  }

  /**
   * Get cache size
   */
  size(cacheName: string): number {
    const cache = this.getCache(cacheName);
    return cache.size();
  }

  /**
   * Get cache statistics
   */
  getStats(cacheName: string): CacheStats | null {
    const cache = this.getCache(cacheName);
    if (cache.getStats) {
      return cache.getStats();
    }
    return null;
  }

  /**
   * Get all cache names
   */
  getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  /**
   * Remove cache instance
   */
  removeCache(cacheName: string): boolean {
    return this.caches.delete(cacheName);
  }

  /**
   * Cache with automatic key generation
   */
  cache<T>(
    cacheName: string,
    keyGenerator: () => string,
    valueGenerator: () => T | Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const key = keyGenerator();
    
    // Check cache first
    const cached = this.get<T>(cacheName, key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    // Generate value and cache it
    return Promise.resolve(valueGenerator()).then(value => {
      this.set(cacheName, key, value, options);
      return value;
    });
  }

  /**
   * Cache with TTL
   */
  cacheWithTTL<T>(
    cacheName: string,
    key: string,
    valueGenerator: () => T | Promise<T>,
    ttl: number
  ): Promise<T> {
    const cached = this.get<T>(cacheName, key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return Promise.resolve(valueGenerator()).then(value => {
      this.set(cacheName, key, value, { ttl });
      return value;
    });
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(cacheName: string, pattern: RegExp): number {
    const cache = this.getCache(cacheName);
    let invalidated = 0;

    // This would require implementing pattern matching in cache classes
    // For now, we'll implement a simple key-based invalidation
    if (cache.keys) {
      const keys = Array.from(cache.keys());
      for (const key of keys) {
        if (pattern.test(key)) {
          cache.delete(key);
          invalidated++;
        }
      }
    }

    return invalidated;
  }

  /**
   * Warm up cache with data
   */
  async warmup<T>(
    cacheName: string,
    dataGenerator: () => Promise<Array<{ key: string; value: T }>>,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const data = await dataGenerator();
      const cache = this.getCache(cacheName, options);

      for (const { key, value } of data) {
        cache.set(key, value);
      }

      console.log(`Cache ${cacheName} warmed up with ${data.length} items`);
    } catch (error) {
      console.error(`Failed to warm up cache ${cacheName}:`, error);
    }
  }

  /**
   * Get cache health information
   */
  getCacheHealth(): {
    totalCaches: number;
    totalSize: number;
    caches: Array<{
      name: string;
      size: number;
      maxSize: number;
      hitRate: number;
      strategy: string;
    }>;
  } {
    const caches = Array.from(this.caches.entries()).map(([name, cache]) => {
      const stats = cache.getStats ? cache.getStats() : null;
      return {
        name,
        size: cache.size(),
        maxSize: cache.maxSize || 0,
        hitRate: stats ? stats.hitRate : 0,
        strategy: cache.constructor.name
      };
    });

    const totalSize = caches.reduce((sum, cache) => sum + cache.size, 0);

    return {
      totalCaches: caches.length,
      totalSize,
      caches
    };
  }

  /**
   * Cleanup expired entries from all caches
   */
  cleanup(): void {
    for (const [name, cache] of this.caches.entries()) {
      if (cache.cleanup) {
        cache.cleanup();
      }
    }
  }

  /**
   * Set default cache options
   */
  setDefaultOptions(options: CacheOptions): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Create a cache for specific entity type
   */
  createEntityCache(entityType: string, options?: CacheOptions): {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T) => void;
    delete: (key: string) => boolean;
    clear: () => void;
    invalidatePattern: (pattern: RegExp) => number;
  } {
    const cacheName = `${entityType}_cache`;
    
    return {
      get: <T>(key: string) => this.get<T>(cacheName, key),
      set: <T>(key: string, value: T) => this.set(cacheName, key, value, options),
      delete: (key: string) => this.delete(cacheName, key),
      clear: () => this.clear(cacheName),
      invalidatePattern: (pattern: RegExp) => this.invalidatePattern(cacheName, pattern)
    };
  }

  /**
   * Batch operations for better performance
   */
  batchSet<T>(cacheName: string, entries: Array<{ key: string; value: T }>, options?: CacheOptions): void {
    const cache = this.getCache(cacheName, options);
    
    for (const { key, value } of entries) {
      cache.set(key, value);
    }
  }

  /**
   * Batch get operations
   */
  batchGet<T>(cacheName: string, keys: string[]): Array<{ key: string; value: T | null }> {
    const cache = this.getCache(cacheName);
    
    return keys.map(key => ({
      key,
      value: cache.get(key)
    }));
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Pre-configure common caches
cacheService.createEntityCache('orders', { ttl: 2 * 60 * 1000, maxSize: 500 }); // 2 minutes
cacheService.createEntityCache('customers', { ttl: 5 * 60 * 1000, maxSize: 1000 }); // 5 minutes
cacheService.createEntityCache('products', { ttl: 10 * 60 * 1000, maxSize: 200 }); // 10 minutes
cacheService.createEntityCache('services', { ttl: 15 * 60 * 1000, maxSize: 100 }); // 15 minutes

// Cleanup expired entries every minute
setInterval(() => {
  cacheService.cleanup();
}, 60 * 1000);
