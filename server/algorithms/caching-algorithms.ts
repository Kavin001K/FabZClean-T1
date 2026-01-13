/**
 * Advanced Caching Algorithms for FabZClean
 * Implements LRU, LFU, TTL, and intelligent cache management
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl?: number;
  size: number;
}

export interface CacheOptions {
  maxSize: number;
  defaultTTL?: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'hybrid';
  enableMetrics?: boolean;
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
 * LRU (Least Recently Used) Cache Implementation
 * Time Complexity: O(1) for get/set operations
 * Space Complexity: O(n)
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private readonly maxSize: number;
  private readonly defaultTTL?: number;
  private metrics: CacheMetrics;

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize;
    this.defaultTTL = options.defaultTTL;
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access order
    this.updateAccessOrder(key);
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    this.metrics.hits++;
    this.updateHitRate();
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;
    
    // Check if key already exists
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = now;
      entry.lastAccessed = now;
      entry.ttl = entryTTL;
      this.updateAccessOrder(key);
      return;
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Create new entry
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ttl: entryTTL,
      size: this.calculateSize(value)
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.updateMetrics();
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.updateMetrics();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.updateMetrics();
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
    this.metrics.evictions++;
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateSize(value: T): number {
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  private updateMetrics(): void {
    this.metrics.size = this.cache.size;
    this.metrics.memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * LFU (Least Frequently Used) Cache Implementation
 * Time Complexity: O(log n) for eviction, O(1) for get/set
 * Space Complexity: O(n)
 */
export class LFUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private frequencyMap = new Map<number, Set<string>>();
  private minFrequency = 0;
  private readonly maxSize: number;
  private readonly defaultTTL?: number;
  private metrics: CacheMetrics;

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize;
    this.defaultTTL = options.defaultTTL;
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Update frequency
    this.updateFrequency(key, entry.accessCount);
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.metrics.hits++;
    this.updateHitRate();
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = now;
      entry.lastAccessed = now;
      entry.ttl = entryTTL;
      this.updateFrequency(key, entry.accessCount);
      return;
    }

    if (this.cache.size >= this.maxSize) {
      this.evictLFU();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ttl: entryTTL,
      size: this.calculateSize(value)
    };

    this.cache.set(key, entry);
    this.updateFrequency(key, 0);
    this.updateMetrics();
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const freq = entry.accessCount;
    const freqSet = this.frequencyMap.get(freq);
    if (freqSet) {
      freqSet.delete(key);
      if (freqSet.size === 0) {
        this.frequencyMap.delete(freq);
        if (freq === this.minFrequency) {
          this.minFrequency++;
        }
      }
    }

    this.cache.delete(key);
    this.updateMetrics();
    return true;
  }

  private evictLFU(): void {
    const freqSet = this.frequencyMap.get(this.minFrequency);
    if (!freqSet || freqSet.size === 0) return;

    // Get least recently used among least frequently used
    let oldestKey = '';
    let oldestTime = Infinity;
    
    for (const key of freqSet) {
      const entry = this.cache.get(key)!;
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    this.delete(oldestKey);
    this.metrics.evictions++;
  }

  private updateFrequency(key: string, oldFreq: number): void {
    const newFreq = oldFreq + 1;
    
    // Remove from old frequency
    const oldFreqSet = this.frequencyMap.get(oldFreq);
    if (oldFreqSet) {
      oldFreqSet.delete(key);
      if (oldFreqSet.size === 0) {
        this.frequencyMap.delete(oldFreq);
        if (oldFreq === this.minFrequency) {
          this.minFrequency = newFreq;
        }
      }
    }

    // Add to new frequency
    if (!this.frequencyMap.has(newFreq)) {
      this.frequencyMap.set(newFreq, new Set());
    }
    this.frequencyMap.get(newFreq)!.add(key);

    // Update min frequency
    if (newFreq < this.minFrequency) {
      this.minFrequency = newFreq;
    }
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateSize(value: T): number {
    return JSON.stringify(value).length * 2;
  }

  private updateMetrics(): void {
    this.metrics.size = this.cache.size;
    this.metrics.memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  clear(): void {
    this.cache.clear();
    this.frequencyMap.clear();
    this.minFrequency = 0;
    this.updateMetrics();
  }
}

/**
 * TTL (Time To Live) Cache with automatic cleanup
 */
export class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly defaultTTL: number;
  private metrics: CacheMetrics;

  constructor(options: CacheOptions) {
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes default
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.metrics.hits++;
    this.updateHitRate();
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ttl: entryTTL,
      size: this.calculateSize(value)
    };

    this.cache.set(key, entry);
    
    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
      this.metrics.evictions++;
    }, entryTTL);
    
    this.timers.set(key, timer);
    this.updateMetrics();
  }

  delete(key: string): boolean {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateMetrics();
    }
    return deleted;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > (entry.ttl || this.defaultTTL);
  }

  private calculateSize(value: T): number {
    return JSON.stringify(value).length * 2;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.delete(key);
      this.metrics.evictions++;
    });
  }

  private updateMetrics(): void {
    this.metrics.size = this.cache.size;
    this.metrics.memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  clear(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
    this.updateMetrics();
  }
}

/**
 * Hybrid Cache combining multiple strategies
 */
export class HybridCache<T> {
  private lruCache: LRUCache<T>;
  private lfuCache: LFUCache<T>;
  private ttlCache: TTLCache<T>;
  private readonly strategy: 'lru' | 'lfu' | 'ttl' | 'adaptive';
  private metrics: CacheMetrics;

  constructor(options: CacheOptions) {
    this.strategy = options.evictionPolicy as 'lru' | 'lfu' | 'ttl' | 'adaptive';
    
    this.lruCache = new LRUCache<T>({ ...options, evictionPolicy: 'lru' });
    this.lfuCache = new LFUCache<T>({ ...options, evictionPolicy: 'lfu' });
    this.ttlCache = new TTLCache<T>({ ...options, evictionPolicy: 'ttl' });
    
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };
  }

  get(key: string): T | null {
    let value: T | null = null;
    
    // Try current strategy first
    switch (this.strategy) {
      case 'lru':
        value = this.lruCache.get(key);
        break;
      case 'lfu':
        value = this.lfuCache.get(key);
        break;
      case 'ttl':
        value = this.ttlCache.get(key);
        break;
      case 'adaptive':
        value = this.getAdaptive(key);
        break;
    }

    if (value !== null) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }

    this.updateMetrics();
    return value;
  }

  set(key: string, value: T, ttl?: number): void {
    switch (this.strategy) {
      case 'lru':
        this.lruCache.set(key, value, ttl);
        break;
      case 'lfu':
        this.lfuCache.set(key, value, ttl);
        break;
      case 'ttl':
        this.ttlCache.set(key, value, ttl);
        break;
      case 'adaptive':
        this.setAdaptive(key, value, ttl);
        break;
    }
    this.updateMetrics();
  }

  private getAdaptive(key: string): T | null {
    // Try LRU first, then LFU, then TTL
    let value = this.lruCache.get(key);
    if (value) return value;
    
    value = this.lfuCache.get(key);
    if (value) return value;
    
    return this.ttlCache.get(key);
  }

  private setAdaptive(key: string, value: T, ttl?: number): void {
    // Use LRU for frequently accessed data, TTL for temporary data
    const now = Date.now();
    const recentAccess = this.lruCache.get(key) !== null;
    
    if (recentAccess || !ttl) {
      this.lruCache.set(key, value, ttl);
    } else {
      this.ttlCache.set(key, value, ttl);
    }
  }

  private updateMetrics(): void {
    const lruMetrics = this.lruCache.getMetrics();
    const lfuMetrics = this.lfuCache.getMetrics();
    const ttlMetrics = this.ttlCache.getMetrics();

    this.metrics = {
      hits: lruMetrics.hits + lfuMetrics.hits + ttlMetrics.hits,
      misses: lruMetrics.misses + lfuMetrics.misses + ttlMetrics.misses,
      evictions: lruMetrics.evictions + lfuMetrics.evictions + ttlMetrics.evictions,
      size: lruMetrics.size + lfuMetrics.size + ttlMetrics.size,
      hitRate: 0,
      memoryUsage: lruMetrics.memoryUsage + lfuMetrics.memoryUsage + ttlMetrics.memoryUsage
    };

    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  clear(): void {
    this.lruCache.clear();
    this.lfuCache.clear();
    this.ttlCache.clear();
    this.updateMetrics();
  }
}

/**
 * Cache Manager for FabZClean Application
 */
export class FabZCleanCacheManager {
  private caches = new Map<string, HybridCache<any>>();
  private globalMetrics: CacheMetrics;

  constructor() {
    this.globalMetrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };
  }

  createCache<T>(name: string, options: CacheOptions): HybridCache<T> {
    const cache = new HybridCache<T>(options);
    this.caches.set(name, cache);
    return cache;
  }

  getCache<T>(name: string): HybridCache<T> | null {
    return this.caches.get(name) || null;
  }

  getGlobalMetrics(): CacheMetrics {
    this.updateGlobalMetrics();
    return { ...this.globalMetrics };
  }

  private updateGlobalMetrics(): void {
    this.globalMetrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };

    this.caches.forEach(cache => {
      const metrics = cache.getMetrics();
      this.globalMetrics.hits += metrics.hits;
      this.globalMetrics.misses += metrics.misses;
      this.globalMetrics.evictions += metrics.evictions;
      this.globalMetrics.size += metrics.size;
      this.globalMetrics.memoryUsage += metrics.memoryUsage;
    });

    const total = this.globalMetrics.hits + this.globalMetrics.misses;
    this.globalMetrics.hitRate = total > 0 ? this.globalMetrics.hits / total : 0;
  }

  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
    this.updateGlobalMetrics();
  }
}

// Global cache manager instance
export const cacheManager = new FabZCleanCacheManager();
