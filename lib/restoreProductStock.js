// lib/restoreProductStock.js
import { increment } from "firebase/firestore";

// Puts stock back when an order is cancelled (variant-based or simple stock)
export const restoreProductStock = (transaction, productSnap, order) => {
  const qty = Number(order.quantity) || 1;
  const productData = productSnap.data();

  if (Array.isArray(productData?.variants) && productData.variants.length > 0) {
    const updatedVariants = productData.variants.map((v) => {
      const isMatch =
        (order.variantId && v.variantId === order.variantId) ||
        (order.color && order.size && v.color === order.color && v.size === order.size) ||
        (order.color && !order.size && v.color === order.color) ||
        (!order.color && order.size && v.size === order.size);

      return isMatch ? { ...v, stock: (Number(v.stock) || 0) + qty } : v;
    });

    transaction.update(productSnap.ref, { variants: updatedVariants });
    return;
  }

  transaction.update(productSnap.ref, { stock: increment(qty) });
};