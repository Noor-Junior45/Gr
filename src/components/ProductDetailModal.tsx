import React, { useState, useEffect } from 'react';
import { X, Zap, Star, ShieldCheck, Check, Plus, Minus, Truck, Heart } from 'lucide-react';
import { Product } from '../types';
import { isProductFavorite, toggleProductFavorite } from '../services/favorites';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity
}) => {
  const [isFav, setIsFav] = useState(() => (product ? isProductFavorite(product.id) : false));

  useEffect(() => {
    if (product) {
      setIsFav(isProductFavorite(product.id));
    }
  }, [product]);

  if (!product) return null;

  const handleToggleFav = () => {
    const updated = toggleProductFavorite(product.id);
    setIsFav(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Actions Top Right: Favorite & Close Button */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={handleToggleFav}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isFav ? 'bg-pink-50 text-pink-600' : 'hover:bg-slate-100 text-slate-400 hover:text-pink-600'
            }`}
            title={isFav ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Image & Quick Guarantee */}
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-green-600 text-white text-xs font-black flex items-center gap-1 shadow-sm">
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>60 MINS – 7 DAYS DELIVERY</span>
              </span>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>100% Genuine Brand Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-yellow-600" />
                <span>Dispatched directly from Kolkata Central Hub</span>
              </div>
            </div>
          </div>

          {/* Details & Specs */}
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="text-xs font-extrabold text-green-700 uppercase tracking-wider mb-1">
                {product.brand} • {product.subCategory}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-2">
                {product.name}
              </h2>

              {/* Rating Display (if rated) */}
              {product.rating > 0 && (
                <div className="flex items-center gap-1.5 mb-3 text-xs">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-extrabold">
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(product.rating)
                              ? 'fill-amber-400 text-amber-500'
                              : i < product.rating
                              ? 'fill-amber-300 text-amber-400'
                              : 'text-slate-300 fill-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-xs">{product.rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="p-3.5 rounded-xl bg-yellow-50/70 border border-yellow-200 mb-4">
                <div className="text-xs font-semibold text-slate-600">Special Quick-Commerce Price:</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-950">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {product.discountPercentage > 0 && (
                    <span className="text-xs font-extrabold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                      Save {product.discountPercentage}%
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-1 font-semibold">
                  Packaging: <span className="font-bold text-slate-900">{product.unit}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                {product.description}
              </p>

              {/* Specifications Table */}
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Technical Specifications:
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                  {Object.entries(product.specs).map(([key, value], idx) => (
                    <div
                      key={key}
                      className={`flex justify-between p-2.5 ${
                        idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                      }`}
                    >
                      <span className="font-semibold text-slate-600">{key}</span>
                      <span className="font-bold text-slate-900 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                Close
              </button>

              {quantityInCart === 0 ? (
                <button
                  onClick={() => onAddToCart(product)}
                  className="flex-1 py-3 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-yellow-500/30"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add to Cart • ₹{product.price}</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-yellow-400 text-slate-950 font-black rounded-xl px-4 py-2 shadow-md border border-yellow-500/40">
                  <button
                    onClick={() => onUpdateQuantity(product.id, -1)}
                    className="p-1 hover:bg-yellow-500 rounded transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <span className="text-sm font-black min-w-[30px] text-center">
                    {quantityInCart} in Cart
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(product.id, 1)}
                    className="p-1 hover:bg-yellow-500 rounded transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
