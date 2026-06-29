import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Truck, Shield, ChevronRight, Navigation, X, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrderSimulation } from '../../context/OrderSimulationContext';
import { SIM_DELIVERED_MS } from '../../lib/simulationConfig';
import type { Product, Order } from '../../types/database';
import ProductCard from '../../components/shared/ProductCard';

// Categories are now dynamically derived from the database products

const HERO_FEATURES = [
  { icon: Clock, label: 'Delivery in 10 min' },
  { icon: Truck, label: 'Free delivery above ₹199' },
  { icon: Shield, label: '100% quality assured' },
];

export default function HomePage() {
  const { cancelOrder, activeOrders, currentTick } = useOrderSimulation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Derive unique categories dynamically from the fetched product data
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()];
  const [searchQuery, setSearchQuery] = useState('');
  const activeOrder = activeOrders.length > 0 ? activeOrders[0] : null;
  const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);
  const [cancellingBanner, setCancellingBanner] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true });

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);



  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBannerCancel = async () => {
    if (!activeOrder) return;
    setCancellingBanner(true);
    await cancelOrder(activeOrder.id);
    setCancellingBanner(false);
  };

  const getDynamicStatus = (order: Order | null) => {
    if (!order) return null;
    if (order.status === 'cancelled' || order.status === 'delivered') return order.status;
    const elapsed = currentTick - new Date(order.created_at).getTime();
    if (elapsed >= SIM_DELIVERED_MS) return 'delivered';
    return order.status; // pending or processing
  };

  const dynamicStatus = getDynamicStatus(activeOrder);
  const showBanner = activeOrder && dynamicStatus !== 'delivered' && dynamicStatus !== 'cancelled' && activeOrder.id !== dismissedOrderId;

  // Cancel is only available while the order is in preparing phase (< 25s)
  const bannerCanCancel = activeOrder?.status === 'pending' &&
    currentTick - new Date(activeOrder.created_at).getTime() < 25_000;

  // Group products by category for "All" view
  const groupedProducts = categories.slice(1).reduce(
    (acc, cat) => {
      const matching = filteredProducts.filter((p) => p.category === cat);
      if (matching.length > 0) acc[cat] = matching;
      return acc;
    },
    {} as Record<string, Product[]>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

      {/* Active Order Banner — shown for pending/processing orders, dismissable per-order */}
      {showBanner && activeOrder && (
        <div
          className="mt-4 mb-2 flex flex-wrap items-center gap-4 bg-gradient-to-r from-brand to-emerald-500 text-white px-5 py-4 rounded-2xl shadow-lg shadow-brand/25"
          style={{ animation: 'slideDown 300ms ease' }}
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
            🛵
          </div>
          <div className="flex-1 min-w-[200px] flex-grow">
            <p className="text-sm font-bold">Your order is on the way!</p>
            <p className="text-xs text-white/75 font-mono truncate">
              Order #{activeOrder.id.slice(0, 8).toUpperCase()} · ₹{activeOrder.total_amount}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => navigate(`/order-tracking/${activeOrder.id}`)}
              className="flex items-center gap-1.5 bg-white text-brand text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-white/90 active:scale-95 transition-all flex-shrink-0 whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5" />
              Track
            </button>
            {bannerCanCancel && (
              <button
                onClick={handleBannerCancel}
                disabled={cancellingBanner}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex-shrink-0 disabled:opacity-50 whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5" />
                {cancellingBanner ? '…' : 'Cancel'}
              </button>
            )}
            <button
              onClick={() => setDismissedOrderId(activeOrder.id)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="py-6 sm:py-8">
        <div className="relative overflow-hidden rounded-[40px] bg-[#FFC107] p-6 sm:p-8 md:p-14 shadow-xl shadow-[#FFC107]/20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-bold px-4 py-2 rounded-full mb-6 shadow-md hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
              Now delivering near you
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-black leading-[1.1] max-w-2xl tracking-tighter text-balance">
              Groceries delivered in <br className="hidden sm:block" /><span className="text-white drop-shadow-md">10 minutes.</span>
            </h1>
            <p className="text-black/80 mt-6 text-lg sm:text-xl max-w-md font-bold leading-relaxed">
              Fresh fruits, daily essentials, and snacks — at your doorstep before you know it.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-10">
              {HERO_FEATURES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 bg-white/40 backdrop-blur-md border border-white/50 px-5 py-3 rounded-2xl text-sm font-bold text-black shadow-sm hover:bg-white/60 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search + Category Filters */}
      <section className="sticky top-16 z-40 bg-[#FAFAFA] pt-2 pb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="product-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-[52px] pr-5 py-4 rounded-[20px] border-2 border-gray-100 bg-white text-base font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-black transition-all duration-300 shadow-sm hover:border-gray-200"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-[20px] text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-black text-white shadow-xl shadow-black/20 scale-105'
                    : 'bg-white text-gray-500 border-2 border-gray-100 hover:border-gray-200 hover:text-black shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="mt-2">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg font-medium">No products found</p>
            <p className="text-gray-300 text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : activeCategory !== 'All' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                  <button
                    onClick={() => setActiveCategory(category)}
                    className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                  >
                    See all
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {categoryProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
