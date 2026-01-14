import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// --- Types ---
export type Theme = 'light' | 'dark' | 'system';
export type Density = 'compact' | 'comfortable';
export type PrinterType = 'thermal' | 'a4';
export type LandingPage = '/dashboard' | '/orders' | '/create-order' | '/transit-orders';

// Available quick actions for dashboard
export const AVAILABLE_QUICK_ACTIONS = [
  { id: 'new-order', label: 'New Order', icon: 'Plus' },
  { id: 'scan-qr', label: 'Scan QR', icon: 'ScanLine' },
  { id: 'customer-search', label: 'Find Customer', icon: 'Search' },
  { id: 'transit', label: 'Transit', icon: 'Truck' },
  { id: 'transit-batch', label: 'Transit Batch', icon: 'Truck' },
  { id: 'expenses', label: 'Expenses', icon: 'Calculator' },
  { id: 'add-expense', label: 'Add Expense', icon: 'Receipt' },
  { id: 'staff', label: 'Staff', icon: 'Users' },
  { id: 'daily-report', label: 'Daily Report', icon: 'FileText' },
] as const;

export type QuickActionId = typeof AVAILABLE_QUICK_ACTIONS[number]['id'];

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
  shopAddress: string;
  shopPhone: string;

  // Notifications
  enableWhatsApp: boolean;
  enableEmailNotifications: boolean;
  soundEnabled: boolean;

  // System
  offlineMode: boolean;
  debugMode: boolean;

  // === POWER USER FEATURES ===

  // Workflow Automation
  autoSubmitOnScan: boolean;
  defaultLandingPage: LandingPage;
  quickActionSlots: QuickActionId[];

  // Performance
  lowDataMode: boolean;
  reduceMotion: boolean;

  // Feedback
  hapticFeedback: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  // Appearance
  theme: 'system',
  density: 'comfortable',

  // Localization
  currency: 'INR',
  dateFormat: 'dd/MM/yyyy',

  // Printing
  defaultPrinterType: 'thermal',
  autoPrintInvoice: false,
  showPrintPreview: true,
  shopAddress: '',
  shopPhone: '',

  // Notifications
  enableWhatsApp: true,
  enableEmailNotifications: false,
  soundEnabled: true,

  // System
  offlineMode: false,
  debugMode: false,

  // Workflow
  autoSubmitOnScan: false,
  defaultLandingPage: '/dashboard',
  quickActionSlots: ['new-order', 'scan-qr', 'customer-search'],

  // Performance
  lowDataMode: false,
  reduceMotion: false,

  // Feedback
  hapticFeedback: true,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  toggleQuickAction: (actionId: QuickActionId) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'fabzclean_settings_v2';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // 1. Initialize from LocalStorage or Defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('[Settings] Failed to load settings from localStorage', e);
      return DEFAULT_SETTINGS;
    }
  });

  // 2. Persist to LocalStorage on Change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[Settings] Failed to save settings to localStorage', e);
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

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
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

  // 5. Deep Integration: Apply Low Data Mode
  useEffect(() => {
    const body = window.document.body;
    if (settings.lowDataMode) {
      body.classList.add('low-data-mode');
    } else {
      body.classList.remove('low-data-mode');
    }
  }, [settings.lowDataMode]);

  // 6. Deep Integration: Apply Reduce Motion
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
      root.style.setProperty('--transition-duration', '0ms');
    } else {
      root.classList.remove('reduce-motion');
      root.style.removeProperty('--transition-duration');
    }
  }, [settings.reduceMotion]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Toggle a quick action in/out of the slots (max 4)
  const toggleQuickAction = useCallback((actionId: QuickActionId) => {
    setSettings((prev) => {
      const currentSlots = prev.quickActionSlots;
      if (currentSlots.includes(actionId)) {
        // Remove it
        return { ...prev, quickActionSlots: currentSlots.filter(id => id !== actionId) };
      } else if (currentSlots.length < 4) {
        // Add it (max 4)
        return { ...prev, quickActionSlots: [...currentSlots, actionId] };
      }
      // Already at max, don't add
      return prev;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, toggleQuickAction }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
