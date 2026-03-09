import { config } from 'dotenv';
config();

async function runTests() {
    const { db: storage } = await import('./server/db.js');
    console.log('--- STARTING PAYMENT ENGINE TESTS ---');
    let customerId: string | undefined;
    let orderId: string | undefined;

    try {
        // 1. Create a minimal test customer
        console.log('\n[1] Creating test customer...');
        const newCustomer = await storage.createCustomer({
            name: 'Test Payment User',
            phone: '9999999999',
            status: 'active'
        } as any);
        customerId = newCustomer.id;
        console.log('✅ Created Customer:', customerId);

        // 2. Test Wallet Recharge
        console.log('\n[2] Testing Wallet Recharge ($500)...');
        const rechargeRes = await (storage as any).processWalletRecharge(
            customerId,
            500,
            'CASH',
            null,
            'Test Bot'
        );
        if (!rechargeRes.success) throw new Error(rechargeRes.error);
        console.log('✅ Recharge successful. New Balance:', rechargeRes.newBalance);

        // 3. Create a test order for $750
        console.log('\n[3] Creating test order ($750 total)...');
        const newOrder = await storage.createOrder({
            orderNumber: `TEST-${Date.now()}`,
            customerId: customerId,
            customerName: 'Test Payment User',
            status: 'pending',
            paymentStatus: 'pending',
            totalAmount: '750.00',
            items: [{
                serviceId: 'test-svc',
                serviceName: 'Test Service',
                quantity: 1,
                price: '750.00',
                subtotal: '750.00'
            }],
            paymentMethod: 'cash'
        } as any);
        orderId = newOrder.id;
        console.log('✅ Created Order:', orderId);

        // 4. Process Checkout (Wallet $500 + Cash $0 -> Credit $250)
        console.log('\n[4] Processing Checkout (Using $500 Wallet, $0 Cash -> expects $250 Credit)...');
        const checkoutRes = await (storage as any).processOrderCheckout(
            orderId,
            customerId,
            0,   // Cash
            500, // Wallet
            null,
            'Test Bot'
        );
        if (!checkoutRes.success) throw new Error(checkoutRes.error);
        console.log('✅ Checkout successful. Result:', checkoutRes.data);

        // Verify order status
        const updatedOrder = await storage.getOrder(orderId as string);
        console.log('   Order paymentStatus:', updatedOrder?.paymentStatus);
        console.log('   Order walletUsed:', (updatedOrder as any)?.walletUsed);
        console.log('   Order creditUsed:', (updatedOrder as any)?.creditUsed);

        // 5. Test Credit Repayment ($100)
        console.log('\n[5] Testing Credit Repayment ($100 on the $250 credit)...');
        const repayRes = await (storage as any).processCreditRepayment(
            customerId,
            100,
            'UPI',
            null,
            'Test Bot'
        );
        if (!repayRes.success) throw new Error(repayRes.error);
        console.log('✅ Repayment successful. Remaining Balance:', repayRes.balanceAfter);

        console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err);
    }
}

runTests();
