import express from 'express';
import { db } from '../db';

const router = express.Router();

console.log("Loading database routes...");

router.get('/health/database', async (req, res) => {
    try {
        // Simple query to check connection
        await db.getProducts();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            type: process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite'
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

router.get('/database/info', async (req, res) => {
    try {
        res.json({
            type: process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite',
            version: '1.0.0',
            tables: ['users', 'products', 'orders', 'customers', 'employees'] // Mock list or fetch real one
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
