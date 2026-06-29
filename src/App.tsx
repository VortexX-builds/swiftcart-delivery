import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderSimulationProvider } from './context/OrderSimulationContext';
import { Toaster } from 'sonner';
import { Zap } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import CartDrawer from './components/shared/CartDrawer';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { useMaintenance } from './hooks/useMaintenance';

// ── Lazy-loaded consumer routes ───────────────────────────────────────────────
// Each gets its own async chunk. None of these will ever pull in Recharts or
// admin-only code — that is guaranteed by the separate admin chunk group below.
const HomePage          = lazy(() => import('./pages/Home/HomePage'));
const LoginPage         = lazy(() => import('./pages/Auth/LoginPage'));
const SignupPage        = lazy(() => import('./pages/Auth/SignupPage'));
const CheckoutPage      = lazy(() => import('./pages/Checkout/CheckoutPage'));
const ProfilePage       = lazy(() => import('./pages/Profile/ProfilePage'));
const ProfileSetupPage  = lazy(() => import('./pages/Profile/ProfileSetupPage'));
const SettingsPage      = lazy(() => import('./pages/Profile/SettingsPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTracking/OrderTrackingPage'));
const MockUpiPage       = lazy(() => import('./pages/MockUpiPage'));
const MaintenanceView   = lazy(() => import('./pages/Maintenance/MaintenanceView'));

// ── Lazy-loaded admin routes (isolated chunk group) ───────────────────────────
// Recharts (vendor-charts chunk) is ONLY referenced here. A consumer visiting
// /checkout will never download it.
const AdminLayout        = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard     = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminUsers         = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminSettings      = lazy(() => import('./pages/Admin/AdminSettings'));
const AnalyticsDashboard = lazy(() => import('./pages/Admin/AnalyticsDashboard'));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/25 animate-pulse">
        <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
      </div>
      <div className="w-6 h-6 border-2 border-slate-200 border-t-brand rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppLayout() {
  const { user, profile, loading } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();

  // ── Maintenance mode check ─────────────────────────────────────────────
  const { isMaintenanceMode, isCheckingMaintenance } = useMaintenance();

  if (loading || isCheckingMaintenance) return <LoadingScreen />;

  // Block all non-admin routes when maintenance mode is enabled.
  // Admin routes are deliberately excluded so admins can always
  // log in and disable maintenance mode without being locked out.
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isMaintenanceMode && !isAdminRoute) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <MaintenanceView />
      </Suspense>
    );
  }

  // Profile completion check
  const isProfileIncomplete = user && profile && (!profile.full_name || !profile.phone || !profile.address);
  
  if (isProfileIncomplete && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  // Also prevent accessing /profile-setup if profile is complete or not logged in
  if (!isProfileIncomplete && location.pathname === '/profile-setup') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-brand/20 selection:text-brand-dark">
      <Navbar onCartClick={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <Toaster position="top-center" richColors />

      <main>
        {/* Single Suspense boundary for the entire route tree.
            LoadingScreen is shown while any lazy chunk is being fetched. */}
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-setup"
              element={
                <ProtectedRoute>
                  <ProfileSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-tracking/:orderId"
              element={
                <ProtectedRoute>
                  <OrderTrackingPage />
                </ProtectedRoute>
              }
            />
            <Route path="/mock-payment" element={<MockUpiPage />} />
            
            <Route path="/admin" element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="orders" replace />} />
                <Route path="orders" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <OrderSimulationProvider>
            <AppLayout />
          </OrderSimulationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
