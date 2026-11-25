"use client";
// components/PushPrompt.js — a friendly "turn on notifications?" box, shown ONCE after login or sign-up.
// Browsers punish sites that open their permission popup out of the blue, so we ask politely first;
// the real browser popup only appears after the person taps "Turn on".
// "Not now" hides it for 7 days. It never shows if notifications are already on, blocked, or unsupported.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { enableWebPush, needsHomeScreenInstall, pushSupported } from "@/lib/webPush";
import { BellIcon } from "@/components/icons";

const HIDE_KEY = "@liduka_push_hide_until"; // same key as the card on the Notifications page
const DELAY_MS = 2500; // let the page appear first
const QUIET_PAGES = ["/checkout"];

export default function PushPrompt() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const uid = user?.uid;
  const quiet = QUIET_PAGES.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!uid || quiet) return;
    let off = false;
    const t = setTimeout(async () => {
      try {
        if (Number(localStorage.getItem(HIDE_KEY)) > Date.now()) return;
      } catch {}
      if (needsHomeScreenInstall() || !(await pushSupported())) return;
      if (Notification.permission !== "default") return; // already allowed, or blocked (the Settings page explains)
      if (!off) setShow(true);
    }, DELAY_MS);
    return () => { off = true; clearTimeout(t); };
  }, [uid, quiet]);

  if (!show || typeof document === "undefined") return null;

  const later = () => {
    try { localStorage.setItem(HIDE_KEY, String(Date.now() + 7 * 24 * 3600 * 1000)); } catch {}
    setShow(false);
  };
  const turnOn = async () => {
    setBusy(true);
    const r = await enableWebPush(uid);
    setBusy(false);
    setShow(false);
    if (!r.ok && r.reason !== "denied") later(); // don't nag again right away; details are in the console ([push])
  };

  const vendor = user?.role === "vendor";
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={later}>
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white"><BellIcon size={26} /></span>
        <h3 className="text-lg font-extrabold text-ink-900">Stay in the loop</h3>
        <p className="mt-1.5 text-sm text-ink-600">
          {vendor
            ? "Get an alert the moment a new order comes in, even when Liduka is closed."
            : "Get alerts for your orders and deliveries, even when Liduka is closed."}
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={later} disabled={busy} className="btn-outline flex-1 py-3">Not now</button>
          <button onClick={turnOn} disabled={busy} className="btn-primary flex-1 py-3">{busy ? "Turning on..." : "Turn on"}</button>
        </div>
        <p className="mt-3 text-[11px] text-ink-400">You can change this any time in Settings.</p>
      </div>
    </div>,
    document.body
  );
}