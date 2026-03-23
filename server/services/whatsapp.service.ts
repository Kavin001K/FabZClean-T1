// server/services/whatsapp.service.ts
// MSG91 WhatsApp API Integration Service with Template Management

const TEMPLATE_NAMESPACE = process.env.MSG91_TEMPLATE_NAMESPACE || '5b9c340a_3221_42e3_9b9f_98b402c0c8ac';

// Template configuration for different message types
const TEMPLATES = {
    order: {
        namespace: TEMPLATE_NAMESPACE,
        name: process.env.MSG91_TEMPLATE_NAME_ORDER || 'invoice_for_customer',
    },
    status: {
        namespace: TEMPLATE_NAMESPACE,
        name: process.env.MSG91_TEMPLATE_NAME_STATUS || 'order_status_update',
    },
    feedback: {
        namespace: TEMPLATE_NAMESPACE,
        name: process.env.MSG91_TEMPLATE_NAME_FEEDBACK || 'customer_feedback',
    },
};

// App base URL for tracking links and terms pages
// Configure via environment variable: APP_BASE_URL=https://erp.myfabclean.com
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://erp.myfabclean.com';

// Max number of resends allowed per order
export const MAX_RESENDS = 3;

// Template type for different scenarios
export type MessageTemplateType = 'order';

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
    amount: string;
    pdfUrl: string;
    filename: string;
    itemName: string;
}

interface OrderStatusUpdateMessageParams {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    status: string;
}

interface FeedbackMessageParams {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
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
 * Keep a single template flow while still enforcing resend limits.
 */
export function getTemplateForSendCount(sendCount: number): MessageTemplateType {
    return 'order';
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
    if (status === 'ready_for_pickup') {
        return 'Ready to Pickup';
    }
    if (status === 'out_for_delivery') {
        return 'Out For Delivery';
    }
    // Backward compatibility for automated completed -> stage mapping if needed
    if (status === 'completed') {
        return fulfillmentType === 'pickup' ? 'Ready to Pickup' : 'Out For Delivery';
    }
    return null;
}

/**
 * Send Order Created notification via WhatsApp
 * Template: "invoice_for_customer"
 * AUTO-TRIGGERED: When a new order is created
 */
export async function sendOrderCreatedNotification({
    phoneNumber,
    customerName,
    orderNumber,
    amount,
    pdfUrl,
    filename,
    itemName,
}: OrderCreatedMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15559458542';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES.order;
    const cleanPhone = cleanPhoneNumber(phoneNumber);
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
                            // Header: Document (PDF invoice)
                            header_1: {
                                filename: filename,
                                type: "document",
                                value: pdfUrl,
                            },
                            // Body parameters
                            body_1: {
                                type: "text",
                                value: customerName,
                            },
                            body_2: {
                                type: "text",
                                value: itemName || "Laundry Services",
                            },
                            body_3: {
                                type: "text",
                                value: orderNumber,
                            },
                            body_4: {
                                type: "text",
                                value: amount,
                            },
                            // Button 2: Track Order (dynamic URL suffix)
                            button_2: {
                                subtype: "url",
                                type: "text",
                                value: cleanOrderNumber,
                            }
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
        console.error(`❌ [WhatsApp] Order Created Error:`, errorMessage);
        return {
            success: false,
            error: errorMessage,
            templateUsed: template.name,
        };
    }
}

/**
 * Send Order Status Update notification via WhatsApp
 * Template: "order_status_update"
 * AUTO-TRIGGERED: When order status changes to ready_for_pickup or out_for_delivery
 */
export async function sendOrderStatusUpdateNotification({
    phoneNumber,
    customerName,
    orderNumber,
    status,
}: OrderStatusUpdateMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15559458542';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES.status;
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    const cleanOrderNumber = orderNumber.replace(/[#]/g, '').trim();

    // Template "order_status_update" expects:
    // - header_1: text (Customer Name)
    // - body_1: text (Order Number)
    // - body_2: text (Status)
    // - button_2: url (Track Order suffix)
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
                                type: "text",
                                value: customerName,
                            },
                            body_1: {
                                type: "text",
                                value: orderNumber,
                            },
                            body_2: {
                                type: "text",
                                value: status,
                            },
                            button_2: {
                                subtype: "url",
                                type: "text",
                                value: cleanOrderNumber,
                            }
                        },
                    },
                ],
            },
        },
    };

    try {
        console.log(`📱 [WhatsApp] Sending Status Update to ${cleanPhone}`);
        console.log(`📄 [WhatsApp] Template: ${template.name} (status)`);
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
 * Send Customer Feedback request via WhatsApp
 * Template: "customer_feedback"
 * AUTO-TRIGGERED: When order status changes to completed
 */
export async function sendCustomerFeedbackNotification({
    phoneNumber,
    customerName,
    orderNumber,
}: FeedbackMessageParams): Promise<SendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15559458542';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES.feedback;
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    const cleanOrderNumber = orderNumber.replace(/[#]/g, '').trim();
    const feedbackVideoUrl = process.env.WHATSAPP_FEEDBACK_VIDEO_URL || 'https://assets.myfabclean.com/Feedback%20mesage.mp4';

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
                                type: "video",
                                value: feedbackVideoUrl,
                            },
                            body_1: {
                                type: "text",
                                value: customerName,
                            },
                            button_1: {
                                subtype: "url",
                                type: "text",
                                value: cleanOrderNumber,
                            }
                        },
                    },
                ],
            },
        },
    };

    try {
        console.log(`📱 [WhatsApp] Sending Feedback to ${cleanPhone}`);
        console.log(`📄 [WhatsApp] Template: ${template.name} (feedback)`);
        console.log(`🔗 [WhatsApp] Feedback URL suffix: ${cleanOrderNumber}`);

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
        console.error(`❌ [WhatsApp] Feedback Error:`, errorMessage);
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

    const currentStatusLine = order.status as string;
    const prevStatusStr = (previousStatus as string) || '';

    console.log(`🔄 [WhatsApp] Order ${order.orderNumber} status changed: ${prevStatusStr || 'NONE'} -> ${currentStatusLine}`);

    // STATUS: pending or received - Send Order Created (Bill) notification
    if ((currentStatusLine === 'pending' || currentStatusLine === 'received') && !prevStatusStr) {
        console.log(`📤 [WhatsApp] Triggering Order Created (Bill) notification for order ${order.orderNumber}`);
        return await sendInvoiceWhatsApp({
            phoneNumber: order.customerPhone,
            pdfUrl: order.invoiceUrl || `https://erp.myfabclean.com/api/orders/${order.orderNumber}/invoice`, // Fallback URL
            filename: `Invoice_${order.orderNumber}.pdf`,
            customerName: order.customerName,
            invoiceNumber: order.invoiceNumber || order.orderNumber,
            amount: order.totalAmount,
            itemName: order.items?.[0]?.serviceName || order.items?.[0]?.name || 'Laundry Services',
            templateType: 'order'
        });
    }

    // STATUS: ready_for_pickup - Send status update
    if (currentStatusLine === 'ready_for_pickup' && prevStatusStr !== 'ready_for_pickup') {
        console.log(`📤 [WhatsApp] Triggering Ready for Pickup notification for order ${order.orderNumber}`);
        return await sendOrderStatusUpdateNotification({
            phoneNumber: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            status: 'Ready to Pickup',
        });
    }

    // STATUS: out_for_delivery - Send status update
    if (currentStatusLine === 'out_for_delivery' && prevStatusStr !== 'out_for_delivery') {
        console.log(`📤 [WhatsApp] Triggering Out for Delivery notification for order ${order.orderNumber}`);
        return await sendOrderStatusUpdateNotification({
            phoneNumber: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            status: 'Out For Delivery',
        });
    }

    // STATUS: completed - Send feedback request
    if (currentStatusLine === 'completed' && prevStatusStr !== 'completed') {
        console.log(`📤 [WhatsApp] Triggering Feedback notification for order ${order.orderNumber}`);
        return await sendCustomerFeedbackNotification({
            phoneNumber: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
        });
    }

    // No notification needed for other status changes
    console.log(`ℹ️ [WhatsApp] No notification configured for status: ${currentStatusLine}`);
    return null;
}

/**
 * Send Invoice via WhatsApp with PDF attachment using MSG91 Template
 * Template: "invoice_for_customer"
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
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15559458542';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const template = TEMPLATES.order;
    const cleanPhone = cleanPhoneNumber(phoneNumber);

    // Clean order number for URL (remove # and special characters)
    const cleanOrderNumber = invoiceNumber.replace(/[#]/g, '').trim();

    // Template "invoice_for_customer":
    // {{1}} = Customer Name
    // {{2}} = Category/Service summary
    // {{3}} = Invoice/Order Number
    // {{4}} = Amount
    const components: Record<string, any> = {
        header_1: {
            filename: filename,
            type: "document",
            value: pdfUrl,
        },
        body_1: {
            type: "text",
            value: customerName,
        },
        body_2: {
            type: "text",
            value: itemName || "Laundry Services",
        },
        body_3: {
            type: "text",
            value: invoiceNumber,
        },
        body_4: {
            type: "text",
            value: amount,
        },
        button_2: {
            subtype: "url",
            type: "text",
            value: cleanOrderNumber,
        }
    };

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
        console.log(`📄 [WhatsApp] Template: ${template.name} (order)`);
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
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15559458542';

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
    pdfUrl: string;
    filename: string;
    itemName: string;
}): Promise<SendResult> {
    return sendOrderCreatedNotification(params);
}

/**
 * Resend invoice (manual resend by user) with MAX_RESENDS guard.
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
