"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import useProduct from "@/hooks/useProduct";
import { cartKey } from "@/utils/cart";

export default function useCheckoutLines() {
  const params = useSearchParams();
  const { user } = useAuth();
  const { items, ready: cartReady } = useCart();

  const buyId = params.get("buy");
  const buyVariant = params.get("v");
  const buyQty = Math.max(1, parseInt(params.get("q") || "1", 10) || 1);
  const only = params.get("only");

  const direct = useProduct(buyId, { currency: user?.currency || "GHS" });

  return useMemo(() => {
    // Buy Now: straight from the product page
    if (buyId) {
      if (direct.loading) return { lines: [], loading: true, source: "buy" };
      const p = direct.product;
      if (!p) {
        return { lines: [], loading: false, source: "buy", problem: "This product could not be found." };
      }

      const variants = p.variants || [];
      const variant = variants.length
        ? variants.find((v) => v.variantId === buyVariant) || null
        : null;
      const stock = variant ? Number(variant.stock) || 0 : variants.length ? 0 : p.totalStock;

      let status = "ok";
      if (p.status !== "active") status = "inactive";
      else if (variants.length && !variant) status = "no-options";
      else if (stock <= 0 || buyQty > stock) status = "out-of-stock";

      return {
        lines: [
          {
            key: cartKey(p.id, variant?.variantId ?? null),
            id: p.id,
            title: p.title,
            price: p.price,
            currency: p.currency,
            image: p.image || "",
            quantity: buyQty,
            variantId: variant?.variantId ?? null,
            color: variant?.color ?? null,
            size: variant?.size ?? null,
            vendorId: p.vendorId,
            category: p.category || "",
            status,
            valid: status === "ok",
            variantStock: stock,
          },
        ],
        loading: false,
        source: "buy",
      };
    }

    // From the cart (all items, or one item)
    if (!cartReady) return { lines: [], loading: true, source: "cart" };

    const picked = only ? items.filter((i) => i.key === only) : items;
    return {
      lines: picked.map((i) => ({
        key: i.key,
        id: i.id,
        title: i.title,
        price: i.price,
        currency: i.currency,
        image: i.image,
        quantity: i.quantity,
        variantId: i.variantId ?? null,
        color: i.color ?? null,
        size: i.size ?? null,
        vendorId: i.vendorId,
        category: "",
        status: i.status,
        valid: i.valid,
        variantStock: i.variantStock,
      })),
      loading: false,
      source: only ? "only" : "cart",
    };
  }, [buyId, buyVariant, buyQty, only, direct.loading, direct.product, cartReady, items]);
}