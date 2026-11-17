// utils/currency.js  (web) — same exports as before (getExchangeRate, formatPrice), new source:
// the shared Firestore document settings/exchangeRates, kept fresh by the refreshExchangeRates Cloud Function.
// 1 read, cached in memory and in the browser for 6 hours. No external API calls from the browser.
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SYMBOLS = {
  GHS: "₵", NGN: "₦", USD: "$", GBP: "£", EUR: "€", KES: "KSh", ZAR: "R", UGX: "USh", TZS: "TSh",
  RWF: "RF", XOF: "CFA", XAF: "FCFA", EGP: "E£", CAD: "CA$", AUD: "A$", INR: "₹", CNY: "¥", AED: "AED ",
};
const ZERO_DECIMAL = new Set(["JPY", "KRW", "UGX", "RWF", "XOF", "XAF", "VND"]);
const CACHE_KEY = "Liduka.fx.v2";
const CACHE_MS = 6 * 60 * 60 * 1000;
const STALE_MS = 48 * 60 * 60 * 1000;

let memory = null; // { rates, updatedAtMs, fetchedAt }
let inflight = null;
let failedAt = 0;

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  } catch {
    return null;
  }
}
function writeLocal(v) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(v));
  } catch {}
}

const fresh = (c) => c && Date.now() - c.fetchedAt < CACHE_MS;

export async function loadRates() {
  if (fresh(memory)) return memory;
  const local = readLocal();
  if (fresh(local)) {
    memory = local;
    return memory;
  }
  if (Date.now() - failedAt < 60000) return memory || local || null; // do not hammer after a failure
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "exchangeRates"));
      if (!snap.exists()) throw new Error("No exchange rates document yet");
      const d = snap.data();
      memory = { rates: d.rates || {}, updatedAtMs: Number(d.updatedAtMs) || 0, fetchedAt: Date.now() };
      writeLocal(memory);
      return memory;
    } catch (e) {
      console.log("Exchange rates failed:", e?.code || e?.message);
      failedAt = Date.now();
      return memory || local || null; // an older copy is better than no price
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// Returns null when no rate is available, so callers can show the original currency
// instead of a wrongly converted price.
export async function getExchangeRate(from, to) {
  if (!from || !to || from === to) return 1;
  const data = await loadRates();
  const a = data?.rates?.[from];
  const b = data?.rates?.[to];
  return a && b ? b / a : null;
}

// For notices such as "rates may be out of date"
export async function getRatesInfo() {
  const data = await loadRates();
  return { available: !!data, updatedAtMs: data?.updatedAtMs || 0, stale: !data || Date.now() - data.updatedAtMs > STALE_MS };
}

export const symbolFor = (currency) => SYMBOLS[currency] ?? `${currency} `;

export function formatPrice(amount, currency = "GHS") {
  const n = Number(amount) || 0;
  const zero = ZERO_DECIMAL.has(currency);
  const text =
    zero || Number.isInteger(n)
      ? Math.round(n).toLocaleString("en-US")
      : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbolFor(currency)}${text}`;
}

// Estimate shown to browsing buyers: "≈ KSh 1,250"
export const formatApprox = (amount, currency) => `≈ ${formatPrice(amount, currency)}`;