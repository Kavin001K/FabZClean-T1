'use client';

import { useEffect } from 'react';

/**
 * Netlify-compatible analytics component
 * This provides basic performance monitoring without Vercel dependencies
 */
export default function Analytics() {
  useEffect(() => {
    // Basic performance monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('Page Load Performance:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
          });
        }
        
        if (entry.entryType === 'paint') {
          const paintEntry = entry as PerformancePaintTiming;
          console.log('Paint Performance:', {
            name: paintEntry.name,
            startTime: paintEntry.startTime,
          });
        }
      }
    });

    // Observe navigation and paint timing
    observer.observe({ entryTypes: ['navigation', 'paint'] });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
