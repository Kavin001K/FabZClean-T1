/**
 * Script to sync customer statistics from their orders
 * This updates totalOrders, totalSpent, and lastOrder for all customers
 * 
 * Usage: npx tsx server/scripts/sync-customer-stats.ts
 */

import { db as storage } from '../db';

async function syncCustomerStats() {
try {
        const customers = await storage.listCustomers();
        const orders = await storage.listOrders();

        let updated = 0;
        let skipped = 0;

        for (const customer of customers) {
            // Get all orders for this customer
            const customerOrders = orders.filter((o: any) => o.customerId === customer.id);

            if (customerOrders.length === 0) {
                skipped++;
                continue;
            }

            // Calculate stats
            const totalOrders = customerOrders.length;
            const totalSpent = customerOrders.reduce((sum: number, o: any) => {
                return sum + parseFloat(o.totalAmount || '0');
            }, 0);

            // Find last order date
            const sortedOrders = [...customerOrders].sort((a: any, b: any) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            const lastOrder = sortedOrders[0]?.createdAt;

            // Check if update needed
            const currentOrders = customer.totalOrders || 0;
            const currentSpent = parseFloat(customer.totalLifetimeSpent?.toString() || '0');

            if (currentOrders !== totalOrders || Math.abs(currentSpent - totalSpent) > 0.01) {
                // Update customer - pass lastOrder as string (ISO format)
                await storage.updateCustomer(customer.id, {
                    totalOrders,
                    totalLifetimeSpent: totalSpent.toFixed(2),
                    lastOrder: lastOrder || undefined
                });
} → ₹${totalSpent.toFixed(2)}`);
                updated++;
            } else {
                skipped++;
            }
        }


} catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

// Run the sync
syncCustomerStats();
