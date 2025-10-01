import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
  updateSettings: (settings: Array<{key: string, value: any, category: string}>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => void;
  importSettings: (file: File) => Promise<void>;
  refetchSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingsObject, setSettingsObject] = useState<Record<string, any>>({});

  // Fetch all settings
  const { data: settingsData, isLoading, error, refetch } = useQuery<Setting[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: 'always'
  });

  // Convert settings array to object
  useEffect(() => {
    if (settingsData) {
      const obj: Record<string, any> = {};
      settingsData.forEach(setting => {
        obj[setting.key] = setting.value;
      });
      setSettingsObject(obj);
    }
  }, [settingsData]);

  // Get a single setting value
  const getSetting = useCallback((key: string, defaultValue?: any) => {
    return settingsObject[key] ?? defaultValue;
  }, [settingsObject]);

  // Update single setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, category }: { key: string, value: any, category: string }) => {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    mutationFn: async (settings: Array<{key: string, value: any, category: string}>) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
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
      const response = await fetch('/api/settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  const updateSettings = useCallback(async (settings: Array<{key: string, value: any, category: string}>) => {
    await updateSettingsMutation.mutateAsync(settings);
  }, [updateSettingsMutation]);

  // Reset settings function
  const resetSettings = useCallback(async () => {
    await resetSettingsMutation.mutateAsync();
  }, [resetSettingsMutation]);

  // Export settings function
  const exportSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/export/json');
      if (!response.ok) throw new Error('Failed to export settings');

      const data = await response.json();
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
  }, [toast]);

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
