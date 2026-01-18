import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  tableName: string;
  selectQuery?: string;
  filter?: string;
  orderBy?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseRealtimeReturn<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for Supabase realtime data fetching with optimistic updates
 * 
 * Algorithm:
 * 1. Fetch initial data on mount
 * 2. Subscribe to INSERT, UPDATE, DELETE events
 * 3. Merge changes optimistically (no re-fetch needed)
 * 4. Cleanup subscription on unmount
 * 
 * @param options - Configuration options
 * @returns { data, isLoading, error }
 */
export function useRealtime<T = any>(options: UseRealtimeOptions): UseRealtimeReturn<T> {
  const { tableName, selectQuery = '*', filter, orderBy, limit, enabled = true } = options;

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to track subscription channel
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      // Skip if disabled or Supabase is not configured
      if (!enabled || !isSupabaseConfigured) {
        if (isMounted) {
          setIsLoading(false);
          setData([]);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Build query
        let query = supabase.from(tableName).select(selectQuery);

        // Apply filters if provided
        if (filter) {
          // Filter format: "column.eq.value" or "column.gt.value"
          const [column, operator, value] = filter.split('.');
          if (column && operator && value) {
            switch (operator) {
              case 'eq':
                query = query.eq(column, value);
                break;
              case 'gt':
                query = query.gt(column, value);
                break;
              case 'lt':
                query = query.lt(column, value);
                break;
              case 'gte':
                query = query.gte(column, value);
                break;
              case 'lte':
                query = query.lte(column, value);
                break;
              case 'neq':
                query = query.neq(column, value);
                break;
              case 'like':
                query = query.like(column, value);
                break;
            }
          }
        }

        // Apply ordering if provided
        if (orderBy) {
          const [column, direction = 'asc'] = orderBy.split('.');
          query = query.order(column, { ascending: direction === 'asc' });
        }

        // Apply limit if provided
        if (limit) {
          query = query.limit(limit);
        }

        const { data: fetchedData, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        // ✅ Safety: Always ensure data is an array
        const safeData = Array.isArray(fetchedData) ? fetchedData : [];

        if (isMounted) {
          setData(safeData);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch data'));
          setData([]); // ✅ Safety: Set empty array on error
          setIsLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [tableName, selectQuery, filter, orderBy, limit, enabled]);

  // Set up realtime subscription
  useEffect(() => {
    // Skip if disabled or Supabase is not configured
    if (!enabled || !isSupabaseConfigured) return;

    // Clean up previous subscription if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for this table
    const channel = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          console.log('Realtime event received:', payload.eventType, payload);

          // ✅ Merge Algorithm: Update local state optimistically
          setData((currentData) => {
            const current = Array.isArray(currentData) ? currentData : [];

            switch (payload.eventType) {
              case 'INSERT': {
                // New item: Add to the end of the array
                const newItem = payload.new as T;
                return [...current, newItem];
              }

              case 'UPDATE': {
                // Updated item: Replace the item with matching ID
                const updatedItem = payload.new as T;
                const itemId = (updatedItem as any)?.id;

                if (!itemId) {
                  console.warn('Updated item missing ID, skipping merge');
                  return current;
                }

                return current.map((item) => {
                  const currentId = (item as any)?.id;
                  return currentId === itemId ? updatedItem : item;
                });
              }

              case 'DELETE': {
                // Deleted item: Remove from array
                const deletedItem = payload.old as T;
                const itemId = (deletedItem as any)?.id;

                if (!itemId) {
                  console.warn('Deleted item missing ID, skipping filter');
                  return current;
                }

                return current.filter((item) => {
                  const currentId = (item as any)?.id;
                  return currentId !== itemId;
                });
              }

              default:
                return current;
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${tableName} realtime changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to ${tableName} realtime changes`);
        }
      });

    channelRef.current = channel;

    // Cleanup: Unsubscribe when component unmounts
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log(`🔌 Unsubscribed from ${tableName} realtime changes`);
      }
    };
  }, [tableName, enabled]);

  // ✅ Safety: Always return an array, never null or undefined
  return {
    data: Array.isArray(data) ? data : [],
    isLoading,
    error,
  };
}

