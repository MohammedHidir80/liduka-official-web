"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import { sendResetEmail, getAuthError } from "@/lib/auth";
import { MailIcon, ChevronLeftIcon, InfoIcon } from "@/components/icons";

const RESEND_COOLDOWN = 60; // seconds
const EMAIL_RE = /^\S+@\S+\.\S+$/; // same check as mobile

export default function ForgotPasswordFlow({ role = "buyer" }) {
  const router = useRouter();
  const { t } = useSettings();

  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Check Email
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const loginPath = role === "vendor" ? "/vendor/login" : "/login";

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendLink = async () => {
    setError("");

    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    setLoading(true);
    try {
      await sendResetEmail(email);
      setCooldown(RESEND_COOLDOWN);
      return true;
    } catch (err) {
      console.log("Password reset failed:", err);
      const { message } = getAuthError(err);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSendLink = async (e) => {
    e.preventDefault();
    const ok = await sendLink();
    if (ok) setStep(2);
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    await sendLink();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back Button */}
        <button
          onClick={() => router.push(loginPath)}
          className="mb-6 grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm text-ink-500 hover:text-ink-900 transition"
          aria-label="Back to login"
        >
          <ChevronLeftIcon size={20} />
        </button>

        <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8 relative overflow-hidden">

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 mb-2">
                {t.forgotPasswordTitle || "Forgot Password?"}
              </h1>
              <p className="text-sm text-ink-500 mb-6">
                {t.forgotPasswordSub || "Enter your email and we'll send you a link to reset your password."}
              </p>

              <form onSubmit={handleSendLink} className="space-y-5" noValidate>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-600">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><MailIcon size={18} /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                  {error && <p className="mt-2 text-xs font-semibold text-rose-500">{error}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? "Sending..." : (t.sendResetLink || "Send Reset Link")}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Check Your Email */}
          {step === 2 && (
            <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2">
              <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-600">
                <MailIcon size={40} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 mb-2">
                {t.checkYourEmail || "Check Your Email"}
              </h1>
              <p className="text-sm text-ink-500 mb-6">
                {t.resetLinkSentSub || "We've sent a password reset link to"} <br />
                <span className="font-bold text-ink-900">{email.trim()}</span>
              </p>

              <div className="w-full rounded-xl bg-amber-50 p-4 border border-amber-200 text-sm text-amber-800 mb-6 text-left flex items-start gap-3">
                <InfoIcon size={18} className="shrink-0 mt-0.5" />
                <p>{t.clickLinkToReset || "Click the link in the email to set a new password."} Check your spam folder if you don't see it.</p>
              </div>

              {error && <p className="mb-4 text-xs font-semibold text-rose-500">{error}</p>}

              <button
                onClick={() => router.push(loginPath)}
                className="btn-primary w-full py-3 mb-4"
              >
                {t.backToLogin || "Back to Login"}
              </button>

              <button
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="text-xs font-bold text-ink-500 hover:text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-300 disabled:no-underline"
              >
                {loading
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend email in ${cooldown}s`
                  : (t.resendEmail || "Didn't receive the email? Resend")}
              </button>

              <button
                onClick={() => { setStep(1); setError(""); }}
                className="mt-3 text-xs font-bold text-ink-500 hover:text-brand-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}