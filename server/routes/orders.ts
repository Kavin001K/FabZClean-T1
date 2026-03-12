import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import { insertOrderSchema, type Order, type Product } from "../../shared/schema";
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
  type OrderStatus,
  type FulfillmentType,
} from "../services/whatsapp.service";

const router = Router();
const orderService = new OrderService();
const DELIVERY_DISABLED_MESSAGE = 'Delivery operations are disabled in this build.';
const DELIVERY_DISABLED_STATUSES = new Set(['assigned', 'ready_for_delivery', 'out_for_delivery', 'delivered']);
const FINANCIAL_MUTATION_FIELDS = new Set(['paymentStatus', 'advancePaid', 'walletUsed', 'creditUsed', 'paymentMethod']);

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

const schedulePostCreateTasks = (order: any) => {
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

    console.log(`[GET /api/orders] Query: ${JSON.stringify(req.query)}`);

    const filters = {
      limit,
      search,
      status: status === 'all' ? undefined : status,
      customerEmail,
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

      // Delivery is disabled for new orders in this build.
      orderData.fulfillmentType = 'pickup';
      orderData.deliveryCharges = '0';
      orderData.deliveryAddress = null;
      orderData.deliveryPartnerId = null;
      if (DELIVERY_DISABLED_STATUSES.has(orderData.status)) {
        orderData.status = 'pending';
      }

      // Financial posting is now canonical via checkout engine only.
      orderData.paymentStatus = 'pending';

      // Add employee ID for order tracking
      if (req.employee) {
        orderData.employeeId = req.employee.employeeId;
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
      // allow new customers / customers without past due,
      // enforce only when an existing unpaid balance is already above the configured limit.
      if (orderData.customerId) {
        const customer = await storage.getCustomer(orderData.customerId);
        if (customer) {
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
        }
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
        order = await storage.getOrder(order.id) || order;
      }

      // Log order creation
      if (req.employee) {
        await AuthService.logAction(
          req.employee.employeeId,
          req.employee.username,
          'create_order',
          'order',
          order.id,
          {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            customerName: order.customerName
          },
          req.ip || req.connection.remoteAddress,
          req.get('user-agent')
        );

        if (creditOverrideApproved && creditOverrideMetadata) {
          await AuthService.logAction(
            req.employee.employeeId,
            req.employee.username,
            'approve_credit_override',
            'customer',
            creditOverrideMetadata.customerId,
            {
              orderId: order.id,
              orderNumber: order.orderNumber,
              outstandingBefore: creditOverrideMetadata.outstandingBefore,
              creditLimit: creditOverrideMetadata.creditLimit,
              projectedCreditRequired: creditOverrideMetadata.projectedCreditRequired,
            },
            req.ip || req.connection.remoteAddress,
            req.get('user-agent')
          );
        }
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
      schedulePostCreateTasks(order);
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
    const updateData = req.body || {};
    console.log(`[UPDATE ORDER] ID: ${orderId}`, JSON.stringify(updateData, null, 2));

    const attemptedFinancialMutations = Object.keys(updateData).filter((field) =>
      FINANCIAL_MUTATION_FIELDS.has(field)
    );
    if (attemptedFinancialMutations.length > 0) {
      return res.status(400).json(createErrorResponse(
        `Direct mutation blocked for financial fields: ${attemptedFinancialMutations.join(', ')}. Use checkout/credit APIs.`,
        400
      ));
    }

    if (updateData.status && DELIVERY_DISABLED_STATUSES.has(String(updateData.status))) {
      return res.status(410).json(createErrorResponse(DELIVERY_DISABLED_MESSAGE, 410));
    }

    if (
      updateData.fulfillmentType === 'delivery' ||
      updateData.deliveryAddress !== undefined ||
      updateData.deliveryCharges !== undefined ||
      updateData.deliveryPartnerId !== undefined
    ) {
      return res.status(410).json(createErrorResponse(DELIVERY_DISABLED_MESSAGE, 410));
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    const updatedOrder = await storage.updateOrder(orderId, updateData);

    // Log updates
    if (req.employee) {
      const changes: any = {};

      if (updateData.totalAmount && updateData.totalAmount !== order.totalAmount) {
        changes.price_changed = {
          from: order.totalAmount,
          to: updateData.totalAmount
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

    // If status was changed, send WhatsApp notification
    if (updateData.status && updateData.status !== order.status) {
      handleOrderStatusChange(
        {
          customerPhone: updatedOrder?.customerPhone,
          customerName: updatedOrder?.customerName || order.customerName,
          orderNumber: updatedOrder?.orderNumber || order.orderNumber,
          totalAmount: updatedOrder?.totalAmount || order.totalAmount,
          status: updateData.status as OrderStatus,
          fulfillmentType: (updatedOrder?.fulfillmentType || order.fulfillmentType || 'pickup') as FulfillmentType,
          items: updatedOrder?.items || order.items || [],
          invoiceUrl: (updatedOrder as any)?.invoiceUrl || (order as any)?.invoiceUrl || null,
          invoiceNumber: (updatedOrder as any)?.invoiceNumber || order.orderNumber,
        },
        order.status as OrderStatus
      ).then(async (result) => {
        if (result?.success) {
          console.log(`✅ [WhatsApp] Status update notification sent for ${order.orderNumber}`);
          try {
            const currentCount = (updatedOrder as any)?.whatsappMessageCount || 0;
            await storage.updateOrder(orderId, {
              lastWhatsappStatus: `${updateData.status} - Sent`,
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
              lastWhatsappStatus: `${updateData.status} - Failed: ${result.error}`,
            });
          } catch (updateErr) {
            console.warn('Failed to update WhatsApp status:', updateErr);
          }
        }
      }).catch(err => {
        console.error(`❌ [WhatsApp] Error sending status notification:`, err);
      });
    }

    const serializedOrder = serializeOrder(updatedOrder);
    res.json(createSuccessResponse(serializedOrder, 'Order updated successfully'));
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json(createErrorResponse('Failed to update order', 500));
  }
});

// Update order status
router.patch(
  "/:id/status",
  async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;

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
        'ready': 3,
        'out_for_delivery': 4,
        'delivered': 5,
        'completed': 5,
        'cancelled': 99,
        'refunded': 100,
      };

      const currentStatusLevel = STATUS_ORDER[order.status] || 0;
      const newStatusLevel = STATUS_ORDER[status] || 0;

      if (status !== 'cancelled' && status !== 'refunded') {
        if (newStatusLevel < currentStatusLevel) {
          return res.status(400).json(createErrorResponse(
            `Cannot change status from '${order.status}' to '${status}'. Order status changes are irreversible.`,
            400
          ));
        }
      } else if (status === 'cancelled') {
        if (!['pending', 'processing'].includes(order.status)) {
          return res.status(400).json(createErrorResponse(
            `Cannot cancel an order with status '${order.status}'. Orders can only be cancelled when pending or processing.`,
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

      const updatedOrder = await storage.updateOrder(orderId, { status });

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
            to: status
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

      // Send WhatsApp notification for status change
      handleOrderStatusChange(
        {
          customerPhone: updatedOrder?.customerPhone,
          customerName: updatedOrder?.customerName || order.customerName,
          orderNumber: updatedOrder?.orderNumber || order.orderNumber,
          totalAmount: updatedOrder?.totalAmount || order.totalAmount,
          status: status as OrderStatus,
          fulfillmentType: (updatedOrder?.fulfillmentType || order.fulfillmentType || 'pickup') as FulfillmentType,
          items: updatedOrder?.items || order.items || [],
          invoiceUrl: (updatedOrder as any)?.invoiceUrl || (order as any)?.invoiceUrl || null,
          invoiceNumber: (updatedOrder as any)?.invoiceNumber || order.orderNumber,
        },
        order.status as OrderStatus
      ).then(async (result) => {
        if (result?.success) {
          console.log(`✅ [WhatsApp] Status update notification sent for ${order.orderNumber}`);
          try {
            const currentCount = (updatedOrder as any)?.whatsappMessageCount || 0;
            await storage.updateOrder(orderId, {
              lastWhatsappStatus: `${status} - Sent`,
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
              lastWhatsappStatus: `${status} - Failed: ${result.error}`,
            });
          } catch (updateErr) {
            console.warn('Failed to update WhatsApp status:', updateErr);
          }
        }
      }).catch(err => {
        console.error(`❌ [WhatsApp] Error sending status notification:`, err);
      });

      const serializedOrder = serializeOrder(updatedOrder);
      res.json(createSuccessResponse(serializedOrder, 'Order status updated successfully'));
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json(createErrorResponse('Failed to update order status', 500));
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
