/**
 * Business Settings Service
 * 
 * Manages global operational rules that affect all users.
 * These are stored in the database (not localStorage) because they control
 * business logic like tax rates, turnaround times, and minimum order values.
 */

import { db } from '../db';

// Interface for business settings
export interface BusinessSettings {
    id: string;
    // Financials
    taxRate: number;           // e.g., 18.00 for 18% GST
    currencySymbol: string;    // e.g., "₹"
    minimumOrderValue: number; // Minimum order amount required

    // Operations
    defaultTurnaroundHours: number;  // Default processing time
    expressSurchargePercent: number; // Extra charge for express orders
    enableStockAlerts: boolean;
    lowStockThreshold: number;

    // Branding (Receipts)
    receiptHeader: string;
    receiptFooter: string;

    // Metadata
    updatedAt: string;
    updatedBy?: string;
}

// Default settings
const DEFAULT_SETTINGS: Omit<BusinessSettings, 'id'> = {
    taxRate: 0,
    currencySymbol: '₹',
    minimumOrderValue: 0,
    defaultTurnaroundHours: 48,
    expressSurchargePercent: 50,
    enableStockAlerts: true,
    lowStockThreshold: 10,
    receiptHeader: 'FabZClean Laundry',
    receiptFooter: 'Thank you for choosing us!',
    updatedAt: new Date().toISOString(),
};

class BusinessSettingsServiceClass {
    private tableName = 'business_settings';

    /**
     * Ensure the business_settings table exists
     */
    ensureTable(): void {
        try {
            (db as any).db.exec(`
        CREATE TABLE IF NOT EXISTS business_settings (
          id TEXT PRIMARY KEY DEFAULT 'global',
          taxRate REAL DEFAULT 0,
          currencySymbol TEXT DEFAULT '₹',
          minimumOrderValue REAL DEFAULT 0,
          defaultTurnaroundHours INTEGER DEFAULT 48,
          expressSurchargePercent REAL DEFAULT 50,
          enableStockAlerts INTEGER DEFAULT 1,
          lowStockThreshold INTEGER DEFAULT 10,
          receiptHeader TEXT DEFAULT 'FabZClean Laundry',
          receiptFooter TEXT DEFAULT 'Thank you for choosing us!',
          updatedAt TEXT,
          updatedBy TEXT
        );
      `);
            console.log('✅ Business settings table ready');
        } catch (error) {
            console.error('❌ Failed to create business_settings table:', error);
        }
    }

    /**
     * Get current business settings
     * Creates defaults if none exist
     */
    async getSettings(): Promise<BusinessSettings> {
        try {
            this.ensureTable();

            const stmt = (db as any).db.prepare(`SELECT * FROM ${this.tableName} WHERE id = 'global'`);
            const row = stmt.get() as any;

            if (!row) {
                // Insert default settings
                return await this.initializeDefaults();
            }

            return this.rowToSettings(row);
        } catch (error) {
            console.error('Failed to get business settings:', error);
            return { id: 'global', ...DEFAULT_SETTINGS };
        }
    }

    /**
     * Initialize with default settings
     */
    private async initializeDefaults(): Promise<BusinessSettings> {
        const id = 'global';
        const now = new Date().toISOString();

        try {
            const stmt = (db as any).db.prepare(`
        INSERT INTO ${this.tableName} (
          id, taxRate, currencySymbol, minimumOrderValue,
          defaultTurnaroundHours, expressSurchargePercent,
          enableStockAlerts, lowStockThreshold,
          receiptHeader, receiptFooter, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

            stmt.run(
                id,
                DEFAULT_SETTINGS.taxRate,
                DEFAULT_SETTINGS.currencySymbol,
                DEFAULT_SETTINGS.minimumOrderValue,
                DEFAULT_SETTINGS.defaultTurnaroundHours,
                DEFAULT_SETTINGS.expressSurchargePercent,
                DEFAULT_SETTINGS.enableStockAlerts ? 1 : 0,
                DEFAULT_SETTINGS.lowStockThreshold,
                DEFAULT_SETTINGS.receiptHeader,
                DEFAULT_SETTINGS.receiptFooter,
                now
            );

            console.log('✅ Initialized default business settings');
            return { id, ...DEFAULT_SETTINGS, updatedAt: now };
        } catch (error) {
            console.error('Failed to initialize business settings:', error);
            return { id, ...DEFAULT_SETTINGS };
        }
    }

    /**
     * Update business settings
     */
    async updateSettings(
        data: Partial<BusinessSettings>,
        updatedBy?: string
    ): Promise<BusinessSettings> {
        try {
            this.ensureTable();

            // Ensure settings exist first
            await this.getSettings();

            const now = new Date().toISOString();
            const fields: string[] = [];
            const values: any[] = [];

            if (data.taxRate !== undefined) {
                fields.push('taxRate = ?');
                values.push(data.taxRate);
            }
            if (data.currencySymbol !== undefined) {
                fields.push('currencySymbol = ?');
                values.push(data.currencySymbol);
            }
            if (data.minimumOrderValue !== undefined) {
                fields.push('minimumOrderValue = ?');
                values.push(data.minimumOrderValue);
            }
            if (data.defaultTurnaroundHours !== undefined) {
                fields.push('defaultTurnaroundHours = ?');
                values.push(data.defaultTurnaroundHours);
            }
            if (data.expressSurchargePercent !== undefined) {
                fields.push('expressSurchargePercent = ?');
                values.push(data.expressSurchargePercent);
            }
            if (data.enableStockAlerts !== undefined) {
                fields.push('enableStockAlerts = ?');
                values.push(data.enableStockAlerts ? 1 : 0);
            }
            if (data.lowStockThreshold !== undefined) {
                fields.push('lowStockThreshold = ?');
                values.push(data.lowStockThreshold);
            }
            if (data.receiptHeader !== undefined) {
                fields.push('receiptHeader = ?');
                values.push(data.receiptHeader);
            }
            if (data.receiptFooter !== undefined) {
                fields.push('receiptFooter = ?');
                values.push(data.receiptFooter);
            }

            // Always update timestamp and updater
            fields.push('updatedAt = ?');
            values.push(now);

            if (updatedBy) {
                fields.push('updatedBy = ?');
                values.push(updatedBy);
            }

            if (fields.length === 0) {
                return await this.getSettings();
            }

            values.push('global'); // WHERE id = ?

            const sql = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
            (db as any).db.prepare(sql).run(...values);

            console.log('✅ Business settings updated');
            return await this.getSettings();
        } catch (error) {
            console.error('Failed to update business settings:', error);
            throw new Error('Failed to update business settings');
        }
    }

    /**
     * Convert database row to BusinessSettings object
     */
    private rowToSettings(row: any): BusinessSettings {
        return {
            id: row.id,
            taxRate: parseFloat(row.taxRate) || 0,
            currencySymbol: row.currencySymbol || '₹',
            minimumOrderValue: parseFloat(row.minimumOrderValue) || 0,
            defaultTurnaroundHours: parseInt(row.defaultTurnaroundHours) || 48,
            expressSurchargePercent: parseFloat(row.expressSurchargePercent) || 50,
            enableStockAlerts: row.enableStockAlerts === 1,
            lowStockThreshold: parseInt(row.lowStockThreshold) || 10,
            receiptHeader: row.receiptHeader || 'FabZClean Laundry',
            receiptFooter: row.receiptFooter || 'Thank you!',
            updatedAt: row.updatedAt || new Date().toISOString(),
            updatedBy: row.updatedBy || undefined,
        };
    }
}

// Export singleton instance
export const BusinessSettingsService = new BusinessSettingsServiceClass();
