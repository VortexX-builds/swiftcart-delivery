import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderSimulationProvider } from './context/OrderSimulationContext';
import { Toaster } from 'sonner';
import Navbar from './components/layout/Navbar';
import CartDrawer from './components/shared/CartDrawer';
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ProfileSetupPage from './pages/Profile/ProfileSetupPage';
import SettingsPage from './pages/Profile/SettingsPage';
import OrderTrackingPage from './pages/OrderTracking/OrderTrackingPage';
import MockUpiPage from './pages/MockUpiPage';
import { Zap } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/25 animate-pulse">
        <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
      </div>
      <div className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
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

  if (loading) return <LoadingScreen />;

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
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar onCartClick={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <Toaster position="top-center" richColors />

      <main>
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
        </Routes>
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
