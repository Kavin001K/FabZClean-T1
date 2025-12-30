/**
 * App Version Management Hook
 * 
 * Detects when a new version of the app has been deployed
 * and prompts users to refresh for the latest version.
 */

import { useEffect, useState, useCallback } from 'react';

// Version is set during build time
const APP_VERSION = import.meta.env.VITE_APP_VERSION || Date.now().toString();
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const VERSION_STORAGE_KEY = 'fabzclean_app_version';

interface UseAppVersionResult {
    hasNewVersion: boolean;
    currentVersion: string;
    refreshApp: () => void;
    dismissUpdate: () => void;
}

export function useAppVersion(): UseAppVersionResult {
    const [hasNewVersion, setHasNewVersion] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const checkVersion = useCallback(async () => {
        try {
            // Try to fetch a version file or the index.html to detect changes
            const response = await fetch('/version.json?t=' + Date.now(), {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const serverVersion = data.version;
                const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

                if (storedVersion && storedVersion !== serverVersion) {
                    setHasNewVersion(true);
                }

                // Store current version
                localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
            }
        } catch {
            // Silently fail if version check fails
            // Fallback: try to detect by checking if current chunks are still valid
        }
    }, []);

    useEffect(() => {
        // Initial check
        checkVersion();

        // Periodic check
        const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

        // Check on focus (user returns to tab)
        const handleFocus = () => {
            checkVersion();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [checkVersion]);

    const refreshApp = useCallback(() => {
        // Clear service worker cache if available
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
        }

        // Force hard reload
        window.location.reload();
    }, []);

    const dismissUpdate = useCallback(() => {
        setDismissed(true);
    }, []);

    return {
        hasNewVersion: hasNewVersion && !dismissed,
        currentVersion: APP_VERSION,
        refreshApp,
        dismissUpdate,
    };
}
