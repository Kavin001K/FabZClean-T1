// server/services/whatsapp.service.ts
// MSG91 WhatsApp API Integration Service

interface InvoiceMessageParams {
    phoneNumber: string;
    pdfUrl: string;
    filename: string;
    customerName: string;
    invoiceNumber: string;
    amount: string;
    itemName: string;
}

interface TextMessageParams {
    phoneNumber: string;
    message: string;
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
}: InvoiceMessageParams) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("authkey", process.env.MSG91_AUTH_KEY || "480091AbJuma92Ie692de24aP1");

    // Clean phone number - ensure it has country code
    let cleanPhone = phoneNumber.replace(/[+\s-]/g, '');
    if (!cleanPhone.startsWith('91')) {
        cleanPhone = '91' + cleanPhone;
    }

    const raw = JSON.stringify({
        integrated_number: process.env.MSG91_INTEGRATED_NUMBER || "15558125705",
        content_type: "template",
        payload: {
            messaging_product: "whatsapp",
            type: "template",
            template: {
                name: process.env.MSG91_TEMPLATE_NAME || "v",
                language: {
                    code: "en",
                    policy: "deterministic",
                },
                namespace: process.env.MSG91_NAMESPACE || "1520cd50_8420_404b_b634_4808f5f33034",
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
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow" as RequestRedirect,
    };

    try {
        console.log(`📱 Sending WhatsApp to ${cleanPhone} with invoice ${invoiceNumber}`);
        console.log('📄 PDF URL:', pdfUrl);

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            requestOptions
        );
        const result = await response.text();
        console.log("✅ MSG91 Response:", result);
        return JSON.parse(result);
    } catch (error) {
        console.error("❌ MSG91 Error:", error);
        throw new Error("Failed to send WhatsApp message");
    }
}

/**
 * Send plain text WhatsApp message (fallback when no PDF available)
 */
export async function sendTextWhatsApp({ phoneNumber, message }: TextMessageParams) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("authkey", process.env.MSG91_AUTH_KEY || "480091AbJuma92Ie692de24aP1");

    // Clean phone number
    let cleanPhone = phoneNumber.replace(/[+\s-]/g, '');
    if (!cleanPhone.startsWith('91')) {
        cleanPhone = '91' + cleanPhone;
    }

    const raw = JSON.stringify({
        integrated_number: process.env.MSG91_INTEGRATED_NUMBER || "15558125705",
        content_type: "text",
        payload: {
            messaging_product: "whatsapp",
            type: "text",
            to: cleanPhone,
            text: {
                body: message
            }
        }
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow" as RequestRedirect,
    };

    try {
        console.log(`📱 Sending WhatsApp text to ${cleanPhone}`);

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            requestOptions
        );
        const result = await response.text();
        console.log("✅ MSG91 Text Response:", result);
        return JSON.parse(result);
    } catch (error) {
        console.error("❌ MSG91 Text Error:", error);
        throw new Error("Failed to send WhatsApp text message");
    }
}

// Legacy exports for backward compatibility
export const sendWhatsAppBill = sendInvoiceWhatsApp;
export const sendWhatsAppText = async (params: { customerPhone: string; message: string }) => {
    return sendTextWhatsApp({ phoneNumber: params.customerPhone, message: params.message });
};
