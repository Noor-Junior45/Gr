import React, { useState, useEffect } from 'react';
import {
  Zap,
  ShoppingBag,
  Home,
  Wrench,
  Grid,
  User,
  ShieldCheck,
  Star,
  Clock,
  MapPin,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Building2
} from 'lucide-react';
import { Product, CartItem, KolkataArea, SavedAddress, Order, WiringServiceBooking, UserProfile } from './types';
import { INITIAL_PRODUCTS } from './data/products';
import { KOLKATA_AREAS } from './data/kolkataAreas';
import { Header } from './components/Header';
import { LocationModal } from './components/LocationModal';
import { AuthModal } from './components/AuthModal';
import { ProfileView } from './components/ProfileView';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { WiringServices } from './components/WiringServices';
import { CategorySearchBar } from './components/CategorySearchBar';
import { CartView } from './components/CartView';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminPortal } from './components/AdminPortal';
import { MapsGroundingAssistant } from './components/MapsGroundingAssistant';
import { OrderHistoryView } from './components/OrderHistoryView';
import { Footer } from './components/Footer';
import { LegalView } from './components/LegalViews';
import {
  getSavedUserProfile,
  saveUserProfile,
  signOutUser,
  subscribeToOrders,
  subscribeToAddresses,
  ACTIVE_SAVED_ADDRESS_KEY,
  onAuthStateChange,
  getInitialAuthSession,
  safeGetItem
} from './services/supabaseService';

export default function App() {
  // State Management
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentArea, setCurrentArea] = useState<KolkataArea>(KOLKATA_AREAS[3]); // Default: Salt Lake Sector V
  const [activeSavedAddress, setActiveSavedAddress] = useState<SavedAddress | null>(() => {
    try {
      const stored = safeGetItem(ACTIVE_SAVED_ADDRESS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'services' | 'orders' | 'profile' | 'cart' | 'privacy' | 'terms'>('home');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Modals & Panels
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [selectedProductQuickView, setSelectedProductQuickView] = useState<Product | null>(null);
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getSavedUserProfile());
  const [userPhone, setUserPhone] = useState<string | null>(() => getSavedUserProfile()?.phone || null);
  const [userName, setUserName] = useState<string>(() => getSavedUserProfile()?.name || '');

  // Initialize stored user profile, auth listener, live orders & saved addresses
  useEffect(() => {
    // Initial session check
    getInitialAuthSession().then(({ session, user }) => {
      if (user) {
        const local = getSavedUserProfile();
        const userMeta = user.user_metadata || {};
        const phone = user.phone || userMeta.phone || local?.phone || safeGetItem('giriraj_user_phone') || '';
        const name = userMeta.full_name || userMeta.name || local?.name || safeGetItem('giriraj_user_name') || 'Customer';
        const email = user.email || local?.email || safeGetItem('giriraj_user_email') || '';
        const photoURL = userMeta.avatar_url || userMeta.picture || local?.photoURL || safeGetItem('giriraj_user_photo') || undefined;
        const dob = local?.dob || safeGetItem('giriraj_user_dob') || '';
        const prof: UserProfile = {
          id: user.id,
          phone,
          name,
          email,
          emailVerified: !!user.email_confirmed_at || !!user.confirmed_at || local?.emailVerified || true,
          photoURL,
          dob,
          walletBalance: local?.walletBalance || 0,
          refundBalance: local?.refundBalance || 0,
          cashbackBalance: local?.cashbackBalance || 0
        };
        setUserProfile(prof);
        setUserPhone(phone || null);
        setUserName(name);
      }
    }).finally(() => {
      setIsAuthLoading(false);
      // Clean up OAuth tokens from URL if returning from Supabase redirect
      if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch {
          // ignore
        }
      }
    });

    const unsubAuth = onAuthStateChange((event, session, sbUser) => {
      setIsAuthLoading(false);
      if (event === 'SIGNED_OUT' || (!session && !sbUser && event !== 'INITIAL_SESSION')) {
        setUserProfile(null);
        setUserPhone(null);
        setUserName('');
        return;
      }

      if (sbUser) {
        const local = getSavedUserProfile();
        const userMeta = sbUser.user_metadata || {};
        const phone = sbUser.phone || userMeta.phone || local?.phone || safeGetItem('giriraj_user_phone') || '';
        const name = userMeta.full_name || userMeta.name || local?.name || safeGetItem('giriraj_user_name') || 'Customer';
        const email = sbUser.email || local?.email || safeGetItem('giriraj_user_email') || '';
        const photoURL = userMeta.avatar_url || userMeta.picture || local?.photoURL || safeGetItem('giriraj_user_photo') || undefined;
        const dob = local?.dob || safeGetItem('giriraj_user_dob') || '';
        const prof: UserProfile = {
          id: sbUser.id,
          phone,
          name,
          email,
          emailVerified: !!sbUser.email_confirmed_at || !!sbUser.confirmed_at || local?.emailVerified || true,
          photoURL,
          dob,
          walletBalance: local?.walletBalance || 0,
          refundBalance: local?.refundBalance || 0,
          cashbackBalance: local?.cashbackBalance || 0
        };
        setUserProfile(prof);
        setUserPhone(phone || null);
        setUserName(name);
        setIsAuthModalOpen(false);
        saveUserProfile({
          phone,
          name,
          email,
          photoURL: photoURL || undefined,
          dob,
          emailVerified: true
        });
      } else {
        const local = getSavedUserProfile();
        if (local && (local.phone || local.email || (local.name && local.name !== 'Kolkata Customer'))) {
          setUserProfile(local);
          setUserPhone(local.phone || null);
          setUserName(local.name || '');
        } else {
          setUserProfile(null);
          setUserPhone(null);
          setUserName('');
        }
      }
    });

    const handleLogoutEvent = () => {
      setUserProfile(null);
      setUserPhone(null);
      setUserName('');
    };
    window.addEventListener('giriraj_user_logged_out', handleLogoutEvent);

    const unsubscribeOrders = subscribeToOrders((allOrders) => {
      setOrders(allOrders);
    });

    const unsubscribeAddresses = subscribeToAddresses((allAddrs) => {
      setSavedAddresses(allAddrs);
    });

    return () => {
      unsubAuth();
      window.removeEventListener('giriraj_user_logged_out', handleLogoutEvent);
      unsubscribeOrders();
      unsubscribeAddresses();
    };
  }, []);

  // Global Scroll Reset: Whenever activeTab or activeCategory changes, reset window scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab, activeCategory]);

  // Cart Helpers
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((i) => {
          if (i.product.id === productId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Product Filtering logic
  const filteredProducts = INITIAL_PRODUCTS.filter((product) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = product.name.toLowerCase().includes(q);
      const matchBrand = product.brand.toLowerCase().includes(q);
      const matchCategory = product.category.toLowerCase().includes(q);
      const matchSub = product.subCategory.toLowerCase().includes(q);
      const matchTags = product.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchBrand && !matchCategory && !matchSub && !matchTags) {
        return false;
      }
    }

    // Category filter
    if (activeCategory !== 'all') {
      if (product.category !== activeCategory) {
        return false;
      }
    }

    // Subcategory filter
    if (subCategoryFilter) {
      if (product.subCategory !== subCategoryFilter) {
        return false;
      }
    }

    return true;
  });

  const emergencyProducts = INITIAL_PRODUCTS.filter((p) => p.isEmergency);
  const bestSellerProducts = INITIAL_PRODUCTS.filter((p) => p.isBestSeller);

  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900 selection:bg-yellow-400 selection:text-black">
      
      {/* Top Header - Hidden when viewing profile page */}
      {activeTab !== 'profile' && (
        <Header
          currentArea={currentArea}
          activeAddress={activeSavedAddress}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cartCount={cartCount}
          cartTotal={cartTotal}
          onOpenCart={() => setActiveTab('cart')}
          userPhone={userPhone}
          userName={userName}
          userPhoto={userProfile?.photoURL}
          userProfile={userProfile}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat as typeof activeCategory);
            setSearchQuery('');
          }}
        />
      )}

      {/* Dedicated Glassmorphism Pill Search Bar (For Electrical, Construction & Wiring Pages Only) */}
      {((activeTab === 'home' && (activeCategory === 'electrical' || activeCategory === 'construction')) || activeTab === 'services') && (
        <CategorySearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder={
            activeTab === 'services'
              ? 'Search wiring services...'
              : activeCategory === 'construction'
              ? 'Search construction materials...'
              : 'Search electrical wires, switches, MCBs...'
          }
        />
      )}

      {/* Main App Content View */}
      <main className="flex-1 pb-10">
        
        {/* VIEW 1: CART & CHECKOUT DEDICATED FULL-PAGE TAB */}
        {activeTab === 'cart' ? (
          <CartView
            items={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            currentArea={currentArea}
            activeAddress={activeSavedAddress}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            userPhone={userPhone}
            onOrderPlaced={(newOrder) => {
              setLatestPlacedOrder(newOrder);
            }}
            onContinueShopping={() => {
              setActiveTab('home');
              setActiveCategory('all');
            }}
          />
        ) : activeTab === 'profile' ? (
          // VIEW 2: SWIGGY-STYLE PROFILE FULL PAGE
          <ProfileView
            userProfile={userProfile}
            orders={orders}
            savedAddresses={savedAddresses}
            onBack={() => setActiveTab('home')}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onSelectAddress={(addr) => {
              setActiveSavedAddress(addr);
              setCurrentArea(addr.area);
            }}
            onAddToCart={handleAddToCart}
            onReorder={(reorderItems) => {
              reorderItems.forEach((item) => {
                handleAddToCart(item.product);
              });
              setActiveTab('cart');
            }}
            onOpenShop={() => {
              setActiveTab('home');
              setActiveCategory('all');
            }}
            onOpenServices={() => setActiveTab('services')}
            onProfileUpdated={(updated) => {
              setUserProfile(updated);
              setUserPhone(updated.phone || null);
              setUserName(updated.name || '');
            }}
            onLogout={() => {
              setUserProfile(null);
              setUserPhone(null);
              setUserName('');
              setActiveTab('home');
            }}
          />
        ) : activeTab === 'services' ? (
          // VIEW 3: WIRING SERVICES DEDICATED TAB
          <WiringServices
            currentArea={currentArea}
            onBookService={(booking: WiringServiceBooking) => {
              console.log('Wiring service booked', booking);
            }}
            userPhone={userPhone}
            onBack={() => setActiveTab('home')}
          />
        ) : activeTab === 'orders' ? (
          // VIEW 4: ORDERS HISTORY VIEW
          <OrderHistoryView
            orders={orders}
            onOpenOrderModal={(ord) => setLatestPlacedOrder(ord)}
            onOpenShop={() => {
              setActiveTab('home');
              setActiveCategory('all');
            }}
          />
        ) : activeTab === 'privacy' ? (
          // VIEW 5: PRIVACY POLICY PAGE
          <LegalView onBack={() => setActiveTab('home')} type="privacy" />
        ) : activeTab === 'terms' ? (
          // VIEW 6: TERMS OF SERVICE PAGE
          <LegalView onBack={() => setActiveTab('home')} type="terms" />
        ) : (
          // VIEW 7: HOME / QUICK-COMMERCE CATALOG
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
            {activeTab === 'home' && activeCategory === 'all' && !searchQuery ? (
              <div className="text-center py-20">
                <h2 className="text-2xl font-medium text-slate-800 mb-2">Home Page Coming Soon</h2>
                <p className="text-slate-500">We are currently designing our new home page. Please browse our categories above.</p>
              </div>
            ) : activeTab === 'home' && activeCategory === 'construction' && !searchQuery ? (
              <div className="text-center py-20">
                <h2 className="text-2xl sm:text-3xl font-medium text-black mb-2">Coming Soon</h2>
                <p className="text-slate-500">Construction materials and catalog are launching soon.</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.map((product) => {
                  const cartItem = cartItems.find((i) => i.product.id === product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantityInCart={cartItem ? cartItem.quantity : 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateCartQuantity}
                      onOpenQuickView={setSelectedProductQuickView}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500">No products found matching "{searchQuery}".</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Small Clean Footer (Only rendered on the main landing homepage, not on catalog or category browsing) */}
      {activeTab === 'home' && activeCategory === 'all' && !searchQuery && (
        <Footer
          onOpenPrivacy={() => setActiveTab('privacy')}
          onOpenTerms={() => setActiveTab('terms')}
        />
      )}

      {/* Modals & Slide-Overs */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentArea={currentArea}
        activeAddress={activeSavedAddress}
        onSelectArea={(area, addr) => {
          setCurrentArea(area);
          if (addr) {
            setActiveSavedAddress(addr);
          } else {
            setActiveSavedAddress(null);
          }
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenTerms={() => setActiveTab('terms')}
        onOpenPrivacy={() => setActiveTab('privacy')}
        onAuthSuccess={(phone, name, email) => {
          const photo = safeGetItem('giriraj_user_photo') || undefined;
          const prof: UserProfile = {
            id: userProfile?.id,
            phone: phone || '',
            name: name || '',
            email: email || '',
            emailVerified: Boolean(email),
            photoURL: photo,
            dob: userProfile?.dob || safeGetItem('giriraj_user_dob') || ''
          };
          setUserProfile(prof);
          setUserPhone(phone || null);
          setUserName(name || '');
          setActiveTab('profile');
        }}
      />

      <ProductDetailModal
        product={selectedProductQuickView}
        onClose={() => setSelectedProductQuickView(null)}
        quantityInCart={
          selectedProductQuickView
            ? cartItems.find((i) => i.product.id === selectedProductQuickView.id)?.quantity || 0
            : 0
        }
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateCartQuantity}
      />

      <OrderSuccessModal
        order={latestPlacedOrder}
        onClose={() => setLatestPlacedOrder(null)}
        onViewAllOrders={() => {
          setActiveTab('orders');
          setLatestPlacedOrder(null);
        }}
      />

      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <MapsGroundingAssistant
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        currentArea={currentArea}
      />

    </div>
  );
}
