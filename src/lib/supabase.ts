import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Supabase client instance strictly meant for client-side queries
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
