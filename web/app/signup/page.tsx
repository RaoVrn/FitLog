"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Mail, Lock, Loader2, Chrome, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "", width: "w-0" };
  if (pw.length < 6)   return { label: "Weak",   color: "bg-red-500",    width: "w-1/3" };
  if (pw.length < 9)   return { label: "Medium", color: "bg-yellow-400", width: "w-2/3" };
  return                      { label: "Strong", color: "bg-green-500",  width: "w-full" };
}

function mapFirebaseError(err: unknown): string {
  // Firebase errors expose a `code` property — use that, not message
  const code = (err as { code?: string }).code ?? "";
  if (code === "auth/email-already-in-use")  return "This email is already registered.";
  if (code === "auth/invalid-email")         return "Please enter a valid email address.";
  if (code === "auth/weak-password")         return "Password should be at least 6 characters.";
  if (code === "auth/popup-closed-by-user")  return "";
  if (code === "auth/cancelled-popup-request") return "";
  if (code.includes("api-key") || code.includes("invalid-api-key"))
    return "Firebase is not configured. Fill in your credentials in .env.local and restart the dev server.";
  if (code.includes("network-request-failed")) return "Network error. Check your internet connection.";
  // Fallback: show the raw code so it's debuggable
  const message = (err as Error).message ?? "";
  return code ? `Sign up failed (${code}).` : message || "Sign up failed. Please try again.";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const { signUp, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  // form state
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");

  // UI state
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched]         = useState({ email: false, password: false, confirm: false });
  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  // ── Real-time validation ───────────────────────────────────────────────────
  const emailError    = touched.email    && !EMAIL_RE.test(email)    ? "Enter a valid email address."    : "";
  const passwordError = touched.password && password.length < 6      ? "Minimum 6 characters required."  : "";
  const confirmError  = touched.confirm  && confirm !== password      ? "Passwords do not match."         : "";

  const isFormValid =
    EMAIL_RE.test(email) &&
    password.length >= 6 &&
    confirm === password;

  const strength = getStrength(password);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleBlur = useCallback((field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true });
    if (!isFormValid) return;

    setError("");
    setSubmitting(true);
    try {
      await signUp(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(mapFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      const mapped = mapFirebaseError(err);
      if (mapped) setError(mapped);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (loading) return null;

  const busy = submitting || googleLoading;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
            <Activity className="h-7 w-7 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            Create your <span className="text-green-400">FitLog</span> account
          </h1>
          <p className="mt-1 text-sm text-slate-500">Start tracking your fitness journey today</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-slate-800 p-8 shadow-xl ring-1 ring-slate-700/50">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-700 py-3 font-medium text-slate-200 ring-1 ring-slate-600 transition hover:bg-slate-600 disabled:opacity-50"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-800 px-3 text-slate-500">or sign up with email</span>
            </div>
          </div>

          {/* Firebase error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="you@example.com"
                  className={`w-full rounded-lg bg-slate-700 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none ring-1 transition focus:ring-green-500 ${
                    emailError ? "ring-red-500" : "ring-slate-600"
                  }`}
                />
              </div>
              {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="Min. 6 characters"
                  className={`w-full rounded-lg bg-slate-700 py-2.5 pl-10 pr-10 text-slate-100 placeholder-slate-500 outline-none ring-1 transition focus:ring-green-500 ${
                    passwordError ? "ring-red-500" : "ring-slate-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.label === "Weak"   ? "text-red-400"    :
                    strength.label === "Medium" ? "text-yellow-400" : "text-green-400"
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}
              {passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => handleBlur("confirm")}
                  placeholder="Repeat password"
                  className={`w-full rounded-lg bg-slate-700 py-2.5 pl-10 pr-10 text-slate-100 placeholder-slate-500 outline-none ring-1 transition focus:ring-green-500 ${
                    confirmError ? "ring-red-500" : "ring-slate-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmError && <p className="mt-1 text-xs text-red-400">{confirmError}</p>}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-green-400 hover:text-green-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
