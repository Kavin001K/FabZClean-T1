import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import { insertOrderSchema, type Order, type Product, type OrderItem } from "../../shared/schema";
import {
  jwtRequired,
  validateInput,
} from "../middleware/auth";
import {
  serializeOrder,
  createPaginatedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../services/serialization";
import { realtimeServer } from "../websocket-server";
import { loyaltyProgram } from "../loyalty-program";
import { barcodeService } from "../barcode-service";
import { OrderService } from "../services/order.service";
import { AuthService } from "../auth-service";
import {
  handleOrderStatusChange,
  sendInvoiceWhatsApp,
  type OrderStatus,
  type FulfillmentType,
} from "../services/whatsapp.service";
import { sendOrderConfirmationEmail } from "../services/order-confirmation-email.service";
import { processOrderBillingPipeline } from "../services/order-invoice.service";

const router = Router();
const orderService = new OrderService();
const DELIVERY_DISABLED_MESSAGE = 'Delivery operations are disabled in this build.';
// Keep only backend-internal delivery statuses blocked from manual updates.
// Customer-facing statuses like out_for_delivery remain enabled.
const DELIVERY_DISABLED_STATUSES = new Set(['assigned', 'ready_for_delivery', 'delivered']);
const FINANCIAL_MUTATION_FIELDS = new Set(['paymentStatus', 'advancePaid', 'walletUsed', 'creditUsed', 'paymentMethod']);
const ORDER_UPDATE_FIELDS = new Set([
  'status',
  'priority',
  'pickupDate',
  'deliveryAddress',
  'shippingAddress',
  'fulfillmentType',
  'deliveryCharges',
  'specialInstructions',
  'notes',
  'isExpressOrder',
  'isEdited',
  'discountType',
  'discountValue',
  'couponCode',
  'extraCharges',
  'gstEnabled',
  'gstRate',
  'gstAmount',
  'panNumber',
  'gstNumber',
  'items',
  'totalAmount',
  'cancellationReason',
  'cancelledAt',
  'cancelledBy',
]);
// Apply rate limiting to all order routes
router.use(jwtRequired);

const parseAmount = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
};

const getCheckoutSplit = (data: any) => {
  const split = data?.split || {};
  return {
    cashApplied: Number(split.cashApplied ?? data?.cash_applied ?? 0),
    walletDebited: Number(split.walletDebited ?? data?.wallet_used ?? 0),
    creditAssigned: Number(split.creditAssigned ?? data?.credit_used ?? 0),
  };
};

const getCheckoutTransactionIds = (data: any) => {
  const transactionIds = data?.transaction_ids || {};
  return {
    walletTransactionId: transactionIds.wallet_transaction_id || null,
    creditTransactionId: transactionIds.credit_transaction_id || null,
  };
};

const normalizeCreditLimit = (value: unknown, fallback = 1000): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const coerceNonNegativeNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const parseOrderItems = (items: unknown): OrderItem[] => {
  if (!Array.isArray(items)) return [];
  const normalized = items
    .map((item: any) => {
      const quantity = Math.max(1, Math.round(coerceNonNegativeNumber(item?.quantity, 1)));
      const basePrice = coerceNonNegativeNumber(item?.price, 0);
      const subtotal = coerceNonNegativeNumber(item?.subtotal, basePrice * quantity);
      const serviceName = String(
        item?.serviceName || item?.name || item?.customName || 'Service'
      ).trim();

      return {
        serviceId: String(item?.serviceId || item?.id || `custom-${Date.now()}`),
        serviceName: serviceName || 'Service',
        quantity,
        price: basePrice.toFixed(2),
        subtotal: subtotal.toFixed(2),
        customName: item?.customName ? String(item.customName) : undefined,
        tagNote: item?.tagNote ? String(item.tagNote) : undefined,
      } as OrderItem;
    })
    .filter((item) => item.serviceName);

  return normalized;
};

const sumItemsTotal = (items: OrderItem[]): number =>
  items.reduce((sum, item) => sum + coerceNonNegativeNumber(item.subtotal, 0), 0);

const scheduleOrderStatusNotification = (
  orderId: string,
  updatedOrder: any,
  previousOrder: any,
  nextStatus: OrderStatus,
  extraPayload?: {
    cancellationReason?: string | null;
  }
) => {
  handleOrderStatusChange(
    {
      customerPhone: updatedOrder?.customerPhone || previousOrder?.customerPhone,
      customerName: updatedOrder?.customerName || previousOrder?.customerName,
      orderNumber: updatedOrder?.orderNumber || previousOrder?.orderNumber,
      totalAmount: updatedOrder?.totalAmount || previousOrder?.totalAmount,
      status: nextStatus,
      fulfillmentType: (updatedOrder?.fulfillmentType || previousOrder?.fulfillmentType || 'pickup') as FulfillmentType,
      items: updatedOrder?.items || previousOrder?.items || [],
      invoiceUrl: (updatedOrder as any)?.invoiceUrl || (previousOrder as any)?.invoiceUrl || null,
      invoiceNumber: (updatedOrder as any)?.invoiceNumber || previousOrder?.orderNumber,
      cancellationReason: extraPayload?.cancellationReason || updatedOrder?.cancellationReason || previousOrder?.cancellationReason || null,
    },
    previousOrder?.status as OrderStatus
  ).then(async (result) => {
    if (result?.success) {
      console.log(`✅ [WhatsApp] Status update notification sent for ${previousOrder?.orderNumber}`);
      try {
        const currentCount = (updatedOrder as any)?.whatsappMessageCount || 0;
        await storage.updateOrder(orderId, {
          lastWhatsappStatus: `${nextStatus} - Sent`,
          lastWhatsappSentAt: new Date(),
          whatsappMessageCount: currentCount + 1,
        });
      } catch (updateErr) {
        console.warn('Failed to update WhatsApp status:', updateErr);
      }
    } else if (result) {
      console.warn(`⚠️ [WhatsApp] Failed to send status notification: ${result.error}`);
      try {
        await storage.updateOrder(orderId, {
          lastWhatsappStatus: `${nextStatus} - Failed: ${result.error}`,
        });
      } catch (updateErr) {
        console.warn('Failed to update WhatsApp status:', updateErr);
      }
    }
  }).catch(err => {
    console.error(`❌ [WhatsApp] Error sending status notification:`, err);
  });
};

const schedulePostCreateTasks = (
  order: any,
  context?: {
    employeeId?: string;
    username?: string;
    ip?: string | undefined;
    userAgent?: string | undefined;
  }
) => {
  setImmediate(async () => {
    if (order.customerId) {
      try {
        await loyaltyProgram.processOrderRewards(
          order.customerId,
          parseFloat(order.totalAmount || "0")
        );
      } catch (loyaltyError) {
        console.warn('Failed to process loyalty rewards:', loyaltyError);
      }
    }

    try {
      await barcodeService.generateOrderBarcode(order.id);
    } catch (barcodeError) {
      console.warn('Failed to generate barcode:', barcodeError);
    }

    try {
      realtimeServer.triggerUpdate('order', 'created', order);
    } catch (realtimeError) {
      console.warn('Failed to broadcast order creation:', realtimeError);
    }

    const emailResult = await sendOrderConfirmationEmail({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalAmount: order.totalAmount,
    });

    if (emailResult.success) {
      console.log(`📧 [Order Email] Confirmation email sent for ${order.orderNumber}`);
    } else if (!emailResult.skipped) {
      console.warn(`⚠️ [Order Email] Failed for ${order.orderNumber}: ${emailResult.error}`);
    } else {
      console.log(`ℹ️ [Order Email] Skipped for ${order.orderNumber}: ${emailResult.error}`);
    }

    if (context?.employeeId && context?.username) {
      try {
        await AuthService.logAction(
          context.employeeId,
          context.username,
          'send_order_confirmation_email',
          'order',
          order.id,
          {
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail || null,
            sent: emailResult.success,
            skipped: Boolean(emailResult.skipped),
            error: emailResult.error || null,
          },
          context.ip,
          context.userAgent
        );
      } catch (logError) {
        console.warn('Failed to log order confirmation email action:', logError);
      }
    }

    if (order.customerPhone) {
      console.log(
        `📱 [WhatsApp Background] Waiting for template invoice generation in the order confirmation dialog for ${order.orderNumber}`
      );
    }
  });
};

/**
 * POST /api/orders/:id/checkout
 * Canonical payment engine entrypoint (wallet first, then cash, remainder -> credit).
 */
router.post('/:id/checkout', async (req, res) => {
  try {
    const orderId = req.params.id;
    const {
      customerId,
      cashAmount = 0,
      walletAmount = 0, // legacy alias
      useWallet,
      walletDebitRequested,
      paymentMethod = 'CASH',
    } = req.body || {};

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    const resolvedCustomerId = customerId || order.customerId;
    if (!resolvedCustomerId) {
      return res.status(400).json(createErrorResponse('Customer ID is required for checkout', 400));
    }

    const parsedCash = parseAmount(cashAmount);
    const parsedWalletLegacy = parseAmount(walletAmount);
    const parsedWalletRequested = parseAmount(
      walletDebitRequested !== undefined ? walletDebitRequested : parsedWalletLegacy
    );
    const shouldUseWallet = parseBoolean(
      useWallet,
      parsedWalletRequested > 0 || parsedWalletLegacy > 0
    );

    const recordedBy = req.employee?.id || null;
    const recordedByName = req.employee?.username || 'system';

    const result = await (storage as any).processOrderCheckout(
      orderId,
      resolvedCustomerId,
      parsedCash,
      parsedWalletRequested,
      recordedBy,
      recordedByName,
      {
        useWallet: shouldUseWallet,
        walletDebitRequested: parsedWalletRequested,
        paymentMethod,
      }
    );

    if (!result.success) {
      return res.status(400).json(createErrorResponse(result.error || 'Payment processing failed', 400));
    }

    let updatedOrder = await storage.getOrder(orderId);
    if (!updatedOrder) {
      return res.status(404).json(createErrorResponse('Order not found after checkout', 404));
    }

    const paymentStatus = result.data?.payment_status || (updatedOrder as any).paymentStatus || 'pending';
    const creditId = result.data?.credit_id || resolvedCustomerId;

    // Maintain backward behavior: auto-complete early-stage orders when fully paid.
    const earlyStatuses = ['pending', 'processing', 'confirmed'];
    if (paymentStatus === 'paid' && earlyStatuses.includes(updatedOrder.status)) {
      updatedOrder = await storage.updateOrder(orderId, { status: 'completed' }) || updatedOrder;
    }
    const serializedOrder = serializeOrder(updatedOrder);

    const responsePayload: any = {
      ...serializedOrder,
      paymentStatus,
      split: getCheckoutSplit(result.data),
      transactionIds: getCheckoutTransactionIds(result.data),
      creditId,
      order: serializedOrder,
      idempotent: Boolean(result.data?.idempotent),
    };

    res.json(createSuccessResponse(responsePayload, 'Order checkout successful'));
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json(createErrorResponse(`Failed to process checkout: ${error.message}`, 500));
  }
});

/**
 * POST /api/orders/:id/mark-paid
 * Marks the order as fully paid and settles any order-linked credit amount.
 */
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const orderId = req.params.id;
    const requestedPaymentMethod = String(req.body?.paymentMethod || '').trim();
    const paymentMethod = requestedPaymentMethod || String(req.body?.payment_method || 'CASH');

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    const existingPaymentStatus = String((order as any).paymentStatus || 'pending').toLowerCase();
    if (existingPaymentStatus === 'paid') {
      return res.json(createSuccessResponse({
        order: serializeOrder(order),
        settledAmount: 0,
        message: 'Order is already marked as paid',
      }));
    }

    const totalAmount = parseAmount(order.totalAmount);
    const advancePaid = parseAmount((order as any).advancePaid);
    const walletUsed = parseAmount((order as any).walletUsed);
    const explicitCreditUsed = parseAmount((order as any).creditUsed);
    const computedDue = Math.max(0, totalAmount - advancePaid - walletUsed);
    const settlementAmount = explicitCreditUsed > 0 ? explicitCreditUsed : computedDue;

    if (settlementAmount > 0 && order.customerId) {
      const recordedBy = req.employee?.id || null;
      const recordedByName = req.employee?.username || 'system';

      const repayment = await (storage as any).processCreditRepayment(
        order.customerId,
        settlementAmount,
        String(paymentMethod).toUpperCase(),
        recordedBy,
        recordedByName
      );

      if (!repayment.success) {
        const noCreditAccountPhrases = [
          'credit account not found',
          'no outstanding balance',
          'balance is 0',
          'nothing to repay',
          'no credit',
          'not found',
        ];
        const errorLower = (repayment.error || '').toLowerCase();
        const isNoAccount = noCreditAccountPhrases.some(phrase => errorLower.includes(phrase));
        if (isNoAccount) {
          console.warn('[OrdersRoute] processCreditRepayment skipped (no credit account/balance):', repayment.error);
        } else {
          return res.status(400).json(createErrorResponse(repayment.error || 'Failed to settle outstanding balance', 400));
        }
      }
    }

    const nextAdvancePaid = Math.min(totalAmount, advancePaid + settlementAmount);
    const updatedOrder = await storage.updateOrder(orderId, {
      paymentStatus: 'paid',
      paymentMethod: String(paymentMethod).toLowerCase(),
      creditUsed: '0',
      advancePaid: nextAdvancePaid.toFixed(2),
      isCreditOrder: false,
    } as any);

    if (!updatedOrder) {
      return res.status(500).json(createErrorResponse('Failed to mark order as paid', 500));
    }

    if (req.employee) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'mark_order_paid',
        'order',
        orderId,
        {
          orderNumber: order.orderNumber,
          settlementAmount,
          paymentMethod: String(paymentMethod).toUpperCase(),
          previousPaymentStatus: order.paymentStatus,
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    realtimeServer.triggerUpdate('order', 'payment_updated' as any, {
      orderId,
      paymentStatus: 'paid',
      settledAmount: settlementAmount,
    });

    res.json(createSuccessResponse({
      order: serializeOrder(updatedOrder),
      settledAmount: settlementAmount,
      message: settlementAmount > 0
        ? `Outstanding amount of ₹${settlementAmount.toFixed(2)} has been settled and marked as paid`
        : 'Order marked as paid',
    }, 'Order payment updated successfully'));
  } catch (error: any) {
    console.error('Mark order paid error:', error);
    res.status(500).json(createErrorResponse(`Failed to mark order as paid: ${error.message}`, 500));
  }
});

router.get('/delivery-queue', async (req, res) => {
  return res.status(410).json(createErrorResponse(DELIVERY_DISABLED_MESSAGE, 410));
});

router.patch('/:id/deliver', async (req, res) => {
  return res.status(410).json(createErrorResponse(DELIVERY_DISABLED_MESSAGE, 410));
});

// Get next order number preview (for display on order creation form)
// Format: FAB260001 (FAB + Year + Sequence)
router.get('/next-order-number', async (req, res) => {
  try {
    const nextOrderNumber = (storage as any).getNextOrderNumber();

    const now = new Date();
    const yearStr = String(now.getFullYear()).slice(-2);

    res.json({
      success: true,
      nextOrderNumber,
      format: 'FAB + YY + SEQUENCE',
      example: `FAB${yearStr}0001`,
      components: {
        prefix: 'FAB',
        year: yearStr,
        sequence: nextOrderNumber.slice(-4)
      }
    });
  } catch (error: any) {
    console.error('Get next order number error:', error);
    res.status(500).json({ error: 'Failed to get next order number' });
  }
});

// Search orders by query (order number, barcode, customer name, etc.)
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();

    if (!query) {
      return res.json([]);
    }

    const allOrders = await storage.listOrders();
    const queryLower = query.toLowerCase();

    // Search across multiple fields
    const matchingOrders = allOrders.filter((order: Order) => {
      if (order.orderNumber?.toLowerCase().includes(queryLower)) return true;
      if (order.id?.toLowerCase() === queryLower) return true;
      if (order.customerName?.toLowerCase().includes(queryLower)) return true;
      if (order.customerPhone?.includes(query)) return true;
      if (order.customerEmail?.toLowerCase().includes(queryLower)) return true;

      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.serviceName?.toLowerCase().includes(queryLower)) return true;
          if ((item as any).customName?.toLowerCase().includes(queryLower)) return true;
        }
      }

      return false;
    });

    // Serialize and limit results
    const serializedOrders = matchingOrders.slice(0, 20).map((order: Order) => serializeOrder(order));

    // LOGGING: Log search query and results
    if (req.employee && query.length >= 3) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'search_orders',
        'order',
        'search',
        {
          query: query,
          resultsCount: serializedOrders.length,
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(serializedOrders);
  } catch (error) {
    console.error('Search orders error:', error);
    res.status(500).json(createErrorResponse('Failed to search orders', 500));
  }
});

// Get orders with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const customerEmail = req.query.customerEmail as string;
    const createdDate = req.query.createdDate as string;

    console.log(`[GET /api/orders] Query: ${JSON.stringify(req.query)}`);

    const filters = {
      limit,
      search,
      status: status === 'all' ? undefined : status,
      customerEmail,
      createdDate,
    };

    const orders = await orderService.findAllOrders(filters);

    // Calculate pagination
    const total = orders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    const serializedOrders = paginatedOrders.map(order => serializeOrder(order));

    const response = createPaginatedResponse(serializedOrders, {
      total: orders.length,
      limit: limit
    });

    res.json(response);
  } catch (error) {
    console.error('Get orders error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createErrorResponse('Validation failed', 400));
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.toLowerCase().includes('validation') || message.toLowerCase().includes('invalid')) {
      return res.status(400).json(createErrorResponse(message, 400));
    }

    res.status(500).json(createErrorResponse(`Failed to fetch orders: ${message}`, 500));
  }
});

// Get recent orders (for suggestions)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string) || 10;

    const orders = await storage.listOrders();
    const products = await storage.listProducts();

    const recentOrders = orders
      .sort((a: Order, b: Order) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limitNum);

    const transformedOrders = recentOrders.map((order: Order) => {
      const serviceNames = order.service ? order.service.split(',').filter(Boolean) : [];
      const serviceIds = (order as any).serviceId ? (order as any).serviceId.split(',').filter(Boolean) : [];

      return {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        services: serviceNames,
        serviceIds: serviceIds,
        total: parseFloat(order.totalAmount || '0'),
        status: order.status,
        createdAt: order.createdAt,
        products: serviceIds.map((id: string) => {
          const product = products.find((p: Product) => p.id === id);
          return product ? {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price || '0')
          } : null;
        }).filter(Boolean)
      };
    });

    res.json(createSuccessResponse(transformedOrders));
  } catch (error) {
    console.error('Fetch recent orders error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch recent orders', 500));
  }
});

// Get print queue (orders with unprinted tags)
router.get('/print-queue', async (req, res) => {
  try {
    let orders: Order[] = [];
    if (typeof (storage as any).getOrdersForPrintQueue === 'function') {
      orders = await (storage as any).getOrdersForPrintQueue();
    } else {
      // Safe fallback for storage backends without dedicated print queue method
      const allOrders = await storage.listOrders();
      orders = allOrders
        .filter((o: any) => !o.tagsPrinted && o.status !== 'cancelled')
        .sort((a: any, b: any) => {
          const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
    }
    const serializedOrders = orders.map((order: Order) => serializeOrder(order));
    res.json(createSuccessResponse(serializedOrders));
  } catch (error) {
    console.error('Get print queue error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch print queue', 500));
  }
});

// Get orders for a specific customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const allOrders = await storage.listOrders();
    const customerOrders = allOrders.filter((order: Order) => order.customerId === customerId);

    // Sort by newest first
    customerOrders.sort((a: Order, b: Order) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const serializedOrders = customerOrders.map(order => serializeOrder(order));
    res.json(createSuccessResponse(serializedOrders));
  } catch (error) {
    console.error('Fetch customer orders error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch customer orders', 500));
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    const serializedOrder = serializeOrder(order);
    res.json(createSuccessResponse(serializedOrder));
  } catch (error) {
    console.error('Get order error:', error);
    if (error instanceof Error && error.message.includes('Order not found')) {
      res.status(404).json(createErrorResponse('Order not found', 404));
    } else {
      res.status(500).json(createErrorResponse('Failed to fetch order', 500));
    }
  }
});

// Create new order
router.post(
  "/",
  validateInput(insertOrderSchema),
  async (req, res) => {
    try {
      const orderData: any = { ...(req.body || {}) };

      if (DELIVERY_DISABLED_STATUSES.has(orderData.status)) {
        orderData.status = 'pending';
      }

      // Financial posting is now canonical via checkout engine only.
      orderData.paymentStatus = 'pending';
      orderData.whatsappBillStatus = 'pending';
      orderData.appliedTemplateId = null;

      // Add employee ID for order tracking
      if (req.employee) {
        orderData.employeeId = req.employee.employeeId;
      }

      // UUID safety check for franchiseId
      const empFranchise = req.employee?.storeId || req.employee?.franchiseId;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (empFranchise && uuidRegex.test(empFranchise)) {
        orderData.franchiseId = empFranchise;
      } else {
        orderData.franchiseId = null;
      }

      const requestedCashAtCreate = parseAmount(orderData.advancePaid);
      const requestedWalletDebitAtCreate = parseAmount(
        orderData.walletDebitRequested ?? orderData.walletAmount ?? orderData.walletUsed
      );
      const useWalletAtCreate = parseBoolean(
        orderData.useWallet,
        requestedWalletDebitAtCreate > 0
      );
      const creditOverrideApproved = parseBoolean(orderData.creditOverrideApproved, false);
      orderData.advancePaid = '0';
      orderData.walletUsed = '0';
      orderData.creditUsed = '0';
      delete orderData.creditOverrideApproved;

      let creditOverrideMetadata: {
        customerId: string;
        outstandingBefore: number;
        creditLimit: number;
        projectedCreditRequired: number;
      } | null = null;

      // Credit override guard:
      // PERF: Pre-fetch customer once and reuse for both credit check and checkout
      let prefetchedCustomer: any = null;
      if (orderData.customerId) {
        const customer = await storage.getCustomer(orderData.customerId);
        if (customer) {
          prefetchedCustomer = customer;
          orderData.customerName = orderData.customerName || customer.name;
          orderData.customerEmail = orderData.customerEmail || customer.email || null;
          orderData.customerPhone = orderData.customerPhone || customer.phone || null;
          orderData.secondaryPhone = orderData.secondaryPhone || (customer as any).secondaryPhone || null;

          const customerUpdates: Record<string, unknown> = {};
          if (orderData.customerName && orderData.customerName !== customer.name) {
            customerUpdates.name = orderData.customerName;
          }
          if (orderData.customerEmail && orderData.customerEmail !== customer.email) {
            customerUpdates.email = orderData.customerEmail;
          }
          if (orderData.customerPhone && orderData.customerPhone !== customer.phone) {
            customerUpdates.phone = orderData.customerPhone;
          }
          if (orderData.secondaryPhone && orderData.secondaryPhone !== (customer as any).secondaryPhone) {
            customerUpdates.secondaryPhone = orderData.secondaryPhone;
          }

          if (Object.keys(customerUpdates).length > 0) {
            try {
              prefetchedCustomer = await storage.updateCustomer(orderData.customerId, customerUpdates) || {
                ...customer,
                ...customerUpdates,
              };
            } catch (syncError) {
              console.warn('Customer contact sync during order creation failed:', syncError);
            }
          }

          const totalAmount = parseAmount(orderData.totalAmount);
          const walletBalance = parseAmount((customer as any).walletBalanceCache || '0');
          const projectedWalletCover = useWalletAtCreate
            ? Math.min(walletBalance, requestedWalletDebitAtCreate || walletBalance)
            : 0;
          const projectedCreditRequired = Math.max(
            0,
            totalAmount - requestedCashAtCreate - projectedWalletCover
          );

          if (projectedCreditRequired > 0) {
            const currentCredit = parseAmount(customer.creditBalance || "0");
            const creditLimit = normalizeCreditLimit((customer as any).creditLimit, 1000);

            creditOverrideMetadata = {
              customerId: customer.id,
              outstandingBefore: currentCredit,
              creditLimit,
              projectedCreditRequired,
            };

            if (currentCredit > creditLimit && !creditOverrideApproved) {
              const message =
                `This customer already has unpaid dues of ₹${currentCredit.toFixed(2)}, ` +
                `which exceeds the allowed credit limit of ₹${creditLimit.toFixed(2)}. ` +
                `Ask the customer for payment before proceeding.`;

              return res.status(409).json({
                ...createErrorResponse(message, 409, {
                  code: 'CREDIT_OVERRIDE_REQUIRED',
                  requiresCreditOverride: true,
                  customerId: customer.id,
                  outstandingBefore: currentCredit,
                  creditLimit,
                  projectedCreditRequired,
                }),
                requiresCreditOverride: true,
                customerId: customer.id,
                outstandingBefore: currentCredit,
                creditLimit,
                projectedCreditRequired,
              });
            }
          }
        } else {
          return res.status(400).json(createErrorResponse('Selected customer could not be loaded from the database', 400));
        }
      }

      if (!String(orderData.customerName || '').trim()) {
        return res.status(400).json(createErrorResponse('Customer name is required to create the order invoice correctly', 400));
      }

      if (!String(orderData.customerPhone || '').trim()) {
        return res.status(400).json(createErrorResponse('Customer phone is required to create and send the order bill', 400));
      }

      // Use OrderService to create order
      let order = await orderService.createOrder(orderData);
      let checkoutData: any = null;

      // Canonical payment engine run: auto-ledger unpaid remainder as credit.
      if (order.customerId) {
        const recordedBy = req.employee?.id || null;
        const recordedByName = req.employee?.username || 'system';
        const checkoutResult = await (storage as any).processOrderCheckout(
          order.id,
          order.customerId,
          requestedCashAtCreate,
          requestedWalletDebitAtCreate,
          recordedBy,
          recordedByName,
          {
            useWallet: useWalletAtCreate,
            walletDebitRequested: requestedWalletDebitAtCreate,
            paymentMethod: orderData.paymentMethod || 'CASH',
            // PERF: Pass pre-fetched customer to avoid duplicate DB lookups
            prefetchedCustomer: prefetchedCustomer ? (storage as any).toSnakeCase?.(prefetchedCustomer) || prefetchedCustomer : undefined,
          }
        );

        if (!checkoutResult.success) {
          try {
            await storage.deleteOrder(order.id);
          } catch (rollbackError) {
            console.error('Automatic checkout failed and rollback delete also failed:', rollbackError);
          }
          throw new Error(checkoutResult.error || 'Failed to run automatic checkout');
        }

        checkoutData = checkoutResult.data;
        // PERF: Skip re-fetching order — merge checkout payment fields onto existing order
        if (checkoutData) {
          (order as any).paymentStatus = checkoutData.payment_status || (order as any).paymentStatus;
          (order as any).advancePaid = checkoutData.split?.cashApplied != null
            ? String(parseAmount(checkoutData.split.cashApplied))
            : (order as any).advancePaid;
          (order as any).walletUsed = checkoutData.split?.walletDebited != null
            ? String(parseAmount(checkoutData.split.walletDebited))
            : (order as any).walletUsed;
          (order as any).creditUsed = checkoutData.split?.creditAssigned != null
            ? String(parseAmount(checkoutData.split.creditAssigned))
            : (order as any).creditUsed;
        }
      }

      // PERF: Defer audit logging — not critical for the response
      if (req.employee) {
        const employeeData = { ...req.employee };
        const ip = req.ip || req.connection.remoteAddress;
        const ua = req.get('user-agent');
        const orderRef = { id: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount, customerName: order.customerName };
        const creditMeta = creditOverrideMetadata;
        const creditApproved = creditOverrideApproved;

        setImmediate(async () => {
          try {
            await AuthService.logAction(
              employeeData.employeeId,
              employeeData.username,
              'create_order',
              'order',
              orderRef.id,
              {
                orderNumber: orderRef.orderNumber,
                totalAmount: orderRef.totalAmount,
                customerName: orderRef.customerName
              },
              ip,
              ua
            );

            if (creditApproved && creditMeta) {
              await AuthService.logAction(
                employeeData.employeeId,
                employeeData.username,
                'approve_credit_override',
                'customer',
                creditMeta.customerId,
                {
                  orderId: orderRef.id,
                  orderNumber: orderRef.orderNumber,
                  outstandingBefore: creditMeta.outstandingBefore,
                  creditLimit: creditMeta.creditLimit,
                  projectedCreditRequired: creditMeta.projectedCreditRequired,
                },
                ip,
                ua
              );
            }
          } catch (logErr) {
            console.warn('Deferred audit log failed:', logErr);
          }
        });
      }

      const serializedOrder = serializeOrder(order);
      const responsePayload = {
        ...serializedOrder,
        paymentStatus: checkoutData?.payment_status || (serializedOrder as any).paymentStatus || 'pending',
        split: getCheckoutSplit(checkoutData),
        transactionIds: getCheckoutTransactionIds(checkoutData),
        creditId: checkoutData?.credit_id || order.customerId || null,
        order: serializedOrder,
        creditOverrideApplied: creditOverrideApproved,
      };

      res.status(201).json(createSuccessResponse(responsePayload, 'Order created successfully'));
      schedulePostCreateTasks(order, {
        employeeId: req.employee?.employeeId,
        username: req.employee?.username,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      });
    } catch (error) {
      console.error('Create order error:', error);

      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          return res.status(400).json(createErrorResponse(error.message, 400));
        }
        if (error.message.includes('Customer validation failed')) {
          return res.status(400).json(createErrorResponse(error.message, 400));
        }
      }

      res.status(500).json(createErrorResponse(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`, 500));
    }
  },
);

// Update order
router.put('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const rawUpdateData = req.body || {};
    console.log(`[UPDATE ORDER] ID: ${orderId}`, JSON.stringify(rawUpdateData, null, 2));

    if (rawUpdateData.status && DELIVERY_DISABLED_STATUSES.has(String(rawUpdateData.status))) {
      return res.status(410).json(createErrorResponse(DELIVERY_DISABLED_MESSAGE, 410));
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    const attemptedFinancialMutations = Object.keys(rawUpdateData).filter((field) =>
      FINANCIAL_MUTATION_FIELDS.has(field)
    );

    // Accept broad payloads from legacy clients, but persist only known editable fields.
    const updateData: Record<string, any> = {};
    Object.entries(rawUpdateData).forEach(([key, value]) => {
      if (ORDER_UPDATE_FIELDS.has(key)) {
        updateData[key] = value;
      }
    });

    const hasItemPayload = Object.prototype.hasOwnProperty.call(updateData, 'items');

    // ── CANCELLATION SHORT-PATH ──────────────────────────────────────
    // When the only intent is to cancel the order, skip the heavy
    // financial-recalculation path and go straight to the DB update +
    // WhatsApp notification.
    if (updateData.status === 'cancelled') {
      // Validate: only certain statuses can be cancelled
      const cancelAllowed = ['pending', 'processing', 'ready_for_pickup', 'ready_for_delivery', 'ready', 'in_store'];
      if (!cancelAllowed.includes(order.status)) {
        return res.status(400).json(createErrorResponse(
          `Cannot cancel an order with status '${order.status}'. Orders can only be cancelled when pending, processing, or ready.`,
          400
        ));
      }

      const cancellationReason = updateData.cancellationReason || 'Operational Issue';
      const cancelledBy = req.employee?.username || req.employee?.employeeId || 'system';

      try {
        const updatedOrder = typeof (storage as any).cancelOrder === 'function'
          ? await (storage as any).cancelOrder(orderId, cancellationReason, cancelledBy)
          : await storage.updateOrder(orderId, {
              status: 'cancelled',
              cancellationReason,
              cancelledAt: new Date(),
              cancelledBy,
            });
        if (!updatedOrder) {
          return res.status(500).json(createErrorResponse('Failed to cancel order', 500));
        }

        // Log cancellation
        if (req.employee) {
          await AuthService.logAction(
            req.employee.employeeId,
            req.employee.username,
            'cancel_order',
            'order',
            orderId,
            { reason: cancellationReason, previousStatus: order.status },
            req.ip || req.connection.remoteAddress,
            req.get('user-agent')
          );
        }

        // Real-time notification
        realtimeServer.triggerUpdate('order', 'status_changed' as any, {
          orderId,
          status: 'cancelled',
          previousStatus: order.status,
        });

        scheduleOrderStatusNotification(orderId, updatedOrder, order, 'cancelled', {
          cancellationReason,
        });

        // Auto-refund logic
        const advancePaid = parseAmount((order as any).advancePaid);
        const walletUsed = parseAmount((order as any).walletUsed);
        const totalPaid = advancePaid + walletUsed;

        if (totalPaid > 0 && order.customerId) {
            try {
                const refundResult = await (storage as any).processWalletRecharge(
                    order.customerId,
                    totalPaid,
                    'WALLET_REFUND',
                    req.employee?.id || null,
                    req.employee?.username || 'system'
                );

                if (refundResult.success) {
                    await (storage as any).processRefundOut(
                        order.customerId,
                        totalPaid,
                        'WALLET',
                        `Auto-refund for cancelled order ${order.orderNumber}`,
                        orderId
                    );
                    
                    if (req.employee) {
                        await AuthService.logAction(
                            req.employee.employeeId,
                            req.employee.username,
                            'wallet_refund',
                            'customer',
                            order.customerId,
                            {
                                amount: totalPaid,
                                paymentMethod: 'WALLET',
                                reason: `Auto-refund for cancelled order ${order.orderNumber}`,
                                orderId
                            },
                            req.ip || req.connection.remoteAddress,
                            req.get('user-agent')
                        );
                    }
                }
            } catch (err) {
                console.error('[Auto-Refund] Error auto-refunding to wallet on cancel:', err);
            }
        }

        const serializedOrder = serializeOrder(updatedOrder);
        return res.json(createSuccessResponse(serializedOrder, 'Order cancelled successfully'));
      } catch (cancelError: any) {
        console.error('Cancel order error:', cancelError);
        return res.status(500).json(createErrorResponse('Failed to cancel order: ' + (cancelError.message || ''), 500));
      }
    }

    // ── REGULAR UPDATE PATH (non-cancellation) ────────────────────────
    const brandingChanged =
      Object.prototype.hasOwnProperty.call(updateData, 'storeId') ||
      Object.prototype.hasOwnProperty.call(updateData, 'storeCode') ||
      Object.prototype.hasOwnProperty.call(updateData, 'invoiceTemplateId');
    const oldItems = parseOrderItems((order as any).items);
    const oldTotal = coerceNonNegativeNumber((order as any).totalAmount);
    const advancePaid = coerceNonNegativeNumber((order as any).advancePaid);
    const walletUsed = coerceNonNegativeNumber((order as any).walletUsed);
    const oldOutstanding = Math.max(0, oldTotal - advancePaid - walletUsed);

    let normalizedItems: OrderItem[] | null = null;
    if (hasItemPayload) {
      normalizedItems = parseOrderItems(updateData.items);
      if (normalizedItems.length === 0) {
        return res.status(400).json(createErrorResponse('Order must have at least one service item', 400));
      }
      updateData.items = normalizedItems;
      updateData.totalAmount = sumItemsTotal(normalizedItems).toFixed(2);
      updateData.tagsPrinted = false;
    }

    const nextTotal = coerceNonNegativeNumber(
      updateData.totalAmount !== undefined ? updateData.totalAmount : oldTotal
    );
    const totalChanged = Math.abs(nextTotal - oldTotal) >= 0.01;
    const revisedOrderFinancials = hasItemPayload || totalChanged;

    let newOutstanding = oldOutstanding;
    let outstandingDelta = 0;
    if (revisedOrderFinancials) {
      newOutstanding = Math.max(0, nextTotal - advancePaid - walletUsed);
      outstandingDelta = newOutstanding - oldOutstanding;

      updateData.totalAmount = nextTotal.toFixed(2);
      updateData.creditUsed = newOutstanding.toFixed(2);
      updateData.isCreditOrder = newOutstanding > 0;
      updateData.paymentStatus = newOutstanding > 0 ? 'credit' : 'paid';
    }

    const requiresInvoiceRegeneration = revisedOrderFinancials || brandingChanged;
    if (requiresInvoiceRegeneration) {
      if (revisedOrderFinancials) {
        updateData.isEdited = true;
      }
      updateData.invoiceUrl = null;
      updateData.appliedTemplateId = null;
      updateData.whatsappBillStatus = 'pending';
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(createErrorResponse('No editable order fields provided', 400));
    }

    if (order.customerId && revisedOrderFinancials && Math.abs(outstandingDelta) >= 0.01) {
      await (storage as any).addCustomerCredit(
        order.customerId,
        outstandingDelta,
        'adjustment',
        `Order ${order.orderNumber} revised (outstanding delta ₹${outstandingDelta.toFixed(2)})`,
        orderId,
        req.employee?.id || undefined,
        (order as any).paymentMethod || undefined
      );
    }

    const updatedOrder = await storage.updateOrder(orderId, updateData);
    if (!updatedOrder) {
      return res.status(500).json(createErrorResponse('Failed to update order', 500));
    }

    // Log updates
    if (req.employee) {
      const changes: any = {};

      if (updateData.totalAmount && updateData.totalAmount !== order.totalAmount) {
        changes.price_changed = {
          from: order.totalAmount,
          to: updateData.totalAmount
        };
      }

      if (attemptedFinancialMutations.length > 0) {
        changes.ignored_financial_fields = attemptedFinancialMutations;
      }

      if (revisedOrderFinancials) {
        changes.financial_reconciliation = {
          previousOutstanding: oldOutstanding.toFixed(2),
          newOutstanding: newOutstanding.toFixed(2),
          delta: outstandingDelta.toFixed(2),
          itemsEdited: hasItemPayload,
        };
      }

      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'update_order',
        'order',
        orderId,
        {
          changes,
          updateData
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    // Notify real-time clients
    realtimeServer.triggerUpdate('order', 'updated', updatedOrder);

    if (hasItemPayload) {
      realtimeServer.triggerUpdate('order', 'tags_reset' as any, {
        orderId,
        tagsPrinted: false,
      });
    }

    // If status was changed, send WhatsApp notification
    if (updateData.status && updateData.status !== order.status) {
      scheduleOrderStatusNotification(orderId, updatedOrder, order, updateData.status as OrderStatus);
    }

    // If order bill was revised (items/total), send updated WhatsApp bill automatically.
    if (requiresInvoiceRegeneration && (updatedOrder as any)?.customerPhone) {
      setImmediate(async () => {
        try {
          const billingResult = await processOrderBillingPipeline(orderId);
          if (!billingResult.success) {
            await storage.updateOrder(orderId, {
              lastWhatsappStatus: `Bill Updated - Failed: ${billingResult.error || 'Unknown error'}`,
            } as any);
          }
        } catch (billSendError) {
          console.error('Failed to send revised WhatsApp bill:', billSendError);
        }
      });
    }

    const serializedOrder = serializeOrder(updatedOrder);
    res.json(createSuccessResponse(serializedOrder, 'Order updated successfully'));
  } catch (error: any) {
    console.error('Update order error:', error);
    res.status(500).json(createErrorResponse('Failed to update order: ' + (error.message || ''), 500));
  }
});

// Update order status
router.patch(
  "/:id/status",
  async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status, cancellationReason } = req.body;

      if (!status) {
        return res.status(400).json(createErrorResponse('Status is required', 400));
      }

      if (DELIVERY_DISABLED_STATUSES.has(status)) {
        return res.status(410).json(createErrorResponse(DELIVERY_DISABLED_MESSAGE, 410));
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json(createErrorResponse('Order not found', 404));
      }

      const STATUS_ORDER: Record<string, number> = {
        'pending': 1,
        'processing': 2,
        'in_store': 2,
        'ready_for_transit': 3,
        'ready': 3,
        'ready_for_pickup': 3,
        'ready_for_delivery': 3,
        'assigned': 4,
        'in_transit': 4,
        'shipped': 4,
        'out_for_delivery': 4,
        'delivered': 5,
        'completed': 5,
        'cancelled': 99,
        'refunded': 100,
      };

      const currentStatusLevel = STATUS_ORDER[order.status] || 0;
      const newStatusLevel = STATUS_ORDER[status] || 0;

      // Explicitly allow common forward transitions that may span multiple levels
      const EXPLICIT_FORWARD_TRANSITIONS: Record<string, string[]> = {
        'processing': ['ready_for_pickup', 'out_for_delivery', 'completed'],
        'pending': ['processing', 'ready_for_pickup', 'out_for_delivery', 'completed'],
        'in_store': ['processing', 'ready_for_pickup', 'out_for_delivery', 'completed'],
      };
      const explicitlyAllowed = EXPLICIT_FORWARD_TRANSITIONS[order.status]?.includes(status) ?? false;

      if (status !== 'cancelled' && status !== 'refunded') {
        if (!explicitlyAllowed && newStatusLevel < currentStatusLevel) {
          return res.status(400).json(createErrorResponse(
            `Cannot change status from '${order.status}' to '${status}'. Order status changes are irreversible.`,
            400
          ));
        }
      } else if (status === 'cancelled') {
        if (!['pending', 'processing', 'ready_for_pickup', 'ready_for_delivery', 'ready'].includes(order.status)) {
          return res.status(400).json(createErrorResponse(
            `Cannot cancel an order with status '${order.status}'. Orders can only be cancelled when pending, processing, or ready.`,
            400
          ));
        }
      } else if (status === 'refunded') {
        if (!['completed', 'delivered'].includes(order.status)) {
          return res.status(400).json(createErrorResponse(
            `Cannot refund an order with status '${order.status}'. Only completed or delivered orders can be refunded.`,
            400
          ));
        }
      }

      if (status === 'completed' && order.paymentStatus !== 'paid' && order.paymentStatus !== 'credit') {
        return res.status(400).json(createErrorResponse(
          'Payment must be marked as paid or credit before completing the order',
          400
        ));
      }

      const updateData: any = { status };
      
      if (status === 'cancelled') {
        updateData.cancellationReason = cancellationReason || 'Operational Issue';
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = req.employee?.username || req.employee?.employeeId || 'system';
      }

      const updatedOrder = await storage.updateOrder(orderId, updateData);
      if (!updatedOrder) {
        return res.status(500).json(createErrorResponse('Failed to update order status', 500));
      }

      // Log status change
      if (req.employee) {
        await AuthService.logAction(
          req.employee.employeeId,
          req.employee.username,
          'update_order_status',
          'order',
          orderId,
          {
            from: order.status,
            to: status,
            ...(status === 'cancelled' ? { reason: cancellationReason || 'Operational Issue' } : {})
          },
          req.ip || req.connection.remoteAddress,
          req.get('user-agent')
        );
      }

      // Notify real-time clients
      realtimeServer.triggerUpdate('order', 'status_changed' as any, {
        orderId: orderId,
        status: status,
        previousStatus: order.status
      });

      scheduleOrderStatusNotification(orderId, updatedOrder, order, status as OrderStatus, {
        cancellationReason: status === 'cancelled' ? (updatedOrder?.cancellationReason || cancellationReason || null) : null,
      });

      // Auto-refund logic for cancellation via status change
      if (status === 'cancelled') {
          const advancePaid = parseAmount((order as any).advancePaid);
          const walletUsed = parseAmount((order as any).walletUsed);
          const totalPaid = advancePaid + walletUsed;

          if (totalPaid > 0 && order.customerId) {
              try {
                  const refundResult = await (storage as any).processWalletRecharge(
                      order.customerId,
                      totalPaid,
                      'WALLET_REFUND',
                      req.employee?.id || null,
                      req.employee?.username || 'system'
                  );

                  if (refundResult.success) {
                      await (storage as any).processRefundOut(
                          order.customerId,
                          totalPaid,
                          'WALLET',
                          `Auto-refund for cancelled order ${order.orderNumber}`,
                          orderId
                      );
                      
                      if (req.employee) {
                          await AuthService.logAction(
                              req.employee.employeeId,
                              req.employee.username,
                              'wallet_refund',
                              'customer',
                              order.customerId,
                              {
                                  amount: totalPaid,
                                  paymentMethod: 'WALLET',
                                  reason: `Auto-refund for cancelled order ${order.orderNumber}`,
                                  orderId
                              },
                              req.ip || req.connection.remoteAddress,
                              req.get('user-agent')
                          );
                      }
                  }
              } catch (err) {
                  console.error('[Auto-Refund] Error auto-refunding to wallet on cancel via status:', err);
              }
          }
      }

      const serializedOrder = serializeOrder(updatedOrder);
      res.json(createSuccessResponse(serializedOrder, 'Order status updated successfully'));
    } catch (error: any) {
      console.error('Update order status error:', error);
      res.status(500).json(createErrorResponse(`Failed to update order status: ${error.message || 'Unknown error'}`, 500));
    }
  },
);

// Mark tags as printed
router.patch('/:id/tags-printed', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    if (typeof (storage as any).markTagsPrinted === 'function') {
      await (storage as any).markTagsPrinted(orderId);
    } else {
      await storage.updateOrder(orderId, { tagsPrinted: true } as any);
    }

    if (req.employee) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'print_tags',
        'order',
        orderId,
        { orderNumber: order.orderNumber },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(createSuccessResponse(null, 'Tags marked as printed'));
  } catch (error) {
    console.error('Mark tags printed error:', error);
    res.status(500).json(createErrorResponse('Failed to mark tags as printed', 500));
  }
});

// Log print action (Bill/Invoice)
router.post('/:id/log-print', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { type = 'bill' } = req.body;

    if (req.employee) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'print_document',
        'order',
        orderId,
        {
          documentType: type
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(createSuccessResponse(null, 'Print action logged'));
  } catch (error) {
    console.error('Log print error:', error);
    res.status(500).json(createErrorResponse('Failed to log print action', 500));
  }
});

// Assign delivery partner to order
router.patch('/:id/assign-delivery', async (req, res) => {
  return res.status(410).json(createErrorResponse(DELIVERY_DISABLED_MESSAGE, 410));
});

// Delivery Partner Completes Order & Collects Payment
router.patch('/:id/delivery-complete', async (req, res) => {
  return res.status(410).json(createErrorResponse(DELIVERY_DISABLED_MESSAGE, 410));
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    const deleted = await storage.deleteOrder(orderId);

    if (!deleted) {
      return res.status(500).json(createErrorResponse('Failed to delete order', 500));
    }

    if (req.employee) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'delete_order',
        'order',
        orderId,
        {
          orderNumber: order.orderNumber
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    realtimeServer.triggerUpdate('order', 'deleted', { orderId });

    res.json(createSuccessResponse(null, 'Order deleted successfully'));
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json(createErrorResponse('Failed to delete order', 500));
  }
});

// Get order analytics
router.get(
  "/analytics/overview",
  async (req, res) => {
    try {
      const orders = await storage.listOrders();

      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, order: Order) => sum + parseFloat(order.totalAmount || '0'), 0),
        statusBreakdown: orders.reduce((acc: Record<string, number>, order: Order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageOrderValue: orders.length > 0
          ? orders.reduce((sum: number, order: Order) => sum + parseFloat(order.totalAmount || '0'), 0) / orders.length
          : 0,
        ordersToday: orders.filter((order: Order) => {
          const today = new Date().toISOString().split('T')[0];
          const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : '';
          return orderDate === today;
        }).length
      };

      res.json(createSuccessResponse(analytics));
    } catch (error) {
      console.error('Get order analytics error:', error);
      res.status(500).json(createErrorResponse('Failed to fetch order analytics', 500));
    }
  },
);

export default router;
