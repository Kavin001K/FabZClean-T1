import { Express } from 'express';
import ordersRouter from './orders';
import customersRouter from './customers';
import transitRouter from './transit';
import transitOrdersRouter from './transit-orders';
import deliveriesRouter from './deliveries';
import driversRouter from './drivers';
import productsRouter from './products';
import servicesRouter from './services';
import searchRouter from './api/search';
import algorithmsRouter from './api/algorithms';
import websocketMetricsRouter from './api/websocket-metrics';
import authRouter from './auth'; // Employee-based authentication
import employeesRouter from './employees'; // Employee management
import dashboardRouter from './dashboard';
import accountingRouter from './accounting';
import healthRouter from './health';
import databaseRouter from './database';
import pdfRouter from './pdf';
import whatsappRouter from './whatsapp';
import whatsappFlowRouter from './whatsapp-flow';
import tasksRouter from './tasks';
import documentsRouter from './documents';
import transitSuggestionsRouter from './transit-suggestions';
import settingsRouter from './settings';
import franchiseRouter from './franchise';
import auditLogsRouter from './audit-logs';
import analyticsRouter from './analytics';
import creditsRouter from './credits';
import reportsRouter from './reports';
import publicTrackingRouter from './public-tracking';
import publicInvoiceRouter from './public-invoice';
import { jwtRequired } from '../middleware/auth';
import { debugRouter } from './debug';
import { db as storage } from '../db';
import { Order, Product } from '../../shared/schema';

/**
 * Register all route modules with the Express app
 */
export function registerAllRoutes(app: Express): void {
  // Due Date Orders endpoint (Direct mount to match frontend)
  app.get("/api/due-date-orders", jwtRequired, async (req, res) => {
    try {
      const { type, date } = req.query;

      // Enforce franchise isolation - use req.employee from auth middleware
      const employee = (req as any).employee;
      let franchiseId = undefined;

      if (employee && employee.role !== 'admin' && employee.role !== 'factory_manager') {
        franchiseId = employee.franchiseId;
      } else if (employee && (employee.role === 'admin' || employee.role === 'factory_manager') && req.query.franchiseId) {
        franchiseId = req.query.franchiseId === 'all' ? undefined : req.query.franchiseId as string;
      }

      // Pass franchiseId to listOrders to filter at source (efficient)
      const orders = await storage.listOrders(franchiseId);

      let filteredOrders = orders;

      // Filter by franchise if provided and not 'all' (redundant if storage.listOrders handles it, but keeps logic structure)
      if (franchiseId && franchiseId !== 'all') {
        filteredOrders = filteredOrders.filter((order: any) => order.franchiseId === franchiseId);
      }

      // Filter by date
      // Filter by date
      if (type === 'specific' && date) {
        const targetDate = date as string; // Expecting yyyy-MM-dd from query

        filteredOrders = filteredOrders.filter((order: any) => {
          let dueDateStr = null;
          let pickupDateStr = null;

          // Helper to convert UTC to IST (UTC+5:30) YYYY-MM-DD
          const toISTDateString = (dateVal: any) => {
            if (!dateVal) return null;
            try {
              const d = new Date(dateVal);
              // Add 5 hours 30 minutes to get IST time represented in UTC
              const istTime = d.getTime() + (5.5 * 60 * 60 * 1000);
              const result = new Date(istTime).toISOString().split('T')[0];
              // console.log(`[DEBUG] Converting ${dateVal} -> ${result}`);
              return result;
            } catch (e) {
              return null;
            }
          };

          if (order.dueDate) dueDateStr = toISTDateString(order.dueDate);
          if (order.pickupDate) pickupDateStr = toISTDateString(order.pickupDate);

          const match = dueDateStr === targetDate || pickupDateStr === targetDate;
          const isCompleted = ['completed', 'delivered', 'cancelled'].includes(order.status?.toLowerCase());

          return match && !isCompleted;
        });
      } else if (type === 'today') {
        // For 'today', we also want IST today
        const now = new Date();
        const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const today = istNow.toISOString().split('T')[0];

        filteredOrders = filteredOrders.filter((order: any) => {
          let dueDateStr = null;
          let pickupDateStr = null;

          const toISTDateString = (dateVal: any) => {
            if (!dateVal) return null;
            try {
              const d = new Date(dateVal);
              const istTime = d.getTime() + (5.5 * 60 * 60 * 1000);
              return new Date(istTime).toISOString().split('T')[0];
            } catch (e) {
              return null;
            }
          };

          if (order.dueDate) dueDateStr = toISTDateString(order.dueDate);
          if (order.pickupDate) pickupDateStr = toISTDateString(order.pickupDate);

          const match = dueDateStr === today || pickupDateStr === today;
          const isCompleted = ['completed', 'delivered', 'cancelled'].includes(order.status?.toLowerCase());

          return match && !isCompleted;
        });
      }

      // Transform orders
      const products = await storage.listProducts();
      const productMap = new Map(
        products.map((product: Product) => [product.id, product.name]),
      );

      const transformedOrders = filteredOrders.map((order: Order) => {
        const items = (order.items as any[]) || [];
        const serviceNames = Array.from(new Set(items.map(item => {
          return productMap.get(item.productId) || "Unknown Service";
        })));
        const serviceName = serviceNames.length > 0 ? serviceNames.join(", ") : "Unknown Service";

        return {
          ...order,
          date: order.createdAt,
          total: parseFloat(order.totalAmount || "0"),
          service: serviceName,
          priority: "Normal",
        };
      });

      res.json({ orders: transformedOrders });
    } catch (error) {
      console.error("Fetch due date orders error:", error);
      res.status(500).json({ message: "Failed to fetch due date orders" });
    }
  });

  // Public routes (no authentication required)
  app.use('/api/public', publicTrackingRouter);

  // Public invoice generation (no authentication required)
  app.use('/api/public', publicInvoiceRouter);

  // Authentication routes (no version prefix)
  app.use('/api/auth', authRouter);
  app.use('/api/debug', debugRouter);
  app.use('/api/employees', employeesRouter);
  app.use('/api/whatsapp', whatsappRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/franchises', franchiseRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/transit-orders', transitOrdersRouter);

  // API v1 routes
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/customers', customersRouter);

  // Use audit logs router (new)
  app.use('/api/audit-logs', auditLogsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/credits', creditsRouter);
  app.use('/api/reports', reportsRouter);

  app.use('/api/v1/transit', transitRouter);
  app.use('/api/v1/deliveries', deliveriesRouter);
  app.use('/api/v1/drivers', driversRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/services', servicesRouter);

  // Algorithm and search API routes
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/algorithms', algorithmsRouter);
  app.use('/api/v1/websocket', websocketMetricsRouter);

  // Dashboard and Accounting routes
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/accounting', accountingRouter);
  app.use('/api/settings', settingsRouter);

  // Health and Database routes
  app.use('/api/health', healthRouter);
  app.use('/api/database', databaseRouter);

  // PDF upload route
  app.use('/api', pdfRouter);

  // WhatsApp Flow endpoint (public - no auth for Meta webhooks)
  app.use('/api/whatsapp-flow', whatsappFlowRouter);

  // Legacy API routes (for backward compatibility)
  app.use('/api/orders', ordersRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/transit', transitRouter);
  app.use('/api/transit-suggestions', transitSuggestionsRouter);
  app.use('/api/deliveries', deliveriesRouter);
  app.use('/api/drivers', driversRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/services', servicesRouter);

  // Legacy search and algorithm routes
  app.use('/api/search', searchRouter);
  app.use('/api/algorithms', algorithmsRouter);
}

export { default as ordersRouter } from './orders';
export { default as customersRouter } from './customers';
export { default as transitRouter } from './transit';
export { default as deliveriesRouter } from './deliveries';
export { default as driversRouter } from './drivers';
