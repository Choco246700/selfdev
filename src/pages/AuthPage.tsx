import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wordmark } from "../components/Wordmark";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

type Mode = "signin" | "signup" | "forgot";

interface AuthPageProps {
  initialMode?: Mode;
}

// ─── Google G icon (inline SVG) ─────────────────────────────────────
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "signin",
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [signupSentTo, setSignupSentTo] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setInfo(null);
    setSignupSentTo(null);
  }, [initialMode]);

  const isSignUp = mode === "signup";
  const isForgot = mode === "forgot";

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetMessages();
    setPassword("");
    setConfirmPassword("");
    setAcceptedTerms(false);
    setSignupSentTo(null);
    if (next === "signup") navigate("/signup", { replace: true });
    else if (next === "signin") navigate("/signin", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isForgot && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isSignUp && !acceptedTerms) {
      setError("Please accept the terms to continue.");
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
          "If an account exists for that email, we’ve sent a password reset link.",
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
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setInfo(null);
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not sign in with Google.",
      );
      setGoogleLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!signupSentTo) return;
    setLoading(true);
    resetMessages();
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: signupSentTo,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      setInfo("Confirmation email sent again. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Confirmation screen ──────────────────────────────────────
  if (signupSentTo) {
    return (
      <Shell>
        <div className="text-center max-w-md mx-auto p-10 md:p-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
          </div>
          <h1 className="font-serious text-3xl font-bold text-gray-900 mb-2">
            Check your inbox
          </h1>
          <p className="text-base text-gray-500 mb-8 leading-relaxed">
            We sent a confirmation link to{" "}
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
            {loading ? "Sending…" : "Didn't get it? Resend email"}
          </button>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <button
              onClick={() => {
                setSignupSentTo(null);
                switchMode("signin");
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
      <div className="grid md:grid-cols-2">
        {/* ═══ Left panel — branding + image ═══ */}
        <div className="hidden md:flex flex-col relative overflow-hidden bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 lg:p-10">
          {/* Decorative blurred circles */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-teal-300/30 blur-3xl"
            aria-hidden="true"
          />

          {/* Brand */}
          <div className="relative z-10 flex items-center mb-8 text-white">
            <Wordmark className="h-8 w-auto" />
          </div>

          {/* Headline + subtext */}
          <div className="relative z-10 mb-8">
            <h2 className="font-serious text-3xl lg:text-4xl font-bold text-white leading-[1.2] mb-4">
              Ready to build the skills you keep meaning to learn?
            </h2>
            <p className="text-sm lg:text-base text-white/85 leading-relaxed max-w-sm">
              Log practice sessions, build daily habits, and watch your progress
              compound — one day at a time.
            </p>
          </div>

          {/* Image — fills remaining vertical space */}
          <div className="relative z-10 flex-1 min-h-55 lg:min-h-65 rounded-2xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)]">
            <img
              src="/images/growth-books.jpg"
              alt="A stack of books labeled with words like training, coaching, knowledge, and skills"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Soft gradient overlay to blend the image with the panel */}
            <div
              className="absolute inset-0 bg-linear-to-t from-emerald-900/40 via-transparent to-transparent"
              aria-hidden="true"
            />

            {/* "If you" text overlaid on the image, sitting above
    the stack of books where the labels are */}
            <p className="absolute top-[12%] left-[27%] font-serious text-3xl lg:text-4xl font-bold text-white leading-none tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.65)]">
              If you
            </p>
          </div>
        </div>

        {/* ═══ Right panel — the form ═══ */}
        <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center">
          {/* Mobile brand */}
          <Link
            to="/"
            className="md:hidden flex items-center mb-8 self-center text-gray-900"
          >
            <Wordmark className="h-8 w-auto" />
          </Link>

          {isForgot && (
            <button
              onClick={() => switchMode("signin")}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6 self-start"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </button>
          )}

          <h1 className="font-serious text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {isForgot
              ? "Reset password"
              : isSignUp
                ? "Sign Up"
                : "Welcome back"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {isForgot
              ? "Enter your email and we'll send you a reset link."
              : isSignUp
                ? "Get started with your free SkillTrack account."
                : "Sign in to continue your streaks."}
          </p>

          {/* Google OAuth — hidden in forgot mode */}
          {!isForgot && (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium text-gray-700 py-3 rounded-xl transition-colors"
              >
                <GoogleIcon size={16} />
                {googleLoading
                  ? "Redirecting…"
                  : isSignUp
                    ? "Sign up with Google"
                    : "Sign in with Google"}
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-[11px] font-medium uppercase tracking-widest text-gray-400">
                    or
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
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
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Password */}
            {!isForgot && (
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
                    placeholder={
                      isSignUp ? "Create a password" : "Your password"
                    }
                    required
                    minLength={8}
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    className="w-full pl-10 pr-12 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
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
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  At least 8 characters
                </p>
              </div>
            )}

            {/* Terms checkbox — signup only */}
            {isSignUp && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <span className="relative flex items-center justify-center mt-0.5">
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
                <span className="text-xs text-gray-500 leading-relaxed">
                  By registering you agree to our{" "}
                  <a
                    href="#terms"
                    className="font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    Terms
                  </a>{" "}
                  &{" "}
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
                  onClick={() => switchMode("forgot")}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error / Info */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                {info}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-2 w-full bg-[#1c1b1f] hover:bg-[#2a2a2e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-full transition-all duration-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.14),0_1px_3px_0_rgba(0,0,0,0.12)] hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.16),0_3px_6px_0_rgba(0,0,0,0.14)]"
            >
              {loading
                ? "Please wait…"
                : isForgot
                  ? "Send reset link"
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
            </button>
          </form>

          {/* Toggle mode */}
          {!isForgot && (
            <div className="mt-6 text-center text-sm text-gray-500">
              {isSignUp ? "Already have an account?" : "Don't have one?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isSignUp ? "signin" : "signup")}
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
};

// ─── Shell — background + card ──────────────────────────────────────
const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-4 md:p-6 font-sans">
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
