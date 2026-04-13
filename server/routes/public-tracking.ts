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

        const o: any = order;
        console.log(`[Track] Found order: ${o.orderNumber || o.order_number} (${o.id})`);

        // Try to find invoice/bill document for this order
        let invoiceUrl = o.invoiceUrl || o.invoice_url || o.billUrl || o.bill_url || o.pdfUrl || o.pdf_url;

        if (!invoiceUrl) {
            try {
                // Look up document by order number
                const documents = await storage.listDocuments({
                    type: 'invoice',
                    limit: 100
                });

                const orderNum = o.orderNumber || o.order_number;
                const orderDoc = documents.find((doc: any) =>
                    doc.orderNumber === orderNum ||
                    doc.order_number === orderNum ||
                    (doc.metadata && (doc.metadata.orderNumber === orderNum || doc.metadata.orderId === o.id))
                );

                if (orderDoc) {
                    invoiceUrl = orderDoc.fileUrl || orderDoc.file_url;
                    console.log(`[Track] Found invoice document: ${invoiceUrl}`);
                }
            } catch (docError) {
                console.log('[Track] Could not lookup documents:', docError);
            }
        }

        // Return sanitized order data (exclude sensitive info)
        // Handle both camelCase and snake_case field names for Supabase compatibility
        // Handle both camelCase and snake_case field names for Supabase compatibility
        const trackingData = {
            id: o.id,
            orderNumber: o.order_number || o.orderNumber,
            customerName: o.customerName || o.customer_name,
            status: o.status,
            paymentStatus: o.payment_status || o.paymentStatus,
            totalAmount: o.total_amount || o.totalAmount,
            items: (o.items || []).map((item: any) => ({
                serviceName: item.serviceName || item.service_name || item.name || item.productName || 'Service',
                quantity: item.quantity,
                price: item.price || item.unitPrice || item.unit_price,
            })),
            fulfillmentType: o.fulfillmentType || o.fulfillment_type || 'pickup',
            createdAt: o.createdAt || o.created_at,
            updatedAt: o.updatedAt || o.updated_at,
            pickupDate: o.pickupDate || o.pickup_date,
            // Invoice/Bill URL for download (from order or documents table)
            invoiceUrl: invoiceUrl ? (invoiceUrl.startsWith('http') ? invoiceUrl : `https://bill.myfabclean.com${invoiceUrl.startsWith('/') ? '' : '/'}${invoiceUrl}`) : null,
            // WhatsApp notification info
            lastWhatsappStatus: o.lastWhatsappStatus || o.last_whatsapp_status,
            lastWhatsappSentAt: o.lastWhatsappSentAt || o.last_whatsapp_sent_at,
        };

        res.json(createSuccessResponse(trackingData));
    } catch (error) {
        console.error('Track order error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch order', 500));
    }
});

export default router;
