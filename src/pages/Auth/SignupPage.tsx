import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (pass.length === 0) return { label: '', color: 'bg-gray-200', text: '', bars: 0 };
    if (score < 3) return { label: 'Weak', color: 'bg-red-400', text: 'text-red-500', bars: 1 };
    if (score < 4) return { label: 'Medium', color: 'bg-amber-400', text: 'text-amber-500', bars: 2 };
    return { label: 'Strong', color: 'bg-emerald-400', text: 'text-emerald-500', bars: 3 };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-[24px] bg-[#FFBE0B] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[#FFBE0B]/30 border-2 border-black/5">
            <Zap className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create your account</h1>
          <p className="text-gray-500 font-bold mt-2 text-sm">Get groceries delivered in minutes</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[32px] shadow-2xl shadow-black/5 border-2 border-gray-100 p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="full-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-black focus:bg-white transition-all duration-300"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-black focus:bg-white transition-all duration-300"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-black focus:bg-white transition-all duration-300 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            
            {/* Strength Indicator */}
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-2 animate-[fade-in_0.2s_ease-out]">
                <div className="flex gap-1 flex-1 h-1.5">
                  {[1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                        bar <= strength.bars ? strength.color : 'bg-gray-100'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider w-12 text-right ${strength.text}`}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-full text-sm font-bold hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-black/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="text-center">
            <span className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-brand font-semibold hover:underline">
                Sign In
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
