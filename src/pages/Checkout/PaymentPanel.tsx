import { useState } from 'react';
import {
  Smartphone,
  CreditCard,
  Banknote,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import QRCode from 'react-qr-code';

export type PaymentMethod = 'upi' | 'card' | 'cod' | null;

interface PaymentPanelProps {
  grandTotal: number;
  onConfirm: (method: PaymentMethod) => void;
  isProcessing: boolean;
}

/* ─── Helpers ─────────────────────────────────────────────── */

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}


/* ─── Method Selector Button ─────────────────────────────── */

interface MethodBtnProps {
  id: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onClick: () => void;
}

function MethodBtn({ id, active, icon, label, subtitle, onClick }: MethodBtnProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-left
        ${active
          ? 'border-brand bg-brand/5 shadow-sm shadow-brand/10'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
        }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200
        ${active ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold transition-colors duration-200 ${active ? 'text-brand' : 'text-gray-800'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      {active && <CheckCircle2 className="w-4 h-4 text-brand flex-shrink-0" />}
    </button>
  );
}

/* ─── Animated Card Preview ──────────────────────────────── */

function CardPreview({
  number,
  expiry,
  cvv,
  flipped,
}: {
  number: string;
  expiry: string;
  cvv: string;
  flipped: boolean;
}) {
  const displayNumber = (number || '').padEnd(19, '·');

  return (
    <div className="perspective-1000 w-full h-40 relative" style={{ perspective: '1000px' }}>
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c81 100%)',
          }}
        >
          {/* Chip + Logo row */}
          <div className="flex items-center justify-between">
            <div className="w-8 h-6 rounded bg-yellow-300/80 flex items-center justify-center">
              <div className="w-5 h-4 rounded-sm border border-yellow-500/50 grid grid-cols-2 gap-px p-px">
                <div className="bg-yellow-500/40 rounded-sm" /><div className="bg-yellow-500/40 rounded-sm" />
                <div className="bg-yellow-500/40 rounded-sm" /><div className="bg-yellow-500/40 rounded-sm" />
              </div>
            </div>
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-red-500/80" />
              <div className="w-7 h-7 rounded-full bg-amber-400/80" />
            </div>
          </div>

          {/* Card Number */}
          <div className="font-mono text-white tracking-widest text-sm">
            {displayNumber}
          </div>

          {/* Name + Expiry */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-wider">Card Holder</p>
              <p className="text-white text-xs font-semibold">SwiftCart User</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[9px] uppercase tracking-wider">Expires</p>
              <p className="text-white text-xs font-semibold font-mono">{expiry || 'MM/YY'}</p>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
          }}
        >
          <div className="w-full h-10 bg-gray-900 mt-7" />
          <div className="px-5 mt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-gray-200/20 rounded" />
              <div className="w-14 h-9 bg-white rounded flex items-center justify-center">
                <p className="text-gray-900 font-mono text-sm font-bold tracking-widest">
                  {cvv || '···'}
                </p>
              </div>
            </div>
            <p className="text-white/30 text-[9px] mt-2 text-right">CVV</p>
          </div>
        </div>
      </div>
    </div>
  );
}



/* ─── Main Component ─────────────────────────────────────── */

export default function PaymentPanel({ grandTotal, onConfirm, isProcessing }: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cvvFocused, setCvvFocused] = useState(false);

  const isValidUpi = upiId.length > 3 && upiId.includes('@');

  const isPaymentValid = (() => {
    if (method === 'cod') return true;
    if (method === 'upi') return isValidUpi;
    if (method === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      return (
        cleanCard.length >= 15 &&
        cleanCard.length <= 16 &&
        /^\d{2}\/\d{2}$/.test(cardExpiry) &&
        cardCvv.length >= 3 &&
        cardCvv.length <= 4
      );
    }
    return false;
  })();

  const handleConfirm = () => {
    if (!isPaymentValid) return;
    onConfirm(method);
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div>
        <h2 className="text-base font-bold text-gray-900">Choose Payment Method</h2>
        <p className="text-xs text-gray-400 mt-0.5">All transactions are secured & encrypted</p>
      </div>

      {/* Method Selector */}
      <div className="space-y-2.5">
        <MethodBtn
          id="pay-method-upi"
          active={method === 'upi'}
          icon={<Smartphone className="w-4 h-4" />}
          label="UPI"
          subtitle="Google Pay, PhonePe, Paytm & more"
          onClick={() => setMethod('upi')}
        />
        <MethodBtn
          id="pay-method-card"
          active={method === 'card'}
          icon={<CreditCard className="w-4 h-4" />}
          label="Credit / Debit Card"
          subtitle="Visa, Mastercard, RuPay"
          onClick={() => setMethod('card')}
        />
        <MethodBtn
          id="pay-method-cod"
          active={method === 'cod'}
          icon={<Banknote className="w-4 h-4" />}
          label="Cash on Delivery"
          subtitle="Pay when your order arrives"
          onClick={() => setMethod('cod')}
        />
      </div>

      {/* ── UPI Flow ── */}
      {method === 'upi' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Manual Entry Flow */}
          <div className="space-y-3">
            <label htmlFor="upi-id-input" className="text-sm font-semibold text-gray-700">
              Enter UPI ID Manually
            </label>
            <input
              id="upi-id-input"
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white transition-all"
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* QR Code Simulation Flow */}
          <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col items-center">
            <p className="text-sm font-semibold text-gray-700">Scan QR Code</p>
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <QRCode
                value={`${window.location.origin}/mock-payment?amount=${grandTotal}`}
                size={160}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Scan with any UPI app on your phone
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                onConfirm('upi');
              }}
              disabled={isProcessing}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand/20 text-brand text-sm font-bold hover:bg-brand/5 active:scale-[0.98] transition-all duration-200"
            >
              Simulate QR Scan
            </button>
          </div>
        </div>
      )}

      {/* ── Card Flow ── */}
      {method === 'card' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardPreview
            number={cardNumber}
            expiry={cardExpiry}
            cvv={cardCvv}
            flipped={cvvFocused}
          />

          {/* Card Number */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Card Number</label>
            <input
              id="card-number-input"
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => {
                setCardNumber(formatCardNumber(e.target.value));
              }}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Expiry */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Expiry</label>
              <input
                id="card-expiry-input"
                type="text"
                inputMode="numeric"
                value={cardExpiry}
                onChange={(e) => {
                  setCardExpiry(formatExpiry(e.target.value));
                }}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white transition-all"
              />
            </div>

            {/* CVV */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">CVV</label>
              <input
                id="card-cvv-input"
                type="password"
                inputMode="numeric"
                value={cardCvv}
                onChange={(e) => {
                  setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                }}
                onFocus={() => setCvvFocused(true)}
                onBlur={() => setCvvFocused(false)}
                placeholder="···"
                maxLength={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white transition-all"
              />
            </div>
          </div>

        </div>
      )}

      {/* ── COD Flow ── */}
      {method === 'cod' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Cash on Delivery</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Keep <span className="font-bold">₹{grandTotal.toFixed(2)}</span> ready to pay when your delivery arrives. No online transaction needed.
            </p>
          </div>
        </div>
      )}

      {/* Confirm Button — always shown once a method is selected */}
      <button
        id="confirm-payment-btn"
        onClick={handleConfirm}
        disabled={!isPaymentValid || isProcessing}
        className="w-full flex items-center justify-center gap-2 bg-brand text-white py-3.5 rounded-2xl text-sm font-bold
          hover:bg-brand-dark active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 shadow-lg shadow-brand/25"
      >
        <Lock className="w-4 h-4" />
        {isProcessing ? 'Processing…' : `Pay ₹${grandTotal.toFixed(2)}`}
      </button>

      <p className="text-[11px] text-gray-300 text-center">
        🔒 256-bit SSL encryption · This is a demo — no real payment is made
      </p>
    </div>
  );
}
