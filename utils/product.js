// utils/product.js
import { formatPrice } from "@/utils/currency";

// Firestore product doc -> the shape web components use
export function toWebProduct(docSnap) {
  const data = docSnap.data();
  const variants = Array.isArray(data.variants) ? data.variants : [];
  const totalStock = variants.length
    ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : Number(data.stock) || 0;
  const images = Array.isArray(data.images) ? data.images.filter(Boolean) : [];

  return {
    ...data,
    id: docSnap.id,
    name: data.name || data.title || "",
    title: data.name || data.title || "",
    images,
    image: images[0] || "",
    price: Number(data.price) || 0, // the vendor's price, never overwritten
    currency: data.currency || "GHS",
    variants,
    totalStock,
  };
}

// Adds buyer-currency display fields. `rate` is 1 for the same currency,
// or null when no rate is available (then the product's own currency shows).
export function withDisplay(p, { currency, rate, rating = 0, reviews = 0 }) {
  const converted = rate ? p.price * rate : null;
  const shownCurrency = converted != null ? currency : p.currency;
  const oldPrice = Number(p.oldPrice) || 0;
  const hasOld = oldPrice > p.price;

  return {
    ...p,
    rating,
    reviews,
    averageRating: rating,
    ratingsCount: reviews,
    displayAmount: converted ?? p.price,
    displayPrice: formatPrice(converted ?? p.price, shownCurrency),
    displayOldPrice: hasOld
      ? formatPrice(converted != null ? oldPrice * rate : oldPrice, shownCurrency)
      : null,
    displayCurrency: shownCurrency,
    discount: hasOld ? Math.round((1 - p.price / oldPrice) * 100) : 0,
  };
}