import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Package, XCircle, ShoppingBag, CreditCard } from 'lucide-react';
import StatusTimeline, { type OrderStatus } from './StatusTimeline';
import { supabase } from '../../lib/supabase';
import { useOrderSimulation } from '../../context/OrderSimulationContext';
import {
  SIM_PREPARING_MS,
  SIM_ON_THE_WAY_MS,
  SIM_DELIVERED_MS,
} from '../../lib/simulationConfig';
import type { Order } from '../../types/database';
import { calculateBillingBreakdown } from '../../lib/billing';

/* ─── Fix Leaflet default icon paths broken by Vite ─────────── */
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ─── Coordinates ─────────────────────────────────────────────── */
const STORE_COORDS: [number, number] = [28.6315, 77.2167];
const USER_COORDS:  [number, number] = [28.6129, 77.2295];

/* ─── Custom icons ────────────────────────────────────────────── */
function makeIcon(emoji: string, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      width:36px;height:36px;display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,0.2);border:2px solid white;">
      <span style="transform:rotate(45deg);font-size:16px;line-height:1">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}
const storeIcon  = makeIcon('🏪', '#10b981');
const userIcon   = makeIcon('🏠', '#6366f1');
const driverIcon = makeIcon('🛵', '#f97316');

/* ─── Map auto-fit ────────────────────────────────────────────── */
function FitBounds() {
  const map = useMap();
  useEffect(() => { map.fitBounds([STORE_COORDS, USER_COORDS], { padding: [60, 60] }); }, [map]);
  return null;
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function getElapsed(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime();
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { cancelOrder } = useOrderSimulation();

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [driverPos, setDriverPos] = useState<[number, number]>(STORE_COORDS);
  const [status, setStatus] = useState<OrderStatus>(0);
  const [cancelling, setCancelling] = useState(false);

  /* Fast internal loop for smooth visual map marker updates */
  useEffect(() => {
    if (!order) return;
    if (order.status === 'delivered') {
      setStatus(3);
      setDriverPos(USER_COORDS);
      return;
    }
    if (order.status === 'cancelled') {
      setStatus(0);
      return;
    }

    const intervalId = setInterval(() => {
      const elapsed = getElapsed(order.created_at);
      
      let vis: OrderStatus = 0;
      if (elapsed >= SIM_PREPARING_MS)  vis = 1;
      if (elapsed >= SIM_ON_THE_WAY_MS) vis = 2;
      setStatus(vis);

      if (elapsed >= SIM_ON_THE_WAY_MS) {
        const travelElapsed = Math.max(0, elapsed - SIM_ON_THE_WAY_MS);
        const travelTotal   = SIM_DELIVERED_MS - SIM_ON_THE_WAY_MS;
        const progress      = Math.min(1, travelElapsed / travelTotal);
        
        setDriverPos(lerp(STORE_COORDS, USER_COORDS, progress));
        
        if (progress >= 1) {
          setStatus(3);
          setDriverPos(USER_COORDS);
          clearInterval(intervalId);
        }
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [order]);

  /* Fetch + realtime subscribe */
  useEffect(() => {
    if (!orderId) return;

    supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        if (data) {
          setOrder(data as Order);
        }
        setLoadingOrder(false);
      });

    // Realtime: pick up background simulation status changes
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  /* Cancel — updates Supabase + immediately reflects in local state (no realtime dependency) */
  const handleCancel = async () => {
    if (!orderId) return;
    setCancelling(true);
    await cancelOrder(orderId);
    // Update local state immediately — don't wait for realtime
    setOrder((prev) => prev ? { ...prev, status: 'cancelled' } : null);
    setCancelling(false);
  };

  // Cancel is only allowed during "preparing" phase (status 0 or 1)
  // status 2 = On the Way → too late to cancel
  const canCancel = status <= 1 && order?.status !== 'cancelled' && order?.status !== 'delivered';
  const isCancelled = order?.status === 'cancelled';
  const isDelivered = order?.status === 'delivered' || status === 3;
  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : '—';

  if (loadingOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-sm text-gray-400 font-mono">Order #{shortId}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full
            ${isCancelled ? 'bg-red-50 text-red-500' : isDelivered ? 'bg-brand/10 text-brand' : 'bg-amber-50 text-amber-600'}`}>
            <Package className="w-3.5 h-3.5" />
            {isCancelled ? 'Cancelled' : isDelivered ? 'Delivered!' : status >= 2 ? 'On the Way' : 'Preparing'}
          </div>

          {/* Cancel Button */}
          {!isCancelled && (
            <button
              onClick={canCancel ? handleCancel : undefined}
              disabled={!canCancel || cancelling}
              title={!canCancel ? "Cannot cancel once the order is on the way." : undefined}
              className={`flex items-center gap-1.5 border-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${
                canCancel 
                  ? "bg-white text-red-500 border-red-500 hover:bg-red-50 active:scale-95 shadow-sm" 
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Cancelled state */}
      {isCancelled && (
        <div className="bg-red-500 rounded-[32px] p-8 text-center mb-8 shadow-xl shadow-red-500/20 text-white">
          <div className="text-4xl mb-3">❌</div>
          <p className="font-black text-2xl tracking-tight">Order Cancelled</p>
          <p className="text-white/80 font-bold mt-2">Your order has been cancelled successfully.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-white text-red-600 px-8 py-3.5 rounded-full text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-md inline-block"
          >
            Back to Shopping
          </button>
        </div>
      )}

      {!isCancelled && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 420 }}>
              <MapContainer center={STORE_COORDS} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <FitBounds />
                <Polyline
                  positions={[STORE_COORDS, USER_COORDS]}
                  pathOptions={{ color: '#f97316', weight: 3, dashArray: '8 6', opacity: 0.6 }}
                />
                <Marker position={STORE_COORDS} icon={storeIcon} />
                <Marker position={USER_COORDS} icon={userIcon} />
                <Marker position={driverPos} icon={driverIcon} />
              </MapContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 px-1">
              {[{ emoji: '🏪', label: 'Store' }, { emoji: '🛵', label: 'Your rider' }, { emoji: '🏠', label: 'Your location' }].map(
                ({ emoji, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>{emoji}</span><span>{label}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Timeline + delivered card */}
          <div className="lg:col-span-2 space-y-4">
            <StatusTimeline currentStatus={status} />

            {isDelivered && (
              <div
                className="bg-[#00E676] rounded-[32px] p-8 text-black text-center shadow-xl shadow-[#00E676]/20"
                style={{ animation: 'scaleIn 300ms cubic-bezier(0.34,1.56,0.64,1)' }}
              >
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-black text-2xl tracking-tight">Delivered!</p>
                <p className="text-black/80 text-sm font-bold mt-2">Thank you for ordering with SwiftCart</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-6 w-full bg-black text-white py-3.5 rounded-full text-sm font-bold hover:bg-gray-800 active:scale-[0.97] transition-all shadow-lg"
                >
                  Continue Shopping
                </button>
              </div>
            )}

            {!isDelivered && (
              <p className="text-[11px] text-gray-300 text-center px-2 leading-relaxed">
                Delivery updates happen in the background — you can navigate away and we'll notify you when it arrives.
              </p>
            )}
          </div>
        </div>
      )}

      {!isCancelled && (
        <div className="mt-8 grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand" />
              Items Ordered
            </h3>
            <div className="divide-y divide-gray-50">
              {order?.cart_items?.map((item) => (
                <div key={item.id} className="py-3 flex justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand" />
              Billing Details
            </h3>
            {(() => {
              const subtotal = order?.cart_items?.reduce((acc: number, item) => acc + item.price * item.quantity, 0) || 0;
              const { platformFee, cgst, sgst, deliveryFee, grandTotal } = calculateBillingBreakdown(subtotal);
              return (
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
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900 text-lg">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
