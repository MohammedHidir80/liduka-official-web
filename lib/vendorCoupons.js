import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const MAX_ACTIVE = 2;
export const MAX_PERCENT = 50;

export function generateCode(vendorId, length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${vendorId ? vendorId.slice(0, 3).toUpperCase() : "LDK"}${out}`;
}

export async function createCoupon({ vendorId, code, discountValue, isActive, categories, activeCount }) {
  const n = Number(discountValue);
  if (!code) throw new Error("Coupon code cannot be empty.");
  if (!/^[A-Z0-9]{3,20}$/.test(code)) throw new Error("Code must be 3–20 letters/numbers, no spaces.");
  if (isNaN(n) || n <= 0) throw new Error("Discount must be a positive number.");
  if (n > MAX_PERCENT) throw new Error(`Percentage discount cannot exceed ${MAX_PERCENT}%.`);
  if (isActive && activeCount >= MAX_ACTIVE)
    throw new Error(`You already have ${MAX_ACTIVE} active coupons. Deactivate one to create another.`);

  const existing = await getDoc(doc(db, "allCoupons", code));
  if (existing.exists() && !existing.data().deleted)
    throw new Error("That code is already taken. Choose another one.");

  const data = {
    type: "vendor",
    vendorId,
    code,
    discountType: "percentage",
    discountValue: n,
    overallLimit: null,
    isActive: !!isActive,
    status: isActive ? "active" : "inactive",
    appliesTo: categories.length ? categories.map((c) => c.trim()) : null,
    totalUsed: 0,
    totalUsers: 0,
    createdAt: serverTimestamp(),
  };
  // Overwrites a previously deleted doc with the same code, so old usage data is reset
  await setDoc(doc(db, "vendorCoupons", vendorId, "coupons", code), data);
  await setDoc(doc(db, "allCoupons", code), data);
}

export async function setCouponActive(vendorId, coupon, active, activeCount) {
  if (active && activeCount >= MAX_ACTIVE)
    throw new Error(`You already have ${MAX_ACTIVE} active coupons. Deactivate one first.`);
  const patch = { isActive: active, status: active ? "active" : "inactive" };
  await setDoc(doc(db, "vendorCoupons", vendorId, "coupons", coupon.code), patch, { merge: true });
  await setDoc(doc(db, "allCoupons", coupon.code), patch, { merge: true });
}

export async function deleteCoupon(vendorId, coupon) {
  const patch = { deleted: true, isActive: false, status: "deleted" };
  await setDoc(doc(db, "vendorCoupons", vendorId, "coupons", coupon.code), patch, { merge: true });
  await setDoc(
    doc(db, "allCoupons", coupon.code),
    { ...patch, deletedBy: vendorId, deletedAt: serverTimestamp() },
    { merge: true }
  );
}