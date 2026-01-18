/**
 * Update Prompt Component
 * 
 * Shows a subtle notification when a new app version is available,
 * prompting users to refresh for the latest version.
 */

import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useAppVersion } from '@/hooks/use-app-version';
import { Button } from '@/components/ui/button';

export function UpdatePrompt() {
    const { hasNewVersion, refreshApp, dismissUpdate } = useAppVersion();

    if (!hasNewVersion) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-lime-500 to-green-500 text-white rounded-lg shadow-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-full">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">Update Available</h4>
                        <p className="text-xs text-white/90 mt-0.5">
                            A new version of FabClean is available. Refresh to get the latest features.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={refreshApp}
                                className="bg-white text-green-600 hover:bg-white/90 text-xs h-7 px-3"
                            >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Refresh Now
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={dismissUpdate}
                                className="text-white hover:bg-white/20 text-xs h-7 px-2"
                            >
                                Later
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={dismissUpdate}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
