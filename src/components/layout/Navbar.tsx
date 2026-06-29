import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar({ onCartClick }: { onCartClick: () => void }) {
  const { session, profile, signOut } = useAuth();
  const user = session?.user;
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className={`sticky top-0 z-50 border-b ${isAdmin ? 'bg-black border-zinc-900 text-zinc-100' : 'bg-white/60 backdrop-blur-2xl border-gray-200/50 shadow-[0_4px_30px_rgb(0,0,0,0.03)]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-md shadow-brand/25 group-hover:shadow-lg group-hover:shadow-brand/30 transition-all duration-300">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className={`text-xl font-bold tracking-tight ${isAdmin ? 'text-zinc-100' : 'text-gray-900'}`}>
              swift<span className="text-brand">cart</span>
            </span>
          </Link>

          {/* Delivery banner — desktop only */}
          {!isAdmin && (
            <div className="hidden md:flex items-center gap-2 bg-green-50 px-4 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-sm font-medium text-brand-dark">Delivery in 10 minutes</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              id="cart-button"
              onClick={onCartClick}
              className="relative flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-800 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-black/30"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <>
                  <span className="hidden sm:inline">
                    {totalItems} item{totalItems > 1 ? 's' : ''}
                  </span>
                  <span className="sm:hidden absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-[11px] font-bold text-gray-900 rounded-full flex items-center justify-center animate-[bounce-in_0.3s_ease-out]">
                    {totalItems}
                  </span>
                </>
              )}
              {totalItems === 0 && <span className="hidden sm:inline">Cart</span>}
            </button>

            {/* Auth Actions */}
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-menu-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${isAdmin ? 'text-zinc-300 hover:bg-zinc-900' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-7 h-7 rounded-full object-cover shadow-sm border border-gray-100" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white text-xs font-bold shadow-sm border border-gray-100">
                      {(user?.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdmin ? 'text-zinc-500' : 'text-gray-400'} ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 py-2 animate-[fade-in-down_0.15s_ease-out]">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                      <p className="text-sm text-gray-900 font-semibold truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      My Orders
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold active:scale-[0.97] transition-all duration-300 ${isAdmin ? 'text-zinc-300 hover:bg-zinc-900' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
