import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Database, Wifi, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  bundleSize: number;
  cacheHitRate: number;
  errorRate: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function PerformanceMonitor({
  enabled = true,
  showDetails = false,
  position = 'top-right',
  className = ''
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    bundleSize: 0,
    cacheHitRate: 0,
    errorRate: 0
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const startTimeRef = useRef<number>(0);
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Measure render time
  const measureRenderTime = () => {
    const start = performance.now();
    startTimeRef.current = start;
    
    requestAnimationFrame(() => {
      const end = performance.now();
      const renderTime = end - start;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100
      }));
      
      // Alert if render time is too high
      if (renderTime > 16.67) { // 60fps threshold
        setAlerts(prev => [...prev, `Slow render: ${renderTime.toFixed(2)}ms`]);
      }
    });
  };

  // Monitor memory usage
  const monitorMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(usedMB * 100) / 100
      }));
      
      // Alert if memory usage is high
      if (usedMB > 100) { // 100MB threshold
        setAlerts(prev => [...prev, `High memory usage: ${usedMB.toFixed(2)}MB`]);
      }
    }
  };

  // Monitor network performance
  const monitorNetworkPerformance = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const latency = connection.rtt || 0;
      
      setMetrics(prev => ({
        ...prev,
        networkLatency: latency
      }));
      
      // Alert if latency is high
      if (latency > 200) { // 200ms threshold
        setAlerts(prev => [...prev, `High latency: ${latency}ms`]);
      }
    }
  };

  // Monitor bundle size
  const monitorBundleSize = () => {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.includes('assets')) {
        // Estimate size based on script name (this is approximate)
        totalSize += 100; // KB
      }
    });
    
    setMetrics(prev => ({
      ...prev,
      bundleSize: totalSize
    }));
  };

  // Monitor cache performance
  const monitorCachePerformance = () => {
    const cacheHitRate = Math.random() * 100; // Mock data
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    }));
  };

  // Monitor errors
  const monitorErrors = () => {
    const errorRate = Math.random() * 5; // Mock data
    setMetrics(prev => ({
      ...prev,
      errorRate: Math.round(errorRate * 100) / 100
    }));
  };

  // Setup performance observer
  useEffect(() => {
    if (!enabled) return;

    // Measure initial render
    measureRenderTime();

    // Setup performance observer for navigation timing
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
            
            if (loadTime > 3000) { // 3 second threshold
              setAlerts(prev => [...prev, `Slow page load: ${loadTime.toFixed(2)}ms`]);
            }
          }
        });
      });

      observerRef.current.observe({ entryTypes: ['navigation', 'measure'] });
    }

    // Monitor performance metrics
    const interval = setInterval(() => {
      monitorMemoryUsage();
      monitorNetworkPerformance();
      monitorBundleSize();
      monitorCachePerformance();
      monitorErrors();
    }, 5000);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearInterval(interval);
    };
  }, [enabled]);

  // Clear alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Get performance status
  const getPerformanceStatus = () => {
    const { renderTime, memoryUsage, networkLatency } = metrics;
    
    if (renderTime > 16.67 || memoryUsage > 100 || networkLatency > 200) {
      return { status: 'poor', color: 'text-red-500', bgColor: 'bg-red-50' };
    } else if (renderTime > 8 || memoryUsage > 50 || networkLatency > 100) {
      return { status: 'fair', color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    } else {
      return { status: 'good', color: 'text-green-500', bgColor: 'bg-green-50' };
    }
  };

  const performanceStatus = getPerformanceStatus();
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (!enabled) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <Card className="w-80 glass border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${performanceStatus.color} ${performanceStatus.bgColor}`}
              >
                {performanceStatus.status.toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? '−' : '+'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Render Time</div>
                  <div className="text-sm font-medium">{metrics.renderTime}ms</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Memory</div>
                  <div className="text-sm font-medium">{metrics.memoryUsage}MB</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Latency</div>
                  <div className="text-sm font-medium">{metrics.networkLatency}ms</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Bundle</div>
                  <div className="text-sm font-medium">{metrics.bundleSize}KB</div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">Alerts</div>
                  <Button variant="ghost" size="sm" onClick={clearAlerts}>
                    Clear
                  </Button>
                </div>
                <div className="space-y-1">
                  {alerts.slice(-3).map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {alert}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Metrics */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-2 border-t"
                >
                  <div className="text-xs font-medium text-muted-foreground">Detailed Metrics</div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between text-xs">
                      <span>Cache Hit Rate:</span>
                      <span>{metrics.cacheHitRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Error Rate:</span>
                      <span>{metrics.errorRate}%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Performance hook for components
export function usePerformanceMonitor(componentName: string) {
  const startTimeRef = useRef<number>(0);
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0
  });

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      const mountTime = performance.now() - startTimeRef.current;
      setMetrics(prev => ({
        ...prev,
        mountTime: Math.round(mountTime * 100) / 100
      }));
    };
  }, []);

  const measureRender = () => {
    const start = performance.now();
    
    requestAnimationFrame(() => {
      const end = performance.now();
      const renderTime = end - start;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100,
        updateCount: prev.updateCount + 1
      }));
    });
  };

  return {
    metrics,
    measureRender
  };
}
