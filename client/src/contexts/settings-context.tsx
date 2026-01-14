import React, { createContext, useContext, useEffect, useState } from 'react';

// --- Types ---
export type Theme = 'light' | 'dark' | 'system';
export type Density = 'compact' | 'comfortable';
export type PrinterType = 'thermal' | 'a4';

export interface AppSettings {
  // Appearance
  theme: Theme;
  density: Density;

  // Localization
  currency: string;
  dateFormat: string;

  // Printing
  defaultPrinterType: PrinterType;
  autoPrintInvoice: boolean;
  showPrintPreview: boolean;
  shopAddress: string; // Stored locally for offline printing
  shopPhone: string;

  // Notifications
  enableWhatsApp: boolean;
  enableEmailNotifications: boolean;
  soundEnabled: boolean;

  // System
  offlineMode: boolean;
  debugMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  density: 'comfortable',
  currency: 'INR',
  dateFormat: 'dd/MM/yyyy',
  defaultPrinterType: 'thermal',
  autoPrintInvoice: false,
  showPrintPreview: true,
  shopAddress: '123 Laundry St',
  shopPhone: '9876543210',
  enableWhatsApp: true,
  enableEmailNotifications: false,
  soundEnabled: true,
  offlineMode: false,
  debugMode: false,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'fabzclean_settings_v1';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // 1. Initialize from LocalStorage or Defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('Failed to load settings', e);
      return DEFAULT_SETTINGS;
    }
  });

  // 2. Persist to LocalStorage on Change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }, [settings]);

  // 3. Deep Integration: Apply Theme Immediately
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  // 4. Deep Integration: Apply Density
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.density === 'compact') {
      root.classList.add('density-compact');
      root.style.setProperty('--radius', '0.25rem');
    } else {
      root.classList.remove('density-compact');
      root.style.removeProperty('--radius');
    }
  }, [settings.density]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
