import React, { useState } from 'react';
import {
  Zap,
  Trash2,
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
  Palette
} from 'lucide-react';
import { CartItem, KolkataArea, Order, SavedAddress } from '../types';
import { createFirestoreOrder } from '../services/supabaseService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { INDIAN_STANDARD_WIRE_COLORS } from '../data/wireColors';
import confetti from 'canvas-confetti';

interface CartViewProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  currentArea: KolkataArea;
  activeAddress?: SavedAddress | null;
  onOpenLocationModal: () => void;
  userPhone: string | null;
  onOrderPlaced: (order: Order) => void;
  onContinueShopping: () => void;
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
  onOrderPlaced,
  onContinueShopping
}) => {
  const [customerName, setCustomerName] = useState(() => {
    return activeAddress?.receiverName || localStorage.getItem('giriraj_user_name') || '';
  });
  const [phone, setPhone] = useState(() => {
    return userPhone || activeAddress?.receiverPhone || localStorage.getItem('giriraj_user_phone') || '';
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('giriraj_user_email') || '';
  });
  const [address, setAddress] = useState(() => {
    if (activeAddress) {
      return `${activeAddress.houseFlat}, ${activeAddress.houseName}`;
    }
    return localStorage.getItem('giriraj_active_address') || '';
  });
  const [landmark, setLandmark] = useState(() => {
    return activeAddress?.landmark || localStorage.getItem('giriraj_active_landmark') || '';
  });
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Bill Calculations
  const itemTotal = items.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  const deliveryFee = itemTotal >= 499 ? 0 : 49;
  const handlingFee = items.length > 0 ? 15 : 0;
  const totalAmount = Math.max(0, itemTotal + deliveryFee + handlingFee - discountApplied);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = promoCode.trim().toUpperCase();
    if (code === 'KOLKATA60' || code === 'GIRIRAJ100') {
      setDiscountApplied(100);
      setCouponError(null);
    } else if (code === 'EXPRESS50') {
      setDiscountApplied(50);
      setCouponError(null);
    } else {
      setCouponError('Invalid coupon. Try using "KOLKATA60" for ₹100 instant discount!');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!phone.trim() || !customerName.trim() || !address.trim()) {
      alert('Please fill out your complete delivery details.');
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
      items: [...items],
      itemTotal,
      deliveryFee,
      handlingFee,
      discount: discountApplied,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDeliveryTimestamp: Date.now() + currentArea.deliveryMinutes * 60 * 1000,
      deliveryPartner: {
        name: 'Bikash Mondal ⚡',
        phone: '+91 87774 00280',
        vehicleNumber: 'WB 07 C 1089 (Express Runner)',
        currentHub: currentArea.hub
      },
      notes: deliveryNotes
    };

    try {
      const created = await createFirestoreOrder(newOrder);

      // Trigger Resend email invoice if email is provided
      if (email.trim()) {
        sendOrderConfirmationEmail(created, email.trim()).catch((e) =>
          console.warn('Background Resend email notice:', e)
        );
      }

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.warn('Confetti error', err);
      }

      if (phone.trim()) {
        try {
          localStorage.setItem('giriraj_user_phone', phone.trim());
          if (customerName.trim()) localStorage.setItem('giriraj_user_name', customerName.trim());
          if (email.trim()) localStorage.setItem('giriraj_user_email', email.trim());
        } catch {
          // ignore
        }
      }

      onClearCart();
      onOrderPlaced(created);
    } catch (err) {
      console.error('Order creation error', err);
      alert('Something went wrong while placing your order. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Your Express Cart is Empty</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          Explore factory-certified Polycab wires, Schneider switches, UltraTech cement, and emergency electrical supplies ready for 60-minute delivery across Kolkata.
        </p>
        <button
          onClick={onContinueShopping}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-sm transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Products &amp; Catalog</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onContinueShopping}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Return to store"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Express Cart &amp; Checkout
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 ml-8 mt-0.5">
            Review your order items, select payment method, and confirm Kolkata express dispatch.
          </p>
        </div>

        {/* Live Delivery Guarantee Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-green-50 border border-green-200 text-xs text-green-900">
          <Truck className="w-4 h-4 text-green-700 shrink-0" />
          <div>
            <span className="font-extrabold">Delivery: 60 Mins – 7 Days</span>
            <span className="text-[11px] text-green-700 block">Hub: {currentArea.hub} (Bulk & Retail Stock)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Items & Delivery Info, Right = Bill & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (7 Cols): Items List & Delivery Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Order Items Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-yellow-400 text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  Review Items ({items.length})
                </h2>
              </div>
              <button
                onClick={onClearCart}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const chosenColor = item.selectedColor || item.product.selectedColor;
                const colorMeta = chosenColor ? INDIAN_STANDARD_WIRE_COLORS.find(c => c.name.toLowerCase() === chosenColor.toLowerCase()) : null;

                return (
                  <div key={`${item.product.id}_${chosenColor || idx}`} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide">
                        {item.product.brand} • {item.product.category}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {item.product.name}
                      </h3>

                      {/* Wire Colour Variant Pill */}
                      {chosenColor && (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-900">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: colorMeta?.hex || '#dc2626' }}
                            />
                            <span>Colour: <strong>{chosenColor}</strong></span>
                            {colorMeta?.shortRole && (
                              <span className="text-[10px] text-slate-500 font-semibold">
                                ({colorMeta.shortRole})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        ₹{item.product.price} / {item.product.unit}
                      </div>
                    </div>

                    {/* Quantity and Line Total */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-sm font-black text-slate-900">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                      
                      <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1, chosenColor)}
                          className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"
                          title="Decrease (reduces to 0)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-black text-slate-900 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (item.quantity < 100) {
                              onUpdateQuantity(item.product.id, 1, chosenColor);
                            }
                          }}
                          disabled={item.quantity >= 100}
                          className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          title={item.quantity >= 100 ? 'Maximum 100 reached' : 'Increase'}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick add items button */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={onContinueShopping}
                className="text-xs font-bold text-yellow-700 hover:text-yellow-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add more electrical or construction supplies</span>
              </button>
            </div>
          </div>

          {/* Delivery Details Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-yellow-400 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  Delivery Address &amp; Contact
                </h2>
              </div>
              <button
                onClick={onOpenLocationModal}
                className="text-xs font-bold text-yellow-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Change Area ({currentArea.name})</span>
              </button>
            </div>

            {/* Area Badge Bar */}
            <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-yellow-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">{currentArea.name}</span>
                  <span className="text-slate-600 text-[11px] ml-1">PIN: {currentArea.pincode}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-yellow-300 text-slate-950 font-black text-[10px] uppercase">
                60 Mins – 7 Days Delivery
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer / Site Receiver Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="e.g. Rahul Sen"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number (for OTP &amp; Delivery) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address (for Instant Tax Invoice &amp; Dispatch Tracking)
                  </label>
                  <span className="text-[10px] font-bold text-yellow-800 bg-yellow-100 px-1.5 py-0.5 rounded">
                    Resend Powered
                  </span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul.sen@gmail.com (Receive PDF tax invoice & dispatch alerts)"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complete Delivery Address (Flat / House No., Building, Street) *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="e.g. Tower 3, Flat 502, Green Heights, Street 14"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near City Centre 1"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Instructions / Notes
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Leave with security / Ring bell"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (5 Cols): Payment, Promo & Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-yellow-400 text-xs font-black flex items-center justify-center">
                3
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                Payment Option
              </h2>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'border-green-600 bg-green-50 ring-1 ring-green-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      UPI / QR / GooglePay / PhonePe
                    </div>
                    <div className="text-[11px] text-green-700 font-semibold">
                      Instant verification &amp; priority packing
                    </div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'upi' ? 'border-green-600 bg-green-600' : 'border-slate-300'
                }`}>
                  {paymentMethod === 'upi' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-green-600 bg-green-50 ring-1 ring-green-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      Cash on Delivery (COD)
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Pay cash or UPI upon delivery runner arrival
                    </div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'cod' ? 'border-green-600 bg-green-600' : 'border-slate-300'
                }`}>
                  {paymentMethod === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-green-600 bg-green-50 ring-1 ring-green-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      Credit / Debit Card / NetBanking
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      All Indian bank cards supported
                    </div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'card' ? 'border-green-600 bg-green-600' : 'border-slate-300'
                }`}>
                  {paymentMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            </div>
          </div>

          {/* Promo Code Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Tag className="w-4 h-4 text-yellow-600" />
              <span>Apply Kolkata Promo Coupon</span>
            </div>

            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <input
                type="text"
                placeholder="Try KOLKATA60 or GIRIRAJ100"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-bold uppercase rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-yellow-400 font-bold text-xs transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>

            {couponError && (
              <p className="text-[11px] text-red-600 font-semibold">{couponError}</p>
            )}

            {discountApplied > 0 && (
              <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between text-xs text-green-900 font-bold">
                <span>🎉 Promo Applied: ₹{discountApplied} Discount!</span>
                <button
                  type="button"
                  onClick={() => setDiscountApplied(0)}
                  className="text-slate-500 hover:text-slate-800 text-[11px] underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Bill Summary & Place Order */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white tracking-tight pb-3 border-b border-slate-800">
              Bill Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Item Subtotal ({items.length} items)</span>
                <span className="font-bold text-white">₹{itemTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>⚡ Standard & Bulk Delivery (60 Mins – 7 Days)</span>
                <span className={deliveryFee === 0 ? 'text-green-400 font-bold' : 'text-white'}>
                  {deliveryFee === 0 ? 'FREE (Above ₹499)' : `₹${deliveryFee}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Handling &amp; Packaging Fee</span>
                <span className="text-white">₹{handlingFee}</span>
              </div>

              {discountApplied > 0 && (
                <div className="flex justify-between text-green-400 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{discountApplied}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Grand Total</span>
                <span className="text-2xl font-black text-yellow-400">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:scale-98 text-slate-950 font-black text-base transition-all shadow-lg flex items-center justify-between cursor-pointer disabled:opacity-50"
            >
              <div className="text-left">
                <div className="text-[10px] text-slate-900 font-bold uppercase tracking-wider">
                  {paymentMethod === 'cod' ? 'Pay upon Delivery' : `Pay via ${paymentMethod.toUpperCase()}`}
                </div>
                <div className="text-xs font-black">
                  Delivery: 60 mins – 7 days
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>{isSubmitting ? 'Dispatching...' : 'Place Express Order'}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>100% Genuine ISI / BIS Certified Materials</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
