/**
 * Axios/API Configuration
 * Handles API base URL configuration for production and development environments
 */

// Get API base URL from environment variable or use relative path
function getApiBaseUrl() {
  // Check for explicit API URL in environment (highest priority)
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  }

  // In production (Vercel/Render), use relative path which will work with rewrites/proxy
  if (import.meta.env.PROD) {
    // For Vercel: use relative path (handled by rewrites)
    // For Render: use relative path (same origin)
    return '/api';
  }

  // In development, use relative path (handled by Vite proxy)
  return '/api';
}

// Get WebSocket URL for production vs development
export function getWebSocketUrl() {
  // Check for explicit WebSocket URL in environment
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (wsUrl) {
    return wsUrl;
  }

  // Use standard WebSocket URL construction based on current protocol/host
  // This works for local dev (ws://localhost:5000) and Render (wss://app-name.onrender.com)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
}

// Export API base URL
export const API_BASE_URL = getApiBaseUrl();

// Create a fetch wrapper that uses the correct API base URL
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Get auth token if available
  const token = localStorage.getItem('employee_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Export default configuration
export default {
  baseURL: API_BASE_URL,
  getWebSocketUrl,
  apiRequest,
};


