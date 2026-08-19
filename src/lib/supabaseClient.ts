import { createClient } from '@supabase/supabase-js';

// Supabase configuration from Vite environment variables or defaults
const env = (import.meta as unknown as { env: Record<string, string> }).env || {};

const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  'https://iffdkhzctkbglmvaayeh.supabase.co';

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_C7DzW73hItwOaxr9R4Z2dw_HtjCqHaS';

/**
 * Shared Supabase Client singleton with persistent session handling
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'giriraj_supabase_auth_session'
  }
});
