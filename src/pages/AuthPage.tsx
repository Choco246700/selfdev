import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) return setError("Please enter your email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return setError("That doesn't look like a valid email.");
    }
    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    setLoading(true);
    try {
      await signIn(trimmed, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="fixed inset-0 -z-30 bg-mesh-c2" aria-hidden="true" />
      <div className="fixed inset-0 -z-20 bg-grid pointer-events-none" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-vignette pointer-events-none" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-noise opacity-[0.10] mix-blend-multiply pointer-events-none" aria-hidden="true" />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] overflow-hidden p-8 sm:p-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500 text-white shadow-sm">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            SelfDev
          </span>
        </div>

        <h1 className="font-serious text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
          Welcome to SelfDev
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Sign in, or create an account if this is your first time.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
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
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full pl-10 pr-12 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Choose something you'll remember — there's no password reset yet.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-[#1c1b1f] hover:bg-[#2a2a2e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-full transition-all duration-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.14),0_1px_3px_0_rgba(0,0,0,0.12)]"
          >
            {loading ? "Signing in…" : "Continue"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
};