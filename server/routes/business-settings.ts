/**
 * Business Settings API Routes
 * 
 * GET  /api/business-settings     - Get current settings (all authenticated users)
 * PUT  /api/business-settings     - Update settings (admin/franchise_manager only)
 */

import { Router, Request, Response } from 'express';
import { BusinessSettingsService } from '../services/business-settings-service';
import { authMiddleware } from '../middleware/employee-auth';

const router = Router();

/**
 * GET /api/business-settings
 * Fetch global business rules
 * Any authenticated user can view settings
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const settings = await BusinessSettingsService.getSettings();
        res.json({
            success: true,
            settings
        });
    } catch (error: any) {
        console.error('[BusinessSettings] GET error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch business settings'
        });
    }
});

/**
 * PUT /api/business-settings
 * Update business rules
 * Only admin and franchise_manager roles can modify
 */
router.put('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userRole = req.employee?.role;

        // Only admins and franchise managers can update business settings
        if (userRole !== 'admin' && userRole !== 'franchise_manager') {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions. Only admins can modify business settings.'
            });
        }

        const {
            taxRate,
            currencySymbol,
            minimumOrderValue,
            defaultTurnaroundHours,
            expressSurchargePercent,
            enableStockAlerts,
            lowStockThreshold,
            receiptHeader,
            receiptFooter
        } = req.body;

        // Validate numeric fields
        if (taxRate !== undefined && (isNaN(taxRate) || taxRate < 0 || taxRate > 100)) {
            return res.status(400).json({
                success: false,
                error: 'Tax rate must be a number between 0 and 100'
            });
        }

        if (minimumOrderValue !== undefined && (isNaN(minimumOrderValue) || minimumOrderValue < 0)) {
            return res.status(400).json({
                success: false,
                error: 'Minimum order value must be a positive number'
            });
        }

        if (defaultTurnaroundHours !== undefined && (isNaN(defaultTurnaroundHours) || defaultTurnaroundHours < 1)) {
            return res.status(400).json({
                success: false,
                error: 'Turnaround hours must be at least 1'
            });
        }

        const updatedSettings = await BusinessSettingsService.updateSettings(
            {
                taxRate,
                currencySymbol,
                minimumOrderValue,
                defaultTurnaroundHours,
                expressSurchargePercent,
                enableStockAlerts,
                lowStockThreshold,
                receiptHeader,
                receiptFooter
            },
            req.employee?.employeeId
        );

        console.log(`[BusinessSettings] Updated by ${req.employee?.employeeId}`);

        res.json({
            success: true,
            settings: updatedSettings,
            message: 'Business settings updated successfully'
        });
    } catch (error: any) {
        console.error('[BusinessSettings] PUT error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update business settings'
        });
    }
});

export default router;
