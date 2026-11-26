"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getExchangeRate } from "@/utils/currency";
import { toWebProduct, withDisplay } from "@/utils/product";

export default function useProducts({ currency = "GHS", vendorId = null, category = null } = {}) {
  const [raw, setRaw] = useState([]);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Live active products that are in stock (same rule as mobile)
  useEffect(() => {
    setLoading(true);
    const constraints = [where("status", "==", "active")];
    if (vendorId) constraints.push(where("vendorId", "==", vendorId));
    if (category) constraints.push(where("category", "==", category));

    const q = query(collection(db, "products"), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRaw(snap.docs.map(toWebProduct).filter((p) => p.totalStock > 0));
        setLoading(false);
      },
      (err) => {
        console.error("Products snapshot error:", err.code, err.message);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [vendorId, category]);

  // 2) Exchange rates for every base currency in the list
  useEffect(() => {
    const bases = [...new Set(raw.map((p) => p.currency))].filter((b) => b !== currency);
    if (!bases.length) return;
    let cancelled = false;
    Promise.all(
      bases.map(async (b) => [`${b}_${currency}`, await getExchangeRate(b, currency)])
    ).then((pairs) => {
      if (!cancelled) setRates(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [raw, currency]);

  // 3) Final list. Ratings come from the product itself (kept up to date by the updateProductRating function),
  //    so the page no longer reads every review in the database.
  const products = useMemo(
    () =>
      raw.map((p) => {
        const rate = p.currency === currency ? 1 : rates[`${p.currency}_${currency}`];
        return withDisplay(p, {
          currency,
          rate,
          rating: Number(p.averageRating) || 0,
          reviews: Number(p.ratingsCount) || 0,
        });
      }),
    [raw, rates, currency]
  );

  return { products, loading, error };
}