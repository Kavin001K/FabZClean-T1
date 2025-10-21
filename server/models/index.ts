// Centralized model exports and type definitions
export * from '../shared/schema';

// Re-export all schemas for easy access
export {
  insertProductSchema,
  insertOrderSchema,
  insertCustomerSchema,
  insertOrderTransactionSchema,
  insertServiceSchema,
  insertShipmentSchema,
  insertBarcodeSchema,
  insertEmployeeSchema,
  insertDeliverySchema,
} from '../../shared/schema';

// Model interfaces for better type safety
export interface SerializedModel {
  toJSON(): Record<string, any>;
}

export interface ModelWithTimestamps {
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor?: string;
  hasMore: boolean;
  total: number;
  page?: number;
  limit: number;
}

export interface SearchResult<T> {
  data: T[];
  query: string;
  total: number;
  took: number; // milliseconds
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

export interface RouteOptimizationResult {
  optimizedRoute: string[];
  totalDistance: number;
  estimatedTime: number;
  savings: number;
}
