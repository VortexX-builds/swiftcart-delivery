import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Orders', path: '/admin/orders', icon: LayoutDashboard },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black flex text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 bg-black flex flex-col border-r border-zinc-900">
        <div className="h-16 flex items-center px-6 border-b border-zinc-900">
          <span className="text-xl font-bold tracking-tight text-zinc-100">SwiftCart Admin</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-accent text-white'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-900">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-black border-b border-zinc-900 flex items-center px-8 text-zinc-100">
          <h1 className="text-xl font-semibold text-zinc-100">
            {navItems.find(item => item.path === location.pathname)?.name || 'Admin Dashboard'}
          </h1>
        </header>
        <div className="flex-1 overflow-auto p-8 bg-black">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
