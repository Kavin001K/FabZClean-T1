import { createPaginatedResponse } from './serialization';

export interface PaginationOptions {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  cursor?: string;
  hasMore: boolean;
  total: number;
  limit: number;
  page?: number;
}

export interface CursorInfo {
  value: string | number;
  direction: 'asc' | 'desc';
}

class PaginationService {
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  /**
   * Apply cursor-based pagination to an array of data
   */
  paginate<T>(
    data: T[],
    options: PaginationOptions = {},
    cursorField: string = 'id'
  ): PaginationResult<T> {
    const {
      cursor,
      limit = this.DEFAULT_LIMIT,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Validate and clamp limit
    const validLimit = Math.min(Math.max(1, limit), this.MAX_LIMIT);

    // Sort data if sortBy is provided
    let sortedData = [...data];
    if (sortBy) {
      sortedData.sort((a, b) => {
        const aValue = this.getNestedValue(a, sortBy);
        const bValue = this.getNestedValue(b, sortBy);

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Find starting index based on cursor
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = sortedData.findIndex(item => 
        this.getNestedValue(item, cursorField) === cursor
      );
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    // Get paginated slice
    const endIndex = startIndex + validLimit;
    const paginatedData = sortedData.slice(startIndex, endIndex);
    const hasMore = endIndex < sortedData.length;

    // Get next cursor
    const nextCursor = hasMore && paginatedData.length > 0
      ? this.getNestedValue(paginatedData[paginatedData.length - 1], cursorField)
      : undefined;

    return {
      data: paginatedData,
      cursor: nextCursor,
      hasMore,
      total: sortedData.length,
      limit: validLimit
    };
  }

  /**
   * Apply offset-based pagination (for backward compatibility)
   */
  paginateWithOffset<T>(
    data: T[],
    page: number = 1,
    limit: number = this.DEFAULT_LIMIT
  ): PaginationResult<T> & { page: number; totalPages: number } {
    const validLimit = Math.min(Math.max(1, limit), this.MAX_LIMIT);
    const validPage = Math.max(1, page);
    const offset = (validPage - 1) * validLimit;

    const paginatedData = data.slice(offset, offset + validLimit);
    const totalPages = Math.ceil(data.length / validLimit);
    const hasMore = validPage < totalPages;

    return {
      data: paginatedData,
      hasMore,
      total: data.length,
      limit: validLimit,
      page: validPage,
      totalPages
    };
  }

  /**
   * Create pagination metadata for API responses
   */
  createPaginationMeta(
    total: number,
    limit: number,
    cursor?: string,
    hasMore?: boolean,
    page?: number
  ) {
    const meta: any = {
      total,
      limit,
      hasMore: hasMore ?? false
    };

    if (cursor) {
      meta.cursor = cursor;
    }

    if (page !== undefined) {
      meta.page = page;
      meta.totalPages = Math.ceil(total / limit);
    }

    return meta;
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(query: any): {
    limit: number;
    cursor?: string;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    errors: string[];
  } {
    const errors: string[] = [];
    let limit = this.DEFAULT_LIMIT;
    let cursor: string | undefined;
    let page: number | undefined;
    let sortBy: string | undefined;
    let sortOrder: 'asc' | 'desc' = 'desc';

    // Validate limit
    if (query.limit) {
      const parsedLimit = parseInt(query.limit);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        errors.push('Limit must be a positive number');
      } else if (parsedLimit > this.MAX_LIMIT) {
        errors.push(`Limit cannot exceed ${this.MAX_LIMIT}`);
        limit = this.MAX_LIMIT;
      } else {
        limit = parsedLimit;
      }
    }

    // Validate cursor
    if (query.cursor) {
      cursor = query.cursor;
    }

    // Validate page (for offset-based pagination)
    if (query.page) {
      const parsedPage = parseInt(query.page);
      if (isNaN(parsedPage) || parsedPage < 1) {
        errors.push('Page must be a positive number');
      } else {
        page = parsedPage;
      }
    }

    // Validate sortBy
    if (query.sortBy) {
      sortBy = query.sortBy;
    }

    // Validate sortOrder
    if (query.sortOrder) {
      if (query.sortOrder !== 'asc' && query.sortOrder !== 'desc') {
        errors.push('Sort order must be "asc" or "desc"');
      } else {
        sortOrder = query.sortOrder;
      }
    }

    return {
      limit,
      cursor,
      page,
      sortBy,
      sortOrder,
      errors
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  /**
   * Create cursor for complex sorting
   */
  createCursor(item: any, sortFields: string[]): string {
    const values = sortFields.map(field => this.getNestedValue(item, field));
    return Buffer.from(JSON.stringify(values)).toString('base64');
  }

  /**
   * Parse cursor for complex sorting
   */
  parseCursor(cursor: string): any[] {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      return [];
    }
  }

  /**
   * Apply complex sorting with multiple fields
   */
  sortWithMultipleFields<T>(
    data: T[],
    sortFields: Array<{ field: string; order: 'asc' | 'desc' }>
  ): T[] {
    return [...data].sort((a, b) => {
      for (const { field, order } of sortFields) {
        const aValue = this.getNestedValue(a, field);
        const bValue = this.getNestedValue(b, field);

        if (aValue !== bValue) {
          const comparison = aValue > bValue ? 1 : -1;
          return order === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Get pagination info for database queries
   */
  getDatabasePaginationInfo(options: PaginationOptions): {
    limit: number;
    offset?: number;
    cursor?: string;
  } {
    const { limit = this.DEFAULT_LIMIT, cursor } = options;
    const validLimit = Math.min(Math.max(1, limit), this.MAX_LIMIT);

    return {
      limit: validLimit,
      cursor
    };
  }

  /**
   * Create pagination links for API responses
   */
  createPaginationLinks(
    baseUrl: string,
    currentPage: number,
    totalPages: number,
    queryParams: Record<string, any> = {}
  ): {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  } {
    const links: any = {};
    const params = new URLSearchParams(queryParams);

    if (currentPage > 1) {
      params.set('page', '1');
      links.first = `${baseUrl}?${params.toString()}`;
    }

    if (currentPage > 1) {
      params.set('page', (currentPage - 1).toString());
      links.prev = `${baseUrl}?${params.toString()}`;
    }

    if (currentPage < totalPages) {
      params.set('page', (currentPage + 1).toString());
      links.next = `${baseUrl}?${params.toString()}`;
    }

    if (currentPage < totalPages) {
      params.set('page', totalPages.toString());
      links.last = `${baseUrl}?${params.toString()}`;
    }

    return links;
  }

  /**
   * Estimate total count for large datasets
   */
  estimateTotalCount(sampleSize: number, sampleCount: number, totalSampled: number): number {
    if (sampleSize === 0) return 0;
    return Math.round((totalSampled / sampleSize) * sampleCount);
  }

  /**
   * Get pagination statistics
   */
  getPaginationStats(
    total: number,
    limit: number,
    currentPage?: number,
    currentCursor?: string
  ): {
    totalItems: number;
    itemsPerPage: number;
    totalPages?: number;
    currentPage?: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    startItem: number;
    endItem: number;
  } {
    const totalPages = Math.ceil(total / limit);
    const currentPageNum = currentPage || 1;
    const startItem = (currentPageNum - 1) * limit + 1;
    const endItem = Math.min(currentPageNum * limit, total);

    return {
      totalItems: total,
      itemsPerPage: limit,
      totalPages,
      currentPage: currentPageNum,
      hasNextPage: currentPageNum < totalPages,
      hasPrevPage: currentPageNum > 1,
      startItem,
      endItem
    };
  }
}

// Export singleton instance
export const paginationService = new PaginationService();
