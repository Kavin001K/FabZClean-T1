/**
 * Advanced Sorting Algorithms for FabZClean
 * Optimized sorting implementations for different data types and sizes
 */

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
  algorithm?: 'quick' | 'merge' | 'heap' | 'tim' | 'radix';
  stable?: boolean;
}

export interface Comparable {
  [key: string]: any;
}

/**
 * TimSort Algorithm - Hybrid stable sorting
 * Time Complexity: O(n log n) worst case, O(n) best case
 * Space Complexity: O(n)
 * Best for: Real-world data with existing order
 */
export class TimSort {
  private static readonly MIN_MERGE = 32;
  private static readonly MIN_GALLOP = 7;

  static sort<T extends Comparable>(arr: T[], options: SortOptions): T[] {
    const result = [...arr]; // Create copy to avoid mutation
    this.timSort(result, options);
    return result;
  }

  private static timSort<T extends Comparable>(arr: T[], options: SortOptions): void {
    const n = arr.length;
    
    // For small arrays, use insertion sort
    if (n < this.MIN_MERGE) {
      this.insertionSort(arr, 0, n - 1, options);
      return;
    }

    // Find minimum run length
    const minRun = this.minRunLength(n);
    
    // Sort individual runs
    for (let i = 0; i < n; i += minRun) {
      this.insertionSort(arr, i, Math.min(i + minRun - 1, n - 1), options);
    }

    // Merge runs
    let size = minRun;
    while (size < n) {
      for (let left = 0; left < n; left += 2 * size) {
        const mid = left + size - 1;
        const right = Math.min(left + 2 * size - 1, n - 1);
        
        if (mid < right) {
          this.merge(arr, left, mid, right, options);
        }
      }
      size *= 2;
    }
  }

  private static minRunLength(n: number): number {
    let r = 0;
    while (n >= this.MIN_MERGE) {
      r |= n & 1;
      n >>= 1;
    }
    return n + r;
  }

  private static insertionSort<T extends Comparable>(
    arr: T[], 
    left: number, 
    right: number, 
    options: SortOptions
  ): void {
    for (let i = left + 1; i <= right; i++) {
      const key = arr[i];
      let j = i - 1;
      
      while (j >= left && this.compare(arr[j], key, options) > 0) {
        arr[j + 1] = arr[j];
        j--;
      }
      arr[j + 1] = key;
    }
  }

  private static merge<T extends Comparable>(
    arr: T[], 
    left: number, 
    mid: number, 
    right: number, 
    options: SortOptions
  ): void {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
      if (this.compare(leftArr[i], rightArr[j], options) <= 0) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      k++;
    }
    
    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      i++;
      k++;
    }
    
    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      j++;
      k++;
    }
  }

  private static compare<T extends Comparable>(a: T, b: T, options: SortOptions): number {
    const aVal = a[options.field];
    const bVal = b[options.field];
    
    if (aVal === bVal) return 0;
    if (aVal < bVal) return options.direction === 'asc' ? -1 : 1;
    return options.direction === 'asc' ? 1 : -1;
  }
}

/**
 * QuickSort Algorithm with optimizations
 * Time Complexity: O(n log n) average, O(n²) worst case
 * Space Complexity: O(log n)
 * Best for: General purpose sorting
 */
export class QuickSort {
  static sort<T extends Comparable>(arr: T[], options: SortOptions): T[] {
    const result = [...arr];
    this.quickSort(result, 0, result.length - 1, options);
    return result;
  }

  private static quickSort<T extends Comparable>(
    arr: T[], 
    low: number, 
    high: number, 
    options: SortOptions
  ): void {
    if (low < high) {
      // Use median-of-three for pivot selection
      const pivotIndex = this.partition(arr, low, high, options);
      this.quickSort(arr, low, pivotIndex - 1, options);
      this.quickSort(arr, pivotIndex + 1, high, options);
    }
  }

  private static partition<T extends Comparable>(
    arr: T[], 
    low: number, 
    high: number, 
    options: SortOptions
  ): number {
    // Median-of-three pivot selection
    const mid = Math.floor((low + high) / 2);
    this.medianOfThree(arr, low, mid, high, options);
    
    const pivot = arr[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
      if (this.compare(arr[j], pivot, options) <= 0) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }

  private static medianOfThree<T extends Comparable>(
    arr: T[], 
    low: number, 
    mid: number, 
    high: number, 
    options: SortOptions
  ): void {
    if (this.compare(arr[mid], arr[low], options) < 0) {
      [arr[low], arr[mid]] = [arr[mid], arr[low]];
    }
    if (this.compare(arr[high], arr[low], options) < 0) {
      [arr[low], arr[high]] = [arr[high], arr[low]];
    }
    if (this.compare(arr[high], arr[mid], options) < 0) {
      [arr[mid], arr[high]] = [arr[high], arr[mid]];
    }
  }

  private static compare<T extends Comparable>(a: T, b: T, options: SortOptions): number {
    const aVal = a[options.field];
    const bVal = b[options.field];
    
    if (aVal === bVal) return 0;
    if (aVal < bVal) return options.direction === 'asc' ? -1 : 1;
    return options.direction === 'asc' ? 1 : -1;
  }
}

/**
 * HeapSort Algorithm
 * Time Complexity: O(n log n) guaranteed
 * Space Complexity: O(1)
 * Best for: When worst-case performance is critical
 */
export class HeapSort {
  static sort<T extends Comparable>(arr: T[], options: SortOptions): T[] {
    const result = [...arr];
    const n = result.length;
    
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.heapify(result, n, i, options);
    }
    
    // Extract elements from heap one by one
    for (let i = n - 1; i > 0; i--) {
      [result[0], result[i]] = [result[i], result[0]];
      this.heapify(result, i, 0, options);
    }
    
    return result;
  }

  private static heapify<T extends Comparable>(
    arr: T[], 
    n: number, 
    i: number, 
    options: SortOptions
  ): void {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n && this.compare(arr[left], arr[largest], options) > 0) {
      largest = left;
    }
    
    if (right < n && this.compare(arr[right], arr[largest], options) > 0) {
      largest = right;
    }
    
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      this.heapify(arr, n, largest, options);
    }
  }

  private static compare<T extends Comparable>(a: T, b: T, options: SortOptions): number {
    const aVal = a[options.field];
    const bVal = b[options.field];
    
    if (aVal === bVal) return 0;
    if (aVal < bVal) return options.direction === 'asc' ? -1 : 1;
    return options.direction === 'asc' ? 1 : -1;
  }
}

/**
 * Radix Sort for numeric fields
 * Time Complexity: O(d * (n + k)) where d is number of digits, k is range
 * Space Complexity: O(n + k)
 * Best for: Sorting integers or fixed-width strings
 */
export class RadixSort {
  static sort<T extends Comparable>(arr: T[], options: SortOptions): T[] {
    const result = [...arr];
    const max = this.getMax(result, options.field);
    
    // Apply counting sort for each digit
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      this.countingSort(result, options.field, exp, options.direction);
    }
    
    return result;
  }

  private static getMax<T extends Comparable>(arr: T[], field: string): number {
    return Math.max(...arr.map(item => Math.abs(Number(item[field])) || 0));
  }

  private static countingSort<T extends Comparable>(
    arr: T[], 
    field: string, 
    exp: number, 
    direction: 'asc' | 'desc'
  ): void {
    const n = arr.length;
    const output = new Array(n);
    const count = new Array(10).fill(0);
    
    // Store count of occurrences
    for (let i = 0; i < n; i++) {
      const digit = Math.floor((Number(arr[i][field]) || 0) / exp) % 10;
      count[digit]++;
    }
    
    // Change count[i] so it contains actual position
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }
    
    // Build output array
    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor((Number(arr[i][field]) || 0) / exp) % 10;
      output[count[digit] - 1] = arr[i];
      count[digit]--;
    }
    
    // Copy output array to original array
    for (let i = 0; i < n; i++) {
      arr[i] = output[i];
    }
  }
}

/**
 * Multi-field sorting with stable sort
 */
export class MultiFieldSort {
  static sort<T extends Comparable>(arr: T[], sortFields: SortOptions[]): T[] {
    let result = [...arr];
    
    // Sort by each field in reverse order (stable sort property)
    for (let i = sortFields.length - 1; i >= 0; i--) {
      const options = sortFields[i];
      result = this.stableSort(result, options);
    }
    
    return result;
  }

  private static stableSort<T extends Comparable>(arr: T[], options: SortOptions): T[] {
    // Use TimSort for stability
    return TimSort.sort(arr, options);
  }
}

/**
 * Smart sorting algorithm selector
 * Automatically chooses the best algorithm based on data characteristics
 */
export class SmartSort {
  static sort<T extends Comparable>(arr: T[], options: SortOptions): T[] {
    const n = arr.length;
    
    // Choose algorithm based on data size and characteristics
    if (n < 50) {
      // Small arrays: Use insertion sort (part of TimSort)
      return TimSort.sort(arr, options);
    } else if (n < 1000) {
      // Medium arrays: Use QuickSort
      return QuickSort.sort(arr, options);
    } else if (this.isNumericField(arr, options.field)) {
      // Large numeric arrays: Use RadixSort
      return RadixSort.sort(arr, options);
    } else {
      // Large arrays: Use TimSort for stability and performance
      return TimSort.sort(arr, options);
    }
  }

  private static isNumericField<T extends Comparable>(arr: T[], field: string): boolean {
    if (arr.length === 0) return false;
    
    const sampleSize = Math.min(10, arr.length);
    for (let i = 0; i < sampleSize; i++) {
      const value = arr[i][field];
      if (typeof value !== 'number' && isNaN(Number(value))) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Specialized sorting for common FabZClean data types
 */
export class FabZCleanSort {
  /**
   * Sort orders by priority and date
   */
  static sortOrders(orders: any[]): any[] {
    return MultiFieldSort.sort(orders, [
      { field: 'createdAt', direction: 'desc' },
      { field: 'totalAmount', direction: 'desc' },
      { field: 'status', direction: 'asc' }
    ]);
  }

  /**
   * Sort customers by value and activity
   */
  static sortCustomers(customers: any[]): any[] {
    return MultiFieldSort.sort(customers, [
      { field: 'totalSpent', direction: 'desc' },
      { field: 'totalOrders', direction: 'desc' },
      { field: 'lastOrder', direction: 'desc' }
    ]);
  }

  /**
   * Sort products by popularity and stock
   */
  static sortProducts(products: any[]): any[] {
    return MultiFieldSort.sort(products, [
      { field: 'stockQuantity', direction: 'desc' },
      { field: 'price', direction: 'asc' },
      { field: 'name', direction: 'asc' }
    ]);
  }

  /**
   * Sort drivers by availability and rating
   */
  static sortDrivers(drivers: any[]): any[] {
    return MultiFieldSort.sort(drivers, [
      { field: 'status', direction: 'asc' }, // available first
      { field: 'rating', direction: 'desc' },
      { field: 'totalDeliveries', direction: 'desc' }
    ]);
  }
}
