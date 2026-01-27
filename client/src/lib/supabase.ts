/**
 * ============================================================================
 * FABZCLEAN - SUPABASE MOCK CLIENT (OFFLINE MODE)
 * ============================================================================
 * 
 * This module provides a complete mock of the Supabase client for offline mode.
 * It supports the fluent query API pattern used throughout the app.
 * 
 * All data operations are redirected to the local SQLite backend via API calls.
 * This allows the app to work completely offline.
 */

export const isSupabaseConfigured = false;

// ============================================================================
// FLUENT QUERY BUILDER MOCK
// ============================================================================

/**
 * Creates a chainable query builder that mimics Supabase's fluent API
 */
const createQueryBuilder = (tableName: string, operation: string = 'select') => {
  let filters: Array<{ type: string; column?: string; value?: any }> = [];
  let selectColumns = '*';
  let limitCount: number | null = null;
  let orderColumn: string | null = null;
  let orderAscending = true;
  let rangeStart: number | null = null;
  let rangeEnd: number | null = null;
  let insertData: any = null;
  let updateData: any = null;
  let isSingle = false;

  const builder: any = {
    // Selection
    select: (columns = '*') => {
      selectColumns = columns;
      return builder;
    },

    // Filters
    eq: (column: string, value: any) => {
      filters.push({ type: 'eq', column, value });
      return builder;
    },
    neq: (column: string, value: any) => {
      filters.push({ type: 'neq', column, value });
      return builder;
    },
    gt: (column: string, value: any) => {
      filters.push({ type: 'gt', column, value });
      return builder;
    },
    gte: (column: string, value: any) => {
      filters.push({ type: 'gte', column, value });
      return builder;
    },
    lt: (column: string, value: any) => {
      filters.push({ type: 'lt', column, value });
      return builder;
    },
    lte: (column: string, value: any) => {
      filters.push({ type: 'lte', column, value });
      return builder;
    },
    like: (column: string, pattern: string) => {
      filters.push({ type: 'like', column, value: pattern });
      return builder;
    },
    ilike: (column: string, pattern: string) => {
      filters.push({ type: 'ilike', column, value: pattern });
      return builder;
    },
    is: (column: string, value: any) => {
      filters.push({ type: 'is', column, value });
      return builder;
    },
    in: (column: string, values: any[]) => {
      filters.push({ type: 'in', column, value: values });
      return builder;
    },
    contains: (column: string, value: any) => {
      filters.push({ type: 'contains', column, value });
      return builder;
    },
    or: (conditions: string) => {
      filters.push({ type: 'or', value: conditions });
      return builder;
    },
    not: (column: string, operator: string, value: any) => {
      filters.push({ type: 'not', column, value: { operator, value } });
      return builder;
    },
    filter: (column: string, operator: string, value: any) => {
      filters.push({ type: 'filter', column, value: { operator, value } });
      return builder;
    },
    match: (query: Record<string, any>) => {
      Object.entries(query).forEach(([column, value]) => {
        filters.push({ type: 'eq', column, value });
      });
      return builder;
    },

    // Modifiers
    order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => {
      orderColumn = column;
      orderAscending = options?.ascending ?? true;
      return builder;
    },
    limit: (count: number) => {
      limitCount = count;
      return builder;
    },
    range: (from: number, to: number) => {
      rangeStart = from;
      rangeEnd = to;
      return builder;
    },
    single: () => {
      isSingle = true;
      return builder;
    },
    maybeSingle: () => {
      isSingle = true;
      return builder;
    },

    // Data operations
    insert: (data: any) => {
      insertData = data;
      return builder;
    },
    update: (data: any) => {
      updateData = data;
      return builder;
    },
    upsert: (data: any) => {
      insertData = data;
      return builder;
    },
    delete: () => {
      return builder;
    },

    // Execution - returns mock data since we use API calls for real data
    then: (resolve: (result: any) => void, reject?: (error: any) => void) => {
      // In offline mock mode, return empty results
      // Real data comes from API calls
      const result = {
        data: isSingle ? null : [],
        error: null,
        count: 0,
        status: 200,
        statusText: 'OK'
      };
      resolve(result);
    },

    // Make it thenable (Promise-like)
    catch: (reject: (error: any) => void) => {
      return builder;
    }
  };

  // Make the builder awaitable
  Object.defineProperty(builder, Symbol.toStringTag, {
    value: 'Promise'
  });

  return builder;
};

// ============================================================================
// STORAGE MOCK
// ============================================================================

const createStorageBucket = (bucketName: string) => ({
  upload: async (path: string, file: any, options?: any) => {
    // In offline mode, use local file storage via API
    console.warn(`[Storage Mock] Upload to ${bucketName}/${path} - use local API instead`);
    return { data: null, error: { message: 'Use local file upload API' } };
  },
  download: async (path: string) => {
    console.warn(`[Storage Mock] Download from ${bucketName}/${path} - use local API instead`);
    return { data: null, error: { message: 'Use local file API' } };
  },
  getPublicUrl: (path: string) => {
    // Return a placeholder URL
    return { data: { publicUrl: `/uploads/${bucketName}/${path}` } };
  },
  remove: async (paths: string[]) => {
    console.warn(`[Storage Mock] Remove from ${bucketName} - use local API instead`);
    return { data: null, error: null };
  },
  list: async (path?: string) => {
    return { data: [], error: null };
  },
  move: async (from: string, to: string) => {
    return { data: null, error: { message: 'Not supported in offline mode' } };
  },
  copy: async (from: string, to: string) => {
    return { data: null, error: { message: 'Not supported in offline mode' } };
  },
  createSignedUrl: async (path: string, expiresIn: number) => {
    return { data: { signedUrl: `/uploads/${bucketName}/${path}` }, error: null };
  },
  createSignedUrls: async (paths: string[], expiresIn: number) => {
    return { data: paths.map(p => ({ signedUrl: `/uploads/${bucketName}/${p}` })), error: null };
  }
});

// ============================================================================
// REALTIME MOCK
// ============================================================================

const createChannel = (channelName: string) => {
  const channel: any = {
    on: (event: string, filter: any, callback?: Function) => {
      // Silence realtime - we use WebSocket for realtime in offline mode
      return channel;
    },
    subscribe: (callback?: Function) => {
      if (callback) callback('SUBSCRIBED');
      return channel;
    },
    unsubscribe: () => {
      return Promise.resolve();
    },
    send: (payload: any) => {
      return Promise.resolve({ status: 'ok' });
    }
  };
  return channel;
};

// ============================================================================
// MAIN SUPABASE MOCK CLIENT
// ============================================================================

export const supabase = {
  // Database queries
  from: (table: string) => createQueryBuilder(table),

  // RPC calls
  rpc: async (fnName: string, params?: any) => {
    console.warn(`[Supabase Mock] RPC call to ${fnName} - use API instead`);
    return { data: null, error: { message: 'Use local API for RPC calls' } };
  },

  // Auth (mock - real auth handled by local JWT)
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async (credentials: any) => {
      console.warn('[Supabase Mock] Use /api/auth/login for authentication');
      return { data: null, error: { message: 'Use local API for authentication' } };
    },
    signUp: async (credentials: any) => {
      return { data: null, error: { message: 'Use local API for registration' } };
    },
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: Function) => {
      // Return a subscription object
      return {
        data: {
          subscription: {
            unsubscribe: () => { }
          }
        }
      };
    },
    updateUser: async (data: any) => {
      return { data: null, error: { message: 'Use local API' } };
    },
    resetPasswordForEmail: async (email: string) => {
      return { data: null, error: { message: 'Use local API' } };
    },
    exchangeCodeForSession: async (code: string) => {
      return { data: null, error: { message: 'Use local API' } };
    },
    refreshSession: async () => {
      return { data: { session: null }, error: null };
    },
    setSession: async (session: any) => {
      return { data: { session: null }, error: null };
    }
  },

  // Storage
  storage: {
    from: (bucket: string) => createStorageBucket(bucket),
    createBucket: async (name: string) => ({ data: null, error: null }),
    getBucket: async (name: string) => ({ data: null, error: null }),
    listBuckets: async () => ({ data: [], error: null }),
    deleteBucket: async (name: string) => ({ data: null, error: null }),
    emptyBucket: async (name: string) => ({ data: null, error: null })
  },

  // Realtime
  channel: (name: string) => createChannel(name),
  removeChannel: async (channel: any) => ({ error: null }),
  removeAllChannels: async () => ({ error: null }),

  // Functions (Edge Functions)
  functions: {
    invoke: async (fnName: string, options?: any) => {
      console.warn(`[Supabase Mock] Function invoke ${fnName} - use API instead`);
      return { data: null, error: { message: 'Use local API' } };
    }
  }
};

// Export a type-safe version
export type SupabaseClient = typeof supabase;

