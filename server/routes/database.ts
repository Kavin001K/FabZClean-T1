import express from 'express';
import { getDatabaseInfo } from '../db-utils';

const router = express.Router();

// Database info
router.get('/info', async (req, res) => {
    try {
        const info = await getDatabaseInfo();
        res.json(info);
    } catch (error: any) {
        console.error('Failed to get database info:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fix customer revenues
router.get('/fix-revenues', async (req, res) => {
    try {
        const { db } = await import('../db');
        console.log("Fetching all customers...");
        const customers = await db.listCustomers();
        const orders = await db.listOrders();
        let updatedCount = 0;

        for (const customer of customers) {
            const customerOrders = orders.filter((o: any) => o.customerId === customer.id);
            const totalOrders = customerOrders.length;
            const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || "0"), 0);

            if (customer.totalOrders !== totalOrders || parseFloat(customer.totalSpent || "0") !== totalSpent) {
                updatedCount++;
                await db.updateCustomer(customer.id, {
                    totalOrders,
                    totalSpent
                } as any);
            }
        }
        res.json({ success: true, message: `Fixed revenue for ${updatedCount} customers.` });
    } catch (error: any) {
        console.error('Failed to fix revenues:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
