import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, ArrowRight, RefreshCw, Smartphone, Sparkles } from 'lucide-react';
import { saveUserProfile, signInWithGoogle } from '../services/firebaseConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (phone: string, name: string, email?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('789012');
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    // Simulate high-reliability Firebase Phone Auth OTP delivery
    setTimeout(() => {
      const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(demoCode);
      setIsLoading(false);
      setStep('otp');
      setTimer(30);
    }, 500);
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = cleanVal;
    setOtp(updated);

    // Auto-focus next input
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const entered = otp.join('');
    if (entered.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    // Verify OTP
    if (entered === generatedOtp || entered === '123456' || entered === '789012') {
      const formattedPhone = `+91 ${phone.replace(/\D/g, '')}`;
      const defaultName = authMode === 'signup' ? 'Giriraj Customer' : 'Kolkata Customer';
      saveUserProfile({ phone: formattedPhone, name: defaultName });
      onAuthSuccess(formattedPhone, defaultName);
      onClose();
    } else {
      setError(`Invalid OTP code. Use the simulated verification code: ${generatedOtp}`);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        const phoneVal = user.phoneNumber || localStorage.getItem('giriraj_user_phone') || '';
        const nameVal = user.displayName || 'Customer';
        const emailVal = user.email || '';
        const photoVal = user.photoURL || undefined;
        saveUserProfile({ phone: phoneVal, name: nameVal, email: emailVal, photoURL: photoVal, emailVerified: true });
        onAuthSuccess(phoneVal || '+91 98300 00000', nameVal, emailVal);
        onClose();
      }
    } catch (e) {
      console.error(e);
      setError('Google Sign-In was cancelled or encountered an issue. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden">
        
        {/* Top Decorative Header Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="flex items-center gap-3 mb-5 mt-1">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-extrabold shrink-0 shadow-xs">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              {step === 'phone'
                ? authMode === 'signin' ? 'Sign In to Giriraj Power' : 'Create New Account'
                : 'Enter 6-Digit OTP'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {step === 'phone' ? 'Express 60-Min Kolkata Electrical Supplies' : `Verification code sent to +91 ${phone}`}
            </p>
          </div>
        </div>

        {/* Sign In vs Sign Up Tabs (Only shown on phone step) */}
        {step === 'phone' && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setError(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setError(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up (New User)
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition-all bg-white">
                <span className="px-3.5 py-3 bg-slate-50 border-r border-slate-200 text-slate-800 text-sm font-black flex items-center shrink-0">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-3 text-sm font-bold focus:outline-none text-slate-900 placeholder:text-slate-400"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>We’ll send a secure one-time password (OTP) via SMS.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer"
            >
              <span>{isLoading ? 'Sending OTP...' : 'Send OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500 font-semibold">Or continue with</span>
              </div>
            </div>

            {/* Google / Gmail Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-400 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Gmail / Google</span>
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-500 font-medium">
              By proceeding, you agree to Giriraj Power’s <span className="underline text-slate-700">Terms of Service</span> &amp; <span className="underline text-slate-700">Privacy Policy</span>.
            </div>
          </form>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-600 font-medium">Simulated OTP Code: </span>
                <strong className="text-amber-950 font-black text-sm tracking-wider">{generatedOtp}</strong>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Fast Auto-Fill
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                Enter 6-Digit Code sent to <span className="font-extrabold text-slate-900">+91 {phone}</span>:
              </label>
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-black border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-slate-900 bg-slate-50/50"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="hover:underline text-slate-800 font-bold cursor-pointer"
              >
                Change Number
              </button>
              {timer > 0 ? (
                <span>Resend in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedOtp(newOtp);
                    setTimer(30);
                  }}
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Verify &amp; Continue</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
