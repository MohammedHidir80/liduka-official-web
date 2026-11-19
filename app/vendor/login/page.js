"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { getAuthError } from "@/lib/auth";
import { findInvite, claimInvite } from "@/lib/vendorInvites";
import { getGeoCurrency } from "@/utils/getGeoCurrency";
import { getUserLocation } from "@/utils/getUserLocation";
import { normalizePhone, isValidPhone } from "@/utils/phone";
import AuthHero from "@/components/AuthHero";
import DetectedCountry from "@/components/DetectedCountry";
import {
  MailIcon, LockIcon, StoreIcon, KeyIcon, EyeIcon, EyeOffIcon,
} from "@/components/icons";

const SUPPORT_EMAIL = "support@liduka.com";

// Passwords people use everywhere. Checked on the lower-cased password.
const COMMON = [
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "iloveyou", "welcome1", "welcome123", "admin123", "letmein123", "abc12345", "liduka", "liduka123",
  "ghana123", "nigeria123", "kenya123", "football1", "11111111", "00000000", "asdfghjkl",
];

// Required rules block signup; "special" and length 12+ only raise the strength.
function checkPassword(pw, { email = "", name = "" } = {}) {
  const lower = pw.toLowerCase();
  const local = email.split("@")[0].toLowerCase();
  const first = name.trim().split(/\s+/)[0]?.toLowerCase() || "";
  const rules = [
    { id: "len", label: "At least 8 characters", ok: pw.length >= 8 },
    { id: "lower", label: "A lowercase letter", ok: /[a-z]/.test(pw) },
    { id: "upper", label: "An uppercase letter", ok: /[A-Z]/.test(pw) },
    { id: "num", label: "A number", ok: /\d/.test(pw) },
  ];
  const common = COMMON.some((c) => lower === c || (c.length >= 6 && lower.includes(c)));
  const personal = (local.length >= 4 && lower.includes(local)) || (first.length >= 4 && lower.includes(first));
  const requiredOk = rules.every((r) => r.ok) && !common && !personal;
  const special = /[^A-Za-z0-9]/.test(pw);
  let score = rules.filter((r) => r.ok).length - 1; // 0..3
  if (special) score += 1;
  if (pw.length >= 12) score += 1;
  if (common || personal) score = 0;
  const level = !pw ? 0 : !requiredOk ? Math.min(score, 1) : score >= 4 ? 4 : score >= 3 ? 3 : 2;
  return { rules, common, personal, requiredOk, level };
}
const STRENGTH = [
  null,
  { label: "Weak", bar: "bg-rose-500", text: "text-rose-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600" },
];

export default function VendorAuthPage() {
  const router = useRouter();
  const { loginWithCredentials, signup } = useAuth();
  const { t } = useSettings();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { title, message, action? }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [geo, setGeo] = useState("checking"); // country from the IP: checking | ok | unsupported | error

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const fail = (title, message, action = null) => setNotice({ title, message, action });

  const switchMode = (signUp) => {
    setIsSignUp(signUp);
    setNotice(null);
  };

  const pwCheck = checkPassword(password, { email, name: fullName });

  const handleAuth = async (e) => {
    e.preventDefault();
    setNotice(null);

    const phoneNorm = normalizePhone(phone);

    // Same validation order as mobile
    if (isSignUp) {
      if (!email.trim() || !password.trim() || !fullName.trim() || !confirmPassword.trim())
        return fail("Missing Info", "Please fill all fields.");
      if (password !== confirmPassword) return fail("Password Mismatch", "Passwords don't match.");
      if (!pwCheck.requiredOk)
        return fail(
          "Choose a stronger password",
          pwCheck.common
            ? "That password is too common. Pick something only you would know."
            : pwCheck.personal
            ? "Your password shouldn't contain your name or email."
            : "Use at least 8 characters with a lowercase letter, an uppercase letter and a number."
        );
      if (!inviteCode.trim()) return fail("Invite Code Required", "Please enter your invite code.");
      if (geo !== "ok") return fail("Country", geo === "unsupported" ? "Liduka isn't available in your country yet." : "We need to confirm your country first. Please wait or tap Retry.");
      if (phone.trim() && !isValidPhone(phoneNorm))
        return fail("Invalid Phone", "Please enter a valid phone number, or leave it empty.");
    } else if (!email.trim() || !password.trim()) {
      return fail("Missing Info", "Please fill all fields.");
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // 1) Check the code before creating anything (same as mobile)
        const inviteRef = await findInvite(inviteCode);

        // 2) Currency by IP and shop location by GPS
        const [geoInfo, userLocation] = await Promise.all([
          getGeoCurrency(),
          getUserLocation(),
        ]);

        if (!userLocation?.region) {
          const go = window.confirm(
            "We couldn't detect your shop location, so buyers near you won't see your products first. " +
              "You can set it later in your profile. Continue anyway?"
          );
          if (!go) return;
        }

        // 3) Create the account. The invite is claimed in the middle of it, and the
        //    account is removed again if someone else took the code first.
        const newUser = await signup({
          name: fullName,
          email,
          phone: phoneNorm,
          password,
          role: "vendor",
          geoInfo,
          userLocation,
          beforeProfile: (u) => claimInvite(inviteRef, u.uid),
        });

        try {
          await addDoc(collection(db, "notifications", newUser.uid, "userNotifications"), {
            type: "welcome_vendor",
            message: "🎉 Welcome to the Vendor Hub!",
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.log("Notification error:", err);
        }

        router.replace(`/vendor/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else {
        await loginWithCredentials(email, password, "vendor");
        router.replace("/vendor");
      }
    } catch (err) {
      console.log("Vendor auth error:", err);
      if (err?.code === "auth/password-does-not-meet-requirements") {
        return fail("Choose a stronger password", "Use at least 8 characters with a lowercase letter, an uppercase letter and a number.");
      }
      const { title, message } = getAuthError(err);
      fail(
        title,
        message,
        err.code === "app/email-not-verified"
          ? {
              href: `/vendor/verify-email?email=${encodeURIComponent(email.trim())}`,
              label: "Resend verification email",
            }
          : null
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-ink-50">
      <AuthHero
        tagline="Grow your business with Liduka."
        sub="Join vendors selling to customers across Africa. Manage your products, track orders, and get paid securely."
      />

      <div className="relative z-10 mx-auto -mt-12 w-full max-w-md px-4 pb-12">
        <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold text-ink-900">
              {isSignUp ? t.vendorRegister || "Vendor Registration" : t.vendorLogin || "Vendor Login"}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {isSignUp
                ? t.vendorSubRegister || "Start selling on our marketplace"
                : t.vendorSubLogin || "Welcome back to your dashboard"}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="mb-8 flex rounded-xl bg-ink-100 p-1">
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
                !isSignUp ? "bg-white text-brand-600 shadow-sm" : "text-ink-500 hover:text-ink-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
                isSignUp ? "bg-white text-brand-600 shadow-sm" : "text-ink-500 hover:text-ink-700"
              }`}
            >
              Register
            </button>
          </div>

          {notice && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              <p className="font-bold">{notice.title}</p>
              <p>{notice.message}</p>
              {notice.action && (
                <Link href={notice.action.href} className="mt-1 inline-block font-bold underline">
                  {notice.action.label}
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5" noValidate>
            {isSignUp && <DetectedCountry onResult={setGeo} />}

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-600">
                {t.businessEmail || "Business Email"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                  <MailIcon size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="vendor@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {isSignUp && (
              <>
                {/* Business name */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-600">
                    {t.businessName || "Business Name"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                      <StoreIcon size={18} />
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input pl-10"
                      placeholder="e.g. TechNova Gadgets"
                      autoComplete="organization"
                    />
                  </div>
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-600">
                    Phone <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="e.g. 0241234567"
                    autoComplete="tel"
                  />
                  <p className="mt-1 text-[11px] text-ink-400">
                    Delivery riders use this to reach you for pickups.
                  </p>
                </div>

                {/* Invite code */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-600">
                    {t.inviteCode || "Invite Code"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                      <KeyIcon size={18} />
                    </span>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="input pl-10 font-mono uppercase"
                      placeholder="Enter your invite code"
                      autoComplete="off"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">
                    Invite codes are issued by Liduka. Don't have one?{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-brand-600 hover:underline">
                      Contact us
                    </a>
                    .
                  </p>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-600">
                {t.password || "Password"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                  <LockIcon size={18} />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {isSignUp && password && (
              <div className="-mt-2">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => (
                    <span key={n} className={`h-1.5 flex-1 rounded-full ${pwCheck.level >= n ? STRENGTH[pwCheck.level].bar : "bg-ink-100"}`} />
                  ))}
                </div>
                <p className={`mt-1 text-xs font-bold ${STRENGTH[pwCheck.level]?.text || "text-ink-400"}`}>
                  {STRENGTH[pwCheck.level]?.label || ""}
                </p>
                <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                  {pwCheck.rules.map((r) => (
                    <li key={r.id} className={r.ok ? "text-emerald-600" : "text-ink-400"}>
                      {r.ok ? "✓" : "○"} {r.label}
                    </li>
                  ))}
                </ul>
                {(pwCheck.common || pwCheck.personal) && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {pwCheck.common ? "That password is too common." : "Avoid your name or email in your password."}
                  </p>
                )}
              </div>
            )}

            {!isSignUp && (
              <div className="-mt-2 flex justify-end">
                <Link
                  href="/vendor/forgot-password"
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  {t.forgotPassword || "Forgot password?"}
                </Link>
              </div>
            )}

            {/* Confirm password */}
            {isSignUp && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink-600">
                  {t.confirmPassword || "Confirm Password"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                    <LockIcon size={18} />
                  </span>
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                    aria-label={showConfirmPw ? "Hide password" : "Show password"}
                  >
                    {showConfirmPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>
            )}

            {isSignUp && (
              <p className="text-xs text-ink-500">
                We'll ask for your location so buyers near you see your products first.
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-3.5">
              {loading
                ? isSignUp
                  ? "Creating Account..."
                  : "Signing In..."
                : isSignUp
                ? t.registerBusiness || "Register Business"
                : "Log In"}
            </button>
          </form>

        </div>

        <div className="mt-8 text-center text-sm">
          <span className="text-ink-500">{t.wantToShop || "Want to shop instead?"} </span>
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            {t.loginAsBuyer || "Login as Buyer"}
          </Link>
        </div>
      </div>
    </div>
  );
}