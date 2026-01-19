/**
 * Script to sync credit transactions for existing orders
 * Run this once to populate credit records for orders that have 'credit' payment status
 * but no corresponding credit transaction entries.
 * 
 * Usage: npx tsx server/scripts/sync-order-credits.ts
 */

import { db as storage } from '../db';

async function syncOrderCredits() {
    console.log('🔄 Starting credit sync for existing orders...\n');

    try {
        // Get all orders with credit or pending payment status
        const allOrders = await storage.listOrders();
        const creditOrders = allOrders.filter(
            (order: any) =>
                (order.paymentStatus === 'credit' || order.paymentStatus === 'pending') &&
                order.customerId
        );

        console.log(`📊 Found ${creditOrders.length} orders with credit/pending status`);

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const order of creditOrders) {
            try {
                const totalAmount = parseFloat(order.totalAmount || '0');
                const advancePaid = parseFloat(order.advancePaid || '0');
                const balanceDue = totalAmount - advancePaid;

                if (balanceDue <= 0) {
                    console.log(`  ⏭️  ${order.orderNumber}: No balance due (fully paid)`);
                    skipped++;
                    continue;
                }

                // Check if credit entry already exists for this order
                const existingHistory = await storage.getCustomerCreditHistory(order.customerId);
                const alreadyRecorded = existingHistory.some(
                    (tx: any) => tx.referenceId === order.id || tx.description?.includes(order.orderNumber)
                );

                if (alreadyRecorded) {
                    console.log(`  ⏭️  ${order.orderNumber}: Credit already recorded`);
                    skipped++;
                    continue;
                }

                // Add credit entry
                const description = `Order ${order.orderNumber} - Balance due (Total: ₹${totalAmount.toFixed(2)}, Advance: ₹${advancePaid.toFixed(2)}) [Sync]`;

                await storage.addCustomerCredit(
                    order.customerId,
                    balanceDue,
                    'usage',
                    description,
                    order.id,
                    'system-sync'
                );

                console.log(`  ✅ ${order.orderNumber}: Added ₹${balanceDue.toFixed(2)} credit for customer`);
                created++;

            } catch (err: any) {
                console.error(`  ❌ ${order.orderNumber}: Error - ${err.message}`);
                errors++;
            }
        }

        console.log('\n📈 Credit Sync Summary:');
        console.log(`   Created: ${created}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Errors:  ${errors}`);
        console.log('\n✅ Credit sync complete!');

    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

// Run the sync
syncOrderCredits();
