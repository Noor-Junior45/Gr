import React, { useState } from 'react';
import { Zap, ShoppingBag, User, ChevronDown, Home, Briefcase, Building2, MapPin, Grid, Wrench, AlertTriangle, Download, Smartphone } from 'lucide-react';
import { KolkataArea, SavedAddress, UserProfile } from '../types';

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
  onOpenAdmin?: () => void;
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
  const locationInfo = getHeaderDisplayLocation(currentArea, activeAddress);

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

          {/* Right Action Icons: Install App, Cart Button, Profile Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Install / Download App Button */}
            {onOpenInstallApp && (
              <button
                id="top-navbar-download-app-btn"
                onClick={onOpenInstallApp}
                className="px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs group"
                title="Download App / Install on your Device"
                aria-label="Download App"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden text-[11px]">App</span>
              </button>
            )}

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
