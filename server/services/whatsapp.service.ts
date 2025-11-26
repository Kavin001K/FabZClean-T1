import { externalApiClient } from './externalApiClient';

export interface WhatsAppMessage {
    to: string;
    templateName?: string;
    templateLanguage?: string;
    components?: any[];
    text?: string;
}

export class WhatsAppService {
    private static instance: WhatsAppService;

    private constructor() { }

    public static getInstance(): WhatsAppService {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }

    /**
     * Send a WhatsApp message using the external API
     */
    async sendMessage(message: WhatsAppMessage): Promise<boolean> {
        try {
            console.log('📱 [WhatsApp] Sending message to:', message.to);

            // Use the existing external API client to send the message
            // Adjust the endpoint based on the actual API requirement
            await externalApiClient.post('/whatsapp/send', message);

            console.log('✅ [WhatsApp] Message sent successfully');
            return true;
        } catch (error) {
            console.error('❌ [WhatsApp] Failed to send message:', error);
            // Don't throw, just return false to avoid disrupting the main flow
            return false;
        }
    }

    /**
     * Send order confirmation message
     */
    async sendOrderConfirmation(order: any): Promise<boolean> {
        if (!order.customerEmail && !order.customerPhone) {
            console.warn('⚠️ [WhatsApp] No contact info for order:', order.id);
            return false;
        }

        // Prefer phone number if available, otherwise might need to look it up from customer profile
        // For now assuming customerPhone might be on the order or we use a placeholder
        const phoneNumber = order.customerPhone || order.phoneNumber; // Adjust based on actual order schema

        if (!phoneNumber) {
            console.warn('⚠️ [WhatsApp] No phone number found for order:', order.id);
            return false;
        }

        const message: WhatsAppMessage = {
            to: phoneNumber,
            text: `Hello ${order.customerName}, your order #${order.orderNumber || order.id.slice(0, 8)} has been received! Total: ${order.totalAmount}. We will notify you when it's ready.`
        };

        return this.sendMessage(message);
    }
}

export const whatsappService = WhatsAppService.getInstance();
