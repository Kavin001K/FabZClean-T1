// Test WhatsApp Processing Notification
// Run with: npx tsx server/test-whatsapp-processing.ts

import 'dotenv/config';
import { sendOrderProcessingNotification } from './services/whatsapp.service';

async function testProcessingNotification() {
    console.log('\n🧪 Testing WhatsApp Processing Notification\n');
    console.log('='.repeat(50));

    // Check environment variables
    console.log('\n📋 Checking configuration:');
    console.log(`MSG91_AUTH_KEY: ${process.env.MSG91_AUTH_KEY ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`MSG91_INTEGRATED_NUMBER: ${process.env.MSG91_INTEGRATED_NUMBER || '15558125705 (default)'}`);
    console.log(`MSG91_NAMESPACE_Bill: ${process.env.MSG91_NAMESPACE_Bill || '(using default)'}`);
    console.log(`MSG91_TEMPLATE_NAME_Bill: ${process.env.MSG91_TEMPLATE_NAME_Bill || 'bill (default)'}`);

    // Test phone number - replace with your test number
    const testPhone = process.env.TEST_PHONE_NUMBER || '8825702072'; // Your phone number
    const testCustomerName = 'Kavin';
    const testOrderNumber = 'TEST-20251228-001';

    console.log('\n📱 Test Parameters:');
    console.log(`Phone: ${testPhone}`);
    console.log(`Customer: ${testCustomerName}`);
    console.log(`Order: ${testOrderNumber}`);

    console.log('\n🚀 Sending test notification...\n');

    try {
        const result = await sendOrderProcessingNotification({
            phoneNumber: testPhone,
            customerName: testCustomerName,
            orderNumber: testOrderNumber,
        });

        console.log('\n📊 Result:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ SUCCESS! Check your WhatsApp for the message.');
        } else {
            console.log('\n❌ FAILED!');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('\n💥 Exception:', error);
    }

    console.log('\n' + '='.repeat(50));
}

testProcessingNotification();
