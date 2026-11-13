import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";


export const validateAndApplyCoupon = async (couponCode, vendorId, products = [], buyerId) => {
  if (!couponCode) throw new Error("No coupon code entered");
  if (!Array.isArray(products) || products.length === 0) throw new Error("No products provided");

  const formattedCode = couponCode.trim().toUpperCase();
  const couponRef = doc(db, "allCoupons", formattedCode);
  const snap = await getDoc(couponRef);

  if (!snap.exists()) throw new Error("Invalid coupon code");
  const coupon = snap.data();
  const now = new Date();

  // ✅ Vendor restriction
  if (coupon.vendorId && coupon.vendorId !== vendorId) {
    throw new Error("This coupon is not valid for the selected vendor’s products");
  }

  // ✅ Expiration check
  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    throw new Error("This coupon has expired");
  }

  // ✅ Status check
  const status = coupon.status?.toLowerCase() || "inactive";
  if (status !== "active") throw new Error("This coupon is not currently active");

  // ✅ User usage limit check
  const userUses = (coupon.userUses || {})[buyerId] || 0;
  const perUserLimit = coupon.perUserLimit || 1;
  if (userUses >= perUserLimit) throw new Error("You’ve already used this coupon the maximum allowed times");

  // ✅ Determine applicable categories
  const appliesTo =
    Array.isArray(coupon.appliesTo) && coupon.appliesTo.length > 0
      ? coupon.appliesTo.map((c) => c.trim())
      : null;

  console.log("Coupon appliesTo:", appliesTo);

  let totalDiscount = 0;
  const perProductDiscounts = {};
  const discountValue = Number(coupon.discountValue) || 0;
  const discountType = coupon.discountType?.toLowerCase();

  // ✅ Apply coupon logic
  for (const p of products) {
    if (p.vendorId !== coupon.vendorId) {
      console.log(`Skipped ${p.title || p.name}: different vendor`);
      continue;
    }

    let productCategory = (p.category || "").trim();

    if (!productCategory && p.id) {
      try {
        const productSnap = await getDoc(doc(db, "products", p.id));
        if (productSnap.exists()) {
          const productData = productSnap.data();
          productCategory = (productData.category || "").trim();
        }
      } catch (err) {
        console.warn("Error fetching product category:", err);
      }
    }

    const categoryMatch = !appliesTo || appliesTo.includes(productCategory);
    if (!categoryMatch) {
      console.log(`Skipped ${p.title || p.name}: category not matched`);
      continue;
    }

    const quantity = p.quantity || 1;
    const productTotal = (p.price || 0) * quantity;
    let productDiscount = 0;

    if (discountType === "percentage") {
      productDiscount = (productTotal * discountValue) / 100;
    } else if (discountType === "fixed") {
      productDiscount = discountValue;
    }

    productDiscount = Math.min(productDiscount, productTotal);
    perProductDiscounts[p.id] = productDiscount;
    totalDiscount += productDiscount;
  }

  const totalPrice = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.quantity || 1),
    0
  );

  const finalPrice = Math.max(totalPrice - totalDiscount, 0);

  return {
    success: true,
    discount: totalDiscount,
    finalPrice,
    perProductDiscounts,
    couponCode: formattedCode,
    message: "Coupon validated successfully",
  };
};

/**
 * ✅ Mark coupon as used after a successful purchase
 */
export const markCouponAsUsed = async (couponCode, buyerId) => {
  if (!couponCode || !buyerId) return;

  const formattedCode = couponCode.trim().toUpperCase();
  const couponRef = doc(db, "allCoupons", formattedCode);
  const snap = await getDoc(couponRef);

  if (!snap.exists()) {
    console.warn("Tried to mark non-existent coupon as used:", couponCode);
    return;
  }

  const coupon = snap.data();
  const userUses = coupon.userUses || {};

  await updateDoc(couponRef, {
    userUses: {
      ...userUses,
      [buyerId]: (userUses[buyerId] || 0) + 1,
    },
    used: increment(1), // ✅ Increase total usage count
  });

  console.log(`Coupon ${formattedCode} usage updated for ${buyerId}`);
}; 
