import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class WhatsAppService {
    private baseUrl: string;
    private apiKey: string;
    private instanceId: string;

    constructor() {
        this.baseUrl = process.env.EXTERNAL_API_BASE_URL || '';
        this.apiKey = process.env.EXTERNAL_API_KEY || '';
        this.instanceId = process.env.WA_INSTANCE_ID || '';

        if (!this.baseUrl) {
            console.warn('⚠️ [WhatsApp] EXTERNAL_API_BASE_URL is not set in .env');
        }
    }

    private async sendWithRetry(params: URLSearchParams, attempt = 1, maxAttempts = 3): Promise<boolean> {
        try {
            const response = await axios.post(`${this.baseUrl}/send`, params);

            if (response.data && response.data.status === 'error') {
                console.error(`❌ [WhatsApp] API Provider Error (Attempt ${attempt}):`, response.data.message);
                return false;
            }

            console.log('✅ [WhatsApp] Message sent successfully!');
            return true;
        } catch (error: any) {
            console.error(`❌ [WhatsApp] Network Error (Attempt ${attempt}/${maxAttempts}):`, error.message);

            if (attempt < maxAttempts) {
                const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.sendWithRetry(params, attempt + 1, maxAttempts);
            }

            return false;
        }
    }

    async sendOrderConfirmation(order: any, pdfUrl: string) {
        // 1. Validate Configuration
        if (!this.baseUrl || !this.apiKey || !this.instanceId) {
            console.warn('⚠️ [WhatsApp] API not configured properly. Check .env');
            return false;
        }

        try {
            // 2. Prepare Data
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

            // Ensure pdfUrl is a complete, public link
            const publicBaseUrl = process.env.PUBLIC_URL || 'http://localhost:5001';
            let finalMediaUrl = pdfUrl;

            if (pdfUrl && !pdfUrl.startsWith('http')) {
                // If pdfUrl is relative (e.g., /uploads/...), prepend the domain
                finalMediaUrl = `${publicBaseUrl}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;
            }

            console.log(`🔗 Generated Public PDF Link: ${finalMediaUrl}`);

            params.append('number', formattedPhone);
            params.append('type', 'media'); // Required for PDF
            params.append('message', message);
            params.append('media_url', finalMediaUrl); // MUST be a public URL
            params.append('filename', `Bill-${orderId}.pdf`);
            params.append('instance_id', this.instanceId);
            params.append('access_token', this.apiKey);

            console.log(`📱 [WhatsApp] Sending Bill PDF to ${formattedPhone}...`);

            if (finalMediaUrl.includes('localhost') || finalMediaUrl.includes('127.0.0.1')) {
                console.warn('⚠️ [WhatsApp] WARNING: pdfUrl contains "localhost". The WhatsApp API will likely FAIL to download this file.');
                console.warn('👉 Use ngrok or a public URL for development: npm install -g ngrok && ngrok http 5001');
            }

            // 5. Send with Retry
            return await this.sendWithRetry(params);

        } catch (error: any) {
            console.error('❌ [WhatsApp] Error preparing message:', error.message);
            return false;
        }
    }
}

export const whatsappService = new WhatsAppService();
