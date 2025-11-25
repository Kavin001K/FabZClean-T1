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

export default router;
