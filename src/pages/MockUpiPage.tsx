import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function MockUpiPage() {
  const [searchParams] = useSearchParams();
  const amountParam = searchParams.get('amount') || '0';
  const amount = parseFloat(amountParam).toFixed(2);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const handlePay = () => {
    setStatus('processing');
    setTimeout(() => setStatus('success'), 1500);
  };

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto h-screen bg-green-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">Payment Successful</h1>
        <p className="text-green-600 font-medium text-lg">₹{amount}</p>
        <p className="text-sm text-green-700/70 mt-6 text-center">
          You can safely close this window and return to your computer.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-[#121212] text-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center justify-center pt-12 pb-8 border-b border-white/10">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl font-black text-brand tracking-tighter">SC</span>
        </div>
        <h1 className="text-xl text-white/80 font-medium">Paying SwiftCart</h1>
        <p className="text-4xl font-bold mt-3">₹{amount}</p>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 pt-8 flex flex-col gap-6">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/60 text-sm">To</span>
            <span className="font-medium text-sm">SwiftCart Private Limited</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/60 text-sm">From</span>
            <span className="font-medium text-sm">Demo User Account</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
            <span className="text-white/60 text-sm">UPI ID</span>
            <span className="font-medium text-sm">swiftcart@upi</span>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-center text-white/40 text-xs mt-auto mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Secure UPI Payment</span>
        </div>
        
        {/* Footer actions */}
        <div className="pb-8">
          <button
            onClick={handlePay}
            disabled={status === 'processing'}
            className="w-full bg-[#00A859] hover:bg-[#00964F] active:scale-[0.98] transition-all text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#00A859]/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'processing' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              `Pay ₹${amount}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
