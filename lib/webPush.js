// lib/webPush.js — browser push with Firebase Cloud Messaging.
// Tokens are saved in users/{uid}.fcmTokens (the same array the phone app uses).
// Everything logs to the browser console with the prefix [push]. To check your setup, open the console and run:
//     lidukaPushCheck()
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { app, db } from "@/lib/firebase";
import { showToast } from "@/utils/toast";

const TAG = "[push]";
const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const SW_PATH = "/firebase-messaging-sw.js";
const SW_SCOPE = "/firebase-cloud-messaging-push-scope"; // the scope FCM uses, so it never clashes with another worker
const cacheKey = (uid) => `@liduka_webfcm_${uid}`;

const log = (...a) => console.log(TAG, ...a);
const warn = (...a) => console.warn(TAG, ...a);
const fail = (...a) => console.error(TAG, ...a);

const cfg = () => ({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const swUrl = () => {
  const p = new URLSearchParams();
  Object.entries(cfg()).forEach(([k, v]) => v && p.set(k, v));
  return `${SW_PATH}?${p.toString()}`;
};

const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

export async function pushSupported() {
  try {
    return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && (await isSupported());
  } catch {
    return false;
  }
}

// true when this browser has permission AND its token is saved on the account
export const webPushEnabled = (uid) => {
  try {
    return typeof Notification !== "undefined" && Notification.permission === "granted" && !!localStorage.getItem(cacheKey(uid));
  } catch {
    return false;
  }
};

export const needsHomeScreenInstall = () => isIOS() && !isStandalone(); // iPhone Safari only allows web push for an installed app

async function waitActive(reg) {
  const sw = reg.installing || reg.waiting || reg.active;
  if (!sw || sw.state === "activated") return reg;
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("the service worker did not activate in 10s")), 10000);
    sw.addEventListener("statechange", () => {
      if (sw.state === "activated") { clearTimeout(t); resolve(); }
      if (sw.state === "redundant") { clearTimeout(t); reject(new Error("the service worker was rejected (check the file loads without errors)")); }
    });
  });
  return reg;
}

let listening = false;
function listenForeground(messaging) {
  if (listening) return;
  listening = true;
  // While the site is open the browser shows nothing by itself: the bell already updates, so we add a small toast.
  onMessage(messaging, (payload) => {
    log("message received while the site is open:", payload);
    const n = payload.notification || {};
    if (n.title || n.body) showToast(n.body || n.title);
  });
}

/** Turns push on for this browser. prompt=false never opens the permission popup (used for silent refresh). */
export async function enableWebPush(uid, { prompt = true } = {}) {
  try {
    if (!uid) return { ok: false, reason: "no-user" };
    if (!(await pushSupported())) {
      warn("This browser can't do web push" + (needsHomeScreenInstall() ? " (on iPhone, add Liduka to the Home Screen first)." : "."));
      return { ok: false, reason: "unsupported" };
    }
    if (!VAPID) {
      fail("NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing. Firebase console > Project settings > Cloud Messaging > Web Push certificates > Generate key pair, then add it to .env.local (and Vercel) and restart.");
      return { ok: false, reason: "no-vapid" };
    }

    let permission = Notification.permission;
    if (permission === "default" && prompt) {
      log("asking the browser for permission...");
      permission = await Notification.requestPermission();
    }
    if (permission === "denied") {
      warn("notifications are blocked for this site. Click the lock icon in the address bar > Notifications > Allow, then reload.");
      return { ok: false, reason: "denied" };
    }
    if (permission !== "granted") {
      if (prompt) warn("permission was dismissed without an answer.");
      return { ok: false, reason: "not-granted" };
    }

    let reg;
    try {
      reg = await navigator.serviceWorker.register(swUrl(), { scope: SW_SCOPE });
      await waitActive(reg);
      log("service worker ready, scope:", reg.scope);
    } catch (e) {
      fail("could not start the service worker:", e?.message || e, `- open ${SW_PATH} in the browser: it must show JavaScript (a 404 means public/firebase-messaging-sw.js is missing; a redirect means a login/middleware rule is catching it).`);
      return { ok: false, reason: "sw-failed" };
    }

    const messaging = getMessaging(app);
    let token;
    try {
      token = await getToken(messaging, { vapidKey: VAPID, serviceWorkerRegistration: reg });
    } catch (e) {
      const code = e?.code || "";
      fail("could not get a token:", code || e?.message || e,
        code.includes("token-subscribe-failed")
          ? "- check that the 'Firebase Cloud Messaging API (V1)' is Enabled and that the VAPID key belongs to this Firebase project."
          : code.includes("permission-blocked") ? "- notifications are blocked in the browser." : "");
      return { ok: false, reason: "token-failed" };
    }
    if (!token) {
      fail("Firebase returned no token.");
      return { ok: false, reason: "token-failed" };
    }
    listenForeground(messaging);

    try {
      if (localStorage.getItem(cacheKey(uid)) !== token) {
        await updateDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) });
        localStorage.setItem(cacheKey(uid), token);
        log("token saved on your account ...", token.slice(-8));
      } else {
        log("token already saved ...", token.slice(-8));
      }
    } catch (e) {
      fail("got a token but could not save it to Firestore:", e?.code || e?.message || e, "- your Firestore rules must let a user update their own fcmTokens field.");
      return { ok: false, reason: "save-failed" };
    }
    return { ok: true, token };
  } catch (e) {
    fail("unexpected problem:", e?.message || e);
    return { ok: false, reason: "error" };
  }
}

/** Turns push off for this browser (call on logout too). */
export async function disableWebPush(uid) {
  try {
    const token = localStorage.getItem(cacheKey(uid));
    if (uid && token) await updateDoc(doc(db, "users", uid), { fcmTokens: arrayRemove(token) });
    localStorage.removeItem(cacheKey(uid));
    await deleteToken(getMessaging(app));
    log("push turned off for this browser.");
  } catch (e) {
    warn("could not fully turn push off:", e?.message || e);
  }
}

/** Console report: run lidukaPushCheck() */
export async function diagnose() {
  const c = cfg();
  const rows = {};
  const add = (name, ok, note = "") => { rows[name] = { ok: ok ? "yes" : "NO", note }; };

  add("secure page (https or localhost)", typeof window !== "undefined" && window.isSecureContext, "web push only works on https");
  add("browser supports push", await pushSupported(), needsHomeScreenInstall() ? "iPhone: add Liduka to the Home Screen first" : "");
  add("permission", Notification.permission === "granted", `now: ${Notification.permission}`);
  add("VAPID key set", !!VAPID, "NEXT_PUBLIC_FIREBASE_VAPID_KEY");
  add("Firebase settings set", !!(c.apiKey && c.projectId && c.messagingSenderId && c.appId), "NEXT_PUBLIC_FIREBASE_*");

  try {
    const r = await fetch(SW_PATH, { cache: "no-store" });
    const type = r.headers.get("content-type") || "";
    add("service worker file reachable", r.ok && /javascript/.test(type), `${SW_PATH} -> ${r.status} ${type}`);
  } catch (e) {
    add("service worker file reachable", false, e?.message || "");
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    add("service worker running", !!reg?.active, reg ? `state: ${reg.active ? "active" : "not active"}` : "not registered yet");
  } catch {
    add("service worker running", false);
  }
  const uidKeys = Object.keys(localStorage).filter((k) => k.startsWith("@liduka_webfcm_"));
  add("token saved on this browser", uidKeys.length > 0, uidKeys.length ? "" : "turn notifications on from the Notifications page");

  console.log(TAG, "check:");
  console.table(rows);
  const bad = Object.entries(rows).filter(([, v]) => v.ok === "NO").map(([k]) => k);
  console.log(TAG, bad.length ? `problems: ${bad.join(", ")}` : "everything on this browser looks fine. If alerts still don't arrive, look at the function logs (Firebase console > Functions > Logs) for lines starting [push].");
  return rows;
}

if (typeof window !== "undefined") window.lidukaPushCheck = diagnose;