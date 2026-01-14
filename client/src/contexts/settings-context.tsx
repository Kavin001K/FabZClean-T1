import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// --- Types: Local Preferences ---
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

// Local UI Preferences (stored in localStorage)
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

// --- Types: Business Rules (stored in database) ---
export interface BusinessRules {
  taxRate: number;           // e.g., 18.00 for 18% GST
  currencySymbol: string;    // e.g., "₹"
  minimumOrderValue: number; // Minimum order amount required
  defaultTurnaroundHours: number;  // Default processing time
  expressSurchargePercent: number; // Extra charge for express orders
  enableStockAlerts: boolean;
  lowStockThreshold: number;
  receiptHeader: string;
  receiptFooter: string;
}

// --- Defaults ---
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  density: 'comfortable',
  currency: 'INR',
  dateFormat: 'dd/MM/yyyy',
  defaultPrinterType: 'thermal',
  autoPrintInvoice: false,
  showPrintPreview: true,
  shopAddress: '',
  shopPhone: '',
  enableWhatsApp: true,
  enableEmailNotifications: false,
  soundEnabled: true,
  offlineMode: false,
  debugMode: false,
  autoSubmitOnScan: false,
  defaultLandingPage: '/dashboard',
  quickActionSlots: ['new-order', 'scan-qr', 'customer-search'],
  lowDataMode: false,
  reduceMotion: false,
  hapticFeedback: true,
};

const DEFAULT_BUSINESS_RULES: BusinessRules = {
  taxRate: 0,
  currencySymbol: '₹',
  minimumOrderValue: 0,
  defaultTurnaroundHours: 48,
  expressSurchargePercent: 50,
  enableStockAlerts: true,
  lowStockThreshold: 10,
  receiptHeader: 'FabZClean Laundry',
  receiptFooter: 'Thank you for choosing us!',
};

// --- Context Type ---
interface SettingsContextType {
  // Local Preferences
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  toggleQuickAction: (actionId: QuickActionId) => void;

  // Business Rules (from server)
  businessRules: BusinessRules;
  isLoadingBusinessRules: boolean;
  updateBusinessRules: (rules: Partial<BusinessRules>) => Promise<void>;
  isUpdatingBusinessRules: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'fabzclean_settings_v2';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ========== LOCAL PREFERENCES ==========
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

  // Persist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[Settings] Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // Deep Integration: Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }

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

  // Deep Integration: Apply Density
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

  // Deep Integration: Apply Low Data Mode
  useEffect(() => {
    const body = window.document.body;
    if (settings.lowDataMode) {
      body.classList.add('low-data-mode');
    } else {
      body.classList.remove('low-data-mode');
    }
  }, [settings.lowDataMode]);

  // Deep Integration: Apply Reduce Motion
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

  const toggleQuickAction = useCallback((actionId: QuickActionId) => {
    setSettings((prev) => {
      const currentSlots = prev.quickActionSlots;
      if (currentSlots.includes(actionId)) {
        return { ...prev, quickActionSlots: currentSlots.filter(id => id !== actionId) };
      } else if (currentSlots.length < 4) {
        return { ...prev, quickActionSlots: [...currentSlots, actionId] };
      }
      return prev;
    });
  }, []);

  // ========== BUSINESS RULES (SERVER) ==========
  const { data: serverBusinessRules, isLoading: isLoadingBusinessRules } = useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => {
      const token = localStorage.getItem('employee_token');
      if (!token) return DEFAULT_BUSINESS_RULES;

      try {
        const res = await fetch('/api/business-settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          console.warn('[BusinessSettings] Failed to fetch, using defaults');
          return DEFAULT_BUSINESS_RULES;
        }

        const data = await res.json();
        if (data.success && data.settings) {
          return data.settings as BusinessRules;
        }
        return DEFAULT_BUSINESS_RULES;
      } catch (error) {
        console.error('[BusinessSettings] Fetch error:', error);
        return DEFAULT_BUSINESS_RULES;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: async (newRules: Partial<BusinessRules>) => {
      const token = localStorage.getItem('employee_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/business-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRules),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update business settings');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast({
        title: "Settings Saved",
        description: "Business rules updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save settings.",
      });
    },
  });

  const updateBusinessRules = useCallback(async (rules: Partial<BusinessRules>) => {
    await updateMutation.mutateAsync(rules);
  }, [updateMutation]);

  return (
    <SettingsContext.Provider value={{
      // Local preferences
      settings,
      updateSetting,
      resetSettings,
      toggleQuickAction,
      // Business rules
      businessRules: serverBusinessRules || DEFAULT_BUSINESS_RULES,
      isLoadingBusinessRules,
      updateBusinessRules,
      isUpdatingBusinessRules: updateMutation.isPending,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

// Convenience hook for just business rules
export const useBusinessRules = () => {
  const { businessRules, isLoadingBusinessRules, updateBusinessRules, isUpdatingBusinessRules } = useSettings();
  return { businessRules, isLoading: isLoadingBusinessRules, updateBusinessRules, isUpdating: isUpdatingBusinessRules };
};
