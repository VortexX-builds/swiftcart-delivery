import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

export default function AdminProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  // Wait for global loading. If loading is false and we still don't have a profile,
  // we will let the next check handle the unauthorized state rather than spinning forever.
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/25 animate-pulse">
          <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
