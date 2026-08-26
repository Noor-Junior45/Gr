import React, { useState } from 'react';
import { Package, MapPin, ChevronDown, ChevronUp, ShoppingBag, Phone, MessageSquare, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Order } from '../types';
import { getOrderWhatsAppUrl } from '../services/emailService';
import { deleteFirestoreOrder, clearAllUserOrders } from '../services/supabaseService';

interface OrderHistoryViewProps {
  orders: Order[];
  onOpenOrderModal?: (order: Order) => void;
  onOpenShop: () => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  onOpenShop
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleDeleteSingleOrder = async (order: Order) => {
    try {
      setDeletingOrderId(order.id);
      await deleteFirestoreOrder(order.id);
      setOrderToDelete(null);
    } catch (err) {
      console.error('Failed to delete order:', err);
      alert('Failed to delete the order. Please try again.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleClearAllOrders = async () => {
    try {
      setIsClearingAll(true);
      await clearAllUserOrders();
      setConfirmClearAll(false);
    } catch (err) {
      console.error('Failed to clear order history:', err);
      alert('Failed to clear order history. Please try again.');
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-xs text-slate-500">
            Track order status, delivery details, and manage your purchase history
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {orders.length > 0 && (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
              title="Delete all order history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
          <button
            onClick={onOpenShop}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
            No orders yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
            Your placed orders and delivery tracking will appear here.
          </p>

          <button
            onClick={onOpenShop}
            className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Browse Store
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const isDelivered = order.status === 'delivered';
            const isOutForDelivery = order.status === 'out_for_delivery';
            const isDeleting = deletingOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all overflow-hidden ${
                  isDeleting ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900">
                        #{order.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isOutForDelivery
                            ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {order.status === 'out_for_delivery' ? 'Out for Delivery' : order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-base font-black text-slate-950">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                    </div>
                  </div>
                </div>

                {/* Items preview */}
                <div className="py-3 text-xs space-y-1.5">
                  {order.items.slice(0, isExpanded ? order.items.length : 2).map((item, idx) => {
                    const color = item.selectedColor || item.product?.selectedColor;
                    return (
                      <div key={idx} className="flex items-center justify-between text-slate-700 bg-slate-50/80 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.product?.image && (
                            <img
                              src={item.product.image}
                              alt=""
                              className="w-7 h-7 object-contain bg-white rounded border border-slate-200 p-0.5 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-xs font-semibold text-slate-800">
                              {item.quantity}× {item.product?.name || 'Item'}
                            </span>
                            {color && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 w-fit mt-0.5">
                                🎨 Colour: {color}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0 ml-2">
                          ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                  {!isExpanded && order.items.length > 2 && (
                    <div className="text-[11px] text-slate-500 font-medium pl-1">
                      + {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="pt-3 pb-2 space-y-3 border-t border-slate-100 text-xs animate-in fade-in duration-200">
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 border border-slate-100">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>Delivery Address</span>
                      </div>
                      <div className="text-slate-600 pl-5 space-y-0.5">
                        <p className="font-semibold text-slate-800">{order.customerName} ({order.phone})</p>
                        <p>{order.address}</p>
                        {order.landmark && <p className="text-slate-500">Landmark: {order.landmark}</p>}
                        <p className="font-medium text-slate-700">{order.area}, Kolkata – {order.pincode}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={getOrderWhatsAppUrl(order, '918777400280')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Support</span>
                      </a>
                      <a
                        href="tel:+918777400280"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        <span>Call Store Dispatch</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[220px]">
                      {order.area} ({order.pincode})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrderToDelete(order)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title="Delete this order record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Delete Single Order */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete Order #{orderToDelete.id}?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete this order from your history? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={Boolean(deletingOrderId)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSingleOrder(orderToDelete)}
                disabled={Boolean(deletingOrderId)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {deletingOrderId === orderToDelete.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Order</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All Orders */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Clear All Order History?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will permanently remove all {orders.length} order record{orders.length > 1 ? 's' : ''} from your account history.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                disabled={isClearingAll}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllOrders}
                disabled={isClearingAll}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isClearingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Clear All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

