import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { type OrderItem } from '../../shared/schema';

// Helper to check if SMTP settings are present
export function isSmtpConfigured(): boolean {
    return !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
}

export interface SendInvoiceEmailParams {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: string | number;
    paymentStatus: string;
    paymentMethod: string;
    invoiceUrl: string;
    items: OrderItem[];
}

/**
 * Sends a beautiful and secure order invoice email to the customer using SMTP.
 */
export async function sendOrderInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ success: boolean; error?: string }> {
    const customerEmail = String(params.customerEmail || '').trim();
    if (!customerEmail) {
        return { success: false, error: 'No customer email provided' };
    }

    if (!isSmtpConfigured()) {
        console.warn('⚠️ [SMTP Email] SMTP is not configured. Skipping sending invoice email.');
        return { success: false, error: 'SMTP is not configured' };
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromName = process.env.SMTP_FROM_NAME || 'FabZClean';
    const fromEmail = process.env.SMTP_FROM_EMAIL || user;

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
            tls: {
                rejectUnauthorized: true,
            },
        });

        // Generate items table HTML
        const itemsHtml = (params.items || []).map((item) => {
            const price = parseFloat(String(item.price || 0));
            const subtotal = parseFloat(String(item.subtotal || 0));
            return `
                <tr>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 14px; font-weight: 500;">
                        ${item.serviceName || item.customName || 'Laundry Service'}
                    </td>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #4b5563; font-size: 14px;">
                        ${item.quantity}
                    </td>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #4b5563; font-size: 14px;">
                        Rs. ${price.toFixed(2)}
                    </td>
                    <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111827; font-size: 14px;">
                        Rs. ${subtotal.toFixed(2)}
                    </td>
                </tr>
            `;
        }).join('');

        const formattedTotal = parseFloat(String(params.totalAmount || 0)).toFixed(2);
        const paymentStatusText = String(params.paymentStatus || 'pending').toUpperCase();
        
        // Define color for payment status badge
        let statusBadgeColor = '#d97706'; // Orange for pending/failed/partial
        let statusBadgeBg = '#fef3c7';
        if (params.paymentStatus === 'paid') {
            statusBadgeColor = '#059669'; // Green for paid
            statusBadgeBg = '#d1fae5';
        }

        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Secure Invoice - Order #${params.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 48px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    <!-- Elegant Green Gradient Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #065f46 0%, #0f766e 100%); padding: 40px 32px; text-align: center;">
                            <img src="cid:fabcleanlogo" alt="FAB CLEAN Logo" style="display: block; margin: 0 auto 12px auto; max-width: 150px; height: auto; border: 0;" />
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">FAB CLEAN</h1>
                            <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">PREMIUM DRY CLEANING & LAUNDRY</p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.4px;">Hello ${params.customerName},</h2>
                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">Your invoice for order <strong style="color: #0f172a;">#${params.orderNumber}</strong> is ready. The bill has been successfully generated and stored securely in Cloudflare.</p>
                            
                            <!-- Financial Details Summary Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
                                <tr>
                                    <td style="padding: 6px 0; font-size: 14px; color: #64748b; font-weight: 500;">Order Number:</td>
                                    <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">#${params.orderNumber}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 14px; color: #64748b; font-weight: 500;">Payment Status:</td>
                                    <td style="padding: 6px 0; text-align: right;">
                                        <span style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid rgba(${params.paymentStatus === 'paid' ? '5,150,105' : '217,119,6'}, 0.15);">${paymentStatusText}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 14px; color: #64748b; font-weight: 500;">Payment Method:</td>
                                    <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; text-transform: uppercase;">${params.paymentMethod}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 0 0 0; font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px dashed #cbd5e1;">Total Amount:</td>
                                    <td style="padding: 16px 0 0 0; font-size: 18px; font-weight: 800; color: #065f46; text-align: right; border-top: 1px dashed #cbd5e1;">Rs. ${formattedTotal}</td>
                                </tr>
                            </table>

                            <!-- Items Summary Table -->
                            <h3 style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 0 0 16px 0; border-left: 4px solid #10b981; padding-left: 10px;">Order Summary</h3>
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 40px;">
                                <thead>
                                    <tr style="background-color: #f8fafc;">
                                        <th style="padding: 12px 16px; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Service</th>
                                        <th style="padding: 12px 16px; border-bottom: 2px solid #e2e8f0; text-align: center; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                                        <th style="padding: 12px 16px; border-bottom: 2px solid #e2e8f0; text-align: right; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Rate</th>
                                        <th style="padding: 12px 16px; border-bottom: 2px solid #e2e8f0; text-align: right; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>

                            <!-- Download Button Call To Action -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="${params.invoiceUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -4px rgba(16, 185, 129, 0.3); border: none; letter-spacing: 0.3px; transition: transform 0.15s ease;">Download Invoice PDF</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 14px;">
                                        <p style="margin: 0; font-size: 12px; color: #64748b;">This link is secure. Download directly from Cloudflare R2 storage.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer Block -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 40px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 12px 0;">Thank you for your business. For any queries regarding this bill, please get in touch with our customer service team.</p>
                            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">This email was sent from a secure automated billing address. Please do not reply directly.</p>
                            <p style="color: #cbd5e1; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        const logoPath = path.join(process.cwd(), 'client', 'public', 'assets', 'fabclean-logo.png');
        const attachments = [];
        if (fs.existsSync(logoPath)) {
            attachments.push({
                filename: 'fabclean-logo.png',
                path: logoPath,
                cid: 'fabcleanlogo'
            });
        }

        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: customerEmail,
            subject: `Secure Invoice for Order #${params.orderNumber} - ${fromName}`,
            html: emailHtml,
            attachments
        });

        console.log(`📧 [SMTP Email] Invoice email sent successfully to ${customerEmail} for order #${params.orderNumber}`);
        return { success: true };
    } catch (error: any) {
        console.error(`❌ [SMTP Email] Failed to send email to ${customerEmail}:`, error);
        return { success: false, error: error?.message || 'Unknown SMTP error' };
    }
}
