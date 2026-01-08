import express from 'express';
import { db } from '../db';
import { jwtRequired, requireRole } from '../middleware/auth';

const router = express.Router();

// GET all services (shared across all franchises)
router.get('/', async (req, res) => {
    try {
        // Services are common for all franchises - no isolation needed
        const services = await db.getServices();
        // Return array directly for frontend compatibility
        res.json(services);
    } catch (error: any) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET single service by ID
router.get('/:id', async (req, res) => {
    try {
        const service = await db.getService(req.params.id);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (error: any) {
        console.error('Error fetching service:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST create new service
router.post('/', jwtRequired, requireRole(['admin', 'factory_manager', 'franchise_manager']), async (req, res) => {
    try {
        const service = await db.createService(req.body);
        res.status(201).json(service);
    } catch (error: any) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST bulk create services
router.post('/bulk', jwtRequired, requireRole(['admin', 'factory_manager', 'franchise_manager']), async (req, res) => {
    try {
        const services = req.body;
        if (!Array.isArray(services)) {
            return res.status(400).json({ error: "Expected array of services" });
        }

        const results = [];
        let successCount = 0;

        // Process sequentially to avoid DB locks
        for (const s of services) {
            try {
                // Basic validation
                if (!s.name || !s.price) {
                    results.push({ success: false, error: "Missing name or price", data: s });
                    continue;
                }
                const created = await db.createService(s);
                results.push({ success: true, data: created });
                successCount++;
            } catch (e: any) {
                console.error("Failed to create service in bulk:", s.name, e);
                results.push({ success: false, error: e.message, data: s });
            }
        }

        res.status(201).json({
            message: `Processed ${services.length} services`,
            successCount,
            results
        });
    } catch (error: any) {
        console.error('Error in bulk import:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update service
router.put('/:id', jwtRequired, requireRole(['admin', 'factory_manager', 'franchise_manager']), async (req, res) => {
    try {
        const service = await db.updateService(req.params.id, req.body);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (error: any) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE service
router.delete('/:id', jwtRequired, requireRole(['admin', 'factory_manager']), async (req, res) => {
    try {
        await db.deleteService(req.params.id);
        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
