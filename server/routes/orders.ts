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
  sendOrderCreatedNotification,
  handleOrderStatusChange,
  type OrderStatus,
  type FulfillmentType,
} from "../services/whatsapp.service";

const router = Router();
const orderService = new OrderService();

// Apply rate limiting to all order routes
router.use(jwtRequired);

/**
 * POST /api/orders/:orderId/checkout
 * Process a checkout/payment for an order, supporting Cash/Wallet splits
 * Uses secure ACIDs RPC internally for wallet deductions
 */
router.post('/:id/checkout', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { customerId, cashAmount = 0, walletAmount = 0 } = req.body;

    const parsedCash = parseFloat(cashAmount);
    const parsedWallet = parseFloat(walletAmount);

    if (isNaN(parsedCash) || isNaN(parsedWallet) || (parsedCash <= 0 && parsedWallet <= 0)) {
      return res.status(400).json(createErrorResponse('Valid cash or wallet amount is required', 400));
    }

    if (!customerId) {
      return res.status(400).json(createErrorResponse('Customer ID is required for checkout', 400));
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found', 404));
    }

    // Process the payment through our master ledger RPC
    const recordedBy = req.employee?.id || 'system';
    const recordedByName = req.employee?.username || 'system';

    const result = await (storage as any).processOrderCheckout(
      orderId,
      customerId,
      parsedCash,
      parsedWallet,
      recordedBy,
      recordedByName
    );

    if (!result.success) {
      return res.status(400).json(createErrorResponse(result.error || 'Payment processing failed. Check wallet balance.', 400));
    }

    // Now update the order's payment-tracking fields.
    // The RPC handled the financial transaction (ledger & wallet).
    // We only update the order's metadata here.
    const totalPaid = parsedCash + parsedWallet;
    const orderTotal = parseFloat(order.totalAmount || '0');
    const previousAdvance = parseFloat(order.advancePaid || '0');
    const cumulativePaid = previousAdvance + totalPaid;

    const updates: any = {
      paymentMethod: parsedWallet > 0 && parsedCash > 0 ? 'SPLIT' : (parsedWallet > 0 ? 'CREDIT_WALLET' : 'CASH'),
    };

    // Determine payment status based on cumulative payments
    if (cumulativePaid >= orderTotal) {
      updates.paymentStatus = 'paid';
    } else if (cumulativePaid > 0) {
      updates.paymentStatus = 'partial';
      updates.advancePaid = cumulativePaid.toString();
    }

    // Only advance order status if it's in an early stage
    const earlyStatuses = ['pending', 'processing', 'confirmed'];
    if (cumulativePaid >= orderTotal && earlyStatuses.includes(order.status)) {
      updates.status = 'completed';
    }

    const updatedOrder = await storage.updateOrder(orderId, updates);

    // Provide the frontend with the newly updated order
    res.json(createSuccessResponse(updatedOrder, 'Order checkout successful'));
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json(createErrorResponse(`Failed to process checkout: ${error.message}`, 500));
  }
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
      const orderData = req.body;

      // Add employee ID for order tracking
      if (req.employee) {
        orderData.employeeId = req.employee.employeeId;
      }

      // Use OrderService to create order
      const order = await orderService.createOrder(orderData);

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
      }

      // Award loyalty points (only if customerId exists)
      if (order.customerId) {
        try {
          await loyaltyProgram.processOrderRewards(
            order.customerId,
            parseFloat(order.totalAmount || "0")
          );
        } catch (loyaltyError) {
          console.warn('Failed to process loyalty rewards:', loyaltyError);
        }

        // Handle credit payment - add to customer's credit balance
        if (order.paymentStatus === 'credit') {
          try {
            const totalAmount = parseFloat(order.totalAmount || "0");
            const advancePaid = parseFloat(order.advancePaid || "0");
            const creditAmount = Math.max(0, totalAmount - advancePaid);

            if (creditAmount > 0) {
              await storage.addCustomerCredit(
                order.customerId,
                creditAmount,
                'credit',
                `Order ${order.orderNumber} placed on credit (Total: ${totalAmount}, Advance: ${advancePaid})`,
                order.id,
                req.employee?.employeeId
              );
              console.log(`💳 [Credit] Added ₹${creditAmount} to customer ${order.customerId} credit for order ${order.orderNumber}`);
            }
          } catch (creditError) {
            console.warn('Failed to add customer credit:', creditError);
          }
        }
      }

      // Generate QR code
      try {
        await barcodeService.generateOrderBarcode(order.id);
      } catch (barcodeError) {
        console.warn('Failed to generate barcode:', barcodeError);
      }

      // Notify real-time clients
      realtimeServer.triggerUpdate('order', 'created', order);

      // Note: We no longer send WhatsApp automatically on order creation from here.
      // The frontend handles generating the PDF bill and calling /api/whatsapp/send-bill
      // to ensure the real PDF link is sent rather than a static placeholder.

      const serializedOrder = serializeOrder(order);
      res.status(201).json(createSuccessResponse(serializedOrder, 'Order created successfully'));
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
    const updateData = req.body;
    console.log(`[UPDATE ORDER] ID: ${orderId}`, JSON.stringify(updateData, null, 2));

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

      if (updateData.paymentStatus && updateData.paymentStatus !== order.paymentStatus) {
        changes.payment_status_changed = {
          from: order.paymentStatus,
          to: updateData.paymentStatus
        };

        if (updateData.paymentStatus === 'paid') {
          await AuthService.logAction(
            req.employee.employeeId,
            req.employee.username,
            'payment_received',
            'order',
            orderId,
            {
              amount: updatedOrder?.totalAmount,
              method: updatedOrder?.paymentMethod
            },
            req.ip || req.connection.remoteAddress,
            req.get('user-agent')
          );

          if (order.paymentStatus === 'credit' && order.customerId) {
            try {
              const orderAmount = parseFloat(order.totalAmount || "0");
              await storage.addCustomerCredit(
                order.customerId,
                -orderAmount,
                'payment',
                `Payment received for order ${order.orderNumber}`,
                orderId,
                req.employee?.employeeId
              );
              console.log(`💳 [Credit] Reduced ₹${orderAmount} from customer ${order.customerId} credit - order ${order.orderNumber} paid`);
            } catch (creditError) {
              console.warn('Failed to reduce customer credit:', creditError);
            }
          }
        }

        if (updateData.paymentStatus === 'credit' && order.paymentStatus !== 'credit' && order.customerId) {
          try {
            const orderAmount = parseFloat(order.totalAmount || "0");
            await storage.addCustomerCredit(
              order.customerId,
              orderAmount,
              'credit',
              `Order ${order.orderNumber} marked as credit`,
              orderId,
              req.employee?.employeeId
            );
            console.log(`💳 [Credit] Added ₹${orderAmount} to customer ${order.customerId} credit for order ${order.orderNumber}`);
          } catch (creditError) {
            console.warn('Failed to add customer credit:', creditError);
          }
        }
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

      if ((status === 'completed' || status === 'delivered') && order.paymentStatus !== 'paid' && order.paymentStatus !== 'credit') {
        return res.status(400).json(createErrorResponse(
          'Payment must be marked as paid or credit before completing or delivering the order',
          400
        ));
      }

      // Enforce Home Delivery Flow strict rules
      if (status === 'delivered') {
        if (req.employee?.id !== order.deliveryPartnerId) {
          return res.status(403).json(createErrorResponse(
            'Only the assigned delivery captain can manually mark an order as delivered.',
            403
          ));
        }
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
  try {
    const orderId = req.params.id;
    const { deliveryPartnerId } = req.body;

    if (!deliveryPartnerId) {
      return res.status(400).json(createErrorResponse('Delivery Partner ID is required', 400));
    }

    // Verify employee exists and is a delivery partner
    const employees = await storage.listEmployees();
    const employee = employees.find(e => e.id === deliveryPartnerId || e.employeeId === deliveryPartnerId);

    if (!employee || employee.position !== 'delivery') {
      return res.status(400).json(createErrorResponse('Invalid delivery partner selected', 400));
    }

    // Update the order
    const updatedOrder = await storage.updateOrder(orderId, {
      deliveryPartnerId: employee.id, // Ensure we use the UUID from the DB
      status: 'out_for_delivery'
    });

    // Notify real-time clients
    realtimeServer.triggerUpdate('order', 'updated', updatedOrder);

    // Log action
    if (req.employee) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'assign_delivery',
        'order',
        orderId,
        { deliveryPartnerId: employee.employeeId, deliveryPartnerName: employee.firstName },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
    }

    res.json(createSuccessResponse(serializeOrder(updatedOrder), 'Delivery partner assigned successfully'));
  } catch (error) {
    console.error('Assign delivery error:', error);
    res.status(500).json(createErrorResponse('Failed to assign delivery partner', 500));
  }
});

// Delivery Partner Completes Order & Collects Payment
router.patch('/:id/delivery-complete', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { paymentCollected, paymentMethod } = req.body;

    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json(createErrorResponse('Order not found', 404));

    // Security Check: Ensure the user marking it completed is actually the assigned driver
    if (req.employee && req.employee.id !== order.deliveryPartnerId) {
      if (req.employee.role !== 'admin') {
        return res.status(403).json(createErrorResponse('Only the assigned captain can mark this order as delivered', 403));
      }
    }

    const updates: any = { status: 'delivered' };

    if (paymentCollected) {
      updates.paymentStatus = 'paid';
      if (paymentMethod) updates.paymentMethod = paymentMethod;
    }

    const updatedOrder = await storage.updateOrder(orderId, updates);

    // If payment was collected, map to wallet credit reductions or standard logging
    if (paymentCollected && req.employee) {
      await AuthService.logAction(
        req.employee.employeeId,
        req.employee.username,
        'payment_received_delivery',
        'order',
        orderId,
        { amount: updatedOrder?.totalAmount, method: updates.paymentMethod || order.paymentMethod },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );

      // Credit processing hook if originally credit but now paid cash on delivery
      if (order.paymentStatus === 'credit' && order.customerId) {
        try {
          const orderAmount = parseFloat(order.totalAmount || "0");
          await storage.addCustomerCredit(
            order.customerId,
            -orderAmount,
            'payment',
            `Payment collected strictly upon delivery for order ${order.orderNumber}`,
            orderId,
            req.employee?.employeeId
          );
        } catch (creditError) {
          console.warn('Failed to reduce customer credit after cash on delivery:', creditError);
        }
      }
    }

    realtimeServer.triggerUpdate('order', 'status_changed' as any, {
      orderId: orderId,
      status: 'delivered',
      previousStatus: order.status
    });

    res.json(createSuccessResponse(serializeOrder(updatedOrder), 'Order delivered successfully'));
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json(createErrorResponse('Failed to complete delivery', 500));
  }
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
