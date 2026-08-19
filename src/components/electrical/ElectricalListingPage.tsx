import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  Star,
  Zap,
  ChevronDown,
  ShoppingCart,
  Plus,
  Minus,
  RefreshCw,
  X,
  Search,
  Truck,
  Clock,
  Banknote,
  Check
} from 'lucide-react';
import { ElectricalProduct, FilterState, SortOption } from '../../types/electrical';
import { fetchElectricalProducts } from '../../services/electricalService';
import { Product } from '../../types';

interface ElectricalListingPageProps {
  onAddToCart: (product: Product) => void;
  cartItems?: { product: Product; quantity: number }[];
  onOpenCart?: () => void;
}

const ALL_SUBCATEGORIES = ['Fans', 'Wiring', 'Switches', 'MCBs', 'Lights', 'PVC Items'];
const ALL_BRANDS = ['RR Kabel', 'Polycab', 'Havells', 'Schneider', 'Philips', 'Anchor'];
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
  cartItems = [],
  onOpenCart
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Sync
  const initialSubcategory = searchParams.get('subcategory');
  const initialSearch = searchParams.get('q') || '';

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

    return () => {
      isMounted = false;
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
    setSearchParams({});
    setCurrentPage(1);
    setActiveDropdown(null);
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
    category: 'electrical',
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
    specs: typeof ep.specifications?.Specifications === 'object' ? ep.specifications.Specifications : {},
    description: ep.description,
    tags: [ep.brand, ep.subcategory, 'Electrical']
  });

  // Paginated slices
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;

  // Selected subcategory display name
  const currentCategoryHeading = useMemo(() => {
    if (filters.subcategories.length === 1) {
      return filters.subcategories[0];
    }
    if (filters.subcategories.length > 1) {
      return `${filters.subcategories[0]} & More`;
    }
    return 'Electrical';
  }, [filters.subcategories]);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      
      {/* 1. BREADCRUMB ROW (Home > Electrical Store > Wire) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link to="/" className="hover:text-amber-600 transition-colors">Home</Link>
          <span className="text-slate-400 font-bold">&gt;</span>
          <Link
            to="/electrical"
            onClick={() => {
              setFilters((prev) => ({ ...prev, subcategories: [] }));
              setSearchParams({});
            }}
            className={`hover:text-amber-600 transition-colors ${filters.subcategories.length === 0 ? 'text-slate-900 font-bold' : ''}`}
          >
            Electrical Store
          </Link>
          {filters.subcategories.length === 1 && (
            <>
              <span className="text-slate-400 font-bold">&gt;</span>
              <span className="font-bold text-slate-900">{filters.subcategories[0]}</span>
            </>
          )}
        </div>
      </div>

      {/* FILTER & SORT BAR (Pill Shape Buttons with Side Tab / Dropdown Menus) */}
      <div ref={dropdownRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 mb-6 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          
          {/* Left: Filter Label & Pill-Shaped Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-0.5">Filter:</span>

            {/* Comprehensive Filter Side-Tab Drawer Button */}
            <button
              id="filter-drawer-pill-btn"
              onClick={() => setIsSideFilterOpen(true)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                hasActiveFilters
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>All Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            </button>

            {/* Category Pill Dropdown */}
            <div className="relative">
              <button
                id="filter-category-pill"
                onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  filters.subcategories.length > 0
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span>Category</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {activeDropdown === 'category' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-30 space-y-2 animate-in fade-in zoom-in-95">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Select Subcategory</span>
                    {filters.subcategories.length > 0 && (
                      <button
                        onClick={() => setFilters((p) => ({ ...p, subcategories: [] }))}
                        className="text-amber-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {ALL_SUBCATEGORIES.map((sub) => {
                      const checked = filters.subcategories.includes(sub);
                      return (
                        <button
                          key={sub}
                          onClick={() => handleToggleSubcategory(sub)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            checked ? 'bg-amber-50 text-amber-950 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{sub}</span>
                          {checked && <Check className="w-3.5 h-3.5 text-amber-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Brand Pill Dropdown */}
            <div className="relative">
              <button
                id="filter-brand-pill"
                onClick={() => setActiveDropdown(activeDropdown === 'brand' ? null : 'brand')}
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  filters.brands.length > 0
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span>Brand</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {activeDropdown === 'brand' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-30 space-y-2 animate-in fade-in zoom-in-95">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Select Brand</span>
                    {filters.brands.length > 0 && (
                      <button
                        onClick={() => setFilters((p) => ({ ...p, brands: [] }))}
                        className="text-amber-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {ALL_BRANDS.map((brand) => {
                      const checked = filters.brands.includes(brand);
                      return (
                        <button
                          key={brand}
                          onClick={() => handleToggleBrand(brand)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            checked ? 'bg-amber-50 text-amber-950 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{brand}</span>
                          {checked && <Check className="w-3.5 h-3.5 text-amber-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price Range Pill Dropdown */}
            <div className="relative">
              <button
                id="filter-price-pill"
                onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  filters.minPrice !== undefined || filters.maxPrice !== undefined
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span>Price</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {activeDropdown === 'price' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-30 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                    Price Range (₹)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Min</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice ?? ''}
                        onChange={(e) =>
                          setFilters((p) => ({
                            ...p,
                            minPrice: e.target.value ? Number(e.target.value) : undefined
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Max</span>
                      <input
                        type="number"
                        placeholder="50000"
                        value={filters.maxPrice ?? ''}
                        onChange={(e) =>
                          setFilters((p) => ({
                            ...p,
                            maxPrice: e.target.value ? Number(e.target.value) : undefined
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setFilters((p) => ({ ...p, minPrice: undefined, maxPrice: undefined }))}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setActiveDropdown(null)}
                      className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-black cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear All pill badge if any filter active */}
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Right: Product Count & Pill Sort By Dropdown */}
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-xs font-semibold text-slate-400">
              {totalCount} products
            </span>

            {/* Pill Sort By Dropdown */}
            <div className="relative">
              <button
                id="sort-by-pill-btn"
                onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
              >
                <span className="text-slate-400 font-normal">Sort by:</span>
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
      </div>

      {/* 4. PRODUCT CATALOG GRID (Borderless, 4 products in one row) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Loading electrical catalog...</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your filter pills or search terms.
            </p>
            <button
              onClick={handleClearAllFilters}
              className="px-5 py-2 rounded-full bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-500 cursor-pointer shadow-2xs transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-12">
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
                  {/* Top discount badge (yellow pill matching reference image) */}
                  <div className="min-h-6 mb-2">
                    {product.discount_percent > 0 && (
                      <span className="inline-block bg-[#facc15] text-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs tracking-wide">
                        {product.discount_percent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Clean Product Image - Centered and Borderless */}
                  <Link
                    to={`/electrical/product/${product.id}`}
                    className="block aspect-square overflow-hidden rounded-xl bg-slate-50/60 p-4 mb-4 flex items-center justify-center relative cursor-pointer"
                  >
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                      loading="lazy"
                    />
                  </Link>

                  {/* Product Details & Reference-Style Delivery Tags */}
                  <div className="space-y-2 flex-1 flex flex-col justify-between">
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
                    </div>

                    {/* Delivery Tags matching Reference Image */}
                    <div className="space-y-1.5 pt-2">
                      {/* Row 1: 60 Mins & Pay on Delivery */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          60 Mins
                        </span>
                        <span className="flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          Pay on Delivery
                        </span>
                      </div>

                      {/* Row 2: Teal Pill Badge for Free Delivery */}
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f766e] text-white text-[10px] font-bold">
                          <Truck className="w-3 h-3 shrink-0" />
                          <span>Free Delivery <span className="font-normal opacity-90">above ₹500</span></span>
                        </span>
                      </div>
                    </div>

                    {/* Add to Cart / Quick Quantity Controls */}
                    <div className="pt-2">
                      {cartQty > 0 ? (
                        <div className="flex items-center justify-between bg-yellow-400 text-slate-950 font-black rounded-lg px-2.5 py-1.5 shadow-xs border border-yellow-500/30">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              // Call onAddToCart or pass a custom decrease if needed
                            }}
                            className="p-1 hover:bg-yellow-500 rounded cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black px-2">{cartQty} in cart</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              onAddToCart(adapted);
                            }}
                            className="p-1 hover:bg-yellow-500 rounded cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onAddToCart(adapted);
                          }}
                          className="w-full py-2.5 px-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-xs border border-yellow-500/20"
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
