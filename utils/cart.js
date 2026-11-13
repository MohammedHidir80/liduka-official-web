// utils/cart.js

export const cartKey = (id, variantId) => `${id}__${variantId ?? ""}`;

// Mobile stores the image as { uri }; older web items stored a plain string
export const cartImageUrl = (image) =>
  typeof image === "string" ? image : image?.uri || "";

// Same shape mobile writes to carts/{uid}.items. Firestore rejects undefined,
// so every optional field becomes null. `currency` is an extra field mobile ignores.
export function toStoredItem(product, variant, quantity) {
  return {
    id: product.id,
    title: product.name || product.title || "",
    price: Number(product.price) || 0, // the vendor's price, not the converted one
    currency: product.currency || "GHS",
    image: product.images?.[0] ? { uri: product.images[0] } : null,
    quantity,
    variantId: variant?.variantId ?? null,
    size: variant?.size ?? null,
    color: variant?.color ?? null,
    variantStock: Number(variant?.stock ?? product.totalStock) || 0,
    vendorId: product.vendorId ?? null,
  };
}