interface OrderConfirmationEmailInput {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail?: string | null;
    totalAmount: string | number;
}

interface EmailSendResult {
    success: boolean;
    skipped?: boolean;
    error?: string;
}

const EMAIL_WEBHOOK_URL = process.env.ORDER_CONFIRMATION_EMAIL_WEBHOOK_URL;
const EMAIL_WEBHOOK_AUTH_HEADER = process.env.ORDER_CONFIRMATION_EMAIL_WEBHOOK_AUTH_HEADER || 'Authorization';
const EMAIL_WEBHOOK_AUTH_TOKEN = process.env.ORDER_CONFIRMATION_EMAIL_WEBHOOK_AUTH_TOKEN;
const PUBLIC_WEBSITE_URL = (process.env.PUBLIC_WEBSITE_URL || 'https://www.myfabclean.com').replace(/\/$/, '');

/**
 * Sends order confirmation email through a configurable webhook.
 * This keeps order creation non-blocking while still enabling email automation in production.
 */
export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput): Promise<EmailSendResult> {
    const customerEmail = String(input.customerEmail || '').trim();

    if (!customerEmail) {
        return { success: false, skipped: true, error: 'Customer email not available' };
    }

    if (!EMAIL_WEBHOOK_URL) {
        return {
            success: false,
            skipped: true,
            error: 'ORDER_CONFIRMATION_EMAIL_WEBHOOK_URL is not configured',
        };
    }

    const payload = {
        event: 'order_confirmation',
        to: customerEmail,
        customerName: input.customerName,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        totalAmount: input.totalAmount,
        trackUrl: `${PUBLIC_WEBSITE_URL}/trackorder/${encodeURIComponent(input.orderNumber)}`,
        generatedAt: new Date().toISOString(),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (EMAIL_WEBHOOK_AUTH_TOKEN) {
            headers[EMAIL_WEBHOOK_AUTH_HEADER] = EMAIL_WEBHOOK_AUTH_TOKEN;
        }

        const response = await fetch(EMAIL_WEBHOOK_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            return {
                success: false,
                error: `Webhook error ${response.status}${body ? `: ${body}` : ''}`,
            };
        }

        return { success: true };
    } catch (error) {
        clearTimeout(timeout);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown email send error',
        };
    }
}
