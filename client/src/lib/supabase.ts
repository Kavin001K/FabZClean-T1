// Mock Supabase Client for Local-Only Mode
// This allows the frontend to run without the @supabase/supabase-js dependency

export const isSupabaseConfigured = false;

// detailed mock to prevent crashes on chained calls
const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signInWithPassword: async () => ({ data: null, error: { message: "Supabase disabled" } }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
    eq: () => ({ data: [], error: null }),
    single: () => ({ data: null, error: null }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: { message: "Supabase storage disabled" } }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    })
  },
  channel: () => ({
    on: () => ({ subscribe: () => { } }),
    subscribe: () => { }
  })
};

// @ts-ignore
export const supabase = mockSupabase;

