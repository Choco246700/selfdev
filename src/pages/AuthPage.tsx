import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Check,
  User as UserIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type Mode = 'signin' | 'signup' | 'forgot';

interface AuthPageProps {
  initialMode?: Mode;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signin',
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [signupSentTo, setSignupSentTo] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setInfo(null);
    setSignupSentTo(null);
  }, [initialMode]);

  const isSignUp = mode === 'signup';
  const isForgot = mode === 'forgot';

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
    setAcceptedTerms(false);
    setName('');
    setSignupSentTo(null);
    if (next === 'signup') navigate('/signup', { replace: true });
    else if (next === 'signin') navigate('/signin', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (isSignUp && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isForgot && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (isSignUp && !acceptedTerms) {
      setError('Please accept the terms to continue.');
      return;
    }

    setLoading(true);
    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo(
          'If an account exists for that email, we’ve sent a password reset link.'
        );
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        setSignupSentTo(email);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!signupSentTo) return;
    setLoading(true);
    resetMessages();
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupSentTo,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      setInfo('Confirmation email sent again. Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Confirmation screen ──────────────────────────────────────
  if (signupSentTo) {
    return (
      <Shell>
        <div className="text-center max-w-md mx-auto p-8 md:p-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
          </div>
          <h1 className="font-serious text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Check your inbox
          </h1>
          <p className="text-sm md:text-base text-gray-500 mb-8 leading-relaxed wrap-break-word">
            We sent a confirmation link to{' '}
            <span className="font-medium text-gray-700 break-all">
              {signupSentTo}
            </span>
            . Click it to activate your account.
          </p>

          {info && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4">
              {info}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleResendConfirmation}
            disabled={loading}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending…' : "Didn't get it? Resend email"}
          </button>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <button
              onClick={() => {
                setSignupSentTo(null);
                switchMode('signin');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Main auth card ────────────────────────────────────────────
  return (
    <Shell>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* ═══ Left panel — hidden on mobile ═══ */}
        <div className="hidden md:flex flex-col relative overflow-hidden bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 lg:p-10">
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-teal-300/30 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Sparkles size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              SelfDev
            </span>
          </div>

          <div className="relative z-10 mb-8">
            <h2 className="font-serious text-3xl lg:text-4xl font-bold text-white leading-[1.2] mb-4">
              Ready to build the skills you keep meaning to learn?
            </h2>
            <p className="text-sm lg:text-base text-white/85 leading-relaxed max-w-sm">
              Log practice sessions, build daily habits, and watch your
              progress compound — one day at a time.
            </p>
          </div>

          <div className="relative z-10 flex-1 min-h-55 lg:min-h-65 rounded-2xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)]">
            <img
              src="/images/growth-books.jpg"
              alt="A stack of books labeled with words like training, coaching, knowledge, and skills"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-linear-to-t from-emerald-900/40 via-transparent to-transparent"
              aria-hidden="true"
            />
            <p className="absolute top-[4%] left-[27%] font-serious text-3xl lg:text-4xl font-bold text-white leading-none tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.65)]">
              If you
            </p>
          </div>
        </div>

        {/* ═══ Right panel — the form ═══ */}
        <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center min-w-0">
          <Link
            to="/"
            className="md:hidden flex items-center gap-2 mb-6 self-center"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white shadow-sm">
              <Sparkles size={16} strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              SelfDev
            </span>
          </Link>

          {isForgot && (
            <button
              onClick={() => switchMode('signin')}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6 self-start"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </button>
          )}

          <h1 className="font-serious text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {isForgot
              ? 'Reset password'
              : isSignUp
              ? 'Sign Up'
              : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {isForgot
              ? "Enter your email and we'll send you a reset link."
              : isSignUp
              ? 'Get started with your free SelfDev account.'
              : 'Sign in to continue your streaks.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name — signup only */}
            {isSignUp && (
              <div className="min-w-0">
                <label className="text-xs font-medium text-gray-700 mb-2 block">
                  Name
                </label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Your full name"
                    required
                    autoComplete="name"
                    className="w-full min-w-0 box-border pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="min-w-0">
              <label className="text-xs font-medium text-gray-700 mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full min-w-0 box-border pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Password */}
            {!isForgot && (
              <div className="min-w-0">
                <label className="text-xs font-medium text-gray-700 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isSignUp ? 'Create a password' : 'Your password'
                    }
                    required
                    minLength={8}
                    autoComplete={
                      isSignUp ? 'new-password' : 'current-password'
                    }
                    className="w-full min-w-0 box-border pl-10 pr-12 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm password */}
            {isSignUp && (
              <div className="min-w-0">
                <label className="text-xs font-medium text-gray-700 mb-2 block">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full min-w-0 box-border pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  At least 8 characters
                </p>
              </div>
            )}

            {/* Terms checkbox */}
            {isSignUp && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1 min-w-0">
                <span className="relative flex items-center justify-center mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="w-4 h-4 rounded border border-gray-300 bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors flex items-center justify-center">
                    {acceptedTerms && (
                      <Check size={11} strokeWidth={3} className="text-white" />
                    )}
                  </span>
                </span>
                <span className="text-xs text-gray-500 leading-relaxed min-w-0">
                  By registering you agree to our{' '}
                  <a
                    href="#terms"
                    className="font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    Terms
                  </a>{' '}
                  &{' '}
                  <a
                    href="#privacy"
                    className="font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            )}

            {/* Forgot link */}
            {!isSignUp && !isForgot && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error / Info */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 wrap-break-word">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 wrap-break-word">
                {info}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#1c1b1f] hover:bg-[#2a2a2e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-full transition-all duration-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.14),0_1px_3px_0_rgba(0,0,0,0.12)] hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.16),0_3px_6px_0_rgba(0,0,0,0.14)]"
            >
              {loading
                ? 'Please wait…'
                : isForgot
                ? 'Send reset link'
                : isSignUp
                ? 'Create account'
                : 'Sign in'}
            </button>
          </form>

          {/* Toggle mode */}
          {!isForgot && (
            <div className="mt-6 text-center text-sm text-gray-500">
              {isSignUp ? 'Already have an account?' : "Don't have one?"}{' '}
              <button
                type="button"
                onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
};

// ─── Shell ──────────────────────────────────────────────────────
const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 font-sans">
    <div className="fixed inset-0 -z-30 bg-mesh-c2" aria-hidden="true" />
    <div
      className="fixed inset-0 -z-20 bg-grid pointer-events-none"
      aria-hidden="true"
    />
    <div
      className="fixed inset-0 -z-10 bg-vignette pointer-events-none"
      aria-hidden="true"
    />
    <div
      className="fixed inset-0 -z-10 bg-noise opacity-[0.10] mix-blend-multiply pointer-events-none"
      aria-hidden="true"
    />

    <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] overflow-hidden">
      {children}
    </div>
  </div>
);