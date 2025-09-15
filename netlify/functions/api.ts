import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { registerRoutes } from '../../server/routes';
import express from 'express';
import { createServer } from 'http';

// Create Express app
const app = express();
app.use(express.json());

// Register all API routes
let server: any;
registerRoutes(app).then((httpServer) => {
  server = httpServer;
});

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
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
    } as any;

    let responseBody = '';
    let statusCode = 200;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseBody = JSON.stringify(data);
        return res;
      },
      send: (data: any) => {
        responseBody = typeof data === 'string' ? data : JSON.stringify(data);
        return res;
      },
      set: (key: string, value: string) => {
        // Handle headers if needed
        return res;
      },
      end: (data?: any) => {
        if (data) {
          responseBody = typeof data === 'string' ? data : JSON.stringify(data);
        }
        return res;
      },
    } as any;

    // Route the request to the appropriate handler
    const path = event.path.replace('/api', '');
    
    // Handle different API endpoints
    if (path === '/health/database') {
      const { getDatabaseHealth } = await import('../../server/db-utils');
      const health = await getDatabaseHealth();
      res.json(health);
    } else if (path === '/database/info') {
      const { getDatabaseInfo } = await import('../../server/db-utils');
      const info = await getDatabaseInfo();
      res.json(info);
    } else if (path === '/dashboard/metrics') {
      const { storage } = await import('../../server/storage');
      const metrics = await storage.getDashboardMetrics();
      const customers = await storage.getCustomers();
      
      const transformedMetrics = {
        totalRevenue: metrics.totalRevenue,
        totalOrders: metrics.ordersToday,
        newCustomers: customers.length,
        inventoryItems: 0
      };
      
      res.json(transformedMetrics);
    } else if (path === '/orders') {
      const { storage } = await import('../../server/storage');
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
    } else if (path === '/customers') {
      const { storage } = await import('../../server/storage');
      const customers = await storage.getCustomers();
      
      const transformedCustomers = customers.map(customer => ({
        ...customer,
        joinDate: customer.createdAt,
        totalSpent: parseFloat(customer.totalSpent)
      }));
      res.json(transformedCustomers);
    } else if (path === '/products') {
      const { storage } = await import('../../server/storage');
      const products = await storage.getProducts();
      res.json(products);
    } else if (path === '/services') {
      const { storage } = await import('../../server/storage');
      const services = await storage.getServices();
      res.json(services);
    } else if (path === '/deliveries') {
      const { storage } = await import('../../server/storage');
      const deliveries = await storage.getDeliveries();
      res.json(deliveries);
    } else {
      res.status(404).json({ message: 'API endpoint not found' });
    }

    return {
      statusCode,
      headers,
      body: responseBody,
    };
  } catch (error) {
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
