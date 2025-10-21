// Bundle optimization utilities for FabZClean

// Dynamic imports for code splitting
export const dynamicImports = {
  // Dashboard components
  dashboard: () => import('../components/dashboard/enhanced-employee-dashboard'),
  
  // Order management
  orderManagement: () => import('../components/orders/employee-order-management'),
  orderTracking: () => import('../components/customer-portal/customer-order-tracking'),
  
  // Transit management
  transitManagement: () => import('../components/transit/employee-transit-management'),
  
  // Customer portal
  customerPortal: () => import('../pages/customer-portal'),
  serviceBooking: () => import('../components/customer-portal/customer-service-booking'),
  accountManagement: () => import('../components/customer-portal/customer-account-management'),
  
  // Worker portal
  workerPortal: () => import('../pages/worker-portal'),
  deliveryManagement: () => import('../components/worker-portal/worker-delivery-management'),
  
  // Charts and analytics
  charts: () => import('recharts'),
  
  // Heavy libraries
  dateFns: () => import('date-fns'),
  lodash: () => import('lodash-es'),
  
  // UI components (lazy loaded)
  dataTable: () => import('../components/ui/data-table'),
  virtualScroll: () => import('../components/ui/virtual-scroll'),
  lazyLoad: () => import('../components/ui/lazy-load')
};

// Component preloading
export const preloadComponents = {
  // Preload critical components
  preloadCritical: async () => {
    const criticalComponents = [
      dynamicImports.dashboard,
      dynamicImports.orderManagement,
      dynamicImports.customerPortal
    ];
    
    await Promise.all(criticalComponents.map(importFn => importFn()));
  },
  
  // Preload based on user role
  preloadByRole: async (role: 'admin' | 'employee' | 'customer' | 'worker') => {
    const roleComponents = {
      admin: [
        dynamicImports.dashboard,
        dynamicImports.orderManagement,
        dynamicImports.transitManagement
      ],
      employee: [
        dynamicImports.dashboard,
        dynamicImports.orderManagement,
        dynamicImports.transitManagement
      ],
      customer: [
        dynamicImports.customerPortal,
        dynamicImports.serviceBooking,
        dynamicImports.accountManagement
      ],
      worker: [
        dynamicImports.workerPortal,
        dynamicImports.deliveryManagement
      ]
    };
    
    const components = roleComponents[role] || [];
    await Promise.all(components.map(importFn => importFn()));
  },
  
  // Preload on hover
  preloadOnHover: (element: HTMLElement, importFn: () => Promise<any>) => {
    let preloaded = false;
    
    const handleMouseEnter = () => {
      if (!preloaded) {
        preloaded = true;
        importFn();
      }
    };
    
    element.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
  }
};

// Resource hints
export const addResourceHints = () => {
  // Add preload hints for critical resources
  const criticalResources = [
    { href: '/assets/logo.webp', as: 'image' },
    { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.type) {
      link.type = resource.type;
    }
    
    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }
    
    document.head.appendChild(link);
  });
};

// Bundle analyzer
export const bundleAnalyzer = {
  // Track bundle size
  trackBundleSize: (bundleName: string, size: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Bundle ${bundleName}: ${(size / 1024).toFixed(2)} KB`);
    }
  },
  
  // Analyze chunk sizes
  analyzeChunks: (chunks: any[]) => {
    const analysis = chunks.map(chunk => ({
      name: chunk.name,
      size: chunk.size,
      sizeKB: (chunk.size / 1024).toFixed(2),
      modules: chunk.modules?.length || 0
    }));
    
    console.table(analysis);
    return analysis;
  },
  
  // Find large dependencies
  findLargeDependencies: (modules: any[]) => {
    const largeModules = modules
      .filter(module => module.size > 100 * 1024) // > 100KB
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    
    console.log('Large dependencies:', largeModules);
    return largeModules;
  }
};

// Tree shaking helpers
export const treeShakingHelpers = {
  // Import only what you need
  importOnly: {
    // Lodash - import specific functions
    lodash: {
      debounce: () => import('lodash-es/debounce'),
      throttle: () => import('lodash-es/throttle'),
      isEmpty: () => import('lodash-es/isEmpty'),
      isEqual: () => import('lodash-es/isEqual')
    },
    
    // Date-fns - import specific functions
    dateFns: {
      format: () => import('date-fns/format'),
      parseISO: () => import('date-fns/parseISO'),
      isAfter: () => import('date-fns/isAfter'),
      isBefore: () => import('date-fns/isBefore')
    },
    
    // Recharts - import specific components
    recharts: {
      LineChart: () => import('recharts/es6/cartesian/LineChart'),
      BarChart: () => import('recharts/es6/cartesian/BarChart'),
      PieChart: () => import('recharts/es6/polar/PieChart')
    }
  },
  
  // Conditional imports
  conditionalImport: async (condition: boolean, importFn: () => Promise<any>) => {
    if (condition) {
      return await importFn();
    }
    return null;
  }
};

// Performance monitoring
export const performanceMonitor = {
  // Measure component load time
  measureComponentLoad: (componentName: string, loadFn: () => Promise<any>) => {
    const start = performance.now();
    
    return loadFn().then(() => {
      const end = performance.now();
      const loadTime = end - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
      
      return loadTime;
    });
  },
  
  // Measure bundle size
  measureBundleSize: (bundle: any) => {
    const size = JSON.stringify(bundle).length;
    const sizeKB = (size / 1024).toFixed(2);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Bundle size: ${sizeKB} KB`);
    }
    
    return size;
  },
  
  // Monitor memory usage
  monitorMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
      };
    }
    return null;
  }
};

// Cache optimization
export const cacheOptimization = {
  // Service worker cache
  setupServiceWorkerCache: () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  },
  
  // Browser cache headers
  getCacheHeaders: (resourceType: 'static' | 'api' | 'image') => {
    const cacheHeaders = {
      static: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      api: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400'
      },
      image: {
        'Cache-Control': 'public, max-age=86400'
      }
    };
    
    return cacheHeaders[resourceType];
  },
  
  // Local storage cache
  localStorageCache: {
    set: (key: string, value: any, ttl: number = 3600000) => {
      const item = {
        value,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
    },
    
    get: (key: string) => {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      try {
        const parsed = JSON.parse(item);
        const now = Date.now();
        
        if (now - parsed.timestamp > parsed.ttl) {
          localStorage.removeItem(key);
          return null;
        }
        
        return parsed.value;
      } catch {
        localStorage.removeItem(key);
        return null;
      }
    },
    
    clear: () => {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('fabzclean_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
};

// Export all utilities
export default {
  dynamicImports,
  preloadComponents,
  addResourceHints,
  bundleAnalyzer,
  treeShakingHelpers,
  performanceMonitor,
  cacheOptimization
};
