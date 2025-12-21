// client/src/lib/whatsapp-service.ts
// WhatsApp Service - Calls backend API to send messages with template cycling

export const MAX_WHATSAPP_SENDS = 3;

export interface SendInvoiceParams {
    phoneNumber: string;
    pdfUrl: string;
    customerName: string;
    invoiceNumber: string;
    amount: string;
    itemName: string;
    sendCount?: number; // Current send count for this order
}

export interface SendResult {
    success: boolean;
    error?: string;
    templateUsed?: string;
    newSendCount?: number;
    canResendAgain?: boolean;
}

export class WhatsAppService {
    /**
     * Send Invoice via WhatsApp with PDF attachment
     * Template is automatically selected based on sendCount:
     * - sendCount 0: 'order' template (first send on order creation)
     * - sendCount 1: 'bill' template (first resend)
     * - sendCount 2: 'invoice' template (second resend)
     */
    static async sendInvoice(data: SendInvoiceParams): Promise<SendResult> {
        try {
            const response = await fetch("/api/whatsapp/send-invoice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("employee_token")}`,
                },
                body: JSON.stringify({
                    ...data,
                    filename: `Invoice-${data.invoiceNumber}.pdf`,
                    sendCount: data.sendCount || 0,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || "Failed to send WhatsApp message",
                };
            }

            return {
                success: true,
                templateUsed: result.templateUsed,
                newSendCount: result.newSendCount,
                canResendAgain: result.canResendAgain,
            };
        } catch (error) {
            console.error("[WhatsApp] Error sending invoice:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Network error",
            };
        }
    }

    /**
     * Send Order Bill via WhatsApp (for order confirmation)
     * This is the primary method used when creating orders
     */
    static async sendOrderBill(
        phone: string,
        orderNumber: string,
        customerName: string,
        totalAmount: number,
        billUrl: string,
        pdfUrl?: string,
        mainItem?: string,
        sendCount: number = 0
    ): Promise<SendResult> {
        try {
            console.log(`[WhatsApp] Sending bill to ${phone}, sendCount: ${sendCount}`);

            const response = await fetch("/api/whatsapp/send-bill", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("employee_token")}`,
                },
                body: JSON.stringify({
                    customerName,
                    customerPhone: phone,
                    orderId: orderNumber,
                    amount: totalAmount,
                    pdfUrl,
                    mainItem,
                    sendCount,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("[WhatsApp] Backend error:", result);
                return {
                    success: false,
                    error: result.error || "Failed to send",
                };
            }

            console.log("[WhatsApp] Send result:", result);

            return {
                success: result.success,
                templateUsed: result.templateUsed,
                newSendCount: result.newSendCount,
                canResendAgain: result.canResendAgain,
            };
        } catch (error) {
            console.error("[WhatsApp] Send error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Network error",
            };
        }
    }

    /**
     * Send plain text message via WhatsApp
     */
    static async sendText(phone: string, message: string): Promise<boolean> {
        try {
            const response = await fetch("/api/whatsapp/send-text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("employee_token")}`,
                },
                body: JSON.stringify({ phone, message }),
            });

            if (!response.ok) {
                console.error("[WhatsApp] Text send failed:", await response.text());
                return false;
            }

            return true;
        } catch (error) {
            console.error("[WhatsApp] Text send error:", error);
            return false;
        }
    }

    /**
     * Check if more WhatsApp sends are allowed for an order
     */
    static canSendMore(sendCount: number): boolean {
        return sendCount < MAX_WHATSAPP_SENDS;
    }

    /**
     * Get remaining sends count
     */
    static getRemainingSends(sendCount: number): number {
        return Math.max(0, MAX_WHATSAPP_SENDS - sendCount);
    }
}

// Export standalone function for simpler imports
export const sendInvoice = WhatsAppService.sendInvoice;
