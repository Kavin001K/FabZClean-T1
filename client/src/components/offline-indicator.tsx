import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { isOnline, setupOnlineListeners, mutationQueue } from '@/lib/offline-config';
import { useQueryClient } from '@tanstack/react-query';

export function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [pendingMutations, setPendingMutations] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Update online status
    const cleanup = setupOnlineListeners({
      onOnline: () => {
        setOnline(true);
        setShowBanner(true);
        // Auto-hide banner after 5 seconds
        setTimeout(() => setShowBanner(false), 5000);

        // Refetch all queries when back online
        queryClient.invalidateQueries();
      },
      onOffline: () => {
        setOnline(false);
        setShowBanner(true);
      },
    });

    // Check mutation queue size
    const interval = setInterval(() => {
      setPendingMutations(mutationQueue.size());
    }, 1000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [queryClient]);

  // Show banner on initial offline state
  useEffect(() => {
    if (!online) {
      setShowBanner(true);
    }
  }, []);

  const handleSync = async () => {
    await mutationQueue.processQueue();
    queryClient.invalidateQueries();
  };

  return (
    <>
      {/* Status Badge (always visible) */}
      <div className="fixed bottom-4 right-4 z-50">
        <Badge
          variant={online ? 'default' : 'destructive'}
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowBanner(!showBanner)}
        >
          {online ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </>
          )}
          {pendingMutations > 0 && (
            <span className="ml-2 bg-white text-destructive rounded-full px-2 py-0.5 text-xs font-bold">
              {pendingMutations}
            </span>
          )}
        </Badge>
      </div>

      {/* Offline Banner */}
      {showBanner && !online && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex-1">
                <strong>You're offline</strong>
                <p className="text-sm mt-1">
                  Don't worry! You can continue working. Changes will sync when you're back online.
                  {pendingMutations > 0 && (
                    <span className="block mt-1 font-semibold">
                      {pendingMutations} change{pendingMutations > 1 ? 's' : ''} waiting to sync
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => setShowBanner(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Online Banner (temporary) */}
      {showBanner && online && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <Alert className="max-w-2xl mx-auto bg-green-50 border-green-200">
            <Wifi className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex-1 text-green-800">
                <strong>You're back online!</strong>
                <p className="text-sm mt-1">
                  {pendingMutations > 0
                    ? `Syncing ${pendingMutations} pending change${pendingMutations > 1 ? 's' : ''}...`
                    : 'All changes are synced.'}
                </p>
              </div>
              {pendingMutations > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={handleSync}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}

/**
 * Hook to check online status
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const cleanup = setupOnlineListeners({
      onOnline: () => setOnline(true),
      onOffline: () => setOnline(false),
    });

    return cleanup;
  }, []);

  return online;
}

/**
 * Hook to get pending mutations count
 */
export function usePendingMutations() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(mutationQueue.size());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return count;
}
