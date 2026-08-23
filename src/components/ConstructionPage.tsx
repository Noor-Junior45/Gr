import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  ShoppingCart,
  Plus,
  Minus,
  RefreshCw,
  X,
  Search,
  Check,
  Building2,
  HardHat,
  MessageSquare,
  PhoneCall,
  Clock,
  ShieldCheck,
  Truck,
  Sparkles
} from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../lib/supabaseClient';
import { INITIAL_PRODUCTS } from '../data/products';

interface ConstructionPageProps {
  onAddToCart: (product: Product) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  cartItems?: { product: Product; quantity: number }[];
  onOpenCart?: () => void;
  onOpenProductQuickView?: (product: Product) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export type SortOption = 'popularity' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface ConstructionFilterState {
  subcategories: string[];
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minDiscount?: number;
  inStockOnly: boolean;
}

const ALL_CONSTRUCTION_SUBCATEGORIES = [
  'Cement & Concrete',
  'TMT & Steel',
  'Tiling & Adhesives',
  'Paints & Putty',
  'Waterproofing',
  'Plywood & Boards',
  'Adhesives & Fevicol',
  'Kitchen Sinks & Faucets',
  'Sanitary & Bath Fittings',
  'Hinges & Hardware',
  'Kitchen Systems & Accessories',
  'Wardrobe & Bed Fittings',
  'Door Locks & Hardware',
  'Plumbing & Pipes',
  'Power Tools',
  'General Hardware & Tools'
];

const ALL_CONSTRUCTION_BRANDS = [
  'UltraTech',
  'ACC',
  'Ambuja',
  'Tata Tiscon',
  'Roff',
  'Asian Paints',
  'Dr. Fixit',
  'CenturyPly',
  'Action TESA',
  'Fevicol',
  'Giriraj Genuine',
  'Jaquar',
  'Hindware',
  'Geberit',
  'Hettich',
  'Godrej',
  'Astral',
  'Supreme',
  'Bosch'
];

const RATING_OPTIONS = [
  { label: '4★ & above', min: 4.0 },
  { label: '3★ & above', min: 3.0 },
  { label: '2★ & above', min: 2.0 }
];

const SORT_LABELS: Record<SortOption, string> = {
  popularity: 'Relevance',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  rating: 'Customer Rating',
  newest: 'Newest First'
};

export const ConstructionPage: React.FC<ConstructionPageProps> = ({
  onAddToCart,
  onUpdateQuantity,
  cartItems = [],
  onOpenCart,
  onOpenProductQuickView,
  searchQuery: propSearchQuery,
  onSearchChange
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Sync
  const initialSubcategory = searchParams.get('subcategory');
  const initialSearch = searchParams.get('q') || propSearchQuery || '';

  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<ConstructionFilterState>({
    subcategories: initialSubcategory ? [initialSubcategory] : [],
    brands: [],
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    minDiscount: undefined,
    inStockOnly: false
  });

  const [sortOption, setSortOption] = useState<SortOption>('popularity');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isSideFilterOpen, setIsSideFilterOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'sort' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync searchQuery when URL param or prop changes
  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (urlQ !== null) {
      setSearchQuery(urlQ);
    } else if (propSearchQuery !== undefined) {
      setSearchQuery(propSearchQuery);
    }
  }, [searchParams, propSearchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Construction Products directly from Supabase with robust fallback
  const loadConstructionProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (!error && data && data.length > 0) {
        // Filter rows that belong to construction category
        const constructionRows = data.filter((row) => {
          const cat = (row.category || '').toLowerCase();
          const sub = (row.subcategory || row.sub_category || '').toLowerCase();
          const name = (row.name || '').toLowerCase();
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
        });

        if (constructionRows.length > 0) {
          const parsed: Product[] = constructionRows.map((row) => {
            const price = Number(row.price || 0);
            const originalPrice = Number(row.original_price || row.originalPrice || row.mrp || (price ? price * 1.15 : 0));
            const discountPercentage = Number(
              row.discount_percentage ||
              row.discountPercentage ||
              row.discount_percent ||
              (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0)
            );

            let imageUrl = 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?q=80&w=800&auto=format&fit=crop';
            if (Array.isArray(row.image_urls) && row.image_urls.length > 0) {
              imageUrl = row.image_urls[0];
            } else if (row.image) {
              imageUrl = row.image;
            }

            return {
              id: String(row.id),
              name: row.name || 'Construction Material',
              brand: row.brand || 'Giriraj Genuine',
              category: 'construction',
              subCategory: row.subcategory || row.sub_category || 'General Materials',
              price,
              originalPrice,
              discountPercentage,
              unit: row.unit || '1 Unit',
              rating: Number(row.rating_avg || row.rating || 4.8),
              reviewsCount: Number(row.rating_count || row.reviewsCount || 18),
              deliveryMinutes: Number(row.delivery_minutes || 60),
              image: imageUrl,
              inStock: (row.stock_quantity ?? row.stockCount ?? 10) > 0,
              stockCount: Number(row.stock_quantity ?? row.stockCount ?? 10),
              tags: row.tags || [row.brand || 'Giriraj', 'Construction'],
              isEmergency: false,
              specs: typeof row.specifications === 'object' ? row.specifications : (typeof row.specs === 'object' ? row.specs : {}),
              description: row.description || 'Premium grade certified construction supplies delivered direct to site in Kolkata.'
            };
          });

          setRawProducts(parsed);
        } else {
          const fallback = INITIAL_PRODUCTS.filter((p) => p.category === 'construction');
          setRawProducts(fallback);
        }
      } else {
        const fallback = INITIAL_PRODUCTS.filter((p) => p.category === 'construction');
        setRawProducts(fallback);
      }
    } catch (err) {
      console.warn('Error loading construction products:', err);
      const fallback = INITIAL_PRODUCTS.filter((p) => p.category === 'construction');
      setRawProducts(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConstructionProducts();

    // Supabase Real-time listener: Auto-update catalog when products change in Supabase
    const channel = supabase
      .channel('construction_products_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadConstructionProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync subcategory filter if URL param changes
  useEffect(() => {
    const sub = searchParams.get('subcategory');
    if (sub && !filters.subcategories.includes(sub)) {
      setFilters((prev) => ({ ...prev, subcategories: [sub] }));
    }
  }, [searchParams]);

  // Filter Handlers
  const handleToggleSubcategory = (sub: string) => {
    setFilters((prev) => {
      const exists = prev.subcategories.includes(sub);
      const nextSubs = exists
        ? prev.subcategories.filter((s) => s !== sub)
        : [...prev.subcategories, sub];
      return { ...prev, subcategories: nextSubs };
    });
    setCurrentPage(1);
  };

  const handleToggleBrand = (brand: string) => {
    setFilters((prev) => {
      const exists = prev.brands.includes(brand);
      const nextBrands = exists
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand];
      return { ...prev, brands: nextBrands };
    });
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({
      subcategories: [],
      brands: [],
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      minDiscount: undefined,
      inStockOnly: false
    });
    setSearchQuery('');
    if (onSearchChange) onSearchChange('');
    setSearchParams({});
    setCurrentPage(1);
    setActiveDropdown(null);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (onSearchChange) onSearchChange('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('q');
    setSearchParams(newParams);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.subcategories.length > 0 ||
      filters.brands.length > 0 ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.minRating !== undefined ||
      filters.minDiscount !== undefined ||
      filters.inStockOnly ||
      searchQuery.trim() !== ''
    );
  }, [filters, searchQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.subcategories.length;
    count += filters.brands.length;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count += 1;
    if (filters.minRating !== undefined) count += 1;
    if (filters.minDiscount !== undefined) count += 1;
    if (filters.inStockOnly) count += 1;
    return count;
  }, [filters]);

  // Filter and Sort raw products
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...rawProducts];

    // Filter subcategories
    if (filters.subcategories.length > 0) {
      list = list.filter((p) => {
        const pSub = (p.subCategory || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return filters.subcategories.some((sub) => {
          const s = sub.toLowerCase();
          return (
            pSub.includes(s) ||
            s.includes(pSub) ||
            (s.includes('cement') && (pName.includes('cement') || pSub.includes('cement'))) ||
            (s.includes('tiling') && (pName.includes('tile') || pSub.includes('tile') || pName.includes('grout') || pSub.includes('tiling'))) ||
            (s.includes('paint') && (pName.includes('paint') || pName.includes('putty') || pSub.includes('paint'))) ||
            (s.includes('waterproof') && (pName.includes('fixit') || pName.includes('waterproof') || pSub.includes('waterproof') || pName.includes('damp'))) ||
            ((s.includes('plywood') || s.includes('mdf')) && (pName.includes('plywood') || pName.includes('hdhmr') || pName.includes('board') || pSub.includes('plywood'))) ||
            ((s.includes('fevicol') || s.includes('adhesive')) && (pName.includes('fevicol') || pName.includes('adhesive') || pSub.includes('adhesive'))) ||
            (s.includes('sink') && (pName.includes('sink') || pName.includes('faucet') || pSub.includes('sink'))) ||
            (s.includes('sanitary') && (pName.includes('commode') || pName.includes('cistern') || pName.includes('toilet') || pSub.includes('sanitary'))) ||
            ((s.includes('hinge') || s.includes('channel') || s.includes('handle')) && (pName.includes('hinge') || pName.includes('channel') || pName.includes('slide') || pName.includes('handle') || pSub.includes('hinge'))) ||
            ((s.includes('kitchen system') || s.includes('kitchen accessory')) && (pName.includes('spice') || pName.includes('basket') || pName.includes('tandem') || pSub.includes('kitchen'))) ||
            ((s.includes('wardrobe') || s.includes('bed')) && (pName.includes('bed') || pName.includes('hydraulic') || pName.includes('wardrobe') || pSub.includes('bed'))) ||
            (s.includes('lock') && (pName.includes('lock') || pName.includes('padlock') || pSub.includes('lock'))) ||
            (s.includes('pipe') && (pName.includes('pipe') || pName.includes('tank') || pSub.includes('pipe') || pSub.includes('plumbing'))) ||
            (s.includes('tool') && (pName.includes('drill') || pName.includes('grinder') || pName.includes('tool') || pSub.includes('tool'))) ||
            (s.includes('general hardware') && (pName.includes('ladder') || pName.includes('tarpaulin') || pName.includes('hammer') || pSub.includes('general')))
          );
        });
      });
    }

    // Filter brands
    if (filters.brands.length > 0) {
      list = list.filter((p) =>
        filters.brands.some((b) => p.brand.toLowerCase().includes(b.toLowerCase()))
      );
    }

    // Min Price
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      list = list.filter((p) => p.price >= filters.minPrice!);
    }

    // Max Price
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      list = list.filter((p) => p.price <= filters.maxPrice!);
    }

    // Min Rating
    if (filters.minRating !== undefined && filters.minRating > 0) {
      list = list.filter((p) => (p.rating || 0) >= filters.minRating!);
    }

    // In Stock Only
    if (filters.inStockOnly) {
      list = list.filter((p) => p.inStock);
    }

    // Search Query (Multi-token, specifications & description matching)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const sub = (p.subCategory || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const tags = (p.tags || []).map((t) => t.toLowerCase()).join(' ');
        const specs = typeof p.specs === 'object' ? JSON.stringify(p.specs).toLowerCase() : '';
        const combined = `${name} ${brand} ${sub} ${desc} ${tags} ${specs}`;
        
        if (combined.includes(q)) return true;
        return tokens.every((token) => combined.includes(token));
      });
    }

    // Sort order
    switch (sortOption) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        list.sort((a, b) => String(b.id).localeCompare(String(a.id)));
        break;
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popularity':
      default:
        list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
    }

    return list;
  }, [rawProducts, filters, sortOption, searchQuery]);

  // Paginated slices
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage]);

  const totalCount = filteredAndSortedProducts.length;

  // Helper to check cart quantity
  const getProductCartQty = (productId: string) => {
    const match = cartItems.find((i) => String(i.product.id) === String(productId));
    return match ? match.quantity : 0;
  };

  const hasBackendProducts = rawProducts.length > 0;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      
      {/* 1. FILTER & SORT BAR (Matches Electrical Page Structure) */}
      <div ref={dropdownRef} className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 sm:pt-4 sm:pb-3 mb-3 relative">
        <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-3.5">
          
          {/* Left: Main All Filters Button & Active Filter Controls */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            <button
              id="construction-filter-drawer-pill-btn"
              onClick={() => setIsSideFilterOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                hasActiveFilters
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>All Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            </button>

            {/* Clear All / Reset pill badge if any filter active */}
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3 h-3" />
                <span className="hidden sm:inline">Clear All</span>
                <span className="sm:hidden">Reset</span>
              </button>
            )}
          </div>

          {/* Right: Product Count & Pill Sort By Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {hasBackendProducts && (
              <span className="hidden xs:inline text-xs font-semibold text-slate-400">
                {totalCount} products
              </span>
            )}

            {/* Pill Sort By Dropdown */}
            <div className="relative">
              <button
                id="construction-sort-by-pill-btn"
                onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <span className="text-slate-400 font-normal hidden sm:inline">Sort by:</span>
                <span className="font-bold text-slate-900">{SORT_LABELS[sortOption]}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {activeDropdown === 'sort' && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-30 space-y-1 animate-in fade-in zoom-in-95">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => {
                    const active = sortOption === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSortOption(key);
                          setActiveDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                          active ? 'bg-amber-50 text-amber-950 font-black' : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{SORT_LABELS[key]}</span>
                        {active && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Filter Tags (Horizontal scroll row) */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 pt-2 overflow-x-auto scrollbar-none flex-nowrap">
            {filters.subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => handleToggleSubcategory(sub)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold shrink-0 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span>{sub}</span>
                <X className="w-3 h-3 text-amber-700" />
              </button>
            ))}
            {filters.brands.map((b) => (
              <button
                key={b}
                onClick={() => handleToggleBrand(b)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold shrink-0 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span>{b}</span>
                <X className="w-3 h-3 text-amber-700" />
              </button>
            ))}
            {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
              <button
                onClick={() => setFilters((p) => ({ ...p, minPrice: undefined, maxPrice: undefined }))}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold shrink-0 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span>
                  ₹{filters.minPrice ?? 0} - ₹{filters.maxPrice ?? 'Any'}
                </span>
                <X className="w-3 h-3 text-amber-700" />
              </button>
            )}
            {filters.minRating !== undefined && (
              <button
                onClick={() => setFilters((p) => ({ ...p, minRating: undefined }))}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold shrink-0 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span>★ {filters.minRating}+</span>
                <X className="w-3 h-3 text-amber-700" />
              </button>
            )}
            {searchQuery.trim() && (
              <button
                id="clear-construction-search-pill-btn"
                onClick={handleClearSearch}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold shrink-0 hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                title="Clear search query"
              >
                <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                <X className="w-3 h-3 text-slate-300" />
              </button>
            )}
            <button
              onClick={handleClearAllFilters}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline px-1 shrink-0 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 2. PRODUCT CATALOG LOCATION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Loading construction catalog...</p>
          </div>
        ) : !hasBackendProducts ? (
          /* =========================================================================
             COMING SOON STATE AT PRODUCT LOCATION (When backend has no products data)
             ========================================================================= */
          <div className="py-12 sm:py-16">
            <div className="max-w-3xl mx-auto bg-slate-50/70 border border-slate-200/80 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-6">
              
              {/* Icon Illustration */}
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-amber-100/80 border border-amber-300/60 text-amber-700 flex items-center justify-center shadow-xs">
                  <Building2 className="w-10 h-10 stroke-[1.8]" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* Header & Description */}
              <div className="space-y-2.5 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[11px] font-black uppercase tracking-wider">
                  <HardHat className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kasba Central Depot • Kolkata</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Construction Materials Coming Soon
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  We are currently onboarding our full wholesale catalog of UltraTech cement, Tata Tiscon TMT rebars, Astral CPVC pipes, Dr. Fixit waterproofing, and structural hardware.
                </p>
              </div>

              {/* Brands Anticipation Grid */}
              <div className="pt-2 pb-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Upcoming Wholesale Authorized Brands
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                  {ALL_CONSTRUCTION_BRANDS.map((brand) => (
                    <span
                      key={brand}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto text-left">
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                  <Truck className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Direct Site Trucks</div>
                    <div className="text-[10px] text-slate-500">Unloaded at site</div>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">100% Genuine</div>
                    <div className="text-[10px] text-slate-500">Manufacturer seals</div>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">GST Invoices</div>
                    <div className="text-[10px] text-slate-500">Official project bills</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Direct Inquiry */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <a
                  href="https://wa.me/918777400280?text=Hello%20Giriraj%20Power,%20I%20need%20a%20wholesale%20quote%20for%20construction%20materials."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Request Instant WhatsApp Quote</span>
                </a>

                <a
                  href="tel:+918777400280"
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Contractor Desk</span>
                </a>

                <Link
                  to="/electrical"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <span>Browse Electrical Store</span>
                </Link>
              </div>

            </div>
          </div>
        ) : paginatedProducts.length === 0 ? (
          /* When backend has products, but current filters/search return 0 */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {searchQuery ? `No construction materials match "${searchQuery}"` : 'No products found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? 'Looking for switches, wires, LEDs, fans, MCBs, or electrical tools?'
                  : 'Try adjusting your filter pills or search terms.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => navigate(`/electrical?q=${encodeURIComponent(searchQuery)}`)}
                  className="px-4 py-2 rounded-full bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-500 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Search &ldquo;{searchQuery}&rdquo; in Electrical Store</span>
                  <span>&rarr;</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-4 py-2 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer shadow-2xs transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             PRODUCT CATALOG GRID (Identical to Electrical Page: 4 columns, clean card)
             ========================================================================= */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
            {paginatedProducts.map((product) => {
              const cartQty = getProductCartQty(product.id);
              const primaryImage = product.image;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between transition-all duration-200 border-0 p-1"
                >
                  {/* Clean Product Image with Floating Discount Tag */}
                  <Link
                    to={`/construction/product/${product.id}`}
                    className="block aspect-square overflow-hidden rounded-xl bg-slate-50/60 p-3 sm:p-4 mb-2.5 flex items-center justify-center relative cursor-pointer"
                  >
                    {/* Floating discount text */}
                    {product.discountPercentage > 0 && (
                      <span className="absolute top-2 left-2.5 sm:top-2.5 sm:left-3 text-red-600 font-black text-[11px] sm:text-xs tracking-tight z-10 select-none drop-shadow-2xs">
                        {product.discountPercentage}% OFF
                      </span>
                    )}

                    <img
                      src={primaryImage}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                      loading="lazy"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        to={`/construction/product/${product.id}`}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors line-clamp-2 leading-snug block mb-1 cursor-pointer"
                        title={product.name}
                      >
                        {product.name}
                      </Link>

                      {/* Price & MRP */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-base font-black text-slate-950">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through font-medium">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart / Quick Quantity Controls */}
                    <div className="pt-1.5">
                      {cartQty > 0 ? (
                        <div className="flex items-center justify-between bg-yellow-400 text-slate-950 font-black rounded-lg px-2.5 py-1.5 shadow-xs border border-yellow-500/30">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (onUpdateQuantity) {
                                onUpdateQuantity(product.id, -1);
                              }
                            }}
                            className="p-1 hover:bg-yellow-500 rounded cursor-pointer transition-colors active:scale-95"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="text-xs font-black px-2">{cartQty} in cart</span>
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
                            disabled={cartQty >= 100}
                            className="p-1 hover:bg-yellow-500 rounded cursor-pointer transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={cartQty >= 100 ? 'Maximum limit of 100 reached' : 'Increase quantity'}
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
                          className="w-full py-2 px-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-xs border border-yellow-500/20"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SIDE-TAB FILTER DRAWER (Matches Electrical Page) */}
      {isSideFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsSideFilterOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-black text-slate-900">Construction Filters</h2>
              </div>
              <button
                onClick={() => setIsSideFilterOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-6 flex-1">
              {/* Subcategories */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Categories
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CONSTRUCTION_SUBCATEGORIES.map((sub) => {
                    const checked = filters.subcategories.includes(sub);
                    return (
                      <button
                        key={sub}
                        onClick={() => handleToggleSubcategory(sub)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          checked
                            ? 'bg-amber-50 border-amber-400 text-amber-950'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{sub}</span>
                        {checked && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brands */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Brands
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CONSTRUCTION_BRANDS.map((brand) => {
                    const checked = filters.brands.includes(brand);
                    return (
                      <button
                        key={brand}
                        onClick={() => handleToggleBrand(brand)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          checked
                            ? 'bg-amber-50 border-amber-400 text-amber-950'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{brand}</span>
                        {checked && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Price (₹)
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Min Price</label>
                    <input
                      type="number"
                      placeholder="₹ Min"
                      value={filters.minPrice ?? ''}
                      onChange={(e) =>
                        setFilters((p) => ({
                          ...p,
                          minPrice: e.target.value ? Number(e.target.value) : undefined
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Max Price</label>
                    <input
                      type="number"
                      placeholder="₹ Max"
                      value={filters.maxPrice ?? ''}
                      onChange={(e) =>
                        setFilters((p) => ({
                          ...p,
                          maxPrice: e.target.value ? Number(e.target.value) : undefined
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Customer Rating
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {RATING_OPTIONS.map((item) => {
                    const isSelected = filters.minRating === item.min;
                    return (
                      <button
                        key={item.label}
                        onClick={() =>
                          setFilters((p) => ({
                            ...p,
                            minRating: isSelected ? undefined : item.min
                          }))
                        }
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={handleClearAllFilters}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsSideFilterOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer text-center"
              >
                View {hasBackendProducts ? `${totalCount} Products` : 'Results'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
