import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    setSignupSentTo(null);
    if (next === 'signup') navigate('/signup', { replace: true });
    else if (next === 'signin') navigate('/signin', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isForgot && password.length < 8) {
      setError('Password must be at least 8 characters.');
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
          options: { emailRedirectTo: `${window.location.origin}/` },
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

  // ─── Confirmation screen (after signup) ────────────────────────
  if (signupSentTo) {
    return (
      <Shell>
        <div className="bg-white rounded-3xl shadow-card p-10 lg:p-12 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={26} className="text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your inbox
          </h1>
          <p className="text-base text-gray-500 mb-8 leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="font-medium text-gray-700">{signupSentTo}</span>.
            Click it to activate your account.
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

  // ─── Main form ──────────────────────────────────────────────────
  return (
    <Shell>
      <div className="bg-white rounded-3xl shadow-card p-8 lg:p-10">
        {isForgot && (
          <button
            onClick={() => switchMode('signin')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </button>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isForgot
            ? 'Reset your password'
            : isSignUp
            ? 'Create your account'
            : 'Welcome back'}
        </h1>
        <p className="text-base text-gray-500 mb-8 leading-relaxed">
          {isForgot
            ? "Enter your email and we'll send you a reset link."
            : isSignUp
            ? 'Start tracking your skills and habits.'
            : 'Sign in to continue your streaks.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
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
                className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Password */}
          {!isForgot && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
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
                    isSignUp ? 'At least 8 characters' : 'Your password'
                  }
                  required
                  minLength={8}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="w-full pl-10 pr-12 py-3 text-base rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm password */}
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
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
                  placeholder="Same as above"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {info && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-semibold py-3 rounded-xl transition-colors shadow-sm"
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

      {/* Fine print below the card */}
      {isSignUp && (
        <p className="text-center text-xs text-gray-400 mt-5 px-4 leading-relaxed">
          By creating an account you agree to keep practicing. 🔥
        </p>
      )}
    </Shell>
  );
};

// ─── Shared shell ─────────────────────────────────────────────────
const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-6 font-sans">
    <div className="fixed inset-0 -z-10 bg-mesh-c2" aria-hidden="true" />
    <div
      className="fixed inset-0 -z-10 bg-grid pointer-events-none"
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

    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500 text-white shadow-sm">
          <Sparkles size={18} strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          SkillTrack
        </span>
      </div>
      {children}
    </div>
  </div>
);