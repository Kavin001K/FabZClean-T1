import express, { Request, Response } from 'express';
import multer from 'multer';
import { settingsService } from '../services/settings-service';
import { businessConfigService } from '../services/business-config-service';
import { AuthService } from '../auth-service';
import { jwtRequired, requireRole } from '../middleware/auth';
import { SupabaseFileStorage } from '../services/supabase-file-storage';

const router = express.Router();
const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
            return;
        }
        cb(new Error('Only image files are allowed'));
    },
});

// Apply auth middleware to all routes
router.use(jwtRequired);

router.get('/business-profile', async (_req: Request, res: Response) => {
    try {
        const profile = await businessConfigService.getBusinessProfile();
        res.json({ success: true, profile });
    } catch (error: any) {
        console.error('CRITICAL: Error fetching business profile:', {
            message: error.message,
            stack: error.stack,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        res.status(500).json({ 
            message: 'Failed to fetch business profile',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.put('/business-profile', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const profile = await businessConfigService.updateBusinessProfile(req.body || {});
        res.json({ success: true, profile });
    } catch (error: any) {
        console.error('Error updating business profile:', error);
        res.status(500).json({ message: error.message || 'Failed to update business profile' });
    }
});

router.post('/business-profile/logo', requireRole(['admin']), imageUpload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const logoUrl = await SupabaseFileStorage.saveBillLogo(
            'global',
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        const current = await businessConfigService.getBusinessProfile();
        const profile = await businessConfigService.updateBusinessProfile({
            invoiceDefaults: {
                ...current.invoiceDefaults,
                logoUrl,
            },
        });

        res.json({ success: true, profile, logoUrl });
    } catch (error: any) {
        console.error('Error uploading business logo:', error);
        res.status(500).json({ message: error.message || 'Failed to upload business logo' });
    }
});

router.get('/stores', async (req: Request, res: Response) => {
    try {
        const stores = await businessConfigService.listStores({
            activeOnly: String(req.query.activeOnly || '') === 'true',
        });
        res.json({ success: true, stores });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ message: 'Failed to fetch stores' });
    }
});

router.get('/stores/resolve', async (req: Request, res: Response) => {
    try {
        const storeId = typeof req.query.storeId === 'string' ? req.query.storeId : undefined;
        const storeCode = typeof req.query.storeCode === 'string' ? req.query.storeCode : undefined;
        const store = storeId
            ? await businessConfigService.getStoreById(storeId)
            : await businessConfigService.getStoreByCode(storeCode || '');
        res.json({ success: true, store });
    } catch (error) {
        console.error('Error resolving store:', error);
        res.status(500).json({ message: 'Failed to resolve store' });
    }
});

router.post('/stores', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const store = await businessConfigService.createStore(req.body || {});
        res.json({ success: true, store });
    } catch (error: any) {
        console.error('Error creating store:', error);
        res.status(500).json({ message: error.message || 'Failed to create store' });
    }
});

router.put('/stores/:id', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const store = await businessConfigService.updateStore(req.params.id, req.body || {});
        res.json({ success: true, store });
    } catch (error: any) {
        console.error('Error updating store:', error);
        res.status(500).json({ message: error.message || 'Failed to update store' });
    }
});

router.post('/stores/:id/logo', requireRole(['admin']), imageUpload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const current = await businessConfigService.getStoreById(req.params.id);
        if (!current) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const logoUrl = await SupabaseFileStorage.saveBillLogo(
            current.code || req.params.id,
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        const store = await businessConfigService.updateStore(req.params.id, {
            invoiceOverrides: {
                ...(current.invoiceOverrides || {}),
                logoUrl,
            },
        });

        res.json({ success: true, store, logoUrl });
    } catch (error: any) {
        console.error('Error uploading store logo:', error);
        res.status(500).json({ message: error.message || 'Failed to upload store logo' });
    }
});

router.get('/invoice-templates/resolve', async (req: Request, res: Response) => {
    try {
        const resolved = await businessConfigService.resolveInvoiceContext({
            storeId: typeof req.query.storeId === 'string' ? req.query.storeId : undefined,
            storeCode: typeof req.query.storeCode === 'string' ? req.query.storeCode : undefined,
            templateId: typeof req.query.templateId === 'string' ? req.query.templateId : undefined,
            templateKey: typeof req.query.templateKey === 'string' ? req.query.templateKey : undefined,
        });
        res.json({ success: true, ...resolved });
    } catch (error: any) {
        console.error('Error resolving invoice template:', error);
        res.status(500).json({ message: error.message || 'Failed to resolve invoice template' });
    }
});

router.get('/invoice-templates', async (req: Request, res: Response) => {
    try {
        const templates = await businessConfigService.listInvoiceTemplates({
            activeOnly: String(req.query.activeOnly || '') === 'true',
            storeId: req.query.storeId === 'global'
                ? null
                : typeof req.query.storeId === 'string'
                    ? req.query.storeId
                    : undefined,
        });
        res.json({ success: true, templates });
    } catch (error) {
        console.error('Error fetching invoice templates:', error);
        res.status(500).json({ message: 'Failed to fetch invoice templates' });
    }
});

router.post('/invoice-templates', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const template = await businessConfigService.createInvoiceTemplate(req.body || {});
        res.json({ success: true, template });
    } catch (error: any) {
        console.error('Error creating invoice template:', error);
        res.status(500).json({ message: error.message || 'Failed to create invoice template' });
    }
});

router.put('/invoice-templates/:id', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const template = await businessConfigService.updateInvoiceTemplate(req.params.id, req.body || {});
        res.json({ success: true, template });
    } catch (error: any) {
        console.error('Error updating invoice template:', error);
        res.status(500).json({ message: error.message || 'Failed to update invoice template' });
    }
});

router.get('/tag-templates/resolve', async (req: Request, res: Response) => {
    try {
        const storeId = typeof req.query.storeId === 'string' ? req.query.storeId : undefined;
        const templateId = typeof req.query.templateId === 'string' ? req.query.templateId : undefined;
        const templateKey = typeof req.query.templateKey === 'string' ? req.query.templateKey : undefined;
        const store = storeId ? await businessConfigService.getStoreById(storeId) : null;
        const template = await businessConfigService.resolveTagTemplate({ storeId, templateId, templateKey });
        res.json({ success: true, store, template });
    } catch (error: any) {
        console.error('Error resolving tag template:', error);
        res.status(500).json({ message: error.message || 'Failed to resolve tag template' });
    }
});

router.get('/tag-templates', async (req: Request, res: Response) => {
    try {
        const templates = await businessConfigService.listTagTemplates({
            activeOnly: String(req.query.activeOnly || '') === 'true',
            storeId: req.query.storeId === 'global'
                ? null
                : typeof req.query.storeId === 'string'
                    ? req.query.storeId
                    : undefined,
        });
        res.json({ success: true, templates });
    } catch (error) {
        console.error('Error fetching tag templates:', error);
        res.status(500).json({ message: 'Failed to fetch tag templates' });
    }
});

router.post('/tag-templates', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const template = await businessConfigService.createTagTemplate(req.body || {});
        res.json({ success: true, template });
    } catch (error: any) {
        console.error('Error creating tag template:', error);
        res.status(500).json({ message: error.message || 'Failed to create tag template' });
    }
});

router.put('/tag-templates/:id', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
        const template = await businessConfigService.updateTagTemplate(req.params.id, req.body || {});
        res.json({ success: true, template });
    } catch (error: any) {
        console.error('Error updating tag template:', error);
        res.status(500).json({ message: error.message || 'Failed to update tag template' });
    }
});

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

// --- User-Specific Settings (Move up to prevent shadowing by :key) ---

// Get current user's settings
router.get('/me', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).employee?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const settings = await settingsService.getUserSettings(userId);
        res.json({ success: true, settings: settings || {} });
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ message: 'Failed to fetch user settings' });
    }
});

// Update current user's settings
router.put('/me', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).employee?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const updatedSettings = await settingsService.updateUserSettings(userId, req.body);
        res.json({ success: true, settings: updatedSettings });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ message: 'Failed to update user settings' });
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

// (User-specific routes moved up)

export default router;
