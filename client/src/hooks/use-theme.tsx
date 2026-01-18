import { useSettings } from "@/contexts/settings-context";

/**
 * Hook for theme management with easy access to theme state and setter
 * Also exposes performance-related settings for components to conditionally render
 */
export function useTheme() {
    const { settings, updateSetting } = useSettings();

    return {
        // Theme controls
        theme: settings.theme,
        setTheme: (theme: 'light' | 'dark' | 'system') => updateSetting('theme', theme),

        // Performance flags for conditional rendering
        isLowDataMode: settings.lowDataMode,
        isReduceMotion: settings.reduceMotion,

        // Density
        density: settings.density,
        isCompact: settings.density === 'compact',
    };
}

/**
 * Export individual hooks for specific use cases
 */
export function usePerformanceSettings() {
    const { settings } = useSettings();

    return {
        lowDataMode: settings.lowDataMode,
        reduceMotion: settings.reduceMotion,
        offlineMode: settings.offlineMode,
    };
}

export function useWorkflowSettings() {
    const { settings } = useSettings();

    return {
        autoSubmitOnScan: settings.autoSubmitOnScan,
        defaultLandingPage: settings.defaultLandingPage,
        quickActionSlots: settings.quickActionSlots,
    };
}
