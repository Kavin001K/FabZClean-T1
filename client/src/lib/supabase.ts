import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Realtime features will not work.');
}

// Create and export Supabase client
// Create and export Supabase client
// Use a fallback URL if not provided to prevent crash, but warn user
const validSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const validSupabaseKey = supabaseAnonKey || 'placeholder';

export const isSupabaseConfigured = !validSupabaseUrl.includes('placeholder');

export const supabase = createClient(validSupabaseUrl, validSupabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

