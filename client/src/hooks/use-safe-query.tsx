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
    onError: (error: Error) => {
      console.error('Query error:', error);
      setError(error);
      setHasError(true);
    },
    onSuccess: () => {
      setHasError(false);
      setError(null);
    },
  });

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
