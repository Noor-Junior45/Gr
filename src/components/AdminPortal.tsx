import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Bell,
  Volume2,
  VolumeX,
  CheckCircle,
  Package,
  Truck,
  Check,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  RefreshCw,
  X,
  Mail,
  Send,
  Inbox,
  Reply,
  Trash2,
  Copy,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { Order, OrderStatus, ReceivedEmail, ADMIN_EMAILS, isUserAdmin } from '../types';
import {
  subscribeToAdminOrders,
  updateOrderStatusInFirestore,
  clearAllOrdersFromSupabase,
  syncAllProductsToSupabase
} from '../services/supabaseService';
import { soundService } from '../services/sound';
import {
  getEmailServiceStatus,
  sendOrderConfirmationEmail,
  getOrderWhatsAppUrl,
  formatOrderWhatsAppMessage,
  sendTestEmail,
  EmailServiceStatus,
  getReceivedEmails,
  replyToReceivedEmail,
  updateReceivedEmailStatus,
  deleteReceivedEmail,
  simulateInboundEmail
} from '../services/emailService';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose, currentUserEmail }) => {
  const [activePortalTab, setActivePortalTab] = useState<'orders' | 'inbox'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'out_for_delivery' | 'delivered'>('all');
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  const [emailServiceStatus, setEmailServiceStatus] = useState<EmailServiceStatus | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('manager@girirajpower.com');
  const [testSending, setTestSending] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [sendingOrderEmailId, setSendingOrderEmailId] = useState<string | null>(null);

  // Inbound Email State
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(null);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [simulatingInbound, setSimulatingInbound] = useState(false);

  const fetchInbox = async () => {
    setInboxLoading(true);
    try {
      const res = await getReceivedEmails();
      if (res && res.emails) {
        setReceivedEmails(res.emails);
      }
    } catch (err) {
      console.warn('Failed to load inbound emails:', err);
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getEmailServiceStatus().then(setEmailServiceStatus).catch(console.warn);
      fetchInbox();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToAdminOrders((newOrders) => {
      setOrders(newOrders);
      // If a new order arrives and count increased, trigger sound alert
      if (newOrders.length > lastOrderCount && lastOrderCount > 0) {
        if (soundEnabled) {
          soundService.playUrgentAlert();
        }
      }
      setLastOrderCount(newOrders.length);
    });

    return () => unsubscribe();
  }, [lastOrderCount, soundEnabled]);

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'all') return true;
    return o.status === activeFilter;
  });

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    updateOrderStatusInFirestore(orderId, nextStatus);
  };

  const handleTestChime = () => {
    soundService.playNewOrderChime();
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) return;
    setTestSending(true);
    setTestMessage(null);
    try {
      const res = await sendTestEmail(testEmailAddress.trim(), 'Giriraj Admin Manager');
      setTestMessage(res.message || (res.success ? 'Test email dispatched!' : 'Failed to send'));
    } catch (err: any) {
      setTestMessage(err.message || 'Error occurred while testing email');
    } finally {
      setTestSending(false);
    }
  };

  const handleSendOrderInvoiceEmail = async (order: Order) => {
    const target = order.customerEmail || prompt('Enter recipient email address for order tax invoice:', 'customer@example.com');
    if (!target) return;
    setSendingOrderEmailId(order.id);
    try {
      const res = await sendOrderConfirmationEmail(order, target);
      alert(res.message || (res.success ? 'Tax invoice email sent!' : 'Could not send email.'));
    } catch (err: any) {
      alert(`Email sending error: ${err.message}`);
    } finally {
      setSendingOrderEmailId(null);
    }
  };

  const handleClearAllOrders = async () => {
    if (!window.confirm('Are you sure you want to permanently clear/delete all customer orders from Supabase & local caches?')) {
      return;
    }
    const res = await clearAllOrdersFromSupabase();
    if (res.success) {
      alert('✅ All order histories have been successfully deleted from Supabase.');
    } else {
      alert(`❌ Error clearing orders: ${res.error}`);
    }
  };

  const handleSyncProducts = async () => {
    const res = await syncAllProductsToSupabase();
    if (res.success) {
      alert(`✅ Successfully synced ${res.count} products to your Supabase products table!`);
    } else {
      alert(`❌ Products sync notice: ${res.error}`);
    }
  };

  const handleSelectEmail = async (email: ReceivedEmail) => {
    setSelectedEmail(email);
    setReplySuccessMessage(null);
    if (email.status === 'unread') {
      await updateReceivedEmailStatus(email.id, 'read');
      setReceivedEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, status: 'read' } : e))
      );
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !replyText.trim()) return;

    setIsReplying(true);
    setReplySuccessMessage(null);
    try {
      const res = await replyToReceivedEmail(selectedEmail.id, replyText.trim());
      if (res.success) {
        setReplySuccessMessage(`Reply successfully dispatched to ${selectedEmail.from}!`);
        setReplyText('');
        if (res.record) {
          setSelectedEmail(res.record);
        }
        await fetchInbox();
      } else {
        alert(res.message || 'Failed to dispatch reply');
      }
    } catch (err: any) {
      alert(`Reply error: ${err.message}`);
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!window.confirm('Delete this received email from the inbound inbox?')) return;
    await deleteReceivedEmail(id);
    if (selectedEmail?.id === id) setSelectedEmail(null);
    setReceivedEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSimulateInbound = async () => {
    setSimulatingInbound(true);
    try {
      const res = await simulateInboundEmail();
      if (res.success && res.email) {
        setReceivedEmails((prev) => [res.email!, ...prev]);
        setSelectedEmail(res.email);
        soundService.playNewOrderChime();
      }
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setSimulatingInbound(false);
    }
  };

  const unreadInboxCount = receivedEmails.filter((m) => m.status === 'unread').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs animate-in fade-in flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-950 text-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col border border-yellow-400/30 shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  Giriraj Power Management Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-black uppercase">
                  Admin Team
                </span>
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-extrabold font-mono">
                  {emailServiceStatus?.officialEmail || 'orders@oieldiakir.resend.app'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Admins: <strong className="text-slate-200">gauravgiri123344@gmail.com</strong> &amp; <strong className="text-slate-200">mdhassan1738@gmail.com</strong>
                {currentUserEmail && isUserAdmin(currentUserEmail) && (
                  <span className="ml-1 text-emerald-400 font-bold">• Active: {currentUserEmail}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Products */}
            <button
              onClick={handleSyncProducts}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Save/sync all catalog products into Supabase"
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync Products</span>
            </button>

            {/* Clear Orders */}
            <button
              onClick={handleClearAllOrders}
              className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/40 text-xs font-bold transition-colors cursor-pointer"
              title="Clear all orders history"
            >
              Clear Orders
            </button>

            {/* Audio Alarm Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) soundService.playNewOrderChime();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-yellow-400 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle audio alert chime on incoming orders"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Audio Alert ON' : 'Audio Muted'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Portal Level Tabs (Orders vs Resend Inbound Inbox) */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePortalTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                activePortalTab === 'orders'
                  ? 'bg-yellow-400 text-slate-950 shadow-xs font-black'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Customer Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActivePortalTab('inbox')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer relative ${
                activePortalTab === 'inbox'
                  ? 'bg-yellow-400 text-slate-950 shadow-xs font-black'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Inbound Emails &amp; Inquiries ({receivedEmails.length})</span>
              {unreadInboxCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-black animate-pulse">
                  {unreadInboxCount}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-yellow-400" />
              Inbound: <strong className="text-yellow-300 font-mono">{emailServiceStatus?.resendInboundEmail || 'orders@oieldiakir.resend.app'}</strong>
            </span>
          </div>
        </div>

        {/* Resend Email Gateway Management Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-black text-xs shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Resend Gateway:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  emailServiceStatus?.configured
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                }`}>
                  {emailServiceStatus?.configured ? '⚡ Resend Live' : '⚙️ Resend Configured'}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  (Sender: {emailServiceStatus?.fromEmail || 'Giriraj Power <team@girirajpower.in>'})
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendTestEmail} className="flex items-center gap-2">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="Test recipient email..."
              className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              disabled={testSending}
              className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {testSending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>Send Test</span>
            </button>
          </form>
        </div>

        {testMessage && (
          <div className="px-4 sm:px-6 py-2 bg-yellow-400/15 border-b border-yellow-400/30 text-yellow-300 text-xs flex items-center justify-between">
            <span>{testMessage}</span>
            <button onClick={() => setTestMessage(null)} className="text-yellow-400 hover:text-white font-bold ml-2 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: CUSTOMER ORDERS VIEW */}
        {activePortalTab === 'orders' && (
          <>
            {/* Filter Navigation Tabs */}
            <div className="px-4 sm:px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeFilter === 'all' ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All Orders ({orders.length})
                </button>
                <button
                  onClick={() => setActiveFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    activeFilter === 'pending' ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>Pending</span>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                </button>
                <button
                  onClick={() => setActiveFilter('accepted')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeFilter === 'accepted' ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Accepted &amp; Packing
                </button>
                <button
                  onClick={() => setActiveFilter('out_for_delivery')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeFilter === 'out_for_delivery' ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Out for Delivery (60-Min Active)
                </button>
                <button
                  onClick={() => setActiveFilter('delivered')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeFilter === 'delivered' ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Delivered
                </button>
              </div>
            </div>

            {/* Orders Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <div className="text-sm font-bold">No orders found in this filter</div>
                  <p className="text-xs text-slate-600 mt-1">When a customer in Kolkata places an order, it will appear here immediately.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isPending = order.status === 'pending';
                  const isPacking = order.status === 'accepted';
                  const isOut = order.status === 'out_for_delivery';
                  const isDelivered = order.status === 'delivered';

                  return (
                    <div
                      key={order.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-slate-900 border-red-500/50 shadow-lg shadow-red-950/20 ring-1 ring-red-500/30'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                              isPending
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : isPacking
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                : isOut
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                : 'bg-green-500/20 text-green-400 border border-green-500/40'
                            }`}
                          >
                            {isPending ? '!' : isPacking ? '📦' : isOut ? '🚚' : '✓'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white">
                                Order #{order.id}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isPending
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                    : isPacking
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : isOut
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                }`}
                              >
                                {order.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                              <span>•</span>
                              <span className="font-semibold text-yellow-400">{order.deliverySpeed === 'instant' ? '⚡ 60-Min Express' : '📦 Standard'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-yellow-400">
                            ₹{order.totalAmount}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {order.paymentMethod === 'cod' ? 'Cash / UPI on Delivery' : 'Online Paid'}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address & Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                            <span>Delivery Destination</span>
                          </div>
                          <p className="text-white font-medium text-xs">{order.customerName}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{order.address}</p>
                          <p className="text-yellow-400/90 text-[11px] font-bold mt-1">Area: {order.area}</p>

                          {order.phone ? (
                            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2">
                              <a
                                href={`tel:${order.phone}`}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-yellow-400" />
                                <span>{order.phone}</span>
                              </a>
                              <a
                                href={`https://wa.me/91${order.phone.replace(/\D/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(order.customerName)},%20your%20Giriraj%20Power%20order%20${order.id}%20is%20dispatched!`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-green-900/60 hover:bg-green-800 text-green-200 font-bold text-[11px] flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3 text-green-400" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          ) : order.customerEmail ? (
                            <div className="text-slate-400 text-[11px] mt-1">
                              Email: {order.customerEmail}
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">
                            Ordered Items ({order.items.length})
                          </div>
                          <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-h-32 overflow-y-auto">
                            {order.items.map((i, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-200 truncate max-w-[200px]">
                                  {i.quantity}x {i.product.name}
                                </span>
                                <span className="font-bold text-white shrink-0">
                                  ₹{i.product.price * i.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Single Supplier Action Buttons */}
                      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSendOrderInvoiceEmail(order)}
                            disabled={sendingOrderEmailId === order.id}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Send invoice via Resend email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{sendingOrderEmailId === order.id ? 'Sending...' : 'Email Invoice (Resend)'}</span>
                          </button>
                          <a
                            href={getOrderWhatsAppUrl(order, '918777400280')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-green-950/80 hover:bg-green-900 border border-green-700/50 text-green-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Open pre-formatted order summary in WhatsApp for delivery runner"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                            <span>WhatsApp Dispatch</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'accepted')}
                              className="px-3.5 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Accept &amp; Start Packing</span>
                            </button>
                          )}

                          {isPacking && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch (Out for Delivery)</span>
                            </button>
                          )}

                          {isOut && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'delivered')}
                              className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Mark Order Delivered</span>
                            </button>
                          )}

                          {isDelivered && (
                            <span className="text-green-400 font-bold text-xs flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Order Completed</span>
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: RESEND INBOUND EMAILS & INBOX VIEW */}
        {activePortalTab === 'inbox' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left: Email List */}
            <div className="w-full md:w-1/2 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-950">
              
              <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Inbound Messages</span>
                  <span className="text-[11px] text-slate-400">({receivedEmails.length})</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSimulateInbound}
                    disabled={simulatingInbound}
                    className="px-2.5 py-1 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Simulate an incoming email arriving at team@girirajpower.in"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{simulatingInbound ? 'Receiving...' : 'Simulate Inbound'}</span>
                  </button>

                  <button
                    onClick={fetchInbox}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Refresh Inbox"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${inboxLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Webhook helper banner */}
              <div className="p-2.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span>Inbound Webhook: </span>
                  <code className="text-yellow-300 font-mono bg-slate-950 px-1 py-0.5 rounded">
                    /api/resend/inbound
                  </code>
                </div>
                <button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/api/resend/inbound`;
                    navigator.clipboard.writeText(fullUrl);
                    setWebhookCopied(true);
                    setTimeout(() => setWebhookCopied(false), 2000);
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {webhookCopied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{webhookCopied ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {receivedEmails.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold">No received messages yet</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Emails sent to <strong className="text-yellow-400">orders@oieldiakir.resend.app</strong> (or <strong className="text-slate-400">&lt;anything&gt;@oieldiakir.resend.app</strong>) or via store contact forms will appear here.
                    </p>
                  </div>
                ) : (
                  receivedEmails.map((email) => {
                    const isSelected = selectedEmail?.id === email.id;
                    const isUnread = email.status === 'unread';

                    return (
                      <div
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                        className={`p-3.5 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 border-l-4 border-yellow-400'
                            : isUnread
                            ? 'bg-slate-900/40 hover:bg-slate-900/70'
                            : 'hover:bg-slate-900/30 opacity-90'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                            )}
                            <span className={`text-xs truncate ${isUnread ? 'font-black text-white' : 'font-semibold text-slate-300'}`}>
                              {email.fromName || email.from}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              email.category === 'quote'
                                ? 'bg-amber-500/20 text-amber-300'
                                : email.category === 'contractor'
                                ? 'bg-blue-500/20 text-blue-300'
                                : email.category === 'support'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {email.category}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-100' : 'text-slate-400'}`}>
                          {email.subject}
                        </p>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {email.text}
                        </p>

                        {email.status === 'replied' && (
                          <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold mt-0.5">
                            <Reply className="w-2.5 h-2.5" />
                            <span>Replied via Resend</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Message Inspector & Reply Composer */}
            <div className="w-full md:w-1/2 flex flex-col bg-slate-900/60 overflow-hidden">
              {selectedEmail ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Top Bar */}
                  <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">
                        {selectedEmail.subject}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="text-yellow-400 font-semibold">{selectedEmail.fromName || 'Sender'}</span>
                        <span className="text-slate-400">({selectedEmail.from})</span>
                        {selectedEmail.phone && (
                          <span className="text-blue-400">📞 {selectedEmail.phone}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Delivered to: <strong className="text-slate-300">{selectedEmail.to}</strong> • {new Date(selectedEmail.receivedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteEmail(selectedEmail.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedEmail.text}
                    </div>

                    {/* Previous Reply if any */}
                    {selectedEmail.replySent && (
                      <div className="bg-green-950/40 border border-green-800/50 rounded-2xl p-4 text-xs space-y-1">
                        <div className="flex items-center justify-between text-green-300 font-bold text-[11px]">
                          <span className="flex items-center gap-1">
                            <Reply className="w-3 h-3" />
                            Official Reply Sent ({selectedEmail.replySent.subject})
                          </span>
                          <span>{new Date(selectedEmail.replySent.sentAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-green-100 whitespace-pre-wrap mt-2">{selectedEmail.replySent.text}</p>
                      </div>
                    )}

                    {replySuccessMessage && (
                      <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                        <span>{replySuccessMessage}</span>
                      </div>
                    )}

                    {/* Quick Resend Reply Box */}
                    <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Reply className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Reply via Resend (from {emailServiceStatus?.fromEmail || 'team@girirajpower.in'})</span>
                        </label>
                      </div>

                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Write reply to ${selectedEmail.from}...`}
                        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 resize-none"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="submit"
                          disabled={isReplying || !replyText.trim()}
                          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isReplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>{isReplying ? 'Sending via Resend...' : 'Dispatch Reply'}</span>
                        </button>
                      </div>
                    </form>

                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <Mail className="w-12 h-12 mb-3 opacity-30 text-yellow-400" />
                  <p className="text-sm font-bold text-slate-300">Select an email to view details</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Inbound inquiries received at <strong>team@girirajpower.in</strong> can be reviewed and replied to directly via the Resend API.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
