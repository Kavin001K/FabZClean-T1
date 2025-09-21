import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertCustomerSchema, insertOrderTransactionSchema, insertServiceSchema, insertShipmentSchema, insertBarcodeSchema, insertEmployeeSchema, insertDeliverySchema } from "../shared/schema";
import { z } from "zod";
import { getDatabaseHealth, pingDatabase, getDatabaseInfo } from "./db-utils";
import { barcodeService } from "./barcode-service";
import { realtimeServer } from "./websocket-server";
import { pricingEngine } from "./pricing-engine";
import { loyaltyProgram } from "./loyalty-program";
import { driverTrackingService } from "./driver-tracking";

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

  // Employees endpoints
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      
      // Trigger real-time update
      realtimeServer.broadcast('employee_created', employee);
      
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, validatedData);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Trigger real-time update
      realtimeServer.broadcast('employee_updated', employee);
      
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const success = await storage.deleteEmployee(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Trigger real-time update
      realtimeServer.broadcast('employee_deleted', { id: req.params.id });
      
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
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
      
      // Award loyalty points
      await loyaltyProgram.processOrderRewards(order.customerId, parseFloat(order.totalAmount));
      
      // Trigger real-time update
      await realtimeServer.triggerUpdate('order', 'created', order);
      
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
      
      // Trigger real-time update
      await realtimeServer.triggerUpdate('order', 'updated', order);
      
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  app.delete("/api/orders", async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "orderIds must be a non-empty array" });
      }
      
      const results = await Promise.allSettled(
        orderIds.map(id => storage.deleteOrder(id))
      );
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;
      
      res.json({ 
        message: `Deleted ${successful} orders successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        successful,
        failed,
        total: orderIds.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete orders" });
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
      
      // Trigger real-time update
      await realtimeServer.triggerUpdate('customer', 'created', customer);
      
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
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

  // Shipments endpoints
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shipments" });
    }
  });

  app.get("/api/shipments/:id", async (req, res) => {
    try {
      const shipment = await storage.getShipment(req.params.id);
      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shipment" });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      const validatedData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(validatedData);
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shipment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create shipment" });
    }
  });

  app.put("/api/shipments/:id", async (req, res) => {
    try {
      const validatedData = insertShipmentSchema.partial().parse(req.body);
      const shipment = await storage.updateShipment(req.params.id, validatedData);
      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shipment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update shipment" });
    }
  });

  // Barcode endpoints
  app.get("/api/barcodes", async (req, res) => {
    try {
      const barcodes = await storage.getBarcodes();
      res.json(barcodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch barcodes" });
    }
  });

  app.get("/api/barcodes/:id", async (req, res) => {
    try {
      const barcode = await storage.getBarcode(req.params.id);
      if (!barcode) {
        return res.status(404).json({ message: "Barcode not found" });
      }
      res.json(barcode);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch barcode" });
    }
  });

  app.get("/api/barcodes/code/:code", async (req, res) => {
    try {
      const barcode = await storage.getBarcodeByCode(req.params.code);
      if (!barcode) {
        return res.status(404).json({ message: "Barcode not found" });
      }
      res.json(barcode);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch barcode by code" });
    }
  });

  app.get("/api/barcodes/entity/:entityType/:entityId", async (req, res) => {
    try {
      const barcodes = await storage.getBarcodesByEntity(req.params.entityType, req.params.entityId);
      res.json(barcodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch barcodes by entity" });
    }
  });

  app.post("/api/barcodes/generate", async (req, res) => {
    try {
      const { type, entityType, entityId, data, size, margin } = req.body;
      
      // Generate barcode using the service
      const generatedBarcode = await barcodeService.generateBarcode({
        type,
        entityType,
        entityId,
        data,
        size,
        margin
      });

      // Save to storage
      const barcode = await storage.createBarcode({
        code: generatedBarcode.code,
        type: generatedBarcode.type,
        entityType: generatedBarcode.entityType,
        entityId: generatedBarcode.entityId,
        data: generatedBarcode.data,
        imagePath: generatedBarcode.imagePath,
        isActive: true
      });

      res.status(201).json({
        ...barcode,
        imageData: generatedBarcode.imageData
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate barcode", error: (error as Error).message });
    }
  });

  app.post("/api/barcodes/generate/order/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { data } = req.body;
      
      // Generate order barcode
      const generatedBarcode = await barcodeService.generateOrderBarcode(orderId, data);

      // Save to storage
      const barcode = await storage.createBarcode({
        code: generatedBarcode.code,
        type: generatedBarcode.type,
        entityType: generatedBarcode.entityType,
        entityId: generatedBarcode.entityId,
        data: generatedBarcode.data,
        imagePath: generatedBarcode.imagePath,
        isActive: true
      });

      res.status(201).json({
        ...barcode,
        imageData: generatedBarcode.imageData
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate order barcode", error: (error as Error).message });
    }
  });

  app.post("/api/barcodes/generate/shipment/:shipmentId", async (req, res) => {
    try {
      const { shipmentId } = req.params;
      const { data } = req.body;
      
      // Generate shipment barcode
      const generatedBarcode = await barcodeService.generateShipmentBarcode(shipmentId, data);

      // Save to storage
      const barcode = await storage.createBarcode({
        code: generatedBarcode.code,
        type: generatedBarcode.type,
        entityType: generatedBarcode.entityType,
        entityId: generatedBarcode.entityId,
        data: generatedBarcode.data,
        imagePath: generatedBarcode.imagePath,
        isActive: true
      });

      res.status(201).json({
        ...barcode,
        imageData: generatedBarcode.imageData
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate shipment barcode", error: (error as Error).message });
    }
  });

  app.post("/api/barcodes/decode", async (req, res) => {
    try {
      const { encodedData } = req.body;
      
      if (!encodedData) {
        return res.status(400).json({ message: "Encoded data is required" });
      }

      const decodedData = barcodeService.decodeBarcodeData(encodedData);
      res.json({ decodedData });
    } catch (error) {
      res.status(500).json({ message: "Failed to decode barcode data", error: (error as Error).message });
    }
  });

  app.delete("/api/barcodes/:id", async (req, res) => {
    try {
      const success = await storage.deleteBarcode(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Barcode not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete barcode" });
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

  // Dynamic Pricing endpoints
  app.get("/api/pricing/services", async (req, res) => {
    try {
      const allPricing = pricingEngine.getAllPricing();
      res.json(allPricing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pricing data" });
    }
  });

  app.get("/api/pricing/services/:serviceId", async (req, res) => {
    try {
      const pricing = pricingEngine.getServicePricing(req.params.serviceId);
      if (!pricing) {
        return res.status(404).json({ message: "Service pricing not found" });
      }
      res.json(pricing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service pricing" });
    }
  });

  app.get("/api/pricing/services/:serviceId/recommended", async (req, res) => {
    try {
      const recommendedPrice = await pricingEngine.getRecommendedPrice(req.params.serviceId);
      res.json({ 
        serviceId: req.params.serviceId,
        recommendedPrice,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommended price" });
    }
  });

  app.get("/api/pricing/services/:serviceId/factors", async (req, res) => {
    try {
      const factors = pricingEngine.getPricingFactors(req.params.serviceId);
      if (!factors) {
        return res.status(404).json({ message: "Service pricing factors not found" });
      }
      res.json(factors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pricing factors" });
    }
  });

  app.post("/api/pricing/services/:serviceId/update", async (req, res) => {
    try {
      await pricingEngine.updateServicePricing(req.params.serviceId);
      const pricing = pricingEngine.getServicePricing(req.params.serviceId);
      res.json({ 
        message: "Pricing updated successfully",
        pricing
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update service pricing" });
    }
  });

  // Loyalty Program endpoints
  app.get("/api/loyalty/customers/:customerId", async (req, res) => {
    try {
      const customerPoints = loyaltyProgram.getCustomerPoints(req.params.customerId);
      if (!customerPoints) {
        return res.status(404).json({ message: "Customer loyalty data not found" });
      }
      res.json(customerPoints);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer loyalty data" });
    }
  });

  app.get("/api/loyalty/customers/:customerId/transactions", async (req, res) => {
    try {
      const transactions = loyaltyProgram.getCustomerTransactions(req.params.customerId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer transactions" });
    }
  });

  app.get("/api/loyalty/customers/:customerId/rewards", async (req, res) => {
    try {
      const rewards = loyaltyProgram.getAvailableRewards(req.params.customerId);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available rewards" });
    }
  });

  app.post("/api/loyalty/customers/:customerId/redeem", async (req, res) => {
    try {
      const { points, rewardId } = req.body;
      const success = await loyaltyProgram.redeemPoints(req.params.customerId, points, rewardId);
      
      if (success) {
        res.json({ message: "Points redeemed successfully" });
      } else {
        res.status(400).json({ message: "Insufficient points or invalid reward" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to redeem points" });
    }
  });

  app.get("/api/loyalty/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = loyaltyProgram.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/loyalty/badges", async (req, res) => {
    try {
      const badges = loyaltyProgram.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/loyalty/rewards", async (req, res) => {
    try {
      const rewards = loyaltyProgram.getRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  // Global Search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query || query.trim().length < 2) {
        return res.json({
          orders: [],
          customers: [],
          products: [],
          services: [],
          totalResults: 0
        });
      }

      const searchTerm = query.toLowerCase().trim();
      
      // Search orders
      const orders = await storage.getOrders();
      const matchingOrders = orders.filter(order => 
        order.customerName?.toLowerCase().includes(searchTerm) ||
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.status?.toLowerCase().includes(searchTerm) ||
        (order as any).service?.toLowerCase().includes(searchTerm)
      ).slice(0, limit);

      // Search customers
      const customers = await storage.getCustomers();
      const matchingCustomers = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm)
      ).slice(0, limit);

      // Search products
      const products = await storage.getProducts();
      const matchingProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm) ||
        product.category?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      ).slice(0, limit);

      // Search services
      const services = await storage.getServices();
      const matchingServices = services.filter(service =>
        service.name?.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm) ||
        service.category?.toLowerCase().includes(searchTerm)
      ).slice(0, limit);

      const totalResults = matchingOrders.length + matchingCustomers.length + 
                          matchingProducts.length + matchingServices.length;

      res.json({
        orders: matchingOrders.map(order => ({
          id: order.id,
          type: 'order',
          title: `Order #${order.orderNumber}`,
          subtitle: order.customerName,
          description: `${order.status} - ₹${order.totalAmount}`,
          url: `/orders/${order.id}`,
          createdAt: order.createdAt
        })),
        customers: matchingCustomers.map(customer => ({
          id: customer.id,
          type: 'customer',
          title: customer.name,
          subtitle: customer.email,
          description: `₹${customer.totalSpent} total spent`,
          url: `/customers/${customer.id}`,
          createdAt: customer.createdAt
        })),
        products: matchingProducts.map(product => ({
          id: product.id,
          type: 'product',
          title: product.name,
          subtitle: product.category,
          description: `${product.stockQuantity} in stock`,
          url: `/inventory/${product.id}`,
          createdAt: product.createdAt
        })),
        services: matchingServices.map(service => ({
          id: service.id,
          type: 'service',
          title: service.name,
          subtitle: service.category,
          description: `₹${service.price}`,
          url: `/services/${service.id}`,
          createdAt: service.createdAt
        })),
        totalResults,
        query: searchTerm
      });
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Driver Tracking endpoints
  app.get("/api/tracking/drivers", async (req, res) => {
    try {
      const activeDrivers = driverTrackingService.getAllActiveDrivers();
      res.json(activeDrivers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active drivers" });
    }
  });

  app.get("/api/tracking/drivers/:driverId", async (req, res) => {
    try {
      const driver = driverTrackingService.getDriverLocation(req.params.driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver location" });
    }
  });

  app.get("/api/tracking/drivers/:driverId/route", async (req, res) => {
    try {
      const route = driverTrackingService.getDriverRoute(req.params.driverId);
      res.json(route);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver route" });
    }
  });

  app.get("/api/tracking/orders/:orderId", async (req, res) => {
    try {
      const driver = driverTrackingService.getDriverForOrder(req.params.orderId);
      if (!driver) {
        return res.status(404).json({ message: "No driver found for this order" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order tracking" });
    }
  });

  app.post("/api/tracking/orders/:orderId/start", async (req, res) => {
    try {
      const driver = await driverTrackingService.startTrackingForOrder(req.params.orderId);
      if (!driver) {
        return res.status(404).json({ message: "Order not found or tracking failed" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Failed to start order tracking" });
    }
  });

  app.delete("/api/tracking/orders/:orderId", async (req, res) => {
    try {
      driverTrackingService.stopTrackingForOrder(req.params.orderId);
      res.json({ message: "Tracking stopped successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop order tracking" });
    }
  });

  // Driver Management endpoints
  app.get("/api/drivers", async (req, res) => {
    try {
      // Return mock driver data for now
      const drivers = [
        {
          id: "1",
          name: "Rajesh Kumar",
          phone: "+91 98765 43210",
          email: "rajesh@example.com",
          licenseNumber: "DL123456789",
          vehicleNumber: "DL-01-AB-1234",
          vehicleType: "bike",
          vehicleModel: "Honda Activa",
          status: "available",
          rating: 4.8,
          totalDeliveries: 156,
          totalEarnings: 45200,
          experience: 18,
          specialties: ["Dry Cleaning", "Ironing"],
          lastActive: new Date().toISOString()
        },
        {
          id: "2",
          name: "Priya Sharma",
          phone: "+91 98765 43211",
          email: "priya@example.com",
          licenseNumber: "DL987654321",
          vehicleNumber: "DL-01-CD-5678",
          vehicleType: "car",
          vehicleModel: "Maruti Swift",
          status: "busy",
          rating: 4.9,
          totalDeliveries: 203,
          totalEarnings: 67800,
          experience: 24,
          specialties: ["Premium Dry Cleaning", "Wedding Dresses"],
          lastActive: new Date().toISOString()
        },
        {
          id: "3",
          name: "Amit Singh",
          phone: "+91 98765 43212",
          email: "amit@example.com",
          licenseNumber: "DL456789123",
          vehicleNumber: "DL-01-EF-9012",
          vehicleType: "van",
          vehicleModel: "Mahindra Bolero",
          status: "available",
          rating: 4.6,
          totalDeliveries: 89,
          totalEarnings: 32100,
          experience: 12,
          specialties: ["Bulk Orders", "Corporate Pickup"],
          lastActive: new Date().toISOString()
        }
      ];
      res.json(drivers);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const driverData = req.body;
      // In a real implementation, you would save this to the database
      const newDriver = {
        id: Date.now().toString(),
        ...driverData,
        status: "available",
        rating: 0,
        totalDeliveries: 0,
        totalEarnings: 0,
        lastActive: new Date().toISOString()
      };
      
      res.status(201).json(newDriver);
    } catch (error) {
      console.error('Failed to create driver:', error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // In a real implementation, you would update this in the database
      const updatedDriver = {
        id,
        ...updateData,
        lastActive: new Date().toISOString()
      };
      
      res.json(updatedDriver);
    } catch (error) {
      console.error('Failed to update driver:', error);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // In a real implementation, you would delete this from the database
      res.json({ message: "Driver deleted successfully" });
    } catch (error) {
      console.error('Failed to delete driver:', error);
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  // Driver assignment endpoint
  app.post("/api/orders/:orderId/assign-driver", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { driverId } = req.body;

      if (!driverId) {
        return res.status(400).json({ message: "Driver ID is required" });
      }

      // Get the order to verify it exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Mock driver data - in a real app, you'd fetch this from the database
      const mockDrivers = {
        "1": { name: "Rajesh Kumar", vehicleNumber: "DL-01-AB-1234" },
        "2": { name: "Priya Sharma", vehicleNumber: "DL-01-CD-5678" },
        "3": { name: "Amit Singh", vehicleNumber: "DL-01-EF-9012" }
      };

      const driverInfo = mockDrivers[driverId] || { 
        name: `Driver ${driverId}`, 
        vehicleNumber: `Vehicle-${driverId}` 
      };

      // Create or update delivery record
      const delivery = await storage.createDelivery({
        orderId,
        driverName: driverInfo.name,
        vehicleId: driverInfo.vehicleNumber,
        status: "pending",
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        location: { latitude: 28.6139, longitude: 77.2090 }, // Default to Delhi
        route: []
      });

      // Broadcast the assignment via WebSocket
      realtimeServer.broadcast({
        type: 'driver_assigned',
        data: {
          orderId,
          driverId,
          driverName: delivery.driverName,
          deliveryId: delivery.id
        }
      });

      res.json({
        message: "Driver assigned successfully",
        delivery: {
          id: delivery.id,
          orderId: delivery.orderId,
          driverName: delivery.driverName,
          status: delivery.status
        }
      });
    } catch (error) {
      console.error('Failed to assign driver:', error);
      res.status(500).json({ message: "Failed to assign driver to order" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
