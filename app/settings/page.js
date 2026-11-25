"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { disableWebPush, enableWebPush, needsHomeScreenInstall, pushSupported, webPushEnabled } from "@/lib/webPush";
import { ChevronLeftIcon, BellIcon, CheckIcon, LogOutIcon, GlobeIcon } from "@/components/icons";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "pt", name: "Português" },
];

// Browser notifications: on / off for THIS browser
function PushSetting({ uid }) {
  const [state, setState] = useState("loading"); // loading | unsupported | iphone | blocked | off | on
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    if (needsHomeScreenInstall()) return setState("iphone");
    if (!(await pushSupported())) return setState("unsupported");
    if (Notification.permission === "denied") return setState("blocked");
    setState(webPushEnabled(uid) ? "on" : "off");
  };
  useEffect(() => { refresh(); }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const turnOn = async () => {
    setBusy(true); setMsg("");
    const r = await enableWebPush(uid);
    setBusy(false);
    if (!r.ok && r.reason !== "denied" && r.reason !== "not-granted") {
      const why = {
        "no-vapid": "The website is missing its VAPID key (NEXT_PUBLIC_FIREBASE_VAPID_KEY in Vercel). Add it and redeploy.",
        "sw-failed": "The notification service worker didn't load. Check that /firebase-messaging-sw.js opens on the site.",
        "token-failed": "Firebase refused to give a token. Check the VAPID key matches this Firebase project, and that the Firebase Installations / FCM Registration APIs are enabled.",
        "save-failed": "Got a token but couldn't save it to your account (Firestore rules).",
        unsupported: "This browser can't do notifications.",
      }[r.reason] || "Something went wrong.";
      setMsg(`Couldn't turn notifications on (${r.reason || "error"}). ${why}`);
    }
    refresh();
  };
  const turnOff = async () => {
    setBusy(true); setMsg("");
    await disableWebPush(uid);
    setBusy(false);
    refresh();
  };

  const sub = {
    loading: "Checking...",
    unsupported: "This browser doesn't support notifications.",
    iphone: "On iPhone: tap Share, then Add to Home Screen, and open Liduka from there to turn this on.",
    blocked: "Blocked. Click the lock icon next to the web address, set Notifications to Allow, then reload.",
    off: "Get alerts for orders and updates, even when Liduka is closed.",
    on: "On for this browser. You'll get alerts even when Liduka is closed.",
  }[state];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
            <BellIcon size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">Browser notifications</p>
            <p className="text-xs text-ink-500">{sub}</p>
          </div>
        </div>
        {(state === "off" || state === "on") && (
          <button
            onClick={state === "on" ? turnOff : turnOn}
            disabled={busy}
            className={`${state === "on" ? "btn-outline" : "btn-primary"} shrink-0 px-4 py-2 text-xs`}
          >
            {busy ? "..." : state === "on" ? "Turn off" : "Turn on"}
          </button>
        )}
      </div>
      {msg && <p className="mt-2 text-xs font-semibold text-rose-600">{msg}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useSettings();

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
      router.replace("/login");
    }
  };

  return (
    <div className="container-page py-6 max-w-2xl min-h-dvh">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100 text-ink-700">
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-ink-900">{t.settings}</h1>
        <div className="w-9" />
      </div>

      {/* Language */}
      <h2 className="mb-3 ml-1 text-xs font-bold uppercase tracking-wider text-ink-400">
        {t.language}
      </h2>
      <div className="mb-8 rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm">
        {LANGUAGES.map((lang, idx) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex w-full items-center justify-between p-4 transition hover:bg-ink-50 ${
              idx !== LANGUAGES.length - 1 ? "border-b border-ink-50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                <GlobeIcon size={18} />
              </span>
              <span className="text-sm font-semibold text-ink-900">{lang.name}</span>
            </div>
            {language === lang.code && (
              <CheckIcon size={20} className="text-brand-600" />
            )}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {user?.uid && (
        <>
          <h2 className="mb-3 ml-1 text-xs font-bold uppercase tracking-wider text-ink-400">
            {t.notifications || "Notifications"}
          </h2>
          <div className="mb-8 rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm">
            <PushSetting uid={user.uid} />
          </div>
        </>
      )}

      {/* About */}
      <h2 className="mb-3 ml-1 text-xs font-bold uppercase tracking-wider text-ink-400">
        {t.about}
      </h2>
      <div className="mb-8 rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-ink-50">
          <span className="text-sm text-ink-500">{t.version}</span>
          <span className="text-sm font-semibold text-ink-900">1.0.0 </span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-ink-500">{t.marketplace}</span>
          <span className="text-sm font-semibold text-ink-900">Liduka</span>
        </div>
      </div>
    </div>
  );
}