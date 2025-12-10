import express from 'express';
import { db } from '../db';

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
router.post('/', async (req, res) => {
    try {
        const service = await db.createService(req.body);
        res.status(201).json(service);
    } catch (error: any) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update service
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
    try {
        await db.deleteService(req.params.id);
        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
