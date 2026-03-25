import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-context';
import { useTheme } from '@/components/ui/theme-provider';

// --- Types: User Preferences ---
export type Theme = 'light' | 'dark' | 'system';
export type LandingPage = '/dashboard' | '/orders' | '/create-order' | '/customers'| '/services';

// Available quick actions for dashboard
export const AVAILABLE_QUICK_ACTIONS = [
  { id: 'new-order', label: 'New Order', icon: 'Plus' },
  { id: 'active-orders', label: 'Orders', icon: 'Receipt' },
  { id: 'customer-search', label: 'Customers', icon: 'Users' },
  { id: 'services', label: 'Services', icon: 'Settings' },
  { id: 'print-queue', label: 'Print Tags', icon: 'FileText' },
] as const;

export type QuickActionId = typeof AVAILABLE_QUICK_ACTIONS[number]['id'];

// User UI Preferences (stored in database)
export interface UserSettings {
  theme: Theme;
  landingPage: string;
  compactMode: boolean;
  quickActions: string[];
}

// --- Defaults ---
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  landingPage: '/dashboard',
  compactMode: false,
  quickActions: ['new-order', 'active-orders', 'customer-search', 'print-queue'],
};

// --- Context Type ---
interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'fabzclean_user_settings_v1';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { employee } = useAuth();
  const { setTheme: setProviderTheme } = useTheme();

  // Load from localStorage initially for immediate UI
  const [localSettings, setLocalSettings] = useState<UserSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Fetch settings from database
  const { data: dbSettings, isLoading, refetch } = useQuery({
    queryKey: ['user-settings', employee?.id],
    queryFn: async () => {
      const token = localStorage.getItem('employee_token');
      if (!token || !employee) return DEFAULT_SETTINGS;

      const res = await fetch('/api/settings/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      return data.success ? (data.settings as UserSettings) : DEFAULT_SETTINGS;
    },
    enabled: !!employee,
  });

  // Effective settings: prefer DB values if available
  const settings = useMemo(() => ({
    ...localSettings,
    ...(dbSettings || {})
  }), [localSettings, dbSettings]);

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Delegate theme application to ThemeProvider so it persists via fabzclean-theme key
  useEffect(() => {
    setProviderTheme(settings.theme as 'light' | 'dark' | 'system');
  }, [settings.theme, setProviderTheme]);

  // Apply Compact Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.compactMode) {
      root.classList.add('density-compact');
      root.style.setProperty('--radius', '0.25rem');
    } else {
      root.classList.remove('density-compact');
      root.style.removeProperty('--radius');
    }
  }, [settings.compactMode]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      const token = localStorage.getItem('employee_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/settings/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update settings');
      }

      return res.json();
    },
    onMutate: async (newSettings) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['user-settings', employee?.id] });
      const previousSettings = queryClient.getQueryData(['user-settings', employee?.id]);
      
      queryClient.setQueryData(['user-settings', employee?.id], (old: any) => ({
        ...old,
        ...newSettings
      }));

      // Also update local state for zero-latency feel
      setLocalSettings(prev => ({ ...prev, ...newSettings }));

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      queryClient.setQueryData(['user-settings', employee?.id], context?.previousSettings);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', employee?.id] });
    },
  });

  const updateSetting = useCallback(async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    await updateMutation.mutateAsync({ [key]: value });
  }, [updateMutation]);

  const refreshSettings = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      isLoading,
      refreshSettings,
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
