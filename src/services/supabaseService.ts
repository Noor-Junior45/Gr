import { supabase } from '../lib/supabaseClient';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Order, OrderStatus, WiringServiceBooking, SavedAddress, UserProfile, Product, isUserAdmin } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { soundService } from './sound';

// Local storage key constants
export const USER_PHONE_KEY = 'giriraj_user_phone';
export const USER_NAME_KEY = 'giriraj_user_name';
export const USER_EMAIL_KEY = 'giriraj_user_email';
export const USER_PHOTO_KEY = 'giriraj_user_photo';
export const USER_DOB_KEY = 'giriraj_user_dob';
export const USER_EMAIL_VERIFIED_KEY = 'giriraj_user_email_verified';
export const USER_WALLET_BALANCE_KEY = 'giriraj_user_wallet_balance';
export const USER_REFUND_BALANCE_KEY = 'giriraj_user_refund_balance';
export const USER_CASHBACK_BALANCE_KEY = 'giriraj_user_cashback_balance';
export const SAVED_ADDRESSES_STORAGE_KEY = 'giriraj_user_addresses_v4';
export const ACTIVE_SAVED_ADDRESS_KEY = 'giriraj_active_address_v4';
export const SAVED_UPI_STORAGE_KEY = 'giriraj_user_saved_upi';
export const ORDERS_STORAGE_KEY = 'giriraj_orders_v2';

// In-memory active user scope to prevent cross-account data leakage
let activeUserScope: string | null = null;

export function setActiveUserScope(scope: string | null): void {
  activeUserScope = scope;
}

export function getActiveUserScope(): string | null {
  return activeUserScope;
}

export function getUserScopeKeyFromUser(user?: { id?: string; email?: string | null; phone?: string | null } | null): string | null {
  if (!user) return null;
  if (user.id) return `uid_${user.id}`;
  if (user.email && user.email.trim()) return `email_${user.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  if (user.phone && user.phone.trim()) return `phone_${user.phone.replace(/\D/g, '')}`;
  return null;
}

/**
 * Purges legacy unscoped global localStorage keys to permanently eliminate cross-user data leakage
 */
export function purgeLegacyUnscopedStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const legacyKeys = [
      'giriraj_user_phone',
      'giriraj_user_name',
      'giriraj_user_email',
      'giriraj_user_photo',
      'giriraj_user_dob',
      'giriraj_user_email_verified',
      'giriraj_user_wallet_balance',
      'giriraj_user_refund_balance',
      'giriraj_user_cashback_balance',
      'giriraj_user_addresses_v4',
      'giriraj_active_address_v4',
      'giriraj_active_address',
      'giriraj_active_landmark',
      'giriraj_user_saved_upi',
      'giriraj_orders_v2',
      'giriraj_customer_orders',
      'giriraj_orders_cache',
      'giriraj_saved_items_v1'
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
}

// Auto-purge legacy shared keys once on load
if (typeof window !== 'undefined') {
  purgeLegacyUnscopedStorage();
}

// Safe LocalStorage helpers for SSR / sandboxed iframe environments
export function safeGetItem(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(key) : null;
  } catch (e) {
    console.warn(`Error reading from localStorage key "${key}":`, e);
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`Error writing to localStorage key "${key}":`, e);
  }
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`Error removing from localStorage key "${key}":`, e);
  }
}

// ============================================================================
// TASK 2: SUPABASE AUTHENTICATION (Google OAuth + Mobile OTP + Email & Password)
// ============================================================================

/**
 * 1. Email & Password Sign-in using Supabase
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });

    if (error) {
      return { user: null, session: null, error };
    }

    if (data.user) {
      const userMeta = data.user.user_metadata || {};
      const name = userMeta.full_name || userMeta.name || email.split('@')[0] || 'Customer';
      saveUserProfile({
        email: data.user.email,
        name,
        emailVerified: !!data.user.email_confirmed_at || !!data.user.confirmed_at
      });
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { user: null, session: null, error };
  }
}

/**
 * 2. Email & Password Sign-up / Registration using Supabase
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: User | null; session: Session | null; error: Error | null; requiresEmailVerification?: boolean }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: fullName?.trim() || 'Giriraj Customer'
        }
      }
    });

    if (error) {
      return { user: null, session: null, error };
    }

    const requiresEmailVerification = !data.session && !!data.user;

    if (data.user) {
      const name = fullName?.trim() || email.split('@')[0] || 'Customer';
      saveUserProfile({
        email: data.user.email,
        name,
        emailVerified: !requiresEmailVerification
      });
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
      requiresEmailVerification
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { user: null, session: null, error };
  }
}

/**
 * 3. Send Password Reset Email using Supabase
 */
export async function resetPasswordForEmail(
  email: string
): Promise<{ error: Error | null; success: boolean }> {
  try {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo
    });

    if (error) {
      return { error, success: false };
    }
    return { error: null, success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { error, success: false };
  }
}

/**
 * 4. Google OAuth Sign-in using Supabase
 */
export async function signInWithGoogle(): Promise<{ error: Error | null; url?: string | null }> {
  try {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: isIframe,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('Supabase Google OAuth error:', error);
      return { error };
    }

    if (isIframe && data?.url) {
      // In an iframe preview (like AI Studio canvas), open in a new window to bypass iframe 403 security blocks
      const authWindow = window.open(data.url, '_blank');
      if (!authWindow) {
        window.location.href = data.url;
      }
    }

    return { error: null, url: data.url };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Unexpected Google OAuth error:', error);
    return { error };
  }
}

/**
 * 2. Send SMS OTP to Mobile Phone number using Supabase Phone Auth
 */
export async function sendPhoneOtp(rawPhone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number' };
    }
    // Format with E.164 country code (India +91)
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      console.warn('Supabase Phone OTP notice:', error.message);
      // If SMS provider not yet activated in dashboard, return friendly message while allowing dev flow
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * 3. Verify SMS OTP using Supabase Phone Auth
 */
export async function verifyPhoneOtp(
  rawPhone: string,
  token: string
): Promise<{ user: User | null; session: Session | null; error?: string }> {
  try {
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: token.trim(),
      type: 'sms'
    });

    if (error) {
      console.warn('Supabase verifyOtp notice:', error.message);
      return { user: null, session: null, error: error.message };
    }

    if (data.user) {
      // Sync user profile immediately
      const defaultName = data.user.user_metadata?.full_name || 'Giriraj Customer';
      saveUserProfile({
        phone: formattedPhone,
        name: defaultName,
        email: data.user.email
      });
    }

    return { user: data.user, session: data.session };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, session: null, error: msg };
  }
}

/**
 * 4. Sign Out from Supabase
 */
export async function signOutUser(): Promise<void> {
  try {
    clearUserProfile();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Supabase sign out error:', error);
  } finally {
    clearUserProfile();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('giriraj_user_logged_out'));
    }
  }
}

/**
 * 5. Global Auth State Listener & Initial Session Getter
 */
export async function getInitialAuthSession(): Promise<{ session: Session | null; user: User | null }> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Initial session notice:', error.message);
      return { session: null, user: null };
    }
    return { session: data.session, user: data.session?.user || null };
  } catch (err) {
    console.warn('Session fetch error:', err);
    return { session: null, user: null };
  }
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null, user: User | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user || null;

    if (event === 'SIGNED_OUT' || (!session && !user && event !== 'INITIAL_SESSION')) {
      clearUserProfile();
      setActiveUserScope(null);
      callback(event, null, null);
      return;
    }

    if (user) {
      const scope = getUserScopeKeyFromUser(user);
      setActiveUserScope(scope);

      // Extract profile details strictly for this authenticated user
      const userMeta = user.user_metadata || {};
      const localProf = scope ? getSavedUserProfile(scope) : null;
      const phone = user.phone || userMeta.phone || localProf?.phone || '';
      const name = userMeta.full_name || userMeta.name || userMeta.custom_claims?.name || localProf?.name || (user.email ? user.email.split('@')[0] : 'Customer');
      const email = user.email || userMeta.email || localProf?.email || '';
      const photoURL = userMeta.avatar_url || userMeta.picture || localProf?.photoURL || undefined;
      const emailVerified = !!user.email_confirmed_at || !!user.confirmed_at;

      saveUserProfile(
        {
          phone,
          name,
          email,
          photoURL,
          emailVerified
        },
        scope || undefined
      );

      // Also upsert profile row to Supabase `user_profiles` table
      syncUserProfileToSupabase(user.id, {
        phone,
        full_name: name,
        email,
        avatar_url: photoURL
      }).catch((e) => console.warn('Background profile sync:', e));
    }
    callback(event, session, user);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Syncs user profile data into Supabase `user_profiles` table with RLS
 */
export async function syncUserProfileToSupabase(
  userId: string,
  profile: { phone?: string; full_name?: string; email?: string; avatar_url?: string }
): Promise<void> {
  try {
    const payload = {
      user_id: userId,
      phone: profile.phone || null,
      full_name: profile.full_name || null,
      email: profile.email || null,
      avatar_url: profile.avatar_url || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('user_profiles upsert note:', error.message);
    }
  } catch (err) {
    console.warn('Profile sync error:', err);
  }
}

/**
 * Get saved user profile from storage & current Supabase session
 */
export function getSavedUserProfile(userScopeOverride?: string): UserProfile | null {
  const scope = userScopeOverride || activeUserScope;
  if (!scope) {
    return null;
  }

  const raw = safeGetItem(`giriraj_profile_${scope}`);
  if (!raw) {
    return null;
  }

  try {
    const prof: UserProfile = JSON.parse(raw);
    if (!prof.phone && !prof.email && (!prof.name || prof.name === 'Customer')) {
      return null;
    }
    const adminStatus = isUserAdmin(prof.email);
    prof.isAdmin = adminStatus;
    prof.role = adminStatus ? 'admin' : 'customer';
    return prof;
  } catch {
    return null;
  }
}

/**
 * Save user profile updates to local state and Supabase
 */
export function saveUserProfile(
  data: {
    phone?: string;
    name?: string;
    email?: string;
    emailVerified?: boolean;
    photoURL?: string;
    dob?: string;
    refundBalance?: number;
    cashbackBalance?: number;
  },
  userScopeOverride?: string
): void {
  const scope =
    userScopeOverride ||
    activeUserScope ||
    (data.email ? getUserScopeKeyFromUser({ email: data.email }) : null) ||
    (data.phone ? getUserScopeKeyFromUser({ phone: data.phone }) : null);

  if (scope) {
    const existing = getSavedUserProfile(scope) || {
      name: 'Customer',
      phone: '',
      email: '',
      emailVerified: false,
      walletBalance: 0,
      refundBalance: 0,
      cashbackBalance: 0
    };

    const effectiveEmail = data.email !== undefined ? data.email : existing.email;
    const adminStatus = isUserAdmin(effectiveEmail);

    const updated: UserProfile = {
      ...existing,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      name: data.name !== undefined ? data.name : existing.name,
      email: effectiveEmail,
      emailVerified: data.emailVerified !== undefined ? data.emailVerified : existing.emailVerified,
      photoURL: data.photoURL !== undefined ? data.photoURL : existing.photoURL,
      dob: data.dob !== undefined ? data.dob : existing.dob,
      refundBalance: data.refundBalance !== undefined ? data.refundBalance : existing.refundBalance,
      cashbackBalance: data.cashbackBalance !== undefined ? data.cashbackBalance : existing.cashbackBalance,
      walletBalance:
        (data.refundBalance !== undefined ? data.refundBalance : existing.refundBalance || 0) +
        (data.cashbackBalance !== undefined ? data.cashbackBalance : existing.cashbackBalance || 0),
      isAdmin: adminStatus,
      role: adminStatus ? 'admin' : 'customer'
    };

    safeSetItem(`giriraj_profile_${scope}`, JSON.stringify(updated));
  }

  // Async sync to Supabase if authenticated
  supabase.auth.getUser().then(({ data: authData }) => {
    if (authData?.user?.id) {
      syncUserProfileToSupabase(authData.user.id, {
        phone: data.phone,
        full_name: data.name,
        email: data.email,
        avatar_url: data.photoURL
      }).catch(() => {});
    }
  });
}

export function clearUserProfile(): void {
  // We detach the active in-memory session on log out, but MUST NOT delete
  // the user's persisted orders or saved addresses from localStorage.
  // This ensures that when the user logs back in with their account, their
  // full order history and addresses are immediately preserved and restored.
  activeUserScope = null;
}

// ============================================================================
// TASK 3: PER-USER ORDERS & REAL-TIME DATA ISOLATION (Supabase Database)
// ============================================================================

type OrderListener = (orders: Order[]) => void;
const orderListeners: Set<OrderListener> = new Set();
const adminOrderListeners: Set<OrderListener> = new Set();
let ordersChannel: ReturnType<typeof supabase.channel> | null = null;
let adminOrdersChannel: ReturnType<typeof supabase.channel> | null = null;

function isRealOrder(order: Order): boolean {
  if (!order || !order.id) return false;
  if (order.id.includes('7001') || order.id.toLowerCase().includes('demo')) return false;
  if (order.customerName === 'Anindya Chatterjee') return false;
  return true;
}

export function getStoredOrders(userScopeOverride?: string): Order[] {
  try {
    const scope = userScopeOverride || activeUserScope;
    const collectedOrders: Order[] = [];
    const seenIds = new Set<string>();

    const addOrders = (orders: Order[]) => {
      if (!Array.isArray(orders)) return;
      for (const order of orders) {
        if (order && order.id && isRealOrder(order) && !seenIds.has(order.id)) {
          seenIds.add(order.id);
          collectedOrders.push(order);
        }
      }
    };

    // 1. Direct scoped storage
    if (scope) {
      const raw = safeGetItem(`giriraj_orders_${scope}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          addOrders(parsed);
        } catch {
          // ignore
        }
      }
    }

    // 2. Multi-key scanning for user across device storage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const totalKeys = localStorage.length;
        for (let i = 0; i < totalKeys; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('giriraj_orders_')) {
            // If scope is specified, check matching scope or match identifiers
            if (!scope || key === `giriraj_orders_${scope}` || (scope && key.includes(scope.replace(/^(uid_|email_|phone_)/, '')))) {
              const raw = localStorage.getItem(key);
              if (raw) {
                try {
                  const parsed = JSON.parse(raw);
                  addOrders(parsed);
                } catch {
                  // ignore
                }
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Master persistent device orders (records associated with this user)
    const masterRaw = safeGetItem('giriraj_master_orders');
    if (masterRaw) {
      try {
        const masterList: any[] = JSON.parse(masterRaw);
        if (Array.isArray(masterList)) {
          const filtered = masterList.filter((entry) => {
            if (!scope) return true;
            if (entry.userScope === scope) return true;
            if (entry.user_id && scope.includes(entry.user_id)) return true;
            if (entry.customerEmail && scope.toLowerCase().includes(entry.customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_'))) return true;
            if (entry.phone && scope.includes(entry.phone.replace(/\D/g, ''))) return true;
            return false;
          });
          addOrders(filtered);
        }
      } catch {
        // ignore
      }
    }

    // Sort newest first
    collectedOrders.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return collectedOrders;
  } catch (e) {
    console.error('Failed reading orders from storage', e);
    return [];
  }
}

export function clearAllStoredOrders(): void {
  try {
    if (activeUserScope) {
      localStorage.removeItem(`giriraj_orders_${activeUserScope}`);
    }
    notifyOrderListeners([]);
  } catch (e) {
    console.error('Failed clearing orders', e);
  }
}

/**
 * Deletes / clears all order history from Supabase table and local caches for all users
 */
export async function clearAllOrdersFromSupabase(): Promise<{ success: boolean; error?: string }> {
  try {
    // Clear local caches
    clearAllStoredOrders();

    // Delete all records from Supabase `orders` table
    const { error } = await supabase
      .from('orders')
      .delete()
      .gte('id', '');

    if (error) {
      console.warn('Supabase orders delete note:', error.message);
      return { success: false, error: error.message };
    }

    notifyOrderListeners([]);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error clearing orders from Supabase:', msg);
    return { success: false, error: msg };
  }
}

function notifyOrderListeners(orders: Order[]) {
  orderListeners.forEach((listener) => {
    try {
      listener(orders);
    } catch (e) {
      console.error('Error notifying order listener', e);
    }
  });
}

function notifyAdminOrderListeners(orders: Order[]) {
  adminOrderListeners.forEach((listener) => {
    try {
      listener(orders);
    } catch (e) {
      console.error('Error notifying admin order listener', e);
    }
  });
}

// Global fetch helper for orders - strictly isolates per authenticated user
export async function fetchUserOrders(): Promise<Order[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    // If not logged in, but activeUserScope exists, fetch stored orders
    if (!userData?.user?.id) {
      if (!activeUserScope) {
        notifyOrderListeners([]);
        return [];
      }
      const stored = getStoredOrders(activeUserScope);
      notifyOrderListeners(stored);
      return stored;
    }

    const user = userData.user;
    const scope = getUserScopeKeyFromUser(user);
    if (scope) {
      activeUserScope = scope;
    }

    const email = user.email ? user.email.trim().toLowerCase() : '';
    const phone = user.phone ? user.phone.replace(/\D/g, '') : '';

    let query = supabase.from('orders').select('*');
    const orClauses: string[] = [`user_id.eq.${user.id}`];
    if (email && email.includes('@')) {
      orClauses.push(`customer_email.ilike.${email}`);
    }
    if (phone && phone.length >= 10) {
      orClauses.push(`phone.ilike.%${phone.slice(-10)}%`);
    }

    query = query.or(orClauses.join(','));

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    const localOrders = getStoredOrders(scope || undefined);

    if (!error && Array.isArray(data)) {
      const dbOrders: Order[] = data.map((row) => ({
        id: row.id,
        customerName: row.customer_name || 'Customer',
        phone: row.phone || '',
        customerEmail: row.customer_email || undefined,
        address: row.address || row.delivery_address || '',
        area: row.area || 'Salt Lake Sector V',
        landmark: row.landmark || undefined,
        pincode: row.pincode || '700091',
        items: row.items || [],
        itemTotal: Number(row.item_total || 0),
        deliveryFee: Number(row.delivery_fee || 0),
        handlingFee: Number(row.handling_fee || 0),
        discount: Number(row.discount || 0),
        totalAmount: Number(row.total_amount || 0),
        paymentMethod: row.payment_method || 'cod',
        paymentStatus: row.payment_status || 'pending',
        status: row.status || 'pending',
        createdAt: row.created_at || new Date().toISOString(),
        estimatedDeliveryTimestamp: Number(row.estimated_delivery_timestamp || Date.now() + 3600000),
        deliveryPartner: row.delivery_partner || undefined,
        notes: row.notes || undefined
      })).filter(isRealOrder);

      // Merge DB orders and local orders to ensure no orders are missing
      const mergedMap = new Map<string, Order>();
      dbOrders.forEach((o) => mergedMap.set(o.id, o));
      localOrders.forEach((o) => {
        if (!mergedMap.has(o.id)) {
          mergedMap.set(o.id, o);
        }
      });

      const finalOrders = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      if (scope) {
        safeSetItem(`giriraj_orders_${scope}`, JSON.stringify(finalOrders));
      }
      notifyOrderListeners(finalOrders);
      return finalOrders;
    } else {
      // If DB returned error or empty, preserve local stored orders
      if (localOrders.length > 0) {
        notifyOrderListeners(localOrders);
        return localOrders;
      }
    }
  } catch (err) {
    console.warn('Supabase orders fetch notice:', err);
    const fallback = getStoredOrders();
    notifyOrderListeners(fallback);
    return fallback;
  }
  return [];
}

/**
 * Fetch all orders strictly for Store Admin management
 */
export async function fetchAllAdminOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      const allOrders: Order[] = data.map((row) => ({
        id: row.id,
        customerName: row.customer_name || 'Customer',
        phone: row.phone || '',
        customerEmail: row.customer_email || undefined,
        address: row.address || row.delivery_address || '',
        area: row.area || 'Salt Lake Sector V',
        landmark: row.landmark || undefined,
        pincode: row.pincode || '700091',
        items: row.items || [],
        itemTotal: Number(row.item_total || 0),
        deliveryFee: Number(row.delivery_fee || 0),
        handlingFee: Number(row.handling_fee || 0),
        discount: Number(row.discount || 0),
        totalAmount: Number(row.total_amount || 0),
        paymentMethod: row.payment_method || 'cod',
        paymentStatus: row.payment_status || 'pending',
        status: row.status || 'pending',
        createdAt: row.created_at || new Date().toISOString(),
        estimatedDeliveryTimestamp: Number(row.estimated_delivery_timestamp || Date.now() + 3600000),
        deliveryPartner: row.delivery_partner || undefined,
        notes: row.notes || undefined
      })).filter(isRealOrder);

      notifyAdminOrderListeners(allOrders);
      return allOrders;
    }
  } catch (err) {
    console.warn('Supabase admin orders fetch error:', err);
  }
  return [];
}

/**
 * Subscribe to store-wide orders strictly for Store Admin Portal
 */
export function subscribeToAdminOrders(listener: OrderListener): () => void {
  adminOrderListeners.add(listener);
  fetchAllAdminOrders().then((orders) => listener(orders));

  if (!adminOrdersChannel) {
    adminOrdersChannel = supabase
      .channel('admin_orders_realtime_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchAllAdminOrders();
        }
      )
      .subscribe();
  }

  return () => {
    adminOrderListeners.delete(listener);
    if (adminOrderListeners.size === 0 && adminOrdersChannel) {
      supabase.removeChannel(adminOrdersChannel);
      adminOrdersChannel = null;
    }
  };
}

/**
 * Fetch and Subscribe to Orders from Supabase with per-user data isolation
 */
export function subscribeToOrders(listener: OrderListener): () => void {
  orderListeners.add(listener);
  // Send user-scoped cached state first for immediate UI display
  listener(getStoredOrders());

  // Fetch initial orders for the active user
  fetchUserOrders();

  // Initialize singleton channel only once across all subscribers
  if (!ordersChannel) {
    ordersChannel = supabase
      .channel('orders_realtime_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchUserOrders();
        }
      )
      .subscribe();
  }

  return () => {
    orderListeners.delete(listener);
    if (orderListeners.size === 0 && ordersChannel) {
      supabase.removeChannel(ordersChannel);
      ordersChannel = null;
    }
  };
}

/**
 * Creates an order in Supabase `orders` table attaching the user's ID
 */
export async function createFirestoreOrder(order: Order): Promise<Order> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;
  const scope =
    getUserScopeKeyFromUser(authData?.user) ||
    (order.customerEmail ? getUserScopeKeyFromUser({ email: order.customerEmail }) : null) ||
    (order.phone ? getUserScopeKeyFromUser({ phone: order.phone }) : null);

  if (scope) {
    activeUserScope = scope;
    const currentOrders = getStoredOrders(scope);
    const updatedOrders = [order, ...currentOrders.filter((o) => o.id !== order.id)];
    safeSetItem(`giriraj_orders_${scope}`, JSON.stringify(updatedOrders));
    notifyOrderListeners(updatedOrders);
  }

  // Also persist by specific keys if available
  if (authData?.user?.id) {
    const uOrders = getStoredOrders(`uid_${authData.user.id}`);
    safeSetItem(`giriraj_orders_uid_${authData.user.id}`, JSON.stringify([order, ...uOrders.filter((o) => o.id !== order.id)]));
  }
  if (order.customerEmail) {
    const cleanEmail = order.customerEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const eOrders = getStoredOrders(`email_${cleanEmail}`);
    safeSetItem(`giriraj_orders_email_${cleanEmail}`, JSON.stringify([order, ...eOrders.filter((o) => o.id !== order.id)]));
  }
  if (order.phone) {
    const cleanPhone = order.phone.replace(/\D/g, '');
    const pOrders = getStoredOrders(`phone_${cleanPhone}`);
    safeSetItem(`giriraj_orders_phone_${cleanPhone}`, JSON.stringify([order, ...pOrders.filter((o) => o.id !== order.id)]));
  }

  // Master persistent list
  try {
    const masterRaw = safeGetItem('giriraj_master_orders');
    const masterList: any[] = masterRaw ? JSON.parse(masterRaw) : [];
    const masterOrder = { ...order, userScope: scope, user_id: userId };
    const updatedMaster = [masterOrder, ...masterList.filter((o) => o.id !== order.id)];
    safeSetItem('giriraj_master_orders', JSON.stringify(updatedMaster.slice(0, 100)));
  } catch {
    // ignore
  }

  // Sound chime alert
  soundService.playNewOrderChime();

  try {
    const rowPayload = {
      id: order.id,
      user_id: userId,
      customer_name: order.customerName,
      phone: order.phone,
      customer_email: order.customerEmail || null,
      address: order.address,
      area: order.area,
      landmark: order.landmark || null,
      pincode: order.pincode,
      items: order.items,
      item_total: order.itemTotal,
      delivery_fee: order.deliveryFee,
      handling_fee: order.handlingFee,
      discount: order.discount,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      status: order.status,
      created_at: order.createdAt || new Date().toISOString(),
      estimated_delivery_timestamp: order.estimatedDeliveryTimestamp,
      delivery_partner: order.deliveryPartner || null,
      notes: order.notes || null
    };

    const { error } = await supabase.from('orders').insert(rowPayload);
    if (error) {
      console.warn('Supabase order insert note:', error.message);
    }

    // Refresh admin orders feed if admin portal is listening
    fetchAllAdminOrders().catch(() => {});

    // Update product stock counts in backend database when items sell
    if (Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        if (!item?.product?.id) continue;
        try {
          const { data: prodData } = await supabase
            .from('products')
            .select('id, stock_quantity, stock_count')
            .eq('id', String(item.product.id))
            .single();

          if (prodData) {
            const currentStock = Number(prodData.stock_quantity ?? prodData.stock_count ?? 50);
            const newStock = Math.max(0, currentStock - (item.quantity || 1));
            await supabase
              .from('products')
              .update({
                stock_quantity: newStock,
                stock_count: newStock,
                in_stock: newStock > 0
              })
              .eq('id', String(item.product.id));
          }
        } catch (stockErr) {
          console.warn(`Stock decrement note for product ${item.product.id}:`, stockErr);
        }
      }
    }
  } catch (error) {
    console.warn('Order database insert error:', error);
  }

  // Analytics event
  if (typeof (window as unknown as { trackGirirajEvent?: (name: string, p: object) => void }).trackGirirajEvent === 'function') {
    (window as unknown as { trackGirirajEvent: (name: string, p: object) => void }).trackGirirajEvent('purchase', {
      transaction_id: order.id,
      value: order.totalAmount,
      currency: 'INR',
      shipping: order.deliveryFee,
      items: order.items.map((i) => ({
        item_id: i.product.id,
        item_name: i.product.name,
        price: i.product.price,
        quantity: i.quantity
      }))
    });
  }

  return order;
}

/**
 * Updates order status in Supabase
 */
export async function updateOrderStatusInFirestore(orderId: string, newStatus: OrderStatus): Promise<void> {
  let updatedDeliveryPartner = undefined;

  if (newStatus === 'out_for_delivery') {
    updatedDeliveryPartner = {
      name: 'Bikash Mondal ⚡',
      phone: '+91 87774 00280',
      vehicleNumber: 'WB 07 C 1089',
      currentHub: 'Giriraj Power Kasba Hub'
    };
  }

  if (activeUserScope) {
    const currentOrders = getStoredOrders(activeUserScope);
    const updatedOrders = currentOrders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          deliveryPartner: updatedDeliveryPartner || o.deliveryPartner
        };
      }
      return o;
    });

    safeSetItem(`giriraj_orders_${activeUserScope}`, JSON.stringify(updatedOrders));
    notifyOrderListeners(updatedOrders);
  }

  try {
    const updatePayload: Record<string, unknown> = {
      status: newStatus
    };
    if (updatedDeliveryPartner) {
      updatePayload.delivery_partner = updatedDeliveryPartner;
    }
    await supabase.from('orders').update(updatePayload).eq('id', orderId);
    fetchAllAdminOrders().catch(() => {});
  } catch (error) {
    console.warn('Supabase update order error:', error);
  }
}

/**
 * Service Booking in Supabase
 */
export async function createFirestoreServiceBooking(booking: WiringServiceBooking): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    await supabase.from('wiring_service_bookings').insert({
      id: booking.id,
      user_id: userId,
      service_title: booking.serviceTitle,
      service_category: booking.serviceCategory,
      project_type: booking.projectType,
      approx_area_sq_ft: booking.approxAreaSqFt,
      preferred_date: booking.preferredDate,
      preferred_time_slot: booking.preferredTimeSlot,
      site_address: booking.siteAddress,
      area: booking.area,
      pincode: booking.pincode,
      contact_name: booking.contactName,
      contact_phone: booking.contactPhone,
      contact_email: booking.contactEmail || null,
      estimated_price: booking.estimatedPrice,
      wire_grade: booking.wireGrade,
      notes: booking.notes || null,
      status: booking.status,
      created_at: booking.createdAt
    });
  } catch (error) {
    console.warn('Supabase service booking error:', error);
  }
}

// ============================================================================
// SAVED ADDRESSES (Supabase `saved_addresses` table with RLS)
// ============================================================================

type AddressListener = (addresses: SavedAddress[]) => void;
const addressListeners: Set<AddressListener> = new Set();
let addressesChannel: ReturnType<typeof supabase.channel> | null = null;

export function getStoredAddresses(userScopeOverride?: string): SavedAddress[] {
  try {
    const scope = userScopeOverride || activeUserScope;
    if (!scope) return [];
    const raw = localStorage.getItem(`giriraj_addrs_${scope}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading saved addresses:', e);
    return [];
  }
}

export async function fetchUserAddresses(): Promise<SavedAddress[]> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      notifyAddressListeners([]);
      return [];
    }

    const scope = getUserScopeKeyFromUser(authData.user);
    if (scope) {
      activeUserScope = scope;
    }

    const { data, error } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      const list: SavedAddress[] = data.map((row) => ({
        id: row.id,
        tag: row.tag || 'home',
        tagLabel: row.tag_label || undefined,
        houseName: row.house_name || '',
        houseFlat: row.house_flat || '',
        buildingRoad: row.building_road || '',
        landmark: row.landmark || undefined,
        area: row.area_data || {
          name: row.area_name || 'Salt Lake Sector V',
          pincode: row.pincode || '700091',
          zone: 'East',
          hub: 'Salt Lake Sector V Hub',
          deliveryMinutes: 60,
          serviceable: true
        },
        lat: row.lat,
        lng: row.lng,
        formattedExactAddress: row.formatted_exact_address,
        receiverName: row.receiver_name,
        receiverPhone: row.receiver_phone,
        createdAt: row.created_at
      }));

      if (scope) {
        safeSetItem(`giriraj_addrs_${scope}`, JSON.stringify(list));
      }
      notifyAddressListeners(list);
      return list;
    }
  } catch (e) {
    console.warn('Addresses fetch notice:', e);
  }
  return [];
}

function notifyAddressListeners(addresses: SavedAddress[]) {
  addressListeners.forEach((l) => {
    try {
      l(addresses);
    } catch (e) {
      console.warn('Address listener notice:', e);
    }
  });
}

export function subscribeToAddresses(listener: AddressListener): () => void {
  addressListeners.add(listener);
  listener(getStoredAddresses());

  fetchUserAddresses();

  if (!addressesChannel) {
    addressesChannel = supabase
      .channel('addresses_realtime_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_addresses' },
        () => fetchUserAddresses()
      )
      .subscribe();
  }

  return () => {
    addressListeners.delete(listener);
    if (addressListeners.size === 0 && addressesChannel) {
      supabase.removeChannel(addressesChannel);
      addressesChannel = null;
    }
  };
}

export async function saveAddressToFirestore(address: SavedAddress): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;
  const scope = getUserScopeKeyFromUser(authData?.user) || activeUserScope;

  if (scope) {
    const current = getStoredAddresses(scope).filter((a) => a.id !== address.id);
    const updated = [address, ...current];
    safeSetItem(`giriraj_addrs_${scope}`, JSON.stringify(updated));
    safeSetItem(`giriraj_active_addr_${scope}`, JSON.stringify(address));
    notifyAddressListeners(updated);
  }

  try {
    const rowPayload = {
      id: address.id,
      user_id: userId,
      tag: address.tag,
      tag_label: address.tagLabel || null,
      house_name: address.houseName,
      house_flat: address.houseFlat,
      building_road: address.buildingRoad,
      landmark: address.landmark || null,
      area_name: address.area?.name || 'Kolkata',
      pincode: address.area?.pincode || '700001',
      area_data: address.area,
      lat: address.lat || null,
      lng: address.lng || null,
      formatted_exact_address: address.formattedExactAddress || null,
      receiver_name: address.receiverName || null,
      receiver_phone: address.receiverPhone || null,
      created_at: address.createdAt || new Date().toISOString()
    };

    await supabase.from('saved_addresses').upsert(rowPayload, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase save address error:', err);
  }
}

export async function deleteAddressFromFirestore(id: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const scope = getUserScopeKeyFromUser(authData?.user) || activeUserScope;

  if (scope) {
    const current = getStoredAddresses(scope);
    const updated = current.filter((a) => a.id !== id);
    safeSetItem(`giriraj_addrs_${scope}`, JSON.stringify(updated));
    notifyAddressListeners(updated);
  }

  try {
    if (authData?.user?.id) {
      await supabase.from('saved_addresses').delete().eq('id', id).eq('user_id', authData.user.id);
    } else {
      await supabase.from('saved_addresses').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('Supabase delete address error:', err);
  }
}

// ============================================================================
// SAVED UPI IDS (Supabase `saved_upi_ids` table with RLS)
// ============================================================================

type UpiListener = (upis: string[]) => void;
const upiListeners = new Set<UpiListener>();

export function getStoredUpiIds(userScopeOverride?: string): string[] {
  try {
    const scope = userScopeOverride || activeUserScope;
    if (!scope) return [];
    const raw = localStorage.getItem(`giriraj_upi_${scope}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function notifyUpiListeners(upis: string[]) {
  upiListeners.forEach((l) => {
    try {
      l(upis);
    } catch (e) {
      // ignore
    }
  });
}

export function subscribeToUpiIds(listener: UpiListener): () => void {
  upiListeners.add(listener);
  listener(getStoredUpiIds());

  async function fetchUpiIds() {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.id) {
        notifyUpiListeners([]);
        return;
      }
      const scope = getUserScopeKeyFromUser(authData.user);
      const { data, error } = await supabase
        .from('saved_upi_ids')
        .select('upi_id')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (!error && data) {
        const list = data.map((r) => r.upi_id).filter(Boolean);
        if (scope) {
          safeSetItem(`giriraj_upi_${scope}`, JSON.stringify(list));
        }
        notifyUpiListeners(list);
      }
    } catch (e) {
      console.warn('UPI fetch note:', e);
    }
  }

  fetchUpiIds();

  return () => {
    upiListeners.delete(listener);
  };
}

export async function saveUpiToFirestore(upiId: string): Promise<void> {
  const cleanUpi = upiId.trim().toLowerCase();
  if (!cleanUpi) return;
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;
  const scope = getUserScopeKeyFromUser(authData?.user) || activeUserScope;

  if (scope) {
    const current = getStoredUpiIds(scope).filter((u) => u.toLowerCase() !== cleanUpi);
    const updated = [cleanUpi, ...current];
    safeSetItem(`giriraj_upi_${scope}`, JSON.stringify(updated));
    notifyUpiListeners(updated);
  }

  try {
    await supabase.from('saved_upi_ids').upsert({
      upi_id: cleanUpi,
      user_id: userId,
      created_at: new Date().toISOString()
    }, { onConflict: 'upi_id,user_id' });
  } catch (err) {
    console.warn('Supabase save upi error:', err);
  }
}

export async function deleteUpiFromFirestore(upiId: string): Promise<void> {
  const cleanUpi = upiId.trim().toLowerCase();
  const { data: authData } = await supabase.auth.getUser();
  const scope = getUserScopeKeyFromUser(authData?.user) || activeUserScope;

  if (scope) {
    const current = getStoredUpiIds(scope);
    const updated = current.filter((u) => u.toLowerCase() !== cleanUpi);
    safeSetItem(`giriraj_upi_${scope}`, JSON.stringify(updated));
    notifyUpiListeners(updated);
  }

  try {
    if (authData?.user?.id) {
      await supabase.from('saved_upi_ids').delete().eq('upi_id', cleanUpi).eq('user_id', authData.user.id);
    } else {
      await supabase.from('saved_upi_ids').delete().eq('upi_id', cleanUpi);
    }
  } catch (err) {
    console.warn('Supabase delete upi error:', err);
  }
}

// ============================================================================
// TASK: SUPABASE PRODUCTS CATALOG SYNC & MANAGEMENT
// ============================================================================

/**
 * Saves/syncs all catalog products into Supabase `products` table
 */
export async function syncAllProductsToSupabase(
  customProducts?: Product[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const productsToSync = customProducts || INITIAL_PRODUCTS;
    const rows = productsToSync.map((p) => {
      const price = Number(p.price || 0);
      const mrp = Number(p.originalPrice || price);
      const discount = Number(p.discountPercentage || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0));
      return {
        id: String(p.id),
        name: p.name,
        brand: p.brand,
        category: p.category || 'electrical',
        subcategory: p.subCategory || 'General',
        sub_category: p.subCategory || 'General',
        price,
        mrp,
        original_price: mrp,
        discount_percent: discount,
        discount_percentage: discount,
        unit: p.unit || '1 pc',
        rating_avg: p.rating || 4.8,
        rating: p.rating || 4.8,
        rating_count: p.reviewsCount || 50,
        reviews_count: p.reviewsCount || 50,
        delivery_minutes: p.deliveryMinutes || 30,
        image: p.image,
        image_urls: [p.image || 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop'],
        in_stock: p.inStock ?? true,
        stock_quantity: p.stockCount || 50,
        stock_count: p.stockCount || 50,
        tags: p.tags || [],
        is_emergency: !!p.isEmergency,
        is_best_seller: !!p.isBestSeller,
        specs: p.specs || {},
        specifications: p.specs || {},
        description: p.description || '',
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase products upsert notice:', error.message);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: rows.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Error syncing products to Supabase:', msg);
    return { success: false, count: 0, error: msg };
  }
}

/**
 * Fetches live products strictly from Supabase `products` table (Strict Database Mode)
 */
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      return data.map((row) => ({
        id: String(row.id),
        name: row.name || 'Product',
        brand: row.brand || 'Giriraj Genuine',
        category: row.category || 'electrical',
        subCategory: row.sub_category || row.subcategory || row.subCategory || 'General',
        price: Number(row.price || 0),
        originalPrice: Number(row.original_price || row.originalPrice || row.mrp || (row.price ? row.price * 1.15 : 0)),
        discountPercentage: Number(row.discount_percentage || row.discountPercentage || 0),
        unit: row.unit || '1 pc',
        rating: Number(row.rating || row.rating_avg || 4.8),
        reviewsCount: Number(row.reviews_count || row.rating_count || 50),
        deliveryMinutes: Number(row.delivery_minutes || row.deliveryMinutes || 30),
        image: row.image || (Array.isArray(row.image_urls) && row.image_urls.length > 0 ? row.image_urls[0] : 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop'),
        inStock: row.in_stock ?? row.inStock ?? true,
        stockCount: Number(row.stock_count || row.stock_quantity || 50),
        tags: row.tags || [],
        isEmergency: !!(row.is_emergency ?? row.isEmergency),
        isBestSeller: !!(row.is_best_seller ?? row.isBestSeller),
        specs: row.specs || (typeof row.specifications === 'object' ? row.specifications : {}),
        description: row.description || ''
      }));
    }
  } catch (err) {
    console.warn('Supabase products fetch error:', err);
  }

  return [];
}

