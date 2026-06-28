import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ShoppingBag, MapPin, CreditCard, CheckCircle, ArrowLeft,
  Minus, Plus, Trash2, Loader2, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import PaymentPanel, { type PaymentMethod } from './PaymentPanel';
import { useOrderSimulation } from '../../context/OrderSimulationContext';
import { calculateBillingBreakdown } from '../../lib/billing';

type CheckoutStep = 'review' | 'payment' | 'placing' | 'success';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const { scheduleNewOrder } = useOrderSimulation();
  const [step, setStep] = useState<CheckoutStep>('review');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  if (!user) return <Navigate to="/login" replace />;
  if (items.length === 0 && step !== 'success') return <Navigate to="/" replace />;

  const { subtotal, platformFee, cgst, sgst, deliveryFee, grandTotal } = calculateBillingBreakdown(totalPrice);

  const handlePlaceOrder = async (paymentMethod: PaymentMethod) => {
    setStep('placing');
    setOrderError(null);

    const cartSnapshot = items.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      image_url: i.product.image_url,
    }));

    let newOrderId: string;
    try {
      const { data, error } = await supabase.rpc('process_checkout', {
        p_user_id: user.id,
        p_cart_items: cartSnapshot,
        p_total_amount: grandTotal
      });

      if (error) throw error;
      newOrderId = data;
    } catch (err: unknown) {
      console.error('Order error:', err);
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      }

      if (errorMessage.includes('Out of stock') || errorMessage.includes('Insufficient stock')) {
        setOrderError('Checkout failed: One or more items in your cart exceed available stock. Please adjust quantities.');
      } else {
        setOrderError('Something went wrong placing your order. Please try again.');
      }
      setStep('payment');
      return;
    }

    setOrderId(newOrderId);
    if (paymentMethod !== 'upi') {
      setStep('success');
    }
    clearCart();
    scheduleNewOrder({
      id: newOrderId,
      created_at: new Date().toISOString(),
      status: 'pending',
      total_amount: grandTotal,
      user_id: user.id,
      cart_items: [],
    } as import('../../types/database').Order);

    if (paymentMethod === 'upi') {
      navigate(`/order-tracking/${newOrderId}`, { replace: true });
    }
  };

  /* ── Success Modal ───────────────────────────────────────── */
  const successModal = step === 'success' && createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 200ms ease' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'scaleIn 250ms cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Top gradient bar */}
        <div className="h-2 w-full bg-[#00E676]" />

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-[#00E676]/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-[#00E676] rounded-full flex items-center justify-center shadow-xl shadow-[#00E676]/30">
              <CheckCircle className="w-12 h-12 text-black" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Order Placed! 🎉</h2>
          <p className="text-sm font-bold text-gray-500 mb-2">Your order is confirmed and being prepared.</p>
          {orderId && (
            <div className="inline-flex items-center gap-1.5 mt-2 mb-6 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-400">Order ID</span>
              <span className="text-xs font-mono font-bold text-gray-700">#{orderId.slice(0, 8).toUpperCase()}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 mb-6" />

          <div className="flex flex-col gap-3">
            {orderId && (
              <button
                id="track-order-btn"
                onClick={() => navigate(`/order-tracking/${orderId}`)}
                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-full text-sm active:scale-[0.98] transition-all duration-200 shadow-xl shadow-black/20"
              >
                🛵 Track My Order
              </button>
            )}
            <button
              id="continue-shopping-btn"
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 bg-white text-black border-2 border-gray-200 py-3.5 rounded-full text-sm font-bold hover:border-black active:scale-[0.97] transition-all duration-200"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.85) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>,
    document.body
  );

  return (
    <>
      {successModal}
      <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => {
            if (step === 'payment') setStep('review');
            else navigate(-1);
          }}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'payment' ? 'Payment' : 'Checkout'}
          </h1>
          <p className="text-sm text-gray-400">
            {step === 'payment'
              ? 'Step 2 of 2 — Secure payment'
              : `Step 1 of 2 — ${items.length} item${items.length > 1 ? 's' : ''} in your cart`}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors
          ${step === 'review' ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
          <span>1</span><span>Review</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors
          ${step === 'payment' || step === 'placing' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
          <span>2</span><span>Payment</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column — Review or Payment Panel */}
        <div className="lg:col-span-3 space-y-3">

          {step === 'review' && (
            <>
              {/* Delivery Info Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Delivering to</p>
                    <p className="text-xs text-gray-400">Home — 123 Main Street</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-brand" />
                    Your Items
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100">
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-brand font-bold">₹{product.price}</p>
                        {quantity >= product.stock && (
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">Max stock reached</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg">
                          <button
                            onClick={() =>
                              quantity === 1
                                ? removeItem(product.id)
                                : updateQuantity(product.id, quantity - 1)
                            }
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            {quantity === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-gray-500" />
                            )}
                          </button>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val < 1) return;
                              updateQuantity(product.id, val > product.stock ? product.stock : val);
                            }}
                            className="w-8 text-center text-sm font-bold text-gray-900 bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stock}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              quantity >= product.stock ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-200'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-gray-900 w-16 text-right">
                          ₹{(product.price * quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Payment Panel (step = 'payment' | 'placing') */}
          {(step === 'payment' || step === 'placing') && (
            <div className="space-y-3">
              {orderError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl">
                  <span className="text-base">⚠️</span>
                  {orderError}
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <PaymentPanel
                  grandTotal={grandTotal}
                  onConfirm={handlePlaceOrder}
                  isProcessing={step === 'placing'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Order Summary (always visible) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand" />
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Platform Fee</span>
                <span className="font-semibold text-gray-900">₹{platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>CGST (2.5%)</span>
                <span className="font-semibold text-gray-900">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>SGST (2.5%)</span>
                <span className="font-semibold text-gray-900">₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="font-semibold text-brand">FREE</span>
                ) : (
                  <span className="font-semibold text-gray-900">₹{deliveryFee.toFixed(2)}</span>
                )}
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-gray-400">
                  Add ₹{(500 - subtotal).toFixed(0)} more for free delivery
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900 text-lg">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA — only shown on review step */}
            {step === 'review' && (
              <button
                id="proceed-to-payment-btn"
                onClick={() => setStep('payment')}
                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-full text-sm active:scale-[0.98] transition-all duration-200 shadow-xl shadow-black/20"
              >
                Proceed to Payment
              </button>
            )}

            {step === 'placing' && (
              <div className="w-full flex items-center justify-center gap-2 bg-brand/60 text-white py-3.5 rounded-2xl text-sm font-bold cursor-not-allowed">
                <Loader2 className="w-5 h-5 animate-spin" />
                Placing Order…
              </div>
            )}

            <p className="text-[11px] text-gray-300 text-center leading-relaxed">
              By placing this order, you agree to our Terms & Conditions
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
