import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Building2,
  Hammer,
  Droplets,
  Layers,
  Sparkles,
  Truck,
  Star,
  ChevronRight,
  ChevronLeft,
  Paintbrush,
  Boxes,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  Phone,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  FileText,
  Calculator,
  RefreshCw,
  Award,
  PackageCheck,
  RotateCcw,
  Sparkle,
  ShoppingCart
} from 'lucide-react';
import { Product, CartItem } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';

export interface HomePageProps {
  onAddToCart: (product: Product) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  cartItems?: CartItem[];
  onNavigateCategory: (categoryName: string) => void;
  onOpenBulkQuoteModal?: () => void;
  onOpenProductQuickView?: (product: Product) => void;
}

// ---------------------------------------------------------------------------
// 22 Visual Categories for Row 2 (Matching Reference Design)
// ---------------------------------------------------------------------------
export const REFERENCE_CATEGORIES = [
  {
    id: 'cat-cement',
    name: 'Cement',
    badge: 'Bulk Prices',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Cement%20%26%20Concrete'
  },
  {
    id: 'cat-tiling',
    name: 'Tiling',
    badge: 'Bulk Prices',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Tiling%20%26%20Adhesives'
  },
  {
    id: 'cat-painting',
    name: 'Painting',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Paints%20%26%20Putty'
  },
  {
    id: 'cat-waterproofing',
    name: 'Water Proofing',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Waterproofing'
  },
  {
    id: 'cat-plywood',
    name: 'Plywood, MDF & HDHMR',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Plywood%20%26%20Boards'
  },
  {
    id: 'cat-fevicol',
    name: 'Fevicol',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Adhesives%20%26%20Fevicol'
  },
  {
    id: 'cat-wires-mcb',
    name: 'Wires, MCB & Distribution Boards',
    image: 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/electrical?subcategory=Wiring'
  },
  {
    id: 'cat-kitchen-sinks',
    name: 'Kitchen Sinks & Faucets',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Kitchen%20Sinks%20%26%20Faucets'
  },
  {
    id: 'cat-sanitary',
    name: 'Sanitary & Bath Fittings',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Sanitary%20%26%20Bath%20Fittings'
  },
  {
    id: 'cat-switches',
    name: 'Switches & Sockets',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/electrical?subcategory=Switches'
  },
  {
    id: 'cat-hinges-hardware',
    name: 'Hinges, Channels & Handles',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Hinges%20%26%20Hardware'
  },
  {
    id: 'cat-kitchen-systems',
    name: 'Kitchen Systems & Accessories',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Kitchen%20Systems%20%26%20Accessories'
  },
  {
    id: 'cat-wardrobe-fittings',
    name: 'Wardrobe & Bed Fittings',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Wardrobe%20%26%20Bed%20Fittings'
  },
  {
    id: 'cat-door-locks',
    name: 'Door Locks & Hardware',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Door%20Locks%20%26%20Hardware'
  },
  {
    id: 'cat-conduits-gi',
    name: 'Conduits & GI Boxes',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/electrical?subcategory=PVC%20Items'
  },
  {
    id: 'cat-lighting',
    name: 'Lighting',
    image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/electrical?subcategory=Lights'
  },
  {
    id: 'cat-cpvc-tanks',
    name: 'CPVC Pipes & Overhead Tanks',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Plumbing%20%26%20Pipes'
  },
  {
    id: 'cat-fans-exhaust',
    name: 'Ceiling Fans & Exhaust',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/electrical?subcategory=Fans'
  },
  {
    id: 'cat-power-tools',
    name: 'Power Tools & Accessories',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=Power%20Tools'
  },
  {
    id: 'cat-cctv',
    name: 'CCTV & Surveillance',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/electrical?subcategory=CCTV%20%26%20Surveillance'
  },
  {
    id: 'cat-appliances-power',
    name: 'Home Appliances & Power Backup',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/electrical?subcategory=Home%20Appliances'
  },
  {
    id: 'cat-general-hardware',
    name: 'General Hardware & Tools',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?q=80&w=600&auto=format&fit=crop',
    targetRoute: '/construction?subcategory=General%20Hardware%20%26%20Tools'
  }
];

// ---------------------------------------------------------------------------
// Row 1: Posters / Hero Promotional Banners
// ---------------------------------------------------------------------------
const HERO_POSTERS = [
  {
    id: 'p-1',
    badge: '⚡ 60-Minute Fast Dispatch in Kolkata',
    title: 'Electrical & Industrial Supplies at Wholesale Rates',
    subtitle: 'RR Kabel & Polycab wires, Schneider switchgear, MCBs, delivered direct from Kasba Hub.',
    ctaText: 'Explore Electricals',
    link: '/electrical',
    bgGradient: 'from-amber-600 via-amber-700 to-amber-900',
    accentColor: 'text-amber-300'
  },
  {
    id: 'p-2',
    badge: '🏗️ Factory Bulk Pricing',
    title: 'UltraTech Cement & Tata Tiscon TMT Rebars',
    subtitle: 'Direct truck dispatch with on-site unloading for contractors, builders, and home renovations.',
    ctaText: 'View Construction Catalog',
    link: '/construction',
    bgGradient: 'from-slate-900 via-slate-800 to-amber-950',
    accentColor: 'text-amber-400'
  },
  {
    id: 'p-3',
    badge: '🛡️ 100% Genuine & ISI Certified',
    title: 'Monsoon Waterproofing & CPVC Plumbing Hub',
    subtitle: 'Dr. Fixit 101 LW+, Astral CPVC pipes & Asian Paints wall putty with standard GST tax invoices.',
    ctaText: 'Order Waterproofing',
    link: '/construction',
    bgGradient: 'from-emerald-800 via-teal-900 to-slate-900',
    accentColor: 'text-emerald-300'
  }
];

// ---------------------------------------------------------------------------
// Row 7: Authorized Brand Names We Sell
// ---------------------------------------------------------------------------
const PARTNER_BRANDS = [
  { name: 'RR Kabel', segment: 'Wires & Cables', badge: 'Authorized Partner' },
  { name: 'Polycab', segment: 'Cables & Fans', badge: 'Direct Wholesale' },
  { name: 'Schneider Electric', segment: 'Modular Switches', badge: 'OEM Partner' },
  { name: 'Havells', segment: 'Lighting & MCBs', badge: '100% Genuine' },
  { name: 'Anchor by Panasonic', segment: 'Wiring Accessories', badge: 'Authorized' },
  { name: 'Finolex', segment: 'Copper Wires', badge: 'Direct Supply' },
  { name: 'UltraTech Cement', segment: 'OPC 53 & Concrete', badge: 'Factory Depot' },
  { name: 'Tata Tiscon', segment: '550D TMT Rebars', badge: 'Authorized' },
  { name: 'Astral Pipes', segment: 'CPVC & UPVC Pipes', badge: 'Distributor' },
  { name: 'Dr. Fixit', segment: 'Waterproofing', badge: 'Official Stockist' },
  { name: 'Asian Paints', segment: 'Paints & Wall Putty', badge: 'Direct Rates' },
  { name: 'CenturyPly', segment: 'Plywood & Boards', badge: 'ISI Certified' },
  { name: 'Bosch', segment: 'Power Tools', badge: 'Original Tools' },
  { name: 'Supreme', segment: 'Plumbing & Drainage', badge: 'Heavy Duty' }
];

export const HomePage: React.FC<HomePageProps> = ({
  onAddToCart,
  onUpdateQuantity,
  cartItems = [],
  onNavigateCategory,
  onOpenBulkQuoteModal,
  onOpenProductQuickView
}) => {
  const navigate = useNavigate();
  const [activePosterIndex, setActivePosterIndex] = useState(0);
  const electricalScrollRef = useRef<HTMLDivElement>(null);
  const constructionScrollRef = useRef<HTMLDivElement>(null);

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, offset: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Auto-advance posters
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePosterIndex((prev) => (prev + 1) % HERO_POSTERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Helper to check cart quantity
  const getProductCartQty = (productId: string) => {
    const match = cartItems.find((i) => String(i.product.id) === String(productId));
    return match ? match.quantity : 0;
  };

  // -------------------------------------------------------------------------
  // ROW 3: Restocked / Refilled items (Merged Electrical + Construction, 5-10 items)
  // -------------------------------------------------------------------------
  const restockedProducts = useMemo(() => {
    const electricalSubset = INITIAL_PRODUCTS.filter((p) => p.category === 'electrical').slice(0, 4);
    const constructionSubset = INITIAL_PRODUCTS.filter((p) => p.category === 'construction').slice(0, 4);
    return [...electricalSubset, ...constructionSubset].slice(0, 8);
  }, []);

  // -------------------------------------------------------------------------
  // ROW 4: Newly Launched Electrical Products (5-10 items)
  // -------------------------------------------------------------------------
  const newlyLaunchedElectrical = useMemo(() => {
    return INITIAL_PRODUCTS.filter((p) => p.category === 'electrical').slice(0, 8);
  }, []);

  // -------------------------------------------------------------------------
  // ROW 5: Newly Launched Construction Products (5-10 items)
  // -------------------------------------------------------------------------
  const newlyLaunchedConstruction = useMemo(() => {
    return INITIAL_PRODUCTS.filter((p) => p.category === 'construction').slice(0, 6);
  }, []);

  // -------------------------------------------------------------------------
  // ROW 8: Simple Calculator State
  // -------------------------------------------------------------------------
  const [calcMode, setCalcMode] = useState<'electrical' | 'construction' | 'both'>('electrical');
  const [bhkPreset, setBhkPreset] = useState<'1bhk' | '2bhk' | '3bhk' | 'custom'>('2bhk');
  const [customSqft, setCustomSqft] = useState(900);

  // Electrical items inputs
  const [wireCoils, setWireCoils] = useState(4);
  const [modularSwitches, setModularSwitches] = useState(24);
  const [mcbBoxes, setMcbBoxes] = useState(1);
  const [pvcConduits, setPvcConduits] = useState(12);

  // Construction items inputs
  const [cementBags, setCementBags] = useState(50);
  const [tmtSteelKg, setTmtSteelKg] = useState(400);
  const [waterproofingLiters, setWaterproofingLiters] = useState(10);
  const [wallPuttyBags, setWallPuttyBags] = useState(4);

  // Preset changer
  const handlePresetChange = (preset: '1bhk' | '2bhk' | '3bhk' | 'custom') => {
    setBhkPreset(preset);
    if (preset === '1bhk') {
      setCustomSqft(550);
      setWireCoils(2);
      setModularSwitches(16);
      setMcbBoxes(1);
      setPvcConduits(8);
      setCementBags(30);
      setTmtSteelKg(250);
      setWaterproofingLiters(5);
      setWallPuttyBags(2);
    } else if (preset === '2bhk') {
      setCustomSqft(950);
      setWireCoils(4);
      setModularSwitches(26);
      setMcbBoxes(1);
      setPvcConduits(14);
      setCementBags(60);
      setTmtSteelKg(500);
      setWaterproofingLiters(10);
      setWallPuttyBags(4);
    } else if (preset === '3bhk') {
      setCustomSqft(1400);
      setWireCoils(7);
      setModularSwitches(40);
      setMcbBoxes(2);
      setPvcConduits(22);
      setCementBags(100);
      setTmtSteelKg(850);
      setWaterproofingLiters(20);
      setWallPuttyBags(7);
    }
  };

  // Cost calculations
  const estimatedCost = useMemo(() => {
    // Average realistic wholesale prices
    const WIRE_COIL_PRICE = 3800; // Average 1.0 / 1.5 sqmm coil
    const SWITCH_PRICE = 135; // Modular switch / socket average
    const MCB_BOX_PRICE = 950; // MCB DB box
    const CONDUIT_PRICE = 120; // 3m pipe length

    const CEMENT_BAG_PRICE = 385; // UltraTech 50kg
    const TMT_KG_PRICE = 62; // per kg steel
    const WP_LITER_PRICE = 130; // per litre Dr Fixit
    const PUTTY_BAG_PRICE = 680; // 20kg Asian Paints putty

    let electricalSubtotal = (wireCoils * WIRE_COIL_PRICE) + (modularSwitches * SWITCH_PRICE) + (mcbBoxes * MCB_BOX_PRICE) + (pvcConduits * CONDUIT_PRICE);
    let constructionSubtotal = (cementBags * CEMENT_BAG_PRICE) + (tmtSteelKg * TMT_KG_PRICE) + (waterproofingLiters * WP_LITER_PRICE) + (wallPuttyBags * PUTTY_BAG_PRICE);

    if (calcMode === 'electrical') {
      return { electricalSubtotal, constructionSubtotal: 0, total: electricalSubtotal };
    }
    if (calcMode === 'construction') {
      return { electricalSubtotal: 0, constructionSubtotal, total: constructionSubtotal };
    }
    return { electricalSubtotal, constructionSubtotal, total: electricalSubtotal + constructionSubtotal };
  }, [calcMode, wireCoils, modularSwitches, mcbBoxes, pvcConduits, cementBags, tmtSteelKg, waterproofingLiters, wallPuttyBags]);

  // -------------------------------------------------------------------------
  // ROW 10: Review / Video Reels placeholder flag
  // -------------------------------------------------------------------------
  const SHOW_VIDEO_REELS_ROW = false; // Kept in code space as requested, hidden from UI

  // Standard Product Card Rendering matching Electrical & Construction pages with uniform heights and alignment
  const renderProductCard = (product: Product) => {
    const cartQty = getProductCartQty(product.id);
    const discount = product.discountPercentage ||
      (product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0);

    const isElectrical = product.category === 'electrical';
    const detailLink = isElectrical
      ? `/electrical/product/${product.id}`
      : `/construction`;

    return (
      <div
        key={product.id}
        className="group h-full flex flex-col justify-between transition-all duration-200 border border-slate-100/80 rounded-2xl bg-white p-2 sm:p-2.5 font-sans shadow-2xs hover:shadow-sm hover:border-slate-200"
      >
        {/* Top Segment: Image + Product Info with locked heights */}
        <div className="flex flex-col">
          {/* Clean Product Image Container with Floating Discount Tag */}
          <Link
            to={detailLink}
            className="block aspect-square w-full overflow-hidden rounded-xl bg-slate-50/80 p-3 sm:p-4 mb-2 relative flex items-center justify-center cursor-pointer group-hover:bg-slate-100/80 transition-colors"
          >
            {discount > 0 && (
              <span className="absolute top-2 left-2.5 sm:top-2.5 sm:left-3 text-red-600 font-black text-[11px] sm:text-xs tracking-tight z-10 select-none drop-shadow-2xs">
                {discount}% OFF
              </span>
            )}

            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
              loading="lazy"
            />

            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 border border-slate-200/80 flex items-center gap-1 shadow-2xs">
              <Clock className="w-2.5 h-2.5 text-emerald-600" />
              <span>{product.deliveryMinutes || 60}m</span>
            </div>
          </Link>

          {/* Brand & Unit Badge */}
          <div className="flex items-center gap-1.5 mb-1 h-5 overflow-hidden">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 truncate max-w-[110px]">
              {product.brand || 'ISI Brand'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {product.unit || '1 unit'}
            </span>
          </div>

          {/* Product Name with locked min-height (2-line clamp) */}
          <Link
            to={detailLink}
            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors line-clamp-2 leading-snug block h-9 sm:h-10 mb-1"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Price & MRP */}
          <div className="flex items-baseline gap-2 pt-0.5 h-6">
            <span className="text-sm sm:text-base font-black text-slate-950">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through font-medium">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Segment: Add to Cart / Quick Quantity Controls (Always aligned in identical sequence) */}
        <div className="pt-2.5 mt-auto">
          {cartQty > 0 ? (
            <div className="flex items-center justify-between bg-yellow-400 text-slate-950 font-black rounded-lg px-2.5 h-8 shadow-xs border border-yellow-500/40">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (onUpdateQuantity) {
                    onUpdateQuantity(product.id, -1);
                  }
                }}
                className="p-1 hover:bg-yellow-500 rounded cursor-pointer transition-colors active:scale-95 flex items-center justify-center"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-xs font-black px-1 select-none">{cartQty} in cart</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (cartQty < 100) {
                    if (onUpdateQuantity) {
                      onUpdateQuantity(product.id, 1);
                    } else {
                      onAddToCart(product);
                    }
                  }
                }}
                className="p-1 hover:bg-yellow-500 rounded cursor-pointer transition-colors active:scale-95 flex items-center justify-center"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              className="w-full h-8 px-3 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-xs rounded-lg transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer select-none"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16 pt-3 sm:pt-4">

        {/* =====================================================================
            ROW 1: POSTERS (Hero Banner Carousel)
            ===================================================================== */}
        <section id="row-1-posters" className="relative">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200">
            {HERO_POSTERS.map((poster, index) => {
              const isActive = index === activePosterIndex;
              return (
                <div
                  key={poster.id}
                  className={`transition-all duration-700 ease-in-out ${
                    isActive ? 'opacity-100 relative z-10 block' : 'opacity-0 absolute inset-0 z-0 pointer-events-none hidden'
                  } bg-gradient-to-r ${poster.bgGradient} text-white p-6 sm:p-10 md:p-12`}
                >
                  <div className="max-w-3xl space-y-3 sm:space-y-4">
                    <span className="inline-block text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20">
                      {poster.badge}
                    </span>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                      {poster.title}
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-slate-200 max-w-2xl leading-relaxed">
                      {poster.subtitle}
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        to={poster.link}
                        className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <span>{poster.ctaText}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <a
                        href="https://wa.me/918777400280?text=Hello%20Giriraj%20Power,%20I%20want%20to%20inquire%20about%20wholesale%20rates."
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>WhatsApp Desk</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Poster Slide Dots & Nav */}
            <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full">
              {HERO_POSTERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePosterIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === activePosterIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            ROW 2: PRODUCTS CATEGORY (Compact Grid - 6 Per Row, Centered Last Row)
            ===================================================================== */}
        <section id="row-2-categories" className="pt-0">
          {/* 6-Column Category Grid - Compact & Centered */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {REFERENCE_CATEGORIES.map((cat) => {
              return (
                <div
                  key={cat.id}
                  id={`cat-card-${cat.id}`}
                  onClick={() => navigate(cat.targetRoute)}
                  className="w-[calc((100%-1rem)/3)] sm:w-[calc((100%-3.75rem)/6)] group flex flex-col items-center cursor-pointer select-none"
                >
                  {/* Soft-tinted compact rounded square image container */}
                  <div className="w-full aspect-square bg-[#e8f1f5] hover:bg-[#dfeaf0] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 relative flex items-center justify-center transition-all duration-200 border border-slate-200/60 hover:border-amber-400 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 overflow-hidden">
                    {cat.badge && (
                      <span className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 bg-[#f8d022] text-slate-950 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full shadow-2xs z-10 select-none leading-none">
                        {cat.badge}
                      </span>
                    )}

                    <img
                      src={cat.image}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain drop-shadow-2xs group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>

                  {/* Category Name below the card */}
                  <span className="text-center font-semibold text-[11px] sm:text-xs text-slate-800 group-hover:text-amber-700 transition-colors mt-1 sm:mt-1.5 leading-tight line-clamp-2 px-0.5">
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            ROW 3: RESTOCKED ITEMS (Refilled after out of stock - Merged Electrical & Construction)
            ===================================================================== */}
        <section id="row-3-restocked" className="space-y-3 pt-1">
          <div className="border-b border-slate-100 pb-1.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Back in Stock
            </h2>
          </div>

          {/* Product Grid (Merged Electrical & Construction) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
            {restockedProducts.map(renderProductCard)}
          </div>
        </section>

        {/* =====================================================================
            ROW 4: NEWLY LAUNCHED / ELECTRICAL SEGMENT
            ===================================================================== */}
        <section id="row-4-new-electrical" className="space-y-3 pt-1">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              New Launched
            </h2>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mt-1">
              <h3 className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">
                Electrical
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollRow(electricalScrollRef, -320)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollRow(electricalScrollRef, 320)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Product Scroll Row */}
          <div
            ref={electricalScrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:mx-0 sm:px-0 items-stretch"
          >
            {newlyLaunchedElectrical.map((p) => (
              <div key={p.id} className="w-44 sm:w-56 shrink-0 flex flex-col">
                {renderProductCard(p)}
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            ROW 5: NEWLY LAUNCHED / CONSTRUCTION SEGMENT
            ===================================================================== */}
        <section id="row-5-new-construction" className="space-y-3 pt-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">
              Construction
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollRow(constructionScrollRef, -320)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollRow(constructionScrollRef, 320)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Product Scroll Row */}
          <div
            ref={constructionScrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:mx-0 sm:px-0 items-stretch"
          >
            {newlyLaunchedConstruction.map((p) => (
              <div key={p.id} className="w-44 sm:w-56 shrink-0 flex flex-col">
                {renderProductCard(p)}
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            ROW 6: WHY YOU CAN TRUST US
            ===================================================================== */}
        <section id="row-6-trust" className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Why You Can Trust Giriraj Power
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Kolkata's verified supply network for builders, electricians &amp; homeowners
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">100% Genuine ISI Certified Brands</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct authorized distributor sourcing from RR Kabel, Polycab, Schneider, UltraTech, and Tata Tiscon with authentic factory warranties.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">60-Minute Kolkata Express Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Emergency electrical repair items, wires, switches, and tools dispatched immediately from our central Kasba warehouse hub.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Factory Wholesale Builder Rates</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct-to-site wholesale pricing with zero middleman markups, giving you maximum margin on your electrical and construction projects.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">100% GST Invoices &amp; ITC Ready</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every purchase receives a formal GST tax invoice, ensuring full input tax credit eligibility for business filings and contractors.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Direct Truck Delivery &amp; Unloading</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Heavy payload transport for cement bags, TMT bars, and sand with on-site ground unloading assistance across Greater Kolkata.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Licensed Electricians &amp; Technical Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Certified wiring technicians available for apartment wiring inspections, short circuit diagnosis, and switchboard fittings.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            ROW 7: BRAND NAMES WE ARE SELLING
            ===================================================================== */}
        <section id="row-7-brands" className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Brands Available on Our Platform
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              100% Authorized &amp; Direct Manufacturer Sourcing
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {PARTNER_BRANDS.map((b) => (
              <div
                key={b.name}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xs transition-all flex flex-col justify-between text-center"
              >
                <div>
                  <p className="text-xs font-black text-slate-900 line-clamp-1">{b.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{b.segment}</p>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full inline-block">
                    {b.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            ROW 8: CALCULATOR (Simple interface for cost estimation of gadgets & materials)
            ===================================================================== */}
        <section id="row-8-calculator" className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Material &amp; Cost Estimation Calculator
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Estimate electrical wiring and construction material quantities with live wholesale pricing
            </p>
          </div>

          {/* Simple Clean Calculator Card (No over-designed gradients, clean inputs) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-6 space-y-6">
            
            {/* Top Mode Selector & Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              {/* Mode Buttons */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setCalcMode('electrical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    calcMode === 'electrical' ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Electrical Estimate
                </button>
                <button
                  onClick={() => setCalcMode('construction')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    calcMode === 'construction' ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Construction Estimate
                </button>
                <button
                  onClick={() => setCalcMode('both')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    calcMode === 'both' ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Combined Project
                </button>
              </div>

              {/* Apartment / House Size Presets */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-600">Property Size:</span>
                {(['1bhk', '2bhk', '3bhk'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePresetChange(p)}
                    className={`px-2.5 py-1 rounded-md uppercase font-bold text-[11px] transition-all cursor-pointer ${
                      bhkPreset === p ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Column 1: Electrical Parameters (Shown if electrical or both) */}
              {(calcMode === 'electrical' || calcMode === 'both') && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-black uppercase text-amber-800 tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Electrical Wire &amp; Switch Items</span>
                  </h3>

                  {/* Wire Coils */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900">Wire Coils (1.0 / 1.5 sqmm):</label>
                      <p className="text-[10px] text-slate-400">₹3,800 / 200m coil avg</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWireCoils(Math.max(1, wireCoils - 1))}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black">{wireCoils}</span>
                      <button
                        onClick={() => setWireCoils(wireCoils + 1)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Modular Switches */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900">Modular Switches &amp; Sockets:</label>
                      <p className="text-[10px] text-slate-400">₹135 / point avg</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModularSwitches(Math.max(4, modularSwitches - 2))}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black">{modularSwitches}</span>
                      <button
                        onClick={() => setModularSwitches(modularSwitches + 2)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* MCB Boxes */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900">MCB Distribution Boxes (DB):</label>
                      <p className="text-[10px] text-slate-400">₹950 / box with isolator</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMcbBoxes(Math.max(1, mcbBoxes - 1))}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black">{mcbBoxes}</span>
                      <button
                        onClick={() => setMcbBoxes(mcbBoxes + 1)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* PVC Conduits */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900">Conduit Pipes (20mm / 25mm):</label>
                      <p className="text-[10px] text-slate-400">₹120 / length</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPvcConduits(Math.max(2, pvcConduits - 2))}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black">{pvcConduits}</span>
                      <button
                        onClick={() => setPvcConduits(pvcConduits + 2)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Column 2: Construction Parameters (Shown if construction or both) */}
              {(calcMode === 'construction' || calcMode === 'both') && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-black uppercase text-emerald-800 tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Construction &amp; Building Materials</span>
                  </h3>

                  {/* Cement Bags */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900">UltraTech Cement (50kg bags):</label>
                      <p className="text-[10px] text-slate-400">₹385 / bag wholesale</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCementBags(Math.max(5, cementBags - 5))}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black">{cementBags}</span>
                      <button
                        onClick={() => setCementBags(cementBags + 5)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* TMT Steel */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900">Tata Tiscon TMT Steel (kg):</label>
                      <p className="text-[10px] text-slate-400">₹62 / kg</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTmtSteelKg(Math.max(50, tmtSteelKg - 50))}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-xs font-black">{tmtSteelKg}</span>
                      <button
                        onClick={() => setTmtSteelKg(tmtSteelKg + 50)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Waterproofing Liquid */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900">Dr. Fixit 101 LW+ (Litres):</label>
                      <p className="text-[10px] text-slate-400">₹130 / Litre</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWaterproofingLiters(Math.max(1, waterproofingLiters - 1))}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black">{waterproofingLiters}</span>
                      <button
                        onClick={() => setWaterproofingLiters(waterproofingLiters + 1)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Wall Putty */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900">Asian Paints Putty (20kg bags):</label>
                      <p className="text-[10px] text-slate-400">₹680 / 20kg bag</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWallPuttyBags(Math.max(1, wallPuttyBags - 1))}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black">{wallPuttyBags}</span>
                      <button
                        onClick={() => setWallPuttyBags(wallPuttyBags + 1)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Total Estimation Bar & Actions */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Approximate Material Wholesale Cost
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    ₹{estimatedCost.total.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Includes GST &amp; Depot Pricing
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <a
                  href={`https://wa.me/918777400280?text=Hi%20Giriraj%20Power,%20I%20used%20the%20Cost%20Calculator%20for%20a%20project%20estimate%20of%20Rs%20${estimatedCost.total}.%20Please%20send%20the%20official%20quotation.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Get Quotation on WhatsApp</span>
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================================
            ROW 9: POSTERS (Secondary Promo Banners)
            ===================================================================== */}
        <section id="row-9-posters" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Banner 1: Bulk Contractor Project */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-600 to-amber-800 text-white flex flex-col justify-between space-y-4 shadow-sm">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full inline-block">
                Contractor Desk
              </span>
              <h3 className="text-xl font-black">Executing a Commercial Project in Kolkata?</h3>
              <p className="text-xs text-amber-100 leading-relaxed">
                Direct factory rate billing for electrical cables, switchboards, cement, and TMT rebars with scheduled on-site truck dispatch.
              </p>
            </div>
            <div>
              <a
                href="https://wa.me/918777400280?text=Hi%20Giriraj%20Power,%20I%20have%20a%20contractor%20bulk%20inquiry."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-amber-100 transition-all cursor-pointer"
              >
                <span>Chat with Project Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Banner 2: Licensed Electrician Service */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-between space-y-4 shadow-sm border border-slate-700">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block">
                Certified Technicians
              </span>
              <h3 className="text-xl font-black">Need a Licensed Electrician for Wiring?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Book verified electrical technicians for home diagnostics, short circuit troubleshooting, switchboard installations, and full site wiring.
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/services')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-500 transition-all cursor-pointer"
              >
                <span>Book Certified Electrician</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================================
            ROW 10: REVIEW / VIDEO REELS (Code preserved, hidden from UI)
            ===================================================================== */}
        {SHOW_VIDEO_REELS_ROW && (
          <section id="row-10-video-reels" className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-lg font-black text-slate-900">Customer Reviews &amp; Site Video Reels</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Space reserved for video reel embed cards when user provides assets */}
              <div className="aspect-9/16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center p-4 text-center">
                <span className="text-xs text-slate-400 font-bold">Video Reel Placeholder</span>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
