import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Order, InventoryProduct } from '../../types/database';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  IndianRupee, ShoppingCart, TrendingUp, AlertTriangle,
  Check, X, Pencil, Clock, Package, Activity,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface KPIData {
  totalRevenue: number;
  totalOrders: number;
  fulfillmentRate: number;
  problematicOrders: number;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const PIE_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'delivered': return <Check className="w-4 h-4 text-green-500" />;
    case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
    case 'processing': return <Package className="w-4 h-4 text-blue-500" />;
    case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
    default: return <Activity className="w-4 h-4 text-gray-400" />;
  }
};

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnalyticsDashboard() {
  // ── KPI State ───────────────────────────────────────────────────────────────
  const [kpis, setKpis] = useState<KPIData>({ totalRevenue: 0, totalOrders: 0, fulfillmentRate: 0, problematicOrders: 0 });
  const [kpiLoading, setKpiLoading] = useState(true);

  // ── Chart State ─────────────────────────────────────────────────────────────
  const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
  const [statusDist, setStatusDist] = useState<StatusSlice[]>([]);

  // ── Inventory State ─────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  // ── Activity Feed State ─────────────────────────────────────────────────────
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // ── Fetch All Data ──────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      setKpiLoading(true);

      // 1. Fetch ALL orders for KPI + chart calculations
      const { data: orders, error: ordErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordErr) throw ordErr;
      const allOrders: Order[] = orders || [];

      // ── KPIs ──────────────────────────────────────────────────────────────
      const delivered = allOrders.filter(o => o.status === 'delivered');
      const problematic = allOrders.filter(o => o.status === 'cancelled');
      const totalRevenue = delivered.reduce((sum, o) => sum + o.total_amount, 0);
      const fulfillmentRate = allOrders.length > 0
        ? (delivered.length / allOrders.length) * 100
        : 0;

      setKpis({
        totalRevenue,
        totalOrders: allOrders.length,
        fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
        problematicOrders: problematic.length,
      });

      // ── Revenue Over Time (group by date) ─────────────────────────────────
      const revenueMap = new Map<string, number>();
      delivered.forEach(o => {
        const day = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        revenueMap.set(day, (revenueMap.get(day) || 0) + o.total_amount);
      });
      // Show most recent 7 data points, chronological
      const revenueArr = Array.from(revenueMap, ([date, revenue]) => ({ date, revenue }));
      setRevenueSeries(revenueArr.slice(-7));

      // ── Order Status Distribution ─────────────────────────────────────────
      const counts: Record<string, number> = { Pending: 0, Processing: 0, Delivered: 0, Cancelled: 0 };
      allOrders.forEach(o => {
        if (o.status === 'pending') counts.Pending++;
        else if (o.status === 'processing') counts.Processing++;
        else if (o.status === 'delivered') counts.Delivered++;
        else if (o.status === 'cancelled') counts.Cancelled++;
      });
      setStatusDist(
        Object.entries(counts)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value, color: PIE_COLORS[name] }))
      );

      // ── Activity Feed (10 most recent) ────────────────────────────────────
      setRecentOrders(allOrders.slice(0, 10));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setKpiLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      setInvLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock, price, category')
        .order('stock', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error('Inventory fetch error:', err);
      toast.error('Failed to load inventory');
    } finally {
      setInvLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchInventory();
  }, [fetchDashboardData, fetchInventory]);

  // ── Inline Edit Handlers ────────────────────────────────────────────────────
  const startEdit = (product: InventoryProduct) => {
    setEditingId(product.id);
    setEditValue(product.stock);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const saveStock = async (productId: string) => {
    if (editValue < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    setSavingId(productId);

    // Optimistic update
    const prevInventory = [...inventory];
    setInventory(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: editValue } : p))
    );
    setEditingId(null);

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: editValue })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Stock updated successfully');
    } catch (err) {
      console.error('Stock update error:', err);
      toast.error('Failed to update stock — reverted');
      setInventory(prevInventory); // rollback
    } finally {
      setSavingId(null);
    }
  };

  // ── Stock row styling ───────────────────────────────────────────────────────
  const stockRowClass = (stock: number) => {
    if (stock === 0) return 'bg-red-900/20 border-l-4 border-l-red-500';
    if (stock < 10) return 'bg-amber-900/20 border-l-4 border-l-amber-500';
    return '';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          icon={<IndianRupee className="w-6 h-6" />}
          color="emerald"
          loading={kpiLoading}
        />
        <KPICard
          title="Total Orders"
          value={kpis.totalOrders.toLocaleString('en-IN')}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="blue"
          loading={kpiLoading}
        />
        <KPICard
          title="Fulfillment Rate"
          value={`${kpis.fulfillmentRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="violet"
          loading={kpiLoading}
        />
        <KPICard
          title="Problematic Orders"
          value={kpis.problematicOrders.toLocaleString('en-IN')}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          loading={kpiLoading}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart (spans 2 cols) */}
        <div className="lg:col-span-2 bg-brand-surface rounded-xl border border-zinc-800 p-5">
          <h3 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Revenue Over Time</h3>
          {revenueSeries.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">No revenue data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#e4e4e7' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#18181b' }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#18181b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Pie Chart */}
        <div className="bg-brand-surface rounded-xl border border-zinc-800 p-5">
          <h3 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Order Distribution</h3>
          {statusDist.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">No order data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDist}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {statusDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} orders`, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#e4e4e7' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#a1a1aa' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Inventory + Activity Feed ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Inventory Table (2 cols) */}
        <div className="xl:col-span-2 bg-brand-surface rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Inventory Management</h3>
            <button
              onClick={fetchInventory}
              className="text-xs px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors font-medium text-zinc-300"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {invLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-5 h-5 border-2 border-zinc-700 border-t-brand-accent rounded-full animate-spin" />
                        <span>Loading inventory…</span>
                      </div>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                      No products found. Run the seed migration to add sample data.
                    </td>
                  </tr>
                ) : (
                  inventory.map(product => (
                    <tr key={product.id} className={`hover:bg-zinc-800/50 transition-colors ${stockRowClass(product.stock)}`}>
                      <td className="px-5 py-3 text-sm font-medium text-zinc-100">{product.name}</td>
                      <td className="px-5 py-3 text-sm text-zinc-400 font-mono">{product.sku || '—'}</td>
                      <td className="px-5 py-3 text-sm text-zinc-400 capitalize">{product.category.replace('_', ' ')}</td>
                      <td className="px-5 py-3 text-sm text-zinc-300">{formatCurrency(product.price)}</td>

                      {/* Inline-editable stock cell */}
                      <td className="px-5 py-3 text-sm">
                        {editingId === product.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={editValue}
                              onChange={e => setEditValue(Math.max(0, parseInt(e.target.value) || 0))}
                              autoFocus
                              className="w-20 px-2 py-1 border border-zinc-600 rounded-md text-sm bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveStock(product.id);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                            <button
                              onClick={() => saveStock(product.id)}
                              className="p-1 rounded hover:bg-emerald-900/40 text-emerald-400 transition-colors"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded hover:bg-red-900/40 text-red-400 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`font-semibold ${
                              product.stock === 0
                                ? 'text-red-400'
                                : product.stock < 10
                                  ? 'text-amber-400'
                                  : 'text-zinc-100'
                            }`}
                          >
                            {savingId === product.id ? (
                              <span className="inline-flex items-center gap-1 text-zinc-500">
                                <div className="w-3 h-3 border-2 border-zinc-600 border-t-brand-accent rounded-full animate-spin" />
                                Saving…
                              </span>
                            ) : (
                              product.stock
                            )}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3 text-sm text-right">
                        {editingId !== product.id && (
                          <button
                            onClick={() => startEdit(product)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-accent hover:text-emerald-400 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed (1 col) */}
        <div className="bg-brand-surface rounded-xl border border-zinc-800 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-zinc-800">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-500 text-sm">No recent activity</div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="px-5 py-3 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-zinc-800 rounded-lg">
                      {statusIcon(order.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        <span className="capitalize">{order.status === 'processing' ? 'on the way' : order.status}</span>
                        {' · '}
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-500 whitespace-nowrap mt-0.5">
                      {relativeTime(order.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'violet' | 'red';
  loading?: boolean;
}

const colorMap = {
  emerald: { icon: 'bg-emerald-500/20 text-emerald-400', text: 'text-emerald-400' },
  blue:    { icon: 'bg-blue-500/20 text-blue-400',       text: 'text-blue-400'    },
  violet:  { icon: 'bg-violet-500/20 text-violet-400',   text: 'text-violet-400'  },
  red:     { icon: 'bg-red-500/20 text-red-400',         text: 'text-red-400'     },
};

function KPICard({ title, value, icon, color, loading }: KPICardProps) {
  const c = colorMap[color];
  return (
    <div className="rounded-xl border border-zinc-800 bg-brand-surface p-5 flex items-center gap-4 transition-colors hover:border-zinc-700">
      <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</p>
        {loading ? (
          <div className="h-7 w-24 bg-zinc-800 rounded animate-pulse mt-1" />
        ) : (
          <p className={`text-2xl font-bold ${c.text} mt-0.5`}>{value}</p>
        )}
      </div>
    </div>
  );
}
