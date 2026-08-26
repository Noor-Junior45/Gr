import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Building2,
  Layers,
  Truck,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Plus,
  Minus,
  MessageSquare,
  TrendingUp,
  FileText,
  Calculator,
  Award,
  RotateCcw,
  ShoppingCart,
  Info,
  Package,
  Wrench
} from 'lucide-react';
import { Product, CartItem } from '../types';
import { supabase } from '../lib/supabaseClient';
import { fetchProductsFromSupabase } from '../services/supabaseService';
import { OFFICIAL_BRANDS } from './BrandLogos';
import { ProductCardImage } from './ProductCardImage';
import { OfferBadge } from './OfferBadge';
import { getApplicableOfferForProduct } from '../services/offerService';
import { MaterialCostCalculator } from './MaterialCostCalculator';

export interface HomePageProps {
  onAddToCart: (product: Product) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  cartItems?: CartItem[];
  onNavigateCategory: (categoryName: string) => void;
  onOpenBulkQuoteModal?: () => void;
  onOpenProductQuickView?: (product: Product) => void;
  products?: Product[];
}

// ---------------------------------------------------------------------------
// 24 Visual Categories for Row 2 (Electrical Categories First, followed by Construction)
// ---------------------------------------------------------------------------
export const REFERENCE_CATEGORIES = [
  // --- ELECTRICAL CATEGORIES (FIRST) ---
  {
    id: 'cat-wires-house',
    name: 'Wires & House Cables',
    badge: 'IS 694 Certified',
    image: 'https://i.imgur.com/sG7lW2b.jpeg',
    targetRoute: '/electrical?subcategory=Wiring'
  },
  {
    id: 'cat-mcb-distribution',
    name: 'MCBs & Distribution Boards',
    badge: 'Top Protection',
    image: 'https://i.imgur.com/4rthrow.jpeg',
    targetRoute: '/electrical?subcategory=MCBs'
  },
  {
    id: 'cat-switches',
    name: 'Switches & Sockets',
    image: 'https://i.imgur.com/K4vzOY8.jpeg',
    targetRoute: '/electrical?subcategory=Switches'
  },
  {
    id: 'cat-conduits-gi',
    name: 'Conduits, Dalda Pipes & Boxes',
    image: 'https://i.imgur.com/G9LIx1R.jpeg',
    targetRoute: '/electrical?subcategory=PVC%20Items'
  },
  {
    id: 'cat-lighting',
    name: 'Lighting & Fixtures',
    image: 'https://i.imgur.com/QhdLqOq.jpeg',
    targetRoute: '/electrical?subcategory=Lights'
  },
  {
    id: 'cat-fans-exhaust',
    name: 'Ceiling Fans & Exhaust',
    image: 'https://i.imgur.com/iirlNS3.png',
    targetRoute: '/electrical?subcategory=Fans'
  },
  {
    id: 'cat-cctv',
    name: 'CCTV & Surveillance',
    image: 'https://i.imgur.com/SQXJ1g6.jpeg',
    targetRoute: '/electrical?subcategory=CCTV%20%26%20Surveillance'
  },
  {
    id: 'cat-appliances-power',
    name: 'Home Appliances & Inverters',
    image: 'https://i.imgur.com/Kz3Hn96.jpeg',
    targetRoute: '/electrical?subcategory=Home%20Appliances'
  },

  // --- CONSTRUCTION CATEGORIES (FOLLOWING ELECTRICAL) ---
  {
    id: 'cat-cement',
    name: 'Cement',
    badge: 'Bulk Prices',
    image: 'https://i.imgur.com/u0PYh6L.png',
    targetRoute: '/construction?subcategory=Cement%20%26%20Concrete'
  },
  {
    id: 'cat-tiling',
    name: 'Tiling',
    badge: 'Bulk Prices',
    image: 'https://i.imgur.com/WwkWGNa.jpeg',
    targetRoute: '/construction?subcategory=Tiling%20%26%20Adhesives'
  },
  {
    id: 'cat-painting',
    name: 'Painting',
    image: 'https://i.imgur.com/PZgJwqo.png',
    targetRoute: '/construction?subcategory=Paints%20%26%20Putty'
  },
  {
    id: 'cat-waterproofing',
    name: 'Water Proofing',
    image: 'https://i.imgur.com/PmoHsyt.png',
    targetRoute: '/construction?subcategory=Waterproofing'
  },
  {
    id: 'cat-plywood',
    name: 'Plywood, MDF & HDHMR',
    image: 'https://i.imgur.com/Ej3lEg6.jpeg',
    targetRoute: '/construction?subcategory=Plywood%20%26%20Boards'
  },
  {
    id: 'cat-fevicol',
    name: 'Fevicol',
    image: 'https://i.imgur.com/fuzbLCY.png',
    targetRoute: '/construction?subcategory=Adhesives%20%26%20Fevicol'
  },
  {
    id: 'cat-cpvc-tanks',
    name: 'CPVC Pipes & Overhead Tanks',
    image: 'https://i.imgur.com/UOMAmSr.png',
    targetRoute: '/construction?subcategory=Plumbing%20%26%20Pipes'
  },
  {
    id: 'cat-sanitary',
    name: 'Sanitary & Bath Fittings',
    image: 'https://i.imgur.com/cPcIuQX.jpeg',
    targetRoute: '/construction?subcategory=Sanitary%20%26%20Bath%20Fittings'
  },
  {
    id: 'cat-kitchen-sinks',
    name: 'Kitchen Sinks & Faucets',
    image: 'https://i.imgur.com/3jGz1Lk.jpeg',
    targetRoute: '/construction?subcategory=Kitchen%20Sinks%20%26%20Faucets'
  },
  {
    id: 'cat-kitchen-systems',
    name: 'Kitchen Systems & Accessories',
    image: 'https://i.imgur.com/DYdlXEY.jpeg',
    targetRoute: '/construction?subcategory=Kitchen%20Systems%20%26%20Accessories'
  },
  {
    id: 'cat-hinges-hardware',
    name: 'Hinges, Channels & Handles',
    image: 'https://i.imgur.com/mnLdVng.jpeg',
    targetRoute: '/construction?subcategory=Hinges%20%26%20Hardware'
  },
  {
    id: 'cat-wardrobe-fittings',
    name: 'Wardrobe & Bed Fittings',
    image: 'https://i.imgur.com/E3cKauk.jpeg',
    targetRoute: '/construction?subcategory=Wardrobe%20%26%20Bed%20Fittings'
  },
  {
    id: 'cat-door-locks',
    name: 'Door Locks & Hardware',
    image: 'https://i.imgur.com/pGZFUb9.jpeg',
    targetRoute: '/construction?subcategory=Door%20Locks%20%26%20Hardware'
  },
  {
    id: 'cat-power-tools',
    name: 'Power Tools & Accessories',
    image: 'https://i.imgur.com/41cqlhr.jpeg',
    targetRoute: '/construction?subcategory=Power%20Tools'
  },
  {
    id: 'cat-general-hardware',
    name: 'General Hardware & Tools',
    image: 'https://i.imgur.com/TiRmlFp.jpeg',
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
  },
  {
    id: 'p-4',
    badge: '💡 Premium Architectural Lighting & Fans',
    title: 'Modern LED Panels, COB Spotlights & BLDC Fans',
    subtitle: 'Havells, Polycab & Atomberg energy-efficient fans and ambient lighting solutions for luxury interiors.',
    ctaText: 'Explore Lighting & Fans',
    link: '/electrical',
    bgGradient: 'from-indigo-950 via-slate-900 to-blue-900',
    accentColor: 'text-indigo-300'
  },
  {
    id: 'p-5',
    badge: '🪚 CenturyPly & Premium Hardware Depots',
    title: 'Waterproof Marine Plywood & Modular Kitchen Fittings',
    subtitle: 'CenturyPly 710 Club Prime, MDF boards, Godrej locks, soft-close hinges, and German-spec drawer channels.',
    ctaText: 'Explore Plywood & Hardware',
    link: '/construction',
    bgGradient: 'from-amber-950 via-stone-900 to-amber-900',
    accentColor: 'text-amber-300'
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
  onOpenProductQuickView,
  products
}) => {
  const navigate = useNavigate();
  const [activePosterIndex, setActivePosterIndex] = useState(0);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const electricalScrollRef = useRef<HTMLDivElement>(null);
  const constructionScrollRef = useRef<HTMLDivElement>(null);

  // Fetch live products directly from backend Supabase database
  useEffect(() => {
    let isMounted = true;
    setIsLoadingProducts(true);

    fetchProductsFromSupabase()
      .then((data) => {
        if (isMounted && data) {
          setDbProducts(data);
        }
      })
      .catch((err) => {
        console.warn('Error fetching homepage products from database:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false);
      });

    // Real-time listener: updates automatically whenever products table changes
    const channel = supabase
      .channel('homepage_products_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProductsFromSupabase()
            .then((data) => {
              if (isMounted && data) {
                setDbProducts(data);
              }
            })
            .catch(console.warn);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Compute live products source of truth
  const liveProducts = useMemo(() => {
    if (products && products.length > 0) return products;
    return dbProducts;
  }, [products, dbProducts]);

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
  // ROW 3: Restocked / Refilled items (Strictly from real backend database)
  // -------------------------------------------------------------------------
  const restockedProducts = useMemo(() => {
    return liveProducts.filter((p) => p.inStock !== false).slice(0, 8);
  }, [liveProducts]);

  // -------------------------------------------------------------------------
  // ROW 4: Newly Launched Electrical Products (Strictly from real backend database)
  // -------------------------------------------------------------------------
  const newlyLaunchedElectrical = useMemo(() => {
    return liveProducts.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subCategory || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        !cat ||
        cat.includes('electrical') ||
        cat.includes('wire') ||
        cat.includes('cable') ||
        cat.includes('switch') ||
        cat.includes('fan') ||
        cat.includes('light') ||
        cat.includes('pipe') ||
        cat.includes('conduit') ||
        cat.includes('pvc') ||
        sub.includes('pipe') ||
        sub.includes('conduit') ||
        sub.includes('pvc') ||
        sub.includes('mcb') ||
        sub.includes('light') ||
        sub.includes('fan') ||
        name.includes('pipe') ||
        name.includes('dalda') ||
        name.includes('conduit')
      );
    }).slice(0, 10);
  }, [liveProducts]);

  // -------------------------------------------------------------------------
  // ROW 5: Newly Launched Construction Products (Strictly from real backend database)
  // -------------------------------------------------------------------------
  const newlyLaunchedConstruction = useMemo(() => {
    return liveProducts.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subCategory || '').toLowerCase();
      return (
        cat.includes('construction') ||
        cat.includes('cement') ||
        cat.includes('plumbing') ||
        cat.includes('paint') ||
        cat.includes('hardware') ||
        cat.includes('building') ||
        sub.includes('cement') ||
        sub.includes('tmt') ||
        sub.includes('pipe') ||
        sub.includes('waterproof')
      );
    }).slice(0, 10);
  }, [liveProducts]);

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
    const applicableOffer = getApplicableOfferForProduct(String(product.id), product.category || 'electrical');

    const isElectrical =
      (product.category || '').toLowerCase().includes('electrical') ||
      (product.category || '').toLowerCase().includes('wire') ||
      (product.category || '').toLowerCase().includes('switch') ||
      (product.category || '').toLowerCase().includes('cable');
    const detailLink = isElectrical
      ? `/electrical/product/${product.id}`
      : `/construction/product/${product.id}`;

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

            <ProductCardImage
              images={product.images || product.image_urls}
              imageUrl={product.image}
              alt={product.name}
              className="group-hover:scale-105"
            />
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
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-sm sm:text-base font-black text-slate-950">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through font-medium">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Applicable Offer Coupon Badge */}
          {applicableOffer && (
            <div className="pt-1">
              <OfferBadge offer={applicableOffer} variant="card" />
            </div>
          )}
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
        <section id="row-1-posters" className="relative space-y-4">
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
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Link
                        to={poster.link}
                        className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs sm:text-sm backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
                      >
                        <span>{poster.ctaText}</span>
                        <ChevronRight className="w-4 h-4 text-amber-300" />
                      </Link>
                      <a
                        href="https://wa.me/918777400280?text=Hello%20Giriraj%20Power,%20I%20want%20to%20inquire%20about%20wholesale%20rates."
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.15)] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
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
            ROW 3: RESTOCKED ITEMS (Refilled after out of stock - From Backend Database)
            ===================================================================== */}
        {restockedProducts.length > 0 && (
          <section id="row-3-restocked" className="space-y-3 pt-1">
            <div className="border-b border-slate-100 pb-1.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Back in Stock
              </h2>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
              {restockedProducts.map(renderProductCard)}
            </div>
          </section>
        )}

        {/* =====================================================================
            ROW 4: NEWLY LAUNCHED / ELECTRICAL SEGMENT
            ===================================================================== */}
        {newlyLaunchedElectrical.length > 0 && (
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
              {/* See All Card at end of scroll */}
              <div className="w-36 sm:w-44 shrink-0 flex flex-col">
                <Link
                  to="/electrical"
                  className="h-full min-h-[250px] flex flex-col items-center justify-center rounded-2xl border border-slate-100/80 bg-white p-4 shadow-2xs hover:shadow-sm hover:border-blue-300 group transition-all cursor-pointer text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-2 transition-colors">
                    <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                    See All
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            ROW 5: NEWLY LAUNCHED / CONSTRUCTION SEGMENT
            (Hidden when no construction products exist in database, auto-appears when products added)
            ===================================================================== */}
        {newlyLaunchedConstruction.length > 0 && (
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
              {/* See All Card at end of scroll */}
              <div className="w-36 sm:w-44 shrink-0 flex flex-col">
                <Link
                  to="/construction"
                  className="h-full min-h-[250px] flex flex-col items-center justify-center rounded-2xl border border-slate-100/80 bg-white p-4 shadow-2xs hover:shadow-sm hover:border-blue-300 group transition-all cursor-pointer text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-2 transition-colors">
                    <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                    See All
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            ROW 6: WHY CHOOSE GIRIRAJ POWER (B2B Trust & Value Pillars)
            ===================================================================== */}
        <section
          id="row-6-trust"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#FDFBF7] via-[#F8F6F0] to-[#F4F1E8] border border-amber-200/80 p-5 sm:p-8 lg:p-10 space-y-6 shadow-xs"
        >
          {/* Decorative Technical & Circuit Background Art */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
            {/* Ambient Radial Highlights */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
            
            {/* SVG Electrical Grid & Technical Blueprint Art */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.045]"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern id="trust-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0F1B2D" strokeWidth="0.8" />
                  <circle cx="24" cy="24" r="1.2" fill="#FF9800" />
                  <path d="M 12 24 h 6 M 30 24 h 6 M 24 12 v 6 M 24 30 v 6" stroke="#0F1B2D" strokeWidth="0.6" strokeDasharray="1 3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#trust-grid-pattern)" />
            </svg>

            {/* Corner Industrial Framing Accents */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400/60 rounded-tl" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400/60 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400/60 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400/60 rounded-br" />
          </div>

          {/* Content Layer */}
          <div className="relative z-10 space-y-6">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center justify-center gap-2">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center shadow-2xs">
                  <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-sf-pro text-[#0F1B2D] tracking-tight">
                  Why Choose Giriraj Power?
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#5F6B7A] font-medium leading-relaxed">
                Reliable products, transparent pricing, and dependable supply for electrical and construction needs.
              </p>
            </div>

            {/* 6 Value Pillar Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* Card 1: Genuine Branded Products */}
              <div className="group bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#E2E7EE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400/80 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FF9800] border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F1B2D] group-hover:text-amber-800 transition-colors">
                    Genuine Branded Products
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5F6B7A] leading-relaxed">
                    Source electrical products from established brands and authorized distribution channels, with applicable manufacturer warranties and documentation.
                  </p>
                </div>
              </div>

              {/* Card 2: Transparent Wholesale Pricing */}
              <div className="group bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#E2E7EE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400/80 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FF9800] border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F1B2D] group-hover:text-amber-800 transition-colors">
                    Transparent Wholesale Pricing
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5F6B7A] leading-relaxed">
                    Get competitive project and bulk pricing with clear quotations and no unnecessary middleman markups.
                  </p>
                </div>
              </div>

              {/* Card 3: GST Invoices & Business Documentation */}
              <div className="group bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#E2E7EE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400/80 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FF9800] border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F1B2D] group-hover:text-amber-800 transition-colors">
                    GST Invoices &amp; Business Documentation
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5F6B7A] leading-relaxed">
                    Receive proper GST invoices for eligible purchases, helping businesses and contractors maintain accurate purchase records and claim input tax credit where applicable.
                  </p>
                </div>
              </div>

              {/* Card 4: Reliable Delivery Across Greater Kolkata */}
              <div className="group bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#E2E7EE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400/80 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FF9800] border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F1B2D] group-hover:text-amber-800 transition-colors">
                    Reliable Delivery Across Greater Kolkata
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5F6B7A] leading-relaxed">
                    Delivery timelines depend on product availability, order quantity, destination, and transport requirements. Standard orders may take 1–7 working days.
                  </p>
                </div>
              </div>

              {/* Card 5: Heavy Material Delivery Available */}
              <div className="group bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#E2E7EE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400/80 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FF9800] border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F1B2D] group-hover:text-amber-800 transition-colors">
                    Heavy Material Delivery Available
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5F6B7A] leading-relaxed">
                    For bulk and heavy orders, we can arrange suitable transport. Unloading assistance or unloading charges may be additional depending on the site and order.
                  </p>
                </div>
              </div>

              {/* Card 6: Technical Support When You Need It */}
              <div className="group bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#E2E7EE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400/80 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FF9800] border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F1B2D] group-hover:text-amber-800 transition-colors">
                    Technical Support When You Need It
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5F6B7A] leading-relaxed">
                    Get assistance with product selection, electrical requirements, quantities, and project-related material planning.
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Information Strip */}
            <div className="rounded-2xl border border-amber-200/60 bg-white/95 backdrop-blur-xs p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#0F1B2D] flex items-center justify-center shrink-0 border border-amber-200/80">
                <Info className="w-4.5 h-4.5 text-[#FF9800]" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#0F1B2D] uppercase tracking-wider">
                    Delivery Notice
                  </h4>
                  <span className="text-[10px] font-semibold text-[#168A6A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Dispatch Info
                  </span>
                </div>
                <p className="text-xs text-[#5F6B7A] leading-relaxed">
                  Delivery timelines depend on stock availability, order size, destination and transport requirements. Standard orders may take 1–7 working days. Same-day or priority delivery may be available for selected local orders. Unloading charges, if applicable, are payable separately.
                </p>
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => {
                  if (onOpenBulkQuoteModal) {
                    onOpenBulkQuoteModal();
                  } else {
                    window.open(
                      'https://wa.me/918777400280?text=Hi%20Giriraj%20Power,%20I%20would%20like%20to%20request%20a%20project%20wholesale%20quote.',
                      '_blank'
                    );
                  }
                }}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#FFFDF9] hover:bg-amber-50 active:bg-amber-100 text-[#0F1B2D] font-black text-xs sm:text-sm transition-all border border-amber-300/80 hover:border-amber-400 shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2.5 active:scale-98"
              >
                <FileText className="w-4 h-4 text-[#FF9800]" />
                <span>Request a Quote</span>
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================================
            ROW 7: BRAND NAMES WE ARE SELLING (Official Logos & Borderless Showcase)
            ===================================================================== */}
        <section id="row-7-brands" className="space-y-6 pt-2">
          {/* Centered Heading & Subtitle */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-sf-pro text-[#0F1B2D] tracking-tight">
                Brands Available on Our Platform
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5F6B7A] font-medium leading-relaxed">
              100% Authorized &amp; Direct Manufacturer Sourcing for Kolkata Builders, Electricians &amp; Contractors
            </p>
          </div>

          {/* Side-by-Side Borderless Official Brand Showcase Grid (Centered items if last row is incomplete) */}
          <div className="flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
            {OFFICIAL_BRANDS.map((brand) => (
              <Link
                key={`grid-${brand.id}`}
                to={brand.targetRoute}
                className="group w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.75rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(14.285%-0.9rem)] min-w-[130px] p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 hover:shadow-xs transition-all flex flex-col justify-between items-center text-center cursor-pointer border-0"
              >
                {/* Official Logo Display */}
                <div className="h-10 flex items-center justify-center w-full group-hover:scale-105 transition-transform duration-200">
                  {brand.renderLogo()}
                </div>

                {/* Brand Name & Segment (No extra badges/tags) */}
                <div className="mt-2 space-y-0.5 w-full text-center">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-amber-800 transition-colors">
                    {brand.name}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">
                    {brand.segment}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Continuous Slow-Moving Logo Carousel (Bottom White/Light Bar - Edge to Edge Rectangle) */}
          <div className="-mx-4 sm:-mx-6 relative overflow-hidden py-3.5 bg-white/95 rounded-none border-y border-x-0 border-slate-200/80 shadow-2xs">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee-slow flex items-center gap-6 whitespace-nowrap">
              {OFFICIAL_BRANDS.map((brand) => (
                <Link
                  key={`marquee-1-${brand.id}`}
                  to={brand.targetRoute}
                  className="inline-flex items-center gap-3 px-4 py-1.5 hover:bg-slate-50 transition-all cursor-pointer select-none shrink-0"
                >
                  <div className="shrink-0 flex items-center justify-center">
                    {brand.renderLogo()}
                  </div>
                </Link>
              ))}

              {/* Duplicate array for continuous infinite scroll */}
              {OFFICIAL_BRANDS.map((brand) => (
                <Link
                  key={`marquee-2-${brand.id}`}
                  to={brand.targetRoute}
                  className="inline-flex items-center gap-3 px-4 py-1.5 hover:bg-slate-50 transition-all cursor-pointer select-none shrink-0"
                  aria-hidden="true"
                >
                  <div className="shrink-0 flex items-center justify-center">
                    {brand.renderLogo()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            ROW 8: CALCULATOR (Unified AI & Wholesale Material Cost Estimator)
            ===================================================================== */}
        <MaterialCostCalculator onAddToCart={onAddToCart} cartItems={cartItems} />

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
