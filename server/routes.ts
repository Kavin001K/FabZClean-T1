import { Express } from 'express';
import { createServer } from 'http';
import { insertOrderSchema, insertCustomerSchema, insertProductSchema, insertServiceSchema } from '@shared/schema';
import { Storage } from './storage';
import dashboardRoutes from './routes/dashboard';

export function setupRoutes(app: Express, storage: Storage) {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dashboard API routes
  app.use('/api/dashboard', dashboardRoutes);

  // Basic API endpoints
  app.get('/api/orders', async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/customers', async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Tracking drivers API
  app.get("/api/tracking/drivers", async (req, res) => {
    try {
      const activeDrivers = [
        {
          id: "1",
          driverName: "John Smith",
          orderId: "a00d6778-0f59-4021-89b8-d04cf0a89ab8",
          latitude: 12.9716,
          longitude: 77.5946,
          heading: 45,
          speed: 25,
          status: "in_transit",
          estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: "2",
          driverName: "Sarah Johnson",
          orderId: "b11e7889-1g6a-5132-9a9c-e15df1b90bc9",
          latitude: 12.9756,
          longitude: 77.5986,
          heading: 120,
          speed: 18,
          status: "in_transit",
          estimatedArrival: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          lastUpdated: new Date().toISOString()
        }
      ];
      res.json(activeDrivers);
    } catch (error) {
      console.error("Error fetching tracking drivers:", error);
      res.status(500).json({ message: "Failed to fetch tracking drivers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
