import twilio from 'twilio';

// Load config from .env
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const API_KEY = process.env.TWILIO_API_KEY;
const API_SECRET = process.env.TWILIO_API_SECRET;
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

export class WhatsappService {
    private client: any;

    private getClient() {
        if (!this.client) {
            if (!ACCOUNT_SID || !API_KEY || !API_SECRET) {
                console.error('❌ Twilio credentials missing in .env');
                return null;
            }
            // Authenticate with API Key & Secret, linked to Account SID
            this.client = twilio(API_KEY, API_SECRET, { accountSid: ACCOUNT_SID });
        }
        return this.client;
    }

    formatNumber(phone: string): string {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) cleaned = '91' + cleaned;
        return `whatsapp:+${cleaned}`;
    }

    async sendMessage(to: string, message: string): Promise<boolean> {
        const client = this.getClient();
        if (!client) return false;

        try {
            const formattedTo = this.formatNumber(to);
            const formattedFrom = `whatsapp:${FROM_NUMBER}`;
            console.log(`📨 Sending to ${formattedTo}...`);

            const response = await client.messages.create({
                body: message,
                from: formattedFrom,
                to: formattedTo
            });
            console.log(`✅ Sent! SID: ${response.sid}`);
            return true;
        } catch (error: any) {
            console.error('❌ Twilio Error:', error.message);
            return false;
        }
    }

    async sendPdf(to: string, pdfUrl: string, filename: string, caption?: string): Promise<boolean> {
        const client = this.getClient();
        if (!client) return false;

        try {
            const formattedTo = this.formatNumber(to);
            const formattedFrom = `whatsapp:${FROM_NUMBER}`;
            console.log(`📄 Sending PDF to ${formattedTo}...`);

            const response = await client.messages.create({
                body: caption || 'Invoice attached.',
                from: formattedFrom,
                to: formattedTo,
                mediaUrl: [pdfUrl]
            });
            console.log(`✅ PDF Sent! SID: ${response.sid}`);
            return true;
        } catch (error: any) {
            console.error('❌ Twilio Media Error:', error.message);
            return false;
        }
    }

    async sendOrderConfirmation(order: any, pdfUrl?: string): Promise<boolean> {
        const customerName = order.customerName || order.customer?.name || 'Customer';
        const orderNumber = order.orderNumber || order.id;
        const total = order.totalAmount || order.total;
        const phone = order.customerPhone || order.customer?.phone || order.phone;

        if (!phone) {
            console.error('❌ No phone number provided for WhatsApp');
            return false;
        }

        const message = `Hello ${customerName}, your order #${orderNumber} has been confirmed! Total: ₹${total}. Thank you for choosing FabZClean.`;

        if (pdfUrl) {
            return this.sendPdf(phone, pdfUrl, `Order_${orderNumber}.pdf`, message);
        } else {
            return this.sendMessage(phone, message);
        }
    }
}

export const whatsappService = new WhatsappService();
