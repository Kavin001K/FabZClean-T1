"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.DEFAULT_SETTINGS = void 0;
const db_1 = require("../db");
// Default settings to seed the database
exports.DEFAULT_SETTINGS = [
    // General Settings
    { key: "business.name", value: "FabZClean Franchise", category: "general" },
    { key: "business.email", value: "info@fabzclean.com", category: "general" },
    { key: "business.phone", value: "+91 98765 43210", category: "general" },
    {
        key: "business.address",
        value: "123 Business Park, Bangalore, KA 560001",
        category: "general",
    },
    { key: "general.timezone", value: "Asia/Kolkata", category: "general" },
    { key: "general.currency", value: "INR", category: "general" },
    { key: "general.language", value: "en", category: "general" },
    { key: "general.dateFormat", value: "DD/MM/YYYY", category: "general" },
    // Notification Settings
    {
        key: "notifications.emailEnabled",
        value: true,
        category: "notifications",
    },
    { key: "notifications.smsEnabled", value: false, category: "notifications" },
    { key: "notifications.pushEnabled", value: true, category: "notifications" },
    { key: "notifications.orders", value: true, category: "notifications" },
    { key: "notifications.payments", value: true, category: "notifications" },
    { key: "notifications.attendance", value: true, category: "notifications" },
    { key: "notifications.delivery", value: true, category: "notifications" },
    {
        key: "notifications.maintenance",
        value: true,
        category: "notifications",
    },
    // Security Settings
    { key: "security.twoFactorAuth", value: false, category: "security" },
    { key: "security.sessionTimeout", value: 30, category: "security" },
    { key: "security.passwordExpiry", value: 90, category: "security" },
    { key: "security.loginAttempts", value: 5, category: "security" },
    { key: "security.auditLog", value: true, category: "security" },
    // Appearance Settings
    { key: "appearance.theme", value: "system", category: "appearance" },
    { key: "appearance.primaryColor", value: "#3b82f6", category: "appearance" },
    {
        key: "appearance.sidebarCollapsed",
        value: false,
        category: "appearance",
    },
    { key: "appearance.compactMode", value: false, category: "appearance" },
    // Business Settings
    {
        key: "business.operatingHours.start",
        value: "08:00",
        category: "business",
    },
    { key: "business.operatingHours.end", value: "20:00", category: "business" },
    {
        key: "business.operatingHours.workingDays",
        value: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        category: "business",
    },
    {
        key: "business.advancePaymentRequired",
        value: false,
        category: "business",
    },
    {
        key: "business.advancePaymentPercentage",
        value: 20,
        category: "business",
    },
    { key: "business.deliveryFee", value: 50, category: "business" },
    { key: "business.minimumOrderAmount", value: 100, category: "business" },
    { key: "business.autoAcceptOrders", value: false, category: "business" },
    // Data Settings
    { key: "data.backupFrequency", value: "weekly", category: "data" },
    { key: "data.retention", value: 365, category: "data" },
    { key: "data.exportFormat", value: "csv", category: "data" },
    { key: "data.autoBackup", value: true, category: "data" },
];
class SettingsService {
    /**
     * Get all settings from database
     */
    async getAllSettings() {
        try {
            return await db_1.db.getAllSettings();
        }
        catch (error) {
            console.error("Error fetching all settings:", error);
            throw new Error("Failed to fetch settings");
        }
    }
    /**
     * Get settings by category
     */
    async getSettingsByCategory(category) {
        try {
            return await db_1.db.getSettingsByCategory(category);
        }
        catch (error) {
            console.error(`Error fetching settings for category ${category}:`, error);
            throw new Error(`Failed to fetch settings for category ${category}`);
        }
    }
    /**
     * Get a single setting by key
     */
    async getSetting(key) {
        try {
            return await db_1.db.getSetting(key);
        }
        catch (error) {
            console.error(`Error fetching setting ${key}:`, error);
            throw new Error(`Failed to fetch setting ${key}`);
        }
    }
    /**
     * Update a single setting
     */
    async updateSetting(key, value, category, updatedBy = "system") {
        try {
            // Validate setting before updating
            this.validateSetting(key, value);
            return await db_1.db.updateSetting(key, value, category, updatedBy);
        }
        catch (error) {
            console.error(`Error updating setting ${key}:`, error);
            throw error;
        }
    }
    /**
     * Update multiple settings in bulk
     */
    async updateSettings(settings, updatedBy = "system") {
        try {
            // Validate all settings before updating
            for (const setting of settings) {
                this.validateSetting(setting.key, setting.value);
            }
            return await db_1.db.updateSettings(settings, updatedBy);
        }
        catch (error) {
            console.error("Error updating settings:", error);
            throw error;
        }
    }
    /**
     * Reset all settings to defaults
     */
    async resetToDefaults() {
        try {
            await db_1.db.deleteAllSettings();
            return await db_1.db.updateSettings(exports.DEFAULT_SETTINGS, "system");
        }
        catch (error) {
            console.error("Error resetting settings to defaults:", error);
            throw new Error("Failed to reset settings to defaults");
        }
    }
    /**
     * Initialize settings with defaults if not exists
     */
    async initializeDefaults() {
        try {
            const existingSettings = await this.getAllSettings();
            if (existingSettings.length === 0) {
                console.log("Initializing default settings...");
                await db_1.db.updateSettings(exports.DEFAULT_SETTINGS, "system");
                console.log("Default settings initialized successfully");
            }
        }
        catch (error) {
            console.error("Error initializing default settings:", error);
            throw error;
        }
    }
    /**
     * Export settings as JSON
     */
    async exportSettings() {
        try {
            const settings = await this.getAllSettings();
            return {
                settings,
                exportedAt: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error("Error exporting settings:", error);
            throw new Error("Failed to export settings");
        }
    }
    /**
     * Import settings from JSON
     */
    async importSettings(settingsData, updatedBy = "system") {
        try {
            const settingsToImport = settingsData.map((s) => ({
                key: s.key,
                value: s.value,
                category: s.category,
            }));
            // Validate all settings before importing
            for (const setting of settingsToImport) {
                this.validateSetting(setting.key, setting.value);
            }
            return await db_1.db.updateSettings(settingsToImport, updatedBy);
        }
        catch (error) {
            console.error("Error importing settings:", error);
            throw error;
        }
    }
    /**
     * Get settings as a flat object for easy access
     */
    async getSettingsObject() {
        try {
            const settings = await this.getAllSettings();
            const settingsObject = {};
            for (const setting of settings) {
                settingsObject[setting.key] = setting.value;
            }
            return settingsObject;
        }
        catch (error) {
            console.error("Error building settings object:", error);
            throw new Error("Failed to build settings object");
        }
    }
    /**
     * Validate a setting value
     */
    validateSetting(key, value) {
        // Currency validation
        if (key === "general.currency") {
            const validCurrencies = ["INR", "USD", "EUR", "AED"];
            if (!validCurrencies.includes(value)) {
                throw new Error(`Invalid currency: ${value}`);
            }
        }
        // Timezone validation (basic check)
        if (key === "general.timezone") {
            if (typeof value !== "string" || value.trim().length === 0) {
                throw new Error("Invalid timezone");
            }
        }
        // Date format validation
        if (key === "general.dateFormat") {
            const validFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
            if (!validFormats.includes(value)) {
                throw new Error(`Invalid date format: ${value}`);
            }
        }
        // Theme validation
        if (key === "appearance.theme") {
            const validThemes = ["light", "dark", "system"];
            if (!validThemes.includes(value)) {
                throw new Error(`Invalid theme: ${value}`);
            }
        }
        // Session timeout validation
        if (key === "security.sessionTimeout") {
            if (typeof value !== "number" || value < 5 || value > 1440) {
                throw new Error("Session timeout must be between 5 and 1440 minutes");
            }
        }
        // Password expiry validation
        if (key === "security.passwordExpiry") {
            if (typeof value !== "number" || value < 30 || value > 365) {
                throw new Error("Password expiry must be between 30 and 365 days");
            }
        }
        // Login attempts validation
        if (key === "security.loginAttempts") {
            if (typeof value !== "number" || value < 3 || value > 10) {
                throw new Error("Login attempts must be between 3 and 10");
            }
        }
        // Color validation
        if (key === "appearance.primaryColor") {
            const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (!hexColorRegex.test(value)) {
                throw new Error("Invalid color format. Use hex color (e.g., #3b82f6)");
            }
        }
        // Delivery fee validation
        if (key === "business.deliveryFee") {
            if (typeof value !== "number" || value < 0) {
                throw new Error("Delivery fee must be a positive number");
            }
        }
        // Minimum order amount validation
        if (key === "business.minimumOrderAmount") {
            if (typeof value !== "number" || value < 0) {
                throw new Error("Minimum order amount must be a positive number");
            }
        }
        // Advance payment percentage validation
        if (key === "business.advancePaymentPercentage") {
            if (typeof value !== "number" || value < 0 || value > 100) {
                throw new Error("Advance payment percentage must be between 0 and 100");
            }
        }
        // Working days validation
        if (key === "business.operatingHours.workingDays") {
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error("Working days must be a non-empty array");
            }
            const validDays = [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ];
            for (const day of value) {
                if (!validDays.includes(day)) {
                    throw new Error(`Invalid working day: ${day}`);
                }
            }
        }
    }
}
exports.settingsService = new SettingsService();
