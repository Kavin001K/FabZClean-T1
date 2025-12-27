import { Router } from "express";
import { db as storage } from "../db";
import { createErrorResponse, createSuccessResponse } from "../services/serialization";

const router = Router();

/**
 * Public Order Tracking API
 * No authentication required - allows customers to track their orders
 */

// Track order by order number (public endpoint)
router.get('/track/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;

        if (!orderNumber) {
            return res.status(400).json(createErrorResponse('Order number is required', 400));
        }

        console.log(`[Track] Looking up order: ${orderNumber}`);

        // Normalize the search term - remove hash prefix, trim whitespace
        const searchTerm = orderNumber.trim().replace(/^#/, '').toLowerCase();

        // Find order by order number (flexible matching)
        const orders = await storage.listOrders();
        console.log(`[Track] Fetched ${orders?.length || 0} orders from database`);

        const order = orders.find((o: any) => {
            // Handle both camelCase and snake_case field names (for Supabase compatibility)
            const storedOrderNum = (o.orderNumber || o.order_number || '').toString().trim().replace(/^#/, '').toLowerCase();
            const storedId = (o.id || '').toLowerCase();

            // Check various matching conditions
            return (
                // Exact match (case insensitive)
                storedOrderNum === searchTerm ||
                // Match by ID
                storedId === searchTerm ||
                // Match with FZC prefix variations
                storedOrderNum === `fzc-${searchTerm}` ||
                searchTerm === `fzc-${storedOrderNum}` ||
                // Partial match (order number contains search term)
                storedOrderNum.includes(searchTerm) ||
                searchTerm.includes(storedOrderNum)
            );
        });

        if (!order) {
            console.log(`[Track] Order not found for: ${orderNumber}`);
            console.log(`[Track] Available orders:`, orders.slice(0, 5).map((o: any) => o.orderNumber || o.order_number));
            return res.status(404).json(createErrorResponse('Order not found', 404));
        }

        console.log(`[Track] Found order: ${order.orderNumber || order.order_number} (${order.id})`);

        // Return sanitized order data (exclude sensitive info)
        // Handle both camelCase and snake_case field names for Supabase compatibility
        const trackingData = {
            id: order.id,
            orderNumber: order.orderNumber || order.order_number,
            customerName: order.customerName || order.customer_name,
            status: order.status,
            paymentStatus: order.paymentStatus || order.payment_status,
            totalAmount: order.totalAmount || order.total_amount,
            items: (order.items || []).map((item: any) => ({
                serviceName: item.serviceName || item.service_name || item.name || item.productName || 'Service',
                quantity: item.quantity,
                price: item.price || item.unitPrice || item.unit_price,
            })),
            fulfillmentType: order.fulfillmentType || order.fulfillment_type || 'pickup',
            createdAt: order.createdAt || order.created_at,
            updatedAt: order.updatedAt || order.updated_at,
            pickupDate: order.pickupDate || order.pickup_date,
            // WhatsApp notification info
            lastWhatsappStatus: order.lastWhatsappStatus || order.last_whatsapp_status,
            lastWhatsappSentAt: order.lastWhatsappSentAt || order.last_whatsapp_sent_at,
        };

        res.json(createSuccessResponse(trackingData));
    } catch (error) {
        console.error('Track order error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch order', 500));
    }
});

export default router;
