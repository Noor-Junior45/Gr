import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  ShoppingCart,
  Plus,
  Minus,
  RefreshCw,
  X,
  Search,
  Check
} from 'lucide-react';
import { ElectricalProduct, FilterState, SortOption } from '../../types/electrical';
import { fetchElectricalProducts } from '../../services/electricalService';
import { Product } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { INDIAN_STANDARD_WIRE_COLORS, isWireProduct, isPipeProduct, getProductColorOptions } from '../../data/wireColors';
import { ProductCardImage } from '../ProductCardImage';

interface ElectricalListingPageProps {
  onAddToCart: (product: Product) => void;
  onUpdateQuantity?: (productId: string, delta: number, color?: string) => void;
  cartItems?: { product: Product; quantity: number; selectedColor?: string }[];
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const ALL_SUBCATEGORIES = [
  'Fans',
  'Wiring',
  'Switches',
  'MCBs',
  'Lights',
  'PVC Items',
  'CCTV & Surveillance',
  'Home Appliances'
];
const ALL_BRANDS = ['RR Kabel', 'Polycab', 'Havells', 'Schneider', 'Philips', 'Anchor', 'Crompton', 'Atomberg', 'Hikvision', 'Luminous', 'Finolex', 'Wipro', 'Legrand'];
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

export const ElectricalListingPage: React.FC<ElectricalListingPageProps> = ({
  onAddToCart,
  onUpdateQuantity,
  cartItems = [],
  onOpenCart,
  searchQuery: propSearchQuery,
  onSearchChange
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Sync
  const initialSubcategory = searchParams.get('subcategory');
  const initialSearch = searchParams.get('q') || propSearchQuery || '';

  const [products, setProducts] = useState<ElectricalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
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
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'brand' | 'type' | 'price' | 'sort' | null>(null);
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

  // Load products whenever filters/sort/search change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = () => {
      fetchElectricalProducts(filters, sortOption, searchQuery)
        .then(({ products: data, total }) => {
          if (isMounted) {
            setProducts(data);
            setTotalCount(total);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) setLoading(false);
        });
    };

    loadData();

    // Supabase Real-time listener: Auto-update catalog when products change in Supabase
    const channel = supabase
      .channel('electrical_products_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [filters, sortOption, searchQuery]);

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

  // Helper to check cart quantity
  const getProductCartQty = (productId: string) => {
    const match = cartItems.find((i) => String(i.product.id) === String(productId));
    return match ? match.quantity : 0;
  };

  // Convert ElectricalProduct to local Product for cart handler
  const adaptToCartProduct = (ep: ElectricalProduct): Product => ({
    id: ep.id,
    name: ep.name,
    brand: ep.brand,
    category: (ep.category === 'construction' || ep.category === 'services' || ep.category === 'emergency' ? ep.category : 'electrical') as 'electrical' | 'construction' | 'services' | 'emergency',
    subCategory: ep.subcategory,
    price: ep.price,
    originalPrice: ep.mrp,
    discountPercentage: ep.discount_percent,
    unit: '1 unit',
    rating: ep.rating_avg,
    reviewsCount: ep.rating_count,
    deliveryMinutes: 60,
    image: ep.image_urls[0] || 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop',
    inStock: ep.stock_quantity > 0,
    stockCount: ep.stock_quantity,
    isEmergency: false,
    specs: typeof ep.specifications === 'object' && ep.specifications !== null ? ep.specifications : {},
    description: ep.description,
    tags: [ep.brand, ep.subcategory, 'Electrical']
  });

  // Paginated slices
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      
      {/* FILTER & SORT BAR (Consolidated into All Filters button) */}
      <div ref={dropdownRef} className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 sm:pt-4 sm:pb-3 mb-3 relative">
        <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-3.5">
          
          {/* Left: Main All Filters Button & Active Filter Controls */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            {/* Comprehensive Filter Side-Tab Drawer Button */}
            <button
              id="filter-drawer-pill-btn"
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
            <span className="hidden xs:inline text-xs font-semibold text-slate-400">
              {totalCount} products
            </span>

            {/* Pill Sort By Dropdown */}
            <div className="relative">
              <button
                id="sort-by-pill-btn"
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

        {/* Selected Filter Tags (Clean line-by-line horizontal scroll row, saving space) */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 pt-2 overflow-x-auto scrollbar-none flex-nowrap">
            {searchQuery && (
              <button
                id="clear-search-pill-btn"
                onClick={handleClearSearch}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold shrink-0 hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                title="Clear search query"
              >
                <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                <X className="w-3 h-3 text-slate-300" />
              </button>
            )}
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
            <button
              onClick={handleClearAllFilters}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline px-1 shrink-0 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 4. PRODUCT CATALOG GRID (Borderless, 4 products in one row, reduced height) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Loading electrical catalog...</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {searchQuery ? `No electrical products match "${searchQuery}"` : 'No products found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? 'Check for spelling or search in Construction Materials for cement, paint, pipes, hardware, etc.'
                  : 'Try adjusting your filter pills or search terms.'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => navigate(`/construction?q=${encodeURIComponent(searchQuery)}`)}
                  className="px-4 py-2 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Search &ldquo;{searchQuery}&rdquo; in Construction</span>
                  <span>&rarr;</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-4 py-2 rounded-full bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-500 cursor-pointer shadow-2xs transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
            {paginatedProducts.map((product) => {
              const cartQty = getProductCartQty(product.id);
              const adapted = adaptToCartProduct(product);
              const primaryImage =
                product.image_urls[0] ||
                'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop';

              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between transition-all duration-200 border-0 p-1"
                >
                  {/* Clean Product Image with Floating Discount Tag */}
                  <Link
                    to={`/electrical/product/${product.id}`}
                    className="block aspect-square overflow-hidden rounded-xl bg-slate-50/60 p-3 sm:p-4 mb-2.5 flex items-center justify-center relative cursor-pointer"
                  >
                    {/* Floating discount text (no background box) */}
                    {product.discount_percent > 0 && (
                      <span className="absolute top-2 left-2.5 sm:top-2.5 sm:left-3 text-red-600 font-black text-[11px] sm:text-xs tracking-tight z-10 select-none drop-shadow-2xs">
                        {product.discount_percent}% OFF
                      </span>
                    )}

                    <ProductCardImage
                      images={product.image_urls}
                      imageUrl={primaryImage}
                      alt={product.name}
                      className="group-hover:scale-105"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        to={`/electrical/product/${product.id}`}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors line-clamp-2 leading-snug block mb-1"
                        title={product.name}
                      >
                        {product.name}
                      </Link>

                      {/* Price & MRP */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-base font-black text-slate-950">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.mrp > product.price && (
                          <span className="text-xs text-slate-400 line-through font-medium">
                            ₹{product.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Pipe & Wire Standard Colours Indicator */}
                      {(isWireProduct(adapted) || isPipeProduct(adapted)) && (
                        <div className="mt-1.5 pt-1 border-t border-dashed border-slate-100 flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-500">
                            {isPipeProduct(adapted) ? 'Pipe Colours:' : 'IS 694 Colours:'}
                          </span>
                          <div className="flex items-center gap-1">
                            {getProductColorOptions(adapted).map(c => (
                              <span
                                key={c.name}
                                title={`${c.name} (${c.shortRole || c.name})`}
                                className="w-2.5 h-2.5 rounded-full border border-black/20"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add to Cart / Quick Quantity Controls */}
                    <div className="pt-1.5">
                      {cartQty > 0 ? (
                        <div className="flex items-center justify-between bg-yellow-400 text-slate-950 font-black rounded-lg px-2.5 py-1.5 shadow-xs border border-yellow-500/30">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (onUpdateQuantity) {
                                onUpdateQuantity(adapted.id, -1);
                              }
                            }}
                            className="p-1 hover:bg-yellow-500 rounded cursor-pointer transition-colors active:scale-95"
                            title="Decrease quantity (goes to 0)"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="text-xs font-black px-2">{cartQty} in cart</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (cartQty < 100) {
                                if (onUpdateQuantity) {
                                  onUpdateQuantity(adapted.id, 1);
                                } else {
                                  onAddToCart(adapted);
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
                            onAddToCart(adapted);
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

      {/* 5. SIDE-TAB FILTER DRAWER (Opens when clicking "All Filters" or Mobile) */}
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
                <h2 className="text-lg font-black text-slate-900">Filters</h2>
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
                  {ALL_SUBCATEGORIES.map((sub) => {
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
                        <span>{sub}</span>
                        {checked && <Check className="w-3.5 h-3.5 text-amber-600" />}
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
                  {ALL_BRANDS.map((brand) => {
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
                        {checked && <Check className="w-3.5 h-3.5 text-amber-600" />}
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
                View {totalCount} Products
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
