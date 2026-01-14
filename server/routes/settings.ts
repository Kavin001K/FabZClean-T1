import express, { Request, Response } from 'express';
import { settingsService } from '../services/settings-service';
import { AuthService } from '../auth-service';
import { jwtRequired, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(jwtRequired);

// Get all settings (accessible to all authenticated users)
router.get('/', async (req: Request, res: Response) => {
    try {
        const settings = await settingsService.getAllSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
});

// Get settings by category
router.get('/category/:category', async (req: Request, res: Response) => {
    try {
        const settings = await settingsService.getSettingsByCategory(req.params.category);
        res.json(settings);
    } catch (error) {
        console.error(`Error fetching settings for category ${req.params.category}:`, error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
});

// Update a single setting
router.put('/:key', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value, category } = req.body;

        if (value === undefined || !category) {
            return res.status(400).json({ message: 'Value and category are required' });
        }

        const setting = await settingsService.updateSetting(key, value, category);

        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'update_setting',
                'setting',
                key,
                { value, category },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(setting);
    } catch (error: any) {
        console.error(`Error updating setting ${req.params.key}:`, error);
        res.status(500).json({ message: error.message || 'Failed to update setting' });
    }
});

// Bulk update settings
router.put('/', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const { settings } = req.body;

        if (!Array.isArray(settings)) {
            return res.status(400).json({ message: 'Settings must be an array' });
        }

        const updatedSettings = await settingsService.updateSettings(settings);

        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'bulk_update_settings',
                'setting',
                'bulk',
                { count: settings.length },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(updatedSettings);
    } catch (error: any) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: error.message || 'Failed to update settings' });
    }
});

// Reset settings to defaults
router.post('/reset', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const settings = await settingsService.resetToDefaults();

        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'reset_settings',
                'setting',
                'all',
                {},
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(settings);
    } catch (error) {
        console.error('Error resetting settings:', error);
        res.status(500).json({ message: 'Failed to reset settings' });
    }
});

// Export settings
router.get('/export/json', async (req: Request, res: Response) => {
    try {
        const data = await settingsService.exportSettings();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=settings-${Date.now()}.json`);
        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'export_data',
                'setting',
                'all',
                { type: 'json_export' },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(data);
    } catch (error) {
        console.error('Error exporting settings:', error);
        res.status(500).json({ message: 'Failed to export settings' });
    }
});

// Import settings
router.post('/import', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const { settings } = req.body;

        if (!Array.isArray(settings)) {
            return res.status(400).json({ message: 'Invalid settings format' });
        }

        const importedSettings = await settingsService.importSettings(settings);

        // Log action
        if ((req as any).employee) {
            await AuthService.logAction(
                (req as any).employee.employeeId,
                (req as any).employee.username,
                'import_settings',
                'setting',
                'bulk',
                { count: settings.length },
                req.ip || req.connection.remoteAddress,
                req.get('user-agent')
            );
        }

        res.json(importedSettings);
    } catch (error: any) {
        console.error('Error importing settings:', error);
        res.status(500).json({ message: error.message || 'Failed to import settings' });
    }
});

export default router;
