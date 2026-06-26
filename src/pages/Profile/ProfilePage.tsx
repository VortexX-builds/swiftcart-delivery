import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Package, Clock, ArrowLeft, LogOut, Wallet, Settings, MapPin, Phone, Navigation, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrderSimulation } from '../../context/OrderSimulationContext';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types/database';
import { SIM_ON_THE_WAY_MS, SIM_DELIVERED_MS } from '../../lib/simulationConfig';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const { cancelOrder, activeOrders, currentTick } = useOrderSimulation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    fetchOrders();
  }, [user, activeOrders]);

  async function fetchOrders() {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
  }

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    
    // Optimistic UI update
    setOrders((prev) => 
      prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o)
    );
    
    await cancelOrder(orderId);
    setCancellingId(null);
    fetchOrders(); // refresh list to guarantee accuracy
  };

  if (!user) return <Navigate to="/login" replace />;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDynamicStatus = (order: Order) => {
    if (order.status === 'delivered' || order.status === 'cancelled') return order.status;
    const elapsed = currentTick - new Date(order.created_at).getTime();
    if (elapsed >= SIM_DELIVERED_MS) return 'delivered';
    if (elapsed >= SIM_ON_THE_WAY_MS) return 'processing';
    return 'pending';
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-brand/10 text-brand';
      case 'processing': return 'bg-amber-50 text-amber-600';
      case 'cancelled':  return 'bg-red-50 text-red-400';
      default:           return 'bg-orange-50 text-orange-500';
    }
  };
  
  const statusLabel = (s: string) =>
    s === 'pending' ? 'Preparing' : s === 'processing' ? 'On the way' : s.charAt(0).toUpperCase() + s.slice(1);
    
  const isTrackable = (s: string) => s === 'pending' || s === 'processing';

  const processedOrders = orders.map(o => ({ ...o, dynamicStatus: getDynamicStatus(o) }));
  
  const displayedOrders = processedOrders.filter(o => {
    if (activeTab === 'active') return o.dynamicStatus === 'pending' || o.dynamicStatus === 'processing';
    return o.dynamicStatus === 'delivered' || o.dynamicStatus === 'cancelled';
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-black/10" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand/20">
                {(user?.email?.charAt(0) || 'U').toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-gray-900">
                {profile?.full_name || user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3.5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">Phone</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{profile?.phone || 'Not provided'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">Address</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{profile?.address || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-brand to-emerald-500 rounded-2xl border border-transparent p-6 mb-6 text-white shadow-lg shadow-brand/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-50">
            <Wallet className="w-5 h-5" />
            <h2 className="font-medium">SwiftCart Wallet</h2>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-emerald-100 mb-1">Available Balance</p>
            <p className="text-3xl font-bold">₹{profile?.wallet_balance || 0}</p>
          </div>
          <button 
            onClick={() => alert('Add Funds modal would open here (MVP mock)')}
            className="bg-white text-brand px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors active:scale-95"
          >
            + Add Funds
          </button>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            Order History
          </h2>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'past' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No {activeTab} orders</p>
            <p className="text-sm text-gray-300 mt-1">Your {activeTab} orders will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayedOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-300">#{order.id.slice(0, 8)}</span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColor(order.dynamicStatus)}`}>
                      {statusLabel(order.dynamicStatus)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">₹{order.total_amount}</span>
                    {isTrackable(order.dynamicStatus) && (
                      <button
                        onClick={() => navigate(`/order-tracking/${order.id}`)}
                        className="flex items-center gap-1 bg-brand text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-brand-dark active:scale-95 transition-all shadow-sm shadow-brand/20"
                      >
                        <Navigation className="w-3 h-3" />
                        Track
                      </button>
                    )}
                    {order.dynamicStatus !== 'cancelled' && (
                      <button
                        onClick={order.dynamicStatus === 'pending' ? () => handleCancel(order.id) : undefined}
                        disabled={order.dynamicStatus !== 'pending' || cancellingId === order.id}
                        title={order.dynamicStatus !== 'pending' ? "Cannot cancel once the order is on the way." : undefined}
                        className={`flex items-center gap-1 border text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                          order.dynamicStatus === 'pending'
                            ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100 active:scale-95"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <XCircle className="w-3 h-3" />
                        {cancellingId === order.id ? '…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  <span>·</span>
                  <span>
                    {Array.isArray(order.cart_items) ? order.cart_items.length : 0} item
                    {Array.isArray(order.cart_items) && order.cart_items.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
