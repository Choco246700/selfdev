import React, { useState } from 'react';
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

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [signupSentTo, setSignupSentTo] = useState<string | null>(null);

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
  };

  // ─── Sign in / Sign up / Forgot ───────────────────────────────────
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

  // ─── Resend confirmation ──────────────────────────────────────────
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

  // ─── Confirmation screen (after signup) ──────────────────────────
  if (signupSentTo) {
    return (
      <Shell>
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Check your inbox
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            We sent a confirmation link to{' '}
            <span className="font-medium text-gray-700">{signupSentTo}</span>.
            Click it to activate your account.
          </p>

          {info && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
              {info}
            </div>
          )}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}

          <button
            onClick={handleResendConfirmation}
            disabled={loading}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending…' : "Didn't get it? Resend email"}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => {
                setSignupSentTo(null);
                switchMode('signin');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────
  return (
    <Shell>
      <div className="bg-white rounded-2xl shadow-card p-8">
        {/* Back link in forgot mode */}
        {isForgot && (
          <button
            onClick={() => switchMode('signin')}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft size={12} />
            Back to sign in
          </button>
        )}

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {isForgot
            ? 'Reset your password'
            : isSignUp
            ? 'Create your account'
            : 'Welcome back'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {isForgot
            ? "Enter your email and we'll send you a reset link."
            : isSignUp
            ? 'Start tracking your skills and habits.'
            : 'Sign in to continue your streaks.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Email */}
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Password (not in forgot mode) */}
          {!isForgot && (
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          )}

          {/* Confirm password (signup only) */}
          {isSignUp && (
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
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

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {info && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
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

        {/* Toggle */}
        {!isForgot && (
          <div className="mt-5 text-center text-xs text-gray-500">
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
    </Shell>
  );
};

// ─── Shared shell (background + logo) ────────────────────────────────
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

    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white shadow-sm">
          <Sparkles size={16} strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">
          SkillTrack
        </span>
      </div>
      {children}
    </div>
  </div>
);