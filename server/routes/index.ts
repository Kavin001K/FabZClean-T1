import { Express } from 'express';
import ordersRouter from './orders';
import customersRouter from './customers';
import transitRouter from './transit';
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

/**
 * Register all route modules with the Express app
 */
export function registerAllRoutes(app: Express): void {
  // Authentication routes (no version prefix)
  app.use('/api/auth', authRouter);
  app.use('/api/employees', employeesRouter);

  // API v1 routes
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/customers', customersRouter);
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

  // Health and Database routes
  app.use('/api/health', healthRouter);
  app.use('/api/database', databaseRouter);

  // PDF upload route
  app.use('/api', pdfRouter);

  // Legacy API routes (for backward compatibility)
  app.use('/api/orders', ordersRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/transit', transitRouter);
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
