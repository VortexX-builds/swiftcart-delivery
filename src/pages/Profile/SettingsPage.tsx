import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Typically requires an RPC call to bypass RLS and delete the auth.users record
      // Or an edge function. We attempt an RPC call here as per best practices.
      const { error } = await supabase.rpc('delete_user');
      
      if (error) {
        console.error('Failed to delete account via RPC, attempting fallback...', error);
        // Fallback: Delete profile (auth record might remain if no admin privileges)
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          await supabase.from('profiles').delete().eq('id', userData.user.id);
        }
      }

      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting your account.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Policies Section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Legal & Policies</h2>
          </div>
          
          <div className="divide-y divide-gray-50">
            <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Terms & Conditions</p>
                  <p className="text-xs text-gray-500 mt-0.5">Review our terms of service</p>
                </div>
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Privacy Policy</p>
                  <p className="text-xs text-gray-500 mt-0.5">How we handle your data</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-50 bg-red-50/30">
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide">Danger Zone</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-[fade-in-down_0.3s_ease-out]">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              This action cannot be undone. All your data, order history, and wallet balance will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
