"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getExchangeRate, formatPrice } from "@/utils/currency";
import { cartKey, cartImageUrl, toStoredItem } from "@/utils/cart";

const CartContext = createContext(null);

// What we need from each product in the cart, kept live like mobile does
function toLive(snap) {
  if (!snap.exists()) return { exists: false };
  const d = snap.data();
  const images = Array.isArray(d.images) ? d.images.filter(Boolean) : [];
  return {
    exists: true,
    status: d.status,
    variants: Array.isArray(d.variants) ? d.variants : [],
    stock: Number(d.totalStock ?? d.stock) || 0,
    title: d.name || d.title || "",
    image: images[0] || "",
    price: Number(d.price) || 0,
    currency: d.currency || "GHS",
  };
}

// Stored item + live product -> stock, status and current price
function resolveItem(item, live) {
  let stock = Number(item.variantStock) || 0;
  let status = "ok"; // ok | removed | inactive | no-options | out-of-stock
  let price = Number(item.price) || 0;
  let currency = item.currency || "GHS";
  let title = item.title || "";
  let image = cartImageUrl(item.image);

  if (live) {
    if (!live.exists) {
      stock = 0;
      status = "removed";
    } else {
      price = live.price;
      currency = live.currency;
      title = live.title || title;
      image = live.image || image;

      if (item.variantId) {
        const v = live.variants.find((x) => x.variantId === item.variantId);
        stock = v ? Number(v.stock) || 0 : 0;
        if (!v) status = "removed";
      } else if (live.variants.length > 0) {
        stock = 0;
        status = "no-options";
      } else {
        stock = live.stock;
      }

      if (live.status !== "active") status = "inactive";
    }
  }

  if (status === "ok" && stock <= 0) status = "out-of-stock";

  const stored = Number(item.quantity) || 1;
  const quantity = stock > 0 ? Math.min(stored, stock) : stored;

  return { stock, status, price, currency, title, image, quantity };
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.role === "buyer" ? user.uid : null;
  const target = user?.currency || "GHS";

  const [stored, setStored] = useState([]);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState({});
  const [rates, setRates] = useState({});

  const storedRef = useRef([]);
  const itemsRef = useRef([]);

  // 1) carts/{uid}, same document mobile uses
  useEffect(() => {
    if (!uid) {
      storedRef.current = [];
      setStored([]);
      setLive({});
      setReady(true);
      return;
    }

    setReady(false);
    const unsub = onSnapshot(
      doc(db, "carts", uid),
      (snap) => {
        const list =
          snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : [];
        storedRef.current = list;
        setStored(list);
        setReady(true);
      },
      (err) => {
        console.error("Cart snapshot error:", err.code, err.message);
        setReady(true);
      }
    );
    return () => unsub();
  }, [uid]);

  // 2) Live stock and price for every product in the cart
  const idsKey = useMemo(
    () => [...new Set(stored.map((i) => i.id))].sort().join("|"),
    [stored]
  );

  useEffect(() => {
    if (!uid || !idsKey) return;
    const unsubs = idsKey.split("|").map((id) =>
      onSnapshot(
        doc(db, "products", id),
        (snap) => setLive((prev) => ({ ...prev, [id]: toLive(snap) })),
        (err) => console.error("Cart product listener:", err.code)
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [uid, idsKey]);

  const resolved = useMemo(
    () => stored.map((item) => ({ item, ...resolveItem(item, live[item.id]) })),
    [stored, live]
  );

  // 3) Exchange rates to the buyer's currency
  const baseKey = useMemo(
    () =>
      [...new Set(resolved.map((r) => r.currency))]
        .filter((c) => c && c !== target)
        .sort()
        .join("|"),
    [resolved, target]
  );

  useEffect(() => {
    if (!baseKey) return;
    let cancelled = false;
    Promise.all(
      baseKey.split("|").map(async (b) => [`${b}_${target}`, await getExchangeRate(b, target)])
    ).then((pairs) => {
      if (!cancelled) setRates((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => {
      cancelled = true;
    };
  }, [baseKey, target]);

  // 4) What the UI reads
  const items = useMemo(
    () =>
      resolved.map(({ item, stock, status, price, currency, title, image, quantity }) => {
        const rate = currency === target ? 1 : rates[`${currency}_${target}`];
        const key = cartKey(item.id, item.variantId);
        return {
          ...item,
          key,
          title,
          price,
          currency,
          image,
          quantity,
          variantStock: stock,
          status,
          valid: status === "ok",
          unit: rate ? price * rate : price,
          unitCurrency: rate ? target : currency,
          // old web names, so pages not migrated yet don't crash
          cartItemId: key,
          productId: item.id,
          qty: quantity,
          variants: {
            ...(item.color ? { Color: item.color } : {}),
            ...(item.size ? { Size: item.size } : {}),
          },
        };
      }),
    [resolved, rates, target]
  );
  itemsRef.current = items;

  const { subtotalLabel, cartTotal, validCount } = useMemo(() => {
    const groups = {};
    let count = 0;
    for (const i of items) {
      if (!i.valid) continue;
      count += 1;
      groups[i.unitCurrency] = (groups[i.unitCurrency] || 0) + i.unit * i.quantity;
    }
    const entries = Object.entries(groups);
    return {
      subtotalLabel: entries.length
        ? entries.map(([c, a]) => formatPrice(a, c)).join(" + ")
        : formatPrice(0, target),
      cartTotal: entries.reduce((sum, [, a]) => sum + a, 0),
      validCount: count,
    };
  }, [items, target]);

  // Writes the whole items array, exactly like mobile
  const write = useCallback(
    (next) => {
      if (!uid) return;
      storedRef.current = next;
      setStored(next);
      setDoc(doc(db, "carts", uid), { items: next }).catch((err) =>
        console.error("Cart save failed:", err)
      );
    },
    [uid]
  );

  // Returns { ok, reason?, message? } so the caller decides how to tell the buyer
  const addToCart = useCallback(
    (product, qty = 1, variant = null) => {
      if (!uid) {
        return { ok: false, reason: "login", message: "Please log in to add items to your cart." };
      }
      if (product.status && product.status !== "active") {
        return { ok: false, reason: "unavailable", message: "This product is currently unavailable." };
      }
      if ((product.variants?.length || 0) > 0 && !variant?.variantId) {
        return { ok: false, reason: "select", message: "Please select an available option before continuing." };
      }

      const stock = Number(variant?.stock ?? product.totalStock) || 0;
      if (stock <= 0) {
        return { ok: false, reason: "stock", message: "This option is out of stock." };
      }

      const key = cartKey(product.id, variant?.variantId ?? null);
      const current = storedRef.current;
      const existing = current.find((i) => cartKey(i.id, i.variantId) === key);
      const inCart = existing ? Number(existing.quantity) || 0 : 0;
      const add = Math.max(1, Math.floor(Number(qty) || 1));

      if (inCart + add > stock) {
        return {
          ok: false,
          reason: "stock",
          message:
            inCart > 0
              ? `You already have ${inCart} in your cart. Only ${stock} available.`
              : `Only ${stock} available.`,
        };
      }

      write(
        existing
          ? current.map((i) =>
              cartKey(i.id, i.variantId) === key
                ? { ...i, quantity: inCart + add, variantStock: stock }
                : i
            )
          : [...current, toStoredItem(product, variant, add)]
      );
      return { ok: true };
    },
    [uid, write]
  );

  const removeFromCart = useCallback(
    (id, variantId) => {
      const key = cartKey(id, variantId);
      write(storedRef.current.filter((i) => cartKey(i.id, i.variantId) !== key));
    },
    [write]
  );

  const removeMultipleFromCart = useCallback(
    (products) => {
      const keys = new Set(products.map((p) => cartKey(p.id, p.variantId)));
      write(storedRef.current.filter((i) => !keys.has(cartKey(i.id, i.variantId))));
    },
    [write]
  );

  const updateQuantity = useCallback(
    (id, variantId, newQuantity) => {
      const key = cartKey(id, variantId);
      const current = itemsRef.current.find((i) => i.key === key);
      if (!current) return { ok: false, message: "Item not found." };

      const stock = current.variantStock;
      const limit = {
        ok: false,
        message: "You cannot add more than the available stock for this item.",
      };

      if (stock <= 0) return limit;

      let qty = Math.max(1, Math.floor(Number(newQuantity) || 1));
      let result = { ok: true };
      if (qty > stock) {
        qty = stock;
        result = limit;
      }

      write(
        storedRef.current.map((i) =>
          cartKey(i.id, i.variantId) === key
            ? { ...i, quantity: qty, variantStock: stock }
            : i
        )
      );
      return result;
    },
    [write]
  );

  const clearCart = useCallback(() => write([]), [write]);

  const value = {
    items,
    cartItems: items,
    cartCount: items.length, // line items, like mobile's cart badge
    validCount,
    subtotalLabel,
    cartTotal,
    displayCurrency: target,
    ready,
    addToCart,
    removeFromCart,
    removeMultipleFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}