import twilio from 'twilio';

// Load config from .env
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const API_KEY = process.env.TWILIO_API_KEY;
const API_SECRET = process.env.TWILIO_API_SECRET;
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

export class WhatsappService {
    private static client: any;

    private static getClient() {
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

    static formatNumber(phone: string): string {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) cleaned = '91' + cleaned;
        return `whatsapp:+${cleaned}`;
    }

    static async sendMessage(to: string, message: string): Promise<boolean> {
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

    static async sendPdf(to: string, pdfUrl: string, filename: string, caption?: string): Promise<boolean> {
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
}

export const whatsappService = new WhatsappService();
