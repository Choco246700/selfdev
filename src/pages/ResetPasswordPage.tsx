import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

type PageState = 'checking' | 'ready' | 'invalid' | 'done';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect the recovery session. Supabase fires PASSWORD_RECOVERY when
  // the URL contains a valid recovery token. We also check the hash
  // directly to catch cases where the event fired before mount.
  useEffect(() => {
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          resolved = true;
          setPageState('ready');
        }
      }
    );

    // Fallback check for the recovery token in the URL hash
    const hash = window.location.hash;
    const hasRecoveryToken = hash.includes('type=recovery');

    // Give Supabase a tick to process the URL fragment
    const t = setTimeout(async () => {
      if (resolved) return;
      if (hasRecoveryToken) {
        setPageState('ready');
        return;
      }
      // If no recovery token was present, this page isn't usable
      setPageState('invalid');
    }, 600);

    return () => {
      clearTimeout(t);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPageState('done');
      toast.success('Password updated');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
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

        <div className="bg-white rounded-2xl shadow-card p-8">
          {/* Checking */}
          {pageState === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Verifying link…</p>
            </div>
          )}

          {/* Invalid or expired */}
          {pageState === 'invalid' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle size={22} className="text-red-500" />
                </div>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">
                Link expired or invalid
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Password reset links expire after a short time. Request a new
                one to continue.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Back to sign in
              </button>
            </div>
          )}

          {/* Success */}
          {pageState === 'done' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-emerald-500" />
                </div>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">
                Password updated
              </h1>
              <p className="text-sm text-gray-500">
                Redirecting you to your dashboard…
              </p>
            </div>
          )}

          {/* Ready — form */}
          {pageState === 'ready' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Set a new password
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Choose a strong password you don't use anywhere else.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    autoFocus
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

                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};