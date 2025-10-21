import { Express } from 'express';
import ordersRouter from './orders';
import customersRouter from './customers';
import transitRouter from './transit';
import deliveriesRouter from './deliveries';
import driversRouter from './drivers';
import searchRouter from './api/search';
import algorithmsRouter from './api/algorithms';
import websocketMetricsRouter from './api/websocket-metrics';

/**
 * Register all route modules with the Express app
 */
export function registerAllRoutes(app: Express): void {
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
