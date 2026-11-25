"use client";
// components/EnablePush.js — "Turn on notifications" card. Shows only when it is useful.
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { enableWebPush, needsHomeScreenInstall, pushSupported } from "@/lib/webPush";
import { BellIcon } from "@/components/icons";

const HIDE_KEY = "@liduka_push_hide_until";

export default function EnablePush() {
  const { user } = useAuth();
  const [state, setState] = useState("loading"); // loading | hidden | ask | blocked | iphone | working
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        if (Number(localStorage.getItem(HIDE_KEY)) > Date.now()) return !off && setState("hidden");
      } catch {}
      if (needsHomeScreenInstall()) return !off && setState("iphone");
      if (!(await pushSupported())) return !off && setState("hidden");
      const p = Notification.permission;
      if (!off) setState(p === "granted" ? "hidden" : p === "denied" ? "blocked" : "ask");
    })();
    return () => { off = true; };
  }, []);

  if (!user || state === "loading" || state === "hidden") return null;

  const later = () => {
    try { localStorage.setItem(HIDE_KEY, String(Date.now() + 7 * 24 * 3600 * 1000)); } catch {}
    setState("hidden");
  };

  const turnOn = async () => {
    setState("working");
    setMsg("");
    const r = await enableWebPush(user.uid);
    if (r.ok) return setState("hidden");
    if (r.reason === "denied") return setState("blocked");
    setState("ask");
    setMsg(
      r.reason === "not-granted" ? "No problem. You can turn them on any time."
        : "Couldn't turn notifications on. Press F12 and look at the Console for lines starting [push]."
    );
  };

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white"><BellIcon size={18} /></span>
      <div className="min-w-0 flex-1">
        {state === "blocked" ? (
          <>
            <p className="text-sm font-bold text-ink-900">Notifications are blocked</p>
            <p className="mt-0.5 text-xs text-ink-600">Click the lock icon next to the web address, set Notifications to Allow, then reload this page.</p>
          </>
        ) : state === "iphone" ? (
          <>
            <p className="text-sm font-bold text-ink-900">Get alerts on your iPhone</p>
            <p className="mt-0.5 text-xs text-ink-600">Tap Share, then &quot;Add to Home Screen&quot;, and open Liduka from there to turn notifications on.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-ink-900">Never miss an order or update</p>
            <p className="mt-0.5 text-xs text-ink-600">Turn on browser notifications to get alerts even when Liduka is closed.</p>
            {msg && <p className="mt-1 text-xs font-semibold text-rose-600">{msg}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={turnOn} disabled={state === "working"} className="btn-primary px-4 py-2 text-xs">
                {state === "working" ? "Turning on..." : "Turn on notifications"}
              </button>
              <button onClick={later} className="btn-outline px-4 py-2 text-xs">Not now</button>
            </div>
          </>
        )}
      </div>
      {state !== "ask" && state !== "working" && (
        <button onClick={later} aria-label="Dismiss" className="text-xs font-bold text-ink-400 hover:text-ink-600">Hide</button>
      )}
    </div>
  );
}