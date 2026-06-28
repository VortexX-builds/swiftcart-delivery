import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, User, RefreshCw, AlertCircle } from 'lucide-react';

interface AdminProfile {
  id: string;
  full_name: string | null;
  email?: string;
  role: string;
  is_banned: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [banningId, setBanningId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedData = (data || []).map(u => ({
        ...u,
        role: u.role === 'user' ? 'customer' : (u.role || 'customer'),
        is_banned: !!u.is_banned
      })) as AdminProfile[];
      
      setUsers(mappedData);
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      }
      setError(errorMessage || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate || userToUpdate.role === newRole) return;

    const previousRole = userToUpdate.role;

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setUpdatingId(userId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      }
      console.error('Failed to update role:', errorMessage);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: previousRole } : u))
      );
      alert('Failed to update user role. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) return;

    // Optimistic UI Update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_banned: !currentBanStatus } : u))
    );
    setBanningId(userId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentBanStatus })
        .eq('id', userId);

      if (error) throw error;
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      }
      console.error('Failed to toggle ban status:', errorMessage);
      // Revert Optimistic Update on Error
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_banned: currentBanStatus } : u))
      );
      alert('Failed to update user ban status. Please try again.');
    } finally {
      setBanningId(null);
    }
  };

  return (
    <div className="bg-brand-surface rounded-xl border border-slate-800 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-surface">
        <h2 className="text-lg font-semibold text-slate-100 whitespace-nowrap">Users Management</h2>
        
        <button 
          onClick={fetchUsers}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 bg-brand-surface border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors font-medium text-slate-200 shadow-none disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4 font-medium w-[15%]">User ID</th>
              <th className="px-6 py-4 font-medium w-[20%]">Name</th>
              <th className="px-6 py-4 font-medium w-[20%]">Email</th>
              <th className="px-6 py-4 font-medium w-[15%]">Role</th>
              <th className="px-6 py-4 font-medium w-[10%]">Status</th>
              <th className="px-6 py-4 font-medium text-right w-[20%]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-700 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-700 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-700 rounded w-40"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-slate-700 rounded-full w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-slate-700 rounded-full w-14"></div>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <div className="h-8 bg-slate-700 rounded-lg w-20"></div>
                    <div className="h-8 bg-slate-700 rounded-lg w-24"></div>
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center text-red-500">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No users found in the system.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-100 font-mono">
                    {user.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-100">
                    {user.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-[180px]" title={user.email}>
                    {user.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                      user.role === 'admin' 
                        ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' 
                        : 'bg-blue-900/30 text-blue-400 border-blue-800/50'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.is_banned
                        ? 'bg-red-900/30 text-red-400 border-red-800/50'
                        : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
                    }`}>
                      {user.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleToggleBan(user.id, user.is_banned)}
                      disabled={banningId === user.id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap ${
                        user.is_banned
                          ? 'bg-brand-surface text-slate-300 border border-slate-700 hover:bg-slate-800'
                          : 'bg-brand-surface text-red-400 border border-red-900/50 hover:bg-red-900/20'
                      }`}
                    >
                      {user.is_banned ? 'Unban' : 'Ban User'}
                    </button>
                    
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updatingId === user.id}
                      className={`inline-block w-full max-w-[110px] px-3 py-1.5 border border-slate-700 rounded-lg text-sm bg-brand-dark text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-colors cursor-pointer appearance-none ${
                        updatingId === user.id ? 'opacity-50 cursor-not-allowed bg-slate-800' : 'hover:bg-slate-800'
                      }`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '2rem' }}
                    >
                      <option value="customer">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
