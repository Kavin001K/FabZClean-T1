/**
 * FabZClean Advanced Algorithms
 * Central export for all optimized algorithms and data structures
 */

// Search Algorithms
export * from './search-algorithms';

// Sorting Algorithms
export * from './sorting-algorithms';

// Caching Algorithms
export * from './caching-algorithms';

// Route Planning Algorithms
export * from './route-algorithms';

// Pagination Algorithms
export * from './pagination-algorithms';

// Real-time Algorithms
export * from './realtime-algorithms';

// Data Structures
export * from './data-structures';

// Database Optimization
export * from './database-optimization';

// Order Enrichment Algorithms
export * from './order-enrichment';

// Algorithm Utilities
export class AlgorithmUtils {
  /**
   * Benchmark algorithm performance
   */
  static benchmark<T>(
    name: string,
    algorithm: () => T,
    iterations: number = 1000
  ): { result: T; averageTime: number; totalTime: number } {
    const times: number[] = [];
    let result: T;

    // Warmup
    for (let i = 0; i < 10; i++) {
      algorithm();
    }

    // Benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = algorithm();
      const end = performance.now();
      times.push(end - start);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;

    console.log(`Benchmark ${name}: ${averageTime.toFixed(4)}ms average over ${iterations} iterations`);

    return {
      result: result!,
      averageTime,
      totalTime
    };
  }

  /**
   * Memory usage estimation
   */
  static estimateMemoryUsage(obj: any): number {
    const jsonString = JSON.stringify(obj);
    return jsonString.length * 2; // Rough estimate (UTF-16)
  }

  /**
   * Generate performance report
   */
  static generatePerformanceReport(metrics: { [key: string]: number }): void {
    console.log('\n=== Performance Report ===');
    
    const sortedMetrics = Object.entries(metrics)
      .sort(([, a], [, b]) => b - a);

    sortedMetrics.forEach(([name, value]) => {
      console.log(`${name}: ${value.toFixed(2)}ms`);
    });
    
    console.log('========================\n');
  }
}
