import type { Express } from "express";
import { createServer, type Server } from "http";
import { db as storage } from "./db";
import {
  insertProductSchema,
  insertOrderSchema,
  insertCustomerSchema,
  insertOrderTransactionSchema,
  insertServiceSchema,
  insertShipmentSchema,
  insertBarcodeSchema,
  insertEmployeeSchema,
  insertDeliverySchema,
} from "../shared/schema";
import { z } from "zod";
import { getDatabaseHealth, pingDatabase, getDatabaseInfo } from "./db-utils";
import { barcodeService } from "./barcode-service";
import { realtimeServer } from "./websocket-server";
import { pricingEngine } from "./pricing-engine";
import { loyaltyProgram } from "./loyalty-program";
import { driverTrackingService } from "./driver-tracking";
import { settingsService } from "./services/settings-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      // Since getDashboardMetrics doesn't exist in SQLiteStorage, calculate manually
      const allOrders = await storage.listOrders();
      const customers = await storage.listCustomers();
      const products = await storage.listProducts();

      const totalRevenue = allOrders.reduce(
        (sum, order) => sum + parseFloat(order.totalAmount || "0"),
        0,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ordersToday = allOrders.filter(
        (order) => new Date(order.createdAt) >= today,
      ).length;

      const newCustomersToday = customers.filter(
        (customer) => new Date(customer.createdAt) >= today,
      ).length;

      // Calculate due date statistics
      const currentDate = new Date();
      const tomorrow = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
      
      const ordersWithDueDates = allOrders.filter(order => {
        const pickupDate = order.shippingAddress?.pickupDate;
        return pickupDate && ['pending', 'processing', 'ready'].includes(order.status);
      }).map(order => {
        try {
          const pickupDate = new Date(order.shippingAddress.pickupDate);
          const dueDate = new Date(pickupDate.getTime() + (2 * 24 * 60 * 60 * 1000));
          return { ...order, dueDate: dueDate.toISOString().split('T')[0] };
        } catch (error) {
          // Skip orders with invalid pickup dates
          return null;
        }
      }).filter(order => order !== null);

      const todaysDueOrders = ordersWithDueDates.filter(order => {
        const dueDateStr = order.dueDate;
        const todayStr = currentDate.toISOString().split('T')[0];
        return dueDateStr === todayStr;
      }).length;

      const tomorrowsDueOrders = ordersWithDueDates.filter(order => {
        const dueDateStr = order.dueDate;
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        return dueDateStr === tomorrowStr;
      }).length;

      const overdueOrders = ordersWithDueDates.filter(order => {
        const dueDate = new Date(order.dueDate);
        return dueDate < currentDate && ['pending', 'processing'].includes(order.status);
      }).length;

      const transformedMetrics = {
        totalRevenue,
        totalOrders: ordersToday,
        newCustomers: newCustomersToday,
        inventoryItems: products.length,
        dueDateStats: {
          today: todaysDueOrders,
          tomorrow: tomorrowsDueOrders,
          overdue: overdueOrders,
          upcoming: ordersWithDueDates.length - todaysDueOrders - tomorrowsDueOrders - overdueOrders
        }
      };

      res.json(transformedMetrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Database health check endpoints
  app.get("/api/health/database", async (req, res) => {
    try {
      const health = await getDatabaseHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: (error as Error).message,
      });
    }
  });

  app.get("/api/health/ping", async (req, res) => {
    try {
      const ping = await pingDatabase();
      res.json(ping);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
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

  // Due date orders endpoint
  app.get("/api/due-date-orders", async (req, res) => {
    try {
      const { type, days } = req.query;
      
      let orders;
      let title;
      
      // Get all orders from the database
      const allOrders = await storage.listOrders();
      
      // Add due date logic based on pickup date
      const ordersWithDueDates = allOrders.map(order => {
        const pickupDate = order.shippingAddress?.pickupDate;
        if (pickupDate) {
          const pickup = new Date(pickupDate);
          const dueDate = new Date(pickup.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days after pickup
          const estimatedDelivery = new Date(pickup.getTime() + (2 * 24 * 60 * 60 * 1000));
          
          return {
            ...order,
            pickupDate: pickupDate,
            dueDate: dueDate.toISOString().split('T')[0],
            estimatedDelivery: estimatedDelivery.toISOString()
          };
        }
        return {
          ...order,
          pickupDate: null,
          dueDate: null,
          estimatedDelivery: null
        };
      });

      const today = new Date();
      const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
      
      switch (type) {
        case 'today':
          orders = ordersWithDueDates.filter(order => {
            if (!order.dueDate) return false;
            const dueDate = new Date(order.dueDate);
            const todayStr = today.toISOString().split('T')[0];
            const dueDateStr = dueDate.toISOString().split('T')[0];
            return dueDateStr === todayStr && ['pending', 'processing', 'ready'].includes(order.status);
          });
          title = "Today's Due Orders";
          break;
        case 'tomorrow':
          orders = ordersWithDueDates.filter(order => {
            if (!order.dueDate) return false;
            const dueDate = new Date(order.dueDate);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const dueDateStr = dueDate.toISOString().split('T')[0];
            return dueDateStr === tomorrowStr && ['pending', 'processing', 'ready'].includes(order.status);
          });
          title = "Tomorrow's Due Orders";
          break;
        case 'overdue':
          orders = ordersWithDueDates.filter(order => {
            if (!order.dueDate) return false;
            const dueDate = new Date(order.dueDate);
            return dueDate < today && ['pending', 'processing'].includes(order.status);
          });
          title = "Overdue Orders";
          break;
        case 'upcoming':
        default:
          const daysAhead = days ? parseInt(days as string) : 7;
          const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
          orders = ordersWithDueDates.filter(order => {
            if (!order.dueDate) return false;
            const dueDate = new Date(order.dueDate);
            return dueDate >= today && dueDate <= futureDate && 
                   ['pending', 'processing', 'ready'].includes(order.status);
          });
          title = `Upcoming Orders (Next ${daysAhead} days)`;
          break;
      }

      // Add computed fields for better display
      const enrichedOrders = orders.map(order => {
        if (!order.dueDate) return order;
        
        const dueDate = new Date(order.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let urgency = 'normal';
        if (diffDays < 0) urgency = 'overdue';
        else if (diffDays === 0) urgency = 'today';
        else if (diffDays === 1) urgency = 'tomorrow';
        else if (diffDays <= 3) urgency = 'urgent';
        
        return {
          ...order,
          daysUntilDue: diffDays,
          urgency,
          isOverdue: diffDays < 0,
          isToday: diffDays === 0,
          isTomorrow: diffDays === 1,
          formattedDueDate: dueDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          formattedEstimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : null
        };
      });

      res.json({
        title,
        orders: enrichedOrders,
        count: enrichedOrders.length,
        summary: {
          total: enrichedOrders.length,
          overdue: enrichedOrders.filter(o => o.isOverdue).length,
          today: enrichedOrders.filter(o => o.isToday).length,
          tomorrow: enrichedOrders.filter(o => o.isTomorrow).length,
          urgent: enrichedOrders.filter(o => o.urgency === 'urgent').length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Due date orders API error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Employees endpoints - Fixed method names
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.listEmployees(); // Changed from getEmployees
      res.json(employees);
    } catch (error) {
      console.error("Fetch employees error:", error);
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
      console.error("Fetch employee error:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);

      // Trigger real-time update
      realtimeServer.broadcast("employee_created", employee);

      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Create employee error:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(
        req.params.id,
        validatedData,
      );

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Trigger real-time update
      realtimeServer.broadcast("employee_updated", employee);

      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Update employee error:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);

      // Trigger real-time update
      realtimeServer.broadcast("employee_deleted", { id: req.params.id });

      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Delete employee error:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Products endpoints - Fixed method names
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.listProducts(); // Changed from getProducts
      res.json(products);
    } catch (error) {
      console.error("Fetch products error:", error);
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
      console.error("Fetch product error:", error);
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
        return res.status(400).json({
          message: "Invalid product data",
          errors: error.errors,
        });
      }
      console.error("Create product error:", error);
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
        return res.status(400).json({
          message: "Invalid product data",
          errors: error.errors,
        });
      }
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Orders endpoints - Fixed method names and data handling
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.listOrders(); // Changed from getOrders
      const products = await storage.listProducts();

      // Create a product lookup map
      const productMap = new Map(
        products.map((product) => [product.id, product.name]),
      );

      // Transform orders to match frontend expectations
      const transformedOrders = orders.map((order) => {
        // Handle items if they exist in the order
        const items = (order.items as any[]) || [];
        const firstItem = items[0];
        const productId = firstItem?.productId;
        const serviceName = productId
          ? productMap.get(productId) || "Unknown Service"
          : "Unknown Service";

        return {
          ...order,
          date: order.createdAt,
          total: parseFloat(order.totalAmount || "0"),
          service: serviceName,
          priority: "Normal",
        };
      });

      res.json(transformedOrders);
    } catch (error) {
      console.error("Fetch orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const products = await storage.listProducts();
      const productMap = new Map(
        products.map((product) => [product.id, product.name]),
      );

      const items = (order.items as any[]) || [];
      const firstItem = items[0];
      const productId = firstItem?.productId;
      const serviceName = productId
        ? productMap.get(productId) || "Unknown Service"
        : "Unknown Service";

      const transformedOrder = {
        ...order,
        date: order.createdAt,
        total: parseFloat(order.totalAmount || "0"),
        service: serviceName,
        priority: "Normal",
      };

      res.json(transformedOrder);
    } catch (error) {
      console.error("Fetch order error:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);

      // Award loyalty points
      await loyaltyProgram.processOrderRewards(
        order.customerId,
        parseFloat(order.totalAmount || "0"),
      );

      // Trigger real-time update
      await realtimeServer.triggerUpdate("order", "created", order);

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid order data",
          errors: error.errors,
        });
      }
      console.error("Create order error:", error);
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
      await realtimeServer.triggerUpdate("order", "updated", order);

      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid order data",
          errors: error.errors,
        });
      }
      console.error("Update order error:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await storage.deleteOrder(req.params.id);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  app.delete("/api/orders", async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          message: "orderIds must be a non-empty array",
        });
      }

      const results = await Promise.allSettled(
        orderIds.map((id) => storage.deleteOrder(id)),
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled",
      ).length;
      const failed = results.length - successful;

      res.json({
        message: `Deleted ${successful} orders successfully${failed > 0 ? `, ${failed} failed` : ""}`,
        successful,
        failed,
        total: orderIds.length,
      });
    } catch (error) {
      console.error("Bulk delete orders error:", error);
      res.status(500).json({ message: "Failed to delete orders" });
    }
  });

  // Customer KPIs endpoint - Fixed method names
  app.get("/api/customers/kpis", async (req, res) => {
    try {
      const customers = await storage.listCustomers(); // Changed from getCustomers
      const orders = await storage.listOrders(); // Changed from getOrders

      const totalCustomers = customers.length;

      const newCustomersThisMonth = customers.filter((customer) => {
        const customerDate = new Date(customer.createdAt);
        const currentDate = new Date();
        return (
          customerDate.getMonth() === currentDate.getMonth() &&
          customerDate.getFullYear() === currentDate.getFullYear()
        );
      }).length;

      const totalRevenue = customers.reduce(
        (sum, customer) => sum + parseFloat(customer.totalSpent || "0"),
        0,
      );

      const avgOrderValue =
        orders.length > 0
          ? orders.reduce(
              (sum, order) => sum + parseFloat(order.totalAmount || "0"),
              0,
            ) / orders.length
          : 0;

      const repeatCustomers = customers.filter(
        (customer) => (customer.totalOrders || 0) > 1,
      ).length;

      const retentionRate =
        totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

      res.json({
        totalCustomers,
        newCustomersThisMonth,
        totalRevenue,
        avgOrderValue,
        retentionRate,
      });
    } catch (error) {
      console.error("Failed to fetch customer KPIs:", error);
      res.status(500).json({ message: "Failed to fetch customer KPIs" });
    }
  });

  // Customers endpoints - Fixed method names
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.listCustomers(); // Changed from getCustomers

      const transformedCustomers = customers.map((customer) => ({
        ...customer,
        joinDate: customer.createdAt,
        totalSpent: parseFloat(customer.totalSpent || "0"),
      }));

      res.json(transformedCustomers);
    } catch (error) {
      console.error("Fetch customers error:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const transformedCustomer = {
        ...customer,
        joinDate: customer.createdAt,
        totalSpent: parseFloat(customer.totalSpent || "0"),
      };

      res.json(transformedCustomer);
    } catch (error) {
      console.error("Fetch customer error:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);

      // Trigger real-time update
      await realtimeServer.triggerUpdate("customer", "created", customer);

      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid customer data",
          errors: error.errors,
        });
      }
      console.error("Create customer error:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(
        req.params.id,
        validatedData,
      );

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const transformedCustomer = {
        ...customer,
        joinDate: customer.createdAt,
        totalSpent: parseFloat(customer.totalSpent || "0"),
      };

      res.json(transformedCustomer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid customer data",
          errors: error.errors,
        });
      }
      console.error("Update customer error:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // POS Transactions endpoints - Fixed method names
  app.get("/api/pos/transactions", async (req, res) => {
    try {
      const transactions = await storage.listPosTransactions(); // Changed from getPosTransactions
      res.json(transactions);
    } catch (error) {
      console.error("Fetch POS transactions error:", error);
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
        return res.status(400).json({
          message: "Invalid transaction data",
          errors: error.errors,
        });
      }
      console.error("Create POS transaction error:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Services endpoints - Complete CRUD
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.listServices();
      res.json(services);
    } catch (error) {
      console.error("Fetch services error:", error);
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
      console.error("Fetch service error:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);

      // Trigger real-time update
      await realtimeServer.triggerUpdate("service", "created", service);

      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid service data",
          errors: error.errors,
        });
      }
      console.error("Create service error:", error);
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

      // Trigger real-time update
      await realtimeServer.triggerUpdate("service", "updated", service);

      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid service data",
          errors: error.errors,
        });
      }
      console.error("Update service error:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Global Search endpoint - Fixed method names
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
          totalResults: 0,
        });
      }

      const searchTerm = query.toLowerCase().trim();

      // Search with fixed method names
      const orders = await storage.listOrders(); // Changed from getOrders
      const customers = await storage.listCustomers(); // Changed from getCustomers
      const products = await storage.listProducts(); // Changed from getProducts
      const services = await storage.listServices(); // Changed from getServices

      const matchingOrders = orders
        .filter(
          (order) =>
            order.customerName?.toLowerCase().includes(searchTerm) ||
            order.orderNumber?.toLowerCase().includes(searchTerm) ||
            order.status?.toLowerCase().includes(searchTerm),
        )
        .slice(0, limit);

      const matchingCustomers = customers
        .filter(
          (customer) =>
            customer.name?.toLowerCase().includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm) ||
            customer.phone?.toLowerCase().includes(searchTerm),
        )
        .slice(0, limit);

      const matchingProducts = products
        .filter(
          (product) =>
            product.name?.toLowerCase().includes(searchTerm) ||
            product.category?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm),
        )
        .slice(0, limit);

      const matchingServices = services
        .filter(
          (service) =>
            service.name?.toLowerCase().includes(searchTerm) ||
            service.description?.toLowerCase().includes(searchTerm),
        )
        .slice(0, limit);

      const totalResults =
        matchingOrders.length +
        matchingCustomers.length +
        matchingProducts.length +
        matchingServices.length;

      res.json({
        orders: matchingOrders.map((order) => ({
          id: order.id,
          type: "order",
          title: `Order #${order.orderNumber || order.id}`,
          subtitle: order.customerName,
          description: `${order.status} - ₹${order.totalAmount}`,
          url: `/orders/${order.id}`,
          createdAt: order.createdAt,
        })),
        customers: matchingCustomers.map((customer) => ({
          id: customer.id,
          type: "customer",
          title: customer.name,
          subtitle: customer.email,
          description: `₹${customer.totalSpent} total spent`,
          url: `/customers/${customer.id}`,
          createdAt: customer.createdAt,
        })),
        products: matchingProducts.map((product) => ({
          id: product.id,
          type: "product",
          title: product.name,
          subtitle: product.category,
          description: `${product.stockQuantity} in stock`,
          url: `/inventory/${product.id}`,
          createdAt: product.createdAt,
        })),
        services: matchingServices.map((service) => ({
          id: service.id,
          type: "service",
          title: service.name,
          subtitle: service.description,
          description: `₹${service.price}`,
          url: `/services/${service.id}`,
          createdAt: service.createdAt,
        })),
        totalResults,
        query: searchTerm,
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Add remaining endpoints here following the same pattern...

  // Settings API endpoints
  // Get all settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await settingsService.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Get settings by category
  app.get("/api/settings/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await settingsService.getSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings by category:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Get single setting by key
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await settingsService.getSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  // Update single setting
  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value, category } = req.body;
      const updatedSetting = await settingsService.updateSetting(
        key,
        value,
        category,
        "user"
      );
      res.json(updatedSetting);
    } catch (error: any) {
      console.error("Error updating setting:", error);
      res.status(400).json({ message: error.message || "Failed to update setting" });
    }
  });

  // Bulk update settings
  app.put("/api/settings", async (req, res) => {
    try {
      const { settings } = req.body;
      if (!Array.isArray(settings)) {
        return res.status(400).json({ message: "Settings must be an array" });
      }
      const updatedSettings = await settingsService.updateSettings(settings, "user");
      res.json(updatedSettings);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      res.status(400).json({ message: error.message || "Failed to update settings" });
    }
  });

  // Reset settings to defaults
  app.post("/api/settings/reset", async (req, res) => {
    try {
      const defaultSettings = await settingsService.resetToDefaults();
      res.json(defaultSettings);
    } catch (error) {
      console.error("Error resetting settings:", error);
      res.status(500).json({ message: "Failed to reset settings" });
    }
  });

  // Export settings
  app.get("/api/settings/export/json", async (req, res) => {
    try {
      const exportData = await settingsService.exportSettings();
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting settings:", error);
      res.status(500).json({ message: "Failed to export settings" });
    }
  });

  // Import settings
  app.post("/api/settings/import", async (req, res) => {
    try {
      const { settings } = req.body;
      if (!Array.isArray(settings)) {
        return res.status(400).json({ message: "Settings must be an array" });
      }
      const importedSettings = await settingsService.importSettings(settings, "user");
      res.json(importedSettings);
    } catch (error: any) {
      console.error("Error importing settings:", error);
      res.status(400).json({ message: error.message || "Failed to import settings" });
    }
  });

  // Get settings as object (for easier frontend consumption)
  app.get("/api/settings/object/all", async (req, res) => {
    try {
      const settingsObject = await settingsService.getSettingsObject();
      res.json(settingsObject);
    } catch (error) {
      console.error("Error fetching settings object:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Initialize default settings on server start
  settingsService.initializeDefaults().catch(console.error);

  const httpServer = createServer(app);
  return httpServer;
}
