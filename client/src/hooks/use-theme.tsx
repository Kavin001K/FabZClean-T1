import { useSettings } from "@/contexts/settings-context";

export function useTheme() {
    const { settings, updateSetting } = useSettings();

    return {
        theme: settings.theme,
        setTheme: (theme: 'light' | 'dark' | 'system') => updateSetting('theme', theme),
    };
}
