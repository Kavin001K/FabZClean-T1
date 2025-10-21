import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
  loading = false,
  emptyMessage = 'No items found'
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange.start, visibleRange.end]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          <AnimatePresence>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              visibleItems.map((item, index) => (
                <motion.div
                  key={visibleRange.start + index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ height: itemHeight }}
                  className="flex items-center"
                >
                  {renderItem(item, visibleRange.start + index)}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Hook for virtual scrolling with dynamic item heights
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  estimatedItemHeight: number = 60
) {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeights = useRef<Map<number, number>>(new Map());
  const [totalHeight, setTotalHeight] = useState(items.length * estimatedItemHeight);

  // Update total height when items change
  useEffect(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += itemHeights.current.get(i) || estimatedItemHeight;
    }
    setTotalHeight(height);
  }, [items.length, estimatedItemHeight]);

  // Calculate visible range with dynamic heights
  const visibleRange = useMemo(() => {
    let start = 0;
    let end = items.length;
    let currentHeight = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeight = itemHeights.current.get(i) || estimatedItemHeight;
      if (currentHeight + itemHeight > scrollTop) {
        start = Math.max(0, i - 5); // overscan
        break;
      }
      currentHeight += itemHeight;
    }

    // Find end index
    currentHeight = 0;
    for (let i = 0; i < items.length; i++) {
      const itemHeight = itemHeights.current.get(i) || estimatedItemHeight;
      currentHeight += itemHeight;
      if (currentHeight > scrollTop + containerHeight) {
        end = Math.min(items.length, i + 6); // overscan
        break;
      }
    }

    return { start, end };
  }, [scrollTop, containerHeight, items.length, estimatedItemHeight]);

  // Update item height
  const updateItemHeight = (index: number, height: number) => {
    itemHeights.current.set(index, height);
    // Recalculate total height
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += itemHeights.current.get(i) || estimatedItemHeight;
    }
    setTotalHeight(total);
  };

  // Get offset for an item
  const getItemOffset = (index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeights.current.get(i) || estimatedItemHeight;
    }
    return offset;
  };

  return {
    visibleRange,
    totalHeight,
    updateItemHeight,
    getItemOffset,
    scrollTop,
    setScrollTop
  };
}

// Infinite scroll virtual list
interface InfiniteVirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
  threshold?: number;
}

export function InfiniteVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = '',
  threshold = 100
}: InfiniteVirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Check if we need to load more
  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;

    const totalHeight = items.length * itemHeight;
    const scrollBottom = scrollTop + containerHeight;

    if (totalHeight - scrollBottom < threshold) {
      onLoadMore();
    }
  }, [scrollTop, containerHeight, items.length, itemHeight, onLoadMore, hasMore, loading, threshold]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
    );
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange.start, visibleRange.end]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
          
          {loading && (
            <div
              ref={loadingRef}
              className="flex items-center justify-center p-4"
              style={{ height: itemHeight }}
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}