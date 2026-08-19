import { supabase } from '../lib/supabaseClient';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Order, OrderStatus, WiringServiceBooking, SavedAddress, UserProfile } from '../types';
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
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
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
 * 5. Global Auth State Listener
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null, user: User | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user || null;

    if (event === 'SIGNED_OUT' || (!session && !user && event !== 'INITIAL_SESSION')) {
      clearUserProfile();
      callback(event, null, null);
      return;
    }

    if (user) {
      // Extract profile details
      const userMeta = user.user_metadata || {};
      const phone = user.phone || userMeta.phone || safeGetItem(USER_PHONE_KEY) || '';
      const name = userMeta.full_name || userMeta.name || userMeta.custom_claims?.name || safeGetItem(USER_NAME_KEY) || (user.email ? user.email.split('@')[0] : 'Customer');
      const email = user.email || userMeta.email || safeGetItem(USER_EMAIL_KEY) || '';
      const photoURL = userMeta.avatar_url || userMeta.picture || safeGetItem(USER_PHOTO_KEY) || undefined;
      const emailVerified = !!user.email_confirmed_at || !!user.confirmed_at;

      saveUserProfile({
        phone,
        name,
        email,
        photoURL,
        emailVerified
      });

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
export function getSavedUserProfile(): UserProfile | null {
  const phone = safeGetItem(USER_PHONE_KEY) || '';
  const name = safeGetItem(USER_NAME_KEY) || '';
  const email = safeGetItem(USER_EMAIL_KEY) || '';
  const photoURL = safeGetItem(USER_PHOTO_KEY) || '';
  const dob = safeGetItem(USER_DOB_KEY) || '';
  const emailVerified = safeGetItem(USER_EMAIL_VERIFIED_KEY) === 'true';
  const refundBalance = Number(safeGetItem(USER_REFUND_BALANCE_KEY)) || 0;
  const cashbackBalance = Number(safeGetItem(USER_CASHBACK_BALANCE_KEY)) || 0;
  const walletBalance = refundBalance + cashbackBalance;

  if (!phone && !email && (!name || name === 'Kolkata Customer')) {
    return null;
  }

  return {
    phone,
    name: name || 'Customer',
    email,
    emailVerified,
    photoURL: photoURL || undefined,
    dob,
    walletBalance,
    refundBalance,
    cashbackBalance
  };
}

/**
 * Save user profile updates to local state and Supabase
 */
export function saveUserProfile(data: {
  phone?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  photoURL?: string;
  dob?: string;
  refundBalance?: number;
  cashbackBalance?: number;
}): void {
  if (data.phone !== undefined) safeSetItem(USER_PHONE_KEY, data.phone);
  if (data.name !== undefined) safeSetItem(USER_NAME_KEY, data.name);
  if (data.email !== undefined) safeSetItem(USER_EMAIL_KEY, data.email);
  if (data.photoURL !== undefined) safeSetItem(USER_PHOTO_KEY, data.photoURL);
  if (data.dob !== undefined) safeSetItem(USER_DOB_KEY, data.dob);
  if (data.emailVerified !== undefined) safeSetItem(USER_EMAIL_VERIFIED_KEY, String(data.emailVerified));
  if (data.refundBalance !== undefined) safeSetItem(USER_REFUND_BALANCE_KEY, String(data.refundBalance));
  if (data.cashbackBalance !== undefined) safeSetItem(USER_CASHBACK_BALANCE_KEY, String(data.cashbackBalance));

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
  safeRemoveItem(USER_PHONE_KEY);
  safeRemoveItem(USER_NAME_KEY);
  safeRemoveItem(USER_EMAIL_KEY);
  safeRemoveItem(USER_PHOTO_KEY);
  safeRemoveItem(USER_DOB_KEY);
  safeRemoveItem(USER_EMAIL_VERIFIED_KEY);
  safeRemoveItem(USER_WALLET_BALANCE_KEY);
  safeRemoveItem(USER_REFUND_BALANCE_KEY);
  safeRemoveItem(USER_CASHBACK_BALANCE_KEY);
}

// ============================================================================
// TASK 3: PER-USER ORDERS & REAL-TIME DATA ISOLATION (Supabase Database)
// ============================================================================

type OrderListener = (orders: Order[]) => void;
const orderListeners: Set<OrderListener> = new Set();
let ordersChannel: ReturnType<typeof supabase.channel> | null = null;

function isRealOrder(order: Order): boolean {
  if (!order || !order.id) return false;
  if (order.id.includes('7001') || order.id.toLowerCase().includes('demo')) return false;
  if (order.customerName === 'Anindya Chatterjee') return false;
  return true;
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: Order[] = JSON.parse(raw);
    const valid = Array.isArray(parsed) ? parsed.filter(isRealOrder) : [];
    return valid;
  } catch (e) {
    console.error('Failed reading orders from storage', e);
    return [];
  }
}

export function clearAllStoredOrders(): void {
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    notifyOrderListeners([]);
  } catch (e) {
    console.error('Failed clearing orders', e);
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

// Global fetch helper for orders
async function fetchUserOrders() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    
    // If user is logged in, RLS automatically isolates rows for auth.uid() = user_id
    if (userData?.user?.id) {
      query = query.eq('user_id', userData.user.id);
    }

    const { data, error } = await query;
    if (!error && data) {
      const liveOrders: Order[] = data.map((row) => ({
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

      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(liveOrders));
      notifyOrderListeners(liveOrders);
    }
  } catch (err) {
    console.warn('Supabase orders fetch notice:', err);
  }
}

/**
 * Fetch and Subscribe to Orders from Supabase with RLS & Realtime
 */
export function subscribeToOrders(listener: OrderListener): () => void {
  orderListeners.add(listener);
  // Send cached/stored state first for immediate UI display
  listener(getStoredOrders());

  // Fetch initial orders
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
  const currentOrders = getStoredOrders();
  const updatedOrders = [order, ...currentOrders];
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));

  // Sound chime alert
  soundService.playNewOrderChime();

  // Notify UI
  notifyOrderListeners(updatedOrders);

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

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
  const currentOrders = getStoredOrders();
  let updatedDeliveryPartner = undefined;

  if (newStatus === 'out_for_delivery') {
    updatedDeliveryPartner = {
      name: 'Bikash Mondal ⚡',
      phone: '+91 87774 00280',
      vehicleNumber: 'WB 07 C 1089',
      currentHub: 'Central Ezra Street Hub'
    };
  }

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

  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
  notifyOrderListeners(updatedOrders);

  try {
    const updatePayload: Record<string, unknown> = {
      status: newStatus
    };
    if (updatedDeliveryPartner) {
      updatePayload.delivery_partner = updatedDeliveryPartner;
    }
    await supabase.from('orders').update(updatePayload).eq('id', orderId);
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

export function getStoredAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(SAVED_ADDRESSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading saved addresses:', e);
    return [];
  }
}

async function fetchUserAddresses() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    let query = supabase.from('saved_addresses').select('*').order('created_at', { ascending: false }).limit(20);
    if (authData?.user?.id) {
      query = query.eq('user_id', authData.user.id);
    }

    const { data, error } = await query;
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
      localStorage.setItem(SAVED_ADDRESSES_STORAGE_KEY, JSON.stringify(list));
      addressListeners.forEach((l) => l(list));
    }
  } catch (e) {
    console.warn('Addresses fetch notice:', e);
  }
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
  const current = getStoredAddresses().filter((a) => a.id !== address.id);
  const updated = [address, ...current];
  localStorage.setItem(SAVED_ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  localStorage.setItem(ACTIVE_SAVED_ADDRESS_KEY, JSON.stringify(address));

  addressListeners.forEach((l) => l(updated));

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

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
  const current = getStoredAddresses();
  const updated = current.filter((a) => a.id !== id);
  localStorage.setItem(SAVED_ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  addressListeners.forEach((l) => l(updated));

  try {
    await supabase.from('saved_addresses').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase delete address error:', err);
  }
}

// ============================================================================
// SAVED UPI IDS (Supabase `saved_upi_ids` table with RLS)
// ============================================================================

type UpiListener = (upis: string[]) => void;
const upiListeners = new Set<UpiListener>();

export function getStoredUpiIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_UPI_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function subscribeToUpiIds(listener: UpiListener): () => void {
  upiListeners.add(listener);
  listener(getStoredUpiIds());

  async function fetchUpiIds() {
    try {
      const { data: authData } = await supabase.auth.getUser();
      let query = supabase.from('saved_upi_ids').select('upi_id').order('created_at', { ascending: false }).limit(15);
      if (authData?.user?.id) {
        query = query.eq('user_id', authData.user.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        const list = data.map((r) => r.upi_id).filter(Boolean);
        localStorage.setItem(SAVED_UPI_STORAGE_KEY, JSON.stringify(list));
        upiListeners.forEach((l) => l(list));
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
  const current = getStoredUpiIds().filter((u) => u.toLowerCase() !== cleanUpi);
  const updated = [cleanUpi, ...current];
  localStorage.setItem(SAVED_UPI_STORAGE_KEY, JSON.stringify(updated));

  upiListeners.forEach((l) => l(updated));

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

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
  const current = getStoredUpiIds();
  const updated = current.filter((u) => u.toLowerCase() !== cleanUpi);
  localStorage.setItem(SAVED_UPI_STORAGE_KEY, JSON.stringify(updated));

  upiListeners.forEach((l) => l(updated));

  try {
    await supabase.from('saved_upi_ids').delete().eq('upi_id', cleanUpi);
  } catch (err) {
    console.warn('Supabase delete upi error:', err);
  }
}
