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
                            body_1: {
                                type: "text",
                                value: amount, // Amount like "Rs.123"
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
 *   - Header: Processing image
 *   - Body: Hi {{1}}! 👋 Great news! Your Order #{{2}} is now In Process...
 *   - Button: Track Order with link https://fabclean.com/track/{{1}} (order number)
 * 
 * AUTO-TRIGGERED: When order status changes to "processing"
 */
export async function sendOrderProcessingNotification({
    phoneNumber,
    customerName,
    orderNumber,
}: OrderProcessingMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15558125705';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES.bill;
    const cleanPhone = cleanPhoneNumber(phoneNumber);

    // Processing image URL (hosted publicly accessible image)
    const processingImageUrl = process.env.WHATSAPP_PROCESSING_IMAGE_URL ||
        'https://rxyatfvjjnvjxwyhhhqn.supabase.co/storage/v1/object/public/Templates/Screenshot%202025-12-27%20at%2010.32.31%20PM.png';

    // Template "bill" expects:
    // - Header: Image (processing status image)
    // - Body: {{1}} = Customer Name, {{2}} = Order Number
    // - Button 1: Track Order link with dynamic URL suffix (order number)
    // - Button 2: Terms link (static or dynamic)
    // 
    // IMPORTANT: For URL buttons, the "value" should be ONLY the dynamic suffix
    // that gets appended to the base URL defined in the template.
    // Template base URL: https://myfabclean.com/trackorder/
    // We provide: FZC-2025POL6551A
    // Result: https://myfabclean.com/trackorder/FZC-2025POL6551A
    const cleanOrderNumber = orderNumber.replace(/[#]/g, '').trim();

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
                            // Header image component
                            header_1: {
                                type: "image",
                                value: processingImageUrl,
                            },
                            // Body text components
                            body_1: {
                                type: "text",
                                value: customerName,
                            },
                            body_2: {
                                type: "text",
                                value: orderNumber,
                            },
                            // Button 1: Track Order - dynamic URL with order number suffix
                            // Template URL: https://myfabclean.com/trackorder/{{1}}
                            button_1: {
                                subtype: "url",
                                type: "text",
                                value: cleanOrderNumber,
                            },
                            // Button 2: Terms - dynamic URL with suffix
                            // Template base URL: https://myfabclean.com/
                            // We provide: terms
                            // Result: https://myfabclean.com/terms
                            button_2: {
                                subtype: "url",
                                type: "text",
                                value: "terms",
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
        console.log(`🖼️ [WhatsApp] Image: ${processingImageUrl}`);
        console.log(`🧺 [WhatsApp] Customer: ${customerName}, Order: ${orderNumber}`);
        console.log(`🔗 [WhatsApp] Track Link: https://fabclean.com/track/${orderNumber}`);

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
 * Button: Track Order with URL https://myfabclean.com/trackorder/{{1}} (order number)
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

    // Template "invoice_fabzclean" expects:
    // {{1}} = Customer Name (body_1)
    // {{2}} = Order Number (body_2)
    // {{3}} = Status (Ready to Pickup / Out For Delivery) (body_3)
    // {{4}} = Additional info / items (body_4)
    // Button URL variable {{1}} = Order Number for tracking link
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
                            // Button URL parameter for Track Order
                            // The template URL is: https://myfabclean.com/trackorder/{{1}}
                            // We pass the order number as {{1}} in the button
                            button_1: {
                                subtype: "url",
                                type: "text",
                                value: cleanOrderNumber,
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
        console.log(`🔗 [WhatsApp] Track URL: https://myfabclean.com/trackorder/${cleanOrderNumber}`);

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

    // STATUS: processing - Send "bill" template
    if (currentStatus === 'processing' && previousStatus !== 'processing') {
        console.log(`📤 [WhatsApp] Triggering Processing notification for order ${order.orderNumber}`);
        return await sendOrderProcessingNotification({
            phoneNumber: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
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
 * (Legacy function for PDF invoices)
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
                                value: amount,
                            },
                            body_4: {
                                type: "text",
                                value: itemName,
                            },
                        },
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
