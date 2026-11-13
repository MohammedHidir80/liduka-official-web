// lib/placeOrder.js  — thin wrapper. All money/stock logic runs in the Cloud Function.
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

export const PLATFORM_WALLET_ID = "platform_wallet";
export const WALLET_CURRENCY = "GHS";
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Per-line discounts shown in the UI (the server recalculates the real ones)
export function allocateDiscounts(lines, perProductDiscounts = {}) {
  const used = new Set();
  return lines.map((l) => {
    if (used.has(l.id)) return 0;
    used.add(l.id);
    const d = Number(perProductDiscounts[l.id]) || 0;
    return Math.min(round2(d), round2(l.price * l.quantity));
  });
}

export const call = (name) => httpsCallable(getFunctions(getApp(), "us-central1"), name);

// Turns Firebase's "functions/failed-precondition" style errors into a plain message.
export const cleanError = (e) => {
  const m = String(e?.message || "Something went wrong.");
  return m.replace(/^.*?:\s*/, (x) => (/functions\//.test(x) ? "" : x));
};

export async function placeOrder({ lines, address, couponCode = "" }) {
  if (!lines?.length) throw new Error("Nothing to order.");
  if (!address) throw new Error("Select delivery address");
  try {
    const res = await call("placeOrder")({
      lines: lines.map((l) => ({ productId: l.id, variantId: l.variantId || null, quantity: l.quantity })),
      address,
      couponCode,
    });
    return res.data;
  } catch (e) {
    throw new Error(cleanError(e));
  }
}