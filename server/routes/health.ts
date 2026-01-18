import express from 'express';
import { getDatabaseHealth, pingDatabase, getDatabaseInfo } from '../db-utils';

const router = express.Router();

// Database health check
router.get('/database', async (req, res) => {
    try {
        const health = await getDatabaseHealth();
        res.json(health);
    } catch (error: any) {
        console.error('Database health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
        });
    }
});

// Database ping
router.get('/ping', async (req, res) => {
    try {
        const ping = await pingDatabase();
        res.json(ping);
    } catch (error: any) {
        console.error('Database ping failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
