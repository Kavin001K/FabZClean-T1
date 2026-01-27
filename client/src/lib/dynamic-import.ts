/**
 * Dynamic Import with Retry and Version Management
 * 
 * This module handles chunk loading failures that occur after deployments.
 * When a new version is deployed, old chunk files are replaced with new ones.
 * Users with cached old versions may fail to load dynamically imported modules.
 * 
 * Solution:
 * 1. Retry the import once
 * 2. If it still fails, refresh the page to get the new version
 * 3. Prevent infinite refresh loops using sessionStorage
 */

const REFRESH_KEY = 'fabzclean_chunk_refresh';
const REFRESH_TIMESTAMP_KEY = 'fabzclean_chunk_refresh_timestamp';
const REFRESH_COOLDOWN_MS = 30000; // 30 seconds cooldown between refreshes

/**
 * Checks if the error is a chunk loading error
 */
function isChunkLoadError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Common chunk loading error patterns
    const chunkErrorPatterns = [
        'failed to fetch dynamically imported module',
        'failed to load module script',
        'loading chunk',
        'loading css chunk',
        'dynamically imported module',
        'chunkloaderror',
        'error loading dynamically imported module',
        'unable to preload css',
        'failed to fetch',
        'network error',
    ];

    return chunkErrorPatterns.some(pattern =>
        errorMessage.includes(pattern) || errorName.includes(pattern)
    );
}

/**
 * Check if we should attempt a refresh
 */
function shouldRefresh(): boolean {
    try {
        const lastRefresh = sessionStorage.getItem(REFRESH_TIMESTAMP_KEY);
        const refreshCount = parseInt(sessionStorage.getItem(REFRESH_KEY) || '0', 10);

        // Don't refresh if we've already tried too many times
        if (refreshCount >= 2) {
            console.warn('[DynamicImport] Max refresh attempts reached');
            return false;
        }

        // Don't refresh if we refreshed recently
        if (lastRefresh) {
            const timeSinceLastRefresh = Date.now() - parseInt(lastRefresh, 10);
            if (timeSinceLastRefresh < REFRESH_COOLDOWN_MS) {
                console.warn('[DynamicImport] Refresh cooldown active');
                return false;
            }
        }

        return true;
    } catch {
        // sessionStorage might be unavailable
        return true;
    }
}

/**
 * Mark that we're about to refresh
 */
function markRefresh(): void {
    try {
        const currentCount = parseInt(sessionStorage.getItem(REFRESH_KEY) || '0', 10);
        sessionStorage.setItem(REFRESH_KEY, String(currentCount + 1));
        sessionStorage.setItem(REFRESH_TIMESTAMP_KEY, String(Date.now()));
    } catch {
        // sessionStorage might be unavailable
    }
}

/**
 * Clear refresh tracking (call after successful navigation)
 */
export function clearRefreshTracking(): void {
    try {
        sessionStorage.removeItem(REFRESH_KEY);
        sessionStorage.removeItem(REFRESH_TIMESTAMP_KEY);
    } catch {
        // sessionStorage might be unavailable
    }
}

/**
 * Handle chunk load error by attempting recovery
 */
export function handleChunkLoadError(error: unknown): void {
    if (!isChunkLoadError(error)) {
        throw error;
    }

    console.error('[DynamicImport] Chunk loading failed:', error);

    if (shouldRefresh()) {
markRefresh();

        // Force reload without cache
        window.location.reload();
    } else {
        console.error('[DynamicImport] Cannot recover from chunk loading error');
        throw error;
    }
}

/**
 * Wrapper for dynamic imports with retry and refresh logic
 * 
 * Usage:
 * const Component = lazy(() => retryDynamicImport(() => import('./Component')));
 */
export function retryDynamicImport<T>(
    importFn: () => Promise<T>,
    retries = 1
): Promise<T> {
    return new Promise((resolve, reject) => {
        importFn()
            .then((module) => {
                // Success - clear any refresh tracking
                clearRefreshTracking();
                resolve(module);
            })
            .catch((error) => {
                if (retries > 0 && isChunkLoadError(error)) {
                    console.warn(`[DynamicImport] Retrying import, ${retries} attempts left`);

                    // Wait a bit before retrying
                    setTimeout(() => {
                        retryDynamicImport(importFn, retries - 1)
                            .then(resolve)
                            .catch(reject);
                    }, 500);
                } else if (isChunkLoadError(error)) {
                    // All retries exhausted, try to refresh
                    handleChunkLoadError(error);
                    reject(error);
                } else {
                    reject(error);
                }
            });
    });
}

/**
 * Create a lazy component with automatic retry
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
    // We need to import React dynamically to avoid circular dependencies
    const { lazy } = require('react');
    return lazy(() => retryDynamicImport(importFn));
}

// Export the check function for use in error boundaries
export { isChunkLoadError };
