import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import { sendOrderInvoiceEmail, isSmtpConfigured } from '../server/services/smtp-email.service';

async function main() {
    console.log('🔍 Checking SMTP configurations...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '****** (configured)' : 'NOT SET');
    console.log('SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL);

    if (!isSmtpConfigured()) {
        console.error('❌ SMTP is not configured in .env. Please fill in SMTP details first.');
        process.exit(1);
    }

    console.log('🚀 Sending a test billing email to kavinbalaji365@gmail.com...');
    
    const result = await sendOrderInvoiceEmail({
        orderNumber: 'TEST-12345',
        customerName: 'Kavin Balaji',
        customerEmail: 'kavinbalaji365@gmail.com',
        totalAmount: 1850.50,
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        invoiceUrl: 'https://bill.myfabclean.com/documents/2026/07/test-invoice.pdf',
        items: [
            {
                serviceId: 's1',
                serviceName: 'Premium Dry Cleaning - Suit',
                quantity: 2,
                price: '600.00',
                subtotal: '1200.00'
            },
            {
                serviceId: 's2',
                serviceName: 'Premium Dry Cleaning - Shirt',
                quantity: 5,
                price: '130.10',
                subtotal: '650.50'
            }
        ]
    });

    if (result.success) {
        console.log('✅ Test email sent successfully!');
    } else {
        console.error('❌ Failed to send test email:', result.error);
    }
}

main().catch(console.error);
