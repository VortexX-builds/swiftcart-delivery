import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, Navigation } from 'lucide-react';
import type { ToastData } from '../../context/OrderSimulationContext';

interface DeliveryToastProps {
  toast: ToastData;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 8000;

export default function DeliveryToast({ toast, onDismiss }: DeliveryToastProps) {
  const navigate = useNavigate();

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss, toast.orderId]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{ animation: 'slideUp 300ms cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      {/* Brand accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-brand to-emerald-400" />

      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-brand" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Order Delivered! 🎉</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Order <span className="font-mono font-semibold">#{toast.orderId.slice(0, 8).toUpperCase()}</span> · ₹{toast.totalAmount}
          </p>
          <button
            onClick={() => {
              navigate(`/order-tracking/${toast.orderId}`);
              onDismiss();
            }}
            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
          >
            <Navigation className="w-3 h-3" />
            View Order
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Progress bar that drains over AUTO_DISMISS_MS */}
      <div className="px-4 pb-3">
        <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full"
            style={{ animation: `drain ${AUTO_DISMISS_MS}ms linear forwards` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes drain {
          from { width: 100% }
          to   { width: 0% }
        }
      `}</style>
    </div>
  );
}
