import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import { insertCustomerSchema, type Customer, type Order } from "../../shared/schema";
import { normalizePhoneForComparison, parseCustomerPhones, sanitizePhoneForStorage } from "../../shared/customer-phone";
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
import { AuthService } from "../auth-service";
import type { UserRole } from "../../shared/supabase";

const router = Router();

const CUSTOMER_EDITOR_ROLES: string[] = [
  "admin",
  "employee",
  "franchise_manager",
];
const CUSTOMER_ADMIN_ROLES: string[] = ["admin", "franchise_manager"];

const normalizePhone = (value?: string | null) => normalizePhoneForComparison(value);
const toNumeric = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const splitRawPhoneInput = (value?: string | null) =>
  String(value || "")
    .split(/[,\n;]+/)
    .map((part) => sanitizePhoneForStorage(part))
    .filter(Boolean);

function normalizeCustomerPhonePayload(payload: Record<string, unknown>) {
  const hasPhoneField = Object.prototype.hasOwnProperty.call(payload, 'phone');
  const hasSecondaryField = Object.prototype.hasOwnProperty.call(payload, 'secondaryPhone');
  if (!hasPhoneField && !hasSecondaryField) {
    return payload;
  }

  const rawTokens = [
    ...splitRawPhoneInput(payload.phone as string | null | undefined),
    ...splitRawPhoneInput(payload.secondaryPhone as string | null | undefined),
  ];

  const dedupedTokens = rawTokens.filter((token, index) => {
    const key = normalizePhone(token) || token;
    return rawTokens.findIndex((candidate) => (normalizePhone(candidate) || candidate) === key) === index;
  });

  if (dedupedTokens.length > 2) {
    throw new Error('Please provide at most two phone numbers');
  }

  const parsedPhones = parseCustomerPhones(dedupedTokens.join(", "));
  if (parsedPhones.primaryPhone && !normalizePhone(parsedPhones.primaryPhone)) {
    throw new Error('Primary phone number is invalid');
  }
  if (parsedPhones.secondaryPhone && !normalizePhone(parsedPhones.secondaryPhone)) {
    throw new Error('Secondary phone number is invalid');
  }
  if (
    parsedPhones.primaryPhone &&
    parsedPhones.secondaryPhone &&
    normalizePhone(parsedPhones.primaryPhone) === normalizePhone(parsedPhones.secondaryPhone)
  ) {
    throw new Error('Primary and secondary phone numbers must be different');
  }

  return {
    ...payload,
    phone: parsedPhones.primaryPhone || null,
    secondaryPhone: parsedPhones.secondaryPhone,
  };
}

type CustomerFeedbackSummary = {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  rating: number;
  feedback: string | null;
  feedbackDate: string | null;
  feedbackTime: string | null;
  createdAt: string | null;
  aiSentiment: string | null;
  feedbackStatus: string | null;
};

type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string | number | null;
  createdAt: string | null;
  items: unknown[] | null;
  rating: number | null;
  feedback: string | null;
  feedbackDate: string | null;
  feedbackTime: string | null;
};

type RecoveredCustomerContact = {
  customer: Customer;
  matchedOrders: Order[];
};

const getOrderTimestamp = (order: Order) => {
  const dateValue = (order.updatedAt || order.createdAt) as string | Date | null | undefined;
  return dateValue ? new Date(dateValue).getTime() : 0;
};

const getDistinctOrderPhones = (order: Order) => {
  const rawPhones = [
    sanitizePhoneForStorage(order.customerPhone as string | null | undefined),
    sanitizePhoneForStorage((order as any).secondaryPhone as string | null | undefined),
  ].filter(Boolean);

  return rawPhones.filter((phone, index) => {
    const normalized = normalizePhone(phone) || phone;
    return rawPhones.findIndex((candidate) => (normalizePhone(candidate) || candidate) === normalized) === index;
  });
};

const findOrdersRelatedToCustomer = (customer: Customer, orders: Order[]) => {
  const primaryPhone = normalizePhone(customer.phone);
  const secondaryPhone = normalizePhone((customer as any).secondaryPhone);

  return orders
    .filter((order) => {
      if (order.customerId && order.customerId === customer.id) return true;

      const orderPhones = getDistinctOrderPhones(order).map((phone) => normalizePhone(phone)).filter(Boolean);
      return Boolean(
        (primaryPhone && orderPhones.includes(primaryPhone)) ||
        (secondaryPhone && orderPhones.includes(secondaryPhone))
      );
    })
    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
};

async function ensureCustomerHasRecoveredPhone(customer: Customer, candidateOrders?: Order[]): Promise<RecoveredCustomerContact> {
  const matchedOrders = findOrdersRelatedToCustomer(customer, candidateOrders || await storage.listOrders());

  const currentPrimary = normalizePhone(customer.phone);
  const currentSecondary = normalizePhone((customer as any).secondaryPhone);
  const updates: Record<string, string | null> = {};

  for (const order of matchedOrders) {
    const [orderPrimary, orderSecondary] = getDistinctOrderPhones(order);
    const normalizedPrimary = normalizePhone(orderPrimary);
    const normalizedSecondary = normalizePhone(orderSecondary);

    if (!currentPrimary && !updates.phone && orderPrimary && normalizedPrimary) {
      updates.phone = orderPrimary;
    }

    const nextPrimaryNormalized = normalizePhone((updates.phone as string | undefined) || customer.phone);
    const secondaryCandidate = orderSecondary && normalizedSecondary &&
      normalizedSecondary !== nextPrimaryNormalized &&
      normalizedSecondary !== currentSecondary
      ? orderSecondary
      : null;

    if (!currentSecondary && !updates.secondaryPhone && secondaryCandidate) {
      updates.secondaryPhone = secondaryCandidate;
    }

    if (updates.phone && (currentSecondary || updates.secondaryPhone)) {
      break;
    }
  }

  if (!updates.phone && !updates.secondaryPhone) {
    return { customer, matchedOrders };
  }

  try {
    const updatedCustomer = await storage.updateCustomer(customer.id, {
      ...(updates.phone ? { phone: updates.phone } : {}),
      ...(updates.secondaryPhone ? { secondaryPhone: updates.secondaryPhone } : {}),
    });

    return {
      customer: (updatedCustomer || {
        ...customer,
        ...updates,
      }) as Customer,
      matchedOrders,
    };
  } catch (error: any) {
    if (error?.message?.includes('duplicate key value violates unique constraint')) {
      // Gracefully ignore conflicts without a loud error trace
      console.log(`ℹ️ [Recovery] Skipped phone recovery for ${customer.id} due to phone number conflict.`);
      return { customer, matchedOrders };
    }
    console.error(`Customer contact recovery failed for ${customer.id}:`, error.message || error);
    return {
      customer,
      matchedOrders,
    };
  }
}

async function findCustomerByExactEmail(email?: string | null, excludeCustomerId?: string) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  const { data: candidates } = await storage.listCustomers(undefined, {
    search: normalizedEmail,
    limit: 100,
  });

  return candidates.find((customer: Customer) => {
    if (excludeCustomerId && customer.id === excludeCustomerId) return false;
    return String(customer.email || '').trim().toLowerCase() === normalizedEmail;
  }) || null;
}

async function findCustomerByExactPhone(phone?: string | null, excludeCustomerId?: string) {
  const normalizedTarget = normalizePhone(phone);
  if (!normalizedTarget) return null;

  const { data: candidates } = await storage.listCustomers(undefined, {
    search: phone,
    limit: 100,
  });

  return candidates.find((customer: Customer) => {
    if (excludeCustomerId && customer.id === excludeCustomerId) return false;

    const customerPhones = [
      customer.phone,
      (customer as any).secondaryPhone,
    ].map((value) => normalizePhone(value)).filter(Boolean);

    return customerPhones.includes(normalizedTarget);
  }) || null;
}

function calculateWeightedCustomerRating(customerRatings: number[], globalAverage: number, priorWeight = 5): number | null {
  if (!customerRatings.length) return null;

  const reviewCount = customerRatings.length;
  const customerAverage = customerRatings.reduce((sum, rating) => sum + rating, 0) / reviewCount;
  const smoothed = ((customerAverage * reviewCount) + (globalAverage * priorWeight)) / (reviewCount + priorWeight);

  return Number(smoothed.toFixed(2));
}

// Apply rate limiting
router.use(rateLimit(60000, 100));
router.use(jwtRequired);

// High-performance autocomplete endpoint (must be before /:id to avoid route conflicts)
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = '10' } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string) || 10, 1), 25);
    const searchQuery = typeof q === 'string' ? q.trim() : '';

    let results: Customer[];
    
    // If empty query, just return recent customers
    if (searchQuery.length === 0) {
      const { data: results } = await storage.listCustomers(undefined, {
        limit: limitNum,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      const hydratedResults = await Promise.all(results.map(async (customer: Customer) => {
        if (customer.phone && (customer as any).secondaryPhone) return customer;
        const recovered = await ensureCustomerHasRecoveredPhone(customer);
        return recovered.customer;
      }));
      const serializedCustomers = hydratedResults.map((customer: Customer) => serializeCustomer(customer));
      return res.json(createSuccessResponse(serializedCustomers, 'Recent customers'));
    }

    // Use the optimized RPC-based autocomplete if available
    if (typeof (storage as any).searchCustomersAutocomplete === 'function') {
      results = await (storage as any).searchCustomersAutocomplete(searchQuery, limitNum);
    } else {
      // Fallback to standard search
      const { data: searchResults } = await storage.listCustomers(undefined, {
        search: searchQuery,
        limit: limitNum,
      });
      results = searchResults;
    }

    let hydratedResults = results;
    const customersNeedingRecovery = results.filter((customer: Customer) => !customer.phone);
    if (customersNeedingRecovery.length > 0) {
      const allOrders = await storage.listOrders();
      const recoveredById = new Map<string, Customer>();

      await Promise.all(customersNeedingRecovery.map(async (customer: Customer) => {
        const recovered = await ensureCustomerHasRecoveredPhone(customer, allOrders);
        recoveredById.set(customer.id, recovered.customer);
      }));

      hydratedResults = results.map((customer: Customer) => recoveredById.get(customer.id) || customer);
    }

    const serializedCustomers = hydratedResults.map((customer: Customer) => serializeCustomer(customer));
    res.json(createSuccessResponse(serializedCustomers, 'Autocomplete results'));
  } catch (error) {
    console.error('Customer autocomplete error:', error);
    res.status(500).json(createErrorResponse('Autocomplete search failed', 500));
  }
});

// Get customers with pagination and search (shared across all franchises)
router.get('/', async (req, res) => {
  try {
    const {
      cursor,
      limit = 20,
      search,
      phone,
      segment,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Use database-level filtering for search-heavy paths to avoid loading the
    // entire customer base into the UI during order creation/autocomplete.
    const pageNum = parseInt(req.query.page as string) || 1;
    const rawLimit = parseInt(limit as string) || 50;
    const limitNum = Math.min(rawLimit, 1000); // Cap to Supabase safe max

    console.log(`[GET /api/customers] page=${pageNum} limit=${limitNum} search=${search || '(none)'} sortBy=${sortBy}`);

    // Use database-level filtering and pagination
    const { data: customers, totalCount } = await storage.listCustomers(undefined, {
      search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      page: pageNum,
      limit: limitNum
    });

    let hydratedCustomers = customers;
    const customersNeedingRecovery = customers.filter((customer: Customer) => !customer.phone);
    if (customersNeedingRecovery.length > 0) {
      const allOrders = await storage.listOrders();
      const recoveredById = new Map<string, Customer>();

      await Promise.all(customersNeedingRecovery.map(async (customer: Customer) => {
        const recovered = await ensureCustomerHasRecoveredPhone(customer, allOrders);
        recoveredById.set(customer.id, recovered.customer);
      }));

      hydratedCustomers = customers.map((customer: Customer) => recoveredById.get(customer.id) || customer);
    }

    // Apply segment filter (if still needed on results, though ideally handled in DB)
    let filteredCustomers = hydratedCustomers;
    if (segment && segment !== 'all') {
      filteredCustomers = hydratedCustomers.filter((customer: Customer) => {
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

    // Return paginated response
    const hasMore = (pageNum * limitNum) < totalCount;
    const nextCursor = hasMore ? filteredCustomers[filteredCustomers.length - 1]?.id : undefined;

    // Serialize customers
    const serializedCustomers = filteredCustomers.map((customer: Customer) => serializeCustomer(customer));

    // Return paginated response
    const response = createPaginatedResponse(serializedCustomers, {
      cursor: nextCursor,
      hasMore,
      page: pageNum,
      limit: limitNum,
      total: totalCount
    });

    // Add totalCount at top level for frontend compatibility
    res.json({ ...response, totalCount });
  } catch (error: any) {
    console.error('Get customers error:', error.message, error.stack);
    res.status(500).json(createErrorResponse(`Failed to fetch customers: ${error.message}`, 500));
  }
});

// Get single customer
router.get('/:id/profile', async (req, res) => {
  try {
    const customerRecord = await storage.getCustomer(req.params.id);

    if (!customerRecord) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }

    const allOrders = await storage.listOrders();
    const { customer, matchedOrders } = await ensureCustomerHasRecoveredPhone(customerRecord, allOrders);

    const orderLookup = new Map(
      matchedOrders.map((order: Order) => [order.id, order] as const)
    );

    const supabase = (storage as any).supabase;
    let feedbackHistory: CustomerFeedbackSummary[] = [];
    let globalRatings: number[] = [];

    if (supabase) {
      try {
        const orderIds = matchedOrders.map((order: Order) => order.id).filter(Boolean);

        const [reviewsByCustomer, reviewsByOrders, globalReviewRatings] = await Promise.all([
          supabase
            .from('reviews_table')
            .select('id,order_id,rating,feedback,created_at,ai_sentiment,feedback_status')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false }),
          orderIds.length > 0
            ? supabase
                .from('reviews_table')
                .select('id,order_id,rating,feedback,created_at,ai_sentiment,feedback_status')
                .in('order_id', orderIds)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from('reviews_table')
            .select('rating')
            .not('rating', 'is', null),
        ]);

        const mergedReviews = new Map<string, any>();
        [...(reviewsByCustomer.data || []), ...(reviewsByOrders.data || [])].forEach((review: any) => {
          const key = review.id || review.order_id;
          if (!key) return;
          if (!mergedReviews.has(key)) {
            mergedReviews.set(key, review);
          }
        });

        feedbackHistory = Array.from(mergedReviews.values()).map((review: any) => {
          const order = review.order_id ? orderLookup.get(review.order_id) : undefined;
          return {
            id: review.id,
            orderId: review.order_id || null,
            orderNumber: order?.orderNumber || null,
            rating: toNumeric(review.rating),
            feedback: review.feedback || null,
            feedbackDate: null,
            feedbackTime: null,
            createdAt: review.created_at || null,
            aiSentiment: review.ai_sentiment || null,
            feedbackStatus: review.feedback_status || null,
          };
        });

        globalRatings = (globalReviewRatings.data || [])
          .map((row: any) => toNumeric(row.rating))
          .filter((rating: number) => rating > 0);
      } catch (error) {
        console.error('Customer profile review aggregation failed:', error);
      }
    }

    const reviewOrderIds = new Set(feedbackHistory.map((entry) => entry.orderId).filter(Boolean));

    const fallbackFeedback = matchedOrders
      .filter((order: any) => toNumeric(order.rating) > 0 && !reviewOrderIds.has(order.id))
      .map((order: any) => ({
        id: `order-${order.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber || null,
        rating: toNumeric(order.rating),
        feedback: order.feedback || null,
        feedbackDate: order.feedbackDate || null,
        feedbackTime: order.feedbackTime || null,
        createdAt: order.updatedAt || order.createdAt || null,
        aiSentiment: order.aiSentiment || null,
        feedbackStatus: order.feedbackStatus || null,
      }));

    const combinedFeedbackHistory = [...feedbackHistory, ...fallbackFeedback].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const feedbackByOrderId = new Map(
      combinedFeedbackHistory
        .filter((entry) => entry.orderId)
        .map((entry) => [entry.orderId as string, entry] as const)
    );

    const recentOrders: CustomerOrderSummary[] = matchedOrders.slice(0, 10).map((order: any) => {
      const linkedFeedback = feedbackByOrderId.get(order.id);
      return {
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        status: order.status || 'unknown',
        totalAmount: order.totalAmount ?? null,
        createdAt: order.createdAt || null,
        items: Array.isArray(order.items) ? order.items : null,
        rating: linkedFeedback?.rating ?? (toNumeric(order.rating) > 0 ? toNumeric(order.rating) : null),
        feedback: linkedFeedback?.feedback ?? order.feedback ?? null,
        feedbackDate: linkedFeedback?.feedbackDate ?? order.feedbackDate ?? null,
        feedbackTime: linkedFeedback?.feedbackTime ?? order.feedbackTime ?? null,
      };
    });

    const customerRatings = combinedFeedbackHistory
      .map((entry) => entry.rating)
      .filter((rating) => rating > 0);

    const fallbackGlobalAverage = customerRatings.length
      ? customerRatings.reduce((sum, rating) => sum + rating, 0) / customerRatings.length
      : 0;

    const globalAverage = globalRatings.length
      ? globalRatings.reduce((sum, rating) => sum + rating, 0) / globalRatings.length
      : fallbackGlobalAverage;

    const rawAverageRating = customerRatings.length
      ? Number((customerRatings.reduce((sum, rating) => sum + rating, 0) / customerRatings.length).toFixed(2))
      : null;

    const customerRating = calculateWeightedCustomerRating(customerRatings, globalAverage || rawAverageRating || 0);

    const positiveReviews = combinedFeedbackHistory.filter((entry) => entry.aiSentiment === 'positive').length;
    const neutralReviews = combinedFeedbackHistory.filter((entry) => entry.aiSentiment === 'neutral').length;
    const negativeReviews = combinedFeedbackHistory.filter((entry) => entry.aiSentiment === 'negative').length;

    res.json(createSuccessResponse({
      customer: serializeCustomer(customer),
      customerRating: customerRating ?? (customer as any).customerRating ?? null,
      rawAverageRating,
      reviewCount: customerRatings.length,
      positiveReviews,
      neutralReviews,
      negativeReviews,
      recentOrders,
      feedbackHistory: combinedFeedbackHistory,
    }));
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch customer profile details', 500));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customerRecord = await storage.getCustomer(req.params.id);

    if (!customerRecord) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }

    const { customer } = await ensureCustomerHasRecoveredPhone(customerRecord);
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
      const customerData = normalizeCustomerPhonePayload(req.body);

      if (!customerData.phone) {
        return res.status(400).json(createErrorResponse('Primary phone number is required', 400));
      }

      const conflictingEmailCustomer = await findCustomerByExactEmail(customerData.email as string | null | undefined);
      if (conflictingEmailCustomer) {
        return res.status(400).json(createErrorResponse('Customer with this email already exists', 400));
      }

      const conflictingPrimaryPhone = await findCustomerByExactPhone(customerData.phone as string | null | undefined);
      if (conflictingPrimaryPhone) {
        return res.status(400).json(createErrorResponse('Customer with this phone number already exists', 400));
      }

      const conflictingSecondaryPhone = await findCustomerByExactPhone(customerData.secondaryPhone as string | null | undefined);
      if (conflictingSecondaryPhone) {
        return res.status(400).json(createErrorResponse('Customer with this secondary phone number already exists', 400));
      }

      // Ensure address is properly formatted for storage
      // If it's an object (from frontend), keep it as object for Supabase client which handles jsonb
      // If it's a string, it might need parsing or keeping as string depending on storage implementation

      console.log('Creating customer with data:', JSON.stringify(customerData, null, 2));

      const customer = await storage.createCustomer(customerData);

      // Notify real-time clients
      realtimeServer.triggerUpdate('customer', 'created', customer);

      // Log action
      if ((req as any).employee) {
        await AuthService.logAction(
          (req as any).employee.employeeId,
          (req as any).employee.username,
          'create_customer',
          'customer',
          customer.id,
          {
            name: customer.name,
            phone: customer.phone
          },
          req.ip || req.connection.remoteAddress,
          req.get('user-agent')
        );
      }

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

// Update customer (Support both PUT and PATCH for compatibility)
const updateCustomerHandler = async (req: any, res: any) => {
  try {
    const customerId = req.params.id;
    const updateData = normalizeCustomerPhonePayload(req.body);

    const existingCustomer = await storage.getCustomer(customerId);
    if (!existingCustomer) {
      return res.status(404).json(createErrorResponse('Customer not found', 404));
    }

    const recoveryResult: RecoveredCustomerContact = !existingCustomer.phone
      ? await ensureCustomerHasRecoveredPhone(existingCustomer)
      : { customer: existingCustomer, matchedOrders: [] };
    const { customer } = recoveryResult;

    if (Object.prototype.hasOwnProperty.call(updateData, 'phone') && !updateData.phone) {
      return res.status(400).json(createErrorResponse('Primary phone number is required', 400));
    }

    const effectivePrimaryPhone = sanitizePhoneForStorage(
      (updateData.phone as string | null | undefined) || customer.phone
    );
    if (!effectivePrimaryPhone) {
      return res.status(400).json(createErrorResponse('Customer must have a primary phone number', 400));
    }

    const conflictingPrimaryPhone = await findCustomerByExactPhone(updateData.phone as string | null | undefined, customerId);
    if (conflictingPrimaryPhone) {
      return res.status(400).json(createErrorResponse('Customer with this phone number already exists', 400));
    }

    const conflictingSecondaryPhone = await findCustomerByExactPhone(updateData.secondaryPhone as string | null | undefined, customerId);
    if (conflictingSecondaryPhone) {
      return res.status(400).json(createErrorResponse('Customer with this secondary phone number already exists', 400));
    }

    const conflictingEmailCustomer = await findCustomerByExactEmail(updateData.email as string | null | undefined, customerId);
    if (conflictingEmailCustomer) {
      return res.status(400).json(createErrorResponse('Customer with this email already exists', 400));
    }

    const updatedCustomer = await storage.updateCustomer(customerId, updateData);

    // Notify real-time clients
    realtimeServer.triggerUpdate('customer', 'updated', updatedCustomer);

    // Log action
    if ((req as any).employee) {
      await AuthService.logAction(
        (req as any).employee.employeeId,
        (req as any).employee.username,
        'update_customer',
        'customer',
        customerId,
        {
          updateData
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    const serializedCustomer = serializeCustomer(updatedCustomer);
    res.json(createSuccessResponse(serializedCustomer, 'Customer updated successfully'));
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json(createErrorResponse('Failed to update customer', 500));
  }
};

router.put('/:id', requireRole(CUSTOMER_EDITOR_ROLES), updateCustomerHandler);
router.patch('/:id', requireRole(CUSTOMER_EDITOR_ROLES), updateCustomerHandler);

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

    // Log action
    if ((req as any).employee) {
      await AuthService.logAction(
        (req as any).employee.employeeId,
        (req as any).employee.username,
        'delete_customer',
        'customer',
        customerId,
        {},
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

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

// Get customer wallet transaction history
router.get('/:id/wallet-history', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { limit = 50 } = req.query;
    const limitNum = parseInt(limit as string) || 50;

    const db = (storage as any);
    if (typeof db.getWalletHistory === 'function') {
      const transactions = await db.getWalletHistory(customerId, limitNum);
      return res.json(createSuccessResponse(transactions));
    }

    if (db.supabase) {
      const { data, error } = await db.supabase
        .from('wallet_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limitNum);

      if (error) {
        console.error('Get wallet history supabase error:', error);
        return res.json(createSuccessResponse([]));
      }

      const transactions = (data || []).map((row: any) => ({
        id: row.id,
        type: row.transaction_type || 'UNKNOWN',
        amount: row.amount,
        balanceAfter: row.balance_after,
        paymentMethod: row.payment_method,
        orderId: row.order_id,
        note: row.note || row.notes || '',
        createdAt: row.created_at,
        transactionDate: row.created_at,
      }));

      return res.json(createSuccessResponse(transactions));
    }

    return res.json(createSuccessResponse([]));
  } catch (error) {
    console.error('Get customer wallet history error:', error);
    res.json(createSuccessResponse([]));
  }
});

// Get customer analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    // Use efficient server-side COUNT queries — never loads all rows into memory.
    // Previously this called listCustomers() which defaulted to limit:50, causing
    // totalCustomers and newCustomersPastMonth to both show 50 instead of the real counts.
    const [counts, recentCustomersRes] = await Promise.all([
      storage.getCustomerAnalyticsStats(),
      storage.listCustomers(undefined, { limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
    ]);

    const analytics = {
      totalCustomers: counts.totalCustomers,
      newCustomersToday: counts.newCustomersToday,
      newCustomersPastWeek: counts.newCustomersPastWeek,
      newCustomersPastMonth: counts.newCustomersPastMonth,
      activeCustomers: counts.activeCustomers,
      // Growth velocity: what % of total base joined in the last 30 days
      growthVelocityPct: counts.totalCustomers > 0
        ? parseFloat(((counts.newCustomersPastMonth / counts.totalCustomers) * 100).toFixed(2))
        : 0,
      // Recently joined customers for the widget list (real data, newest first)
      recentCustomers: recentCustomersRes.data.slice(0, 5).map((c: Customer) => ({
        id: c.id,
        name: c.name,
        phone: (c as any).phone || '',
        createdAt: c.createdAt,
        status: (c as any).status || 'active',
      })),
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
    const { data: customers } = await storage.listCustomers();
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

// Update customer credit limit
router.patch(
  "/:id/credit-limit",
  requireRole(CUSTOMER_ADMIN_ROLES),
  async (req, res) => {
    try {
      const customerId = req.params.id;
      const { creditLimit } = req.body;
      const employee = (req as any).employee || (req as any).user;
      const createdBy = employee?.employeeId || 'system';

      const normalizedCreditLimit = Number(creditLimit);

      if (creditLimit === undefined || Number.isNaN(normalizedCreditLimit) || normalizedCreditLimit < 0) {
        return res.status(400).json(createErrorResponse('Valid positive credit limit is required', 400));
      }

      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json(createErrorResponse('Customer not found', 404));
      }

      const oldLimit = Number(customer.creditLimit || 1000);
      const updatedCustomer = await storage.updateCustomer(customerId, { creditLimit: normalizedCreditLimit });

      // Notify real-time clients
      realtimeServer.broadcast({
        type: 'customer_updated',
        data: updatedCustomer
      });

      const description = `Credit limit updated from ₹${Number(oldLimit).toFixed(2)} to ₹${normalizedCreditLimit.toFixed(2)}`;

      // Log in wallet/credit transactions as a 0 amount adjustment just for history
      try {
        await storage.addCustomerCredit(
          customerId,
          0,
          'adjustment',
          description,
          undefined,
          createdBy
        );
      } catch (err) {
        console.error('Failed to log credit limit adjustment to ledger:', err);
      }

      // Track for Audit Log
      if (employee) {
        try {
          await AuthService.logAction(
            employee.employeeId,
            employee.username,
            'update_credit_limit',
            'customer',
            customerId,
            {
              oldLimit,
              newLimit: normalizedCreditLimit
            },
            req.ip || req.connection.remoteAddress,
            req.get('user-agent')
          );
        } catch (err) {
          console.error("Failed to log audit action", err);
        }
      }

      const serializedCustomer = serializeCustomer(updatedCustomer);
      res.json(createSuccessResponse(serializedCustomer, 'Customer credit limit updated successfully'));
    } catch (error) {
      console.error('Update credit limit error:', error);
      res.status(500).json(createErrorResponse('Failed to update credit limit', 500));
    }
  }
);


// ======= CREDIT ROUTES =======

// Add credit/debit to customer
router.post('/:id/credit', requireRole(CUSTOMER_EDITOR_ROLES), async (req, res) => {
  try {
    const customerId = req.params.id;
    const { amount, type, description, referenceId } = req.body;
    const createdBy = (req as any).user?.employeeId || 'system';

    if (amount === undefined || isNaN(amount)) {
      return res.status(400).json(createErrorResponse('Valid amount is required', 400));
    }
    if (!['deposit', 'usage', 'adjustment', 'refund'].includes(type)) {
      return res.status(400).json(createErrorResponse('Invalid credit type', 400));
    }

    const transaction = await storage.addCustomerCredit(customerId, parseFloat(amount), type, description, referenceId, createdBy);

    // Track credit actions for Audit Log
    if ((req as any).employee) {
      await AuthService.logAction(
        (req as any).employee.employeeId,
        (req as any).employee.username,
        type === 'refund' ? 'wallet_refund' : 'wallet_adjustment',
        'wallet',
        customerId,
        {
          amount: parseFloat(amount),
          type,
          description,
          referenceId
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(createSuccessResponse(transaction, 'Credit updated successfully'));
  } catch (error: any) {
    console.error('Update credit error:', error);
    res.status(500).json(createErrorResponse(error.message || 'Failed to update credit', 500));
  }
});

// Get credit history
router.get('/:id/credit-history', async (req, res) => {
  try {
    const customerId = req.params.id;
    const history = await storage.getCustomerCreditHistory(customerId);
    res.json(createSuccessResponse(history));
  } catch (error: any) {
    console.error('Get credit history error:', error);
    res.status(500).json(createErrorResponse(error.message || 'Failed to fetch credit history', 500));
  }
});

// Bulk import customers
router.post(
  "/import",
  requireRole(CUSTOMER_EDITOR_ROLES),
  async (req, res) => {
    try {
      const customers = req.body;
      if (!Array.isArray(customers)) {
        return res.status(400).json(createErrorResponse('Body must be an array of customers', 400));
      }

      if (customers.length > 5000) {
        return res.status(400).json(createErrorResponse('Maximum 5000 customers per import', 400));
      }

      const result = await (storage as any).importCustomersBulk(customers);

      // Notify real-time clients that something changed
      realtimeServer.triggerUpdate('customer', 'bulk_imported', { count: result.inserted_count });

      res.json(createSuccessResponse(result, 'Bulk import completed'));
    } catch (error: any) {
      console.error('Bulk import error:', error);
      res.status(500).json(createErrorResponse(`Bulk import failed: ${error.message}`, 500));
    }
  }
);

export default router;
