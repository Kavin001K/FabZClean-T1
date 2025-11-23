import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchData } from '@/lib/data-service';
import { useRealtime as useRealtimeContext } from '@/contexts/realtime-context';

interface UseRealtimeOptions {
  tableName: string;
  selectQuery?: string;
  filter?: string;
  orderBy?: string;
  limit?: number;
}

interface UseRealtimeReturn<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for realtime data fetching using React Query and WebSocket context
 * Replaces the Supabase implementation with a custom backend solution
 */
export function useRealtime<T = any>(options: UseRealtimeOptions): UseRealtimeReturn<T> {
  const { tableName, filter, orderBy, limit } = options;
  const queryClient = useQueryClient();

  // Construct query parameters for the API
  const queryParams = new URLSearchParams();

  if (limit) {
    queryParams.append('limit', limit.toString());
  }

  if (orderBy) {
    const [column, direction = 'asc'] = orderBy.split('.');
    queryParams.append('sortBy', column);
    queryParams.append('sortOrder', direction);
  }

  // Handle basic filters if possible (backend support varies)
  if (filter) {
    // Simple parsing for common filters like "status.eq.pending"
    const [column, operator, value] = filter.split('.');
    if (operator === 'eq') {
      queryParams.append(column, value);
    }
  }

  // Use React Query to fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: [tableName, filter, orderBy, limit],
    queryFn: async () => {
      // Map table names to API endpoints
      const endpointMap: Record<string, string> = {
        orders: '/orders',
        customers: '/customers',
        services: '/services',
        products: '/products',
        employees: '/employees',
        drivers: '/drivers',
      };

      const endpoint = endpointMap[tableName] || `/${tableName}`;
      const queryString = queryParams.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const result = await fetchData<any>(url);

      // Handle paginated responses (some endpoints return { data: [...] })
      if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
        return result.data;
      }

      return Array.isArray(result) ? result : [];
    },
    staleTime: 60000, // 1 minute stale time (WebSocket will invalidate)
  });

  // Listen for realtime updates via context (optional, as context invalidates queries globally)
  // But we can use this to force a refetch if needed or handle optimistic updates locally
  // For now, relying on React Query's invalidation from RealtimeContext is sufficient.

  return {
    data: Array.isArray(data) ? data : [],
    isLoading,
    error: error as Error | null,
  };
}

