import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface SafeQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  refetch: () => void;
}

export function useSafeQuery<T>(
  options: UseQueryOptions<T>,
  fallbackData?: T
): SafeQueryResult<T> {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const query = useQuery({
    ...options,
    retry: false, // Disable retry to prevent infinite loops
  });

  // Handle error state changes via useEffect instead of onError/onSuccess callbacks
  // (removed in React Query v5)
  useEffect(() => {
    if (query.isError && query.error) {
      console.error('Query error:', query.error);
      setError(query.error);
      setHasError(true);
    } else if (query.isSuccess) {
      setHasError(false);
      setError(null);
    }
  }, [query.isError, query.isSuccess, query.error]);

  // Use fallback data if query fails
  const safeData = hasError && fallbackData ? fallbackData : query.data;

  return {
    data: safeData,
    isLoading: query.isLoading,
    error: error || query.error,
    isError: hasError || query.isError,
    refetch: query.refetch,
  };
}
