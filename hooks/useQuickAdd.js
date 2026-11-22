"use client";

import { useCallback, useState } from "react";
import { useCart } from "@/context/CartContext";
import { showToast } from "@/utils/toast";

export default function useQuickAdd() {
  const { addToCart } = useCart();
  const [modalProduct, setModalProduct] = useState(null);

  // More than one variant -> open the picker; otherwise add straight away
  const quickAdd = useCallback(
    (product) => {
      const variants = product.variants || [];
      if (variants.length > 1) {
        setModalProduct(product);
        return;
      }
      const result = addToCart(product, 1, variants[0] || null);
      if (result.ok) showToast(`Added ${product.title} to cart`);
      else showToast(result.message, "error", 3200);
    },
    [addToCart]
  );

  const confirm = useCallback(
    (product, qty, variant) => {
      const result = addToCart(product, qty, variant);
      if (result.ok) showToast(`Added ${qty} x ${product.title} to cart`);
      else showToast(result.message, "error", 3200);
    },
    [addToCart]
  );

  const modalProps = {
    isOpen: !!modalProduct,
    product: modalProduct,
    onClose: () => setModalProduct(null),
    onConfirm: confirm,
  };

  return { quickAdd, modalProps };
}