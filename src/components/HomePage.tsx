import React, { useState, useEffect } from 'react';
import {
  Zap,
  Building2,
  Hammer,
  Droplets,
  HardHat,
  Wrench,
  Layers,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Download,
  MessageSquare,
  Phone,
  ShieldCheck,
  FileText,
  Sparkles,
  Truck,
  Percent,
  Star,
  ChevronRight,
  Eye,
  Sliders,
  Paintbrush,
  Boxes,
  Flame,
  BadgePercent,
  Compass,
  Check,
  Package,
  MapPin,
  ExternalLink,
  Clock,
  Navigation
} from 'lucide-react';
import { Product } from '../types';
import { StoreLocatorMap } from './StoreLocatorMap';

interface HomePageProps {
  onAddToCart: (product: Product) => void;
  onNavigateCategory: (categoryName: string) => void;
  onOpenBulkQuoteModal?: () => void;
  onOpenProductQuickView?: (product: Product) => void;
}

// 12 Visual Categories directly matching reference design layout & hardware catalog
export const REFERENCE_CATEGORIES = [
  {
    id: 'cement',
    name: 'Cement',
    tag: 'Bulk Prices',
    tagColor: 'bg-amber-400 text-slate-900',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=400&auto=format&fit=crop',
    icon: Building2,
    subtext: 'UltraTech, ACC, Ambuja Grade 53'
  },
  {
    id: 'tiling',
    name: 'Tiling',
    tag: 'Bulk Prices',
    tagColor: 'bg-amber-400 text-slate-900',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop',
    icon: Layers,
    subtext: 'Roff Adhesives, Spacers & Grouts'
  },
  {
    id: 'painting',
    name: 'Painting',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400&auto=format&fit=crop',
    icon: Paintbrush,
    subtext: 'Asian Paints, Royale, Wall Putty'
  },
  {
    id: 'water-proofing',
    name: 'Water Proofing',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop',
    icon: Droplets,
    subtext: 'Dr. Fixit LW+, URP & Sealants'
  },
  {
    id: 'plywood-mdf',
    name: 'Plywood, MDF & HDHMR',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=400&auto=format&fit=crop',
    icon: Boxes,
    subtext: 'Action TESA, CenturyPly Marine'
  },
  {
    id: 'fevicol',
    name: 'Fevicol',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400&auto=format&fit=crop',
    icon: Sparkles,
    subtext: 'Fevicol SH, Marine, HeatX & Hi-Per'
  },
  {
    id: 'electrical-wires',
    name: 'Electrical Wires & Cables',
    tag: 'Wholesale',
    tagColor: 'bg-rose-500 text-white',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=400&auto=format&fit=crop',
    icon: Zap,
    subtext: 'Polycab, Finolex, RR Kabel FR-LS'
  },
  {
    id: 'sinks-fittings',
    name: 'Sinks & Kitchen Fittings',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=400&auto=format&fit=crop',
    icon: Droplets,
    subtext: 'SS 304, Quartz Sinks & Swan Taps'
  },
  {
    id: 'sanitary-bath',
    name: 'Sanitary & Bath Ware',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop',
    icon: Droplets,
    subtext: 'Wall Hung Commodes & Cisterns'
  },
  {
    id: 'modular-switches',
    name: 'Modular Switches & Sockets',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400&auto=format&fit=crop',
    icon: Sliders,
    subtext: 'Legrand, Schneider, Anchor Roma'
  },
  {
    id: 'hardware-hinges',
    name: 'Hardware, Hinges & Channels',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=400&auto=format&fit=crop',
    icon: Hammer,
    subtext: 'Telescopic Channels, Auto Hinges'
  },
  {
    id: 'kitchen-storage',
    name: 'Kitchen Baskets & Storage',
    bgColor: 'bg-[#EBF2F7]',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400&auto=format&fit=crop',
    icon: Package,
    subtext: 'SS Tandem Baskets, Cutlery Organizers'
  }
];

// Featured Wholesale Best-Sellers
const BEST_SELLERS: Product[] = [
  {
    id: 'rr-kabel-superex-fr-1-5',
    name: 'RR Kabel Superex FR 1.5 sq mm Copper Wire (90m Red)',
    brand: 'RR Kabel',
    price: 1845,
    originalPrice: 2280,
    discountPercentage: 19,
    unit: 'coil',
    category: 'electrical',
    subCategory: '1.5 sq mm',
    image: 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=600&auto=format&fit=crop',
    inStock: true,
    stockCount: 140,
    rating: 4.9,
    reviewsCount: 88,
    deliveryMinutes: 60,
    isEmergency: false,
    isBestSeller: true,
    tags: ['Best Seller', 'Contractor Choice'],
    specs: {
      'Conductor': '100% Electrolytic Bare Copper',
      'Length': '90 Meters Box',
      'Flame Retardant': 'FR Class (IS 694)',
      'Voltage Grade': 'Up to 1100V'
    },
    description: 'High conductivity copper wire with premium PVC insulation for domestic and commercial wiring.'
  },
  {
    id: 'polycab-optima-2-5',
    name: 'Polycab Optima+ 2.5 sq mm HR-FR Lead-Free Wire (90m Yellow)',
    brand: 'Polycab',
    price: 2950,
    originalPrice: 3620,
    discountPercentage: 18,
    unit: 'coil',
    category: 'electrical',
    subCategory: '2.5 sq mm',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
    inStock: true,
    stockCount: 95,
    rating: 4.8,
    reviewsCount: 64,
    deliveryMinutes: 60,
    isEmergency: false,
    isBestSeller: true,
    tags: ['Lead-Free', 'High Heat Resistant'],
    specs: {
      'Conductor': 'High Conductivity Annealed Copper',
      'Length': '90 Meters Standard',
      'Certification': 'ISI / BIS Marked',
      'Insulation': 'HR-FR PVC'
    },
    description: 'Heat resistant flame retardant lead-free wire ideal for ACs, geysers and heavy appliances.'
  },
  {
    id: 'schneider-acti9-mcb-16a',
    name: 'Schneider Electric Acti9 16A Single Pole C-Curve MCB (10kA)',
    brand: 'Schneider Electric',
    price: 245,
    originalPrice: 330,
    discountPercentage: 25,
    unit: 'piece',
    category: 'electrical',
    subCategory: 'Single Pole MCB',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop',
    inStock: true,
    stockCount: 320,
    rating: 4.9,
    reviewsCount: 112,
    deliveryMinutes: 60,
    isEmergency: false,
    isBestSeller: true,
    tags: ['10kA Heavy Breaking', 'Industrial Grade'],
    specs: {
      'Breaking Capacity': '10kA at 240/415V',
      'Poles': 'Single Pole (1P)',
      'Standard': 'IEC/EN 60898-1',
      'Tripping Curve': 'Type C'
    },
    description: 'Industrial-grade miniature circuit breaker providing certified overload and short-circuit protection.'
  },
  {
    id: 'legrand-mylinc-switch-6a',
    name: 'Legrand Mylinc 6A 1-Way Modular Switch (White Glossy - Box of 20)',
    brand: 'Legrand',
    price: 780,
    originalPrice: 980,
    discountPercentage: 20,
    unit: 'box (20 pcs)',
    category: 'electrical',
    subCategory: '6A Modular Switch',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=600&auto=format&fit=crop',
    inStock: true,
    stockCount: 180,
    rating: 4.9,
    reviewsCount: 75,
    deliveryMinutes: 60,
    isEmergency: false,
    isBestSeller: false,
    tags: ['Silent Click', 'Silver Contact'],
    specs: {
      'Quantity': '20 Pieces per Box',
      'Current Rating': '6 Ampere 240V',
      'Contact': 'Silver Inlaid contacts',
      'Life Span': '100,000+ operations'
    },
    description: 'Ultra sleek glossy white modular switches engineered for 100,000+ smooth clicks.'
  }
];

export const HomePage: React.FC<HomePageProps> = ({
  onAddToCart,
  onNavigateCategory,
  onOpenBulkQuoteModal,
  onOpenProductQuickView
}) => {
  // BHK Smart Calculator State
  const [bhkConfig, setBhkConfig] = useState<'1bhk' | '2bhk' | '3bhk' | '4bhk' | 'duplex'>('2bhk');
  const [calcWireGrade, setCalcWireGrade] = useState<'fr' | 'frls' | 'zhfr'>('frls');
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  // Construction Area Estimator State
  const [builtUpArea, setBuiltUpArea] = useState<number>(1200);
  const [constructionType, setConstructionType] = useState<'standard' | 'premium'>('standard');

  const handleQuickAdd = (product: Product) => {
    onAddToCart(product);
    setAddedItemNotice(`${product.name.substring(0, 32)}... added to order!`);
    setTimeout(() => setAddedItemNotice(null), 3000);
  };

  // Wire estimates by BHK
  const getBhkEstimates = () => {
    switch (bhkConfig) {
      case '1bhk':
        return {
          c1: 2, // 1.0 sq mm
          c15: 3, // 1.5 sq mm
          c25: 2, // 2.5 sq mm
          c40: 1, // 4.0 sq mm
          switches: 24,
          sockets: 14,
          mcbs: 6,
          conduitMeters: 120,
          approxCost: 14850
        };
      case '2bhk':
        return {
          c1: 4,
          c15: 6,
          c25: 4,
          c40: 2,
          switches: 42,
          sockets: 26,
          mcbs: 10,
          conduitMeters: 240,
          approxCost: 28900
        };
      case '3bhk':
        return {
          c1: 6,
          c15: 9,
          c25: 6,
          c40: 3,
          switches: 64,
          sockets: 38,
          mcbs: 16,
          conduitMeters: 360,
          approxCost: 43200
        };
      case '4bhk':
        return {
          c1: 8,
          c15: 12,
          c25: 8,
          c40: 4,
          switches: 88,
          sockets: 52,
          mcbs: 22,
          conduitMeters: 480,
          approxCost: 58500
        };
      case 'duplex':
        return {
          c1: 12,
          c15: 18,
          c25: 12,
          c40: 6,
          switches: 130,
          sockets: 78,
          mcbs: 32,
          conduitMeters: 750,
          approxCost: 89400
        };
    }
  };

  const currentBhkEstimate = getBhkEstimates();

  // Construction estimates based on built-up sq ft
  const getConstructionEstimates = () => {
    const ratePerSqFt = constructionType === 'premium' ? 1750 : 1450;
    const cementBags = Math.round(builtUpArea * 0.42); // ~0.4 bags per sq ft
    const steelTons = Number((builtUpArea * 0.0035).toFixed(2)); // ~3.5 kg/sqft -> tons
    const sandCuFt = Math.round(builtUpArea * 1.8);
    const bricksCount = Math.round(builtUpArea * 18);
    const approxTotal = builtUpArea * ratePerSqFt;

    return {
      cementBags,
      steelTons,
      sandCuFt,
      bricksCount,
      approxTotal
    };
  };

  const currentConstructionEstimate = getConstructionEstimates();

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 font-sans">
      {/* Toast Notice */}
      {addedItemNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{addedItemNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION - REDESIGNED EXACTLY LIKE USER'S REFERENCE IMAGE         */}
      {/* ========================================================================= */}
      <section className="relative bg-[#FFFDF9] border-b border-amber-100/80 pt-4 sm:pt-6 pb-10 sm:pb-14 overflow-hidden">
        {/* Soft background glow & shapes */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            
            {/* Left Content Area: Headline + 4 Reference Benefit Cards */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              
              {/* Location Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2F7E9] border border-[#B7ECC7] text-[#166534] text-xs font-bold shadow-2xs">
                <MapPin className="w-3.5 h-3.5 fill-[#166534] text-[#166534]" />
                <span>Serving Kolkata &amp; Bengal</span>
              </div>

              {/* Big Bold Headline matching screenshot */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-slate-900 tracking-tight leading-[1.12]">
                  Construction &amp; electrical materials <br className="hidden sm:inline" />
                  delivered in{' '}
                  <span className="text-[#15803D] inline-block relative">
                    60 minutes.
                    <span className="absolute bottom-1 left-0 w-full h-1.5 bg-[#86EFAC]/40 -z-10 rounded" />
                  </span>
                </h1>
                <p className="text-slate-600 text-base sm:text-lg font-medium pt-2">
                  Everything on wholesale prices.
                </p>
              </div>

              {/* 4 Reference Benefit Tiles in 2x2 Grid matching screenshot */}
              <div className="grid grid-cols-2 gap-3 sm:gap-3.5 pt-2">
                
                {/* 1. Pay on Delivery */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="font-black text-base">₹</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      Pay on Delivery
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal">Cash or UPI on site</p>
                  </div>
                </div>

                {/* 2. No minimum order value */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      No minimum order value
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal">Buy 1 pc or 1000+ pcs</p>
                  </div>
                </div>

                {/* 3. Free Delivery */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      Free Delivery
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal">on orders above ₹1000</p>
                  </div>
                </div>

                {/* 4. Upto 2% Cashback */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Percent className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      Upto 2% Cashback
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal">on every order</p>
                  </div>
                </div>

              </div>

              {/* CTA Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigateCategory('electrical')}
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Browse Electricals</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('smart-cost-calculators');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <span>Material Cost Estimator</span>
                </button>

                <a
                  href="#store-locator-map-section"
                  className="px-4 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Kasba Store &amp; Map</span>
                </a>
              </div>

            </div>

            {/* Right Visual Area: Delivery Truck loaded with brand supplies branded with Giriraj Power */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-50 via-stone-50 to-emerald-50 p-4 sm:p-6 border border-amber-200/90 shadow-lg">
                
                {/* Visual Delivery Composition Card */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white min-h-[300px] sm:min-h-[360px] flex flex-col justify-between p-5 sm:p-7 shadow-inner">
                  
                  {/* Construction site backdrop image */}
                  <img
                    src="https://images.unsplash.com/photo-1541888946425-d0fbb186156a?q=80&w=1200&auto=format&fit=crop"
                    alt="Giriraj Power 60-Minute Fast Dispatch Hub"
                    className="absolute inset-0 w-full h-full object-cover opacity-25"
                  />

                  {/* Gradient angled overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />

                  {/* Top Truck Dispatch Header */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg shadow-sm">
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      <span>GIRIRAJ POWER EXPRESS</span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3 text-emerald-400" /> 60-Min Dispatch Active
                    </span>
                  </div>

                  {/* Visual Representation of Truck Bed with Brands (UltraTech, Polycab, Asian Paints, Fevicol, TESA) */}
                  <div className="relative z-10 my-4 py-2">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                        <span>Direct Warehouse Load • Kasba Hub</span>
                        <span>Zero Brokerage</span>
                      </div>

                      {/* Brand Chips loaded on truck */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-white/90 text-slate-900 font-bold shadow-xs">
                          <span className="text-[10px] text-amber-700 block font-normal">Cement</span>
                          UltraTech
                        </div>
                        <div className="p-2 rounded-xl bg-white/90 text-slate-900 font-bold shadow-xs">
                          <span className="text-[10px] text-emerald-700 block font-normal">Wires</span>
                          Polycab FR
                        </div>
                        <div className="p-2 rounded-xl bg-white/90 text-slate-900 font-bold shadow-xs">
                          <span className="text-[10px] text-blue-700 block font-normal">Paints</span>
                          Royale Luxury
                        </div>
                        <div className="p-2 rounded-xl bg-white/90 text-slate-900 font-bold shadow-xs">
                          <span className="text-[10px] text-rose-700 block font-normal">Adhesive</span>
                          Fevicol SH
                        </div>
                        <div className="p-2 rounded-xl bg-white/90 text-slate-900 font-bold shadow-xs">
                          <span className="text-[10px] text-purple-700 block font-normal">Plywood</span>
                          Action TESA
                        </div>
                        <div className="p-2 rounded-xl bg-white/90 text-slate-900 font-bold shadow-xs">
                          <span className="text-[10px] text-cyan-700 block font-normal">Sanitary</span>
                          Ceramic Ware
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Truck Brand Banner Bar */}
                  <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                        ⚡
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-tight">Giriraj Power</p>
                        <p className="text-[10px] text-slate-300">Kasba Central Wholesale Depot</p>
                      </div>
                    </div>

                    <a
                      href="#store-locator-map-section"
                      className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1 hover:underline"
                    >
                      <span>Track Depot</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>

                {/* Floating Fast Delivery Badge */}
                <div className="absolute -bottom-2 -left-2 bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 border border-emerald-400">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Kolkata Same-Day Delivery</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATEGORY GRID - EXACTLY LIKE USER'S REFERENCE IMAGE (12 CATEGORIES)     */}
      {/* ========================================================================= */}
      <section className="py-10 sm:py-14 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Section Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                <Boxes className="w-3.5 h-3.5 text-amber-600" />
                <span>Wholesale Department Store</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Shop By Material Category
              </h2>
            </div>
            <button
              onClick={() => onNavigateCategory('electrical')}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer self-start sm:self-auto"
            >
              <span>View All 50,000+ SKUs</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12-Item Category Grid matching the reference layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
            {REFERENCE_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigateCategory(cat.name)}
                  className="group flex flex-col items-center text-center cursor-pointer"
                >
                  {/* Rounded square container matching screenshot */}
                  <div className="relative w-full aspect-square rounded-2xl bg-[#EBF2F7] hover:bg-[#DDE9F2] transition-all p-3 sm:p-4 flex flex-col items-center justify-center border border-slate-200/60 shadow-2xs group-hover:shadow-md group-hover:-translate-y-0.5">
                    
                    {/* Top Yellow / Coral Tag Badge if applicable */}
                    {cat.tag && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] tracking-wide uppercase shadow-2xs ${cat.tagColor || 'bg-amber-400 text-slate-900'}`}>
                          {cat.tag}
                        </span>
                      </div>
                    )}

                    {/* Category Image / Visual Representation */}
                    <div className="w-full h-full max-h-[100px] flex items-center justify-center overflow-hidden rounded-xl">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Category Name & Subtext */}
                  <div className="mt-2.5 space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-amber-700 transition-colors leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-normal line-clamp-1">
                      {cat.subtext}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MONSOON PREPAREDNESS & FLASH DEALS BANNER (Coral & Green Accents)      */}
      {/* ========================================================================= */}
      <section className="py-6 sm:py-8 bg-[#FFF8F6] border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white p-5 sm:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
            
            {/* Background patterns */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white font-black text-[11px] uppercase tracking-wider backdrop-blur-xs">
                <Flame className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span>Monsoon &amp; Contractor Drive</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Heavy-Duty Waterproof Cabling &amp; Dr. Fixit Chemical Deals
              </h3>
              <p className="text-rose-100 text-xs sm:text-sm max-w-2xl font-normal">
                Protect sites from water seepage and electrical short-circuits. Special extra 5% contractor rebate on bundle orders of 10+ coils or 20+ barrels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigateCategory('electrical')}
                className="px-5 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                Claim Monsoon Deals
              </button>
              <a
                href="#store-locator-map-section"
                className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-white font-semibold text-xs border border-white/30 transition-all"
              >
                Depot Pickup
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. WHOLESALE BEST-SELLERS & TIERED PRICING SHOWCASE                        */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-[#FFFDF9] border-b border-amber-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                <BadgePercent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct Factory Tiered Rates</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Contractor Best Sellers
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                Transparent wholesale bulk brackets with instant GST invoice computation.
              </p>
            </div>

            <button
              onClick={() => onNavigateCategory('electrical')}
              className="text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Explore All Products</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BEST_SELLERS.map((prod) => (
              <div
                key={prod.id}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition-all p-4 flex flex-col justify-between relative group"
              >
                {/* Bestseller Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase shadow-2xs">
                    Wholesale Pick
                  </span>
                </div>

                {/* Product Image */}
                <div className="w-full aspect-video rounded-xl bg-slate-50 overflow-hidden mb-3.5 relative flex items-center justify-center p-2">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {onOpenProductQuickView && (
                    <button
                      onClick={() => onOpenProductQuickView(prod)}
                      className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-slate-800 p-1.5 rounded-lg text-xs shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      title="Quick Specs View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-amber-700">{prod.brand}</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Stock ({prod.stockCount})
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                    {prod.name}
                  </h3>

                  {/* Price & MRP */}
                  <div className="pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-slate-900">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{prod.originalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Save {Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">per {prod.unit} (incl. GST)</p>
                  </div>

                  {/* Wholesale Specs Preview */}
                  <div className="p-2 rounded-xl bg-[#FAF8F5] border border-amber-100 text-[10px] space-y-0.5">
                    <p className="font-bold text-slate-700">Wholesale Fast Dispatch:</p>
                    <p className="text-slate-500 font-normal line-clamp-1">
                      {prod.description}
                    </p>
                  </div>
                </div>

                {/* Add to Cart / Order Action */}
                <div className="pt-3 border-t border-slate-100 mt-3">
                  <button
                    onClick={() => handleQuickAdd(prod)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Add to Wholesale Order</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE SMART COST ESTIMATOR (House Wiring & Construction Area)    */}
      {/* ========================================================================= */}
      <section id="smart-cost-calculators" className="py-12 sm:py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-2">
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>Smart Planning Tools</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Instant Wholesale Material Estimator
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Calculate wire coils, switch boxes, cement bags and TMT steel needed for your project with live Kolkata market pricing.
            </p>
          </div>

          {/* 2-Column Calculator Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Tool 1: House Wiring Calculator */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-amber-200 p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      House Wiring &amp; Electrical Calculator
                    </h3>
                    <p className="text-[11px] text-slate-500">Estimates standard copper coils &amp; MCB gang boxes</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  IS:694 Certified
                </span>
              </div>

              {/* BHK Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Property Size:
                </label>
                <div className="grid grid-cols-5 gap-1.5 text-xs font-bold">
                  {(['1bhk', '2bhk', '3bhk', '4bhk', 'duplex'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setBhkConfig(type)}
                      className={`py-2 px-1 rounded-xl uppercase transition-all cursor-pointer text-center ${
                        bhkConfig === type
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wire Grade Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Wire Safety Grade:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => setCalcWireGrade('fr')}
                    className={`p-2 rounded-xl text-left border cursor-pointer ${
                      calcWireGrade === 'fr'
                        ? 'border-amber-500 bg-amber-50/70 text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">FR Flame Retardant</span>
                    <span className="text-[10px] text-slate-500">Economy Grade</span>
                  </button>

                  <button
                    onClick={() => setCalcWireGrade('frls')}
                    className={`p-2 rounded-xl text-left border cursor-pointer ${
                      calcWireGrade === 'frls'
                        ? 'border-amber-500 bg-amber-50/70 text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">FR-LS Low Smoke</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Recommended</span>
                  </button>

                  <button
                    onClick={() => setCalcWireGrade('zhfr')}
                    className={`p-2 rounded-xl text-left border cursor-pointer ${
                      calcWireGrade === 'zhfr'
                        ? 'border-amber-500 bg-amber-50/70 text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">ZHFR Zero Halogen</span>
                    <span className="text-[10px] text-slate-500">Premium Safety</span>
                  </button>
                </div>
              </div>

              {/* Bill of Materials Output Table */}
              <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold border-b border-slate-100 pb-1.5">
                  <span>Required Material</span>
                  <span>Estimated Quantity</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>1.0 sq mm Wire (Lights &amp; Fans)</span>
                  <strong className="text-slate-900">{currentBhkEstimate.c1} Coils (90m)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>1.5 sq mm Wire (Power &amp; Sockets)</span>
                  <strong className="text-slate-900">{currentBhkEstimate.c15} Coils (90m)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>2.5 sq mm Wire (ACs &amp; Geysers)</span>
                  <strong className="text-slate-900">{currentBhkEstimate.c25} Coils (90m)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>4.0 sq mm Wire (Main Incomer / Kitchen)</span>
                  <strong className="text-slate-900">{currentBhkEstimate.c40} Coils (90m)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Modular Switches &amp; Sockets</span>
                  <strong className="text-slate-900">~{currentBhkEstimate.switches + currentBhkEstimate.sockets} Units</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Distribution MCBs</span>
                  <strong className="text-slate-900">{currentBhkEstimate.mcbs} Poles</strong>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">Estimated Wholesale Bill:</span>
                  <span className="font-black text-emerald-700 text-base">
                    ₹{currentBhkEstimate.approxCost.toLocaleString('en-IN')}*
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateCategory('electrical')}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Shop This Electrical Package</span>
              </button>
            </div>

            {/* Tool 2: Construction Raw Material Estimator */}
            <div className="rounded-2xl bg-[#FFFDF9] border border-amber-200 p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    🏗️
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      Construction &amp; Cement Estimator
                    </h3>
                    <p className="text-[11px] text-slate-500">Calculates cement bags, TMT steel &amp; aggregates</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Fe 550D Standards
                </span>
              </div>

              {/* Slider for Built-up Sq Ft */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <span>Built-up Slab Area:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black text-sm">
                    {builtUpArea.toLocaleString('en-IN')} sq. ft.
                  </span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="5000"
                  step="100"
                  value={builtUpArea}
                  onChange={(e) => setBuiltUpArea(Number(e.target.value))}
                  className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>400 sq.ft (Small Flat)</span>
                  <span>2,000 sq.ft (House)</span>
                  <span>5,000 sq.ft (Multi-story)</span>
                </div>
              </div>

              {/* Construction Grade */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Structure Construction Quality:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setConstructionType('standard')}
                    className={`p-2.5 rounded-xl text-left border cursor-pointer ${
                      constructionType === 'standard'
                        ? 'border-emerald-500 bg-emerald-50 text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">Standard RCC Frame</span>
                    <span className="text-[10px] text-slate-500">₹1,450 / sq.ft average</span>
                  </button>

                  <button
                    onClick={() => setConstructionType('premium')}
                    className={`p-2.5 rounded-xl text-left border cursor-pointer ${
                      constructionType === 'premium'
                        ? 'border-emerald-500 bg-emerald-50 text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">Premium Earthquake Resistant</span>
                    <span className="text-[10px] text-slate-500">₹1,750 / sq.ft Fe 550D</span>
                  </button>
                </div>
              </div>

              {/* Construction BOM Output Table */}
              <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold border-b border-slate-100 pb-1.5">
                  <span>Material Requirement</span>
                  <span>Required Quantity</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cement (UltraTech / ACC Grade 53)</span>
                  <strong className="text-slate-900">{currentConstructionEstimate.cementBags} Bags (50kg)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TMT Steel Bars (Tata Tiscon / Shyam)</span>
                  <strong className="text-slate-900">{currentConstructionEstimate.steelTons} Metric Tons</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sand &amp; Coarse Aggregates</span>
                  <strong className="text-slate-900">~{currentConstructionEstimate.sandCuFt} cu. ft.</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Red Bricks / AAC Blocks</span>
                  <strong className="text-slate-900">~{currentConstructionEstimate.bricksCount} Pieces</strong>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">Estimated Total Project Base:</span>
                  <span className="font-black text-amber-700 text-base">
                    ₹{currentConstructionEstimate.approxTotal.toLocaleString('en-IN')}*
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateCategory('construction')}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Request Custom Bulk BOQ Quote</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRUSTED BRAND PARTNERS TICKER                                          */}
      {/* ========================================================================= */}
      <section className="py-8 bg-[#FAF8F5] border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            100% Genuine Authorized Brand Distributorship
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-80 grayscale hover:grayscale-0 transition-all">
            <span className="font-black text-slate-800 text-sm tracking-tight">POLYCAB</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">FINOLEX</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">RR KABEL</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">HAVELLS</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">ULTRATECH</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">ACTION TESA</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">ASIAN PAINTS</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">FEVICOL</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">SCHNEIDER</span>
            <span className="font-black text-slate-800 text-sm tracking-tight">LEGRAND</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. INTERACTIVE GOOGLE MAP & STORE LOCATOR (Bottom of Homepage)             */}
      {/* ========================================================================= */}
      <StoreLocatorMap
        businessName="Giriraj Power"
        address="Giriraj Power, Bediadanga 1st Ln, Nator Park, Kasba, Kolkata, West Bengal 700039"
        googleMapsUrl="https://share.google/EWHvo68Oi2DsChWWV"
        phone="+91 8777400280"
        contractorPhone="+91 9007168561"
        altPhone="+91 9874569712"
        whatsappNumber="918777400280"
        email="team@girirajpower.in"
      />

    </div>
  );
};
