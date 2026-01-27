import { db } from "../db";

export interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  updatedAt: Date | null;
  updatedBy: string | null;
}

export interface SettingsUpdate {
  key: string;
  value: any;
  category: string;
}

// Default settings to seed the database
export const DEFAULT_SETTINGS: SettingsUpdate[] = [
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

  // Surveillance & Logging Settings
  { key: "security.strictMode", value: true, category: "security" }, // Enforce RLS strictly
  { key: "logs.trackReadOperations", value: true, category: "logging" }, // Track who VIEWED data
  { key: "logs.retentionDays", value: 365, category: "logging" }, // How long to keep logs
  { key: "logs.trackAPIRequests", value: true, category: "logging" }, // Log all API requests
  { key: "logs.trackSensitiveOperations", value: true, category: "logging" }, // Extra logging for financials

  // Maintenance Settings
  { key: "maintenance.autoVacuum", value: true, category: "system" },
  { key: "maintenance.autoBackup", value: true, category: "system" },
  { key: "maintenance.backupRetentionCount", value: 30, category: "system" },
  { key: "maintenance.scheduleTime", value: "03:00", category: "system" },
];

class SettingsService {
  /**
   * Get all settings from database
   */
  async getAllSettings(): Promise<Setting[]> {
    try {
      return await db.getAllSettings();
    } catch (error) {
      console.error("Error fetching all settings:", error);
      throw new Error("Failed to fetch settings");
    }
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: string): Promise<Setting[]> {
    try {
      return await db.getSettingsByCategory(category);
    } catch (error) {
      console.error(`Error fetching settings for category ${category}:`, error);
      throw new Error(`Failed to fetch settings for category ${category}`);
    }
  }

  /**
   * Get a single setting by key
   */
  async getSetting(key: string): Promise<Setting | null> {
    try {
      return await db.getSetting(key);
    } catch (error) {
      console.error(`Error fetching setting ${key}:`, error);
      throw new Error(`Failed to fetch setting ${key}`);
    }
  }

  /**
   * Update a single setting
   */
  async updateSetting(
    key: string,
    value: any,
    category: string,
    updatedBy = "system"
  ): Promise<Setting> {
    try {
      // Validate setting before updating
      this.validateSetting(key, value);

      return await db.updateSetting(key, value, category, updatedBy);
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Update multiple settings in bulk
   */
  async updateSettings(
    settings: SettingsUpdate[],
    updatedBy = "system"
  ): Promise<Setting[]> {
    try {
      // Validate all settings before updating
      for (const setting of settings) {
        this.validateSetting(setting.key, setting.value);
      }

      return await db.updateSettings(settings, updatedBy);
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<Setting[]> {
    try {
      await db.deleteAllSettings();
      return await db.updateSettings(DEFAULT_SETTINGS, "system");
    } catch (error) {
      console.error("Error resetting settings to defaults:", error);
      throw new Error("Failed to reset settings to defaults");
    }
  }

  /**
   * Initialize settings with defaults if not exists
   */
  async initializeDefaults(): Promise<void> {
    try {
      const existingSettings = await this.getAllSettings();

      if (existingSettings.length === 0) {
await db.updateSettings(DEFAULT_SETTINGS, "system");
}
    } catch (error) {
      console.error("Error initializing default settings:", error);
      throw error;
    }
  }

  /**
   * Export settings as JSON
   */
  async exportSettings(): Promise<{ settings: Setting[]; exportedAt: string }> {
    try {
      const settings = await this.getAllSettings();
      return {
        settings,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error exporting settings:", error);
      throw new Error("Failed to export settings");
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(
    settingsData: Setting[],
    updatedBy = "system"
  ): Promise<Setting[]> {
    try {
      const settingsToImport: SettingsUpdate[] = settingsData.map((s) => ({
        key: s.key,
        value: s.value,
        category: s.category,
      }));

      // Validate all settings before importing
      for (const setting of settingsToImport) {
        this.validateSetting(setting.key, setting.value);
      }

      return await db.updateSettings(settingsToImport, updatedBy);
    } catch (error) {
      console.error("Error importing settings:", error);
      throw error;
    }
  }

  /**
   * Get settings as a flat object for easy access
   */
  async getSettingsObject(): Promise<Record<string, any>> {
    try {
      const settings = await this.getAllSettings();
      const settingsObject: Record<string, any> = {};

      for (const setting of settings) {
        settingsObject[setting.key] = setting.value;
      }

      return settingsObject;
    } catch (error) {
      console.error("Error building settings object:", error);
      throw new Error("Failed to build settings object");
    }
  }

  /**
   * Validate a setting value
   */
  private validateSetting(key: string, value: any): void {
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

export const settingsService = new SettingsService();
