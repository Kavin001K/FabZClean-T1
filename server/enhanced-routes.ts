/**
 * Enhanced Routes with Advanced Algorithms
 * Integrates all optimized algorithms into the FabZClean API
 */

import { Express } from 'express';
import { createServer, Server } from 'http';
import { z } from 'zod';
import { storage } from './storage';
import { realtimeServer } from './websocket-server';
import { loyaltyProgram } from './loyalty-program';
import { insertOrderSchema } from '../shared/schema';

// Import all algorithms
import {
  // Search algorithms
  OrderSearchEngine,
  CustomerSearchEngine,
  ProductSearchEngine,
  AdvancedSearchEngine,
  
  // Sorting algorithms
  SmartSort,
  FabZCleanSort,
  MultiFieldSort,
  
  // Caching algorithms
  cacheManager,
  HybridCache,
  
  // Route algorithms
  FabZCleanRouteOptimizer,
  
  // Pagination algorithms
  FabZCleanPagination,
  HybridPagination,
  
  // Real-time algorithms
  realTimeManager,
  
  // Data structures
  fabzCleanDataStructures,
  
  // Utilities
  AlgorithmUtils
} from './algorithms';

// Enhanced API Routes with Algorithms
export async function registerEnhancedRoutes(app: Express): Promise<Server> {
  
  // Initialize caches
  const orderCache = cacheManager.createCache<any>('orders', {
    maxSize: 1000,
    defaultTTL: 300000, // 5 minutes
    evictionPolicy: 'hybrid',
    enableMetrics: true
  });

  const customerCache = cacheManager.createCache<any>('customers', {
    maxSize: 500,
    defaultTTL: 600000, // 10 minutes
    evictionPolicy: 'lru',
    enableMetrics: true
  });

  const productCache = cacheManager.createCache<any>('products', {
    maxSize: 1000,
    defaultTTL: 900000, // 15 minutes
    evictionPolicy: 'lfu',
    enableMetrics: true
  });

  // Initialize search engines
  let orderSearchEngine = new OrderSearchEngine();
  let customerSearchEngine = new CustomerSearchEngine();
  let productSearchEngine = new ProductSearchEngine();

  // Initialize route optimizer
  const routeOptimizer = new FabZCleanRouteOptimizer();

  // Update search engines with data
  async function updateSearchEngines() {
    try {
      const [orders, customers, products] = await Promise.all([
        storage.listOrders(),
        storage.listCustomers(),
        storage.listProducts()
      ]);

      orderSearchEngine.updateData(orders);
      customerSearchEngine.updateData(customers);
      productSearchEngine.updateData(products);

      // Update data structures
      orders.forEach(order => fabzCleanDataStructures.addOrder(order));
      customers.forEach(customer => fabzCleanDataStructures.addCustomer(customer));
      products.forEach(product => fabzCleanDataStructures.addProduct(product));
    } catch (error) {
      console.error('Failed to update search engines:', error);
    }
  }

  // Initial data load
  await updateSearchEngines();

  // ======= ENHANCED SEARCH ENDPOINTS =======
  app.get('/api/search/orders', async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Query parameter required' });
      }

      const results = orderSearchEngine.searchOrders(q as string, Number(limit));
      res.json(results);
    } catch (error) {
      console.error('Search orders error:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  app.get('/api/search/customers', async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Query parameter required' });
      }

      const results = customerSearchEngine.searchCustomers(q as string, Number(limit));
      res.json(results);
    } catch (error) {
      console.error('Search customers error:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  app.get('/api/search/products', async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Query parameter required' });
      }

      const results = productSearchEngine.searchProducts(q as string, Number(limit));
      res.json(results);
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  // ======= ENHANCED ORDERS API =======
  app.get('/api/orders', async (req, res) => {
    try {
      const { sort, order, page, limit, cursor, filters } = req.query;
      
      // Check cache first
      const cacheKey = `orders-${JSON.stringify(req.query)}`;
      const cached = orderCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const orders = await storage.listOrders();
      
      // Apply sorting
      let sortedOrders = orders;
      if (sort) {
        const sortOptions = {
          field: sort as string,
          direction: (order as 'asc' | 'desc') || 'desc',
          algorithm: 'tim' as const,
          stable: true
        };
        sortedOrders = SmartSort.sort(orders, sortOptions);
      } else {
        // Use FabZClean optimized sorting
        sortedOrders = FabZCleanSort.sortOrders(orders);
      }

      // Apply pagination
      const paginationOptions = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : 20,
        cursor: cursor as string,
        filters: filters ? JSON.parse(filters as string) : undefined
      };

      const result = FabZCleanPagination.paginateOrders(sortedOrders, paginationOptions);
      
      // Cache result
      orderCache.set(cacheKey, result, 300000); // 5 minutes
      
      res.json(result);
    } catch (error) {
      console.error('Fetch orders error:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // ======= ENHANCED CUSTOMERS API =======
  app.get('/api/customers', async (req, res) => {
    try {
      const { sort, order, page, limit, cursor, filters } = req.query;
      
      // Check cache first
      const cacheKey = `customers-${JSON.stringify(req.query)}`;
      const cached = customerCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const customers = await storage.listCustomers();
      
      // Apply sorting
      let sortedCustomers = customers;
      if (sort) {
        const sortOptions = {
          field: sort as string,
          direction: (order as 'asc' | 'desc') || 'desc',
          algorithm: 'tim' as const,
          stable: true
        };
        sortedCustomers = SmartSort.sort(customers, sortOptions);
      } else {
        // Use FabZClean optimized sorting
        sortedCustomers = FabZCleanSort.sortCustomers(customers);
      }

      // Apply pagination
      const paginationOptions = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : 20,
        cursor: cursor as string,
        filters: filters ? JSON.parse(filters as string) : undefined
      };

      const result = FabZCleanPagination.paginateCustomers(sortedCustomers, paginationOptions);
      
      // Cache result
      customerCache.set(cacheKey, result, 600000); // 10 minutes
      
      res.json(result);
    } catch (error) {
      console.error('Fetch customers error:', error);
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });

  // ======= ENHANCED PRODUCTS API =======
  app.get('/api/products', async (req, res) => {
    try {
      const { sort, order, page, limit, cursor, filters } = req.query;
      
      // Check cache first
      const cacheKey = `products-${JSON.stringify(req.query)}`;
      const cached = productCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const products = await storage.listProducts();
      
      // Apply sorting
      let sortedProducts = products;
      if (sort) {
        const sortOptions = {
          field: sort as string,
          direction: (order as 'asc' | 'desc') || 'asc',
          algorithm: 'tim' as const,
          stable: true
        };
        sortedProducts = SmartSort.sort(products, sortOptions);
      } else {
        // Use FabZClean optimized sorting
        sortedProducts = FabZCleanSort.sortProducts(products);
      }

      // Apply pagination
      const paginationOptions = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : 20,
        cursor: cursor as string,
        filters: filters ? JSON.parse(filters as string) : undefined
      };

      const result = FabZCleanPagination.paginateProducts(sortedProducts, paginationOptions);
      
      // Cache result
      productCache.set(cacheKey, result, 900000); // 15 minutes
      
      res.json(result);
    } catch (error) {
      console.error('Fetch products error:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // ======= ROUTE OPTIMIZATION API =======
  app.post('/api/routes/optimize', async (req, res) => {
    try {
      const { orders, drivers, depot } = req.body;
      
      if (!orders || !drivers || !depot) {
        return res.status(400).json({ message: 'Orders, drivers, and depot required' });
      }

      const optimizedRoutes = routeOptimizer.optimizeDeliveryRoutes(orders, drivers, depot);
      const analytics = routeOptimizer.getRouteAnalytics(optimizedRoutes);
      
      res.json({
        routes: optimizedRoutes,
        analytics
      });
    } catch (error) {
      console.error('Route optimization error:', error);
      res.status(500).json({ message: 'Route optimization failed' });
    }
  });

  app.get('/api/routes/analytics', async (req, res) => {
    try {
      const routes = await storage.listDeliveries(); // Assuming this returns routes
      const analytics = routeOptimizer.getRouteAnalytics(routes);
      
      res.json(analytics);
    } catch (error) {
      console.error('Route analytics error:', error);
      res.status(500).json({ message: 'Failed to get route analytics' });
    }
  });

  // ======= REAL-TIME ENDPOINTS =======
  app.get('/api/realtime/analytics', async (req, res) => {
    try {
      const analytics = realTimeManager.getAnalytics();
      const connectionStats = realTimeManager.getConnectionStats();
      
      res.json({
        analytics,
        connections: connectionStats
      });
    } catch (error) {
      console.error('Real-time analytics error:', error);
      res.status(500).json({ message: 'Failed to get real-time analytics' });
    }
  });

  app.post('/api/realtime/notify', async (req, res) => {
    try {
      const { message, target, priority = 'medium' } = req.body;
      
      if (!message || !message.type) {
        return res.status(400).json({ message: 'Message type required' });
      }

      realTimeManager.sendMessage({
        id: `notification-${Date.now()}`,
        type: message.type,
        data: message.data,
        timestamp: Date.now(),
        priority,
        target: target ? [target] : undefined
      }, target);

      res.json({ success: true });
    } catch (error) {
      console.error('Real-time notification error:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  });

  // ======= CACHE MANAGEMENT ENDPOINTS =======
  app.get('/api/cache/stats', async (req, res) => {
    try {
      const globalMetrics = cacheManager.getGlobalMetrics();
      const orderMetrics = orderCache.getMetrics();
      const customerMetrics = customerCache.getMetrics();
      const productMetrics = productCache.getMetrics();
      
      res.json({
        global: globalMetrics,
        orders: orderMetrics,
        customers: customerMetrics,
        products: productMetrics
      });
    } catch (error) {
      console.error('Cache stats error:', error);
      res.status(500).json({ message: 'Failed to get cache stats' });
    }
  });

  app.post('/api/cache/clear', async (req, res) => {
    try {
      const { cache } = req.body;
      
      if (cache) {
        // Clear specific cache
        switch (cache) {
          case 'orders':
            orderCache.clear();
            break;
          case 'customers':
            customerCache.clear();
            break;
          case 'products':
            productCache.clear();
            break;
          default:
            return res.status(400).json({ message: 'Invalid cache name' });
        }
      } else {
        // Clear all caches
        cacheManager.clearAll();
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ message: 'Failed to clear cache' });
    }
  });

  // ======= ALGORITHM PERFORMANCE ENDPOINTS =======
  app.get('/api/algorithms/performance', async (req, res) => {
    try {
      const metrics: { [key: string]: number } = {};
      
      // Benchmark search algorithms
      const orders = await storage.listOrders();
      const customers = await storage.listCustomers();
      const products = await storage.listProducts();
      
      metrics['search.orders'] = AlgorithmUtils.benchmark(
        'Order Search',
        () => orderSearchEngine.searchOrders('test', 20),
        100
      ).averageTime;
      
      metrics['search.customers'] = AlgorithmUtils.benchmark(
        'Customer Search',
        () => customerSearchEngine.searchCustomers('test', 20),
        100
      ).averageTime;
      
      metrics['search.products'] = AlgorithmUtils.benchmark(
        'Product Search',
        () => productSearchEngine.searchProducts('test', 20),
        100
      ).averageTime;
      
      // Benchmark sorting algorithms
      metrics['sort.orders'] = AlgorithmUtils.benchmark(
        'Order Sorting',
        () => FabZCleanSort.sortOrders(orders),
        100
      ).averageTime;
      
      metrics['sort.customers'] = AlgorithmUtils.benchmark(
        'Customer Sorting',
        () => FabZCleanSort.sortCustomers(customers),
        100
      ).averageTime;
      
      metrics['sort.products'] = AlgorithmUtils.benchmark(
        'Product Sorting',
        () => FabZCleanSort.sortProducts(products),
        100
      ).averageTime;
      
      AlgorithmUtils.generatePerformanceReport(metrics);
      
      res.json({
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Performance benchmark error:', error);
      res.status(500).json({ message: 'Failed to run performance benchmarks' });
    }
  });

  // ======= DATA STRUCTURES ENDPOINTS =======
  app.get('/api/data-structures/stats', async (req, res) => {
    try {
      res.json({
        recentOrders: fabzCleanDataStructures.getRecentOrders().length,
        urgentOrders: fabzCleanDataStructures.getUrgentOrdersCount(),
        customers: orderSearchEngine.size(),
        products: productSearchEngine.size()
      });
    } catch (error) {
      console.error('Data structures stats error:', error);
      res.status(500).json({ message: 'Failed to get data structures stats' });
    }
  });

  // ======= ENHANCED ORDER CREATION =======
  app.post('/api/orders', async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);

      // Award loyalty points (only if customerId exists)
      if (order.customerId) {
        await loyaltyProgram.processOrderRewards(
          order.customerId,
          parseFloat(order.totalAmount || "0"),
        );
      }

      // Update search engines and data structures
      orderSearchEngine.addItem(order);
      fabzCleanDataStructures.addOrder(order);
      
      // Clear relevant caches
      orderCache.clear();

      // Trigger real-time update with enhanced message
      const message = {
        id: `order-${order.id}`,
        type: 'order_created',
        data: order,
        timestamp: Date.now(),
        priority: 'high' as const
      };
      
      realTimeManager.sendMessage(message);

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

  // ======= PERIODIC DATA REFRESH =======
  // Update search engines every 5 minutes
  setInterval(async () => {
    try {
      await updateSearchEngines();
      console.log('Search engines updated successfully');
    } catch (error) {
      console.error('Failed to update search engines:', error);
    }
  }, 300000); // 5 minutes

  const httpServer = createServer(app);
  return httpServer;
}
