/**
 * Offline configuration for React Query
 * Ensures app works seamlessly without internet connection
 */

import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Create an offline-first query client
 */
export function createOfflineQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 24 hours
        gcTime: 1000 * 60 * 60 * 24,

        // Keep data fresh for 5 minutes
        staleTime: 1000 * 60 * 5,

        // Retry failed queries (important for offline recovery)
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Enable network mode for offline support
        networkMode: 'offlineFirst',

        // Refetch on window focus when back online
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        // Queue mutations when offline
        networkMode: 'offlineFirst',

        // Retry failed mutations
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
}

/**
 * Setup query persistence to localStorage
 */
export function setupQueryPersistence(queryClient: QueryClient) {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
  });

  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    buster: 'v1', // Increment to invalidate all cached data
  });
}

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Online/Offline event listeners
 */
export function setupOnlineListeners(callbacks: {
  onOnline?: () => void;
  onOffline?: () => void;
}) {
  const handleOnline = () => {
    console.log('App is now online');
    if (callbacks.onOnline) callbacks.onOnline();
  };

  const handleOffline = () => {
    console.log('App is now offline');
    if (callbacks.onOffline) callbacks.onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Offline-aware fetch wrapper
 */
export async function offlineFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // If offline, try to return cached data
    if (!isOnline()) {
      console.warn('Offline: Could not fetch', url);
      throw new Error('You are currently offline. This action will be retried when you reconnect.');
    }
    throw error;
  }
}

/**
 * Local storage with fallback
 */
export const offlineStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

/**
 * Queue for offline mutations
 */
interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
}

export class OfflineMutationQueue {
  private queue: QueuedMutation[] = [];
  private storageKey = 'offline_mutation_queue';

  constructor() {
    this.loadQueue();
  }

  /**
   * Add mutation to queue
   */
  add(url: string, method: string, body: any): string {
    const mutation: QueuedMutation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url,
      method,
      body,
      timestamp: Date.now(),
    };

    this.queue.push(mutation);
    this.saveQueue();
    return mutation.id;
  }

  /**
   * Process all queued mutations
   */
  async processQueue(): Promise<void> {
    if (!isOnline() || this.queue.length === 0) {
      return;
    }

    console.log(`Processing ${this.queue.length} queued mutations...`);

    const mutations = [...this.queue];
    this.queue = [];

    for (const mutation of mutations) {
      try {
        await fetch(mutation.url, {
          method: mutation.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation.body),
        });
        console.log(`Processed queued mutation: ${mutation.id}`);
      } catch (error) {
        console.error(`Failed to process mutation ${mutation.id}:`, error);
        // Re-queue failed mutations
        this.queue.push(mutation);
      }
    }

    this.saveQueue();
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  private loadQueue(): void {
    const stored = offlineStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.queue = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading mutation queue:', error);
        this.queue = [];
      }
    }
  }

  private saveQueue(): void {
    offlineStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }
}

/**
 * Global mutation queue instance
 */
export const mutationQueue = new OfflineMutationQueue();

/**
 * Setup automatic queue processing when back online
 */
export function setupOfflineSync() {
  setupOnlineListeners({
    onOnline: () => {
      console.log('Back online - processing queued mutations...');
      mutationQueue.processQueue();
    },
  });

  // Process queue on app start if online
  if (isOnline()) {
    mutationQueue.processQueue();
  }
}
