import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    rawUrl &&
    rawKey &&
    rawUrl !== 'https://your-project.supabase.co' &&
    rawKey !== 'your-anon-key-here' &&
    rawUrl.startsWith('https://')
  );
};

export const getSupabaseUrl = (): string => rawUrl;

// Fallback dummy URL to prevent createClient initialization crash when unconfigured
const validUrl = isSupabaseConfigured() ? rawUrl : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured() ? rawKey : 'placeholder-anon-key';

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
