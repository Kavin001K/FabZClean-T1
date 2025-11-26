import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import { Express } from 'express';
import { storage } from './storage';

interface ClientSubscription {
  ws: WebSocket;
  subscriptions: string[];
  lastSeen: number;
  portalType?: 'admin' | 'employee' | 'customer' | 'worker';
  userId?: string;
}

interface BatchedMessage {
  type: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  id: string;
}

interface MessageBatch {
  messages: BatchedMessage[];
  batchId: string;
  timestamp: string;
}

class RealtimeServer {
  private wss: WebSocketServer;
  private clients: Map<string, ClientSubscription> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private server: Server | null = null;

  // Message batching and deduplication
  private messageQueue: BatchedMessage[] = [];
  private batchInterval: NodeJS.Timeout | null = null;
  private messageIds: Set<string> = new Set();
  private connectionPool: Map<string, WebSocket[]> = new Map();

  // Performance metrics
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesBatched: 0,
    duplicateMessages: 0
  };

  constructor(port: number = 3003) {
    // Initialize without server - will be set up when createServer is called
    // or when standalone mode is used
  }

  private generateClientId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private handleMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastSeen = Date.now();

    switch (data.type) {
      case 'subscribe':
        client.subscriptions = data.topics || [];
        client.portalType = data.portalType;
        client.userId = data.userId;
        this.sendToClient(clientId, {
          type: 'subscribed',
          topics: client.subscriptions,
          portalType: client.portalType
        });
        break;

      case 'unsubscribe':
        client.subscriptions = [];
        this.sendToClient(clientId, {
          type: 'unsubscribed'
        });
        break;

      case 'ping':
        this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      case 'location_update':
        // Handle location updates from workers
        if (client.portalType === 'worker' && data.latitude && data.longitude) {
          this.broadcastToSubscribers('worker_location_update', {
            workerId: client.userId,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'status_update':
        // Handle status updates from workers
        if (client.portalType === 'worker' && data.status) {
          this.broadcastToSubscribers('worker_status_update', {
            workerId: client.userId,
            status: data.status,
            timestamp: new Date().toISOString()
          });
        }
        break;
    }
  }

  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
      this.metrics.messagesSent++;
    }
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToBatch(type: string, data: any, priority: 'low' | 'medium' | 'high' = 'medium'): string {
    const messageId = this.generateMessageId();

    // Check for duplicates
    if (this.messageIds.has(messageId)) {
      this.metrics.duplicateMessages++;
      return messageId;
    }

    const message: BatchedMessage = {
      type,
      data,
      timestamp: new Date().toISOString(),
      priority,
      id: messageId
    };

    this.messageQueue.push(message);
    this.messageIds.add(messageId);
    this.metrics.messagesBatched++;

    return messageId;
  }

  private processBatch(): void {
    if (this.messageQueue.length === 0) return;

    // Sort messages by priority (high first)
    const sortedMessages = this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const batch: MessageBatch = {
      messages: sortedMessages,
      batchId: this.generateMessageId(),
      timestamp: new Date().toISOString()
    };

    // Broadcast batch to all subscribers
    this.broadcastBatch(batch);

    // Clear queue and message IDs
    this.messageQueue = [];
    this.messageIds.clear();
  }

  private broadcastBatch(batch: MessageBatch): void {
    const message = JSON.stringify(batch);

    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        // Filter messages relevant to this client's subscriptions
        const relevantMessages = batch.messages.filter(msg =>
          client.subscriptions.includes(msg.type) ||
          client.subscriptions.includes('all')
        );

        if (relevantMessages.length > 0) {
          const clientBatch = {
            ...batch,
            messages: relevantMessages
          };

          client.ws.send(JSON.stringify(clientBatch));
        }
      }
    });
  }

  private broadcastToSubscribers(type: string, data: any, priority: 'low' | 'medium' | 'high' = 'medium') {
    // Add to batch instead of immediate broadcast
    this.addToBatch(type, data, priority);
  }

  private broadcastToPortal(portalType: 'admin' | 'employee' | 'customer' | 'worker', type: string, data: any) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });

    this.clients.forEach((client, clientId) => {
      if (client.portalType === portalType &&
        client.subscriptions.includes(type) &&
        client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  private broadcastToUser(userId: string, type: string, data: any) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });

    this.clients.forEach((client, clientId) => {
      if (client.userId === userId &&
        client.subscriptions.includes(type) &&
        client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  private async startBroadcasting() {
    // Broadcast analytics updates every 5 seconds
    this.updateInterval = setInterval(async () => {
      try {
        await this.broadcastAnalyticsUpdate();
      } catch (error) {
        console.error('Error broadcasting analytics update:', error);
      }
    }, 5000);
  }

  private async broadcastAnalyticsUpdate() {
    try {
      const orders = await storage.getOrders();
      const customers = await storage.getCustomers();

      // Calculate real-time KPIs
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0);
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      const completionRate = orders.length > 0 ? (orders.filter(o => o.status === 'completed').length / orders.length) * 100 : 0;
      const customerRetention = customers.length > 0 ? customers.filter(c => (c.totalOrders || 0) > 1).length / customers.length * 100 : 0;

      // Recent activity (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentOrders = orders.filter(order => new Date(order.createdAt || new Date()) > fiveMinutesAgo);
      const recentCustomers = customers.filter(customer => new Date(customer.createdAt || new Date()) > fiveMinutesAgo);

      // Admin Portal Analytics
      const adminAnalytics = {
        kpis: {
          totalRevenue,
          avgOrderValue,
          completionRate,
          customerRetention,
          totalOrders: orders.length,
          totalCustomers: customers.length
        },
        recentActivity: {
          newOrders: recentOrders.length,
          newCustomers: recentCustomers.length,
          orders: recentOrders.map(order => ({
            id: order.id,
            customerName: order.customerName,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
          })),
          customers: recentCustomers.map(customer => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            createdAt: customer.createdAt
          }))
        }
      };

      // Employee Portal Analytics
      const employeeAnalytics = {
        orders: {
          pending: orders.filter(o => o.status === 'pending').length,
          processing: orders.filter(o => o.status === 'processing').length,
          completed: orders.filter(o => o.status === 'completed').length,
          total: orders.length
        },
        recentActivity: recentOrders.map(order => ({
          id: order.id,
          customerName: order.customerName,
          status: order.status,
          createdAt: order.createdAt
        }))
      };

      // Customer Portal Analytics
      const customerAnalytics = {
        metrics: {
          totalOrders: orders.length,
          totalCustomers: customers.length,
          avgOrderValue,
          completionRate
        }
      };

      // Worker Portal Analytics
      const workerAnalytics = {
        deliveries: {
          assigned: orders.filter(o => o.status === 'assigned').length,
          inTransit: orders.filter(o => o.status === 'in_transit').length,
          completed: orders.filter(o => o.status === 'completed').length
        },
        performance: {
          totalDeliveries: orders.length,
          completionRate,
          avgDeliveryTime: 45 // Mock value
        }
      };

      // Broadcast portal-specific analytics
      this.broadcastToPortal('admin', 'analytics_update', adminAnalytics);
      this.broadcastToPortal('employee', 'analytics_update', employeeAnalytics);
      this.broadcastToPortal('customer', 'analytics_update', customerAnalytics);
      this.broadcastToPortal('worker', 'analytics_update', workerAnalytics);

      // Broadcast general analytics for cross-portal updates
      this.broadcastToSubscribers('analytics_update', adminAnalytics, 'low');
    } catch (error) {
      console.error('Error calculating analytics update:', error);
    }
  }

  // Method to manually trigger updates (called when orders/customers are modified)
  public async triggerUpdate(type: 'order' | 'customer' | 'delivery' | 'driver', action: 'created' | 'updated' | 'deleted', data: any) {
    this.broadcastToSubscribers(`${type}_${action}`, {
      type,
      action,
      data,
      timestamp: new Date().toISOString()
    }, 'high');

    // Also trigger analytics update
    await this.broadcastAnalyticsUpdate();
  }

  // Method to broadcast custom messages
  public broadcast(message: { type: string; data: any }, priority: 'low' | 'medium' | 'high' = 'medium') {
    this.broadcastToSubscribers(message.type, message.data, priority);
  }

  // Method to broadcast to specific portal
  public broadcastToPortalPublic(portalType: 'admin' | 'employee' | 'customer' | 'worker', message: { type: string; data: any }) {
    this.broadcastToPortal(portalType, message.type, message.data);
  }

  // Method to broadcast to specific user
  public broadcastToUserPublic(userId: string, message: { type: string; data: any }) {
    this.broadcastToUser(userId, message.type, message.data);
  }

  // Method to get connection metrics
  public getMetrics() {
    return {
      ...this.metrics,
      activeConnections: this.clients.size,
      portalConnections: {
        admin: Array.from(this.clients.values()).filter(c => c.portalType === 'admin').length,
        employee: Array.from(this.clients.values()).filter(c => c.portalType === 'employee').length,
        customer: Array.from(this.clients.values()).filter(c => c.portalType === 'customer').length,
        worker: Array.from(this.clients.values()).filter(c => c.portalType === 'worker').length
      }
    };
  }

  // Method to force batch processing
  public processBatchNow() {
    this.processBatch();
  }

  // Method to create server with Express app
  public createServer(app: Express): Server {
    const server = createServer(app);
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.server = server;

    this.setupWebSocketHandlers();
    this.startPeriodicUpdates();

    return server;
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      console.log(`Client ${clientId} connected`);

      this.clients.set(clientId, {
        ws,
        subscriptions: [],
        lastSeen: Date.now()
      });

      this.metrics.totalConnections++;
      this.metrics.activeConnections = this.clients.size;

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Invalid message format:', error);
        }
      });

      ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        this.clients.delete(clientId);
        this.metrics.activeConnections = this.clients.size;
      });

      ws.on('error', (error) => {
        console.error(`Client ${clientId} error:`, error);
        this.clients.delete(clientId);
        this.metrics.activeConnections = this.clients.size;
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        message: 'Connected to real-time analytics',
        timestamp: new Date().toISOString(),
        clientId
      });
    });
  }

  private startPeriodicUpdates() {
    // Start periodic updates every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.broadcastAnalyticsUpdate();
    }, 30000);

    // Start batch processing every 2 seconds
    this.batchInterval = setInterval(() => {
      this.processBatch();
    }, 2000);

    // Clean up old connections every 5 minutes
    setInterval(() => {
      this.cleanupOldConnections();
    }, 5 * 60 * 1000);
  }

  private cleanupOldConnections() {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    this.clients.forEach((client, clientId) => {
      if (client.lastSeen < fiveMinutesAgo && client.ws.readyState !== WebSocket.OPEN) {
        console.log(`Cleaning up old connection: ${clientId}`);
        this.clients.delete(clientId);
      }
    });

    this.metrics.activeConnections = this.clients.size;
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    this.wss.close();
    if (this.server) {
      this.server.close();
    }
  }
}

// Export singleton instance with WebSocket port
const wsPort = parseInt(process.env.WS_PORT || '3003', 10);
export const realtimeServer = new RealtimeServer(wsPort);
