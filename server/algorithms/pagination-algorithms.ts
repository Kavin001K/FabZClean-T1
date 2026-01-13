/**
 * Advanced Pagination Algorithms for FabZClean
 * Implements cursor-based, offset-based, and hybrid pagination strategies
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: { [key: string]: any };
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
    nextPage?: number;
    prevPage?: number;
  };
}

export interface CursorInfo {
  value: any;
  direction: 'asc' | 'desc';
  field: string;
}

/**
 * Cursor-based Pagination
 * Best for large datasets and real-time data
 * Time Complexity: O(log n + limit) for sorted data
 * Space Complexity: O(limit)
 */
export class CursorPagination<T> {
  private data: T[];
  private sortField: string;
  private sortDirection: 'asc' | 'desc';

  constructor(data: T[], sortField: string = 'id', sortDirection: 'asc' | 'desc' = 'desc') {
    this.data = [...data];
    this.sortField = sortField;
    this.sortDirection = sortDirection;
    this.sortData();
  }

  paginate(options: PaginationOptions): PaginationResult<T> {
    const limit = Math.min(options.limit || 20, 100); // Max 100 items per page
    const cursor = options.cursor;

    let startIndex = 0;
    let hasNext = false;
    let hasPrev = false;
    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (cursor) {
      const cursorInfo = this.decodeCursor(cursor);
      startIndex = this.findCursorIndex(cursorInfo);
      
      if (startIndex === -1) {
        return this.createEmptyResult(limit);
      }
      
      // Adjust for direction
      if (this.sortDirection === 'asc') {
        startIndex += 1; // Skip the cursor item
      } else {
        startIndex -= 1;
      }
    }

    // Get data slice
    const endIndex = this.sortDirection === 'asc' 
      ? startIndex + limit 
      : Math.max(0, startIndex - limit + 1);
    
    const actualStart = this.sortDirection === 'asc' ? startIndex : endIndex;
    const actualEnd = this.sortDirection === 'asc' ? endIndex : startIndex + 1;
    
    const pageData = this.data.slice(actualStart, actualEnd);
    
    // Determine pagination info
    hasNext = this.sortDirection === 'asc' 
      ? actualEnd < this.data.length 
      : actualStart > 0;
    
    hasPrev = this.sortDirection === 'asc' 
      ? actualStart > 0 
      : actualEnd < this.data.length;

    // Generate cursors
    if (hasNext && pageData.length > 0) {
      const lastItem = pageData[pageData.length - 1];
      nextCursor = this.encodeCursor({
        value: lastItem[this.sortField],
        direction: this.sortDirection,
        field: this.sortField
      });
    }

    if (hasPrev && pageData.length > 0) {
      const firstItem = pageData[0];
      prevCursor = this.encodeCursor({
        value: firstItem[this.sortField],
        direction: this.sortDirection,
        field: this.sortField
      });
    }

    return {
      data: pageData,
      pagination: {
        limit,
        hasNext,
        hasPrev,
        nextCursor,
        prevCursor
      }
    };
  }

  private sortData(): void {
    this.data.sort((a, b) => {
      const aVal = a[this.sortField];
      const bVal = b[this.sortField];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  private findCursorIndex(cursorInfo: CursorInfo): number {
    const { value, field } = cursorInfo;
    
    // Binary search for cursor position
    let left = 0;
    let right = this.data.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midValue = this.data[mid][field];
      
      if (midValue === value) {
        result = mid;
        break;
      } else if (midValue < value) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  private encodeCursor(cursorInfo: CursorInfo): string {
    const encoded = Buffer.from(JSON.stringify(cursorInfo)).toString('base64');
    return encoded;
  }

  private decodeCursor(cursor: string): CursorInfo {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }

  private createEmptyResult(limit: number): PaginationResult<T> {
    return {
      data: [],
      pagination: {
        limit,
        hasNext: false,
        hasPrev: false
      }
    };
  }
}

/**
 * Offset-based Pagination
 * Traditional page-based pagination
 * Time Complexity: O(offset + limit) for unsorted data
 * Space Complexity: O(limit)
 */
export class OffsetPagination<T> {
  private data: T[];
  private sortField?: string;
  private sortDirection?: 'asc' | 'desc';

  constructor(data: T[], sortField?: string, sortDirection: 'asc' | 'desc' = 'desc') {
    this.data = [...data];
    this.sortField = sortField;
    this.sortDirection = sortDirection;
    
    if (sortField) {
      this.sortData();
    }
  }

  paginate(options: PaginationOptions): PaginationResult<T> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 20, 100);
    const total = this.data.length;
    const totalPages = Math.ceil(total / limit);
    
    const offset = (page - 1) * limit;
    const pageData = this.data.slice(offset, offset + limit);
    
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: pageData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : undefined,
        prevPage: hasPrev ? page - 1 : undefined
      }
    };
  }

  private sortData(): void {
    if (!this.sortField) return;
    
    this.data.sort((a, b) => {
      const aVal = a[this.sortField!];
      const bVal = b[this.sortField!];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
}

/**
 * Hybrid Pagination
 * Combines cursor and offset pagination based on data characteristics
 */
export class HybridPagination<T> {
  private data: T[];
  private sortField: string;
  private sortDirection: 'asc' | 'desc';
  private cursorThreshold: number;

  constructor(
    data: T[], 
    sortField: string = 'id', 
    sortDirection: 'asc' | 'desc' = 'desc',
    cursorThreshold: number = 1000
  ) {
    this.data = [...data];
    this.sortField = sortField;
    this.sortDirection = sortDirection;
    this.cursorThreshold = cursorThreshold;
  }

  paginate(options: PaginationOptions): PaginationResult<T> {
    // Use cursor pagination for large datasets or when cursor is provided
    if (this.data.length > this.cursorThreshold || options.cursor) {
      const cursorPagination = new CursorPagination(this.data, this.sortField, this.sortDirection);
      return cursorPagination.paginate(options);
    } else {
      // Use offset pagination for smaller datasets
      const offsetPagination = new OffsetPagination(this.data, this.sortField, this.sortDirection);
      return offsetPagination.paginate(options);
    }
  }
}

/**
 * Virtual Scrolling Pagination
 * Optimized for infinite scroll scenarios
 */
export class VirtualScrollingPagination<T> {
  private data: T[];
  private chunkSize: number;
  private loadedChunks: Set<number>;
  private sortField?: string;
  private sortDirection?: 'asc' | 'desc';

  constructor(
    data: T[], 
    chunkSize: number = 50,
    sortField?: string,
    sortDirection: 'asc' | 'desc' = 'desc'
  ) {
    this.data = [...data];
    this.chunkSize = chunkSize;
    this.loadedChunks = new Set();
    this.sortField = sortField;
    this.sortDirection = sortDirection;
    
    if (sortField) {
      this.sortData();
    }
  }

  getChunk(chunkIndex: number): T[] {
    const start = chunkIndex * this.chunkSize;
    const end = start + this.chunkSize;
    const chunk = this.data.slice(start, end);
    
    this.loadedChunks.add(chunkIndex);
    return chunk;
  }

  getAllLoadedData(): T[] {
    const loadedData: T[] = [];
    
    for (const chunkIndex of this.loadedChunks) {
      const chunk = this.getChunk(chunkIndex);
      loadedData.push(...chunk);
    }
    
    return loadedData;
  }

  getTotalChunks(): number {
    return Math.ceil(this.data.length / this.chunkSize);
  }

  hasMoreChunks(chunkIndex: number): boolean {
    return chunkIndex < this.getTotalChunks() - 1;
  }

  private sortData(): void {
    if (!this.sortField) return;
    
    this.data.sort((a, b) => {
      const aVal = a[this.sortField!];
      const bVal = b[this.sortField!];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
}

/**
 * Advanced Filtering and Pagination
 * Combines filtering with pagination strategies
 */
export class AdvancedPagination<T> {
  private originalData: T[];
  private filteredData: T[];
  private filters: { [key: string]: any };
  private sortField: string;
  private sortDirection: 'asc' | 'desc';

  constructor(data: T[], sortField: string = 'id', sortDirection: 'asc' | 'desc' = 'desc') {
    this.originalData = [...data];
    this.filteredData = [...data];
    this.filters = {};
    this.sortField = sortField;
    this.sortDirection = sortDirection;
  }

  applyFilters(filters: { [key: string]: any }): this {
    this.filters = filters;
    this.filteredData = this.originalData.filter(item => this.matchesFilters(item));
    this.sortData();
    return this;
  }

  paginate(options: PaginationOptions): PaginationResult<T> {
    const limit = Math.min(options.limit || 20, 100);
    
    // Apply additional filters from options
    if (options.filters) {
      this.applyFilters({ ...this.filters, ...options.filters });
    }
    
    // Choose pagination strategy
    if (this.filteredData.length > 1000 || options.cursor) {
      const cursorPagination = new CursorPagination(this.filteredData, this.sortField, this.sortDirection);
      return cursorPagination.paginate(options);
    } else {
      const offsetPagination = new OffsetPagination(this.filteredData, this.sortField, this.sortDirection);
      return offsetPagination.paginate(options);
    }
  }

  private matchesFilters(item: T): boolean {
    return Object.entries(this.filters).every(([key, value]) => {
      const itemValue = item[key];
      
      if (value === null || value === undefined) {
        return itemValue === null || itemValue === undefined;
      }
      
      if (typeof value === 'string') {
        return typeof itemValue === 'string' && itemValue.toLowerCase().includes(value.toLowerCase());
      }
      
      if (typeof value === 'number') {
        return typeof itemValue === 'number' && itemValue === value;
      }
      
      if (Array.isArray(value)) {
        return Array.isArray(itemValue) && value.every(v => itemValue.includes(v));
      }
      
      if (typeof value === 'object' && value.operator) {
        return this.evaluateOperator(itemValue, value);
      }
      
      return itemValue === value;
    });
  }

  private evaluateOperator(itemValue: any, filter: { operator: string; value: any }): boolean {
    const { operator, value } = filter;
    
    switch (operator) {
      case 'gt':
        return itemValue > value;
      case 'gte':
        return itemValue >= value;
      case 'lt':
        return itemValue < value;
      case 'lte':
        return itemValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(itemValue);
      case 'nin':
        return Array.isArray(value) && !value.includes(itemValue);
      case 'regex':
        return typeof itemValue === 'string' && new RegExp(value).test(itemValue);
      default:
        return false;
    }
  }

  private sortData(): void {
    this.filteredData.sort((a, b) => {
      const aVal = a[this.sortField];
      const bVal = b[this.sortField];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
}

/**
 * Specialized pagination for FabZClean data types
 */
export class FabZCleanPagination {
  /**
   * Paginate orders with optimized sorting
   */
  static paginateOrders(orders: any[], options: PaginationOptions): PaginationResult<any> {
    const pagination = new AdvancedPagination(orders, 'createdAt', 'desc');
    
    // Apply common filters
    const filters: { [key: string]: any } = {};
    
    if (options.filters?.status) {
      filters.status = options.filters.status;
    }
    
    if (options.filters?.customerId) {
      filters.customerId = options.filters.customerId;
    }
    
    if (options.filters?.dateRange) {
      filters.createdAt = {
        operator: 'gte',
        value: options.filters.dateRange.start
      };
    }
    
    return pagination.applyFilters(filters).paginate(options);
  }

  /**
   * Paginate customers with search
   */
  static paginateCustomers(customers: any[], options: PaginationOptions): PaginationResult<any> {
    const pagination = new AdvancedPagination(customers, 'totalSpent', 'desc');
    
    const filters: { [key: string]: any } = {};
    
    if (options.filters?.search) {
      filters.name = options.filters.search;
    }
    
    if (options.filters?.minSpent) {
      filters.totalSpent = {
        operator: 'gte',
        value: options.filters.minSpent
      };
    }
    
    return pagination.applyFilters(filters).paginate(options);
  }

  /**
   * Paginate products with category filtering
   */
  static paginateProducts(products: any[], options: PaginationOptions): PaginationResult<any> {
    const pagination = new AdvancedPagination(products, 'name', 'asc');
    
    const filters: { [key: string]: any } = {};
    
    if (options.filters?.category) {
      filters.category = options.filters.category;
    }
    
    if (options.filters?.search) {
      filters.name = options.filters.search;
    }
    
    if (options.filters?.inStock) {
      filters.stockQuantity = {
        operator: 'gt',
        value: 0
      };
    }
    
    return pagination.applyFilters(filters).paginate(options);
  }

  /**
   * Paginate drivers with status filtering
   */
  static paginateDrivers(drivers: any[], options: PaginationOptions): PaginationResult<any> {
    const pagination = new AdvancedPagination(drivers, 'rating', 'desc');
    
    const filters: { [key: string]: any } = {};
    
    if (options.filters?.status) {
      filters.status = options.filters.status;
    }
    
    if (options.filters?.vehicleType) {
      filters.vehicleType = options.filters.vehicleType;
    }
    
    return pagination.applyFilters(filters).paginate(options);
  }

  /**
   * Infinite scroll pagination for real-time data
   */
  static infiniteScroll<T>(data: T[], cursor?: string, limit: number = 20): PaginationResult<T> {
    const pagination = new CursorPagination(data, 'createdAt', 'desc');
    return pagination.paginate({ cursor, limit });
  }
}
