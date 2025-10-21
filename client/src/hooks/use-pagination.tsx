import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface PaginationOptions {
  pageSize?: number;
  maxVisiblePages?: number;
  enableCursorPagination?: boolean;
  enableVirtualScrolling?: boolean;
  virtualScrollThreshold?: number;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export interface CursorPaginationState {
  cursor?: string;
  hasMore: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: PaginationState;
  cursorPagination?: CursorPaginationState;
  isLoading: boolean;
  error?: Error;
}

/**
 * Client-side pagination hook
 */
export function useClientPagination<T>(
  data: T[],
  options: PaginationOptions = {}
) {
  const {
    pageSize = 10,
    maxVisiblePages = 5
  } = options;

  const [currentPage, setCurrentPage] = useState(1);

  const pagination = useMemo((): PaginationState => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex,
      endIndex
    };
  }, [data.length, currentPage, pageSize]);

  const paginatedData = useMemo(() => {
    return data.slice(pagination.startIndex, pagination.endIndex);
  }, [data, pagination.startIndex, pagination.endIndex]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(pagination.totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, pagination.totalPages, maxVisiblePages]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  }, [pagination.totalPages]);

  const goToNextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pagination.hasNextPage]);

  const goToPreviousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, pagination.hasPreviousPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(pagination.totalPages);
  }, [pagination.totalPages]);

  return {
    data: paginatedData,
    pagination,
    visiblePages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setCurrentPage
  };
}

/**
 * Server-side pagination hook
 */
export function useServerPagination<T>(
  endpoint: string,
  options: PaginationOptions & {
    enabled?: boolean;
    staleTime?: number;
    queryParams?: Record<string, any>;
  } = {}
) {
  const {
    pageSize = 10,
    enableCursorPagination = false,
    enabled = true,
    staleTime = 30000,
    queryParams = {}
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [cursor, setCursor] = useState<string | undefined>();

  const queryKey = ['pagination', endpoint, currentPage, pageSize, cursor, queryParams];

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...queryParams
      });

      if (enableCursorPagination && cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch paginated data');
      }

      return response.json();
    },
    enabled,
    staleTime,
    retry: 1
  });

  const pagination = useMemo((): PaginationState => {
    const totalItems = data?.total || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: data?.hasMore || currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex,
      endIndex
    };
  }, [data, currentPage, pageSize]);

  const cursorPagination = useMemo((): CursorPaginationState | undefined => {
    if (!enableCursorPagination) return undefined;

    return {
      cursor,
      hasMore: data?.hasMore || false,
      nextCursor: data?.nextCursor,
      previousCursor: data?.previousCursor
    };
  }, [enableCursorPagination, data, cursor]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
      setCursor(undefined); // Reset cursor when changing pages
    }
  }, [pagination.totalPages]);

  const goToNextPage = useCallback(() => {
    if (enableCursorPagination && cursorPagination?.hasMore) {
      setCursor(cursorPagination.nextCursor);
    } else if (pagination.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  }, [enableCursorPagination, cursorPagination, pagination.hasNextPage, currentPage]);

  const goToPreviousPage = useCallback(() => {
    if (enableCursorPagination && cursorPagination?.previousCursor) {
      setCursor(cursorPagination.previousCursor);
    } else if (pagination.hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  }, [enableCursorPagination, cursorPagination, pagination.hasPreviousPage, currentPage]);

  return {
    data: data?.data || [],
    pagination,
    cursorPagination,
    isLoading,
    error,
    refetch,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setCurrentPage,
    setCursor
  };
}

/**
 * Virtual scrolling hook for large datasets
 */
export function useVirtualScrolling<T>(
  data: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
    threshold?: number;
  }
) {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    threshold = 1000
  } = options;

  const [scrollTop, setScrollTop] = useState(0);

  const virtualData = useMemo(() => {
    if (data.length < threshold) {
      return {
        items: data,
        startIndex: 0,
        endIndex: data.length - 1,
        totalHeight: data.length * itemHeight
      };
    }

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      data.length - 1
    );

    const visibleStartIndex = Math.max(0, startIndex - overscan);
    const visibleEndIndex = Math.min(data.length - 1, endIndex + overscan);

    return {
      items: data.slice(visibleStartIndex, visibleEndIndex + 1),
      startIndex: visibleStartIndex,
      endIndex: visibleEndIndex,
      totalHeight: data.length * itemHeight,
      offsetY: visibleStartIndex * itemHeight
    };
  }, [data, scrollTop, itemHeight, containerHeight, overscan, threshold]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    ...virtualData,
    handleScroll,
    scrollTop
  };
}

/**
 * Infinite scroll hook
 */
export function useInfiniteScroll<T>(
  endpoint: string,
  options: {
    pageSize?: number;
    enabled?: boolean;
    staleTime?: number;
    queryParams?: Record<string, any>;
  } = {}
) {
  const {
    pageSize = 20,
    enabled = true,
    staleTime = 30000,
    queryParams = {}
  } = options;

  const [allData, setAllData] = useState<T[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['infinite-scroll', endpoint, queryParams],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        ...queryParams
      });

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      return response.json();
    },
    enabled: enabled && allData.length === 0,
    staleTime,
    retry: 1
  });

  // Initialize data
  React.useEffect(() => {
    if (data?.data && allData.length === 0) {
      setAllData(data.data);
      setHasNextPage(data.hasMore || false);
    }
  }, [data, allData.length]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        cursor: allData[allData.length - 1]?.id || '',
        ...queryParams
      });

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load more data');
      }

      const newData = await response.json();
      setAllData(prev => [...prev, ...newData.data]);
      setHasNextPage(newData.hasMore || false);
    } catch (error) {
      console.error('Failed to load more data:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasNextPage, isLoadingMore, allData, pageSize, endpoint, queryParams]);

  const reset = useCallback(() => {
    setAllData([]);
    setHasNextPage(true);
    setIsLoadingMore(false);
    refetch();
  }, [refetch]);

  return {
    data: allData,
    isLoading: isLoading && allData.length === 0,
    isLoadingMore,
    error,
    hasNextPage,
    loadMore,
    reset,
    refetch
  };
}

/**
 * Pagination utilities
 */
export const paginationUtils = {
  /**
   * Calculate page range for pagination component
   */
  calculatePageRange(currentPage: number, totalPages: number, maxVisible: number = 5) {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (end - start + 1 < maxVisible) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxVisible - 1);
      } else {
        start = Math.max(1, end - maxVisible + 1);
      }
    }

    return { start, end };
  },

  /**
   * Format pagination info text
   */
  formatPaginationInfo(pagination: PaginationState) {
    const { startIndex, endIndex, totalItems } = pagination;
    return `Showing ${startIndex + 1}-${endIndex} of ${totalItems} items`;
  },

  /**
   * Check if pagination should be shown
   */
  shouldShowPagination(totalItems: number, pageSize: number) {
    return totalItems > pageSize;
  }
};
