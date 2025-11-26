import { z } from 'zod';

// Order validation schemas
const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
  serviceId: z.string().optional(),
  notes: z.string().optional()
});

export const insertOrderSchema = z.object({
  orderNumber: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  customerPhone: z.string().min(10, 'Phone number is required'),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  totalAmount: z.union([z.string(), z.number()]).optional(),
  items: z.array(itemSchema).optional(),
  serviceIds: z.array(z.string()).optional(),
  shippingAddress: z.any().optional(),
  advancePaid: z.any().optional(),
  paymentMethod: z.string().optional(),
  discountType: z.string().optional(),
  discountValue: z.any().optional(),
  couponCode: z.string().optional(),
  extraCharges: z.any().optional(),
  pickupDate: z.string().optional(),
  specialInstructions: z.string().optional(),
  total: z.number().positive('Total must be positive').optional()
});

export const updateOrderSchema = z.object({
  status: z.string().optional(),
  pickupDate: z.string().optional(),
  specialInstructions: z.string().optional(),
  total: z.number().positive().optional()
});

// Customer validation schemas
export const insertCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number is required'),
  address: z.any().optional(), // Allow object for jsonb field
  notes: z.string().optional(),
  loyaltyPoints: z.string().optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional()
});

// Driver validation schemas
export const insertDriverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email().optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  vehicleType: z.string().min(1, 'Vehicle type is required')
});

export const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  licenseNumber: z.string().min(1).optional(),
  vehicleNumber: z.string().min(1).optional(),
  vehicleType: z.string().min(1).optional(),
  status: z.enum(['available', 'busy', 'offline']).optional()
});

// Delivery validation schemas
export const insertDeliverySchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  driverId: z.string().min(1, 'Driver ID is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  scheduledPickup: z.string().optional(),
  scheduledDelivery: z.string().optional()
});

export const updateDeliverySchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'failed']).optional(),
  actualPickup: z.string().optional(),
  actualDelivery: z.string().optional()
});

// Transit batch validation schemas
export const insertTransitBatchSchema = z.object({
  type: z.enum(['pickup', 'delivery', 'transfer']),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  driverId: z.string().min(1, 'Driver ID is required'),
  orderIds: z.array(z.string()).min(1, 'At least one order is required')
});

export const updateTransitBatchSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'completed', 'cancelled']).optional(),
  actualStart: z.string().optional(),
  actualEnd: z.string().optional()
});

// Search validation schemas
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['orders', 'customers', 'products']).optional(),
  fuzzy: z.boolean().optional(),
  limit: z.number().int().positive().max(100).optional()
});

// Pagination validation schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Route optimization validation schemas
export const routeOptimizationSchema = z.object({
  deliveryIds: z.array(z.string()).min(1, 'At least one delivery is required'),
  driverLocation: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
});

// Cache management validation schemas
export const cacheInvalidationSchema = z.object({
  cacheName: z.string().min(1, 'Cache name is required'),
  pattern: z.string().optional()
});
