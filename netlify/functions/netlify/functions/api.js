"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const routes_1 = require("../../server/routes");
const express_1 = __importDefault(require("express"));
// Create Express app
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Register all API routes
let server;
(0, routes_1.registerRoutes)(app).then((httpServer) => {
    server = httpServer;
});
const handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
    };
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight' }),
        };
    }
    try {
        // Create a mock request/response for Express
        const req = {
            method: event.httpMethod,
            url: event.path,
            headers: event.headers,
            body: event.body ? JSON.parse(event.body) : {},
            query: event.queryStringParameters || {},
            params: {},
        };
        let responseBody = '';
        let statusCode = 200;
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseBody = JSON.stringify(data);
                return res;
            },
            send: (data) => {
                responseBody = typeof data === 'string' ? data : JSON.stringify(data);
                return res;
            },
            set: (key, value) => {
                // Handle headers if needed
                return res;
            },
            end: (data) => {
                if (data) {
                    responseBody = typeof data === 'string' ? data : JSON.stringify(data);
                }
                return res;
            },
        };
        // Route the request to the appropriate handler
        const path = event.path.replace('/api', '');
        // Handle different API endpoints
        if (path === '/health/database') {
            const { getDatabaseHealth } = await Promise.resolve().then(() => __importStar(require('../../server/db-utils')));
            const health = await getDatabaseHealth();
            res.json(health);
        }
        else if (path === '/database/info') {
            const { getDatabaseInfo } = await Promise.resolve().then(() => __importStar(require('../../server/db-utils')));
            const info = await getDatabaseInfo();
            res.json(info);
        }
        else if (path === '/dashboard/metrics') {
            const { storage } = await Promise.resolve().then(() => __importStar(require('../../server/storage')));
            const metrics = await storage.getDashboardMetrics();
            const customers = await storage.getCustomers();
            const transformedMetrics = {
                totalRevenue: metrics.totalRevenue,
                totalOrders: metrics.ordersToday,
                newCustomers: customers.length,
                inventoryItems: 0
            };
            res.json(transformedMetrics);
        }
        else if (path === '/orders') {
            const { storage } = await Promise.resolve().then(() => __importStar(require('../../server/storage')));
            const orders = await storage.getOrders();
            const products = await storage.getProducts();
            const productMap = new Map(products.map(product => [product.id, product.name]));
            const transformedOrders = orders.map(order => {
                const firstItem = order.items?.[0];
                const productId = firstItem?.productId;
                const serviceName = productId ? productMap.get(productId) || 'Unknown Service' : 'Unknown Service';
                return {
                    ...order,
                    date: order.createdAt,
                    total: parseFloat(order.totalAmount),
                    service: serviceName,
                    priority: 'Normal'
                };
            });
            res.json(transformedOrders);
        }
        else if (path === '/customers') {
            const { storage } = await Promise.resolve().then(() => __importStar(require('../../server/storage')));
            const customers = await storage.getCustomers();
            const transformedCustomers = customers.map(customer => ({
                ...customer,
                joinDate: customer.createdAt,
                totalSpent: parseFloat(customer.totalSpent)
            }));
            res.json(transformedCustomers);
        }
        else if (path === '/products') {
            const { storage } = await Promise.resolve().then(() => __importStar(require('../../server/storage')));
            const products = await storage.getProducts();
            res.json(products);
        }
        else if (path === '/services') {
            const { storage } = await Promise.resolve().then(() => __importStar(require('../../server/storage')));
            const services = await storage.getServices();
            res.json(services);
        }
        else if (path === '/deliveries') {
            const { storage } = await Promise.resolve().then(() => __importStar(require('../../server/storage')));
            const deliveries = await storage.getDeliveries();
            res.json(deliveries);
        }
        else {
            res.status(404).json({ message: 'API endpoint not found' });
        }
        return {
            statusCode,
            headers,
            body: responseBody,
        };
    }
    catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=api.js.map