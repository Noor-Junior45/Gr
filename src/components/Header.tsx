import React, { useState } from 'react';
import { Zap, ShoppingBag, User, ChevronDown, Home, Briefcase, Building2, MapPin, Grid, Wrench, AlertTriangle } from 'lucide-react';
import { KolkataArea, SavedAddress } from '../types';

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
  onOpenAuth: () => void;
  onOpenAdmin?: () => void;
  onOpenAiAssistant?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenWishlist?: () => void;
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
  onOpenAuth,
  activeTab,
  onTabChange,
  activeCategory,
  onSelectCategory
}) => {
  const [imgError, setImgError] = useState(false);
  const locationInfo = getHeaderDisplayLocation(currentArea, activeAddress);

  const getInitials = (name?: string, phone?: string | null) => {
    if (name && name !== 'Kolkata Customer' && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (phone) {
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
                className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none flex items-center text-left cursor-pointer focus:outline-none"
              >
                GIRIRAJ POWER
              </button>

              {/* Saved Address House Name Only / Location Selector */}
              <button
                onClick={onOpenLocationModal}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-black transition-colors text-left cursor-pointer group leading-none mt-1 focus:outline-none max-w-[200px] sm:max-w-[320px] truncate"
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
                <span className="truncate text-slate-900 group-hover:text-pink-600 font-extrabold text-[12px] sm:text-[13px]">
                  {locationInfo.houseNameOnly}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-black shrink-0 transition-transform group-hover:translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Right Action Icons: Cart Button beside Profile Button */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Desktop Navigation Tabs (Hidden on mobile) */}

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
                if (userPhone) {
                  onTabChange('profile');
                } else {
                  onOpenAuth();
                }
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all hover:shadow-2xs active:scale-95 cursor-pointer overflow-hidden relative"
              title={userPhone ? `Account: ${userName || userPhone} (Click to open Profile)` : 'Sign in / Sign up'}
              aria-label={userPhone ? `Profile ${userName || userPhone}` : 'Sign in'}
            >
              {userPhone ? (
                userPhoto && !imgError ? (
                  <img
                    src={userPhoto}
                    alt={userName || 'Profile'}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-black text-amber-950 bg-amber-400 w-full h-full rounded-full flex items-center justify-center border border-amber-500 shadow-inner">
                    {getInitials(userName, userPhone)}
                  </span>
                )
              ) : (
                <User className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Navigation Tabs (Scrollable, centered) */}
      <div className="border-t border-slate-100 bg-white">
        <div className="flex items-center justify-center gap-4 px-3 overflow-x-auto no-scrollbar">
           <button
             onClick={() => {
               onTabChange('home');
               onSelectCategory('all');
             }}
             className={`flex items-center gap-1.5 py-3 px-2 whitespace-nowrap transition-all cursor-pointer border-b-2 font-medium ${
               activeTab === 'home' && activeCategory === 'all'
                 ? 'border-yellow-600 text-yellow-600'
                 : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
             }`}
           >
             <Home className={`w-4 h-4 ${activeTab === 'home' && activeCategory === 'all' ? 'text-yellow-600' : ''}`} />
             <span className="text-sm">Home</span>
           </button>

           <button
             onClick={() => {
               onTabChange('home');
               onSelectCategory('electrical');
             }}
             className={`flex items-center gap-1.5 py-3 px-2 whitespace-nowrap transition-all cursor-pointer border-b-2 font-medium ${
               activeTab === 'home' && activeCategory === 'electrical'
                 ? 'border-yellow-600 text-yellow-600'
                 : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
             }`}
           >
             <Zap className={`w-4 h-4 ${activeTab === 'home' && activeCategory === 'electrical' ? 'text-yellow-600' : ''}`} />
             <span className="text-sm">Electrical</span>
           </button>

           <button
             onClick={() => {
               onTabChange('home');
               onSelectCategory('construction');
             }}
             className={`flex items-center gap-1.5 py-3 px-2 whitespace-nowrap transition-all cursor-pointer border-b-2 font-medium ${
               activeTab === 'home' && activeCategory === 'construction'
                 ? 'border-yellow-600 text-yellow-600'
                 : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
             }`}
           >
             <Building2 className={`w-4 h-4 ${activeTab === 'home' && activeCategory === 'construction' ? 'text-yellow-600' : ''}`} />
             <span className="text-sm">Construction</span>
           </button>

           <button
             onClick={() => {
               onTabChange('services');
             }}
             className={`flex items-center gap-1.5 py-3 px-2 whitespace-nowrap transition-all cursor-pointer border-b-2 font-medium ${
               activeTab === 'services'
                 ? 'border-yellow-600 text-yellow-600'
                 : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
             }`}
           >
             <Wrench className={`w-4 h-4 ${activeTab === 'services' ? 'text-yellow-600' : ''}`} />
             <span className="text-sm">Wiring</span>
           </button>
        </div>
      </div>
    </header>
  );
};
