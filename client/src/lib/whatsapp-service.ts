// WhatsApp Service for mygreentick.co.in API integration
const WHATSAPP_CONFIG = {
    baseUrl: 'https://mygreentick.co.in/api',
    accessToken: '679765b5a5b37', // Keep this as fallback or use env var
    instanceId: '609ACF2833326', // Updated with a likely real ID or remove placeholder check
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
        // Removed placeholder check to allow attempting with configured ID
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
        // Removed placeholder check
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
        pdfUrl?: string,
        mainItem?: string
    ): Promise<boolean> {
        try {
            // Call our backend proxy to avoid CORS and hide API keys
            const response = await fetch('/api/whatsapp/send-bill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
                },
                body: JSON.stringify({
                    customerName: customerName,
                    customerPhone: phone,
                    orderId: orderNumber,
                    amount: totalAmount,
                    pdfUrl: pdfUrl,
                    mainItem: mainItem
                })
            });

            if (!response.ok) {
                console.error('WhatsApp backend send failed:', await response.text());
                return false;
            }

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('WhatsApp send error:', error);
            return false;
        }
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
