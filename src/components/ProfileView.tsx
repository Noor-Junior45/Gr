import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  HelpCircle,
  MapPin,
  CreditCard,
  Zap,
  Wallet,
  ChevronRight,
  ShoppingBag,
  Bell,
  LogOut,
  Calendar,
  Edit3,
  Star,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  Building2,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Clock,
  Wrench,
  KeyRound
} from 'lucide-react';
import { Order, SavedAddress, UserProfile, CartItem, WalletTransaction } from '../types';
import { saveUserProfile, signOutUser, deleteAddressFromFirestore } from '../services/firebaseConfig';
import { WIRING_SERVICES } from '../data/services';

interface ProfileViewProps {
  userProfile: UserProfile | null;
  orders: Order[];
  savedAddresses: SavedAddress[];
  onBack: () => void;
  onOpenLocationModal: () => void;
  onSelectAddress?: (address: SavedAddress) => void;
  onReorder: (items: CartItem[]) => void;
  onOpenShop: () => void;
  onOpenServices: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  orders,
  savedAddresses,
  onBack,
  onOpenLocationModal,
  onSelectAddress,
  onReorder,
  onOpenShop,
  onOpenServices,
  onProfileUpdated,
  onLogout
}) => {
  // Current active sub-page view: 'main' | 'orders' | 'addresses' | 'payments' | 'wallet' | 'services' | 'membership' | 'help' | 'notifications'
  const [subPage, setSubPage] = useState<
    'main' | 'orders' | 'addresses' | 'payments' | 'wallet' | 'services' | 'membership' | 'help' | 'notifications'
  >('main');

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name || '');
  const [editEmail, setEditEmail] = useState(userProfile?.email || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');
  const [editDob, setEditDob] = useState(userProfile?.dob || '');
  const [editPhotoURL, setEditPhotoURL] = useState(userProfile?.photoURL || '');

  // OTP Verification for Email Update
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpSentNotice, setOtpSentNotice] = useState(false);

  // 3-dots Dropdown Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Avatar image error fallback
  const [avatarError, setAvatarError] = useState(false);

  // Past Orders Filter & Expand state
  const [orderCategoryFilter, setOrderCategoryFilter] = useState<'all' | 'materials' | 'services'>('all');
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(4);
  const [ratingsState, setRatingsState] = useState<{ [orderId: string]: { userRating?: number; deliveryRating?: number } }>({});

  // Payment mock state
  const [savedUpi, setSavedUpi] = useState<string[]>(['9830099887@okaxis', 'kolkata.electric@icici']);
  const [newUpiId, setNewUpiId] = useState('');
  const [showAddUpi, setShowAddUpi] = useState(false);

  // Wallet State (Total Refund & Cashback)
  const refundBalance = userProfile?.refundBalance ?? 150;
  const cashbackBalance = userProfile?.cashbackBalance ?? 75;
  const totalWalletBalance = refundBalance + cashbackBalance;
  const [walletFilter, setWalletFilter] = useState<'all' | 'refund' | 'cashback'>('all');
  const [walletNotice, setWalletNotice] = useState<string | null>(null);

  // Close 3-dots menu on outside click or on window scroll
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMenuOpen]);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOtpStep && otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isOtpStep, otpTimer]);

  const handleOpenEdit = () => {
    setEditName(userProfile?.name || 'Customer');
    setEditEmail(userProfile?.email || '');
    setEditPhone(userProfile?.phone || '');
    setEditDob(userProfile?.dob || '');
    setEditPhotoURL(userProfile?.photoURL || '');
    setIsOtpStep(false);
    setOtpError('');
    setIsEditModalOpen(true);
    setIsMenuOpen(false);
  };

  const sendOtpForEmail = (targetEmail: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setPendingEmail(targetEmail);
    setIsOtpStep(true);
    setOtpTimer(60);
    setEnteredOtp('');
    setOtpError('');
    setOtpSentNotice(true);
    setTimeout(() => setOtpSentNotice(false), 8000);
  };

  const handleProfileFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = editEmail.trim();
    const currentEmail = userProfile?.email || '';

    // If email is changed and not empty, require OTP verification
    if (cleanEmail && cleanEmail !== currentEmail) {
      sendOtpForEmail(cleanEmail);
      return;
    }

    // Direct save if email not changed
    const updated: UserProfile = {
      ...userProfile,
      id: userProfile?.id,
      name: editName.trim() || 'Customer',
      email: cleanEmail,
      phone: editPhone.trim() || userProfile?.phone || '',
      dob: editDob,
      photoURL: editPhotoURL.trim() || userProfile?.photoURL,
      refundBalance,
      cashbackBalance,
      walletBalance: totalWalletBalance
    };

    saveUserProfile(updated);
    onProfileUpdated(updated);
    setIsEditModalOpen(false);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.trim() !== generatedOtp) {
      setOtpError('Invalid OTP code. Please enter the 6-digit code sent to your Gmail.');
      return;
    }

    const updated: UserProfile = {
      ...userProfile,
      id: userProfile?.id,
      name: editName.trim() || 'Customer',
      email: pendingEmail,
      emailVerified: true,
      phone: editPhone.trim() || userProfile?.phone || '',
      dob: editDob,
      photoURL: editPhotoURL.trim() || userProfile?.photoURL,
      refundBalance,
      cashbackBalance,
      walletBalance: totalWalletBalance
    };

    saveUserProfile(updated);
    onProfileUpdated(updated);
    setIsOtpStep(false);
    setIsEditModalOpen(false);
  };

  const handleRateOrder = (orderId: string, type: 'user' | 'delivery', rating: number) => {
    setRatingsState((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [type === 'user' ? 'userRating' : 'deliveryRating']: rating
      }
    }));
  };

  // Sort orders descending by createdAt timestamp
  const sortedOrders = [...orders].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  const filteredOrders = sortedOrders.filter((ord) => {
    if (orderCategoryFilter === 'services') {
      return ord.services && ord.services.length > 0;
    }
    if (orderCategoryFilter === 'materials') {
      return ord.items && ord.items.length > 0;
    }
    return true;
  });

  // Calculate real savings from completed orders
  const totalSavings = orders.reduce((acc, ord) => acc + (ord.discount || 40), 120);

  // Dynamic wallet transactions
  const walletTransactions: WalletTransaction[] = [
    {
      id: 'tx-101',
      type: 'refund',
      title: 'Order Modification Refund',
      description: 'Refund credited for unsupplied Havells 16A socket (Order #GP-1092)',
      amount: 150,
      date: 'Aug 14, 2026',
      status: 'credited'
    },
    {
      id: 'tx-102',
      type: 'cashback',
      title: '5% Express Quick-Commerce Cashback',
      description: 'Earned on Polycab 2.5 sq mm wire purchase',
      amount: 75,
      date: 'Aug 11, 2026',
      status: 'credited'
    }
  ];

  const filteredTransactions = walletTransactions.filter((tx) => {
    if (walletFilter === 'refund') return tx.type === 'refund';
    if (walletFilter === 'cashback') return tx.type === 'cashback';
    return true;
  });

  const displayName = userProfile?.name || 'Customer';
  const displayPhone = userProfile?.phone || '';
  const displayEmail = userProfile?.email || '';
  const displayDob = userProfile?.dob;
  const userPhoto = userProfile?.photoURL;

  const getInitials = (name?: string, phone?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (phone) {
      return phone.replace(/\D/g, '').slice(-2);
    }
    return 'GP';
  };

  // -------------------------------------------------------------
  // SUB-PAGE 0: ORDERS & PURCHASES
  // -------------------------------------------------------------
  if (subPage === 'orders') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubPage('main')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900">Your Orders &amp; Bookings</h1>
              <p className="text-[11px] text-slate-500 font-semibold">{filteredOrders.length} Completed</p>
            </div>
          </div>

          <button
            onClick={onOpenShop}
            className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          {/* Filter Pills */}
          <div className="flex gap-2">
            <button
              onClick={() => setOrderCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                orderCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setOrderCategoryFilter('materials')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                orderCategoryFilter === 'materials'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Materials &amp; Supplies
            </button>
            <button
              onClick={() => setOrderCategoryFilter('services')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                orderCategoryFilter === 'services'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Wiring Bookings
            </button>
          </div>

          {/* Order Cards List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-2xs">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-extrabold text-slate-800">No Orders Found</p>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
                Shop wires, switches, tools, or book wiring technicians in 60 minutes.
              </p>
              <button
                onClick={onOpenShop}
                className="px-4 py-2 bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                Shop Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const orderRatings = ratingsState[order.id] || {};
                const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5 transition-all hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center font-black text-amber-900 text-sm shrink-0">
                          ⚡
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Giriraj Central Ezra Street Hub
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {order.area} • Order #{order.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                        <span>Delivered</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-3 space-y-1.5">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <p key={idx} className="text-xs text-slate-800 font-semibold">
                            <span className="font-black text-slate-900 mr-1.5">{item.quantity}X</span>
                            <span>
                              {item.product.name} ({item.product.brand})
                            </span>
                          </p>
                        ))
                      ) : order.services && order.services.length > 0 ? (
                        order.services.map((srv, idx) => (
                          <p key={idx} className="text-xs text-slate-800 font-semibold">
                            <span className="font-black text-slate-900 mr-1.5">1X</span>
                            <span>
                              {srv.serviceTitle} ({srv.projectType})
                            </span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-slate-700 font-semibold">
                          Electrical &amp; Construction Supplies Order
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs font-bold text-slate-700">
                      <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                        <span className="text-[11px] text-slate-600">Product Quality:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRateOrder(order.id, 'user', star)}
                              className="cursor-pointer"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  (orderRatings.userRating || 5) >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                        <span className="text-[11px] text-slate-600">Rider Delivery:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRateOrder(order.id, 'delivery', star)}
                              className="cursor-pointer"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  (orderRatings.deliveryRating || 5) >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Ordered on {formattedDate}</p>
                        <p className="text-xs font-black text-slate-900">
                          Bill Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <button
                          onClick={() => onReorder(order.items)}
                          className="px-4 py-2 bg-[#FFF0ED] hover:bg-[#FFE2DC] text-[#E23744] font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#FFD2C9]"
                        >
                          <span>REORDER</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 1: SAVED ADDRESSES
  // -------------------------------------------------------------
  if (subPage === 'addresses') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubPage('main')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black text-slate-900">Manage Saved Addresses</h1>
          </div>
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          {savedAddresses.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-2xs">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-extrabold text-slate-800">No Saved Addresses Found</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Pin your home, construction site, or office for fast 60-min delivery.
              </p>
              <button
                onClick={onOpenLocationModal}
                className="px-4 py-2 bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                Add Address Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-start justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                        {addr.tag}
                      </span>
                      <h3 className="text-sm font-black text-slate-900">
                        {addr.houseName || addr.houseFlat || 'Address'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600">
                      {addr.formattedExactAddress || `${addr.houseFlat}, ${addr.buildingRoad}, ${addr.area.name}`}
                    </p>
                    {addr.receiverName && (
                      <p className="text-[11px] text-slate-500">
                        Contact: {addr.receiverName} ({addr.receiverPhone || displayPhone})
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onSelectAddress && (
                      <button
                        onClick={() => {
                          onSelectAddress(addr);
                          setSubPage('main');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => deleteAddressFromFirestore(addr.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 2: SAVED PAYMENT MODES
  // -------------------------------------------------------------
  if (subPage === 'payments') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubPage('main')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black text-slate-900">Payment Modes &amp; UPI</h1>
          </div>
          <button
            onClick={() => setShowAddUpi(!showAddUpi)}
            className="flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add UPI ID</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          {showAddUpi && (
            <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-indigo-950">Add New UPI ID / VPA</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={() => {
                    if (newUpiId.trim() && newUpiId.includes('@')) {
                      setSavedUpi([...savedUpi, newUpiId.trim()]);
                      setNewUpiId('');
                      setShowAddUpi(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                >
                  Verify &amp; Save
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Saved UPI Handles</h3>
            {savedUpi.map((upi, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                    UPI
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{upi}</p>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified for Express Checkout</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSavedUpi(savedUpi.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Available Checkout Options</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Cash on Delivery (COD) / Pay on Site</span>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Enabled</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Giriraj Refund &amp; Cashback Wallet</span>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  ₹{totalWalletBalance} Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 3: TOTAL REFUND & CASHBACK WALLET
  // -------------------------------------------------------------
  if (subPage === 'wallet') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
          <button
            onClick={() => setSubPage('main')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-slate-900">Giriraj Refund &amp; Cashback Wallet</h1>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          {/* Main Wallet Balance Card */}
          <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>Total Usable Wallet Balance</span>
                </span>
                <span className="text-[10px] font-black bg-emerald-700/80 px-2.5 py-1 rounded-full text-emerald-100 border border-emerald-600">
                  Instant Checkout Active
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                ₹{totalWalletBalance.toLocaleString('en-IN')}.00
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-700/60">
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
                  <p className="text-[11px] text-emerald-200 font-semibold flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Total Refunds Credited</span>
                  </p>
                  <p className="text-base font-black text-white mt-0.5">₹{refundBalance}.00</p>
                  <p className="text-[10px] text-emerald-300 mt-0.5">Instant returns &amp; order adjustments</p>
                </div>

                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
                  <p className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Cashback &amp; Rewards</span>
                  </p>
                  <p className="text-base font-black text-white mt-0.5">₹{cashbackBalance}.00</p>
                  <p className="text-[10px] text-amber-200 mt-0.5">5% Quick-Commerce Reward</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice / Action */}
          {walletNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
              <span>{walletNotice}</span>
              <button onClick={() => setWalletNotice(null)} className="text-emerald-600 font-black cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* Wallet Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setWalletNotice('Wallet balance will be automatically deducted from your cart at checkout!');
              }}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-2xs flex items-center gap-2.5 text-left cursor-pointer transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Auto-Apply</p>
                <p className="text-[10px] text-slate-500">Deduct at checkout</p>
              </div>
            </button>

            <button
              onClick={() => {
                setWalletNotice('Refund amount is transferable to original payment method or UPI on request.');
              }}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 shadow-2xs flex items-center gap-2.5 text-left cursor-pointer transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Transfer Refund</p>
                <p className="text-[10px] text-slate-500">To bank or UPI</p>
              </div>
            </button>
          </div>

          {/* Transaction Statement */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Refunds &amp; Cashback History
              </h3>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setWalletFilter('all')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    walletFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setWalletFilter('refund')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    walletFilter === 'refund' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Refunds
                </button>
                <button
                  onClick={() => setWalletFilter('cashback')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    walletFilter === 'cashback' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Cashback
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'refund' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.type === 'refund' ? <RefreshCw className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{tx.title}</p>
                      <p className="text-[11px] text-slate-500">{tx.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600 shrink-0">+ ₹{tx.amount}.00</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 4: TECHNICIANS & WIRING BOOKINGS (With Prominent Back Arrow)
  // -------------------------------------------------------------
  if (subPage === 'services') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
          <button
            onClick={() => setSubPage('main')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-slate-900">Licensed Electricians &amp; Wiring Services</h1>
        </div>

        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="bg-amber-500 text-slate-950 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                Verified Kolkata Electricians
              </span>
              <h2 className="text-base font-black mt-1">Book Licensed Technicians in 60 Mins</h2>
              <p className="text-xs font-medium text-slate-900/80">
                Full residential wiring, MCB board repair, inverter setup, and load calculation.
              </p>
            </div>
            <Wrench className="w-10 h-10 text-slate-900/20 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WIRING_SERVICES.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 text-[10px] font-extrabold uppercase">
                      {srv.badge}
                    </span>
                    <span className="text-sm font-black text-slate-900">₹{srv.basePrice}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{srv.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{srv.shortDesc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Includes 30-Day Guarantee</span>
                  </span>
                  <button
                    onClick={() => {
                      setSubPage('help');
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 5: MEMBERSHIP & SAVINGS (Giriraj Power Pro)
  // -------------------------------------------------------------
  if (subPage === 'membership') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
          <button
            onClick={() => setSubPage('main')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-slate-900">Giriraj Power Pro Membership</h1>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-slate-950 rounded-3xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider bg-slate-950 text-yellow-300 px-2.5 py-0.5 rounded-full">
                Active Member
              </span>
            </div>
            <h2 className="text-2xl font-black">₹{totalSavings} Saved This Year</h2>
            <p className="text-xs font-bold text-slate-900/80 mt-1">
              Unlimited free 60-min express deliveries &amp; 5% instant cashback.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Your Pro Benefits</h3>
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero delivery fees on all electrical material orders above ₹299</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct priority dispatch from Ezra Street central distribution hub</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant refund to Giriraj Wallet on returns with 0 questions asked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 6: 24x7 HELP & SUPPORT
  // -------------------------------------------------------------
  if (subPage === 'help') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
          <button
            onClick={() => setSubPage('main')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-slate-900">24x7 Customer Support</h1>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Kolkata Central Support Desk</h3>
            <p className="text-xs text-slate-600">
              Need assistance with your 60-min delivery, wire measurements, GST tax invoices, or technician bookings?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href="tel:+919830577889"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-slate-900 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-400 text-black flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black">Call Central Hub</p>
                  <p className="text-[11px] text-slate-600">+91 98305 77889</p>
                </div>
              </a>

              <a
                href="https://wa.me/919830577889?text=Hi%20Giriraj%20Power,%20I%20need%20help%20with%20my%20order"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-slate-900 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black">WhatsApp Chat</p>
                  <p className="text-[11px] text-emerald-800">Instant Reply in 2 mins</p>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Frequently Asked Questions</h3>
            <div className="space-y-3 text-xs">
              <div className="border-b border-slate-100 pb-2.5">
                <p className="font-bold text-slate-900">How fast is the express delivery?</p>
                <p className="text-slate-600 mt-1">
                  We deliver in 60 minutes across Salt Lake, New Town, Ezra Street, Park Street, Ballygunge, and all covered Kolkata zones.
                </p>
              </div>
              <div className="border-b border-slate-100 pb-2.5">
                <p className="font-bold text-slate-900">Are genuine manufacturer warranty cards included?</p>
                <p className="text-slate-600 mt-1">
                  Yes, 100% of Polycab, Havells, Anchor, and Finolex products come sealed with genuine ISI guarantee stamps and GST invoices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 7: NOTIFICATIONS & PREFERENCES
  // -------------------------------------------------------------
  if (subPage === 'notifications') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
          <button
            onClick={() => setSubPage('main')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-slate-900">Preferences &amp; Alerts</h1>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-900">WhatsApp Dispatch Tracking</p>
                <p className="text-[11px] text-slate-500">Receive live rider phone number and delivery OTP on WhatsApp</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded cursor-pointer" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="text-xs font-extrabold text-slate-900">SMS Order Status Updates</p>
                <p className="text-[11px] text-slate-500">Get packing and out-for-delivery SMS</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PRIMARY VIEW: SWIGGY-STYLE PROFILE DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* 1. TOP HEADER BANNER (Crimson / Red Gradient matching Swiggy screenshot) */}
      <div className="bg-gradient-to-b from-[#8B0000] via-[#A30000] to-[#B31B1B] text-white pt-4 pb-6 px-4 sm:px-6 relative shadow-md">
        {/* Top Control Bar */}
        <div className="max-w-3xl mx-auto flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setSubPage('help')}
              className="text-xs font-black uppercase tracking-wider text-white hover:text-amber-200 transition-colors cursor-pointer"
            >
              HELP
            </button>

            {/* 3-Dots Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer"
                aria-label="Profile options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* 3-Dots Dropdown */}
              {isMenuOpen && (
                <>
                  {/* Invisible Fullscreen Backdrop to dismiss on outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                  />

                  <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={handleOpenEdit}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-slate-600" />
                      <span>Edit Profile Details</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSubPage('addresses');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-slate-600" />
                      <span>Manage Addresses</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSubPage('wallet');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-slate-600" />
                      <span>Refund &amp; Cashback Wallet</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOutUser();
                        onLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Identity Details with Photo Circle (Swiggy Style) */}
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Front Circle Box: User Email Photo or Monogram */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/60 bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md overflow-hidden relative">
              {userPhoto && !avatarError ? (
                <img
                  src={userPhoto}
                  alt={displayName}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-base sm:text-lg font-black tracking-tight">
                  {getInitials(displayName, displayPhone)}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white capitalize">
                  {displayName}
                </h1>
                <button
                  onClick={handleOpenEdit}
                  className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Edit Name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-0.5 space-y-0.5 text-xs text-white/90 font-medium">
                <p className="flex items-center gap-1.5">
                  {displayPhone && <span>{displayPhone}</span>}
                  {displayPhone && displayEmail && <span className="opacity-60">•</span>}
                  {displayEmail && <span>{displayEmail}</span>}
                  {userProfile?.emailVerified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-400/40">
                      <Check className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                </p>
                {displayDob && (
                  <p className="text-[11px] text-amber-200 flex items-center gap-1 font-semibold">
                    <Calendar className="w-3 h-3" />
                    <span>
                      DOB: {new Date(displayDob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenEdit}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer border border-white/20"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-3 space-y-4">
        {/* 2. MEMBERSHIP / SAVINGS BANNER CARD (Swiggy One style) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  Giriraj Power Pro
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-1">
                ₹{totalSavings} saved with 60-min express deliveries
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubPage('membership')}
            className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <span>Explore</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3. 4 QUICK ACCESS ACTION TILES (All Open Sub-Pages with Back Arrows) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Tile 1: Orders */}
          <button
            onClick={() => setSubPage('orders')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-sm transition-all text-left flex flex-col justify-between min-h-[96px] cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Your Orders</p>
              <p className="text-[10px] text-amber-700 font-bold">{sortedOrders.length} Completed</p>
            </div>
          </button>

          {/* Tile 2: Saved Address */}
          <button
            onClick={() => setSubPage('addresses')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-sm transition-all text-left flex flex-col justify-between min-h-[96px] cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Saved Address</p>
              <p className="text-[10px] text-slate-500 font-semibold">{savedAddresses.length} Addresses</p>
            </div>
          </button>

          {/* Tile 3: Payment Modes */}
          <button
            onClick={() => setSubPage('payments')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-sm transition-all text-left flex flex-col justify-between min-h-[96px] cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Payment Modes</p>
              <p className="text-[10px] text-slate-500 font-semibold">UPI &amp; Cards</p>
            </div>
          </button>

          {/* Tile 4: Giriraj Money / Total Refund & Cashback Wallet */}
          <button
            onClick={() => setSubPage('wallet')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-sm transition-all text-left flex flex-col justify-between min-h-[96px] cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Refund &amp; Wallet</p>
              <p className="text-[10px] text-emerald-700 font-bold">₹{totalWalletBalance} Balance</p>
            </div>
          </button>
        </div>

        {/* 4. VERTICAL MENU BUTTON LIST (All Open Dedicated Sub-Pages with Back Arrows) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          <button
            onClick={() => setSubPage('orders')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs font-black text-slate-900">Your Orders &amp; Booking History</p>
                <p className="text-[11px] text-slate-500">{sortedOrders.length} orders placed • View summary &amp; invoices</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {sortedOrders.length}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          <button
            onClick={() => setSubPage('wallet')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-black text-slate-900">Total Refund &amp; Cashback Wallet</p>
                <p className="text-[11px] text-slate-500">₹{totalWalletBalance} balance available for instant checkout</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setSubPage('payments')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs font-black text-slate-900">Saved Payment Modes &amp; UPI</p>
                <p className="text-[11px] text-slate-500">Manage GooglePay, PhonePe &amp; Cards</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setSubPage('addresses')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs font-black text-slate-900">Delivery Addresses</p>
                <p className="text-[11px] text-slate-500">Edit or pin home, site &amp; office on map</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setSubPage('services')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs font-black text-slate-900">Licensed Electricians &amp; Wiring Services</p>
                <p className="text-[11px] text-slate-500">Apartment &amp; commercial wiring appointments</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setSubPage('help')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs font-black text-slate-900">24x7 Customer Support &amp; FAQs</p>
                <p className="text-[11px] text-slate-500">Direct phone call and WhatsApp help</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setSubPage('notifications')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs font-black text-slate-900">Notification &amp; SMS Preferences</p>
                <p className="text-[11px] text-slate-500">Order alerts and dispatch tracking</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              signOutUser();
              onLogout();
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50/60 transition-colors text-left text-red-600 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <div>
                <p className="text-xs font-black">Sign Out from this Device</p>
                <p className="text-[11px] text-red-500/80">Log out of your account</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>

        {/* 5. PAST ORDERS SECTION (Exact layout from Swiggy screenshot) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              PAST ORDERS
            </h2>
            <span className="text-xs font-bold text-slate-500">
              {filteredOrders.length} Completed
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setOrderCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                orderCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setOrderCategoryFilter('materials')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                orderCategoryFilter === 'materials'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Materials &amp; Supplies
            </button>
            <button
              onClick={() => setOrderCategoryFilter('services')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                orderCategoryFilter === 'services'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Wiring Bookings
            </button>
          </div>

          {/* Order Cards List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-extrabold text-slate-800">No Past Orders Found</p>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
                Shop wires, switches, tools, or book wiring technicians in 60 minutes.
              </p>
              <button
                onClick={onOpenShop}
                className="px-4 py-2 bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                Shop Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.slice(0, visibleOrdersCount).map((order) => {
                const orderRatings = ratingsState[order.id] || {};
                const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5 transition-all hover:shadow-xs"
                  >
                    {/* Card Header: Store / Hub Name & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center font-black text-amber-900 text-sm shrink-0">
                          ⚡
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Giriraj Central Ezra Street Hub
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {order.area} • Order #{order.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                        <span>Delivered</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </div>

                    {/* Card Body: Items Summary */}
                    <div className="bg-slate-50/80 rounded-xl p-3 space-y-1.5">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <p key={idx} className="text-xs text-slate-800 font-semibold">
                            <span className="font-black text-slate-950 mr-1.5">{item.quantity}X</span>
                            <span>
                              {item.product.name} ({item.product.brand})
                            </span>
                          </p>
                        ))
                      ) : order.services && order.services.length > 0 ? (
                        order.services.map((srv, idx) => (
                          <p key={idx} className="text-xs text-slate-800 font-semibold">
                            <span className="font-black text-slate-950 mr-1.5">1X</span>
                            <span>
                              {srv.serviceTitle} ({srv.projectType})
                            </span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-slate-700 font-semibold">
                          Electrical &amp; Construction Supplies Order
                        </p>
                      )}
                    </div>

                    {/* Interactive Ratings Row (Product Quality + Delivery Rating) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs font-bold text-slate-700">
                      <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                        <span className="text-[11px] text-slate-600">Product Quality:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRateOrder(order.id, 'user', star)}
                              className="cursor-pointer"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  (orderRatings.userRating || 5) >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                        <span className="text-[11px] text-slate-600">Rider Delivery:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRateOrder(order.id, 'delivery', star)}
                              className="cursor-pointer"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  (orderRatings.deliveryRating || 5) >= star
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Timestamp, Bill Total & Reorder Button */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Ordered on {formattedDate}</p>
                        <p className="text-xs font-black text-slate-900">
                          Bill Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <button
                          onClick={() => onReorder(order.items)}
                          className="px-4 py-2 bg-[#FFF0ED] hover:bg-[#FFE2DC] text-[#E23744] font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#FFD2C9]"
                        >
                          <span>REORDER</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* View More Orders Button */}
              {filteredOrders.length > visibleOrdersCount && (
                <button
                  onClick={() => setVisibleOrdersCount((prev) => prev + 4)}
                  className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 font-black rounded-xl text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  VIEW MORE ORDERS ⌄
                </button>
              )}
            </div>
          )}
        </div>

        {/* App Version Tag */}
        <div className="text-center pt-8 pb-4">
          <p className="text-[11px] font-bold text-slate-400">Giriraj Power App Version 4.114.3</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Serving Kolkata with 60-Minute Express Electrical Delivery
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          EDIT PROFILE MODAL (With OTP Verification for Gmail Updates)
          ------------------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            {!isOtpStep ? (
              <>
                <h3 className="text-lg font-black text-slate-900 mb-1">Edit Your Profile</h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Update your details for GST invoices &amp; express Kolkata deliveries.
                </p>

                <form onSubmit={handleProfileFormSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Amit Sengupta"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Gmail / Email Address</label>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Requires OTP verification
                      </span>
                    </div>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 98300 XXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Profile Photo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={editPhotoURL}
                      onChange={(e) => setEditPhotoURL(e.target.value)}
                      placeholder="https://lh3.googleusercontent.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date of Birth (Optional)
                    </label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 bg-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Used for exclusive birthday loyalty cashbacks and discounts.
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* OTP VERIFICATION VIEW FOR EMAIL UPDATE */
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-900">Verify Your Gmail Address</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    We sent a 6-digit verification security code to:
                  </p>
                  <p className="text-xs font-black text-slate-900 mt-0.5">{pendingEmail}</p>
                </div>

                {/* Simulated Live Toast Notice showing the OTP */}
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1">
                  <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-amber-700" />
                    <span>Gmail Security OTP Dispatched</span>
                  </p>
                  <p className="text-slate-700 text-[11px]">
                    Your 6-digit verification code is:{' '}
                    <span className="font-black text-slate-950 bg-amber-200/80 px-1.5 py-0.5 rounded tracking-widest text-xs">
                      {generatedOtp}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.4em] text-lg font-black px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 bg-white"
                      autoFocus
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs text-red-600 font-bold text-center">{otpError}</p>
                  )}

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                    <span>
                      {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Code expired?'}
                    </span>
                    <button
                      type="button"
                      disabled={otpTimer > 0}
                      onClick={() => sendOtpForEmail(pendingEmail)}
                      className={`font-bold ${
                        otpTimer > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-amber-600 hover:text-amber-700 cursor-pointer'
                      }`}
                    >
                      Resend OTP
                    </button>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOtpStep(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Verify &amp; Save
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
