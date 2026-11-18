"use client";
// app/auth/action/page.js — the page Firebase's emails link to (verify email + reset password), on your own domain.
// Firebase adds ?mode=...&oobCode=... to the link. Works for buyers and vendors, on web and for people who tapped the link from the mobile app.
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Logo from "@/components/logo";

function Shell({ children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size="text-4xl" /></div>
        <div className="rounded-3xl bg-white p-6 text-center shadow-card sm:p-8">{children}</div>
      </div>
    </div>
  );
}

const Links = () => (
  <div className="mt-6 flex flex-col gap-2">
    <Link href="/login" className="btn-primary w-full py-3">Log in as a buyer</Link>
    <Link href="/vendor/login" className="text-sm font-bold text-brand-600 hover:underline">Log in as a vendor</Link>
  </div>
);

function Inner() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const code = params.get("oobCode");
  const ran = useRef(false); // the code works once; stop React from using it twice in dev

  const [state, setState] = useState(mode === "verifyEmail" ? "working" : mode === "resetPassword" ? "checking" : "bad");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ran.current || !code) { if (!code) setState("bad"); return; }
    ran.current = true;
    if (mode === "verifyEmail") {
      applyActionCode(auth, code).then(() => setState("verified")).catch(() => setState("expired"));
    } else if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, code).then((e) => { setEmail(e); setState("reset"); }).catch(() => setState("expired"));
    } else setState("bad");
  }, [mode, code]);

  const submitReset = async (e) => {
    e.preventDefault();
    setMsg("");
    if (pw.length < 6) return setMsg("Password must be at least 6 characters.");
    if (pw !== pw2) return setMsg("Passwords do not match.");
    setBusy(true);
    try { await confirmPasswordReset(auth, code, pw); setState("resetDone"); }
    catch { setMsg("This link has expired. Please request a new one."); }
    finally { setBusy(false); }
  };

  if (state === "working" || state === "checking") return <Shell><p className="text-sm text-ink-500">One moment…</p></Shell>;

  if (state === "verified") return (
    <Shell>
      <h1 className="text-2xl font-extrabold text-ink-900">Email verified ✓</h1>
      <p className="mt-2 text-sm text-ink-500">Your email is confirmed. Go back to the Liduka app, or log in here.</p>
      <Links />
    </Shell>
  );

  if (state === "resetDone") return (
    <Shell>
      <h1 className="text-2xl font-extrabold text-ink-900">Password changed ✓</h1>
      <p className="mt-2 text-sm text-ink-500">You can now log in with your new password.</p>
      <Links />
    </Shell>
  );

  if (state === "reset") return (
    <Shell>
      <h1 className="text-2xl font-extrabold text-ink-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-500">{email}</p>
      <form onSubmit={submitReset} className="mt-5 space-y-3 text-left" noValidate>
        {msg && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{msg}</p>}
        <input type="password" className="input" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        <input type="password" className="input" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">{busy ? "Saving..." : "Save password"}</button>
      </form>
    </Shell>
  );

  return (
    <Shell>
      <h1 className="text-2xl font-extrabold text-ink-900">{state === "expired" ? "Link expired" : "Link not valid"}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {state === "expired"
          ? "This link has already been used or has expired. If you've already verified, just log in. Otherwise request a new email from the app."
          : "This link doesn't look right. Open the latest email we sent you and try again."}
      </p>
      <Links />
    </Shell>
  );
}

export default function ActionPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}