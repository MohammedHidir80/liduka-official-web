"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { getAuthError } from "@/lib/auth";
import { MailIcon, CheckCircleIcon, InfoIcon, StoreIcon } from "@/components/icons";

const RESEND_COOLDOWN = 60; // seconds

const CONFIG = {
  buyer: { home: "/", login: "/login", Icon: MailIcon },
  vendor: { home: "/vendor", login: "/vendor/login", Icon: StoreIcon },
};

function VerifyEmailContent({ role }) {
  const cfg = CONFIG[role] || CONFIG.buyer;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, ready, firebaseUser, refreshUser, resendVerification } = useAuth();
  const { t } = useSettings();

  const email = searchParams.get("email") || firebaseUser?.email || "your email";

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type, title, message }
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // No session at all (e.g. opened in a new browser) -> go to login
  useEffect(() => {
    if (ready && !firebaseUser) router.replace(cfg.login);
  }, [ready, firebaseUser, router, cfg.login]);

  // Verified and profile loaded -> go to this role's home
  useEffect(() => {
    if (ready && user?.role === role) router.replace(cfg.home);
  }, [ready, user, role, router, cfg.home]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleVerify = async () => {
    setNotice(null);
    setLoading(true);
    try {
      const verified = await refreshUser();
      if (verified) {
        setNotice({ type: "success", title: "Email Verified 🎉", message: "Taking you to your account..." });
      } else {
        setNotice({
          type: "error",
          title: "Not Verified Yet",
          message: "Please check your email and click the link.",
        });
      }
    } catch (err) {
      console.log("Verify error:", err);
      const { title, message } = getAuthError(err);
      setNotice({ type: "error", title, message });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setNotice(null);
    setResending(true);
    try {
      await resendVerification();
      setCooldown(RESEND_COOLDOWN);
      setNotice({ type: "success", title: "Email Sent", message: "We sent you a new verification link." });
    } catch (err) {
      console.log("Resend error:", err);
      const { title, message } = getAuthError(err);
      setNotice({ type: "error", title, message });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 grid h-28 w-28 place-items-center rounded-full bg-indigo-50 text-brand-600">
          <cfg.Icon size={56} strokeWidth={1.5} />
        </div>

        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-ink-900">
          {role === "vendor" ? "Verify Vendor Email" : t.verifyTitle}
        </h1>

        <div className="mb-6 w-full rounded-2xl border border-ink-100 bg-ink-50 p-6">
          <p className="mb-4 text-sm text-ink-500">{t.verifySub}</p>

          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-3">
            <MailIcon size={16} className="text-brand-600" />
            <span className="truncate text-sm font-bold text-brand-600">{email}</span>
          </div>

          <div className="mb-6 h-px w-full bg-ink-200" />

          <div className="space-y-4 text-left">
            {[t.verifyStep1, t.verifyStep2, t.verifyStep3].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-ink-600">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {notice && (
          <div
            role="alert"
            className={`mb-4 w-full rounded-xl border px-4 py-3 text-left text-sm ${
              notice.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <p className="font-bold">{notice.title}</p>
            <p>{notice.message}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || !ready || !firebaseUser}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-70"
        >
          {loading ? (
            "Verifying..."
          ) : (
            <>
              <CheckCircleIcon size={20} /> {t.iveVerified}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || !firebaseUser}
          className="mt-4 text-sm font-semibold text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline"
        >
          {resending
            ? "Sending..."
            : cooldown > 0
            ? `Resend email in ${cooldown}s`
            : "Resend verification email"}
        </button>

        <div className="mt-6 flex items-center gap-2 rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-500">
          <InfoIcon size={14} />
          <span>{t.noEmail}</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailFlow({ role = "buyer" }) {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center">Loading...</div>}>
      <VerifyEmailContent role={role} />
    </Suspense>
  );
}