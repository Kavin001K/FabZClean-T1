// client/src/lib/whatsapp-service.ts
// WhatsApp Service - Calls backend API to send messages

export interface SendInvoiceParams {
    phoneNumber: string;
    pdfUrl: string;
    customerName: string;
    invoiceNumber: string;
    amount: string;
    itemName: string;
}

export class WhatsAppService {
    /**
     * Send Invoice via WhatsApp with PDF attachment (NEW API)
     */
    static async sendInvoice(data: SendInvoiceParams): Promise<{ success: boolean; data?: any }> {
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
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to send WhatsApp message");
            }

            return await response.json();
        } catch (error) {
            console.error("Error sending invoice:", error);
            throw error;
        }
    }

    /**
     * Send Order Bill via WhatsApp (Legacy API - uses /send-bill endpoint)
     * Kept for backward compatibility with existing code
     */
    static async sendOrderBill(
        phone: string,
        orderNumber: string,
        customerName: string,
        totalAmount: number,
        billUrl: string,
        pdfUrl?: string,
        mainItem?: string
    ): Promise<boolean> {
        try {
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
                }),
            });

            if (!response.ok) {
                console.error("WhatsApp backend send failed:", await response.text());
                return false;
            }

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error("WhatsApp send error:", error);
            return false;
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
                console.error("WhatsApp text send failed:", await response.text());
                return false;
            }

            return true;
        } catch (error) {
            console.error("WhatsApp text send error:", error);
            return false;
        }
    }
}

// Export standalone function for simpler imports
export const sendInvoice = WhatsAppService.sendInvoice;
