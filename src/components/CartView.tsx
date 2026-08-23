import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Plus,
  Minus,
  MapPin,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Truck,
  CreditCard,
  Smartphone,
  Banknote,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Layers,
  LogIn,
  Lock,
  Compass,
  Check,
  X
} from 'lucide-react';
import { CartItem, KolkataArea, Order, SavedAddress, Product, UserProfile } from '../types';
import { createFirestoreOrder } from '../services/supabaseService';
import { sendOrderConfirmationEmail, notifyOrderPlaced } from '../services/emailService';
import { INDIAN_STANDARD_WIRE_COLORS } from '../data/wireColors';
import { trackBeginCheckout, trackPurchase, trackRemoveFromCart } from '../utils/analytics';
import {
  syncCartItemToSupabase,
  removeCartItemFromSupabase,
  clearCartInSupabase,
  saveItemForLater,
  removeSavedItem,
  fetchSavedItemsFromSupabase,
  SavedItemRecord
} from '../services/cartService';
import confetti from 'canvas-confetti';

interface CartViewProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, color?: string) => void;
  onRemoveItem: (productId: string, color?: string) => void;
  onClearCart: () => void;
  currentArea: KolkataArea;
  activeAddress?: SavedAddress | null;
  onOpenLocationModal: () => void;
  userPhone: string | null;
  userProfile?: UserProfile | null;
  onOpenAuth?: () => void;
  onOrderPlaced: (order: Order) => void;
  onContinueShopping: () => void;
  onAddToCart?: (product: Product) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentArea,
  activeAddress,
  onOpenLocationModal,
  userPhone,
  userProfile,
  onOpenAuth,
  onOrderPlaced,
  onContinueShopping,
  onAddToCart
}) => {
  // Active Category Filter Tab
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Saved for Later List
  const [savedItems, setSavedItems] = useState<SavedItemRecord[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Price details expandable toggles
  const [isFeesExpanded, setIsFeesExpanded] = useState(false);
  const [isDiscountsExpanded, setIsDiscountsExpanded] = useState(false);
  const [showPriceInfoTooltip, setShowPriceInfoTooltip] = useState(false);

  // Verification Prompt Modals before Checkout
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
  const [showAddressRequiredModal, setShowAddressRequiredModal] = useState(false);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'all' | 'single'>('all');
  const [singleCheckoutItem, setSingleCheckoutItem] = useState<CartItem | null>(null);

  // Checkout Form Details
  const [customerName, setCustomerName] = useState(() => {
    return activeAddress?.receiverName || userProfile?.name || localStorage.getItem('giriraj_user_name') || '';
  });
  const [phone, setPhone] = useState(() => {
    return userPhone || activeAddress?.receiverPhone || userProfile?.phone || localStorage.getItem('giriraj_user_phone') || '';
  });
  const [email, setEmail] = useState(() => {
    return userProfile?.email || localStorage.getItem('giriraj_user_email') || '';
  });
  const [address, setAddress] = useState(() => {
    if (activeAddress) {
      return [activeAddress.houseFlat, activeAddress.houseName, activeAddress.buildingRoad].filter(Boolean).join(', ');
    }
    return localStorage.getItem('giriraj_active_address') || '';
  });
  const [landmark, setLandmark] = useState(() => {
    return activeAddress?.landmark || localStorage.getItem('giriraj_active_landmark') || '';
  });
  // Default payment method is Cash (Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Synchronize address updates if activeAddress or userProfile prop changes
  useEffect(() => {
    if (activeAddress) {
      if (activeAddress.receiverName) setCustomerName(activeAddress.receiverName);
      if (activeAddress.receiverPhone) setPhone(activeAddress.receiverPhone);
      const full = [activeAddress.houseFlat, activeAddress.houseName, activeAddress.buildingRoad].filter(Boolean).join(', ');
      if (full) setAddress(full);
      if (activeAddress.landmark) setLandmark(activeAddress.landmark);
    } else if (userProfile) {
      if (userProfile.name && !customerName) setCustomerName(userProfile.name);
      if (userProfile.phone && !phone) setPhone(userProfile.phone);
      if (userProfile.email && !email) setEmail(userProfile.email);
    }
  }, [activeAddress, userProfile]);

  // Load Saved for Later items
  useEffect(() => {
    let isMounted = true;
    setLoadingSaved(true);
    fetchSavedItemsFromSupabase()
      .then((data) => {
        if (isMounted) setSavedItems(data);
      })
      .finally(() => {
        if (isMounted) setLoadingSaved(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute Categories present in Cart
  const categoriesInCart = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const cat = item.product.category || 'electrical';
      map.set(cat, (map.get(cat) || 0) + item.quantity);
    });
    return Array.from(map.entries()).map(([cat, count]) => ({
      key: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      count
    }));
  }, [items]);

  const hasMultipleCategories = categoriesInCart.length > 1;

  // Filtered items based on active category tab
  const displayedItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter((item) => (item.product.category || 'electrical') === selectedCategory);
  }, [items, selectedCategory]);

  // Price Calculations (Computed dynamically)
  const activeItemsForBill = checkoutMode === 'single' && singleCheckoutItem ? [singleCheckoutItem] : items;

  const totalMRP = useMemo(() => {
    return activeItemsForBill.reduce((acc, curr) => {
      const mrp = Number(curr.product.originalPrice || curr.product.price || 0);
      return acc + mrp * curr.quantity;
    }, 0);
  }, [activeItemsForBill]);

  const totalSellingPrice = useMemo(() => {
    return activeItemsForBill.reduce((acc, curr) => {
      return acc + Number(curr.product.price || 0) * curr.quantity;
    }, 0);
  }, [activeItemsForBill]);

  const totalProductDiscount = Math.max(0, totalMRP - totalSellingPrice);
  const deliveryFee = totalSellingPrice >= 499 || totalSellingPrice === 0 ? 0 : 49;
  const handlingFee = activeItemsForBill.length > 0 ? 9 : 0; // Flat ₹9 standard handling fee
  const totalSavings = totalProductDiscount + discountApplied;
  const finalTotalAmount = Math.max(0, totalSellingPrice + deliveryFee + handlingFee - discountApplied);

  // Track Begin Checkout
  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckout(items, finalTotalAmount);
    }
  }, []);

  // Handle Save for Later
  const handleSaveForLater = async (product: Product) => {
    const updated = await saveItemForLater(product);
    setSavedItems(updated);
    onRemoveItem(product.id, product.selectedColor);
  };

  // Move from Saved to Cart
  const handleMoveToCart = async (saved: SavedItemRecord) => {
    if (onAddToCart) {
      onAddToCart(saved.product);
    } else {
      onUpdateQuantity(saved.product.id, 1);
    }
    const updated = await removeSavedItem(saved.productId);
    setSavedItems(updated);
  };

  // Delete Saved Item
  const handleDeleteSavedItem = async (productId: string) => {
    const updated = await removeSavedItem(productId);
    setSavedItems(updated);
  };

  // Handle Single Item "Buy this now"
  const handleBuyThisNow = (item: CartItem) => {
    // 1. Gated: Must be logged in first
    const isLoggedIn = Boolean(
      userProfile?.id ||
      userProfile?.phone ||
      userProfile?.email ||
      userPhone ||
      localStorage.getItem('giriraj_user_phone') ||
      localStorage.getItem('giriraj_user_email')
    );

    if (!isLoggedIn) {
      setShowLoginRequiredModal(true);
      return;
    }

    // 2. Gated: Must choose delivery address
    const hasAddress = Boolean(
      activeAddress ||
      (address && address.trim().length >= 4)
    );

    if (!hasAddress) {
      setShowAddressRequiredModal(true);
      return;
    }

    setSingleCheckoutItem(item);
    setCheckoutMode('single');
    setPaymentMethod('cod'); // Default to cash
    setIsCheckoutOpen(true);
  };

  // Handle Full Cart "Place Order"
  const handleOpenFullCheckout = () => {
    if (items.length === 0) return;

    // 1. Gated: Must be logged in first
    const isLoggedIn = Boolean(
      userProfile?.id ||
      userProfile?.phone ||
      userProfile?.email ||
      userPhone ||
      localStorage.getItem('giriraj_user_phone') ||
      localStorage.getItem('giriraj_user_email')
    );

    if (!isLoggedIn) {
      setShowLoginRequiredModal(true);
      return;
    }

    // 2. Gated: Must choose delivery address
    const hasAddress = Boolean(
      activeAddress ||
      (address && address.trim().length >= 4)
    );

    if (!hasAddress) {
      setShowAddressRequiredModal(true);
      return;
    }

    setCheckoutMode('all');
    setSingleCheckoutItem(null);
    setPaymentMethod('cod'); // Default to cash
    setIsCheckoutOpen(true);
  };

  // Apply Promo Coupon
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    const code = promoCode.trim().toUpperCase();
    if (code === 'KOLKATA60' || code === 'GIRIRAJ100') {
      setDiscountApplied(100);
      setCouponSuccess('Coupon applied! ₹100 instant discount added.');
    } else if (code === 'EXPRESS50') {
      setDiscountApplied(50);
      setCouponSuccess('Coupon applied! ₹50 express discount added.');
    } else if (code === 'BUILD10') {
      const discount = Math.round(totalSellingPrice * 0.1);
      setDiscountApplied(discount);
      setCouponSuccess(`Coupon BUILD10 applied! ₹${discount} saved.`);
    } else {
      setCouponError('Invalid coupon code. Try "KOLKATA60" for ₹100 off!');
      setDiscountApplied(0);
    }
  };

  // Place Order Submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderItems = checkoutMode === 'single' && singleCheckoutItem ? [singleCheckoutItem] : items;
    if (orderItems.length === 0) return;

    if (!phone.trim() || !customerName.trim() || !address.trim()) {
      alert('Please fill in your name, mobile phone, and delivery address.');
      return;
    }

    setIsSubmitting(true);

    const newOrder: Order = {
      id: `GP-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName,
      phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
      customerEmail: email.trim() || undefined,
      address,
      area: currentArea.name,
      pincode: currentArea.pincode,
      landmark,
      items: [...orderItems],
      itemTotal: totalSellingPrice,
      deliveryFee,
      handlingFee,
      discount: discountApplied,
      totalAmount: finalTotalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDeliveryTimestamp: Date.now() + currentArea.deliveryMinutes * 60 * 1000,
      deliveryPartner: {
        name: 'Bikash Mondal ⚡',
        phone: '+91 87774 00280',
        vehicleNumber: 'WB 07 C 1089 (Express Runner)',
        currentHub: `${currentArea.name} Hub`
      }
    };

    try {
      const created = await createFirestoreOrder(newOrder);

      // Track GA4 Purchase Event
      trackPurchase(created, orderItems, finalTotalAmount, deliveryFee);

      // Trigger backend automated Admin Alert (Email + WhatsApp) & Customer Invoice
      notifyOrderPlaced(created, email.trim()).catch((e) =>
        console.warn('Backend order notification notice:', e)
      );

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Safe fallback
      }

      if (checkoutMode === 'all') {
        onClearCart();
        clearCartInSupabase().catch(() => {});
      } else if (singleCheckoutItem) {
        onRemoveItem(singleCheckoutItem.product.id, singleCheckoutItem.selectedColor);
      }

      setIsCheckoutOpen(false);
      onOrderPlaced(created);
    } catch (err) {
      console.error('Failed to place order:', err);
      alert('An error occurred while placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format dynamic delivery date (Today + 4 days or 60 Mins)
  const getDeliveryDateEstimate = (deliveryMins?: number) => {
    if (deliveryMins && deliveryMins <= 60) {
      return `Express in ${deliveryMins} mins`;
    }
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return `Delivery by ${d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}`;
  };

  // ==========================================================================
  // EMPTY CART STATE
  // ==========================================================================
  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] bg-[#f8fafc] flex flex-col items-center justify-center px-4 py-12 font-sans">
        <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-inner">
            <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            Looks like you haven't added any electrical supplies, wiring cables, or construction materials to your cart yet.
          </p>

          <div className="space-y-3">
            <button
              onClick={onContinueShopping}
              className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>Explore Electrical Catalog</span>
            </button>
            <button
              onClick={() => window.location.href = '/construction'}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-2xl transition active:scale-98 text-sm cursor-pointer"
            >
              Browse Construction Materials
            </button>
          </div>
        </div>

        {/* Saved for Later in Empty State */}
        {savedItems.length > 0 && (
          <div className="max-w-2xl w-full mt-10 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Bookmark className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-slate-900">Saved for Later ({savedItems.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {savedItems.map((saved) => (
                <div key={saved.id} className="py-3.5 flex items-center gap-4 justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={saved.product.image || 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=200&auto=format&fit=crop'}
                      alt={saved.product.name}
                      className="w-14 h-14 object-contain rounded-xl bg-slate-50 border border-slate-100 p-1"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{saved.product.name}</h4>
                      <p className="text-xs text-slate-400">{saved.product.brand}</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">₹{saved.product.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMoveToCart(saved)}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => handleDeleteSavedItem(saved.productId)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // FULL CART VIEW LAYOUT
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-36 font-sans">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        
        {/* 1. HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onContinueShopping}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
              title="Continue Shopping"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Cart
            </h1>
            <span className="text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
              {items.reduce((sum, i) => sum + i.quantity, 0)} Items
            </span>
          </div>

          <button
            onClick={onClearCart}
            className="text-xs font-bold text-slate-400 hover:text-rose-600 transition px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* 2. CATEGORY TABS (Shown only if more than 1 category exists in the cart) */}
        {hasMultipleCategories && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                selectedCategory === 'all'
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              All Items ({items.reduce((s, i) => s + i.quantity, 0)})
            </button>
            {categoriesInCart.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                  selectedCategory === cat.key
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {/* 3. DELIVERY ADDRESS BAR */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs mb-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  Deliver to: {activeAddress?.receiverName || customerName || 'Recipient'}, {activeAddress?.area?.pincode || currentArea.pincode}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md tracking-wider">
                  {activeAddress?.tag || 'HOME'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide truncate mt-0.5">
                {activeAddress
                  ? `${activeAddress.houseFlat || ''} ${activeAddress.houseName || ''}, ${activeAddress.buildingRoad || ''}, ${activeAddress.area?.name || currentArea.name}`
                  : `${address || currentArea.name}, KOLKATA - ${currentArea.pincode}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm shrink-0 px-2 py-1 rounded-lg hover:bg-blue-50 transition cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* 4. CART ITEM LIST */}
        <div className="space-y-3 mb-5">
          {displayedItems.map((item) => {
            const product = item.product;
            const mrp = Number(product.originalPrice || product.price || 0);
            const price = Number(product.price || 0);
            const discountPct =
              product.discountPercentage || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
            const stockQty = Number(product.stockCount || 50);
            const isLowStock = stockQty > 0 && stockQty <= 5;
            const deliveryEstimate = getDeliveryDateEstimate(product.deliveryMinutes);

            return (
              <div
                key={`${product.id}-${item.selectedColor || 'default'}`}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-col gap-3 transition-shadow hover:shadow-sm"
              >
                {/* Main Product Info Row */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Thumbnail Image (90px) */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-50 border border-slate-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=400&auto=format&fit=crop'}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                      loading="lazy"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Brand: <span className="text-slate-600 font-semibold">{product.brand || 'Giriraj Genuine'}</span>
                    </p>

                    {/* Wire color indicator if any */}
                    {item.selectedColor && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-slate-500">Color:</span>
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300"
                          style={{
                            backgroundColor:
                              INDIAN_STANDARD_WIRE_COLORS.find((c) => c.name === item.selectedColor)?.hex ||
                              '#000'
                          }}
                        />
                        <span className="text-[11px] font-bold text-slate-700">{item.selectedColor}</span>
                      </div>
                    )}

                    {/* Price Row with Green Discount Badge */}
                    <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                      {discountPct > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          ↓{discountPct}% off
                        </span>
                      )}
                      {mrp > price && (
                        <span className="text-xs sm:text-sm text-slate-400 line-through">
                          ₹{mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Stock Warning if low */}
                    {isLowStock && (
                      <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Only {stockQty} left in stock!
                      </p>
                    )}

                    {/* Estimated Delivery Line */}
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{deliveryEstimate}</span>
                    </p>
                  </div>
                </div>

                {/* Stepper + Bottom Action Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Qty:</span>
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateQuantity(product.id, -1, item.selectedColor);
                          syncCartItemToSupabase(product.id, item.quantity - 1, item.selectedColor);
                        }}
                        className="p-1.5 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:bg-slate-300"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-0.5 text-xs font-black text-slate-900 bg-white min-w-[28px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity < stockQty) {
                            onUpdateQuantity(product.id, 1, item.selectedColor);
                            syncCartItemToSupabase(product.id, item.quantity + 1, item.selectedColor);
                          } else {
                            alert(`Maximum available stock is ${stockQty} units.`);
                          }
                        }}
                        disabled={item.quantity >= stockQty}
                        className="p-1.5 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Actions: Remove, Save for Later, Buy This Now */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveItem(product.id, item.selectedColor);
                        removeCartItemFromSupabase(product.id);
                      }}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveForLater(product)}
                      className="px-2.5 py-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Save for later"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save for later</span>
                      <span className="sm:hidden">Save</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. SAVED FOR LATER SECTION (if any items exist) */}
        {savedItems.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs mb-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Bookmark className="w-4 h-4 text-amber-500" />
              <h3 className="font-black text-sm text-slate-900">Saved For Later ({savedItems.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {savedItems.map((saved) => (
                <div key={saved.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={saved.product.image || 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=200&auto=format&fit=crop'}
                      alt={saved.product.name}
                      className="w-12 h-12 object-contain rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{saved.product.name}</h4>
                      <p className="text-xs font-black text-slate-900 mt-0.5">₹{saved.product.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleMoveToCart(saved)}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => handleDeleteSavedItem(saved.productId)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PRICE DETAILS SECTION (Card with light gray background) */}
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-200">
            Price Details ({items.reduce((s, i) => s + i.quantity, 0)} Items)
          </h2>

          <div className="space-y-2.5 text-sm">
            {/* MRP Row */}
            <div className="flex items-center justify-between text-slate-600">
              <span>MRP (incl. of all taxes)</span>
              <span className="font-semibold text-slate-900">₹{totalMRP.toLocaleString('en-IN')}</span>
            </div>

            {/* Discounts (Collapsible) */}
            <div>
              <div
                onClick={() => setIsDiscountsExpanded(!isDiscountsExpanded)}
                className="flex items-center justify-between text-emerald-700 font-semibold cursor-pointer hover:underline"
              >
                <div className="flex items-center gap-1">
                  <span>Discounts</span>
                  {isDiscountsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
                <span>- ₹{totalSavings.toLocaleString('en-IN')}</span>
              </div>
              {isDiscountsExpanded && (
                <div className="mt-1.5 pl-3 border-l-2 border-emerald-300 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Product Catalog Discount:</span>
                    <span>- ₹{totalProductDiscount.toLocaleString('en-IN')}</span>
                  </div>
                  {discountApplied > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Promo Voucher Applied:</span>
                      <span>- ₹{discountApplied.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fees (Collapsible) */}
            <div>
              <div
                onClick={() => setIsFeesExpanded(!isFeesExpanded)}
                className="flex items-center justify-between text-slate-600 cursor-pointer hover:underline"
              >
                <div className="flex items-center gap-1">
                  <span>Fees (Delivery & Handling)</span>
                  {isFeesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
                <span className="font-semibold text-slate-900">
                  {deliveryFee === 0 && handlingFee === 0 ? (
                    <span className="text-emerald-600 uppercase font-bold">FREE</span>
                  ) : (
                    `₹${deliveryFee + handlingFee}`
                  )}
                </span>
              </div>
              {isFeesExpanded && (
                <div className="mt-1.5 pl-3 border-l-2 border-slate-300 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Standard Express Delivery:</span>
                    <span>{deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE (Orders &gt; ₹499)</span> : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Handling Fee:</span>
                    <span>₹{handlingFee}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Divider Line */}
            <div className="border-t border-dashed border-slate-300 my-2 pt-2"></div>

            {/* Total Amount */}
            <div className="flex items-center justify-between text-base font-black text-slate-900">
              <span>Total Amount</span>
              <span className="text-lg">₹{finalTotalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Green Success Savings Banner */}
          {totalSavings > 0 && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>You'll save ₹{totalSavings.toLocaleString('en-IN')} on this order!</span>
            </div>
          )}
        </div>

        {/* 7. TRUST BADGE ROW */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-3 text-center">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Safe and secure payments. Easy returns. 100% Authentic products.</span>
        </div>

      </div>

      {/* 8. STICKY BOTTOM BAR (Fixed to bottom of screen) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {/* Left Side: Strikethrough total MRP above final total amount + info icon */}
          <div className="relative">
            {totalMRP > finalTotalAmount && (
              <p className="text-xs text-slate-400 line-through">
                ₹{totalMRP.toLocaleString('en-IN')}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{finalTotalAmount.toLocaleString('en-IN')}
              </span>
              <button
                type="button"
                onClick={() => setShowPriceInfoTooltip(!showPriceInfoTooltip)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                title="View price breakdown"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Price breakdown popover */}
            {showPriceInfoTooltip && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between mb-1 text-slate-300">
                  <span>Item Total:</span>
                  <span>₹{totalSellingPrice}</span>
                </div>
                <div className="flex justify-between mb-1 text-emerald-400 font-semibold">
                  <span>Total Discount:</span>
                  <span>- ₹{totalSavings}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Fees:</span>
                  <span>₹{deliveryFee + handlingFee}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Large Place Order Button */}
          <button
            type="button"
            onClick={handleOpenFullCheckout}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 sm:px-8 py-3.5 rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer text-sm sm:text-base shrink-0"
          >
            <span>Place Order</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ========================================================================== */}
      {/* CHECKOUT MODAL / DRAWER */}
      {/* ========================================================================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {checkoutMode === 'single' ? 'Express Single Item Checkout' : 'Confirm & Place Order'}
                </h3>
                <p className="text-xs text-slate-500">
                  {checkoutMode === 'single' && singleCheckoutItem
                    ? singleCheckoutItem.product.name
                    : `${items.length} items in your order`}
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {/* Delivery Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Delivery Contact & Address
                  </h4>
                  <button
                    type="button"
                    onClick={onOpenLocationModal}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Change Address</span>
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional for Invoice)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address / House / Flat</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Flat No, Building, Road name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality</label>
                    <input
                      type="text"
                      disabled
                      value={currentArea.name}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      disabled
                      value={currentArea.pincode}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Have a Promo Coupon?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Try 'KOLKATA60'"
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:bg-white focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-xs text-rose-500 font-bold mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-xs text-emerald-600 font-bold mt-1">{couponSuccess}</p>}
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Choose Payment Option
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Cash by default
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Option 1: Cash on Delivery (DEFAULT) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer relative ${
                      paymentMethod === 'cod'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-black ring-2 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider shadow-2xs">
                      DEFAULT
                    </div>
                    <div className={`p-1.5 rounded-xl ${paymentMethod === 'cod' ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                      <Banknote className="w-5 h-5 text-emerald-700" />
                    </div>
                    <span className="text-xs leading-tight">Cash on Delivery</span>
                  </button>

                  {/* Option 2: UPI / QR */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-black ring-2 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl ${paymentMethod === 'upi' ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xs leading-tight">UPI / QR</span>
                  </button>

                  {/* Option 3: Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-black ring-2 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl ${paymentMethod === 'card' ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs leading-tight">Debit / Card</span>
                  </button>
                </div>

                {paymentMethod === 'cod' && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/70 rounded-xl p-2.5 mt-2 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Pay cash or scan QR with UPI directly upon delivery at your doorstep.</span>
                  </p>
                )}
              </div>

              {/* Order Total Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-sm">
                <div>
                  <span className="text-xs text-slate-500">Total Payable Amount</span>
                  <p className="text-lg font-black text-slate-900">₹{finalTotalAmount.toLocaleString('en-IN')}</p>
                </div>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                  Free Express Delivery Included
                </span>
              </div>

              {/* Submit Order Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Confirming Order...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {paymentMethod === 'cod'
                        ? `Place Order with Cash (₹${finalTotalAmount.toLocaleString('en-IN')})`
                        : `Confirm & Pay ₹${finalTotalAmount.toLocaleString('en-IN')}`}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* 1. LOGIN REQUIRED MODAL (Gated Checkout) */}
      {/* ========================================================================== */}
      {showLoginRequiredModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col text-center border border-slate-100">
            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <LogIn className="w-8 h-8 stroke-[2.2]" />
            </div>

            <span className="text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
              Step 1 of 2 • Authentication Required
            </span>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Please Log In to Place Order
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              To ensure safe delivery, live tracking, and GST tax invoice generation, please sign in or register with your mobile number or account.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowLoginRequiredModal(false);
                  if (onOpenAuth) {
                    onOpenAuth();
                  } else {
                    window.location.href = '/login';
                  }
                }}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Log In / Sign In Now</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLoginRequiredModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl transition cursor-pointer text-sm"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* 2. CHOOSE DELIVERY ADDRESS MODAL (Gated Checkout) */}
      {/* ========================================================================== */}
      {showAddressRequiredModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col text-center border border-slate-100">
            <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <MapPin className="w-8 h-8 stroke-[2.2]" />
            </div>

            <span className="text-xs font-black uppercase tracking-wider text-blue-600 mb-1">
              Step 2 of 2 • Delivery Address
            </span>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Choose Your Delivery Address
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Please select or enter your delivery address (Flat, Building, Street in Kolkata) so our express dispatch rider can reach your doorstep.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowAddressRequiredModal(false);
                  onOpenLocationModal();
                }}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                <Compass className="w-4 h-4 stroke-[2.5]" />
                <span>Select / Add Delivery Address</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddressRequiredModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl transition cursor-pointer text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
