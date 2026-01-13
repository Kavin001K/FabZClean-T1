import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  delay?: number;
  once?: boolean;
  onVisible?: () => void;
}

export function LazyLoad({
  children,
  fallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  delay = 0,
  once = true,
  onVisible
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsVisible(true);
        onVisible?.();
        
        if (once && observerRef.current) {
          observerRef.current.disconnect();
        }
      }
    },
    [once, onVisible]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  useEffect(() => {
    if (isVisible && delay > 0) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, delay);
      return () => clearTimeout(timer);
    } else if (isVisible) {
      setIsLoaded(true);
    }
  }, [isVisible, delay]);

  return (
    <div ref={elementRef} className={className}>
      <AnimatePresence mode="wait">
        {isLoaded ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fallback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Lazy image component
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  className = '',
  fallbackSrc,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      setIsVisible(true);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={hasError && fallbackSrc ? fallbackSrc : src}
              alt={alt}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Lazy component wrapper
interface LazyComponentProps {
  component: React.ComponentType<any>;
  props?: any;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazyComponent({
  component: Component,
  props = {},
  fallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}: LazyComponentProps) {
  return (
    <LazyLoad
      fallback={fallback}
      threshold={threshold}
      rootMargin={rootMargin}
      className={className}
    >
      <Component {...props} />
    </LazyLoad>
  );
}

// Progressive loading hook
export function useProgressiveLoading<T>(
  loadFunction: () => Promise<T[]>,
  options: {
    batchSize?: number;
    delay?: number;
    initialLoad?: number;
  } = {}
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { batchSize = 10, delay = 1000, initialLoad = 20 } = options;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await loadFunction();
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
        
        if (newItems.length < batchSize) {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [loadFunction, loading, hasMore, batchSize]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const initialItems = await loadFunction();
      setItems(initialItems);
      setHasMore(initialItems.length >= batchSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [loadFunction, batchSize]);

  const reset = useCallback(() => {
    setItems([]);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    loadInitial,
    reset
  };
}