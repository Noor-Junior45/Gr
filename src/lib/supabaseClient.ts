/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string =
  (import.meta.env?.VITE_SUPABASE_URL as string) ||
  'https://iffdkhzctkbglmvaayeh.supabase.co';

const supabaseAnonKey: string =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
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
