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

// POST bulk create services - MUST be before /:id to avoid route conflict
router.post('/bulk', jwtRequired, requireRole(['admin', 'factory_manager', 'franchise_manager']), async (req, res) => {
    try {
        const services = req.body;
        console.log('[Services] Bulk import request received:', services?.length || 0, 'services');

        if (!Array.isArray(services)) {
            return res.status(400).json({ error: "Expected array of services" });
        }

        if (services.length === 0) {
            return res.status(400).json({ error: "No services provided" });
        }

        const results = [];
        let successCount = 0;
        const errors: string[] = [];

        // Process sequentially to avoid DB locks
        for (const s of services) {
            try {
                // Basic validation
                if (!s.name) {
                    errors.push(`Missing name for service`);
                    results.push({ success: false, error: "Missing name", data: s });
                    continue;
                }

                // Ensure price is a valid number
                const serviceData = {
                    name: s.name,
                    category: s.category || 'General',
                    description: s.description || '',
                    price: String(parseFloat(s.price) || 0),
                    status: s.status === 'inactive' ? 'inactive' : 'active',
                    duration: s.duration || '24 hrs'
                };

                const created = await db.createService(serviceData);
                results.push({ success: true, data: created });
                successCount++;
                console.log(`[Services] Created: ${s.name}`);
            } catch (e: any) {
                console.error("[Services] Failed to create service in bulk:", s.name, e.message);
                errors.push(`${s.name}: ${e.message}`);
                results.push({ success: false, error: e.message, data: s });
            }
        }

        console.log(`[Services] Bulk import completed: ${successCount}/${services.length} successful`);

        res.status(201).json({
            success: true,
            message: `Imported ${successCount} of ${services.length} services`,
            successCount,
            failCount: services.length - successCount,
            errors: errors.length > 0 ? errors : undefined,
            results
        });
    } catch (error: any) {
        console.error('Error in bulk import:', error);
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
        console.log(`[Services] Deleting service: ${req.params.id}`);
        await db.deleteService(req.params.id);
        console.log(`[Services] Service deleted: ${req.params.id}`);
        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE bulk services
router.delete('/bulk', jwtRequired, requireRole(['admin']), async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "Expected array of service IDs" });
        }

        let deletedCount = 0;
        for (const id of ids) {
            try {
                await db.deleteService(id);
                deletedCount++;
            } catch (e: any) {
                console.error(`Failed to delete service ${id}:`, e.message);
            }
        }

        res.json({ success: true, deletedCount, total: ids.length });
    } catch (error: any) {
        console.error('Error in bulk delete:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
