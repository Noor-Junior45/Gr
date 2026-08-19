import React, { useState, useEffect } from 'react';
import { Plus, Minus, Zap, Star, ShieldCheck, Eye, Heart } from 'lucide-react';
import { Product } from '../types';
import { isProductFavorite, toggleProductFavorite } from '../services/favorites';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onOpenQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onOpenQuickView
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFav, setIsFav] = useState(() => isProductFavorite(product.id));

  useEffect(() => {
    const handleFavChange = () => {
      setIsFav(isProductFavorite(product.id));
    };
    window.addEventListener('giriraj_favorites_changed', handleFavChange);
    return () => window.removeEventListener('giriraj_favorites_changed', handleFavChange);
  }, [product.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedState = toggleProductFavorite(product.id);
    setIsFav(updatedState);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-2xl border border-slate-200 hover:border-yellow-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group p-3 sm:p-4"
    >
      {/* Top Badges: Delivery Time, Discount & Favorite Heart */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] sm:text-[11px] font-extrabold border border-green-200">
            <Zap className="w-3 h-3 text-green-600 fill-green-600" />
            <span>60 Mins – 7 Days</span>
          </span>

          {product.discountPercentage > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-slate-950 text-[10px] sm:text-[11px] font-extrabold">
              {product.discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            isFav
              ? 'bg-pink-50 text-pink-600 hover:bg-pink-100'
              : 'text-slate-400 hover:text-pink-600 hover:bg-slate-100'
          }`}
          title={isFav ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`} />
        </button>
      </div>

      {/* Image Container with Quick View overlay */}
      <div
        onClick={() => onOpenQuickView(product)}
        className="relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden mb-3 cursor-pointer flex items-center justify-center"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Brand Tag Pill */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
          {product.brand}
        </span>

        {/* Quick View Button on Hover */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow-md flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Specs</span>
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Clean Rating-Only Display */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-900 font-extrabold text-[11px]">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Product Title */}
          <h4
            onClick={() => onOpenQuickView(product)}
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug hover:text-green-700 transition-colors cursor-pointer mb-1"
            title={product.name}
          >
            {product.name}
          </h4>

          {/* Unit / Packaging Details */}
          <div className="text-[11px] font-semibold text-slate-500 mb-2">
            Unit: <span className="text-slate-800">{product.unit}</span>
          </div>
        </div>

        {/* Price & Add to Cart Stepper */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-slate-950">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Quantity Controls */}
          <div>
            {quantityInCart === 0 ? (
              <button
                onClick={() => onAddToCart(product)}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wide transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>ADD</span>
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            ) : (
              <div className="flex items-center bg-green-700 text-white rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => onUpdateQuantity(product.id, -1)}
                  className="px-2.5 py-1.5 hover:bg-green-800 transition-colors flex items-center justify-center cursor-pointer"
                  title="Decrease"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="px-2 text-xs font-black min-w-[20px] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.id, 1)}
                  className="px-2.5 py-1.5 hover:bg-green-800 transition-colors flex items-center justify-center cursor-pointer"
                  title="Increase"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
