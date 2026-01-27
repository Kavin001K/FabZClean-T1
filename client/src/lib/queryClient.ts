import { QueryClient, QueryFunction, MutationCache } from "@tanstack/react-query";
import { isElectron } from "./utils";
import { getApiUrl } from "./api-config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/${queryKey.join("/")}` as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

// Electron-optimized settings
const electronStaleTime = 10 * 60 * 1000; // 10 minutes for desktop (less network overhead)
const browserStaleTime = 5 * 60 * 1000;   // 5 minutes for browser
const gcTime = 30 * 60 * 1000;            // 30 minutes garbage collection

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: async (_data, _variables, _context, mutation) => {
      // 🧪 Ecosystem Integration: Cross-Page Referencing
      // This listener acts as the "Central Nervous System" for data.
      // When a mutation happens, it intelligently refreshes related parts of the app.

      const mutationKey = mutation.options.mutationKey;

      if (mutationKey) {
        // 1. If an Order is created/updated -> Refresh Inventory & Dashboard
        if (mutationKey.includes('createOrder') || mutationKey.includes('updateOrder')) {
await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['inventory'] }),
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
            queryClient.invalidateQueries({ queryKey: ['orders'] }),
            queryClient.invalidateQueries({ queryKey: ['customers'] })
          ]);
        }

        // 2. If Inventory changes -> Refresh Dashboard
        if (mutationKey.includes('inventory')) {
          await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      }
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: !isElectron(), // Don't refetch on focus in Electron (it's a desktop app)
      refetchOnReconnect: true,            // Refetch when network reconnects
      staleTime: isElectron() ? electronStaleTime : browserStaleTime,
      gcTime: gcTime,                      // Garbage collect old data after 30 min
      retry: (failureCount, error) => {
        // Retry on network errors but not on 4xx client errors
        if (error instanceof Error) {
          const msg = error.message || '';
          // Don't retry on auth errors (401, 403)
          if (msg.startsWith('401') || msg.startsWith('403')) {
            return false;
          }
          // Don't retry on client errors (4xx)
          if (msg.match(/^4\d\d/)) {
            return false;
          }
        }
        // In Electron, retry more times since we're on local network
        const maxRetries = isElectron() ? 4 : 3;
        return failureCount < maxRetries;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Network mode: always fetch from server when online
      networkMode: 'online',
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error instanceof Error) {
          if (error.message.match(/^4\d\d/)) {
            return false;
          }
        }
        return failureCount < 2;
      },
      // Ensure mutations are processed even when offline (queued)
      networkMode: 'online',
    },
  },
});

// Prefetch common data on app load for Electron
export async function prefetchCommonData() {
  if (isElectron()) {
    try {
      // Prefetch commonly used data to warm up the cache
      await Promise.all([
        queryClient.prefetchQuery({ queryKey: ['services'] }),
        queryClient.prefetchQuery({ queryKey: ['customers'] }),
      ]);
    } catch (e) {
      // Silent fail - this is just optimization
      console.debug('Prefetch failed:', e);
    }
  }
}
