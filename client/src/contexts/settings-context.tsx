import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase, isSupabaseConfigured } from '../lib/supabase-auth';

export interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  updatedAt: Date | null;
  updatedBy: string | null;
}

export interface SettingsContextType {
  settings: Record<string, any>;
  isLoading: boolean;
  error: Error | null;
  getSetting: (key: string, defaultValue?: any) => any;
  updateSetting: (key: string, value: any, category: string) => Promise<void>;
  updateSettings: (settings: Array<{ key: string, value: any, category: string }>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => void;
  importSettings: (file: File) => Promise<void>;
  refetchSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Default settings to use when database is not available
const DEFAULT_SETTINGS: Record<string, any> = {
  company_name: 'FabZClean',
  company_logo: '/assets/logo.webp',
  currency: 'INR',
  currency_symbol: '₹',
  tax_rate: 18,
  timezone: 'Asia/Kolkata',
  date_format: 'DD/MM/YYYY',
  time_format: 'hh:mm A',
  business_hours_start: '09:00',
  business_hours_end: '21:00',
  enable_notifications: true,
  enable_whatsapp: true,
  theme: 'light',
};

// Check if we should use direct Supabase
const useDirectSupabase = (): boolean => {
  if (typeof window === 'undefined') return false;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    return false;
  }

  if (import.meta.env.PROD && isSupabaseConfigured) {
    return true;
  }

  return false;
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingsObject, setSettingsObject] = useState<Record<string, any>>(DEFAULT_SETTINGS);
  const directSupabase = useDirectSupabase();

  // Fetch all settings
  const { data: settingsData, isLoading, error, refetch } = useQuery<Setting[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      if (directSupabase && isSupabaseConfigured) {
        // Use direct Supabase query
        const { data, error } = await supabase
          .from('settings')
          .select('*');

        if (error) {
          console.warn('Failed to fetch settings from Supabase:', error.message);
          // Return empty array, we'll use defaults
          return [];
        }

        return (data || []).map(item => ({
          id: item.id,
          key: item.key,
          value: item.value,
          category: item.category || 'general',
          updatedAt: item.updated_at ? new Date(item.updated_at) : null,
          updatedBy: item.updated_by || null,
        }));
      }

      // Use backend API
      const token = localStorage.getItem('employee_token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(`${apiBase}/settings`, { headers });
        if (!response.ok) {
          console.warn('Failed to fetch settings from API, using defaults');
          return [];
        }
        return response.json();
      } catch (err) {
        console.warn('Settings API error, using defaults:', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: 'always',
    retry: 1, // Only retry once
  });

  // Convert settings array to object, merging with defaults
  useEffect(() => {
    const obj: Record<string, any> = { ...DEFAULT_SETTINGS };
    if (settingsData && settingsData.length > 0) {
      settingsData.forEach(setting => {
        obj[setting.key] = setting.value;
      });
    }
    setSettingsObject(obj);
  }, [settingsData]);

  // Get a single setting value
  const getSetting = useCallback((key: string, defaultValue?: any) => {
    return settingsObject[key] ?? defaultValue ?? DEFAULT_SETTINGS[key];
  }, [settingsObject]);

  // Update single setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, category }: { key: string, value: any, category: string }) => {
      if (directSupabase && isSupabaseConfigured) {
        // Use direct Supabase upsert
        const { data, error } = await supabase
          .from('settings')
          .upsert({
            key,
            value,
            category,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }

      // Use backend API
      const token = localStorage.getItem('employee_token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBase}/settings/${key}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ value, category }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update setting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Setting Updated",
        description: "Your setting has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Array<{ key: string, value: any, category: string }>) => {
      if (directSupabase && isSupabaseConfigured) {
        // Use direct Supabase upsert for each setting
        const updates = settings.map(s => ({
          key: s.key,
          value: s.value,
          category: s.category,
          updated_at: new Date().toISOString(),
        }));

        const { data, error } = await supabase
          .from('settings')
          .upsert(updates, { onConflict: 'key' })
          .select();

        if (error) throw new Error(error.message);
        return data;
      }

      // Use backend API
      const token = localStorage.getItem('employee_token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBase}/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings Saved",
        description: "All your settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      if (directSupabase && isSupabaseConfigured) {
        // Delete all settings and insert defaults
        await supabase.from('settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const defaults = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
          key,
          value,
          category: 'general',
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('settings').insert(defaults);
        if (error) throw new Error(error.message);
        return { success: true };
      }

      // Use backend API
      const token = localStorage.getItem('employee_token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBase}/settings/reset`, {
        method: 'POST',
        headers,
      });
      if (!response.ok) throw new Error('Failed to reset settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to defaults.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import settings mutation
  const importSettingsMutation = useMutation({
    mutationFn: async (settings: Setting[]) => {
      if (directSupabase && isSupabaseConfigured) {
        const updates = settings.map(s => ({
          key: s.key,
          value: s.value,
          category: s.category,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('settings')
          .upsert(updates, { onConflict: 'key' });

        if (error) throw new Error(error.message);
        return { success: true };
      }

      // Use backend API
      const token = localStorage.getItem('employee_token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBase}/settings/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings Imported",
        description: "Settings have been imported successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update setting function
  const updateSetting = useCallback(async (key: string, value: any, category: string) => {
    await updateSettingMutation.mutateAsync({ key, value, category });
  }, [updateSettingMutation]);

  // Bulk update settings function
  const updateSettings = useCallback(async (settings: Array<{ key: string, value: any, category: string }>) => {
    await updateSettingsMutation.mutateAsync(settings);
  }, [updateSettingsMutation]);

  // Reset settings function
  const resetSettings = useCallback(async () => {
    await resetSettingsMutation.mutateAsync();
  }, [resetSettingsMutation]);

  // Export settings function
  const exportSettings = useCallback(async () => {
    try {
      const data = {
        settings: Object.entries(settingsObject).map(([key, value]) => ({
          key,
          value,
          category: 'general',
        })),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fabzclean_settings_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Settings Exported",
        description: "Your settings have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [toast, settingsObject]);

  // Import settings function
  const importSettings = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.settings || !Array.isArray(data.settings)) {
        throw new Error('Invalid settings file format');
      }

      await importSettingsMutation.mutateAsync(data.settings);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [importSettingsMutation, toast]);

  // Refetch settings
  const refetchSettings = useCallback(() => {
    refetch();
  }, [refetch]);

  const value: SettingsContextType = {
    settings: settingsObject,
    isLoading,
    error: error as Error | null,
    getSetting,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    refetchSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
