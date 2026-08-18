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
  Send
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { subscribeToOrders, updateOrderStatusInFirestore } from '../services/firebaseConfig';
import { soundService } from '../services/sound';
import { getEmailServiceStatus, sendOrderConfirmationEmail, sendTestEmail, EmailServiceStatus } from '../services/emailService';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'out_for_delivery' | 'delivered'>('all');
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  const [emailServiceStatus, setEmailServiceStatus] = useState<EmailServiceStatus | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('manager@girirajpower.com');
  const [testSending, setTestSending] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [sendingOrderEmailId, setSendingOrderEmailId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getEmailServiceStatus().then(setEmailServiceStatus).catch(console.warn);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
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
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  Single-Supplier Dispatch &amp; Order Command
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-extrabold uppercase animate-pulse">
                  Live Firestore Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kolkata Central Hub • Real-time notifications for every customer order
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            {/* Test Alarm Sound */}
            <button
              onClick={handleTestChime}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Test Chime 🔔
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

        {/* Resend Email Gateway Management Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-black text-xs shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Resend Email Gateway:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  emailServiceStatus?.configured
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                }`}>
                  {emailServiceStatus?.configured ? '⚡ Live API Active' : '⚙️ Ready (RESEND_API_KEY)'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Sender: {emailServiceStatus?.fromEmail || 'Giriraj Power <onboarding@resend.dev>'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSendTestEmail} className="flex items-center gap-2">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="Test recipient email..."
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              disabled={testSending}
              className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {testSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Test Email</span>
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
              const isPacking = order.status === 'accepted' || order.status === 'packing';
              const isOut = order.status === 'out_for_delivery';
              const isDelivered = order.status === 'delivered';

              return (
                <div
                  key={order.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-slate-900 border-yellow-400 shadow-lg ring-1 ring-yellow-400/30'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-yellow-400">
                        {order.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isPending ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        isPacking ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        isOut ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-300">
                      Amount: <span className="text-white text-sm font-black">₹{order.totalAmount.toLocaleString('en-IN')}</span> ({order.paymentMethod.toUpperCase()})
                    </div>
                  </div>

                  {/* Customer Details & Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 text-xs">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Customer &amp; Location
                      </div>
                      <div className="text-white font-bold text-sm mb-0.5">{order.customerName}</div>
                      <div className="text-slate-300 flex items-center gap-1 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        <span>{order.address}, {order.area} (PIN: {order.pincode})</span>
                      </div>
                      {order.landmark && (
                        <div className="text-slate-400 text-[11px]">Landmark: {order.landmark}</div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <a
                          href={`tel:${order.phone}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-green-400" />
                          <span>Call: {order.phone}</span>
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

      </div>
    </div>
  );
};
