import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PaginationState, CursorPaginationState } from '../../hooks/use-pagination';

export interface PaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  className?: string;
  maxVisiblePages?: number;
}

export interface CursorPaginationProps {
  cursorPagination: CursorPaginationState;
  onNextPage: () => void;
  onPreviousPage: () => void;
  className?: string;
}

export interface InfiniteScrollProps {
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  className?: string;
  loadingText?: string;
  loadMoreText?: string;
}

/**
 * Standard Pagination Component
 */
export function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showPageInfo = true,
  className = "",
  maxVisiblePages = 5
}: PaginationProps) {
  const { currentPage, totalPages, pageSize, totalItems, hasNextPage, hasPreviousPage } = pagination;

  const visiblePages = React.useMemo(() => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  const handlePageSizeChange = (newPageSize: string) => {
    onPageSizeChange?.(parseInt(newPageSize));
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
          className="hidden sm:flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                className="hidden sm:flex"
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <span className="px-2 text-gray-500">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )}
            </>
          )}

          {visiblePages.map(page => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}

          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-500">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="hidden sm:flex"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          className="hidden sm:flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page Size Selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Show:</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

/**
 * Cursor-based Pagination Component
 */
export function CursorPagination({
  cursorPagination,
  onNextPage,
  onPreviousPage,
  className = ""
}: CursorPaginationProps) {
  const { hasMore, cursor } = cursorPagination;

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Button
        variant="outline"
        onClick={onPreviousPage}
        disabled={!cursor}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>
      
      <Button
        variant="outline"
        onClick={onNextPage}
        disabled={!hasMore}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

/**
 * Infinite Scroll Component
 */
export function InfiniteScroll({
  hasNextPage,
  isLoadingMore,
  onLoadMore,
  className = "",
  loadingText = "Loading more...",
  loadMoreText = "Load More"
}: InfiniteScrollProps) {
  return (
    <div className={`text-center ${className}`}>
      {hasNextPage ? (
        <Button
          variant="outline"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="w-full"
        >
          {isLoadingMore ? loadingText : loadMoreText}
        </Button>
      ) : (
        <div className="text-sm text-gray-500 py-4">
          No more items to load
        </div>
      )}
    </div>
  );
}

/**
 * Virtual Scrolling Container Component
 */
export function VirtualScrollContainer({
  children,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = ""
}: {
  children: React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: containerHeight }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Pagination Info Component
 */
export function PaginationInfo({
  pagination,
  className = ""
}: {
  pagination: PaginationState;
  className?: string;
}) {
  const { currentPage, pageSize, totalItems, startIndex, endIndex } = pagination;

  return (
    <div className={`text-sm text-gray-500 ${className}`}>
      Showing {startIndex + 1} to {endIndex} of {totalItems} results
      {totalItems > 0 && (
        <span className="ml-2">
          (Page {currentPage} of {Math.ceil(totalItems / pageSize)})
        </span>
      )}
    </div>
  );
}

/**
 * Compact Pagination Component (for mobile)
 */
export function CompactPagination({
  pagination,
  onPageChange,
  className = ""
}: {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <span className="text-sm text-gray-500">
        {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

/**
 * Pagination with Jump to Page
 */
export function PaginationWithJump({
  pagination,
  onPageChange,
  className = ""
}: {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { currentPage, totalPages } = pagination;
  const [jumpPage, setJumpPage] = React.useState(currentPage.toString());

  React.useEffect(() => {
    setJumpPage(currentPage.toString());
  }, [currentPage]);

  const handleJump = () => {
    const page = parseInt(jumpPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJump();
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-500">Go to page:</span>
      <input
        type="number"
        min="1"
        max={totalPages}
        value={jumpPage}
        onChange={(e) => setJumpPage(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-16 px-2 py-1 text-sm border rounded"
      />
      <Button size="sm" onClick={handleJump}>
        Go
      </Button>
    </div>
  );
}
