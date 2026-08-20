import React, { useState, useEffect } from 'react';
import {
  Building2,
  HardHat,
  Search,
  SlidersHorizontal,
  Star,
  Zap,
  ShoppingCart,
  Check,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';
import { transformToElectricalProduct } from '../services/electricalService';
import { Link } from 'react-router-dom';

interface ConstructionPageProps {
  onAddToCart: (product: any) => void;
  cartItems?: any[];
  onOpenCart?: () => void;
}

export const ConstructionPage: React.FC<ConstructionPageProps> = ({
  onAddToCart,
  cartItems = [],
  onOpenCart
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Fetch Construction Products directly from Supabase
  const loadConstructionProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('category', '%construction%')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        const parsed: Product[] = data.map((row) => ({
          id: String(row.id),
          name: row.name || 'Construction Material',
          brand: row.brand || 'Giriraj Build',
          category: 'construction',
          subCategory: row.sub_category || row.subcategory || 'General Materials',
          price: Number(row.price || 0),
          originalPrice: Number(row.original_price || row.originalPrice || row.mrp || (row.price ? row.price * 1.1 : 0)),
          discountPercentage: Number(row.discount_percentage || row.discountPercentage || 0),
          unit: row.unit || '1 Unit',
          rating: Number(row.rating || row.rating_avg || 4.8),
          reviewsCount: Number(row.reviews_count || row.rating_count || 24),
          deliveryMinutes: Number(row.delivery_minutes || 60),
          image: row.image || (Array.isArray(row.image_urls) ? row.image_urls[0] : 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?q=80&w=800&auto=format&fit=crop'),
          inStock: row.in_stock ?? true,
          stockCount: Number(row.stock_count || row.stock_quantity || 100),
          tags: row.tags || ['construction', 'building materials'],
          isEmergency: false,
          specs: typeof row.specs === 'object' ? row.specs : (typeof row.specifications === 'object' ? row.specifications : {}),
          description: row.description || 'Premium grade certified construction supplies delivered direct to site in Kolkata.'
        }));
        setProducts(parsed);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn('Error loading construction products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConstructionProducts();

    // Supabase Real-time listener for products table
    const subscription = supabase
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
      supabase.removeChannel(subscription);
    };
  }, []);

  const subcategories = ['All', ...Array.from(new Set(products.map((p) => p.subCategory).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subCategory.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSub = selectedSubcategory === 'All' || p.subCategory === selectedSubcategory;
    return matchesSearch && matchesSub;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <HardHat className="w-3.5 h-3.5" />
              <span>Giriraj Direct Site Dispatch • Kolkata &amp; Bengal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Construction &amp; Building Materials
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Wholesale cement, TMT rebars, plumbing PVC, electrical conduits, waterproofing, and structural hardware with scheduled on-site delivery.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 min-w-[260px] text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Bulk Project Supply</span>
            </div>
            <p className="text-slate-200 text-[11px]">
              Direct truckload pricing for contractors, builders, and large renovations.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <a
                href="https://wa.me/918777400280?text=Hello%20Giriraj%20Power,%20I%20need%20a%20bulk%20construction%20materials%20quote"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1 text-[11px] transition-colors"
              >
                <span>WhatsApp Quote</span>
              </a>
              <a
                href="tel:+919007168561"
                className="py-2 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-center flex items-center justify-center gap-1 text-[11px] transition-colors"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Contractor Desk</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Search & Subcategory Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cement, TMT, pipes, waterproofing..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500 shadow-2xs"
            />
          </div>

          {subcategories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSubcategory === sub
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid / Empty State */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 py-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                <div className="h-40 bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-100 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((prod) => {
              const qtyInCart = cartItems.find((ci: any) => ci.product.id === prod.id)?.quantity || 0;
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-3 sm:p-4">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3 border border-slate-100">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {prod.discountPercentage > 0 && (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          {prod.discountPercentage}% OFF
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                      {prod.brand} • {prod.subCategory}
                    </p>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="p-3 sm:p-4 pt-0">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-black text-sm sm:text-base text-slate-950">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                      {prod.originalPrice > prod.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{prod.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium ml-auto">
                        /{prod.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart(prod);
                        setCopiedNotification(prod.id);
                        setTimeout(() => setCopiedNotification(null), 1500);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        qtyInCart > 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                      }`}
                    >
                      {qtyInCart > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added ({qtyInCart})</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Realtime Supabase Template Banner when no construction products yet */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto my-8 shadow-2xs space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Construction Materials Catalog Ready
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Add any product directly into your Supabase <code className="bg-slate-100 text-amber-700 font-mono px-1.5 py-0.5 rounded text-xs font-bold">products</code> table with <code className="bg-slate-100 text-amber-700 font-mono px-1.5 py-0.5 rounded text-xs font-bold">category = 'construction'</code>, and it will instantly populate live on this page in real-time.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-left text-xs space-y-2 font-mono text-slate-700">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-200 text-[11px] font-sans">
                <span className="font-bold uppercase tracking-wider">Sample SQL Insert for Supabase</span>
                <span>Real-Time Sync Active</span>
              </div>
              <pre className="overflow-x-auto text-[11px] text-slate-800 leading-relaxed scrollbar-none py-1">
{`INSERT INTO products (
  id, name, brand, category, subcategory, price, mrp, 
  discount_percent, image_urls, stock_quantity, description
) VALUES (
  'c1', 
  'UltraTech Super Cement (50 KG Bag)', 
  'UltraTech', 
  'construction', 
  'Cement', 
  410, 
  440, 
  7, 
  ARRAY['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?q=80&w=800&auto=format&fit=crop'], 
  200, 
  'High-strength Portland Pozzolana Cement for structural casting and masonry.'
);`}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/electrical"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Browse Electrical Store
              </Link>
              <a
                href="tel:+918777400280"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Direct Wholesale Inquiry
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
