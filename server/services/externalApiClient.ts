/**
 * External API Client for FabZClean
 * Provides a robust HTTP client for integrating with third-party APIs
 */

import { config, isExternalApiAvailable, getExternalApiConfig } from '../config';

/**
 * Custom error class for external API errors
 */
export class ExternalApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: any
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
}

export interface ResponseMetadata {
  statusCode: number;
  headers: Record<string, string>;
  responseTime: number;
}

/**
 * External API Client
 * Handles HTTP requests to third-party APIs with authentication and error handling
 */
export class ExternalApiClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultTimeout: number = 10000; // 10 seconds

  constructor() {
    if (!isExternalApiAvailable()) {
      console.warn(
        '⚠️  External API Client initialized without configuration'
      );
      // Set dummy values to prevent runtime errors
      this.apiKey = '';
      this.baseUrl = '';
      return;
    }

    const apiConfig = getExternalApiConfig();
    if (apiConfig) {
      this.apiKey = apiConfig.apiKey;
      this.baseUrl = apiConfig.baseUrl;
    } else {
      this.apiKey = '';
      this.baseUrl = '';
    }
  }

  /**
   * Check if the client is properly configured
   */
  private isConfigured(): boolean {
    return !!(this.apiKey && this.baseUrl);
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Ensure baseUrl doesn't have trailing slash
    const cleanBaseUrl = this.baseUrl.endsWith('/') 
      ? this.baseUrl.slice(0, -1) 
      : this.baseUrl;
    
    let url = `${cleanBaseUrl}/${cleanEndpoint}`;

    // Add query parameters
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      url += `?${searchParams.toString()}`;
    }

    return url;
  }

  /**
   * Build headers for requests
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...customHeaders,
    };

    return headers;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new ExternalApiError(
        'External API is not configured. Please set EXTERNAL_API_KEY and EXTERNAL_API_BASE_URL environment variables.'
      );
    }

    const {
      method = 'GET',
      headers: customHeaders,
      body,
      params,
      timeout = this.defaultTimeout,
    } = options;

    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(customHeaders);

    const startTime = Date.now();

    try {
      console.log(`🌐 [External API] ${method} ${url}`);

      // Create fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      // Check if response is ok
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unable to read error response');
        
        console.error(
          `❌ [External API] ${method} ${url} - ${response.status} ${response.statusText}`
        );
        console.error(`Response body: ${errorBody}`);

        throw new ExternalApiError(
          `External API request failed: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const data = await response.json();

      console.log(
        `✅ [External API] ${method} ${url} - ${response.status} (${responseTime}ms)`
      );

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof ExternalApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(
            `⏱️  [External API] ${method} ${url} - Request timeout after ${timeout}ms`
          );
          throw new ExternalApiError(
            `Request timeout after ${timeout}ms`,
            undefined,
            undefined
          );
        }

        console.error(
          `❌ [External API] ${method} ${url} - Network error (${responseTime}ms)`
        );
        console.error(`Error: ${error.message}`);
        
        throw new ExternalApiError(
          `Network error: ${error.message}`,
          undefined,
          undefined
        );
      }

      throw new ExternalApiError('Unknown error occurred', undefined, undefined);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body,
      ...options,
    });
  }
}

/**
 * Singleton instance of the external API client
 */
export const externalApiClient = new ExternalApiClient();

