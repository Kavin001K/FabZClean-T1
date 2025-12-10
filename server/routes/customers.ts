import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import { insertCustomerSchema, type Customer, type Order } from "../../shared/schema";
import {
  jwtRequired,
  validateInput,
  rateLimit,
  requireRole,
} from "../middleware/auth";
import {
  serializeCustomer,
  createPaginatedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../services/serialization";
import { realtimeServer } from "../websocket-server";
import type { UserRole } from "../../shared/supabase";

const router = Router();

const CUSTOMER_EDITOR_ROLES: UserRole[] = [
  "admin",
  "employee",
  "franchise_manager",
];
const CUSTOMER_ADMIN_ROLES: UserRole[] = ["admin", "franchise_manager"];

// Apply rate limiting
router.use(rateLimit(60000, 100));
router.use(jwtRequired);

// Get customers with pagination and search (shared across all franchises)
router.get('/', async (req, res) => {
  try {
    const {
      cursor,
      limit = 20,
      search,
      segment,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Customers are common for all franchises - no isolation needed
    let customers = await storage.listCustomers();

    // Apply search filter
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      customers = customers.filter((customer: Customer) =>
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply segment filter
    if (segment && segment !== 'all') {
      customers = customers.filter((customer: Customer) => {
        const segmentsData = (customer as any).segments;
        if (!segmentsData) return false;
        try {
          const segments = typeof segmentsData === 'string'
            ? JSON.parse(segmentsData)
            : segmentsData;
          return Array.isArray(segments) && segments.includes(segment);
        } catch {
          return false;
        }
      });
    }

    // Apply sorting
    // Apply sorting
    customers.sort((a: any, b: any) => {
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
    const startIndex = cursor ? customers.findIndex((c: Customer) => c.id === cursor) + 1 : 0;
    const endIndex = startIndex + limitNum;

    const paginatedCustomers = customers.slice(startIndex, endIndex);
    const hasMore = endIndex < customers.length;
    const nextCursor = hasMore ? paginatedCustomers[paginatedCustomers.length - 1]?.id : undefined;

    // Serialize customers
    const serializedCustomers = paginatedCustomers.map((customer: Customer) => serializeCustomer(customer));

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
router.post(
  "/",
  requireRole(CUSTOMER_EDITOR_ROLES),
  validateInput(insertCustomerSchema),
  async (req, res) => {
    try {
      const customerData = req.body;

      // Check if customer already exists
      const existingCustomer = await storage.listCustomers();
      const emailExists = existingCustomer.some((c: Customer) => c.email === customerData.email);

      if (emailExists) {
        return res.status(400).json(createErrorResponse('Customer with this email already exists', 400));
      }

      // Check if phone already exists
      if (customerData.phone) {
        const phoneExists = existingCustomer.some((c: Customer) => c.phone === customerData.phone);
        if (phoneExists) {
          return res.status(400).json(createErrorResponse('Customer with this phone number already exists', 400));
        }
      }

      // Ensure address is properly formatted for storage
      // If it's an object (from frontend), keep it as object for Supabase client which handles jsonb
      // If it's a string, it might need parsing or keeping as string depending on storage implementation

      console.log('Creating customer with data:', JSON.stringify(customerData, null, 2));

      const customer = await storage.createCustomer(customerData);

      // Notify real-time clients
      realtimeServer.triggerUpdate('customer', 'created', customer);

      const serializedCustomer = serializeCustomer(customer);
      res.status(201).json(createSuccessResponse(serializedCustomer, 'Customer created successfully'));
    } catch (error: any) {
      console.error('Create customer error details:', error);
      // Return the specific error message from the database/storage if available
      const errorMessage = error.message || 'Failed to create customer';
      res.status(500).json(createErrorResponse(errorMessage, 500));
    }
  },
);

// Update customer
router.put('/:id', requireRole(CUSTOMER_EDITOR_ROLES), async (req, res) => {
  try {
    const customerId = req.params.id;
    const updateData = req.body;

    const customer = await storage.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }

    const updatedCustomer = await storage.updateCustomer(customerId, updateData);

    // Notify real-time clients
    realtimeServer.triggerUpdate('customer', 'updated', updatedCustomer);

    const serializedCustomer = serializeCustomer(updatedCustomer);
    res.json(createSuccessResponse(serializedCustomer, 'Customer updated successfully'));
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json(createErrorResponse('Failed to update customer', 500));
  }
});

// Delete customer
router.delete('/:id', requireRole(CUSTOMER_ADMIN_ROLES), async (req, res) => {
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
    realtimeServer.triggerUpdate('customer', 'deleted', { customerId });

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
    let customerOrders = orders.filter((order: Order) => order.customerId === customerId);

    // Apply status filter
    if (status && status !== 'all') {
      customerOrders = customerOrders.filter((order: Order) => order.status === status);
    }

    // Sort by creation date (newest first)
    customerOrders.sort((a: Order, b: Order) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Apply limit
    const limitNum = parseInt(limit as string) || 20;
    customerOrders = customerOrders.slice(0, limitNum);

    // Serialize orders
    const serializedOrders = customerOrders.map((order: Order) => ({
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
router.get('/analytics/overview', async (req, res) => {
  try {
    const customers = await storage.listCustomers();
    const orders = await storage.listOrders();

    // Calculate customer segments
    // Calculate customer segments
    const segments: Record<string, number> = {};
    customers.forEach((customer: Customer) => {
      const segmentsData = (customer as any).segments;
      if (segmentsData) {
        try {
          const customerSegments = typeof segmentsData === 'string'
            ? JSON.parse(segmentsData)
            : segmentsData;
          if (Array.isArray(customerSegments)) {
            customerSegments.forEach((segment: string) => {
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
      totalPoints: customers.reduce((sum: number, customer: Customer) => sum + (parseInt((customer as any).loyaltyPoints || '0')), 0),
      averagePoints: customers.length > 0
        ? customers.reduce((sum: number, customer: Customer) => sum + (parseInt((customer as any).loyaltyPoints || '0')), 0) / customers.length
        : 0,
      customersWithPoints: customers.filter((c: Customer) => parseInt((c as any).loyaltyPoints || '0') > 0).length
    };

    // Calculate customer lifetime value
    const customerLTV = customers.map((customer: Customer) => {
      const customerOrders = orders.filter((order: Order) => order.customerId === customer.id);
      const totalSpent = customerOrders.reduce((sum: number, order: Order) => sum + parseFloat(order.totalAmount || '0'), 0);
      return {
        customerId: customer.id,
        customerName: customer.name,
        totalSpent,
        orderCount: customerOrders.length
      };
    });

    const analytics = {
      totalCustomers: customers.length,
      newCustomersToday: customers.filter((customer: Customer) => {
        const today = new Date().toISOString().split('T')[0];
        const customerDate = customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : '';
        return customerDate === today;
      }).length,
      segments,
      loyaltyStats,
      topCustomers: customerLTV
        .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
    };

    res.json(createSuccessResponse(analytics));
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch customer analytics', 500));
  }
});

// Update customer segments
router.patch(
  "/:id/segments",
  requireRole(CUSTOMER_ADMIN_ROLES),
  async (req, res) => {
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
      realtimeServer.broadcast({
        type: 'customer_segments_updated',
        data: { customerId, segments }
      });

      const serializedCustomer = serializeCustomer(updatedCustomer);
      res.json(createSuccessResponse(serializedCustomer, 'Customer segments updated successfully'));
    } catch (error) {
      console.error('Update customer segments error:', error);
      res.status(500).json(createErrorResponse('Failed to update customer segments', 500));
    }
  },
);

// Get customer segments list
router.get('/segments/list', async (req, res) => {
  try {
    const customers = await storage.listCustomers();
    const allSegments = new Set<string>();

    customers.forEach((customer: Customer) => {
      const segmentsData = (customer as any).segments;
      if (segmentsData) {
        try {
          const customerSegments = typeof segmentsData === 'string'
            ? JSON.parse(segmentsData)
            : segmentsData;
          if (Array.isArray(customerSegments)) {
            customerSegments.forEach((segment: string) => allSegments.add(segment));
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
