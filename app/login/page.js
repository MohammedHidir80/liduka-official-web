"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { getAuthError } from "@/lib/auth";
import { getGeoCurrency } from "@/utils/getGeoCurrency";
import { getUserLocation } from "@/utils/getUserLocation";
import {
  MailIcon, LockIcon, UserCircleIcon, EyeIcon, EyeOffIcon,
} from "@/components/icons";
import Logo from "@/components/logo";

const DIAL_CODES = [
  { code: "+233", label: "GH +233" },
  { code: "+234", label: "NG +234" },
  { code: "+254", label: "KE +254" },
  { code: "+225", label: "CI +225" },
  { code: "+228", label: "TG +228" },
  { code: "+27", label: "ZA +27" },
  { code: "+44", label: "GB +44" },
  { code: "+1", label: "US +1" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, loginWithCredentials, signup } = useAuth();
  const { t } = useSettings();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type, title, message }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [dialCode, setDialCode] = useState("+233");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTnC, setAcceptedTnC] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Already signed in as a buyer -> go home
  useEffect(() => {
    if (ready && user?.role === "buyer") router.replace("/");
  }, [ready, user, router]);

  const fail = (title, message) => {
    setNotice({ type: "error", title, message });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setNotice(null);

    // Same validation order as mobile
    if (isSignUp) {
      if (!acceptedTnC) return fail("Terms Required", "Please accept Terms & Conditions to continue.");
      if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim())
        return fail("Missing Information", "Please fill out all fields.");
      if (password !== confirmPassword) return fail("Password Mismatch", "Passwords do not match.");
    } else if (!email.trim() || !password.trim()) {
      return fail("Missing Information", "Please enter your email and password.");
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const [geoInfo, userLocation] = await Promise.all([
          getGeoCurrency(),
          getUserLocation(),
        ]);

        // Strip spaces and a leading 0 (0241234567 -> 241234567)
        const localPhone = phone.replace(/\D/g, "").replace(/^0+/, "");

        const newUser = await signup({
          name: fullName,
          email,
          phone: localPhone ? `${dialCode}${localPhone}` : "",
          password,
          role: "buyer",
          geoInfo,
          userLocation,
        });

        // Welcome notification (same doc shape as mobile)
        try {
          await addDoc(
            collection(db, "notifications", newUser.uid, "userNotifications"),
            {
              type: "welcome",
              message: "Welcome to the Liduka marketplace! We are happy to have you.",
              read: false,
              createdAt: serverTimestamp(),
            }
          );
        } catch (err) {
          console.log("Notification error:", err);
        }

        router.replace(`/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else {
        await loginWithCredentials(email, password, "buyer");
        router.replace("/");
      }
    } catch (err) {
      console.log("Auth Error:", err);
      const { title, message } = getAuthError(err);
      fail(title, message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((v) => !v);
    setNotice(null);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">

        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="text-4xl" />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
          <h2 className="mb-1 text-2xl font-extrabold text-ink-900">
            {isSignUp ? t.authTitleUp : t.authTitleIn}
          </h2>
          <p className="mb-6 text-sm text-ink-500">
            {isSignUp ? t.authSubUp : t.authSubIn}
          </p>

          {notice && (
            <div
              role="alert"
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${notice.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
            >
              <p className="font-bold">{notice.title}</p>
              <p>{notice.message}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4" noValidate>
            {/* Email */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><MailIcon size={18} /></span>
              <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" autoComplete="email" />
            </div>

            {/* Full Name */}
            {isSignUp && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><UserCircleIcon size={18} /></span>
                <input type="text" placeholder={t.fullName} value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-10" autoComplete="name" />
              </div>
            )}

            {/* Phone */}
            {isSignUp && (
              <div className="flex gap-2">
                <select value={dialCode} onChange={(e) => setDialCode(e.target.value)} className="input w-28 shrink-0 px-2" aria-label="Country code">
                  {DIAL_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input type="tel" placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} className="input" autoComplete="tel-national" />
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><LockIcon size={18} /></span>
              <input type={showPw ? "text" : "password"} placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" autoComplete={isSignUp ? "new-password" : "current-password"} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>

            {/* Confirm Password */}
            {isSignUp && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><LockIcon size={18} /></span>
                <input type={showConfirmPw ? "text" : "password"} placeholder={t.confirmPassword} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10 pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showConfirmPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            )}

            {/* Terms */}
            {isSignUp && (
              <label className="flex items-start gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={acceptedTnC} onChange={(e) => setAcceptedTnC(e.target.checked)} className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-xs text-ink-600 leading-tight">{t.termsText}</span>
              </label>
            )}
            {isSignUp && (
              <p className="text-xs text-ink-500">
                We'll ask for your location to show you products near you.
              </p>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
              {loading
                ? (isSignUp ? "Creating Account..." : "Signing In...")
                : (isSignUp ? t.signUpBtn : t.signInBtn)}
            </button>
          </form>

          {/* Forgot password (sign in only) */}
          {!isSignUp && (
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
                {t.forgotPassword}
              </Link>
            </div>
          )}

          {/* Toggle mode */}
          <div className="mt-6 text-center text-sm">
            <span className="text-ink-500">{isSignUp ? t.hasAccount : t.noAccount} </span>
            <button type="button" onClick={toggleMode} className="font-bold text-brand-600 hover:underline">
              {isSignUp ? t.signInBtn : t.signUpBtn}
            </button>
          </div>
        </div>

        {/* Vendor link */}
        <div className="mt-8 text-center text-sm">
          <span className="text-ink-500">{t.vendorPrompt} </span>
          <Link href="/vendor/login" className="font-bold text-brand-600 hover:underline">
            {t.vendorLink}
          </Link>
        </div>
      </div>
    </div>
  );
}