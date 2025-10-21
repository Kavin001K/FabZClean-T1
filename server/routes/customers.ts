import { Router } from 'express';
import { z } from 'zod';
import { db as storage } from '../db';
import { insertCustomerSchema } from '../schema';
import { 
  adminLoginRequired, 
  jwtRequired, 
  validateInput,
  rateLimit 
} from '../middleware/auth';
import { 
  serializeCustomer, 
  createPaginatedResponse, 
  createErrorResponse,
  createSuccessResponse 
} from '../services/serialization';
import { realtimeServer } from '../websocket-server';

const router = Router();

// Apply rate limiting
router.use(rateLimit(60000, 100));

// Get customers with pagination and search
router.get('/', adminLoginRequired, async (req, res) => {
  try {
    const { 
      cursor, 
      limit = 20, 
      search, 
      segment,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let customers = await storage.listCustomers();

    // Apply search filter
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      customers = customers.filter(customer => 
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply segment filter
    if (segment && segment !== 'all') {
      customers = customers.filter(customer => {
        if (!customer.segments) return false;
        try {
          const segments = typeof customer.segments === 'string' 
            ? JSON.parse(customer.segments) 
            : customer.segments;
          return Array.isArray(segments) && segments.includes(segment);
        } catch {
          return false;
        }
      });
    }

    // Apply sorting
    customers.sort((a, b) => {
      const aValue = a[sortBy as string];
      const bValue = b[sortBy as string];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const limitNum = parseInt(limit as string) || 20;
    const startIndex = cursor ? customers.findIndex(c => c.id === cursor) + 1 : 0;
    const endIndex = startIndex + limitNum;
    
    const paginatedCustomers = customers.slice(startIndex, endIndex);
    const hasMore = endIndex < customers.length;
    const nextCursor = hasMore ? paginatedCustomers[paginatedCustomers.length - 1]?.id : undefined;

    // Serialize customers
    const serializedCustomers = paginatedCustomers.map(customer => serializeCustomer(customer));

    // Return paginated response
    const response = createPaginatedResponse(serializedCustomers, {
      cursor: nextCursor,
      hasMore,
      total: customers.length,
      limit: limitNum
    });

    res.json(response);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch customers', 500));
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await storage.getCustomer(req.params.id);
    
    if (!customer) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }

    const serializedCustomer = serializeCustomer(customer);
    res.json(createSuccessResponse(serializedCustomer));
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch customer', 500));
  }
});

// Create new customer
router.post('/', validateInput(insertCustomerSchema), async (req, res) => {
  try {
    const customerData = req.body;

    // Check if customer already exists
    const existingCustomer = await storage.listCustomers();
    const emailExists = existingCustomer.some(c => c.email === customerData.email);

    if (emailExists) {
      return res.status(400).json(createErrorResponse('Customer with this email already exists', 400));
    }

    const customer = await storage.createCustomer(customerData);

    // Notify real-time clients
    realtimeServer.triggerUpdate('customers', 'created', customer);

    const serializedCustomer = serializeCustomer(customer);
    res.status(201).json(createSuccessResponse(serializedCustomer, 'Customer created successfully'));
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json(createErrorResponse('Failed to create customer', 500));
  }
});

// Update customer
router.put('/:id', adminLoginRequired, async (req, res) => {
  try {
    const customerId = req.params.id;
    const updateData = req.body;

    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }

    const updatedCustomer = await storage.updateCustomer(customerId, updateData);

    // Notify real-time clients
    realtimeServer.triggerUpdate('customers', 'updated', updatedCustomer);

    const serializedCustomer = serializeCustomer(updatedCustomer);
    res.json(createSuccessResponse(serializedCustomer, 'Customer updated successfully'));
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json(createErrorResponse('Failed to update customer', 500));
  }
});

// Delete customer (admin only)
router.delete('/:id', adminLoginRequired, async (req, res) => {
  try {
    const customerId = req.params.id;

    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }

    const deleted = await storage.deleteCustomer(customerId);

    if (!deleted) {
      return res.status(500).json(createErrorResponse('Failed to delete customer', 500));
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('customers', 'deleted', { customerId });

    res.json(createSuccessResponse(null, 'Customer deleted successfully'));
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json(createErrorResponse('Failed to delete customer', 500));
  }
});

// Get customer orders
router.get('/:id/orders', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { limit = 20, status } = req.query;

    const orders = await storage.listOrders();
    let customerOrders = orders.filter(order => order.customerId === customerId);

    // Apply status filter
    if (status && status !== 'all') {
      customerOrders = customerOrders.filter(order => order.status === status);
    }

    // Sort by creation date (newest first)
    customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply limit
    const limitNum = parseInt(limit as string) || 20;
    customerOrders = customerOrders.slice(0, limitNum);

    // Serialize orders
    const serializedOrders = customerOrders.map(order => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      service: order.service ? order.service.split(',').filter(Boolean) : []
    }));

    res.json(createSuccessResponse(serializedOrders));
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch customer orders', 500));
  }
});

// Get customer analytics
router.get('/analytics/overview', adminLoginRequired, async (req, res) => {
  try {
    const customers = await storage.listCustomers();
    const orders = await storage.listOrders();

    // Calculate customer segments
    const segments: Record<string, number> = {};
    customers.forEach(customer => {
      if (customer.segments) {
        try {
          const customerSegments = typeof customer.segments === 'string' 
            ? JSON.parse(customer.segments) 
            : customer.segments;
          if (Array.isArray(customerSegments)) {
            customerSegments.forEach(segment => {
              segments[segment] = (segments[segment] || 0) + 1;
            });
          }
        } catch {
          // Ignore invalid segments
        }
      }
    });

    // Calculate loyalty points distribution
    const loyaltyStats = {
      totalPoints: customers.reduce((sum, customer) => sum + (parseInt(customer.loyaltyPoints || '0')), 0),
      averagePoints: customers.length > 0 
        ? customers.reduce((sum, customer) => sum + (parseInt(customer.loyaltyPoints || '0')), 0) / customers.length 
        : 0,
      customersWithPoints: customers.filter(c => parseInt(c.loyaltyPoints || '0') > 0).length
    };

    // Calculate customer lifetime value
    const customerLTV = customers.map(customer => {
      const customerOrders = orders.filter(order => order.customerId === customer.id);
      const totalSpent = customerOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0);
      return {
        customerId: customer.id,
        customerName: customer.name,
        totalSpent,
        orderCount: customerOrders.length
      };
    });

    const analytics = {
      totalCustomers: customers.length,
      newCustomersToday: customers.filter(customer => {
        const today = new Date().toISOString().split('T')[0];
        return customer.createdAt.startsWith(today);
      }).length,
      segments,
      loyaltyStats,
      topCustomers: customerLTV
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
    };

    res.json(createSuccessResponse(analytics));
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch customer analytics', 500));
  }
});

// Update customer segments
router.patch('/:id/segments', adminLoginRequired, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { segments } = req.body;

    if (!Array.isArray(segments)) {
      return res.status(400).json(createErrorResponse('Segments must be an array', 400));
    }

    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }

    const updatedCustomer = await storage.updateCustomer(customerId, { segments });

    // Notify real-time clients
    realtimeServer.triggerUpdate('customers', 'segments_updated', {
      customerId,
      segments
    });

    const serializedCustomer = serializeCustomer(updatedCustomer);
    res.json(createSuccessResponse(serializedCustomer, 'Customer segments updated successfully'));
  } catch (error) {
    console.error('Update customer segments error:', error);
    res.status(500).json(createErrorResponse('Failed to update customer segments', 500));
  }
});

// Get customer segments list
router.get('/segments/list', adminLoginRequired, async (req, res) => {
  try {
    const customers = await storage.listCustomers();
    const allSegments = new Set<string>();

    customers.forEach(customer => {
      if (customer.segments) {
        try {
          const customerSegments = typeof customer.segments === 'string' 
            ? JSON.parse(customer.segments) 
            : customer.segments;
          if (Array.isArray(customerSegments)) {
            customerSegments.forEach(segment => allSegments.add(segment));
          }
        } catch {
          // Ignore invalid segments
        }
      }
    });

    const segmentsList = Array.from(allSegments).sort();
    res.json(createSuccessResponse(segmentsList));
  } catch (error) {
    console.error('Get customer segments error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch customer segments', 500));
  }
});

export default router;
