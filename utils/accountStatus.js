// utils/accountStatus.js
// Is this signed-in account blocked? users/{uid}: status "active" (default) | "suspended" | "banned",
// statusReason (text) and suspendedUntil (Timestamp; the suspension lifts itself after it).
const untilMs = (v) => (v && typeof v.toMillis === "function" ? v.toMillis() : Number(v) || 0);

// -> null when fine, otherwise { kind, title, message, reason, until }
export function blockInfo(u) {
  if (!u) return null;
  const s = String(u.status || "active").toLowerCase();
  if (s === "banned") {
    return { kind: "banned", title: "Account closed", message: "This account has been closed and can't be used on Liduka.", reason: u.statusReason || "", until: 0 };
  }
  if (s === "suspended") {
    const until = untilMs(u.suspendedUntil);
    if (until && until <= Date.now()) return null;
    return { kind: "suspended", title: "Account suspended", message: "Your account is suspended, so you can't buy, sell or use your wallet for now.", reason: u.statusReason || "", until };
  }
  return null;
}