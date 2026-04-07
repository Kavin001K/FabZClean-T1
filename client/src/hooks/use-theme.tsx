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

        // Compatibility flags for legacy consumers
        isLowDataMode: false,
        isReduceMotion: false,

        // Density
        density: settings.compactMode ? 'compact' : 'comfortable',
        isCompact: settings.compactMode,
    };
}

/**
 * Export individual hooks for specific use cases
 */
export function usePerformanceSettings() {
    const { settings } = useSettings();

    return {
        lowDataMode: false,
        reduceMotion: false,
        offlineMode: false,
        compactMode: settings.compactMode,
    };
}

export function useWorkflowSettings() {
    const { settings } = useSettings();

    return {
        autoSubmitOnScan: false,
        defaultLandingPage: settings.landingPage,
        quickActionSlots: settings.quickActions,
    };
}
