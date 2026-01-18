/**
 * Advanced Real-time Algorithms for FabZClean
 * Implements message batching, deduplication, and efficient WebSocket management
 */

export interface WebSocketMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target?: string | string[];
  retryCount?: number;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  priorityThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeduplicationConfig {
  enabled: boolean;
  windowSize: number; // in milliseconds
  maxEntries: number;
}

/**
 * Message Batching Algorithm
 * Optimizes WebSocket performance by batching multiple messages
 */
export class MessageBatcher {
  private batches: Map<string, WebSocketMessage[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private config: BatchConfig;
  private onBatchReady: (target: string, messages: WebSocketMessage[]) => void;

  constructor(config: BatchConfig, onBatchReady: (target: string, messages: WebSocketMessage[]) => void) {
    this.config = config;
    this.onBatchReady = onBatchReady;
  }

  addMessage(message: WebSocketMessage, target: string): void {
    // Handle critical messages immediately
    if (message.priority === 'critical') {
      this.onBatchReady(target, [message]);
      return;
    }

    // Add to batch
    if (!this.batches.has(target)) {
      this.batches.set(target, []);
    }

    const batch = this.batches.get(target)!;
    batch.push(message);

    // Check if batch is ready
    if (batch.length >= this.config.maxBatchSize) {
      this.flushBatch(target);
      return;
    }

    // Set timer for batch timeout
    if (!this.timers.has(target)) {
      const timer = setTimeout(() => {
        this.flushBatch(target);
      }, this.config.maxWaitTime);
      
      this.timers.set(target, timer);
    }
  }

  private flushBatch(target: string): void {
    const batch = this.batches.get(target);
    if (!batch || batch.length === 0) return;

    // Sort by priority and timestamp
    batch.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    // Send batch
    this.onBatchReady(target, [...batch]);

    // Cleanup
    this.batches.delete(target);
    const timer = this.timers.get(target);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(target);
    }
  }

  flushAll(): void {
    for (const target of this.batches.keys()) {
      this.flushBatch(target);
    }
  }

  getBatchSize(target: string): number {
    return this.batches.get(target)?.length || 0;
  }

  getTotalBatches(): number {
    return this.batches.size;
  }
}

/**
 * Message Deduplication Algorithm
 * Prevents duplicate messages using sliding window technique
 */
export class MessageDeduplicator {
  private messageWindow: Map<string, number> = new Map();
  private config: DeduplicationConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: DeduplicationConfig) {
    this.config = config;
    
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  isDuplicate(message: WebSocketMessage): boolean {
    if (!this.config.enabled) return false;

    const messageKey = this.generateKey(message);
    const now = Date.now();
    
    // Check if message exists in window
    if (this.messageWindow.has(messageKey)) {
      const lastSeen = this.messageWindow.get(messageKey)!;
      
      // If within window, it's a duplicate
      if (now - lastSeen < this.config.windowSize) {
        return true;
      }
    }

    // Add to window
    this.messageWindow.set(messageKey, now);
    
    // Limit window size
    if (this.messageWindow.size > this.config.maxEntries) {
      this.evictOldest();
    }

    return false;
  }

  private generateKey(message: WebSocketMessage): string {
    // Create a key based on message content and type
    const content = JSON.stringify({
      type: message.type,
      data: message.data,
      target: message.target
    });
    
    return this.hashString(content);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, timestamp] of this.messageWindow.entries()) {
      if (now - timestamp > this.config.windowSize) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.messageWindow.delete(key));
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, timestamp] of this.messageWindow.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.messageWindow.delete(oldestKey);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.messageWindow.clear();
  }
}

/**
 * Connection Pool Management
 * Efficiently manages WebSocket connections with load balancing
 */
export class ConnectionPool {
  private connections: Map<string, any> = new Map();
  private connectionStats: Map<string, ConnectionStats> = new Map();
  private maxConnectionsPerClient: number;
  private connectionTimeout: number;

  constructor(maxConnectionsPerClient: number = 5, connectionTimeout: number = 300000) {
    this.maxConnectionsPerClient = maxConnectionsPerClient;
    this.connectionTimeout = connectionTimeout;
  }

  addConnection(connectionId: string, clientId: string, connection: any): boolean {
    const clientConnections = this.getClientConnections(clientId);
    
    // Check connection limit
    if (clientConnections.length >= this.maxConnectionsPerClient) {
      this.evictOldestConnection(clientId);
    }

    this.connections.set(connectionId, {
      connection,
      clientId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0
    });

    this.updateStats(clientId, 'connect');
    return true;
  }

  removeConnection(connectionId: string): boolean {
    const connectionInfo = this.connections.get(connectionId);
    if (!connectionInfo) return false;

    this.connections.delete(connectionId);
    this.updateStats(connectionInfo.clientId, 'disconnect');
    return true;
  }

  getConnection(connectionId: string): any | null {
    const connectionInfo = this.connections.get(connectionId);
    if (!connectionInfo) return null;

    // Update activity
    connectionInfo.lastActivity = Date.now();
    return connectionInfo.connection;
  }

  getClientConnections(clientId: string): string[] {
    const connections: string[] = [];
    
    for (const [connectionId, info] of this.connections.entries()) {
      if (info.clientId === clientId) {
        connections.push(connectionId);
      }
    }
    
    return connections;
  }

  broadcastToClient(clientId: string, message: WebSocketMessage): number {
    const connections = this.getClientConnections(clientId);
    let sentCount = 0;

    for (const connectionId of connections) {
      const connection = this.getConnection(connectionId);
      if (connection && connection.readyState === 1) { // WebSocket.OPEN
        try {
          connection.send(JSON.stringify(message));
          sentCount++;
          
          // Update message count
          const connectionInfo = this.connections.get(connectionId);
          if (connectionInfo) {
            connectionInfo.messageCount++;
          }
        } catch (error) {
          console.error('Failed to send message:', error);
          this.removeConnection(connectionId);
        }
      }
    }

    return sentCount;
  }

  broadcastToAll(message: WebSocketMessage): number {
    let sentCount = 0;
    
    for (const [connectionId, connectionInfo] of this.connections.entries()) {
      if (connectionInfo.connection.readyState === 1) {
        try {
          connectionInfo.connection.send(JSON.stringify(message));
          sentCount++;
          connectionInfo.messageCount++;
        } catch (error) {
          console.error('Failed to broadcast message:', error);
          this.removeConnection(connectionId);
        }
      }
    }

    return sentCount;
  }

  private evictOldestConnection(clientId: string): void {
    const connections = this.getClientConnections(clientId);
    let oldestConnectionId = '';
    let oldestTime = Infinity;

    for (const connectionId of connections) {
      const connectionInfo = this.connections.get(connectionId);
      if (connectionInfo && connectionInfo.createdAt < oldestTime) {
        oldestTime = connectionInfo.createdAt;
        oldestConnectionId = connectionId;
      }
    }

    if (oldestConnectionId) {
      this.removeConnection(oldestConnectionId);
    }
  }

  private updateStats(clientId: string, action: 'connect' | 'disconnect'): void {
    if (!this.connectionStats.has(clientId)) {
      this.connectionStats.set(clientId, {
        totalConnections: 0,
        activeConnections: 0,
        totalMessages: 0,
        lastActivity: Date.now()
      });
    }

    const stats = this.connectionStats.get(clientId)!;
    
    if (action === 'connect') {
      stats.totalConnections++;
      stats.activeConnections++;
    } else {
      stats.activeConnections = Math.max(0, stats.activeConnections - 1);
    }
    
    stats.lastActivity = Date.now();
  }

  cleanup(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [connectionId, connectionInfo] of this.connections.entries()) {
      if (now - connectionInfo.lastActivity > this.connectionTimeout) {
        toRemove.push(connectionId);
      }
    }

    toRemove.forEach(connectionId => this.removeConnection(connectionId));
  }

  getStats(): {
    totalConnections: number;
    activeConnections: number;
    clients: number;
  } {
    return {
      totalConnections: this.connections.size,
      activeConnections: Array.from(this.connections.values())
        .filter(info => info.connection.readyState === 1).length,
      clients: this.connectionStats.size
    };
  }
}

interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  lastActivity: number;
}

/**
 * Real-time Event Scheduler
 * Manages time-based events and notifications
 */
export class EventScheduler {
  private events: Map<string, ScheduledEvent> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  scheduleEvent(
    id: string,
    event: ScheduledEvent,
    callback: (event: ScheduledEvent) => void
  ): void {
    // Cancel existing event if any
    this.cancelEvent(id);

    const now = Date.now();
    const delay = event.scheduledTime - now;

    if (delay <= 0) {
      // Execute immediately
      callback(event);
      return;
    }

    const timer = setTimeout(() => {
      callback(event);
      this.events.delete(id);
      this.timers.delete(id);
    }, delay);

    this.events.set(id, event);
    this.timers.set(id, timer);
  }

  cancelEvent(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
      this.events.delete(id);
      return true;
    }
    return false;
  }

  getScheduledEvents(): ScheduledEvent[] {
    return Array.from(this.events.values());
  }

  cleanup(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.events.clear();
  }
}

interface ScheduledEvent {
  id: string;
  type: string;
  scheduledTime: number;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Real-time Analytics Engine
 * Tracks and analyzes real-time metrics
 */
export class RealTimeAnalytics {
  private metrics: Map<string, MetricTracker> = new Map();
  private aggregationInterval: NodeJS.Timeout;

  constructor() {
    // Aggregate metrics every 30 seconds
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
    }, 30000);
  }

  recordMetric(name: string, value: number, tags?: { [key: string]: string }): void {
    const key = this.getMetricKey(name, tags);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, new MetricTracker());
    }

    this.metrics.get(key)!.record(value);
  }

  getMetric(name: string, tags?: { [key: string]: string }): MetricData | null {
    const key = this.getMetricKey(name, tags);
    const tracker = this.metrics.get(key);
    
    if (!tracker) return null;

    return tracker.getData();
  }

  getAllMetrics(): { [name: string]: MetricData } {
    const result: { [name: string]: MetricData } = {};
    
    for (const [key, tracker] of this.metrics.entries()) {
      result[key] = tracker.getData();
    }
    
    return result;
  }

  private getMetricKey(name: string, tags?: { [key: string]: string }): string {
    if (!tags) return name;
    
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    
    return `${name}[${tagString}]`;
  }

  private aggregateMetrics(): void {
    // Clean up old data
    for (const tracker of this.metrics.values()) {
      tracker.cleanup();
    }
  }

  destroy(): void {
    clearInterval(this.aggregationInterval);
    this.metrics.clear();
  }
}

class MetricTracker {
  private values: number[] = [];
  private timestamps: number[] = [];
  private maxAge: number = 300000; // 5 minutes

  record(value: number): void {
    const now = Date.now();
    this.values.push(value);
    this.timestamps.push(now);
    
    // Keep only recent values
    this.cleanup();
  }

  getData(): MetricData {
    if (this.values.length === 0) {
      return {
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0
      };
    }

    const sorted = [...this.values].sort((a, b) => a - b);
    
    return {
      count: this.values.length,
      sum: this.values.reduce((sum, val) => sum + val, 0),
      average: this.values.reduce((sum, val) => sum + val, 0) / this.values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99)
    };
  }

  cleanup(): void {
    const now = Date.now();
    const validIndices: number[] = [];
    
    for (let i = 0; i < this.timestamps.length; i++) {
      if (now - this.timestamps[i] <= this.maxAge) {
        validIndices.push(i);
      }
    }
    
    this.values = validIndices.map(i => this.values[i]);
    this.timestamps = validIndices.map(i => this.timestamps[i]);
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

interface MetricData {
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

/**
 * FabZClean Real-time Manager
 * Main class that orchestrates all real-time algorithms
 */
export class FabZCleanRealTimeManager {
  private messageBatcher: MessageBatcher;
  private deduplicator: MessageDeduplicator;
  private connectionPool: ConnectionPool;
  private eventScheduler: EventScheduler;
  private analytics: RealTimeAnalytics;

  constructor() {
    // Initialize components
    this.connectionPool = new ConnectionPool();
    this.deduplicator = new MessageDeduplicator({
      enabled: true,
      windowSize: 5000, // 5 seconds
      maxEntries: 10000
    });
    
    this.messageBatcher = new MessageBatcher({
      maxBatchSize: 10,
      maxWaitTime: 100, // 100ms
      priorityThreshold: 'high'
    }, this.sendBatch.bind(this));

    this.eventScheduler = new EventScheduler();
    this.analytics = new RealTimeAnalytics();

    // Start cleanup intervals
    setInterval(() => {
      this.connectionPool.cleanup();
    }, 60000); // Every minute
  }

  addConnection(connectionId: string, clientId: string, connection: any): void {
    this.connectionPool.addConnection(connectionId, clientId, connection);
    this.analytics.recordMetric('connections.active', 1, { client: clientId });
  }

  removeConnection(connectionId: string): void {
    this.connectionPool.removeConnection(connectionId);
    this.analytics.recordMetric('connections.active', -1);
  }

  sendMessage(message: WebSocketMessage, target?: string): void {
    // Check for duplicates
    if (this.deduplicator.isDuplicate(message)) {
      this.analytics.recordMetric('messages.duplicate', 1);
      return;
    }

    // Add to batch
    const targetClient = target || 'broadcast';
    this.messageBatcher.addMessage(message, targetClient);
    
    this.analytics.recordMetric('messages.sent', 1, { type: message.type });
  }

  private sendBatch(target: string, messages: WebSocketMessage[]): void {
    if (target === 'broadcast') {
      messages.forEach(message => {
        const sentCount = this.connectionPool.broadcastToAll(message);
        this.analytics.recordMetric('messages.delivered', sentCount);
      });
    } else {
      messages.forEach(message => {
        const sentCount = this.connectionPool.broadcastToClient(target, message);
        this.analytics.recordMetric('messages.delivered', sentCount, { client: target });
      });
    }
  }

  scheduleNotification(
    id: string,
    scheduledTime: number,
    data: any,
    target?: string
  ): void {
    const event: ScheduledEvent = {
      id,
      type: 'notification',
      scheduledTime,
      data,
      priority: 'medium'
    };

    this.eventScheduler.scheduleEvent(id, event, (event) => {
      const message: WebSocketMessage = {
        id: `notification-${Date.now()}`,
        type: 'notification',
        data: event.data,
        timestamp: Date.now(),
        priority: 'medium',
        target: target ? [target] : undefined
      };

      this.sendMessage(message, target);
    });
  }

  getAnalytics(): { [name: string]: MetricData } {
    return this.analytics.getAllMetrics();
  }

  getConnectionStats(): { totalConnections: number; activeConnections: number; clients: number } {
    return this.connectionPool.getStats();
  }

  destroy(): void {
    this.deduplicator.destroy();
    this.eventScheduler.cleanup();
    this.analytics.destroy();
  }
}

// Global real-time manager instance
export const realTimeManager = new FabZCleanRealTimeManager();
