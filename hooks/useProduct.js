"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getExchangeRate } from "@/utils/currency";
import { toWebProduct, withDisplay } from "@/utils/product";

export default function useProduct(productId, { currency = "GHS", rating = 0, reviews = 0 } = {}) {
  const [raw, setRaw] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Live product (stock changes show up without a refresh)
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "products", productId),
      (snap) => {
        if (snap.exists()) {
          setRaw(toWebProduct(snap));
          setNotFound(false);
        } else {
          setRaw(null);
          setNotFound(true);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Product snapshot error:", err.code, err.message);
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [productId]);

  // Vendor profile
  const vendorId = raw?.vendorId;
  useEffect(() => {
    if (!vendorId) {
      setVendor(null);
      return;
    }
    let cancelled = false;
    getDoc(doc(db, "users", vendorId))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const x = snap.data();
        const created = x.createdAt?.toDate?.();
        setVendor({
          id: vendorId,
          name: x.fullName || "Vendor",
          avatar: x.avatarURL || "",
          city: x.city || "",
          region: x.region || "",
          joined: created
            ? created.toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : "",
        });
      })
      .catch((e) => console.error("Vendor error:", e));
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  // Exchange rate to the buyer's currency
  const baseCurrency = raw?.currency;
  useEffect(() => {
    if (!baseCurrency) return;
    if (baseCurrency === currency) {
      setRate(1);
      return;
    }
    let cancelled = false;
    setRate(null);
    getExchangeRate(baseCurrency, currency).then((r) => {
      if (!cancelled) setRate(r);
    });
    return () => {
      cancelled = true;
    };
  }, [baseCurrency, currency]);

  const product = useMemo(
    () => (raw ? withDisplay(raw, { currency, rate, rating, reviews }) : null),
    [raw, currency, rate, rating, reviews]
  );

  return { product, vendor, loading, notFound };
}