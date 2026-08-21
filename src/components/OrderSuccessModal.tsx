import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Zap,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Mail,
  Send,
  Check,
  Copy,
  Package,
  Truck,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { sendOrderConfirmationEmail } from '../services/emailService';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onViewAllOrders: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onViewAllOrders
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [emailInput, setEmailInput] = useState(() => order?.customerEmail || localStorage.getItem('giriraj_user_email') || '');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [showItemsList, setShowItemsList] = useState(false);

  useEffect(() => {
    if (!order) return;
    if (order.customerEmail) {
      setEmailInput(order.customerEmail);
    }
    const diffSeconds = Math.max(0, Math.floor((order.estimatedDeliveryTimestamp - Date.now()) / 1000));
    setSecondsRemaining(diffSeconds > 0 ? diffSeconds : 2700);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const handleCopyOrderId = () => {
    if (!order?.id) return;
    navigator.clipboard.writeText(order.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendInvoiceEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !emailInput.trim()) return;

    setEmailStatus('sending');
    setEmailMessage('');

    try {
      const result = await sendOrderConfirmationEmail(order, emailInput.trim());
      if (result.success) {
        setEmailStatus('sent');
        setEmailMessage(
          result.simulated
            ? '✓ Invoice generated & sent via Resend!'
            : '✓ Tax invoice email sent successfully via Resend!'
        );
      } else {
        setEmailStatus('error');
        setEmailMessage(result.message || 'Failed to send email. Please verify the address.');
      }
    } catch (err: any) {
      setEmailStatus('error');
      setEmailMessage(err.message || 'Network error while sending email.');
    }
  };

  if (!order) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const steps = [
    { title: 'Order Confirmed', desc: 'Verified & sent to single-source hub', done: true, time: 'Just now' },
    { title: 'Packing & Quality Check', desc: 'Genuine materials verified', done: order.status !== 'pending', time: 'In progress' },
    { title: 'Out for Delivery', desc: 'Express dispatcher en route', done: order.status === 'out_for_delivery' || order.status === 'delivered', time: `ETA ~${minutes}m` },
    { title: 'Doorstep Handover', desc: 'Delivery at your designated location', done: order.status === 'delivered', time: 'Pending' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 relative max-h-[92vh] overflow-y-auto flex flex-col font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Celebration Header */}
        <div className="text-center pt-2 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
            <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Order Placed Successfully</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Thank you for your order!
          </h2>

          {/* Order ID & Copy badge */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Order ID:</span>
            <button
              onClick={handleCopyOrderId}
              className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
              title="Copy Order ID"
            >
              <span>{order.id}</span>
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Live Delivery Countdown Banner */}
        <div className="p-4 rounded-2xl bg-slate-950 text-white flex items-center justify-between gap-3 mb-4 shadow-sm border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-black">
                Estimated Delivery
              </div>
              <div className="text-2xl font-black tracking-tight font-mono text-white">
                ~{minutes} <span className="text-xs font-sans font-bold text-slate-400 uppercase">Mins</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Express Active</span>
            </span>
            <div className="text-[11px] text-slate-400 font-semibold mt-1">
              {order.area}
            </div>
          </div>
        </div>

        {/* Order Progress Steps */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 mb-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-600" />
            <span>Order Progress Tracking</span>
          </h3>
          <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 relative z-10">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black transition-colors ${
                    step.done
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {step.done ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <div>
                    <div className={`text-xs font-bold ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.title}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      {step.desc}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    {step.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address & Payment Summary */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs text-xs space-y-2 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Deliver to:</span>
            </div>
            <span className="font-bold text-slate-900 text-right truncate max-w-[240px]">
              {order.address}, {order.area} ({order.pincode})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Payment:</span>
            </div>
            <span className="font-black text-slate-900 uppercase bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()} (₹{order.totalAmount.toLocaleString('en-IN')})
            </span>
          </div>

          {/* Toggle Items Preview */}
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowItemsList(!showItemsList)}
              className="w-full flex items-center justify-between py-1 text-slate-700 font-bold hover:text-slate-900 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                <span>{order.items.reduce((s, i) => s + i.quantity, 0)} Items Ordered</span>
              </span>
              {showItemsList ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {showItemsList && (
              <div className="mt-2 space-y-2 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <img
                        src={item.product.image || 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=100&auto=format&fit=crop'}
                        alt={item.product.name}
                        className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-100 p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                        <p className="text-slate-400">Qty: {item.quantity}{item.selectedColor ? ` • ${item.selectedColor}` : ''}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₹{(Number(item.product.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resend Email Tax Invoice Card */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-slate-900">Email Tax Invoice</span>
            </div>
            <span className="text-[10px] font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
              Automated PDF
            </span>
          </div>

          <form onSubmit={handleSendInvoiceEmail} className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter email to get tax invoice..."
              className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 placeholder:text-slate-400 font-medium"
              required
            />
            <button
              type="submit"
              disabled={emailStatus === 'sending'}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {emailStatus === 'sending' ? (
                <span>Sending...</span>
              ) : emailStatus === 'sent' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sent</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>

          {emailMessage && (
            <div
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
                emailStatus === 'sent'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {emailMessage}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onViewAllOrders();
            }}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View All Past Orders &amp; Invoices</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};


