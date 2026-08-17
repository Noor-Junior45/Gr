import React, { useState } from 'react';
import { Search, User, ChevronDown, Home, Briefcase, Building2, MapPin } from 'lucide-react';
import { KolkataArea, SavedAddress } from '../types';

interface HeaderProps {
  currentArea: KolkataArea;
  activeAddress?: SavedAddress | null;
  onOpenLocationModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
  searchQuery,
  onSearchChange,
  userPhone,
  userName,
  userPhoto,
  onOpenAuth,
  onTabChange
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
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

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-2xs">
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
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-black transition-colors text-left cursor-pointer group leading-none mt-1 focus:outline-none max-w-[190px] sm:max-w-[260px] truncate"
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

          {/* Search Bar */}
          <div className="flex-1 max-w-lg relative hidden md:block mx-2">
            <div className={`relative flex items-center rounded-xl transition-all border ${
              searchFocused ? 'border-amber-400 ring-2 ring-amber-400/20 bg-white' : 'border-slate-300 bg-slate-50'
            }`}>
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                placeholder="Search wires, switches, cement, TMT, services..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="mr-3 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* User Profile / Login Button (Gmail style circular avatar) */}
          <div className="flex items-center shrink-0">
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

        {/* Mobile Search Bar */}
        <div className="mt-2 block md:hidden">
          <div className="relative flex items-center rounded-xl border border-slate-300 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search wires, switches, cement, TMT, services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="mr-3 text-xs text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
