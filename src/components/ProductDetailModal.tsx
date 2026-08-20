import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Star, ShieldCheck, Check, Plus, Minus, Truck, Heart, RotateCcw, HelpCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, Palette } from 'lucide-react';
import { Product } from '../types';
import { isProductFavorite, toggleProductFavorite } from '../services/favorites';
import { INDIAN_STANDARD_WIRE_COLORS, isWireProduct } from '../data/wireColors';

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
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const isWire = product ? isWireProduct(product) : false;
  const [selectedWireColor, setSelectedWireColor] = useState<string>(
    product?.selectedColor || (isWire ? 'Red' : '')
  );
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const allImages = product
    ? (Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : Array.isArray(product.image_urls) && product.image_urls.length > 0
        ? product.image_urls
        : [product.image])
    : [];

  useEffect(() => {
    if (product) {
      setIsFav(isProductFavorite(product.id));
      setSelectedWireColor(product.selectedColor || (isWireProduct(product) ? 'Red' : ''));
      setSelectedImageIndex(0);
    }
  }, [product]);

  if (!product) return null;

  const scrollThumbnails = (direction: 'prev' | 'next') => {
    if (!thumbnailContainerRef.current) return;
    const scrollAmount = 140;
    thumbnailContainerRef.current.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleToggleFav = () => {
    const updated = toggleProductFavorite(product.id);
    setIsFav(updated);
  };

  const handleAdd = () => {
    onAddToCart({
      ...product,
      selectedColor: isWire ? selectedWireColor : undefined
    });
  };

  const activeColorObj = INDIAN_STANDARD_WIRE_COLORS.find(c => c.name === selectedWireColor);
  const currentImage = allImages[selectedImageIndex] || product.image;

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
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-contain p-2"
              />
              {(!product.inStock || (product.stockCount !== undefined && product.stockCount <= 0)) && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-black flex items-center gap-1 shadow-sm">
                  <span>OUT OF STOCK</span>
                </span>
              )}
            </div>

            {/* Thumbnail Strip with Scroll Arrows when 5+ images */}
            {allImages.length > 1 && (
              <div className="mt-3 relative flex items-center">
                {allImages.length >= 5 && (
                  <button
                    type="button"
                    onClick={() => scrollThumbnails('prev')}
                    className="absolute left-0 z-10 p-1 rounded-full bg-white/95 text-slate-700 hover:bg-yellow-400 hover:text-slate-950 border border-slate-200 shadow-md transition-all cursor-pointer -translate-x-2 active:scale-90"
                    title="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}

                <div
                  ref={thumbnailContainerRef}
                  className={`flex gap-2 overflow-x-auto py-1 scrollbar-none scroll-smooth w-full ${allImages.length >= 5 ? 'px-6' : ''}`}
                >
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-12 h-12 rounded-lg border p-0.5 bg-slate-50 shrink-0 transition-all cursor-pointer relative ${
                        selectedImageIndex === idx
                          ? 'border-yellow-500 ring-2 ring-yellow-300 shadow-xs'
                          : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                      }`}
                      title={`Photo ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`thumb-${idx}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>

                {allImages.length >= 5 && (
                  <button
                    type="button"
                    onClick={() => scrollThumbnails('next')}
                    className="absolute right-0 z-10 p-1 rounded-full bg-white/95 text-slate-700 hover:bg-yellow-400 hover:text-slate-950 border border-slate-200 shadow-md transition-all cursor-pointer translate-x-2 active:scale-90"
                    title="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            )}
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

              {/* Wire Colour Selection under IS 694 Indian Standards */}
              {isWire && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-blue-600" />
                      Select Wire Colour (IS 694 Indian Standard)
                    </span>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedWireColor}
                    </span>
                  </div>

                  {/* Swatches Row */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2.5">
                    {INDIAN_STANDARD_WIRE_COLORS.map((opt) => {
                      const isSelected = selectedWireColor === opt.name;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setSelectedWireColor(opt.name)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'border-slate-900 bg-white ring-2 ring-slate-900 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-2xs ${
                              isSelected ? 'border-white ring-1 ring-slate-900 scale-105' : 'border-black/20'
                            }`}
                            style={{ backgroundColor: opt.hex }}
                          >
                            {isSelected && (
                              <Check
                                className={`w-3.5 h-3.5 stroke-[3] ${
                                  opt.name === 'White' ? 'text-slate-900' : 'text-white'
                                }`}
                              />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-900 leading-tight">
                            {opt.name}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-500 line-clamp-1">
                            {opt.shortRole}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Standard Role Explanation */}
                  {activeColorObj && (
                    <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-700 flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: activeColorObj.hex }}></span>
                      <div>
                        <strong className="text-slate-900">{activeColorObj.label}:</strong> {activeColorObj.description}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                {product.description}
              </p>

              {/* Specifications Table */}
              <div className="mb-5">
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

              {/* Return Policy Section */}
              <div className="space-y-2 bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 mb-5 text-xs">
                <div className="flex items-center gap-1.5 text-slate-950 font-black">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Return &amp; Replacement Policy</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-700">
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-900 bg-amber-100 px-1 rounded text-[10px]">Non-Refundable</span>
                    <span>All electrical products are non-refundable once sold.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>7-Day Replacement Only:</strong> Free replacement for transit damage or defects.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Condition:</strong> Uninstalled in original packaging with intact brand seals.</span>
                  </div>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    Frequently Asked Questions
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white text-xs">
                  {[
                    {
                      q: `Is this ${product.brand} product 100% genuine?`,
                      a: `Yes, all ${product.brand} products on Giriraj Power are 100% original, brand-sealed, and ISI / BIS certified.`
                    },
                    {
                      q: 'How fast is dispatch in Kolkata?',
                      a: 'Dispatched directly from Ezra Street electrical market within minimum 60 minutes or maximum 7 days.'
                    },
                    {
                      q: 'Do I get a valid GST invoice?',
                      a: 'Yes, every order includes a full GST invoice with tax breakdown and ITC compliance.'
                    }
                  ].map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={idx}>
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          className="w-full p-2.5 text-left flex items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer font-bold text-[11px] text-slate-900"
                        >
                          <span>{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-2.5 pb-2.5 pt-0.5 text-[11px] text-slate-600 bg-slate-50/70 border-t border-slate-100 leading-relaxed">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

              {(!product.inStock || (product.stockCount !== undefined && product.stockCount <= 0)) ? (
                <button
                  disabled
                  className="flex-1 py-3 px-6 rounded-xl bg-slate-200 text-slate-500 font-black text-sm flex items-center justify-center cursor-not-allowed border border-slate-300 shadow-none"
                >
                  <span>Out of Stock</span>
                </button>
              ) : quantityInCart === 0 ? (
                <button
                  onClick={handleAdd}
                  className="flex-1 py-3 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-yellow-500/30 active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add to Cart {isWire && selectedWireColor ? `(${selectedWireColor})` : ''} • ₹{product.price.toLocaleString('en-IN')}</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-yellow-400 text-slate-950 font-black rounded-xl px-4 py-2 shadow-md border border-yellow-500/40">
                  <button
                    onClick={() => onUpdateQuantity(product.id, -1)}
                    className="p-1 hover:bg-yellow-500 rounded transition-colors cursor-pointer active:scale-95"
                    title="Decrease (reduces to 0)"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <span className="text-sm font-black min-w-[30px] text-center">
                    {quantityInCart} in Cart
                  </span>
                  <button
                    onClick={() => {
                      if (quantityInCart < 100) {
                        onUpdateQuantity(product.id, 1);
                      }
                    }}
                    disabled={quantityInCart >= 100}
                    className="p-1 hover:bg-yellow-500 rounded transition-colors cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={quantityInCart >= 100 ? 'Maximum 100 reached' : 'Increase'}
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
