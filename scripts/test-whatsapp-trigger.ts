
import 'dotenv/config';
import { db } from './server/db';
import { handleOrderStatusChange } from './server/services/whatsapp.service';

async function testWhatsApp() {
    console.log('🚀 Starting WhatsApp Trigger Test...');
    
    // 1. Create a dummy order data
    const testOrder = {
        id: 'test-order-' + Date.now(),
        orderNumber: 'TEST-' + Math.floor(Math.random() * 10000),
        customerName: 'Kavin Test',
        customerPhone: '8825702072', // User's phone from logs
        totalAmount: '150.00',
        status: 'pending' as any,
        fulfillmentType: 'pickup' as any,
        items: [{ serviceName: 'Test Service', quantity: 1, price: '150' }],
        invoiceUrl: null,
        invoiceNumber: 'INV-TEST-' + Date.now(),
    };

    console.log(`📦 Mock Order Created: ${testOrder.orderNumber}`);

    try {
        console.log('📱 Calling handleOrderStatusChange...');
        const result = await handleOrderStatusChange(testOrder as any, null);
        
        if (result && result.success) {
            console.log('✅ WhatsApp API Triggered Successfully!');
            console.log('Details:', JSON.stringify(result, null, 2));
        } else {
            console.log('❌ WhatsApp API Trigger Failed');
            console.log('Error:', result?.error || 'Unknown error');
        }
    } catch (error) {
        console.error('💥 Crash during test:', error);
    }
}

testWhatsApp().then(() => process.exit(0));
