// server/services/whatsapp.service.ts
// MSG91 WhatsApp API Integration Service with Template Management

// Template configuration for different message types
const TEMPLATES = {
    order: {
        namespace: process.env.MSG91_NAMESPACE_Order || "1520cd50_8420_404b_b634_4808f5f33034",
        name: process.env.MSG91_TEMPLATE_NAME_Order || "v",
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
 * Send Invoice via WhatsApp with PDF attachment using MSG91 Template
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
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY not configured');
        return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    if (!integratedNumber) {
        console.error('❌ MSG91_INTEGRATED_NUMBER not configured');
        return { success: false, error: 'MSG91_INTEGRATED_NUMBER not configured' };
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
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;

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
 * Uses 'order' template
 */
export async function sendOrderConfirmation(params: Omit<InvoiceMessageParams, 'templateType'>): Promise<SendResult> {
    return sendInvoiceWhatsApp({ ...params, templateType: 'order' });
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
