import { Express, Router } from 'express';
import ordersRouter from './orders';
import customersRouter from './customers';
import employeesRouter from './employees';
import productsRouter from './products';
import servicesRouter from './services';
import searchRouter from './api/search';
import algorithmsRouter from './api/algorithms';
import websocketMetricsRouter from './api/websocket-metrics';
import authRouter from './auth';
import dashboardRouter from './dashboard';
import accountingRouter from './accounting';
import healthRouter from './health';
import databaseRouter from './database';
import pdfRouter from './pdf';
import whatsappRouter from './whatsapp';
import whatsappFlowRouter from './whatsapp-flow';
import documentsRouter from './documents';
import settingsRouter from './settings';
import auditLogsRouter from './audit-logs';
import analyticsRouter from './analytics';
import creditsRouter from './credits';
import reportsRouter from './reports';
import publicTrackingRouter from './public-tracking';
import publicInvoiceRouter from './public-invoice';
import businessSettingsRouter from './business-settings';
import walletRouter from './wallet';
import { jwtRequired } from '../middleware/auth';
import { debugRouter } from './debug';
import { db as storage } from '../db';
import { Order, Product } from '../../shared/schema';
import { initAnalyticsCron } from '../scripts/monthly-analytics-cron';

/**
 * Register all route modules with the Express app
 */
export function registerAllRoutes(app: Express): void {
  const deliveryDisabledRouter = Router();
  deliveryDisabledRouter.use((_req, res) => {
    res.status(410).json({
      success: false,
      error: 'Delivery module is disabled in this build.',
      message: 'Delivery routes have been removed from active operations.',
      statusCode: 410,
    });
  });

  // Due Date Orders endpoint
  app.get("/api/due-date-orders", jwtRequired, async (req, res) => {
    try {
      const { type, date } = req.query;

      const orders = await storage.listOrders();

      let filteredOrders = orders;

      // Filter by date
      if (type === 'specific' && date) {
        const targetDate = date as string;

        filteredOrders = filteredOrders.filter((order: any) => {
          let dueDateStr = null;
          let pickupDateStr = null;

          const toISTDateString = (dateVal: any) => {
            if (!dateVal) return null;
            try {
              const d = new Date(dateVal);
              const istTime = d.getTime() + (5.5 * 60 * 60 * 1000);
              const result = new Date(istTime).toISOString().split('T')[0];
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
  app.use('/api/public', publicInvoiceRouter);

  // Authentication routes
  app.use('/api/auth', authRouter);
  app.use('/api/debug', debugRouter);
  app.use('/api/whatsapp', whatsappRouter);
  app.use('/api/documents', documentsRouter);

  // Core API routes (registered once)
  app.use('/api/orders', ordersRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/employees', employeesRouter);
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/customers', customersRouter);

  // API v1 routes
  app.use('/api/audit-logs', auditLogsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/credits', creditsRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/deliveries', deliveryDisabledRouter);

  // Initialize the autonomous analytics cron job
  initAnalyticsCron();

  app.use('/api/v1/deliveries', deliveryDisabledRouter);
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
  app.use('/api/business-settings', businessSettingsRouter);

  // Health and Database routes
  app.use('/api/health', healthRouter);
  app.use('/api/database', databaseRouter);

  // PDF upload route
  app.use('/api', pdfRouter);

  // WhatsApp Flow endpoint (public - no auth for Meta webhooks)
  app.use('/api/whatsapp-flow', whatsappFlowRouter);
  // Legacy search and algorithm routes
  app.use('/api/search', searchRouter);
  app.use('/api/algorithms', algorithmsRouter);
}

export { default as ordersRouter } from './orders';
export { default as customersRouter } from './customers';
export { default as deliveriesRouter } from './deliveries';
