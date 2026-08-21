import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  LocateFixed,
  MapPin,
  Check,
  ArrowLeft,
  Home,
  Briefcase,
  Building2,
  Trash2,
  ChevronRight,
  Phone,
  User as UserIcon,
  ZoomIn,
  ZoomOut,
  Navigation,
  Sparkles
} from 'lucide-react';
import L from 'leaflet';
import { KOLKATA_AREAS } from '../data/kolkataAreas';
import { KolkataArea, SavedAddress, UserProfile } from '../types';
import {
  getStoredAddresses,
  saveAddressToFirestore,
  deleteAddressFromFirestore,
  subscribeToAddresses,
  ACTIVE_SAVED_ADDRESS_KEY
} from '../services/supabaseService';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArea: KolkataArea;
  activeAddress?: SavedAddress | null;
  userProfile?: UserProfile | null;
  userPhone?: string | null;
  onSelectArea: (area: KolkataArea, address?: SavedAddress) => void;
}

// Helper function to extract a clean name from email if name is not set
function deriveNameFromEmail(email?: string): string {
  if (!email || !email.includes('@')) return '';
  const username = email.split('@')[0];
  // Remove trailing digits and convert dots/underscores/hyphens to spaces
  const cleaned = username.replace(/[._-]+/g, ' ').replace(/\d+$/, '').trim();
  if (!cleaned) return username;
  // Capitalize words
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentArea,
  activeAddress,
  userProfile,
  userPhone,
  onSelectArea
}) => {
  // Navigation steps: 'zepto_home' (Screenshot 1) | 'map_pin' (Step 2) | 'details_form' (Step 3)
  const [step, setStep] = useState<'zepto_home' | 'map_pin' | 'details_form'>('zepto_home');

  // Search & Map States
  const [searchQuery, setSearchQuery] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isMapDragging, setIsMapDragging] = useState(false);

  // Map Coordinates & Pin Location
  const [pinCoordinates, setPinCoordinates] = useState<{ lat: number; lng: number }>({
    lat: currentArea.lat || 22.5735,
    lng: currentArea.lng || 88.4331
  });

  const [detectedStreet, setDetectedStreet] = useState<string>(
    currentArea.exactStreet || currentArea.name
  );
  const [matchedArea, setMatchedArea] = useState<KolkataArea>(currentArea);

  // Real Saved Addresses (Zero demo addresses seeded)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => getStoredAddresses());

  // Form Fields for Step 3
  const [houseName, setHouseName] = useState('');
  const [houseFlat, setHouseFlat] = useState('');
  const [buildingRoad, setBuildingRoad] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressTag, setAddressTag] = useState<'home' | 'work' | 'hotel' | 'other'>('home');
  const [customTagLabel, setCustomTagLabel] = useState('');
  
  // Calculate initial receiver name by prioritizing user profile name, email-derived name, stored name
  const [receiverName, setReceiverName] = useState(() => {
    if (activeAddress?.receiverName) return activeAddress.receiverName;
    if (userProfile?.name && userProfile.name.toLowerCase() !== 'customer') return userProfile.name;
    const emailToUse = userProfile?.email || localStorage.getItem('giriraj_user_email') || '';
    const derived = deriveNameFromEmail(emailToUse);
    if (derived) return derived;
    const stored = localStorage.getItem('giriraj_user_name');
    if (stored && stored.toLowerCase() !== 'customer') return stored;
    return '';
  });

  // Calculate initial receiver phone without hardcoded demo number (8777400280 removed)
  const [receiverPhone, setReceiverPhone] = useState(() => {
    if (activeAddress?.receiverPhone) return activeAddress.receiverPhone;
    if (userPhone) return userPhone;
    if (userProfile?.phone) return userProfile.phone;
    const stored = localStorage.getItem('giriraj_user_phone');
    if (stored && stored !== '8777400280') return stored;
    return '';
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Subscribe to real-time addresses from Firestore / LocalStorage
  useEffect(() => {
    const unsub = subscribeToAddresses((list) => {
      setSavedAddresses(list);
    });
    return () => unsub();
  }, []);

  // Reset to initial Zepto home screen whenever modal opens and refresh receiver details
  useEffect(() => {
    if (isOpen) {
      setStep('zepto_home');
      setSearchQuery('');
      setFormError(null);

      // Auto-fill Receiver Name
      if (activeAddress?.receiverName) {
        setReceiverName(activeAddress.receiverName);
      } else if (userProfile?.name && userProfile.name.toLowerCase() !== 'customer') {
        setReceiverName(userProfile.name);
      } else {
        const emailToUse = userProfile?.email || localStorage.getItem('giriraj_user_email') || '';
        const derived = deriveNameFromEmail(emailToUse);
        if (derived) {
          setReceiverName(derived);
        } else {
          const stored = localStorage.getItem('giriraj_user_name');
          if (stored && stored.toLowerCase() !== 'customer') {
            setReceiverName(stored);
          }
        }
      }

      // Auto-fill Receiver Phone (No demo number)
      if (activeAddress?.receiverPhone) {
        setReceiverPhone(activeAddress.receiverPhone);
      } else if (userPhone) {
        setReceiverPhone(userPhone);
      } else if (userProfile?.phone) {
        setReceiverPhone(userProfile.phone);
      } else {
        const storedPhone = localStorage.getItem('giriraj_user_phone');
        if (storedPhone && storedPhone !== '8777400280') {
          setReceiverPhone(storedPhone);
        } else {
          setReceiverPhone('');
        }
      }
    }
  }, [isOpen, activeAddress, userProfile, userPhone]);

  // Leaflet Map initialization when transitioning to Step 2 ('map_pin')
  useEffect(() => {
    if (!isOpen || step !== 'map_pin') return;

    const lat = pinCoordinates.lat || 22.5735;
    const lng = pinCoordinates.lng || 88.4331;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 18,
        minZoom: 13,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: false
      });

      // High-clarity CartoDB Voyager / OpenStreetMap tiles with distinct buildings and roads
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      map.on('movestart', () => {
        setIsMapDragging(true);
      });

      map.on('move', () => {
        const center = map.getCenter();
        setPinCoordinates({ lat: center.lat, lng: center.lng });
      });

      map.on('moveend', () => {
        setIsMapDragging(false);
        const center = map.getCenter();
        setPinCoordinates({ lat: center.lat, lng: center.lng });
        resolveNearestHub(center.lat, center.lng);
      });

      mapInstanceRef.current = map;
      
      // Invalidate size immediately and after layout settled
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 500);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, step]);

  // Resolve nearest Kolkata Hub & exact street using reverse geocoding & hub matching
  const resolveNearestHub = async (lat: number, lng: number) => {
    // 1. Precise reverse geocode using OpenStreetMap Nominatim for exact house/building/road details
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.street || addr.pedestrian || addr.footway || '';
          const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district || '';
          const building = addr.building || addr.amenity || addr.shop || '';
          const postcode = addr.postcode || '';

          const parts = [building, road, suburb].filter(Boolean);
          const resolvedStreet = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(', ');

          if (resolvedStreet) {
            setDetectedStreet(resolvedStreet);
            setBuildingRoad(resolvedStreet);
          }

          // Match closest area for zone
          let closest = KOLKATA_AREAS[0];
          let minDistance = Number.MAX_VALUE;
          KOLKATA_AREAS.forEach((area) => {
            if (area.pincode && postcode && area.pincode === postcode) {
              closest = area;
              minDistance = 0;
            } else if (area.lat && area.lng) {
              const dist = Math.hypot(area.lat - lat, area.lng - lng);
              if (dist < minDistance) {
                minDistance = dist;
                closest = area;
              }
            }
          });
          setMatchedArea(closest);
          return;
        }
      }
    } catch {
      // Fallback to hub calculation below if network error
    }

    // 2. Hub-based distance calculation fallback
    let closest = KOLKATA_AREAS[0];
    let minDistance = Number.MAX_VALUE;

    KOLKATA_AREAS.forEach((area) => {
      if (area.lat && area.lng) {
        const dist = Math.hypot(area.lat - lat, area.lng - lng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = area;
        }
      }
    });

    setMatchedArea(closest);
    const street = closest.exactStreet || closest.name;
    setDetectedStreet(street);
    setBuildingRoad(street);
  };

  // Fly to target coordinates on map
  const flyToCoords = (lat: number, lng: number, zoom = 18) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  };

  // Instantly apply current location / area without filling details
  const handleUseCurrentLocationDirectly = (areaToUse?: KolkataArea, streetToUse?: string) => {
    const area = areaToUse || matchedArea;
    const street = streetToUse || detectedStreet || area.exactStreet || area.name;

    try {
      localStorage.removeItem(ACTIVE_SAVED_ADDRESS_KEY);
      localStorage.setItem('giriraj_active_address', street);
    } catch (e) {
      console.error(e);
    }

    const appliedArea: KolkataArea = {
      ...area,
      exactStreet: street
    };

    onSelectArea(appliedArea, undefined);
    onClose();
  };

  // Trigger high-precision GPS Current Location fetch and use directly without filling details
  const handleFetchAndUseInstantLocation = () => {
    setGpsLoading(true);

    if (!navigator.geolocation) {
      setGpsLoading(false);
      const defaultArea = KOLKATA_AREAS[3]; // Sector V
      handleUseCurrentLocationDirectly(defaultArea, defaultArea.exactStreet || defaultArea.name);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPinCoordinates({ lat, lng });

        let resolvedStreet = '';
        let matched = KOLKATA_AREAS[0];

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const addr = data.address;
              const road = addr.road || addr.street || addr.pedestrian || addr.footway || '';
              const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district || '';
              const building = addr.building || addr.amenity || addr.shop || '';
              const postcode = addr.postcode || '';
              const parts = [building, road, suburb].filter(Boolean);
              resolvedStreet = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(', ');

              let minDistance = Number.MAX_VALUE;
              KOLKATA_AREAS.forEach((a) => {
                if (a.pincode && postcode && a.pincode === postcode) {
                  matched = a;
                  minDistance = 0;
                } else if (a.lat && a.lng) {
                  const dist = Math.hypot(a.lat - lat, a.lng - lng);
                  if (dist < minDistance) {
                    minDistance = dist;
                    matched = a;
                  }
                }
              });
            }
          }
        } catch {
          // Fallback to hub match
        }

        if (!resolvedStreet) {
          let minDistance = Number.MAX_VALUE;
          KOLKATA_AREAS.forEach((a) => {
            if (a.lat && a.lng) {
              const dist = Math.hypot(a.lat - lat, a.lng - lng);
              if (dist < minDistance) {
                minDistance = dist;
                matched = a;
              }
            }
          });
          resolvedStreet = matched.exactStreet || matched.name;
        }

        handleUseCurrentLocationDirectly(matched, resolvedStreet);
      },
      () => {
        setGpsLoading(false);
        const fallback = KOLKATA_AREAS[3];
        handleUseCurrentLocationDirectly(fallback, fallback.exactStreet || fallback.name);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Trigger high-precision GPS Current Location fetch and proceed to Step 2
  const handleEnableCurrentLocation = () => {
    setGpsLoading(true);

    if (!navigator.geolocation) {
      setGpsLoading(false);
      const defaultArea = KOLKATA_AREAS[3]; // Sector V
      const coords = { lat: defaultArea.lat || 22.5735, lng: defaultArea.lng || 88.4331 };
      setPinCoordinates(coords);
      setMatchedArea(defaultArea);
      setDetectedStreet(defaultArea.exactStreet || defaultArea.name);
      setBuildingRoad(defaultArea.exactStreet || defaultArea.name);
      if (step === 'map_pin') {
        flyToCoords(coords.lat, coords.lng, 18);
      } else {
        setStep('map_pin');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPinCoordinates({ lat, lng });
        resolveNearestHub(lat, lng);
        if (step === 'map_pin') {
          flyToCoords(lat, lng, 18);
        } else {
          setStep('map_pin');
        }
      },
      (err) => {
        console.warn('High precision GPS failed or denied, trying standard accuracy...', err);
        // Fallback retry with lower accuracy requirements
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsLoading(false);
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setPinCoordinates({ lat, lng });
            resolveNearestHub(lat, lng);
            if (step === 'map_pin') {
              flyToCoords(lat, lng, 18);
            } else {
              setStep('map_pin');
            }
          },
          () => {
            setGpsLoading(false);
            const fallback = KOLKATA_AREAS[3];
            const coords = { lat: fallback.lat || 22.5735, lng: fallback.lng || 88.4331 };
            setPinCoordinates(coords);
            resolveNearestHub(coords.lat, coords.lng);
            if (step === 'map_pin') {
              flyToCoords(coords.lat, coords.lng, 18);
            } else {
              setStep('map_pin');
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // Search Results filtering
  const searchResults = searchQuery.trim()
    ? KOLKATA_AREAS.filter((area) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          area.name.toLowerCase().includes(q) ||
          area.pincode.includes(q) ||
          (area.exactStreet && area.exactStreet.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSelectSearchResult = (area: KolkataArea) => {
    setSearchQuery('');
    setMatchedArea(area);
    setDetectedStreet(area.exactStreet || area.name);
    setBuildingRoad(area.exactStreet || area.name);
    if (area.lat && area.lng) {
      setPinCoordinates({ lat: area.lat, lng: area.lng });
    }
    setStep('map_pin');
  };

  // Proceed from Map (Step 2) to Form (Step 3)
  const handleProceedToDetails = () => {
    setBuildingRoad(detectedStreet || matchedArea.exactStreet || matchedArea.name);
    setFormError(null);
    setStep('details_form');
  };

  // Select an existing saved address
  const handleSelectSavedAddress = (saved: SavedAddress) => {
    try {
      localStorage.setItem(ACTIVE_SAVED_ADDRESS_KEY, JSON.stringify(saved));
      localStorage.setItem('giriraj_active_address', `${saved.houseFlat}, ${saved.houseName}`);
      if (saved.landmark) {
        localStorage.setItem('giriraj_active_landmark', saved.landmark);
      }
    } catch (e) {
      console.error(e);
    }

    onSelectArea(saved.area, saved);
    onClose();
  };

  // Delete saved address from Firestore and LocalStorage
  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAddressFromFirestore(id);
  };

  // Save new address into Firestore and LocalStorage
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseName.trim()) {
      setFormError('Please enter House Name / Society / Apartment (e.g., Greenfield Heights)');
      return;
    }
    if (!houseFlat.trim()) {
      setFormError('Please enter Flat / Floor / House Number');
      return;
    }

    const formatted = `${houseFlat.trim()}, ${houseName.trim()}, ${buildingRoad.trim()}, ${matchedArea.name} (PIN ${matchedArea.pincode})`;

    const newAddress: SavedAddress = {
      id: `addr-${Date.now()}`,
      tag: addressTag,
      tagLabel: addressTag === 'other' && customTagLabel.trim() ? customTagLabel.trim() : undefined,
      houseName: houseName.trim(),
      houseFlat: houseFlat.trim(),
      buildingRoad: buildingRoad.trim() || matchedArea.name,
      landmark: landmark.trim() || undefined,
      formattedExactAddress: formatted,
      area: matchedArea,
      lat: pinCoordinates.lat,
      lng: pinCoordinates.lng,
      receiverName: receiverName.trim() || undefined,
      receiverPhone: receiverPhone.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    await saveAddressToFirestore(newAddress);

    // Apply to current checkout session
    try {
      localStorage.setItem('giriraj_active_address', `${newAddress.houseFlat}, ${newAddress.houseName}`);
      if (newAddress.landmark) {
        localStorage.setItem('giriraj_active_landmark', newAddress.landmark);
      }
    } catch (err) {
      console.error(err);
    }

    onSelectArea(matchedArea, newAddress);
    onClose();
  };

  const getTagIcon = (tag: SavedAddress['tag']) => {
    switch (tag) {
      case 'home':
        return <Home className="w-4 h-4 text-pink-600" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
      case 'hotel':
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-700" />;
    }
  };

  const getTagLabel = (addr: SavedAddress) => {
    if (addr.tag === 'home') return 'Home';
    if (addr.tag === 'work') return 'Work / Office';
    if (addr.tag === 'hotel') return 'Hotel';
    return addr.tagLabel || 'Other';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Card / Responsive Full Page Container */}
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            {step !== 'zepto_home' ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 'details_form') setStep('map_pin');
                  else setStep('zepto_home');
                }}
                className="p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                title="Close"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                {step === 'details_form'
                  ? 'Enter Complete Address'
                  : step === 'map_pin'
                  ? 'Choose Exact Location'
                  : 'Your Location'}
              </h2>
              {step === 'details_form' && (
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Add house name &amp; flat for delivery (60 Mins – 7 Days)
                </p>
              )}
              {step === 'map_pin' && (
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Move map to place pin over your exact house / gate
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= STEP 1: ZEPTO-STYLE LOCATION HOME SCREEN (Matches Screenshot) ================= */}
        {step === 'zepto_home' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            
            {/* Search Input Bar (Matches Zepto layout in screenshot) */}
            <div className="relative flex items-center rounded-2xl bg-slate-100/90 border border-slate-200/90 focus-within:bg-white focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-100 transition-all px-3.5 py-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search a new address or colony..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ml-2.5 bg-transparent border-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-800 font-bold px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {searchQuery.trim() && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((area) => (
                    <button
                      key={area.pincode}
                      type="button"
                      onClick={() => handleSelectSearchResult(area)}
                      className="w-full p-2.5 text-left rounded-xl hover:bg-pink-50/60 flex items-center justify-between group cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <MapPin className="w-4 h-4 text-pink-600 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {area.exactStreet || area.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            PIN {area.pincode} • {area.zone} Kolkata Hub
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600 shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No matching location found. Please try searching by pincode (e.g. 700091).
                  </div>
                )}
              </div>
            )}

            {/* "Use My Current Location" Card with Direct and Map Options */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50/90 via-slate-50/90 to-amber-50/70 border border-slate-200/90 space-y-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100/90 flex items-center justify-center shrink-0">
                  <LocateFixed className={`w-5 h-5 text-[#e91e63] ${gpsLoading ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    Current Location
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                    Fast delivery (60 Mins – 7 Days for bulk stock) across Kolkata
                  </div>
                </div>
              </div>

              {/* Two quick options: Use Current Location (without filling details) OR Pin on Map */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleFetchAndUseInstantLocation}
                  disabled={gpsLoading}
                  className="py-2.5 px-2.5 rounded-xl bg-[#e91e63] hover:bg-[#d81b60] text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50 text-center"
                  title="Deliver directly to current GPS without filling forms"
                >
                  <LocateFixed className={`w-3.5 h-3.5 shrink-0 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span className="truncate">{gpsLoading ? 'Locating...' : 'Use Current Location'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnableCurrentLocation}
                  disabled={gpsLoading}
                  className="py-2.5 px-2.5 rounded-xl border border-pink-300 bg-white hover:bg-pink-50 text-[#e91e63] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 text-center"
                  title="Open map to pinpoint or customize house details"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Pin on Map</span>
                </button>
              </div>
            </div>

            {/* Quick Choose Saved Location Bar */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Saved Locations {savedAddresses.length > 0 ? `(${savedAddresses.length})` : ''}
              </span>
              {savedAddresses.length === 0 && (
                <button
                  type="button"
                  onClick={() => setStep('details_form')}
                  className="text-xs font-bold text-pink-600 hover:text-pink-700 cursor-pointer"
                >
                  + Add New Address
                </button>
              )}
            </div>

            {/* If user has saved addresses in database: Show them here */}
            {savedAddresses.length > 0 ? (
              <div className="space-y-2">
                {savedAddresses.map((addr) => {
                  const isSelected = activeAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50/40 ring-1 ring-pink-400 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {getTagIcon(addr.tag)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              {addr.houseName}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                              {getTagLabel(addr)}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-pink-500 text-white px-1.5 py-0.2 rounded-md">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-medium text-slate-600 line-clamp-1 mt-0.5">
                            {addr.houseFlat}, {addr.buildingRoad}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {addr.area.name} (PIN {addr.area.pincode})
                            {addr.landmark && ` • Near ${addr.landmark}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-center">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAddress(addr.id, e)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {isSelected && <Check className="w-4 h-4 text-pink-600 shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center space-y-1 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-700">No saved addresses yet</p>
                <p className="text-[11px] text-slate-500">
                  Select your current location above or search any Kolkata locality.
                </p>
              </div>
            )}

            {/* 3D Map Vector Illustration matching screenshot */}
            <div className="pt-2 pb-2 flex flex-col items-center justify-center">
              <svg
                viewBox="0 0 320 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-52 sm:w-60 h-auto drop-shadow-sm select-none"
              >
                {/* Soft Lavender Clouds in Background */}
                <path
                  d="M80 125C80 118 85 112 92 112H115C122 112 127 118 127 125C127 132 122 137 115 137H92C85 137 80 132 80 125Z"
                  fill="#EDE7F6"
                  opacity="0.8"
                />
                <path
                  d="M185 110C185 100 193 92 203 92H232C242 92 250 100 250 110C250 120 242 128 232 128H203C193 128 185 120 185 110Z"
                  fill="#F3E8FD"
                  opacity="0.9"
                />
                <path
                  d="M165 80C165 72 171 66 179 66H200C208 66 214 72 214 80C214 88 208 94 200 94H179C171 94 165 88 165 80Z"
                  fill="#EDE7F6"
                  opacity="0.6"
                />

                {/* 3D Folded Map Base & Panels */}
                <polygon points="65,190 115,172 115,202 65,220" fill="#84CC16" opacity="0.85" />
                <polygon points="65,190 115,172 160,185 110,203" fill="#A3E635" />
                <polygon points="115,172 205,158 245,178 160,185" fill="#BEF264" />
                <polygon points="160,185 245,178 245,208 160,215" fill="#65A30D" />
                <polygon points="205,158 255,168 255,198 205,188" fill="#4D7C0F" opacity="0.9" />

                {/* Road Strips */}
                <path d="M85 193L130 182M135 182L230 165M175 183L225 195" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.9" />

                {/* Little Purple Map Pins */}
                <circle cx="108" cy="168" r="6" fill="#D8B4FE" />
                <line x1="108" y1="174" x2="108" y2="187" stroke="#CBD5E1" strokeWidth="2" />
                <circle cx="218" cy="166" r="6" fill="#D8B4FE" />
                <line x1="218" y1="172" x2="218" y2="182" stroke="#CBD5E1" strokeWidth="2" />

                {/* Central Pink Pin (Iconic Zepto / Zomato Pin) */}
                <g transform="translate(130, 80)">
                  <ellipse cx="30" cy="80" rx="15" ry="5" fill="#0F172A" opacity="0.22" />
                  <path
                    d="M30 0C13.431 0 0 13.431 0 30C0 50.625 30 78 30 78C30 78 60 50.625 60 30C60 13.431 46.569 0 30 0Z"
                    fill="#E11D48"
                  />
                  <circle cx="30" cy="28" r="12" fill="#FFFFFF" />
                </g>
              </svg>
            </div>

          </div>
        )}

        {/* ================= STEP 2: INTERACTIVE MAP PINNING (Choose Exact House Location) ================= */}
        {step === 'map_pin' && (
          <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-100">
            
            {/* Search overlay inside map */}
            <div className="absolute top-3 inset-x-3 z-[1000]">
              <div className="relative flex items-center rounded-2xl bg-white border border-slate-300 shadow-lg px-3.5 py-2.5">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search street, society or landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ml-2 bg-transparent border-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-500 font-bold px-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* In-Map search suggestions */}
              {searchQuery.trim() && (
                <div className="mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl p-1.5 space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((area) => (
                      <button
                        key={area.pincode}
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setMatchedArea(area);
                          setDetectedStreet(area.exactStreet || area.name);
                          setBuildingRoad(area.exactStreet || area.name);
                          if (area.lat && area.lng) {
                            setPinCoordinates({ lat: area.lat, lng: area.lng });
                            flyToCoords(area.lat, area.lng, 18);
                          }
                        }}
                        className="w-full p-2.5 text-left rounded-xl hover:bg-slate-50 flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-4 h-4 text-pink-600 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {area.exactStreet || area.name}
                            </div>
                            <div className="text-[10px] text-slate-500">PIN {area.pincode}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching street found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map Canvas Container */}
            <div className="flex-1 w-full min-h-[340px] h-[52vh] sm:h-[390px] relative">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Center Pin Indicator */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[950]">
                <div className="relative flex flex-col items-center">
                  
                  {/* Tooltip bubble */}
                  <div
                    className={`bg-slate-950 text-white px-3 py-1 rounded-xl shadow-xl text-[11px] font-bold tracking-tight flex items-center gap-1.5 transition-all duration-200 ${
                      isMapDragging ? '-translate-y-3 opacity-90 scale-95' : 'translate-y-0 opacity-100 scale-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                    <span>Deliver to this house / building</span>
                  </div>

                  {/* Pin SVG */}
                  <div
                    className={`mt-1 transition-all duration-200 flex flex-col items-center ${
                      isMapDragging ? '-translate-y-2.5 scale-110' : 'translate-y-0 scale-100'
                    }`}
                  >
                    <svg width="38" height="46" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20 0C8.954 0 0 8.954 0 20C0 34.5 20 48 20 48C20 48 40 34.5 40 20C40 8.954 31.046 0 20 0Z"
                        fill="#E11D48"
                      />
                      <circle cx="20" cy="18" r="7.5" fill="#FFFFFF" />
                    </svg>
                  </div>

                  {/* Pin shadow */}
                  <div
                    className={`w-4 h-1.5 rounded-full bg-black/40 blur-[1px] transition-all duration-200 ${
                      isMapDragging ? 'scale-50 opacity-20' : 'scale-100 opacity-80'
                    }`}
                  />
                </div>
              </div>

              {/* Floating Re-center and Zoom buttons */}
              <div className="absolute bottom-4 right-3.5 z-[1000] flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleEnableCurrentLocation();
                  }}
                  className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-xl flex items-center justify-center hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                  title="Locate Me (Current GPS)"
                >
                  <LocateFixed className="w-5 h-5 text-pink-600" />
                </button>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
                  <button
                    type="button"
                    onClick={() => mapInstanceRef.current?.zoomIn()}
                    className="w-10 h-9 flex items-center justify-center hover:bg-slate-50 border-b border-slate-100 text-slate-700 cursor-pointer active:bg-slate-100 transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mapInstanceRef.current?.zoomOut()}
                    className="w-10 h-9 flex items-center justify-center hover:bg-slate-50 text-slate-700 cursor-pointer active:bg-slate-100 transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Drawer Card */}
            <div className="bg-white border-t border-slate-200 p-4 sm:p-5 z-[1000] shadow-2xl shrink-0 space-y-3">
              <div className="flex items-start gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="overflow-hidden flex-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Pinpoint Location
                  </span>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-tight truncate">
                    {detectedStreet || matchedArea.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {matchedArea.name} • Kolkata {matchedArea.pincode}
                  </p>
                </div>
              </div>

              {/* Action Buttons: 1. Use Current Location (Direct), 2. Add Details, 3. Choose Saved */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleUseCurrentLocationDirectly()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#e91e63] hover:bg-[#d81b60] text-white font-black text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.99]"
                  title="Deliver directly to this location without filling address forms"
                >
                  <LocateFixed className="w-4 h-4" />
                  <span>Use Current Location</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleProceedToDetails}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-slate-50 active:scale-[0.99]"
                    title="Enter house name, flat number and save address"
                  >
                    <span>Add House Details</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('zepto_home')}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-slate-50 active:scale-[0.99]"
                    title="Switch to saved addresses or search other areas"
                  >
                    <span>Choose Saved Location</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= STEP 3: HOUSE & ADDRESS DETAILS FORM ================= */}
        {step === 'details_form' && (
          <form onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar bg-white">
            
            {/* Locality Header Pill with Change Map Pin button */}
            <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {detectedStreet || matchedArea.name}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    PIN {matchedArea.pincode} • Kolkata Hub
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('map_pin')}
                className="px-2.5 py-1 rounded-lg bg-white border border-pink-300 text-pink-700 hover:bg-pink-100 text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Change Pin
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {formError}
              </div>
            )}

            {/* 1. House Name / Apartment / Society Name (Featured Prominently) */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                House / Society / Apartment Name <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Greenfield Heights / Shanti Niwas / Webel Tower"
                value={houseName}
                onChange={(e) => {
                  setHouseName(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 bg-white"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                This house name will be shown under GIRIRAJ POWER for fast ordering.
              </p>
            </div>

            {/* 2. Flat / Floor / House Number */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                Flat / House / Floor No. <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Flat 4B, 3rd Floor, Block 2"
                value={houseFlat}
                onChange={(e) => {
                  setHouseFlat(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 bg-white"
              />
            </div>

            {/* 3. Area / Road / Street Name */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                Street / Area / Sector <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EP Block, Street No. 12"
                value={buildingRoad}
                onChange={(e) => {
                  setBuildingRoad(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 bg-white"
              />
            </div>

            {/* 4. Directions / Landmark */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                Landmark / Directions <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Opposite RDB Cinema, near Gate 1"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 bg-white"
              />
            </div>

            {/* 5. Save Address As (Home / Office / Other) */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Save Address As
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { tag: 'home', label: 'Home', icon: Home },
                  { tag: 'work', label: 'Office', icon: Briefcase },
                  { tag: 'hotel', label: 'Hotel', icon: Building2 },
                  { tag: 'other', label: 'Other', icon: MapPin }
                ].map(({ tag, label, icon: Icon }) => {
                  const isSelected = addressTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAddressTag(tag as SavedAddress['tag'])}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-400/40 font-black shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-pink-600' : 'text-slate-500'}`} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {addressTag === 'other' && (
                <input
                  type="text"
                  placeholder="e.g. Parents' House, Project Site"
                  value={customTagLabel}
                  onChange={(e) => setCustomTagLabel(e.target.value)}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                />
              )}
            </div>

            {/* 6. Receiver Details */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Receiver Contact Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="address-receiver-name-input"
                    type="text"
                    placeholder="Receiver Name"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 bg-white transition-colors"
                  />
                </div>

                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="address-receiver-phone-input"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#e91e63] hover:bg-[#d81b60] active:scale-[0.99] text-white font-black text-sm tracking-tight transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Save Address &amp; Deliver Here</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
