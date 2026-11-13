// utils/currency.js
const SYMBOLS = { GHS: "₵", NGN: "₦", USD: "$", GBP: "£", EUR: "€", KES: "KSh" };
const CACHE_KEY = "Liduka.fx.v1";
const CACHE_MS = 12 * 60 * 60 * 1000;

const memory = new Map();
const inflight = new Map();
const failedAt = new Map();

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

// Returns null when no rate is available, so callers can show the original
// currency instead of a wrongly converted price (mobile falls back to 1).
export async function getExchangeRate(from, to) {
  if (!from || !to || from === to) return 1;
  const key = `${from}_${to}`;

  if (memory.has(key)) return memory.get(key);

  const cached = readCache()[key];
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    memory.set(key, cached.rate);
    return cached.rate;
  }

  if ((failedAt.get(key) || 0) > Date.now() - 60000) return null;
  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    try {
      const res = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}`);
      const data = await res.json();
      const rate = Number(data?.result);
      if (!rate || !Number.isFinite(rate)) throw new Error("No rate returned");

      memory.set(key, rate);
      try {
        const all = readCache();
        all[key] = { rate, ts: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(all));
      } catch {}
      return rate;
    } catch (e) {
      console.log("Exchange rate failed:", key, e?.message);
      failedAt.set(key, Date.now());
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export function formatPrice(amount, currency = "GHS") {
  const n = Number(amount) || 0;
  const text = Number.isInteger(n)
    ? n.toLocaleString("en-US")
    : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${SYMBOLS[currency] ?? `${currency} `}${text}`;
}