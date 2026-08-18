import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, OrderStatus, Product, WiringServiceBooking, SavedAddress, UserProfile } from '../types';
import { soundService } from './sound';
import { INITIAL_PRODUCTS } from '../data/products';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// CRITICAL: Must supply firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Firestore Error Handling conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notification:', JSON.stringify(errInfo));
  return errInfo;
}

// Test Connection on Initial Startup
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or internet connection.');
    }
    return false;
  }
}
testFirestoreConnection();

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

// Clear legacy demo storage if present
try {
  safeRemoveItem('giriraj_orders_v1');
  safeRemoveItem('giriraj_orders');
} catch (e) {
  // ignore in SSR or restricted iframe
}

const ORDERS_STORAGE_KEY = 'giriraj_orders_v2';

type OrderListener = (orders: Order[]) => void;
const orderListeners: Set<OrderListener> = new Set();

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
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed: Order[] = JSON.parse(raw);
    const valid = Array.isArray(parsed) ? parsed.filter(isRealOrder) : [];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(valid));
    return valid;
  } catch (e) {
    console.error('Failed reading orders from storage', e);
    return [];
  }
}

export function clearAllStoredOrders(): void {
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    localStorage.removeItem('giriraj_orders_v1');
    localStorage.removeItem('giriraj_orders');
    notifyOrderListeners([]);
  } catch (e) {
    console.error('Failed clearing orders', e);
  }
}

/**
 * Real-time listener for Orders from Firestore with local caching
 */
export function subscribeToOrders(listener: OrderListener): () => void {
  orderListeners.add(listener);
  // Send immediate cached/stored state first
  listener(getStoredOrders());

  const ordersPath = 'orders';
  try {
    const q = query(collection(db, ordersPath), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const liveOrders: Order[] = snapshot.docs
            .map((d) => d.data() as Order)
            .filter(isRealOrder);
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(liveOrders));
          listener(liveOrders);
        } else {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([]));
          listener([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ordersPath);
      }
    );

    return () => {
      orderListeners.delete(listener);
      unsubscribe();
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ordersPath);
    return () => {
      orderListeners.delete(listener);
    };
  }
}

function notifyOrderListeners(orders: Order[]) {
  orderListeners.forEach(listener => {
    try {
      listener(orders);
    } catch (e) {
      console.error('Error notifying order listener', e);
    }
  });
}

/**
 * Creates an order in Firestore collection 'orders'
 */
export async function createFirestoreOrder(order: Order): Promise<Order> {
  const currentOrders = getStoredOrders();
  const updatedOrders = [order, ...currentOrders];
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));

  // Sound chime alert
  soundService.playNewOrderChime();

  // Notify UI
  notifyOrderListeners(updatedOrders);

  const orderPath = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), {
      ...order,
      createdAtTimestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, orderPath);
  }

  // Analytics event
  if (typeof (window as unknown as { trackGirirajEvent?: (name: string, p: object) => void }).trackGirirajEvent === 'function') {
    (window as unknown as { trackGirirajEvent: (name: string, p: object) => void }).trackGirirajEvent('purchase', {
      transaction_id: order.id,
      value: order.totalAmount,
      currency: 'INR',
      shipping: order.deliveryFee,
      items: order.items.map(i => ({
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
 * Updates order status in Firestore and notifies real-time subscribers
 */
export async function updateOrderStatusInFirestore(orderId: string, newStatus: OrderStatus): Promise<void> {
  const currentOrders = getStoredOrders();
  let updatedDeliveryPartner = undefined;
  
  if (newStatus === 'out_for_delivery') {
    updatedDeliveryPartner = {
      name: 'Bikash Mondal ⚡',
      phone: '+91 98305 77889',
      vehicleNumber: 'WB 07 C 1089',
      currentHub: 'Central Ezra Street Hub'
    };
  }

  const updatedOrders = currentOrders.map(o => {
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

  const orderDocPath = `orders/${orderId}`;
  try {
    const updatePayload: Record<string, unknown> = {
      status: newStatus
    };
    if (updatedDeliveryPartner) {
      updatePayload.deliveryPartner = updatedDeliveryPartner;
    }
    await updateDoc(doc(db, 'orders', orderId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, orderDocPath);
  }
}

/**
 * Real Estate & Apartment Wiring Service Booking in Firestore
 */
export async function createFirestoreServiceBooking(booking: WiringServiceBooking): Promise<void> {
  const bookingPath = `services_bookings/${booking.id}`;
  try {
    await setDoc(doc(db, 'services_bookings', booking.id), {
      ...booking,
      createdAtTimestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, bookingPath);
  }
}

/**
 * Sync Initial Product Catalog to Firestore for dynamic inventory management
 */
export async function syncProductsToFirestore(): Promise<void> {
  try {
    if (INITIAL_PRODUCTS.length === 0) return;
    const productsCollection = collection(db, 'products');
    const existing = await getDocs(productsCollection);
    if (existing.empty) {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      console.log('Seeded initial products to Firestore backend');
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'products');
  }
}
syncProductsToFirestore();

export const USER_PHONE_KEY = 'giriraj_user_phone';
export const USER_NAME_KEY = 'giriraj_user_name';
export const USER_EMAIL_KEY = 'giriraj_user_email';
export const USER_PHOTO_KEY = 'giriraj_user_photo';
export const USER_DOB_KEY = 'giriraj_user_dob';
export const USER_EMAIL_VERIFIED_KEY = 'giriraj_user_email_verified';
export const USER_WALLET_BALANCE_KEY = 'giriraj_user_wallet_balance';
export const USER_REFUND_BALANCE_KEY = 'giriraj_user_refund_balance';
export const USER_CASHBACK_BALANCE_KEY = 'giriraj_user_cashback_balance';

// User Profile & Phone Authentication helpers
export function getSavedUserProfile(): UserProfile | null {
  const phone = localStorage.getItem(USER_PHONE_KEY) || '';
  const name = localStorage.getItem(USER_NAME_KEY) || (auth.currentUser?.displayName || '');
  const email = localStorage.getItem(USER_EMAIL_KEY) || auth.currentUser?.email || '';
  const photoURL = localStorage.getItem(USER_PHOTO_KEY) || auth.currentUser?.photoURL || '';
  const dob = localStorage.getItem(USER_DOB_KEY) || '';
  const emailVerified = localStorage.getItem(USER_EMAIL_VERIFIED_KEY) === 'true' || !!auth.currentUser?.emailVerified;
  const refundBalance = Number(localStorage.getItem(USER_REFUND_BALANCE_KEY)) || 0;
  const cashbackBalance = Number(localStorage.getItem(USER_CASHBACK_BALANCE_KEY)) || 0;
  const walletBalance = refundBalance + cashbackBalance;

  if (!phone && !email && !name && !auth.currentUser) return null;
  return {
    id: auth.currentUser?.uid,
    phone: phone || auth.currentUser?.phoneNumber || '',
    name: name,
    email: email,
    emailVerified,
    photoURL: photoURL || undefined,
    dob,
    walletBalance,
    refundBalance,
    cashbackBalance
  };
}

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
  if (data.phone !== undefined) localStorage.setItem(USER_PHONE_KEY, data.phone);
  if (data.name !== undefined) localStorage.setItem(USER_NAME_KEY, data.name);
  if (data.email !== undefined) localStorage.setItem(USER_EMAIL_KEY, data.email);
  if (data.photoURL !== undefined) localStorage.setItem(USER_PHOTO_KEY, data.photoURL);
  if (data.dob !== undefined) localStorage.setItem(USER_DOB_KEY, data.dob);
  if (data.emailVerified !== undefined) localStorage.setItem(USER_EMAIL_VERIFIED_KEY, String(data.emailVerified));
  if (data.refundBalance !== undefined) localStorage.setItem(USER_REFUND_BALANCE_KEY, String(data.refundBalance));
  if (data.cashbackBalance !== undefined) localStorage.setItem(USER_CASHBACK_BALANCE_KEY, String(data.cashbackBalance));

  if (auth.currentUser) {
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    };
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.photoURL !== undefined) updatePayload.photoURL = data.photoURL;
    if (data.dob !== undefined) updatePayload.dob = data.dob;
    if (data.emailVerified !== undefined) updatePayload.emailVerified = data.emailVerified;
    if (data.refundBalance !== undefined) updatePayload.refundBalance = data.refundBalance;
    if (data.cashbackBalance !== undefined) updatePayload.cashbackBalance = data.cashbackBalance;

    setDoc(doc(db, 'users', auth.currentUser.uid), updatePayload, { merge: true }).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}`);
    });
  }
}

export function clearUserProfile(): void {
  localStorage.removeItem(USER_PHONE_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_PHOTO_KEY);
  localStorage.removeItem(USER_DOB_KEY);
  localStorage.removeItem(USER_EMAIL_VERIFIED_KEY);
  localStorage.removeItem(USER_WALLET_BALANCE_KEY);
  localStorage.removeItem(USER_REFUND_BALANCE_KEY);
  localStorage.removeItem(USER_CASHBACK_BALANCE_KEY);
}

// Google Sign-In helper via Firebase Auth Popup
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      const displayName = result.user.displayName || 'Customer';
      const email = result.user.email || '';
      const phone = result.user.phoneNumber || localStorage.getItem(USER_PHONE_KEY) || '';
      const photoURL = result.user.photoURL || '';

      localStorage.setItem(USER_NAME_KEY, displayName);
      if (email) localStorage.setItem(USER_EMAIL_KEY, email);
      if (phone) localStorage.setItem(USER_PHONE_KEY, phone);
      if (photoURL) localStorage.setItem(USER_PHOTO_KEY, photoURL);
      localStorage.setItem(USER_EMAIL_VERIFIED_KEY, 'true');

      // Save/update user doc in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        id: result.user.uid,
        name: displayName,
        email: email,
        phone: phone,
        photoURL: photoURL,
        emailVerified: true,
        role: email === 'mdhassan1738@gmail.com' ? 'admin' : 'customer',
        createdAt: new Date().toISOString()
      }, { merge: true });
      return result.user;
    }
    return null;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/user-cancelled' ||
      err?.message?.includes('popup-closed-by-user') ||
      err?.message?.includes('cancelled-popup-request')
    ) {
      // Normal user action (closed the Google popup without completing login) - silently return null
      return null;
    }
    console.warn('Google Sign-in status:', err?.message || error);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    clearUserProfile();
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// ================= ADDRESS MANAGEMENT (Firestore + LocalStorage) =================
export const SAVED_ADDRESSES_STORAGE_KEY = 'giriraj_user_addresses_v4';
export const ACTIVE_SAVED_ADDRESS_KEY = 'giriraj_active_address_v4';

type AddressListener = (addresses: SavedAddress[]) => void;
const addressListeners: Set<AddressListener> = new Set();

export function getStoredAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(SAVED_ADDRESSES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading saved addresses:', e);
    return [];
  }
}

export function subscribeToAddresses(listener: AddressListener): () => void {
  addressListeners.add(listener);
  // Immediate state
  listener(getStoredAddresses());

  const addrPath = 'user_addresses';
  try {
    const q = query(collection(db, addrPath), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as SavedAddress);
          localStorage.setItem(SAVED_ADDRESSES_STORAGE_KEY, JSON.stringify(list));
          listener(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, addrPath);
      }
    );

    return () => {
      addressListeners.delete(listener);
      unsubscribe();
    };
  } catch (err) {
    return () => {
      addressListeners.delete(listener);
    };
  }
}

export async function saveAddressToFirestore(address: SavedAddress): Promise<void> {
  const current = getStoredAddresses().filter((a) => a.id !== address.id);
  const updated = [address, ...current];
  localStorage.setItem(SAVED_ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  localStorage.setItem(ACTIVE_SAVED_ADDRESS_KEY, JSON.stringify(address));

  addressListeners.forEach((l) => l(updated));

  const path = `user_addresses/${address.id}`;
  try {
    await setDoc(doc(db, 'user_addresses', address.id), {
      ...address,
      createdAtTimestamp: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteAddressFromFirestore(id: string): Promise<void> {
  const current = getStoredAddresses();
  const updated = current.filter((a) => a.id !== id);
  localStorage.setItem(SAVED_ADDRESSES_STORAGE_KEY, JSON.stringify(updated));

  addressListeners.forEach((l) => l(updated));

  const path = `user_addresses/${id}`;
  try {
    await deleteDoc(doc(db, 'user_addresses', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// USER SAVED UPI IDS (Persistent in Firestore + LocalStorage)
// -------------------------------------------------------------
export const SAVED_UPI_STORAGE_KEY = 'giriraj_user_saved_upi';
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
  // Send immediate state
  listener(getStoredUpiIds());

  const upiPath = 'user_upi';
  try {
    const q = query(collection(db, upiPath), orderBy('createdAt', 'desc'), limit(15));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => (d.data() as { upiId: string }).upiId).filter(Boolean);
          localStorage.setItem(SAVED_UPI_STORAGE_KEY, JSON.stringify(list));
          listener(list);
        } else {
          // If Firestore is empty, check local or keep empty
          const stored = getStoredUpiIds();
          listener(stored);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, upiPath);
      }
    );

    return () => {
      upiListeners.delete(listener);
      unsubscribe();
    };
  } catch (err) {
    return () => {
      upiListeners.delete(listener);
    };
  }
}

export async function saveUpiToFirestore(upiId: string): Promise<void> {
  const cleanUpi = upiId.trim().toLowerCase();
  if (!cleanUpi) return;
  const current = getStoredUpiIds().filter((u) => u.toLowerCase() !== cleanUpi);
  const updated = [cleanUpi, ...current];
  localStorage.setItem(SAVED_UPI_STORAGE_KEY, JSON.stringify(updated));

  upiListeners.forEach((l) => l(updated));

  // Save to Firestore
  const docId = cleanUpi.replace(/[^a-zA-Z0-9]/g, '_');
  const path = `user_upi/${docId}`;
  try {
    await setDoc(doc(db, 'user_upi', docId), {
      upiId: cleanUpi,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: new Date().toISOString(),
      createdAtTimestamp: serverTimestamp()
    });

    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        savedUpiIds: updated,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteUpiFromFirestore(upiId: string): Promise<void> {
  const cleanUpi = upiId.trim().toLowerCase();
  const current = getStoredUpiIds();
  const updated = current.filter((u) => u.toLowerCase() !== cleanUpi);
  localStorage.setItem(SAVED_UPI_STORAGE_KEY, JSON.stringify(updated));

  upiListeners.forEach((l) => l(updated));

  const docId = cleanUpi.replace(/[^a-zA-Z0-9]/g, '_');
  const path = `user_upi/${docId}`;
  try {
    await deleteDoc(doc(db, 'user_upi', docId));
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        savedUpiIds: updated,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}


