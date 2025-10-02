"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeServer = void 0;
const ws_1 = require("ws");
const http_1 = require("http");
const storage_1 = require("./storage");
class RealtimeServer {
    constructor(port = 3003) {
        this.clients = new Map();
        this.updateInterval = null;
        const server = (0, http_1.createServer)();
        this.wss = new ws_1.WebSocketServer({ server });
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            console.log(`Client ${clientId} connected`);
            this.clients.set(clientId, {
                ws,
                subscriptions: []
            });
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleMessage(clientId, data);
                }
                catch (error) {
                    console.error('Invalid message format:', error);
                }
            });
            ws.on('close', () => {
                console.log(`Client ${clientId} disconnected`);
                this.clients.delete(clientId);
            });
            ws.on('error', (error) => {
                console.error(`Client ${clientId} error:`, error);
                this.clients.delete(clientId);
            });
            // Send welcome message
            this.sendToClient(clientId, {
                type: 'connection',
                message: 'Connected to real-time analytics',
                clientId
            });
        });
        server.listen(port, () => {
            console.log(`WebSocket server running on port ${port}`);
        });
        // Start broadcasting updates
        this.startBroadcasting();
    }
    generateClientId() {
        return Math.random().toString(36).substr(2, 9);
    }
    handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        switch (data.type) {
            case 'subscribe':
                client.subscriptions = data.topics || [];
                this.sendToClient(clientId, {
                    type: 'subscribed',
                    topics: client.subscriptions
                });
                break;
            case 'unsubscribe':
                client.subscriptions = [];
                this.sendToClient(clientId, {
                    type: 'unsubscribed'
                });
                break;
            case 'ping':
                this.sendToClient(clientId, { type: 'pong' });
                break;
        }
    }
    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === ws_1.WebSocket.OPEN) {
            client.ws.send(JSON.stringify(data));
        }
    }
    broadcastToSubscribers(type, data) {
        const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
        this.clients.forEach((client, clientId) => {
            if (client.subscriptions.includes(type) && client.ws.readyState === ws_1.WebSocket.OPEN) {
                client.ws.send(message);
            }
        });
    }
    async startBroadcasting() {
        // Broadcast analytics updates every 5 seconds
        this.updateInterval = setInterval(async () => {
            try {
                await this.broadcastAnalyticsUpdate();
            }
            catch (error) {
                console.error('Error broadcasting analytics update:', error);
            }
        }, 5000);
    }
    async broadcastAnalyticsUpdate() {
        try {
            const orders = await storage_1.storage.getOrders();
            const customers = await storage_1.storage.getCustomers();
            // Calculate real-time KPIs
            const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
            const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
            const completionRate = orders.length > 0 ? (orders.filter(o => o.status === 'completed').length / orders.length) * 100 : 0;
            const customerRetention = customers.length > 0 ? customers.filter(c => (c.totalOrders || 0) > 1).length / customers.length * 100 : 0;
            // Recent activity (last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentOrders = orders.filter(order => new Date(order.createdAt || new Date()) > fiveMinutesAgo);
            const recentCustomers = customers.filter(customer => new Date(customer.createdAt || new Date()) > fiveMinutesAgo);
            const analyticsUpdate = {
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
            this.broadcastToSubscribers('analytics_update', analyticsUpdate);
        }
        catch (error) {
            console.error('Error calculating analytics update:', error);
        }
    }
    // Method to manually trigger updates (called when orders/customers are modified)
    async triggerUpdate(type, action, data) {
        this.broadcastToSubscribers(`${type}_${action}`, {
            type,
            action,
            data,
            timestamp: new Date().toISOString()
        });
        // Also trigger analytics update
        await this.broadcastAnalyticsUpdate();
    }
    // Method to broadcast custom messages
    broadcast(message) {
        this.broadcastToSubscribers(message.type, message.data);
    }
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.wss.close();
    }
}
// Export singleton instance with WebSocket port
const wsPort = parseInt(process.env.WS_PORT || '3003', 10);
exports.realtimeServer = new RealtimeServer(wsPort);
