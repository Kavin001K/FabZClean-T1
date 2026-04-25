import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseRealtimeEnabled =
  isSupabaseConfigured &&
  (import.meta.env.PROD || String(import.meta.env.VITE_ENABLE_SUPABASE_REALTIME).toLowerCase() === 'true');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
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
  } as any);
