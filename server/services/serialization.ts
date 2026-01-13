// Consistent data transformation and serialization utilities

export interface SerializationOptions {
  includeTimestamps?: boolean;
  includeRelations?: boolean;
  camelCase?: boolean;
  excludeFields?: string[];
}

export class SerializationService {
  /**
   * Convert snake_case to camelCase
   */
  private static toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert object keys to camelCase
   */
  private static toCamelCaseObject(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = this.toCamelCase(key);
      result[camelKey] = value;
    }

    return result;
  }

  /**
   * Serialize a single record with consistent formatting
   */
  static serializeRecord<T extends Record<string, any>>(
    record: T,
    options: SerializationOptions = {}
  ): Record<string, any> {
    const {
      includeTimestamps = true,
      includeRelations = false,
      camelCase = true,
      excludeFields = []
    } = options;

    // Create a copy to avoid mutating the original
    let serialized: Record<string, any> = { ...record };

    // Remove excluded fields
    excludeFields.forEach(field => {
      delete serialized[field];
    });

    // Handle timestamp fields
    if (includeTimestamps) {
      if (serialized.createdAt && typeof serialized.createdAt === 'string') {
        try {
          serialized.createdAt = new Date(serialized.createdAt).toISOString();
        } catch (e) {
          // Keep original value if invalid
        }
      }
      if (serialized.updatedAt && typeof serialized.updatedAt === 'string') {
        try {
          serialized.updatedAt = new Date(serialized.updatedAt).toISOString();
        } catch (e) {
          // Keep original value if invalid
        }
      }
    } else {
      delete serialized.createdAt;
      delete serialized.updatedAt;
    }

    // Convert to camelCase if requested
    if (camelCase) {
      serialized = this.toCamelCaseObject(serialized);
    }

    return serialized;
  }

  /**
   * Serialize an array of records
   */
  static serializeRecords<T extends Record<string, any>>(
    records: T[],
    options: SerializationOptions = {}
  ): Record<string, any>[] {
    return records.map(record => this.serializeRecord(record, options));
  }

  /**
   * Create a paginated response with consistent format
   */
  static createPaginatedResponse<T extends Record<string, any>>(
    data: T[],
    options: {
      cursor?: string;
      hasMore: boolean;
      total: number;
      limit: number;
      page?: number;
    },
    serializationOptions: SerializationOptions = {}
  ) {
    const serializedData = this.serializeRecords(data, serializationOptions);

    return {
      data: serializedData,
      pagination: {
        cursor: options.cursor,
        hasMore: options.hasMore,
        total: options.total,
        limit: options.limit,
        page: options.page,
        totalPages: options.page ? Math.ceil(options.total / options.limit) : undefined
      }
    };
  }

  /**
   * Create a search result response
   */
  static createSearchResponse<T extends Record<string, any>>(
    data: T[],
    query: string,
    total: number,
    took: number,
    serializationOptions: SerializationOptions = {}
  ) {
    return {
      data: this.serializeRecords(data, serializationOptions),
      query,
      total,
      took,
      meta: {
        query,
        totalResults: total,
        searchTime: `${took}ms`,
        resultsPerPage: data.length
      }
    };
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    error: string | Error,
    statusCode: number = 500,
    details?: any
  ) {
    const message = typeof error === 'string' ? error : error.message;

    return {
      error: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    };
  }

  /**
   * Create a success response with optional data
   */
  static createSuccessResponse<T = any>(
    data?: T,
    message?: string,
    meta?: Record<string, any>
  ) {
    return {
      success: true,
      message: message || 'Operation successful',
      data,
      timestamp: new Date().toISOString(),
      ...(meta && { meta })
    };
  }

  /**
   * Serialize order data with customer and service information
   */
  static serializeOrder(order: any, includeCustomer = true, includeServices = true) {
    const serialized = this.serializeRecord(order, {
      includeTimestamps: true,
      camelCase: true
    });

    // Handle service data
    if (includeServices && order.serviceId) {
      serialized.serviceIds = Array.isArray(order.serviceId)
        ? order.serviceId
        : order.serviceId.split(',').filter(Boolean);
    }

    if (includeServices && order.service) {
      serialized.services = Array.isArray(order.service)
        ? order.service
        : order.service.split(',').filter(Boolean);
    }

    // Handle customer data
    if (includeCustomer && order.customerId) {
      serialized.customerId = order.customerId;
    }

    // Handle shipping address
    if (order.shippingAddress && typeof order.shippingAddress === 'string') {
      try {
        serialized.shippingAddress = JSON.parse(order.shippingAddress);
      } catch {
        serialized.shippingAddress = { address: order.shippingAddress };
      }
    }

    return serialized;
  }

  /**
   * Serialize customer data with loyalty information
   */
  static serializeCustomer(customer: any, includeLoyalty = true) {
    const serialized = this.serializeRecord(customer, {
      includeTimestamps: true,
      camelCase: true
    });

    // Convert totalSpent to number if it's a string
    if (serialized.totalSpent !== undefined) {
      serialized.totalSpent = typeof serialized.totalSpent === 'string'
        ? parseFloat(serialized.totalSpent)
        : serialized.totalSpent;
    }

    // Convert totalOrders to number if it's a string
    if (serialized.totalOrders !== undefined) {
      serialized.totalOrders = typeof serialized.totalOrders === 'string'
        ? parseInt(serialized.totalOrders)
        : serialized.totalOrders;
    }

    // Convert creditBalance to number if it's a string
    if (serialized.creditBalance !== undefined) {
      serialized.creditBalance = typeof serialized.creditBalance === 'string'
        ? parseFloat(serialized.creditBalance)
        : serialized.creditBalance;
    }

    // Handle loyalty points
    if (includeLoyalty && customer.loyaltyPoints !== undefined) {
      serialized.loyaltyPoints = parseInt(customer.loyaltyPoints) || 0;
    }

    // Handle customer segments
    if (customer.segments && typeof customer.segments === 'string') {
      try {
        serialized.segments = JSON.parse(customer.segments);
      } catch {
        serialized.segments = customer.segments.split(',').filter(Boolean);
      }
    }

    return serialized;
  }

  /**
   * Serialize product data with pricing information
   */
  static serializeProduct(product: any) {
    const serialized = this.serializeRecord(product, {
      includeTimestamps: true,
      camelCase: true
    });

    // Handle pricing
    if (product.price !== undefined) {
      serialized.price = parseFloat(product.price) || 0;
    }

    // Handle categories
    if (product.category && typeof product.category === 'string') {
      serialized.categories = product.category.split(',').filter(Boolean);
    }

    return serialized;
  }

  /**
   * Serialize delivery data with driver and route information
   */
  static serializeDelivery(delivery: any, includeDriver = true, includeRoute = false) {
    const serialized = this.serializeRecord(delivery, {
      includeTimestamps: true,
      camelCase: true
    });

    // Handle driver information
    if (includeDriver && delivery.driverId) {
      serialized.driverId = delivery.driverId;
    }

    // Handle route information
    if (includeRoute && delivery.route) {
      if (typeof delivery.route === 'string') {
        try {
          serialized.route = JSON.parse(delivery.route);
        } catch {
          serialized.route = { waypoints: delivery.route.split(',') };
        }
      } else {
        serialized.route = delivery.route;
      }
    }

    return serialized;
  }
}

// Export commonly used serialization functions with proper binding
export const serializeOrder = (order: any, includeCustomer = true, includeServices = true) =>
  SerializationService.serializeOrder(order, includeCustomer, includeServices);
export const serializeCustomer = (customer: any, includeLoyalty = true) =>
  SerializationService.serializeCustomer(customer, includeLoyalty);
export const serializeProduct = (product: any) =>
  SerializationService.serializeProduct(product);
export const serializeDelivery = (delivery: any, includeDriver = true, includeRoute = false) =>
  SerializationService.serializeDelivery(delivery, includeDriver, includeRoute);
export const createPaginatedResponse = (data: any[], options: any, serializationOptions?: any) =>
  SerializationService.createPaginatedResponse(data, options, serializationOptions);
export const createSearchResponse = (data: any[], query: string, options: any, serializationOptions?: any) =>
  SerializationService.createSearchResponse(data, query, options, serializationOptions);
export const createErrorResponse = (message: string, statusCode: number = 500, error?: any) =>
  SerializationService.createErrorResponse(message, statusCode, error);
export const createSuccessResponse = (data: any, message?: string, meta?: any) =>
  SerializationService.createSuccessResponse(data, message, meta);
