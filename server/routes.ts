import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertCustomerSchema, insertOrderTransactionSchema, insertServiceSchema } from "@shared/schema";
import { z } from "zod";
import { getDatabaseHealth, pingDatabase, getDatabaseInfo } from "./db-utils";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      const customers = await storage.getCustomers();
      
      // Transform metrics to match frontend expectations
      const transformedMetrics = {
        totalRevenue: metrics.totalRevenue,
        totalOrders: metrics.ordersToday, // Map ordersToday to totalOrders
        newCustomers: customers.length, // Use total customers as newCustomers for now
        inventoryItems: 0 // Default value since we don't have inventory count
      };
      
      res.json(transformedMetrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Database health check endpoints
  app.get("/api/health/database", async (req, res) => {
    try {
      const health = await getDatabaseHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({ status: "unhealthy", error: (error as Error).message });
    }
  });

  app.get("/api/health/ping", async (req, res) => {
    try {
      const ping = await pingDatabase();
      res.json(ping);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get("/api/database/info", async (req, res) => {
    try {
      const info = await getDatabaseInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Orders endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const products = await storage.getProducts();
      
      // Create a product lookup map
      const productMap = new Map(products.map(product => [product.id, product.name]));
      
      // Transform orders to match frontend expectations
      const transformedOrders = orders.map(order => {
        const firstItem = (order.items as any)?.[0];
        const productId = firstItem?.productId;
        const serviceName = productId ? productMap.get(productId) || 'Unknown Service' : 'Unknown Service';
        
        return {
          ...order,
          date: order.createdAt, // Map createdAt to date
          total: parseFloat(order.totalAmount), // Map totalAmount to total and convert to number
          service: serviceName, // Map product ID to actual product name
          priority: 'Normal' // Default priority
        };
      });
      res.json(transformedOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const products = await storage.getProducts();
      const productMap = new Map(products.map(product => [product.id, product.name]));
      
      const firstItem = (order.items as any)?.[0];
      const productId = firstItem?.productId;
      const serviceName = productId ? productMap.get(productId) || 'Unknown Service' : 'Unknown Service';
      
      // Transform order to match frontend expectations
      const transformedOrder = {
        ...order,
        date: order.createdAt, // Map createdAt to date
        total: parseFloat(order.totalAmount), // Map totalAmount to total and convert to number
        service: serviceName, // Map product ID to actual product name
        priority: 'Normal' // Default priority
      };
      res.json(transformedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Customers endpoints
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      // Transform customers to match frontend expectations
      const transformedCustomers = customers.map(customer => ({
        ...customer,
        joinDate: customer.createdAt, // Map createdAt to joinDate
        totalSpent: parseFloat(customer.totalSpent || "0") // Convert totalSpent to number
      }));
      res.json(transformedCustomers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      // Transform customer to match frontend expectations
      const transformedCustomer = {
        ...customer,
        joinDate: customer.createdAt, // Map createdAt to joinDate
        totalSpent: parseFloat(customer.totalSpent || "0") // Convert totalSpent to number
      };
      res.json(transformedCustomer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // POS Transactions endpoints
  app.get("/api/pos/transactions", async (req, res) => {
    try {
      const transactions = await storage.getPosTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch POS transactions" });
    }
  });

  app.post("/api/pos/transactions", async (req, res) => {
    try {
      const validatedData = insertOrderTransactionSchema.parse(req.body);
      const transaction = await storage.createPosTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Services endpoints
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, validatedData);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const success = await storage.deleteService(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Deliveries endpoints
  app.get("/api/deliveries", async (req, res) => {
    try {
      const deliveries = await storage.getDeliveries();
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/:id", async (req, res) => {
    try {
      const delivery = await storage.getDelivery(req.params.id);
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
