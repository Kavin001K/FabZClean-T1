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
        // 1. Validate Config
        if (!this.baseUrl || !this.apiKey) {
            console.warn('⚠️ WhatsApp API not configured');
            return false;
        }

        try {
            console.log(`📱 Preparing WhatsApp for ${order.customerPhone}`);

            // 2. Fix the URL (CRITICAL STEP)
            // If on Render, this environment variable will be set.
            // If on Localhost, you MUST use ngrok for this to work.
            const appUrl = process.env.PUBLIC_URL || 'http://localhost:5001';

            // If the pdfUrl is relative (e.g., "/uploads/..."), make it absolute
            let finalPdfUrl = pdfUrl;
            if (pdfUrl && !pdfUrl.startsWith('http')) {
                finalPdfUrl = `${appUrl}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;
            }

            // 3. Prepare Parameters
            const params = new URLSearchParams();
            params.append('number', order.customerPhone);
            params.append('type', 'media');
            params.append('message', `Hello ${order.customerName}! Your order #${order.orderNumber} is confirmed. Amount: ₹${order.totalAmount}`);
            params.append('media_url', finalPdfUrl); // <--- Must be a public URL!
            params.append('filename', `Invoice-${order.orderNumber}.pdf`);
            params.append('instance_id', this.instanceId);
            params.append('access_token', this.apiKey);

            // 4. Send
            const response = await axios.post(`${this.baseUrl}/send`, params);
            console.log('✅ WhatsApp API Response:', response.data);
            return true;

        } catch (error: any) {
            console.error('❌ WhatsApp Failed:', error.message);
            return false;
        }
    }
}

export const whatsappService = new WhatsAppService();
