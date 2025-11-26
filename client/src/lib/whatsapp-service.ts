// WhatsApp Service for mygreentick.co.in API integration
const WHATSAPP_CONFIG = {
    baseUrl: 'https://mygreentick.co.in/api',
    accessToken: '679765b5a5b37',
    instanceId: '609ACF283XXXX', // Replace with your actual instance ID
};

export interface WhatsAppMessage {
    number: string; // Phone number without + or country code decorations (e.g., "919876543210")
    type: 'text' | 'media';
    message: string;
    media_url?: string;
    filename?: string;
}

export class WhatsAppService {
    /**
     * Send text message via WhatsApp
     */
    static async sendText(phone: string, message: string): Promise<boolean> {
        if (WHATSAPP_CONFIG.instanceId.includes('XXXX')) {
            console.error('❌ WhatsApp Instance ID not configured!');
            // We can't use toast here easily as it's a library file, but we can log it clearly
            return false;
        }

        try {
            // Clean phone number - remove +, spaces, hyphens
            const cleanPhone = phone.replace(/[\s\+\-\(\)]/g, '');

            // Ensure phone has country code (add 91 for India if not present)
            const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

            const url = `${WHATSAPP_CONFIG.baseUrl}/send?` + new URLSearchParams({
                number: formattedPhone,
                type: 'text',
                message: message,
                instance_id: WHATSAPP_CONFIG.instanceId,
                access_token: WHATSAPP_CONFIG.accessToken,
            }).toString();

            const response = await fetch(url, {
                method: 'POST',
            });

            if (!response.ok) {
                console.error('WhatsApp send failed:', await response.text());
                return false;
            }

            const data = await response.json();
            console.log('WhatsApp message sent:', data);
            return true;
        } catch (error) {
            console.error('WhatsApp send error:', error);
            return false;
        }
    }

    /**
     * Send media/file with message via WhatsApp
     */
    static async sendMedia(
        phone: string,
        message: string,
        mediaUrl: string,
        filename?: string
    ): Promise<boolean> {
        if (WHATSAPP_CONFIG.instanceId.includes('XXXX')) {
            console.error('❌ WhatsApp Instance ID not configured!');
            return false;
        }

        try {
            const cleanPhone = phone.replace(/[\s\+\-\(\)]/g, '');
            const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

            const params: Record<string, string> = {
                number: formattedPhone,
                type: 'media',
                message: message,
                media_url: mediaUrl,
                instance_id: WHATSAPP_CONFIG.instanceId,
                access_token: WHATSAPP_CONFIG.accessToken,
            };

            if (filename) {
                params.filename = filename;
            }

            const url = `${WHATSAPP_CONFIG.baseUrl}/send?` + new URLSearchParams(params).toString();

            const response = await fetch(url, {
                method: 'POST',
            });

            if (!response.ok) {
                console.error('WhatsApp media send failed:', await response.text());
                return false;
            }

            const data = await response.json();
            console.log('WhatsApp media sent:', data);
            return true;
        } catch (error) {
            console.error('WhatsApp media send error:', error);
            return false;
        }
    }

    /**
   * Send order bill via WhatsApp with PDF attachment
   */
    static async sendOrderBill(
        phone: string,
        orderNumber: string,
        customerName: string,
        totalAmount: number,
        billUrl: string,
        pdfUrl?: string
    ): Promise<boolean> {
        const message = `Hello *${customerName}*! 👋

Your order has been created successfully! ✅

📋 *Order Number:* ${orderNumber}
💰 *Total Amount:* ₹${totalAmount.toFixed(2)}

${pdfUrl ? '📄 *Invoice attached as PDF*' : `📄 *View & Download Bill:*\n${billUrl}`}

Thank you for choosing *FabZClean*! 🌟

For any queries, feel free to contact us.`;

        // If PDF URL is provided, send as media attachment
        if (pdfUrl) {
            return await this.sendMedia(
                phone,
                message,
                pdfUrl,
                `Invoice-${orderNumber}.pdf`
            );
        }

        // Otherwise send as text message
        return await this.sendText(phone, message);
    }

    /**
     * Get QR code for instance login (for admin setup)
     */
    static getQRCodeUrl(): string {
        return `${WHATSAPP_CONFIG.baseUrl}/get_qrcode?` + new URLSearchParams({
            instance_id: WHATSAPP_CONFIG.instanceId,
            access_token: WHATSAPP_CONFIG.accessToken,
        }).toString();
    }

    /**
     * Reboot/reconnect instance
     */
    static async reconnect(): Promise<boolean> {
        try {
            const url = `${WHATSAPP_CONFIG.baseUrl}/reconnect?` + new URLSearchParams({
                instance_id: WHATSAPP_CONFIG.instanceId,
                access_token: WHATSAPP_CONFIG.accessToken,
            }).toString();

            const response = await fetch(url, { method: 'POST' });
            return response.ok;
        } catch (error) {
            console.error('WhatsApp reconnect error:', error);
            return false;
        }
    }
}
