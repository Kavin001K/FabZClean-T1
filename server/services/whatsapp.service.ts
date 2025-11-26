import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class WhatsAppService {
    private baseUrl: string;
    private apiKey: string;
    private instanceId: string;

    constructor() {
        this.baseUrl = process.env.EXTERNAL_API_BASE_URL || 'https://mygreentick.co.in/api';
        this.apiKey = process.env.EXTERNAL_API_KEY || '';
        this.instanceId = process.env.WA_INSTANCE_ID || '';
    }

    async sendOrderConfirmation(order: any, pdfUrl: string) {
        // 1. Validate Configuration
        if (!this.baseUrl || !this.apiKey || !this.instanceId) {
            console.warn('⚠️ [WhatsApp] API not configured. Skipping message.');
            return false;
        }

        try {
            // 2. Prepare Data (Fixing the "undefined" issues)
            const customerName = order.customerName || 'Customer';
            const orderId = order.orderNumber || order.id || 'N/A';
            const amount = order.totalAmount || 0;
            const phone = order.customerPhone || order.phone || '';

            if (!phone) {
                console.warn('⚠️ [WhatsApp] No phone number provided.');
                return false;
            }

            // 3. Create the Message Caption
            const message = `👋 Hello *${customerName}*!

Order *${orderId}* Created! 
💰 Amount: ₹${amount}
📄 Bill: The PDF is attached to this message.

Thank you for choosing *FabZClean*! ✨`;

            // 4. Construct the API Request
            const params = new URLSearchParams();
            // Clean phone number
            const cleanPhone = phone.replace(/[\s\+\-\(\)]/g, '');
            const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

            params.append('number', formattedPhone);
            params.append('type', 'media'); // Required for PDF
            params.append('message', message);
            params.append('media_url', pdfUrl); // MUST be a public URL
            params.append('filename', `Bill-${orderId}.pdf`);
            params.append('instance_id', this.instanceId);
            params.append('access_token', this.apiKey);

            console.log(`📱 [WhatsApp] Sending Bill PDF to ${formattedPhone}...`);

            if (pdfUrl.includes('localhost') || pdfUrl.includes('127.0.0.1')) {
                console.warn('⚠️ [WhatsApp] WARNING: pdfUrl contains "localhost". The WhatsApp API will likely FAIL to download this file.');
                console.warn('👉 Use ngrok or a public URL for development: npm install -g ngrok && ngrok http 5001');
            }

            // 5. Send to MyGreenTick API
            const response = await axios.post(`${this.baseUrl}/send`, params);

            if (response.data && response.data.status === 'error') {
                console.error('❌ [WhatsApp] API Provider Error:', response.data.message);
                return false;
            } else {
                console.log('✅ [WhatsApp] Message & PDF sent successfully!');
                return true;
            }

        } catch (error: any) {
            console.error('❌ [WhatsApp] Network/Server Error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
            return false;
        }
    }
}

export const whatsappService = new WhatsAppService();
