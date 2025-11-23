import { Express } from 'express';
import ordersRouter from './orders';
import customersRouter from './customers';
import transitRouter from './transit';
import deliveriesRouter from './deliveries';
import driversRouter from './drivers';
import searchRouter from './api/search';
import algorithmsRouter from './api/algorithms';
import websocketMetricsRouter from './api/websocket-metrics';
import authRouter from './auth'; // Employee-based authentication
import employeesRouter from './employees'; // Employee management
import dashboardRouter from './dashboard';
import accountingRouter from './accounting';

import databaseRouter from './database';
import productsRouter from './products';
import servicesRouter from './services';

/**
 * Register all route modules with the Express app
 */
export function registerAllRoutes(app: Express): void {
  // Authentication routes (no version prefix)
  app.use('/api/auth', authRouter);
  app.use('/api/employees', employeesRouter);

  // Database routes
  // app.use('/api', databaseRouter); // Commented out to try explicit mounting

  // Explicitly mount routes to debug 404
  app.get('/api/health/database', async (req, res) => {
    try {
      const { db } = await import('../db');
      await db.getProducts();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        type: process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite'
      });
    } catch (error: any) {
      res.status(500).json({ status: 'unhealthy', error: error.message });
    }
  });

  app.get('/api/database/info', async (req, res) => {
    try {
      res.json({
        type: process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite',
        version: '1.0.0',
        tables: ['users', 'products', 'orders', 'customers', 'employees']
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api/products', productsRouter);
  app.use('/api/services', servicesRouter);

  // API v1 routes
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/customers', customersRouter);
  app.use('/api/v1/transit', transitRouter);
  app.use('/api/v1/deliveries', deliveriesRouter);
  app.use('/api/v1/drivers', driversRouter);

  // Algorithm and search API routes
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/algorithms', algorithmsRouter);
  app.use('/api/v1/websocket', websocketMetricsRouter);

  // Dashboard and Accounting routes
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/accounting', accountingRouter);

  // Legacy API routes (for backward compatibility)
  app.use('/api/orders', ordersRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/transit', transitRouter);
  app.use('/api/deliveries', deliveriesRouter);
  app.use('/api/drivers', driversRouter);

  // Legacy search and algorithm routes
  app.use('/api/search', searchRouter);
  app.use('/api/algorithms', algorithmsRouter);
}

export { default as ordersRouter } from './orders';
export { default as customersRouter } from './customers';
export { default as transitRouter } from './transit';
export { default as deliveriesRouter } from './deliveries';
export { default as driversRouter } from './drivers';
