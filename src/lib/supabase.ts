import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Supabase client instance strictly meant for src/services layer
export const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey || env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
