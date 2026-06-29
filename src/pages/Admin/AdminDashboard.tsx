import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types/database';
import { Search, Filter } from 'lucide-react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply Status Filter
      if (statusFilter !== 'All') {
        let dbStatus = statusFilter.toLowerCase();
        if (dbStatus === 'on the way') dbStatus = 'processing';
        query = query.eq('status', dbStatus);
      }

      // Apply Search Filter (UUID robust approach)
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.trim();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(term)) {
          // Exact match for full UUIDs (Fastest and safest)
          query = query.or(`id.eq.${term},user_id.eq.${term}`);
        } else {
          // Partial match via text cast for robust UUID search via client
          query = query.or(`id::text.ilike.%${term}%,user_id::text.ilike.%${term}%`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleManageClick = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Optimistically update local React state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id ? { ...order, status: newStatus as Order['status'] } : order
        )
      );

      setIsModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50';
      case 'pending': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50';
      case 'processing': return 'bg-blue-900/30 text-blue-400 border border-blue-800/50';
      case 'cancelled': return 'bg-red-900/30 text-red-400 border border-red-800/50';
      default: return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  return (
    <div className="bg-brand-surface rounded-xl border border-slate-800 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-brand-surface">
        <h2 className="text-lg font-semibold text-slate-100 whitespace-nowrap">Recent Orders</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search Order or Customer ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg leading-5 bg-brand-dark text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-500" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-slate-700 rounded-lg leading-5 bg-brand-dark text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">On the Way</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <button 
            onClick={fetchOrders}
            className="w-full sm:w-auto text-sm px-4 py-2 bg-brand-surface border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors font-medium text-slate-200 whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Customer ID</th>
              <th className="px-6 py-4 font-medium">Total Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  <div className="flex justify-center items-center gap-2">
                     <div className="w-5 h-5 border-2 border-slate-700 border-t-brand-accent rounded-full animate-spin" />
                     <span>Loading orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  No orders found matching your filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-100 font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                    {order.user_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-100">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status === 'processing' ? 'on the way' : order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button 
                      onClick={() => handleManageClick(order)}
                      className="text-brand-accent hover:text-emerald-400 font-medium transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manage Order Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-brand-surface rounded-xl border border-slate-800 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              Manage Order Status
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Order ID
              </label>
              <div className="text-sm text-slate-400 font-mono bg-brand-dark p-2 rounded border border-slate-700">
                {selectedOrder.id}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-700 rounded-lg leading-5 bg-brand-dark text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors"
                disabled={isUpdating}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing (On the Way)</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedOrder(null);
                }}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-brand-surface border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-accent rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
