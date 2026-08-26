import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShoppingBag, User, ChevronDown, Home, Briefcase, Building2, MapPin, Wrench, Search, X } from 'lucide-react';
import { KolkataArea, SavedAddress, UserProfile } from '../types';
import { detectQueryCategory } from '../utils/searchHelper';

interface HeaderProps {
  currentArea: KolkataArea;
  activeAddress?: SavedAddress | null;
  onOpenLocationModal: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  cartCount?: number;
  cartTotal?: number;
  onOpenCart?: () => void;
  userPhone: string | null;
  userName?: string;
  userPhoto?: string;
  userProfile?: UserProfile | null;
  onOpenAuth: () => void;
  onOpenAiAssistant?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenWishlist?: () => void;
  onOpenInstallApp?: () => void;
}

function getHeaderDisplayLocation(currentArea: KolkataArea | null, activeAddress?: SavedAddress | null): { houseNameOnly: string; tag?: string } {
  if (activeAddress && activeAddress.houseName) {
    return {
      houseNameOnly: activeAddress.houseName,
      tag: activeAddress.tag
    };
  }

  if (activeAddress && activeAddress.houseFlat) {
    return {
      houseNameOnly: activeAddress.houseFlat,
      tag: activeAddress.tag
    };
  }

  if (!currentArea || !currentArea.name) {
    return { houseNameOnly: 'Select Location' };
  }

  const shortName = currentArea.exactStreet || currentArea.name.split('/')[0].split('(')[0].trim();
  return {
    houseNameOnly: shortName
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentArea,
  activeAddress,
  onOpenLocationModal,
  searchQuery = '',
  onSearchChange,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
  userPhone,
  userName,
  userPhoto,
  userProfile,
  onOpenAuth,
  activeTab,
  onTabChange,
  activeCategory,
  onSelectCategory,
  onOpenInstallApp
}) => {
  const [imgError, setImgError] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const locationInfo = getHeaderDisplayLocation(currentArea, activeAddress);

  // Instant Enter key handler for search input - navigates directly without delay
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const q = (searchQuery || '').trim();
    if (!q) return;

    // Detect target store category (electrical or construction) immediately
    const targetCategory = detectQueryCategory(q);
    const targetPath = targetCategory === 'construction' ? '/construction' : '/electrical';
    const targetUrl = `${targetPath}?q=${encodeURIComponent(q)}`;

    // Sync active category & close mobile search
    onSelectCategory(targetCategory);
    onTabChange(targetCategory);
    setIsMobileSearchOpen(false);

    // Direct instant navigation to targeted store page
    navigate(targetUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  // Check login state from profile, phone, name, email or photo
  const effectiveName = userProfile?.name || userName || '';
  const effectiveEmail = userProfile?.email || '';
  const effectivePhone = userProfile?.phone || userPhone || '';
  const effectivePhoto = userProfile?.photoURL || userPhoto || '';

  const isLoggedIn = Boolean(
    userProfile?.id ||
    userProfile?.email ||
    userProfile?.phone ||
    effectivePhone ||
    (effectiveName && effectiveName !== 'Kolkata Customer' && effectiveName.trim() !== '') ||
    effectiveEmail ||
    effectivePhoto
  );

  const getInitials = (name?: string, phone?: string | null, email?: string) => {
    if (name && name !== 'Kolkata Customer' && name !== 'Customer' && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    if (phone && phone.trim()) {
      return phone.replace(/\D/g, '').slice(-2);
    }
    return 'GP';
  };

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      onTabChange('cart');
    }
  };

  const accountDisplayLabel = effectiveName || effectiveEmail || effectivePhone || 'Account';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-2xs">
      {/* Main Brand & Action Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Location Header (EatClub / Zomato Style) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Logo without any border */}
            <button
              onClick={() => onTabChange('home')}
              className="w-10 h-10 flex items-center justify-center p-0 cursor-pointer shrink-0 focus:outline-none"
              title="Giriraj Power Home"
            >
              <img
                src="https://i.imgur.com/uAyxOg2.png"
                alt="Giriraj Power Logo"
                className="w-full h-full object-contain"
              />
            </button>

            {/* Brand Title & Below-Logo Exact Location Selector */}
            <div className="flex flex-col justify-center text-left">
              <button
                onClick={() => onTabChange('home')}
                className="text-lg sm:text-xl font-black tracking-tight leading-none flex items-center gap-1.5 text-left cursor-pointer focus:outline-none font-sf-pro"
              >
                <span className="text-black">Giriraj</span>
                <span className="text-[#00875a]">Power</span>
              </button>

              {/* Saved Address House Name Only / Location Selector */}
              <button
                onClick={onOpenLocationModal}
                className="flex items-center gap-1.5 text-xs font-normal text-slate-700 hover:text-black transition-colors text-left cursor-pointer group leading-none mt-1 focus:outline-none max-w-[200px] sm:max-w-[320px] truncate"
                title="View full address or change location"
              >
                {activeAddress?.tag === 'home' && (
                  <Home className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                )}
                {activeAddress?.tag === 'work' && (
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                )}
                {activeAddress?.tag === 'hotel' && (
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                {!activeAddress && (
                  <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className="truncate text-slate-700 group-hover:text-slate-900 font-normal text-[12px] sm:text-[13px]">
                  {locationInfo.houseNameOnly}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 transition-transform group-hover:translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Universal Search Bar (Centered on Desktop, Expandable on Mobile) */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-4 hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative w-full" role="search">
              <input
                id="universal-search-input"
                type="search"
                value={searchQuery || ''}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, electrical cables, switches, brands..."
                className="w-full bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-full border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange && onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </form>
          </div>

          {/* Right Action Icons: Search Toggle (Mobile), Cart Button, Profile Button */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Mobile Search Toggle Icon */}
            <button
              id="mobile-search-toggle-btn"
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Search products"
              aria-label="Toggle Search"
            >
              {isMobileSearchOpen ? (
                <X className="w-4 h-4 text-slate-800" />
              ) : (
                <Search className="w-4 h-4 text-slate-800" />
              )}
            </button>

            {/* Cart Button */}
            <button
              id="top-navbar-cart-btn"
              onClick={handleCartClick}
              className={`relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full flex items-center gap-2 transition-all cursor-pointer border ${
                activeTab === 'cart'
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/90 text-slate-800 border-slate-200/80 active:scale-95'
              }`}
              title="View Cart"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold sm:inline hidden">
                {cartCount > 0 ? `₹${cartTotal.toLocaleString('en-IN')}` : 'Cart'}
              </span>
            </button>

            {/* User Profile / Login Button (Gmail style circular avatar) */}
            <button
              id="user-profile-avatar-btn"
              onClick={() => {
                if (isLoggedIn) {
                  onTabChange('profile');
                } else {
                  onOpenAuth();
                }
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all hover:shadow-2xs active:scale-95 cursor-pointer overflow-hidden relative"
              title={isLoggedIn ? `Account: ${accountDisplayLabel} (Click to open Profile)` : 'Sign in / Sign up'}
              aria-label={isLoggedIn ? `Profile: ${accountDisplayLabel}` : 'Sign in'}
            >
              {isLoggedIn ? (
                effectivePhoto && !imgError ? (
                  <img
                    src={effectivePhoto}
                    alt={accountDisplayLabel}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-black text-amber-950 bg-amber-400 w-full h-full rounded-full flex items-center justify-center border border-amber-500 shadow-inner">
                    {getInitials(effectiveName, effectivePhone, effectiveEmail)}
                  </span>
                )
              ) : (
                <User className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown (Visible on Mobile when Toggled) */}
        {isMobileSearchOpen && (
          <div className="md:hidden pt-2 pb-1">
            <form onSubmit={handleSearchSubmit} className="relative w-full" role="search">
              <input
                id="universal-search-input-mobile"
                type="search"
                autoFocus
                value={searchQuery || ''}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search electrical cables, switches, brands..."
                className="w-full bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm pl-9 pr-8 py-2 rounded-full border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange && onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </form>
          </div>
        )}
      </div>
      {/* Navigation Tabs (Scrollable, with left margin on mobile) */}
      <div className="border-t border-slate-100 bg-white">
        <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-8 px-4 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            id="nav-tab-home"
            onClick={() => {
              onTabChange('home');
              onSelectCategory('all');
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 whitespace-nowrap transition-all cursor-pointer border-b-2 font-bold shrink-0 text-sm ${
              activeTab === 'home' || (activeTab === 'catalog' && activeCategory === 'all')
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Home className={`w-4 h-4 ${activeTab === 'home' || (activeTab === 'catalog' && activeCategory === 'all') ? 'text-amber-600' : ''}`} />
            <span>Home</span>
          </button>

          <button
            id="nav-tab-electrical"
            onClick={() => {
              onTabChange('electrical');
              onSelectCategory('electrical');
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 whitespace-nowrap transition-all cursor-pointer border-b-2 font-bold shrink-0 text-sm ${
              activeTab === 'electrical'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Zap className={`w-4 h-4 ${activeTab === 'electrical' ? 'text-amber-600 fill-amber-500/20' : ''}`} />
            <span>Electrical</span>
          </button>

          <button
            id="nav-tab-construction"
            onClick={() => {
              onTabChange('construction');
              onSelectCategory('construction');
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 whitespace-nowrap transition-all cursor-pointer border-b-2 font-bold shrink-0 text-sm ${
              activeTab === 'construction'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'construction' ? 'text-amber-600' : ''}`} />
            <span>Construction</span>
          </button>

          <button
            id="nav-tab-wiring"
            onClick={() => {
              onTabChange('services');
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 whitespace-nowrap transition-all cursor-pointer border-b-2 font-bold shrink-0 text-sm ${
              activeTab === 'services'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Wrench className={`w-4 h-4 ${activeTab === 'services' ? 'text-amber-600' : ''}`} />
            <span>Wiring</span>
          </button>
        </div>
      </div>
    </header>
  );
};
