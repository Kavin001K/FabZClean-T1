/**
 * API Client for FabZClean
 * * This module provides a unified way to make API calls that works in both:
 * 1. Development mode (with backend server)
 * 2. Production mode on static hosting (direct Supabase)
 * * Usage:
 * Instead of: fetch('/api/orders')
 * Use: apiClient.get('/orders')
 */

import { supabase, isSupabaseConfigured } from './supabase-auth';

// Check if we should use direct Supabase (no backend available)
const shouldUseDirectSupabase = (): boolean => {
    if (typeof window === 'undefined') return false;

    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
        return false; // Use the backend API
    }

    // In production mode without explicit API URL, use direct Supabase
    if (import.meta.env.PROD && isSupabaseConfigured) {
        return true;
    }

    return false;
};

// Get the API base URL
const getApiBase = (): string => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) return apiUrl;
    return '/api';
};

// Get access token
const getAccessToken = (): string | null => {
    return localStorage.getItem('employee_token') ||
        localStorage.getItem('access_token');
};

// Standard headers with auth
const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Table name mapping from API endpoints to Supabase tables
const endpointToTable: Record<string, string> = {
    '/orders': 'orders',
    '/customers': 'customers',
    '/employees': 'employees',
    '/services': 'services',
    '/products': 'products',
    '/settings': 'settings',
    '/franchises': 'franchises',
    '/factories': 'factories',
    '/drivers': 'drivers',
    '/documents': 'documents',
    '/tasks': 'tasks',
    '/transit-orders': 'transit_orders',
    '/audit-logs': 'audit_logs',
};

// Parse endpoint to get table name and ID
const parseEndpoint = (endpoint: string): { table: string; id?: string; query?: Record<string, string> } | null => {
    const [path, queryString] = endpoint.split('?');
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0) return null;

    const tablePath = '/' + parts[0];
    const table = endpointToTable[tablePath];

    if (!table) return null;

    const id = parts.length > 1 ? parts[1] : undefined;

    let query: Record<string, string> = {};
    if (queryString) {
        const params = new URLSearchParams(queryString);
        params.forEach((value, key) => {
            query[key] = value;
        });
    }

    return { table, id, query };
};

/**
 * API Client that automatically routes to Supabase or backend
 */
export const apiClient = {
    /**
     * GET request
     */
    async get<T = any>(endpoint: string): Promise<T> {
        const useSupabase = shouldUseDirectSupabase();

        if (useSupabase) {
            const parsed = parseEndpoint(endpoint);
            if (parsed) {
                let query = supabase.from(parsed.table).select('*');

                if (parsed.id) {
                    query = query.eq('id', parsed.id);
                    const { data, error } = await query.single();
                    if (error) throw new Error(error.message);
                    return data as T;
                }

                // Apply query filters
                if (parsed.query) {
                    Object.entries(parsed.query).forEach(([key, value]) => {
                        if (key === 'limit') {
                            query = query.limit(parseInt(value));
                        } else if (key === 'offset') {
                            query = query.range(parseInt(value), parseInt(value) + 99);
                        } else if (key === 'order') {
                            query = query.order(value);
                        } else {
                            query = query.eq(key, value);
                        }
                    });
                }

                const { data, error } = await query;
                if (error) throw new Error(error.message);
                return (data || []) as T;
            }

            // Unsupported endpoint for direct Supabase
            console.warn(`Endpoint ${endpoint} not supported in direct Supabase mode`);
            return [] as unknown as T;
        }

        // Use backend API
        const response = await fetch(`${getApiBase()}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return response.json();
    },

    /**
     * POST request
     */
    async post<T = any>(endpoint: string, data?: any): Promise<T> {
        const useSupabase = shouldUseDirectSupabase();

        if (useSupabase) {
            const parsed = parseEndpoint(endpoint);
            if (parsed && data) {
                const { data: result, error } = await supabase
                    .from(parsed.table)
                    .insert(data)
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                return result as T;
            }

            console.warn(`POST to ${endpoint} not supported in direct Supabase mode`);
            throw new Error('Operation not supported in offline mode');
        }

        // Use backend API
        const response = await fetch(`${getApiBase()}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    },

    /**
     * PUT request
     */
    async put<T = any>(endpoint: string, data?: any): Promise<T> {
        const useSupabase = shouldUseDirectSupabase();

        if (useSupabase) {
            const parsed = parseEndpoint(endpoint);
            if (parsed && parsed.id && data) {
                const { data: result, error } = await supabase
                    .from(parsed.table)
                    .update(data)
                    .eq('id', parsed.id)
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                return result as T;
            }

            console.warn(`PUT to ${endpoint} not supported in direct Supabase mode`);
            throw new Error('Operation not supported in offline mode');
        }

        // Use backend API
        const response = await fetch(`${getApiBase()}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    },

    /**
     * PATCH request
     */
    async patch<T = any>(endpoint: string, data?: any): Promise<T> {
        const useSupabase = shouldUseDirectSupabase();

        if (useSupabase) {
            const parsed = parseEndpoint(endpoint);
            if (parsed && parsed.id && data) {
                const { data: result, error } = await supabase
                    .from(parsed.table)
                    .update(data)
                    .eq('id', parsed.id)
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                return result as T;
            }

            console.warn(`PATCH to ${endpoint} not supported in direct Supabase mode`);
            throw new Error('Operation not supported in offline mode');
        }

        // Use backend API
        const response = await fetch(`${getApiBase()}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    },

    /**
     * DELETE request
     */
    async delete<T = any>(endpoint: string): Promise<T> {
        const useSupabase = shouldUseDirectSupabase();

        if (useSupabase) {
            const parsed = parseEndpoint(endpoint);
            if (parsed && parsed.id) {
                const { error } = await supabase
                    .from(parsed.table)
                    .delete()
                    .eq('id', parsed.id);

                if (error) throw new Error(error.message);
                return { success: true } as T;
            }

            console.warn(`DELETE to ${endpoint} not supported in direct Supabase mode`);
            throw new Error('Operation not supported in offline mode');
        }

        // Use backend API
        const response = await fetch(`${getApiBase()}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    },

    /**
     * Check if direct Supabase mode is active
     */
    isDirectSupabaseMode(): boolean {
        return shouldUseDirectSupabase();
    },

    /**
     * Get the current API base URL
     */
    getBaseUrl(): string {
        return getApiBase();
    },
};

export default apiClient;

/**
 * Compatibility shim for code expecting apiRequest
 * This provides backwards compatibility with code that uses the legacy apiRequest function
 */
export const apiRequest = async <T = any>(method: string, path: string, body?: any): Promise<T> => {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod === 'get') return apiClient.get<T>(path);
    if (lowerMethod === 'post') return apiClient.post<T>(path, body);
    if (lowerMethod === 'put') return apiClient.put<T>(path, body);
    if (lowerMethod === 'patch') return apiClient.patch<T>(path, body);
    if (lowerMethod === 'delete') return apiClient.delete<T>(path);
    throw new Error(`Unsupported method: ${method}`);
};
