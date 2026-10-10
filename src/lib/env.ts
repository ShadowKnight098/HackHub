import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_MAP_STYLE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_MAP_STYLE_URL: import.meta.env.VITE_MAP_STYLE_URL,
});

if (!parsed.success) {
  console.warn(
    'Environment variable validation warning:\n',
    parsed.error.format()
  );
}

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://mfvselzziedqohiiswqy.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseSecretKey: import.meta.env.VITE_SUPABASE_SECRET_KEY || '',
  mapStyleUrl: import.meta.env.VITE_MAP_STYLE_URL || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  isConfigured: Boolean(import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_ANON_KEY),
};
