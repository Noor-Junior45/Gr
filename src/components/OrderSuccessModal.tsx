import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, Clock, MapPin, Phone, ArrowRight, ShieldCheck, Mail, Send, Check } from 'lucide-react';
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
            ? '✓ Invoice generated & delivery simulated via Resend!'
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
    { title: 'Order Received', desc: 'Sent to Single-Supplier Hub', done: true },
    { title: 'Packing Items', desc: 'Polycab/Schneider verified', done: order.status !== 'pending' },
    { title: 'Out for Delivery', desc: 'Express Rider Dispatched', done: order.status === 'out_for_delivery' || order.status === 'delivered' },
    { title: 'Delivered', desc: 'At your doorstep', done: order.status === 'delivered' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-9 h-9 text-green-600 animate-bounce" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-900 text-xs font-black uppercase tracking-wider mb-1">
            ⚡ Express Order Placed
          </span>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            Arriving in ~{minutes} Mins
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Order ID: <span className="text-slate-900 font-extrabold">{order.id}</span>
          </p>
        </div>

        {/* 60-Minute Countdown Clock Banner */}
        <div className="p-4 rounded-2xl bg-slate-950 text-white flex items-center justify-between gap-3 mb-6 shadow-md border border-yellow-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-yellow-300 font-extrabold">
                Live Delivery Timer
              </div>
              <div className="text-xl sm:text-2xl font-black tracking-tight font-mono text-white">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <span>Express Rider Active</span>
            </span>
            <div className="text-[10px] text-slate-400">
              {order.area}
            </div>
          </div>
        </div>

        {/* Resend Email Tax Invoice Card */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-yellow-200/80 mb-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-yellow-700" />
              <span className="text-xs font-bold text-slate-900">Email Tax Invoice (Resend)</span>
            </div>
            <span className="text-[10px] font-bold text-yellow-800 bg-yellow-200/60 px-2 py-0.5 rounded-full">
              Automated PDF &amp; HTML
            </span>
          </div>

          <form onSubmit={handleSendInvoiceEmail} className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter email to get tax invoice..."
              className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-slate-900 placeholder:text-slate-400 font-medium"
              required
            />
            <button
              type="submit"
              disabled={emailStatus === 'sending'}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-yellow-400 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {emailStatus === 'sending' ? (
                <span>Sending...</span>
              ) : emailStatus === 'sent' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span>Resend</span>
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
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {emailMessage}
            </div>
          )}
        </div>

        {/* Live Delivery Partner Card */}
        {order.deliveryPartner && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-sm">
                🛵
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">
                  {order.deliveryPartner.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {order.deliveryPartner.vehicleNumber} • {order.deliveryPartner.currentHub}
                </div>
              </div>
            </div>
            <a
              href={`tel:${order.deliveryPartner.phone}`}
              className="p-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
              title="Call Delivery Partner"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Live Progress Timeline */}
        <div className="mb-6 space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Order Status Tracking
          </div>
          <div className="space-y-2.5">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  step.done ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {step.done ? '✓' : idx + 1}
                </div>
                <div>
                  <div className={`text-xs font-bold ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 mb-6">
          <div className="flex justify-between font-semibold text-slate-600">
            <span>Delivering To:</span>
            <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{order.address}, {order.area}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-600">
            <span>Total Paid ({order.paymentMethod.toUpperCase()}):</span>
            <span className="font-black text-slate-950">₹{order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-600">
            <span>Items Count:</span>
            <span className="font-bold text-slate-900">{order.items.length} items</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onViewAllOrders();
            }}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View All Past Orders &amp; Invoices</span>
            <ArrowRight className="w-4 h-4" />
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

