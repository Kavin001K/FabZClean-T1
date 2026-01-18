// server/services/whatsapp.service.ts
// MSG91 WhatsApp API Integration Service with Template Management

// Template configuration for different message types
const TEMPLATES = {
    order: {
        namespace: process.env.MSG91_NAMESPACE || "1520cd50_8420_404b_b634_4808f5f33034",
        name: process.env.MSG91_TEMPLATE_NAME || "v",
    },
    bill: {
        namespace: process.env.MSG91_NAMESPACE_Bill || "1520cd50_8420_404b_b634_4808f5f33034",
        name: process.env.MSG91_TEMPLATE_NAME_Bill || "bill",
    },
    invoice: {
        namespace: process.env.MSG91_NAMESPACE_Invoice || "1520cd50_8420_404b_b634_4808f5f33034",
        name: process.env.MSG91_TEMPLATE_NAME_Invoice || "invoice_fabzclean",
    },
};

// App base URL for tracking links and terms pages
// Configure via environment variable: APP_BASE_URL=https://acedigital.myfabclean.com
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://acedigital.myfabclean.com';

// Max number of resends allowed per order
export const MAX_RESENDS = 3;

// Template type for different scenarios
export type MessageTemplateType = 'order' | 'bill' | 'invoice';

// Order status types for triggering messages
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'assigned' |
    'in_transit' | 'shipped' | 'out_for_delivery' | 'delivered' | 'in_store' |
    'ready_for_transit' | 'ready_for_pickup';

// Fulfillment type determines the final status message
export type FulfillmentType = 'pickup' | 'delivery';

interface OrderCreatedMessageParams {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    amount: string; // Format: "Rs.123"
}

interface OrderProcessingMessageParams {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    invoiceNumber?: string; // Invoice number for {{2}} placeholder
    amount?: string; // Amount for {{3}} and {{4}} placeholders (e.g., "1234" or "₹1,234")
    pdfUrl?: string; // URL to the PDF invoice document for header
}

interface OrderStatusUpdateMessageParams {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    status: string;
    additionalInfo?: string;
}

interface InvoiceMessageParams {
    phoneNumber: string;
    pdfUrl: string;
    filename: string;
    customerName: string;
    invoiceNumber: string;
    amount: string;
    itemName: string;
    templateType?: MessageTemplateType;
}

interface TextMessageParams {
    phoneNumber: string;
    message: string;
}

interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    templateUsed?: string;
}

/**
 * Clean and format phone number for India
 */
function cleanPhoneNumber(phone: string): string {
    let cleanPhone = phone.replace(/[+\s\-()]/g, '');
    // Remove leading zeros
    cleanPhone = cleanPhone.replace(/^0+/, '');
    // Add India country code if not present
    if (!cleanPhone.startsWith('91')) {
        cleanPhone = '91' + cleanPhone;
    }
    return cleanPhone;
}

/**
 * Get template based on send count
 * 1st send (on order creation): 'order' template
 * 2nd send (1st resend): 'bill' template
 * 3rd send (2nd resend): 'invoice' template
 */
export function getTemplateForSendCount(sendCount: number): MessageTemplateType {
    if (sendCount === 0) return 'order';
    if (sendCount === 1) return 'bill';
    return 'invoice';
}

/**
 * Determine the status message based on fulfillment type
 * - If pickup: "Ready to Pickup"
 * - If delivery: "Out For Delivery"
 */
export function getStatusMessageForFulfillment(
    status: OrderStatus,
    fulfillmentType: FulfillmentType
): string | null {
    // For ready_for_pickup or out_for_delivery statuses
    if (status === 'ready_for_pickup' || (fulfillmentType === 'pickup' && status === 'completed')) {
        return 'Ready to Pickup';
    }
    if (status === 'out_for_delivery' || (fulfillmentType === 'delivery' && status === 'completed')) {
        return 'Out For Delivery';
    }
    return null;
}

/**
 * Send Order Created notification via WhatsApp
 * Template: "v" - Sends the order amount (e.g., "Rs.123")
 * 
 * AUTO-TRIGGERED: When a new order is created
 */
export async function sendOrderCreatedNotification({
    phoneNumber,
    customerName,
    orderNumber,
    amount,
}: OrderCreatedMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15558125705';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES.order;
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    const cleanOrderNumber = orderNumber.replace(/[#]/g, '').trim();

    // Template "v" expects amount parameter
    const payload = {
        integrated_number: integratedNumber,
        content_type: "template",
        payload: {
            messaging_product: "whatsapp",
            type: "template",
            template: {
                name: template.name,
                language: {
                    code: "en",
                    policy: "deterministic",
                },
                namespace: template.namespace,
                to_and_components: [
                    {
                        to: [cleanPhone],
                        components: {
                            // Header: Document (Required by template 'v')
                            header_1: {
                                type: "document",
                                value: process.env.DEFAULT_INVOICE_URL || "https://rxyatfvjjnvjxwyhhhqn.supabase.co/storage/v1/object/public/pdfs/bill-1766141946654-106714533.pdf",
                                filename: "Order-Confirmation.pdf",
                            },
                            // Body 1: Customer Name
                            body_1: {
                                type: "text",
                                value: customerName,
                            },
                            // Body 2: Order Number
                            body_2: {
                                type: "text",
                                value: orderNumber,
                            },
                            // Body 3: Item/Description (e.g. "Laundry Order")
                            body_3: {
                                type: "text",
                                value: "Laundry Order",
                            },
                            // Body 4: Amount
                            body_4: {
                                type: "text",
                                value: amount,
                            },
                            // Button 1: Track Order - dynamic URL suffix
                            button_1: {
                                subtype: "url",
                                type: "text",
                                value: `${APP_BASE_URL}/trackorder/${cleanOrderNumber}`,
                            },
                            // Button 2: Terms & Conditions - dynamic URL suffix
                            button_2: {
                                subtype: "url",
                                type: "text",
                                value: `${APP_BASE_URL}/terms`,
                            },
                        },
                    },
                ],
            },
        },
    };

    try {
        console.log(`📱 [WhatsApp] Sending Order Created to ${cleanPhone}`);
        console.log(`📄 [WhatsApp] Template: ${template.name} (order)`);
        console.log(`💰 [WhatsApp] Order: ${orderNumber}, Amount: ${amount}`);

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authkey": authKey,
                },
                body: JSON.stringify(payload),
            }
        );

        const resultText = await response.text();
        console.log(`✅ [WhatsApp] MSG91 Response (${response.status}):`, resultText);

        if (!response.ok) {
            return {
                success: false,
                error: `MSG91 API Error: ${response.status} - ${resultText}`,
                templateUsed: template.name,
            };
        }

        let result;
        try {
            result = JSON.parse(resultText);
        } catch {
            result = { raw: resultText };
        }

        return {
            success: true,
            messageId: result?.message_id || result?.id || 'sent',
            templateUsed: template.name,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [WhatsApp] Order Created Error:`, errorMessage);
        return {
            success: false,
            error: errorMessage,
            templateUsed: template.name,
        };
    }
}

/**
 * Send Order Processing notification via WhatsApp
 * Template: "bill" - Includes:
 *   - Header: Document (PDF invoice)
 *   - Body: Hi {{1}}! 👋 Your order for ₹{{4}} is currently Processing!
 *          We have generated Invoice {{2}} for {{3}}.
 *   - Button 1: Track Order with link ${APP_BASE_URL}/trackorder/{{1}} (order number)
 *   - Button 2: Terms & Conditions with link https://myfabclean.com/{{1}} (terms path)
 * 
 * AUTO-TRIGGERED: When order status changes to "processing"
 */
export async function sendOrderProcessingNotification({
    phoneNumber,
    customerName,
    orderNumber,
    invoiceNumber,
    amount,
    pdfUrl,
}: OrderProcessingMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15558125705';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES.bill;
    const cleanPhone = cleanPhoneNumber(phoneNumber);

    // Clean order number for URL (remove # and special characters)
    // This becomes the dynamic suffix for the Track Order button URL
    const cleanOrderNumber = orderNumber.replace(/[#]/g, '').trim();

    // Processing image URL (hosted publicly accessible image)
    const processingImageUrl = process.env.WHATSAPP_PROCESSING_IMAGE_URL ||
        'https://rxyatfvjjnvjxwyhhhqn.supabase.co/storage/v1/object/public/Templates/Screenshot%202025-12-27%20at%2010.32.31%20PM.png';

    // Template "bill" (ACTUAL MSG91 SPEC):
    // - header_1: IMAGE (type: "image", value: "<url>")
    // - body_1: text ({{1}} = Customer Name)
    // - body_2: text ({{2}} = Order Number)
    // - button_1: url (Track Order - dynamic suffix)
    // - button_2: url (Terms - dynamic suffix)

    const payload = {
        integrated_number: integratedNumber,
        content_type: "template",
        payload: {
            messaging_product: "whatsapp",
            type: "template",
            template: {
                name: template.name,
                language: {
                    code: "en",
                    policy: "deterministic",
                },
                namespace: template.namespace,
                to_and_components: [
                    {
                        to: [cleanPhone],
                        components: {
                            // Header: IMAGE (not document!)
                            header_1: {
                                type: "image",
                                value: processingImageUrl,
                            },
                            // Body: Only 2 params for "bill" template
                            // {{1}} = Customer Name
                            // {{2}} = Order Number
                            body_1: {
                                type: "text",
                                value: customerName,
                            },
                            body_2: {
                                type: "text",
                                value: orderNumber,
                            },
                            // Button 1: Track Order - Full URL
                            button_1: {
                                subtype: "url",
                                type: "text",
                                value: `${APP_BASE_URL}/trackorder/${cleanOrderNumber}`,
                            },
                            // Button 2: Terms & Conditions - Full URL
                            button_2: {
                                subtype: "url",
                                type: "text",
                                value: `${APP_BASE_URL}/terms`,
                            },
                        },
                    },
                ],
            },
        },
    };

    try {
        console.log(`📱 [WhatsApp] Sending Order Processing to ${cleanPhone}`);
        console.log(`📄 [WhatsApp] Template: ${template.name} (bill)`);
        console.log(`�️ [WhatsApp] Image: ${processingImageUrl}`);
        console.log(`🧺 [WhatsApp] Customer: ${customerName}, Order: ${orderNumber}`);
        console.log(`🔗 [WhatsApp] Track Link will be: ${APP_BASE_URL}/trackorder/${cleanOrderNumber}`);

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authkey": authKey,
                },
                body: JSON.stringify(payload),
            }
        );

        const resultText = await response.text();
        console.log(`✅ [WhatsApp] MSG91 Response (${response.status}):`, resultText);

        if (!response.ok) {
            return {
                success: false,
                error: `MSG91 API Error: ${response.status} - ${resultText}`,
                templateUsed: template.name,
            };
        }

        let result;
        try {
            result = JSON.parse(resultText);
        } catch {
            result = { raw: resultText };
        }

        return {
            success: true,
            messageId: result?.message_id || result?.id || 'sent',
            templateUsed: template.name,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [WhatsApp] Order Processing Error:`, errorMessage);
        return {
            success: false,
            error: errorMessage,
            templateUsed: template.name,
        };
    }
}

/**
 * Send Order Status Update notification via WhatsApp
 * Template: "invoice_fabzclean" - 👋 Dear {{1}}, Update for Order #{{2}}: Status: {{3}} ✅ {{4}}
 * Button: Track Order with URL ${APP_BASE_URL}/trackorder/{{1}} (order number)
 * 
 * AUTO-TRIGGERED: When order status changes to ready_for_pickup or out_for_delivery
 */
export async function sendOrderStatusUpdateNotification({
    phoneNumber,
    customerName,
    orderNumber,
    status,
    additionalInfo = 'Thank you for your patience!',
}: OrderStatusUpdateMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15558125705';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES.invoice;
    const cleanPhone = cleanPhoneNumber(phoneNumber);

    // Clean order number for URL (remove special chars if any)
    const cleanOrderNumber = orderNumber.replace(/[#]/g, '').trim();

    // Status update images - Different images for different status types
    // Completed order image (provided by user)
    const completedImageUrl = 'https://rxyatfvjjnvjxwyhhhqn.supabase.co/storage/v1/object/public/Templates/WhatsApp%20Image%202025-12-28%20at%2013.45.08.jpeg';

    // Default status image (for other statuses)
    const defaultStatusImageUrl = process.env.WHATSAPP_STATUS_IMAGE_URL ||
        'https://rxyatfvjjnvjxwyhhhqn.supabase.co/storage/v1/object/public/Templates/Screenshot%202025-12-27%20at%2010.32.31%20PM.png';

    // Choose the appropriate image based on status
    const isCompletedStatus = status.toLowerCase().includes('completed') ||
        status.toLowerCase().includes('delivered');
    const statusImageUrl = isCompletedStatus ? completedImageUrl : defaultStatusImageUrl;

    // Template "invoice_fabzclean" expects:
    // - Header: Image (status update image)
    // - Body: {{1}} = Customer Name, {{2}} = Order Number, {{3}} = Status, {{4}} = Additional info
    // - Button: Track Order URL with {{1}} = Order Number
    const payload = {
        integrated_number: integratedNumber,
        content_type: "template",
        payload: {
            messaging_product: "whatsapp",
            type: "template",
            template: {
                name: template.name,
                language: {
                    code: "en",
                    policy: "deterministic",
                },
                namespace: template.namespace,
                to_and_components: [
                    {
                        to: [cleanPhone],
                        components: {
                            // Header image component (required by template)
                            // MSG91 format: FLAT structure with type and value
                            header_1: {
                                type: "image",
                                value: statusImageUrl,
                            },
                            // Body Variables Mapping:
                            // {{1}} = Customer Name
                            // {{2}} = Order Number
                            // {{3}} = Status
                            // {{4}} = Additional Info
                            body_1: {
                                type: "text",
                                value: customerName,
                            },
                            body_2: {
                                type: "text",
                                value: orderNumber,
                            },
                            body_3: {
                                type: "text",
                                value: status,
                            },
                            body_4: {
                                type: "text",
                                value: additionalInfo,
                            },
                            // Button 1: Track Order - Full URL
                            button_1: {
                                subtype: "url",
                                type: "text",
                                value: `${APP_BASE_URL}/trackorder/${cleanOrderNumber}`,
                            },
                            // Button 2: Terms & Conditions - Full URL
                            button_2: {
                                subtype: "url",
                                type: "text",
                                value: `${APP_BASE_URL}/terms`,
                            },
                        },
                    },
                ],
            },
        },
    };

    try {
        console.log(`📱 [WhatsApp] Sending Status Update to ${cleanPhone}`);
        console.log(`📄 [WhatsApp] Template: ${template.name} (invoice)`);
        console.log(`📋 [WhatsApp] Customer: ${customerName}, Order: ${orderNumber}, Status: ${status}`);
        console.log(`🔗 [WhatsApp] Track URL: ${APP_BASE_URL}/trackorder/${cleanOrderNumber}`);

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authkey": authKey,
                },
                body: JSON.stringify(payload),
            }
        );

        const resultText = await response.text();
        console.log(`✅ [WhatsApp] MSG91 Response (${response.status}):`, resultText);

        if (!response.ok) {
            return {
                success: false,
                error: `MSG91 API Error: ${response.status} - ${resultText}`,
                templateUsed: template.name,
            };
        }

        let result;
        try {
            result = JSON.parse(resultText);
        } catch {
            result = { raw: resultText };
        }

        return {
            success: true,
            messageId: result?.message_id || result?.id || 'sent',
            templateUsed: template.name,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [WhatsApp] Status Update Error:`, errorMessage);
        return {
            success: false,
            error: errorMessage,
            templateUsed: template.name,
        };
    }
}

/**
 * Handle order status change and send appropriate WhatsApp notification
 * This is the main function to be called when order status changes
 * 
 * @param order - The order object with updated status
 * @param previousStatus - The previous status before update
 */
export async function handleOrderStatusChange(
    order: {
        customerPhone?: string | null;
        customerName: string;
        orderNumber: string;
        totalAmount: string;
        status: OrderStatus;
        fulfillmentType?: FulfillmentType | null;
        items?: Array<{ serviceName?: string; name?: string; quantity?: number }>;
        invoiceUrl?: string | null; // PDF invoice URL for WhatsApp document header
        invoiceNumber?: string | null; // Invoice number for template placeholder
    },
    previousStatus?: OrderStatus
): Promise<SendResult | null> {
    // Skip if no phone number
    if (!order.customerPhone) {
        console.log(`⚠️ [WhatsApp] No phone number for order ${order.orderNumber}, skipping notification`);
        return null;
    }

    const currentStatus = order.status;
    const fulfillmentType: FulfillmentType = order.fulfillmentType || 'pickup';

    console.log(`🔄 [WhatsApp] Order ${order.orderNumber} status changed: ${previousStatus} -> ${currentStatus}`);

    // Get item names for display in message
    const itemNames = order.items && order.items.length > 0
        ? order.items.map(item => item.serviceName || item.name || 'Item').slice(0, 3).join(', ')
        : 'Your items';

    // STATUS: processing - Send "bill" template with PDF invoice
    if (currentStatus === 'processing' && previousStatus !== 'processing') {
        console.log(`📤 [WhatsApp] Triggering Processing notification for order ${order.orderNumber}`);
        console.log(`📎 [WhatsApp] Invoice URL: ${order.invoiceUrl || 'Not available'}`);
        console.log(`🔗 [WhatsApp] Track Order URL will be: ${APP_BASE_URL}/trackorder/${order.orderNumber}`);

        return await sendOrderProcessingNotification({
            phoneNumber: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            invoiceNumber: order.invoiceNumber || order.orderNumber, // Fallback to order number
            amount: order.totalAmount,
            pdfUrl: order.invoiceUrl || undefined,
        });
    }

    // STATUS: ready_for_pickup - Send "invoice" template with "Ready to Pickup/Out for Delivery"
    if (currentStatus === 'ready_for_pickup' && previousStatus !== 'ready_for_pickup') {
        // Determine message based on fulfillment type
        const statusMessage = fulfillmentType === 'delivery' ? 'Ready to Pickup/Out for Delivery' : 'Ready to Pickup/Out for Delivery';
        const additionalInfo = `${itemNames}\n\nThank you for choosing Fab Clean! 🧺`;

        console.log(`📤 [WhatsApp] Triggering Ready for Pickup notification for order ${order.orderNumber}`);
        return await sendOrderStatusUpdateNotification({
            phoneNumber: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            status: statusMessage,
            additionalInfo: additionalInfo,
        });
    }

    // STATUS: out_for_delivery - Send "invoice" template with "Out For Delivery"
    if (currentStatus === 'out_for_delivery' && previousStatus !== 'out_for_delivery') {
        const additionalInfo = `${itemNames}\n\nOur delivery partner is on the way! 🚗`;

        console.log(`📤 [WhatsApp] Triggering Out for Delivery notification for order ${order.orderNumber}`);
        return await sendOrderStatusUpdateNotification({
            phoneNumber: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            status: 'Out For Delivery',
            additionalInfo: additionalInfo,
        });
    }

    // STATUS: completed - Determine based on fulfillment type
    if (currentStatus === 'completed' && previousStatus !== 'completed') {
        const statusMessage = fulfillmentType === 'pickup' ? 'Completed - Ready to Pickup' : 'Completed - Delivered';
        const additionalInfo = fulfillmentType === 'pickup'
            ? `${itemNames}\n\nYour items are ready! Please visit us to collect. 🙏`
            : `${itemNames}\n\nYour order has been delivered! Thank you! 🎉`;

        console.log(`📤 [WhatsApp] Triggering Completed (${fulfillmentType}) notification for order ${order.orderNumber}`);
        return await sendOrderStatusUpdateNotification({
            phoneNumber: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            status: statusMessage,
            additionalInfo: additionalInfo,
        });
    }

    // No notification needed for other status changes
    console.log(`ℹ️ [WhatsApp] No notification configured for status: ${currentStatus}`);
    return null;
}

/**
 * Send Invoice via WhatsApp with PDF attachment using MSG91 Template
 * 
 * MSG91 FORMAT (IMPORTANT - uses flat structure with 'value' fields):
 * - header_1: { type: "document", value: url, filename: name } - NOT nested!
 * - body_N: { type: "text", value: text } - NOT { text: text }
 * - button_N: { subtype: "url", type: "text", value: dynamic_suffix } - for URL buttons
 */
export async function sendInvoiceWhatsApp({
    phoneNumber,
    pdfUrl,
    filename,
    customerName,
    invoiceNumber,
    amount,
    itemName,
    templateType = 'order',
}: InvoiceMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15558125705';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES[templateType];
    const cleanPhone = cleanPhoneNumber(phoneNumber);

    // Clean order number for URL (remove # and special characters)
    const cleanOrderNumber = invoiceNumber.replace(/[#]/g, '').trim();

    // Build components based on template type
    // MSG91 expects FLAT format with 'value' field, NOT nested objects!
    let components: Record<string, any>;

    if (templateType === 'bill') {
        // "bill" template: IMAGE header, 2 body params, 2 URL buttons
        const processingImageUrl = process.env.WHATSAPP_PROCESSING_IMAGE_URL ||
            'https://rxyatfvjjnvjxwyhhhqn.supabase.co/storage/v1/object/public/Templates/Screenshot%202025-12-27%20at%2010.32.31%20PM.png';

        components = {
            // Header: IMAGE format
            header_1: {
                type: "image",
                value: processingImageUrl,
            },
            // Body params
            // {{1}} = Customer Name
            // {{2}} = Order/Invoice Number
            body_1: {
                type: "text",
                value: customerName,
            },
            body_2: {
                type: "text",
                value: invoiceNumber,
            },
            // Button 1: Track Order - Full URL
            button_1: {
                subtype: "url",
                type: "text",
                value: `${APP_BASE_URL}/trackorder/${cleanOrderNumber}`,
            },
            // Button 2: Terms & Conditions - Full URL
            button_2: {
                subtype: "url",
                type: "text",
                value: `${APP_BASE_URL}/terms`,
            },
        };
    } else if (templateType === 'invoice') {
        // "invoice_fabzclean" template: IMAGE header, 4 body params, 2 URL buttons
        const statusImageUrl = process.env.WHATSAPP_STATUS_IMAGE_URL ||
            'https://rxyatfvjjnvjxwyhhhqn.supabase.co/storage/v1/object/public/Templates/Screenshot%202025-12-27%20at%2010.32.31%20PM.png';

        components = {
            // Header: IMAGE format
            header_1: {
                type: "image",
                value: statusImageUrl,
            },
            // Body params
            body_1: {
                type: "text",
                value: customerName,
            },
            body_2: {
                type: "text",
                value: invoiceNumber,
            },
            body_3: {
                type: "text",
                value: amount,
            },
            body_4: {
                type: "text",
                value: itemName,
            },
            // Button 1: Track Order - Full URL
            button_1: {
                subtype: "url",
                type: "text",
                value: `${APP_BASE_URL}/trackorder/${cleanOrderNumber}`,
            },
            // Button 2: Terms & Conditions - Full URL
            button_2: {
                subtype: "url",
                type: "text",
                value: `${APP_BASE_URL}/terms`,
            },
        };
    } else {
        // "order" template (v): The user has indicated this is a full Invoice template
        // Includes: Document Header, 4 Body Params, 2 URL Buttons
        // Mapping corrected as per user request:
        // {{1}} = Customer Name
        // {{2}} = Order/Invoice Number
        // {{3}} = Item Name
        // {{4}} = Amount
        components = {
            // Header: Document format (PDF)
            header_1: {
                type: "document",
                value: pdfUrl,
                filename: filename,
            },
            body_1: {
                type: "text",
                value: customerName,
            },
            body_2: {
                type: "text",
                value: invoiceNumber,
            },
            body_3: {
                type: "text",
                value: itemName || "Laundry Services",
            },
            body_4: {
                type: "text",
                value: amount,
            },
            // Button 1: Track Order - Full URL
            button_1: {
                subtype: "url",
                type: "text",
                value: `${APP_BASE_URL}/trackorder/${cleanOrderNumber}`,
            },
            // Button 2: Terms & Conditions - Full URL
            button_2: {
                subtype: "url",
                type: "text",
                value: `${APP_BASE_URL}/terms`,
            },
        };
    }

    const payload = {
        integrated_number: integratedNumber,
        content_type: "template",
        payload: {
            messaging_product: "whatsapp",
            type: "template",
            template: {
                name: template.name,
                language: {
                    code: "en",
                    policy: "deterministic",
                },
                namespace: template.namespace,
                to_and_components: [
                    {
                        to: [cleanPhone],
                        components: components,
                    },
                ],
            },
        },
    };

    try {
        console.log(`📱 [WhatsApp] Sending to ${cleanPhone}`);
        console.log(`📄 [WhatsApp] Template: ${template.name} (${templateType})`);
        console.log(`📦 [WhatsApp] Invoice: ${invoiceNumber}, Amount: ${amount}`);
        console.log(`🔗 [WhatsApp] PDF URL: ${pdfUrl}`);
        console.log(`📋 [WhatsApp] Payload components:`, JSON.stringify(components, null, 2));

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authkey": authKey,
                },
                body: JSON.stringify(payload),
            }
        );

        const resultText = await response.text();
        console.log(`✅ [WhatsApp] MSG91 Response (${response.status}):`, resultText);

        if (!response.ok) {
            return {
                success: false,
                error: `MSG91 API Error: ${response.status} - ${resultText}`,
                templateUsed: template.name,
            };
        }

        let result;
        try {
            result = JSON.parse(resultText);
        } catch {
            result = { raw: resultText };
        }

        return {
            success: true,
            messageId: result?.message_id || result?.id || 'sent',
            templateUsed: template.name,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [WhatsApp] Error:`, errorMessage);
        return {
            success: false,
            error: errorMessage,
            templateUsed: template.name,
        };
    }
}

/**
 * Send plain text WhatsApp message (fallback when no PDF available)
 */
export async function sendTextWhatsApp({ phoneNumber, message }: TextMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15558125705';

    if (!authKey || !integratedNumber) {
        return { success: false, error: 'MSG91 not configured' };
    }

    const cleanPhone = cleanPhoneNumber(phoneNumber);

    const payload = {
        integrated_number: integratedNumber,
        content_type: "text",
        payload: {
            messaging_product: "whatsapp",
            type: "text",
            to: cleanPhone,
            text: {
                body: message,
            },
        },
    };

    try {
        console.log(`📱 [WhatsApp] Sending text to ${cleanPhone}`);

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authkey": authKey,
                },
                body: JSON.stringify(payload),
            }
        );

        const resultText = await response.text();
        console.log(`✅ [WhatsApp] Text Response (${response.status}):`, resultText);

        if (!response.ok) {
            return { success: false, error: `MSG91 Error: ${response.status}` };
        }

        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [WhatsApp] Text Error:`, errorMessage);
        return { success: false, error: errorMessage };
    }
}

/**
 * Send order confirmation (auto-send on order creation)
 * Uses 'order' template with amount
 */
export async function sendOrderConfirmation(params: {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    amount: string;
}): Promise<SendResult> {
    return sendOrderCreatedNotification(params);
}

/**
 * Resend bill/invoice (manual resend by user)
 * Cycles through 'bill' and 'invoice' templates based on send count
 */
export async function resendBill(
    params: Omit<InvoiceMessageParams, 'templateType'>,
    currentSendCount: number
): Promise<SendResult & { newSendCount: number; canResendAgain: boolean }> {
    if (currentSendCount >= MAX_RESENDS) {
        return {
            success: false,
            error: `Maximum resends (${MAX_RESENDS}) reached for this order`,
            newSendCount: currentSendCount,
            canResendAgain: false,
        };
    }

    const templateType = getTemplateForSendCount(currentSendCount);
    const result = await sendInvoiceWhatsApp({ ...params, templateType });

    const newSendCount = currentSendCount + 1;

    return {
        ...result,
        newSendCount,
        canResendAgain: newSendCount < MAX_RESENDS,
    };
}

// Legacy exports for backward compatibility
export const sendWhatsAppBill = sendInvoiceWhatsApp;
export const sendWhatsAppText = async (params: { customerPhone: string; message: string }) => {
    return sendTextWhatsApp({ phoneNumber: params.customerPhone, message: params.message });
};
