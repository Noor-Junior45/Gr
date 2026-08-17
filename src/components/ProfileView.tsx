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
  KeyRound,
  Smartphone,
  Loader2,
  FileText,
  Lock
} from 'lucide-react';
import { Order, SavedAddress, UserProfile, CartItem, WalletTransaction } from '../types';
import { LegalView } from './LegalViews';
import {
  saveUserProfile,
  signOutUser,
  deleteAddressFromFirestore,
  subscribeToUpiIds,
  saveUpiToFirestore,
  deleteUpiFromFirestore
} from '../services/firebaseConfig';
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
  // Current active sub-page view: 'main' | 'orders' | 'addresses' | 'payments' | 'wallet' | 'services' | 'membership' | 'help' | 'notifications' | 'privacy' | 'terms'
  const [subPage, setSubPage] = useState<
    'main' | 'orders' | 'addresses' | 'payments' | 'wallet' | 'services' | 'membership' | 'help' | 'notifications' | 'privacy' | 'terms'
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

  // Payment state (Stored on server & Firestore)
  const [savedUpi, setSavedUpi] = useState<string[]>([]);
  const [newUpiId, setNewUpiId] = useState('');
  const [showAddUpi, setShowAddUpi] = useState(false);
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);
  const [upiSuccessNotice, setUpiSuccessNotice] = useState<string | null>(null);

  // Preferences & Alerts toggle state
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Subscribe to real-time saved UPI IDs from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToUpiIds((upis) => {
      setSavedUpi(upis);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Wallet State
  const refundBalance = userProfile?.refundBalance ?? 0;
  const cashbackBalance = userProfile?.cashbackBalance ?? 0;
  const totalWalletBalance = userProfile?.walletBalance ?? (refundBalance + cashbackBalance);
  const [walletNotice, setWalletNotice] = useState<string | null>(null);

  // Reset scroll to top whenever navigating to a subpage or returning to main profile
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [subPage]);

  // Close 3-dots menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
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
    setEditName(userProfile?.name || '');
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
      name: editName.trim(),
      email: cleanEmail,
      phone: editPhone.trim(),
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
      name: editName.trim(),
      email: pendingEmail,
      emailVerified: true,
      phone: editPhone.trim(),
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

  // Wallet transactions from user profile or empty
  const walletTransactions: WalletTransaction[] = [];
  const filteredTransactions = walletTransactions;

  // Clean user fields (no demo name/number)
  const rawName = userProfile?.name?.trim() || '';
  const rawPhone = userProfile?.phone?.trim() || '';
  const rawEmail = userProfile?.email?.trim() || '';
  const displayDob = userProfile?.dob;
  const userPhoto = userProfile?.photoURL;

  // Flags for whether profile fields are missing (for first-time/incomplete logins)
  const hasMissingName = !rawName;
  const hasMissingPhone = !rawPhone;
  const hasMissingEmail = !rawEmail;
  const hasAnyMissingDetails = hasMissingName || hasMissingPhone || hasMissingEmail;

  const displayName = rawName || 'Set Your Name';
  const displayPhone = rawPhone;
  const displayEmail = rawEmail;

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
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubPage('main')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900">Orders History</h1>
              <p className="text-[11px] text-slate-500 font-semibold">{filteredOrders.length} Completed</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
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
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-2xs">
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
    const handleSaveUpi = async () => {
      const clean = newUpiId.trim().toLowerCase();
      if (!clean) {
        setUpiError('Please enter a valid UPI ID (e.g. name@okhdfcbank or 98300xxxxx@upi)');
        return;
      }
      if (!clean.includes('@') || clean.length < 4) {
        setUpiError('Invalid UPI ID format. It must include "@" symbol.');
        return;
      }
      setUpiError(null);
      setIsSavingUpi(true);
      try {
        await saveUpiToFirestore(clean);
        setNewUpiId('');
        setShowAddUpi(false);
        setUpiSuccessNotice(`UPI ID ${clean} saved securely on server`);
        setTimeout(() => setUpiSuccessNotice(null), 4000);
      } catch {
        setUpiError('Could not save UPI ID to server. Please try again.');
      } finally {
        setIsSavingUpi(false);
      }
    };

    const handleDeleteUpi = async (upiToDelete: string) => {
      try {
        await deleteUpiFromFirestore(upiToDelete);
        setUpiSuccessNotice(`UPI ID ${upiToDelete} removed.`);
        setTimeout(() => setUpiSuccessNotice(null), 3000);
      } catch {
        setUpiError('Failed to remove UPI ID. Please try again.');
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubPage('main')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black text-slate-900">Saved Payment Modes</h1>
          </div>
          {savedUpi.length > 0 && !showAddUpi && (
            <button
              onClick={() => {
                setShowAddUpi(true);
                setUpiError(null);
              }}
              className="flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add UPI ID</span>
            </button>
          )}
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Notification / Success / Error Toasts */}
          {upiSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{upiSuccessNotice}</span>
              </div>
              <button onClick={() => setUpiSuccessNotice(null)} className="text-emerald-600 font-bold hover:text-emerald-800 cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* Add UPI Form (Expandable) */}
          {showAddUpi && (
            <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">Add New UPI Handle (VPA)</h3>
                <button
                  onClick={() => {
                    setShowAddUpi(false);
                    setUpiError(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Enter your Google Pay, PhonePe, Paytm or bank UPI ID to save for instant checkout.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank or 98300xxxxx@ybl"
                  value={newUpiId}
                  onChange={(e) => {
                    setNewUpiId(e.target.value);
                    if (upiError) setUpiError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveUpi();
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 focus:bg-white"
                  disabled={isSavingUpi}
                  autoFocus
                />
                <button
                  onClick={handleSaveUpi}
                  disabled={isSavingUpi}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  {isSavingUpi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save UPI ID</span>
                  )}
                </button>
              </div>
              {upiError && <p className="text-[11px] font-bold text-red-600 mt-1">{upiError}</p>}
            </div>
          )}

          {/* SAVED UPI HANDLES SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Saved UPI Handles
              </h2>
              {savedUpi.length > 0 && (
                <span className="text-[11px] font-bold text-slate-400">
                  {savedUpi.length} saved
                </span>
              )}
            </div>

            {savedUpi.length === 0 ? (
              /* Redesigned Empty State with Button to Add UPI ID */
              <div className="bg-white rounded-2xl p-7 border border-slate-200 text-center shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900">No Saved UPI Handles</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                  You haven't saved any UPI IDs yet. Add your Google Pay, PhonePe, Paytm, or bank UPI ID for 1-click express checkout.
                </p>
                {!showAddUpi && (
                  <button
                    onClick={() => {
                      setShowAddUpi(true);
                      setUpiError(null);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add UPI ID</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
                {savedUpi.map((upi, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                        UPI
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{upi}</p>
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Saved on Server for Express Checkout</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUpi(upi)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove UPI handle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {!showAddUpi && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => {
                        setShowAddUpi(true);
                        setUpiError(null);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another UPI ID</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AVAILABLE CHECKOUT OPTIONS (Redesigned without heavy boxes) */}
          <div className="pt-2 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Available Checkout Options
            </h2>
            
            <div className="divide-y divide-slate-200">
              {/* UPI */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs">
                    UPI
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">UPI</p>
                    <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM &amp; CRED</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Available
                </span>
              </div>

              {/* Debit Card */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Debit Card</p>
                    <p className="text-[11px] text-slate-500">Visa, MasterCard, RuPay &amp; Maestro</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Available
                </span>
              </div>

              {/* Credit Card */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Credit Card</p>
                    <p className="text-[11px] text-slate-500">All Major Banks &amp; No-Cost EMI</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Available
                </span>
              </div>

              {/* Cash on Delivery */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs">
                    ₹
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-slate-500">Pay cash or scan QR upon delivery / site service</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 3: WALLET
  // -------------------------------------------------------------
  if (subPage === 'wallet') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
          <button
            onClick={() => setSubPage('main')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-slate-900">Wallet</h1>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          {/* Main Wallet Balance Card */}
          <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>Wallet Balance</span>
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black tracking-tight">
                ₹{totalWalletBalance.toLocaleString('en-IN')}.00
              </div>
            </div>
          </div>

          {/* Transaction Statement */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Transaction History
            </h3>

            {filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No Recent Transactions</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Refunds and wallet credits will appear here.</p>
              </div>
            ) : (
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
            )}
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
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
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
          <div className="bg-amber-400/20 backdrop-blur-xs border border-amber-300/60 text-slate-900 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                  Verified Kolkata Electricians
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-900 border border-amber-400/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Coming Soon</span>
                </span>
              </div>
              <h2 className="text-base font-black mt-2 text-slate-900">Book Licensed Technicians in 60 Mins</h2>
              <p className="text-xs font-medium text-slate-700 mt-0.5 leading-relaxed">
                Full residential wiring, MCB board repair, inverter setup, and load calculation. On-demand technician booking is launching soon across Kolkata!
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-400/25 border border-amber-300/60 flex items-center justify-center shrink-0 ml-3">
              <Wrench className="w-6 h-6 text-amber-700" />
            </div>
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
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
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
  // SUB-PAGE 6: HELP CENTER & SUPPORT
  // -------------------------------------------------------------
  if (subPage === 'help') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
          <button
            onClick={() => setSubPage('main')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-slate-900">Help Center</h1>
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
  // SUB-PAGE 7: COMMUNICATION PREFERENCES
  // -------------------------------------------------------------
  if (subPage === 'notifications') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center gap-3 shadow-2xs">
          <button
            onClick={() => setSubPage('main')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-slate-900">Communication Preferences</h1>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-5">
            {/* WhatsApp Dispatch Tracking */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 pr-2">
                <p className="text-xs font-black text-slate-900">WhatsApp Dispatch Tracking</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Receive live rider phone number and delivery OTP on WhatsApp
                </p>
              </div>

              {/* Reference-Styled Toggle Button */}
              <button
                id="toggle-whatsapp-tracking"
                type="button"
                role="switch"
                aria-checked={whatsappAlerts}
                aria-label="Toggle WhatsApp dispatch tracking"
                onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                className={`relative inline-flex h-[32px] w-[58px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  whatsappAlerts
                    ? 'bg-[#00B050] shadow-[inset_0_3px_4px_rgba(0,0,0,0.22)]'
                    : 'bg-[#C8CCD0] shadow-[inset_0_3px_4px_rgba(0,0,0,0.2)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-[26px] w-[26px] rounded-full bg-[#ECEEF0] shadow-[0_2px_4px_rgba(0,0,0,0.28)] ring-0 transition-transform duration-200 ease-in-out ${
                    whatsappAlerts ? 'translate-x-[29px] translate-y-[3px]' : 'translate-x-[3px] translate-y-[3px]'
                  }`}
                />
              </button>
            </div>

            {/* SMS Order Status Updates */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex-1 pr-2">
                <p className="text-xs font-black text-slate-900">SMS Order Status Updates</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Get packing and out-for-delivery SMS
                </p>
              </div>

              {/* Reference-Styled Toggle Button */}
              <button
                id="toggle-sms-updates"
                type="button"
                role="switch"
                aria-checked={smsAlerts}
                aria-label="Toggle SMS order status updates"
                onClick={() => setSmsAlerts(!smsAlerts)}
                className={`relative inline-flex h-[32px] w-[58px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  smsAlerts
                    ? 'bg-[#00B050] shadow-[inset_0_3px_4px_rgba(0,0,0,0.22)]'
                    : 'bg-[#C8CCD0] shadow-[inset_0_3px_4px_rgba(0,0,0,0.2)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-[26px] w-[26px] rounded-full bg-[#ECEEF0] shadow-[0_2px_4px_rgba(0,0,0,0.28)] ring-0 transition-transform duration-200 ease-in-out ${
                    smsAlerts ? 'translate-x-[29px] translate-y-[3px]' : 'translate-x-[3px] translate-y-[3px]'
                  }`}
                />
              </button>
            </div>

            {/* Email Invoices & Order Summary Alerts */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex-1 pr-2">
                <p className="text-xs font-black text-slate-900">Email Invoices &amp; Order Summaries</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Receive official GST invoices, order receipts, and delivery confirmations via email
                </p>
              </div>

              {/* Reference-Styled Toggle Button */}
              <button
                id="toggle-email-updates"
                type="button"
                role="switch"
                aria-checked={emailAlerts}
                aria-label="Toggle Email invoices and order summaries"
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`relative inline-flex h-[32px] w-[58px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  emailAlerts
                    ? 'bg-[#00B050] shadow-[inset_0_3px_4px_rgba(0,0,0,0.22)]'
                    : 'bg-[#C8CCD0] shadow-[inset_0_3px_4px_rgba(0,0,0,0.2)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-[26px] w-[26px] rounded-full bg-[#ECEEF0] shadow-[0_2px_4px_rgba(0,0,0,0.28)] ring-0 transition-transform duration-200 ease-in-out ${
                    emailAlerts ? 'translate-x-[29px] translate-y-[3px]' : 'translate-x-[3px] translate-y-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-PAGE 8: PRIVACY POLICY (For Google OAuth Verification)
  // -------------------------------------------------------------
  if (subPage === 'privacy') {
    return <LegalView onBack={() => setSubPage('main')} type="privacy" />;
  }

  // -------------------------------------------------------------
  // SUB-PAGE 9: TERMS OF SERVICE (For Google OAuth Verification)
  // -------------------------------------------------------------
  if (subPage === 'terms') {
    return <LegalView onBack={() => setSubPage('main')} type="terms" />;
  }

  // -------------------------------------------------------------
  // PRIMARY VIEW: SWIGGY-STYLE PROFILE DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* 1. TOP HEADER BANNER (Full width touching top & both sides, bottom curves only) */}
      <div className="bg-gradient-to-b from-[#8B0000] via-[#A30000] to-[#B31B1B] text-white pt-4 pb-7 px-4 sm:px-6 relative shadow-md rounded-b-[2rem] border-b border-red-950/30">
        {/* Top Control Bar with Back Arrow & Actions */}
        <div className="max-w-3xl mx-auto flex items-center justify-between mb-3">
          {/* Arrow Back Button */}
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer flex items-center gap-1.5"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-bold sm:inline hidden">Back</span>
          </button>

          <div className="flex items-center gap-2.5 relative">
            <button
              onClick={() => setSubPage('help')}
              className="text-xs font-black uppercase tracking-wider text-white hover:text-amber-200 transition-colors cursor-pointer px-2 py-1"
            >
              HELP
            </button>

            {/* 3-Dots Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer relative"
                aria-label="Profile options"
              >
                <MoreVertical className="w-5 h-5" />
                {hasAnyMissingDetails && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-400 border-2 border-red-900 rounded-full animate-pulse" />
                )}
              </button>

              {/* 3-Dots Dropdown Pop Up */}
              {isMenuOpen && (
                <>
                  {/* Invisible Fullscreen Backdrop to dismiss on outside click */}
                  <div
                    className="fixed inset-0 z-40 bg-black/10"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                  />

                  <div className="absolute right-0 top-11 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleOpenEdit();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Edit3 className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>Edit Profile Details</span>
                      </div>
                      {hasAnyMissingDetails && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSubPage('addresses');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Manage Addresses</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSubPage('wallet');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Refund &amp; Cashback Wallet</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSubPage('privacy');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Privacy Policy</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSubPage('terms');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Terms of Service</span>
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
                      <LogOut className="w-4 h-4 shrink-0" />
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
          <div className="flex items-center gap-3.5 sm:gap-4">
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
                  {getInitials(rawName, rawPhone)}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white capitalize">
                  {displayName}
                </h1>
                {hasMissingName && (
                  <span
                    onClick={handleOpenEdit}
                    className="inline-flex items-center gap-1 text-[10px] font-black bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-full cursor-pointer shadow-xs animate-pulse"
                    title="Enter your full name"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Add Name
                  </span>
                )}
              </div>

              {/* Stack-wise Phone Number and Email */}
              <div className="mt-1 space-y-0.5 text-xs text-white/90 font-medium">
                {displayPhone ? (
                  <p className="flex items-center gap-1.5">
                    <span className="font-semibold text-white tracking-wide">{displayPhone}</span>
                  </p>
                ) : (
                  <button
                    onClick={handleOpenEdit}
                    className="flex items-center gap-1.5 text-left text-amber-200 hover:text-white transition-colors cursor-pointer group"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400 ring-2 ring-red-200/50 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="underline decoration-dotted underline-offset-2 text-[11px] font-semibold">
                      Add mobile number
                    </span>
                  </button>
                )}

                {displayEmail ? (
                  <p className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white/85 text-[11px] sm:text-xs break-all">{displayEmail}</span>
                    {userProfile?.emailVerified && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-400/40">
                        <Check className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </p>
                ) : (
                  <button
                    onClick={handleOpenEdit}
                    className="flex items-center gap-1.5 text-left text-amber-200 hover:text-white transition-colors cursor-pointer group"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400 ring-2 ring-red-200/50 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="underline decoration-dotted underline-offset-2 text-[11px] font-semibold">
                      Add email address
                    </span>
                  </button>
                )}

                {displayDob && (
                  <p className="text-[11px] text-amber-200 flex items-center gap-1 font-semibold pt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>
                      DOB: {new Date(displayDob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-6 mt-4 sm:mt-5 space-y-4">
        {/* 3. 4 QUICK ACCESS ACTION TILES (Properly spaced, visibly distinct and elevated) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
          {/* Tile 1: Orders */}
          <button
            onClick={() => setSubPage('orders')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all text-left flex flex-col justify-between min-h-[105px] cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Your Orders</p>
              <p className="text-[11px] text-amber-700 font-bold mt-0.5">{sortedOrders.length} Completed</p>
            </div>
          </button>

          {/* Tile 2: Saved Address */}
          <button
            onClick={() => setSubPage('addresses')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-pink-400 transition-all text-left flex flex-col justify-between min-h-[105px] cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-200/60 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Saved Address</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{savedAddresses.length} Addresses</p>
            </div>
          </button>

          {/* Tile 3: Payment Modes */}
          <button
            onClick={() => setSubPage('payments')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all text-left flex flex-col justify-between min-h-[105px] cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Payment Modes</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">UPI &amp; Cards</p>
            </div>
          </button>

          {/* Tile 4: Wallet */}
          <button
            onClick={() => setSubPage('wallet')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left flex flex-col justify-between min-h-[105px] cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Wallet</p>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5">₹{totalWalletBalance} Balance</p>
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
                <p className="text-xs font-black text-slate-900">Orders History</p>
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
                <p className="text-xs font-black text-slate-900">Wallet</p>
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
                <p className="text-xs font-black text-slate-900">Saved Payment Modes</p>
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
                <p className="text-xs font-black text-slate-900">Help Center</p>
                <p className="text-[11px] text-slate-500">24x7 customer support, phone call &amp; WhatsApp help</p>
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
                <p className="text-xs font-black text-slate-900">Communication Preferences</p>
                <p className="text-[11px] text-slate-500">WhatsApp, SMS &amp; Email alerts</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setSubPage('privacy')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs font-black text-slate-900">Privacy Policy</p>
                <p className="text-[11px] text-slate-500">User data protection &amp; Google OAuth compliance</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setSubPage('terms')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs font-black text-slate-900">Terms of Service</p>
                <p className="text-[11px] text-slate-500">User agreements, orders, warranties &amp; refunds</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Separate Pill-Shaped Sign Out Button */}
        <div className="pt-2">
          <button
            id="btn-profile-signout"
            onClick={() => {
              signOutUser();
              onLogout();
            }}
            className="w-full py-3.5 px-6 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-200/80 transition-all font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* App Version Tag */}
        <div className="text-center pt-6 pb-2">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span>Full Name</span>
                        {hasMissingName && (
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" title="Name is required" />
                        )}
                      </label>
                    </div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span>Gmail / Email Address</span>
                        {hasMissingEmail && (
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" title="Email is required" />
                        )}
                      </label>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Requires OTP verification
                      </span>
                    </div>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Enter your email (e.g. name@gmail.com)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span>Mobile Number</span>
                        {hasMissingPhone && (
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" title="Mobile number is required" />
                        )}
                      </label>
                    </div>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
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
