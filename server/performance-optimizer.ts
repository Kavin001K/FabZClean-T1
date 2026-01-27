/**
 * Enterprise-Grade Performance Optimization Module
 *
 * This module provides comprehensive performance monitoring, caching,
 * and optimization utilities for enterprise-scale applications.
 */

import { LRUCache } from 'lru-cache';
import os from 'os';

// ============================================================================
// Performance Monitoring
// ============================================================================

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  slowRequests: number;
  cacheHitRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
  requestsPerSecond: number;
}

class PerformanceMonitor {
  private requestTimes: number[] = [];
  private requestCount = 0;
  private slowRequestCount = 0;
  private readonly slowRequestThreshold = 1000; // ms
  private readonly metricsWindow = 60000; // 1 minute
  private cacheHits = 0;
  private cacheMisses = 0;
  private activeConnections = 0;

  recordRequest(duration: number): void {
    this.requestCount++;
    this.requestTimes.push(Date.now());

    if (duration > this.slowRequestThreshold) {
      this.slowRequestCount++;
    }

    // Clean old request times (outside the window)
    const cutoff = Date.now() - this.metricsWindow;
    this.requestTimes = this.requestTimes.filter(time => time > cutoff);
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  incrementConnections(): void {
    this.activeConnections++;
  }

  decrementConnections(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  getMetrics(): PerformanceMetrics {
    const totalCacheAccess = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheAccess > 0 ? (this.cacheHits / totalCacheAccess) * 100 : 0;
    const requestsPerSecond = this.requestTimes.length / (this.metricsWindow / 1000);

    return {
      requestCount: this.requestCount,
      averageResponseTime: this.requestCount > 0 ? this.requestCount / this.requestTimes.length : 0,
      slowRequests: this.slowRequestCount,
      cacheHitRate,
      memoryUsage: process.memoryUsage(),
      activeConnections: this.activeConnections,
      requestsPerSecond
    };
  }

  reset(): void {
    this.requestTimes = [];
    this.requestCount = 0;
    this.slowRequestCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// Multi-Layer Caching System
// ============================================================================

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  max?: number; // Maximum number of items
  staleWhileRevalidate?: boolean; // Return stale data while refreshing
}

class MultiLayerCache {
  private l1Cache: LRUCache<string, any>; // Hot data (fast access)
  private l2Cache: LRUCache<string, any>; // Warm data (larger, slower)
  private readonly defaultL1Max = 100;
  private readonly defaultL2Max = 1000;
  private readonly defaultTTL = 300000; // 5 minutes

  constructor() {
    this.l1Cache = new LRUCache({
      max: this.defaultL1Max,
      ttl: 60000, // 1 minute for L1
      updateAgeOnGet: true
    });

    this.l2Cache = new LRUCache({
      max: this.defaultL2Max,
      ttl: this.defaultTTL,
      updateAgeOnGet: true
    });
  }

  get(key: string): any | undefined {
    // Try L1 cache first
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      performanceMonitor.recordCacheHit();
      return value;
    }

    // Try L2 cache
    value = this.l2Cache.get(key);
    if (value !== undefined) {
      // Promote to L1
      this.l1Cache.set(key, value);
      performanceMonitor.recordCacheHit();
      return value;
    }

    performanceMonitor.recordCacheMiss();
    return undefined;
  }

  set(key: string, value: any, options?: CacheOptions): void {
    const ttl = options?.ttl || this.defaultTTL;

    // Store in both caches
    this.l1Cache.set(key, value, { ttl: Math.min(ttl, 60000) });
    this.l2Cache.set(key, value, { ttl });
  }

  delete(key: string): void {
    this.l1Cache.delete(key);
    this.l2Cache.delete(key);
  }

  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  getStats() {
    return {
      l1Size: this.l1Cache.size,
      l2Size: this.l2Cache.size,
      l1Max: this.l1Cache.max,
      l2Max: this.l2Cache.max
    };
  }
}

export const cache = new MultiLayerCache();

// ============================================================================
// Query Optimization
// ============================================================================

export class QueryOptimizer {
  private queryCache: Map<string, any> = new Map();
  private readonly cacheTimeout = 30000; // 30 seconds

  /**
   * Batch multiple queries together to reduce round trips
   */
  async batchQueries<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(queries.map(q => q()));
  }

  /**
   * Memoize query results with automatic invalidation
   */
  memoize<T>(key: string, queryFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = cache.get(key);
    if (cached !== undefined) {
      return Promise.resolve(cached);
    }

    return queryFn().then(result => {
      cache.set(key, result, { ttl: ttl || this.cacheTimeout });
      return result;
    });
  }

  /**
   * Paginate results for large datasets
   */
  paginate<T>(data: T[], page: number, pageSize: number): {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      page,
      pageSize,
      total: data.length,
      totalPages: Math.ceil(data.length / pageSize)
    };
  }

  /**
   * Debounce function for rate limiting
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for rate limiting
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

export const queryOptimizer = new QueryOptimizer();

// ============================================================================
// Database Connection Pooling
// ============================================================================

export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  idleTimeout: number;
  acquireTimeout: number;
}

export class ConnectionPool {
  private availableConnections: any[] = [];
  private activeConnections: Set<any> = new Set();
  private config: ConnectionPoolConfig;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      minConnections: config.minConnections || 2,
      maxConnections: config.maxConnections || 10,
      idleTimeout: config.idleTimeout || 30000,
      acquireTimeout: config.acquireTimeout || 5000
    };
  }

  async acquire(): Promise<any> {
    // Return available connection if exists
    if (this.availableConnections.length > 0) {
      const conn = this.availableConnections.pop();
      this.activeConnections.add(conn);
      return conn;
    }

    // Create new connection if under max
    if (this.activeConnections.size < this.config.maxConnections) {
      const conn = await this.createConnection();
      this.activeConnections.add(conn);
      return conn;
    }

    // Wait for available connection
    return this.waitForConnection();
  }

  release(connection: any): void {
    this.activeConnections.delete(connection);
    this.availableConnections.push(connection);
  }

  private async createConnection(): Promise<any> {
    // Placeholder for actual connection creation
    return {};
  }

  private async waitForConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeout);

      const checkInterval = setInterval(() => {
        if (this.availableConnections.length > 0) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve(this.acquire());
        }
      }, 100);
    });
  }

  getStats() {
    return {
      available: this.availableConnections.length,
      active: this.activeConnections.size,
      total: this.availableConnections.length + this.activeConnections.size,
      maxConnections: this.config.maxConnections
    };
  }
}

// ============================================================================
// Request Optimization Middleware
// ============================================================================

export function performanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();

    // Track active connections
    performanceMonitor.incrementConnections();

    // Override res.json to measure response time
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordRequest(duration);
      performanceMonitor.decrementConnections();

      // Add performance headers
      res.setHeader('X-Response-Time', `${duration}ms`);
      res.setHeader('X-Cache-Status', cache.get(req.originalUrl) ? 'HIT' : 'MISS');

      return originalJson(data);
    };

    next();
  };
}

// ============================================================================
// Data Preloading and Prefetching
// ============================================================================

export class DataPreloader {
  private preloadQueue: Map<string, Promise<any>> = new Map();

  /**
   * Preload data in the background
   */
  preload<T>(key: string, dataFn: () => Promise<T>): void {
    if (!this.preloadQueue.has(key)) {
      const promise = dataFn().then(data => {
        cache.set(key, data);
        this.preloadQueue.delete(key);
        return data;
      }).catch(error => {
        console.error(`Preload failed for ${key}:`, error);
        this.preloadQueue.delete(key);
      });

      this.preloadQueue.set(key, promise);
    }
  }

  /**
   * Get preloaded data or trigger load
   */
  async get<T>(key: string, dataFn: () => Promise<T>): Promise<T> {
    // Check cache first
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if already loading
    const loading = this.preloadQueue.get(key);
    if (loading) {
      return loading;
    }

    // Trigger new load
    return dataFn();
  }

  getStats() {
    return {
      queueSize: this.preloadQueue.size,
      queueKeys: Array.from(this.preloadQueue.keys())
    };
  }
}

export const dataPreloader = new DataPreloader();

// ============================================================================
// Memory Management
// ============================================================================

export class MemoryManager {
  private readonly maxMemoryUsage = 0.85; // 85% of available memory

  checkMemoryUsage(): { usage: number; isHigh: boolean; shouldGC: boolean } {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usagePercent = memUsage.heapUsed / totalMemory;

    return {
      usage: usagePercent,
      isHigh: usagePercent > 0.7,
      shouldGC: usagePercent > this.maxMemoryUsage
    };
  }

  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
}
  }

  async cleanup(): Promise<void> {
    const memCheck = this.checkMemoryUsage();

    if (memCheck.shouldGC) {
// Clear old cache entries
      cache.clear();

      // Force garbage collection if available
      this.forceGarbageCollection();
    }
  }

  startMonitoring(interval: number = 300000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanup();
    }, interval);
  }
}

export const memoryManager = new MemoryManager();

// ============================================================================
// Export Performance Stats Endpoint
// ============================================================================

export function getPerformanceStats() {
  return {
    performance: performanceMonitor.getMetrics(),
    cache: cache.getStats(),
    memory: memoryManager.checkMemoryUsage(),
    dataPreloader: dataPreloader.getStats(),
    timestamp: new Date().toISOString()
  };
}
