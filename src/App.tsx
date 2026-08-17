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
import { CategoryChips, CategoryFilterType } from './components/CategoryChips';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { WiringServices } from './components/WiringServices';
import { CartView } from './components/CartView';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminPortal } from './components/AdminPortal';
import { MapsGroundingAssistant } from './components/MapsGroundingAssistant';
import { OrderHistoryView } from './components/OrderHistoryView';
import { Footer } from './components/Footer';
import { LegalView } from './components/LegalViews';
import {
  getSavedUserProfile,
  subscribeToOrders,
  subscribeToAddresses,
  ACTIVE_SAVED_ADDRESS_KEY,
  auth
} from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // State Management
  const [currentArea, setCurrentArea] = useState<KolkataArea>(KOLKATA_AREAS[3]); // Default: Salt Lake Sector V
  const [activeSavedAddress, setActiveSavedAddress] = useState<SavedAddress | null>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_SAVED_ADDRESS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'services' | 'orders' | 'profile' | 'cart' | 'privacy' | 'terms'>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryFilterType>('all');
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
  const [userName, setUserName] = useState<string>(() => getSavedUserProfile()?.name || 'Kolkata Customer');

  // Initialize stored user profile, auth listener, live orders & saved addresses
  useEffect(() => {
    const saved = getSavedUserProfile();
    if (saved) {
      setUserProfile(saved);
      setUserPhone(saved.phone || null);
      setUserName(saved.name || 'Kolkata Customer');
    }

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const phone = fbUser.phoneNumber || localStorage.getItem('giriraj_user_phone') || '';
        const name = fbUser.displayName || localStorage.getItem('giriraj_user_name') || 'Customer';
        const email = fbUser.email || localStorage.getItem('giriraj_user_email') || '';
        const photoURL = fbUser.photoURL || localStorage.getItem('giriraj_user_photo') || undefined;
        const dob = localStorage.getItem('giriraj_user_dob') || '';
        const prof: UserProfile = {
          id: fbUser.uid,
          phone,
          name,
          email,
          photoURL,
          dob
        };
        setUserProfile(prof);
        setUserPhone(phone || null);
        setUserName(name);
      }
    });

    const unsubscribeOrders = subscribeToOrders((allOrders) => {
      setOrders(allOrders);
    });

    const unsubscribeAddresses = subscribeToAddresses((allAddrs) => {
      setSavedAddresses(allAddrs);
    });

    return () => {
      unsubAuth();
      unsubscribeOrders();
      unsubscribeAddresses();
    };
  }, []);

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
      
      {/* Top Header */}
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
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
      />

      {/* Top Filter & Navigation Bar (Hidden on Profile & Cart tabs) */}
      {activeTab !== 'profile' && activeTab !== 'cart' && (
        <CategoryChips
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            if (cat === 'services') {
              setActiveTab('services');
            } else if (activeTab === 'services' || activeTab === 'orders' || activeTab === 'cart' || activeTab === 'profile') {
              setActiveTab('home');
            }
          }}
          subCategoryFilter={subCategoryFilter}
          onSelectSubCategory={setSubCategoryFilter}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab as typeof activeTab);
          }}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onOpenCalculator={() => setActiveTab('services')}
        />
      )}

      {/* Main App Content View */}
      <main className="flex-1 pb-24">
        
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
              setUserPhone(updated.phone);
              setUserName(updated.name);
            }}
            onLogout={() => {
              setUserProfile(null);
              setUserPhone(null);
              setUserName('Kolkata Customer');
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
            {filteredProducts.length > 0 && (
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

      {/* Fixed Bottom Navigation Bar (Visible on all devices) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 sm:px-6 z-40 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          
          {/* Home Tab */}
          <button
            onClick={() => {
              setActiveTab('home');
              setActiveCategory('all');
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'home' && activeCategory === 'all'
                ? 'text-yellow-600 font-extrabold bg-yellow-50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs mt-0.5">Home</span>
          </button>

          {/* Catalog Tab */}
          <button
            onClick={() => {
              setActiveTab('home');
              setActiveCategory('electrical');
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeCategory === 'electrical' && activeTab === 'home'
                ? 'text-yellow-600 font-extrabold bg-yellow-50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs mt-0.5">Catalog</span>
          </button>

          {/* Wiring Services Tab */}
          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'text-yellow-600 font-extrabold bg-yellow-50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs mt-0.5 whitespace-nowrap">Wiring Services</span>
          </button>

          {/* Cart Tab (Only here) */}
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'cart'
                ? 'text-yellow-700 font-extrabold bg-yellow-100 ring-1 ring-yellow-400'
                : 'text-slate-700 hover:text-slate-900 font-bold'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-yellow-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs mt-0.5 whitespace-nowrap">
              {cartCount === 0 ? 'Cart' : `₹${cartTotal.toLocaleString('en-IN')}`}
            </span>
          </button>

        </div>
      </nav>

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
          }
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(phone, name, email) => {
          setUserPhone(phone);
          setUserName(name);
          const prof: UserProfile = {
            phone,
            name,
            email: email || '',
            dob: userProfile?.dob || ''
          };
          setUserProfile(prof);
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
