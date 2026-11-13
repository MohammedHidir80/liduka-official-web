"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getExchangeRate } from "@/utils/currency";
import { toWebProduct, withDisplay } from "@/utils/product";

export default function useProducts({ currency = "GHS", vendorId = null, category = null } = {}) {
  const [raw, setRaw] = useState([]);
  const [ratings, setRatings] = useState({});
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Live active products that are in stock (same rule as mobile)
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

  // 2) Average ratings from comments, once (same approach as mobile)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "comments"));
        const sums = {};
        snap.forEach((d) => {
          const { productId, rating } = d.data();
          if (!productId || !rating) return;
          sums[productId] = sums[productId] || { total: 0, count: 0 };
          sums[productId].total += Number(rating);
          sums[productId].count += 1;
        });
        const result = {};
        for (const [pid, s] of Object.entries(sums)) {
          result[pid] = { average: Math.round((s.total / s.count) * 10) / 10, count: s.count };
        }
        if (!cancelled) setRatings(result);
      } catch (e) {
        console.error("Ratings error:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 3) Exchange rates for every base currency in the list
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

  // 4) Final list
  const products = useMemo(
    () =>
      raw.map((p) => {
        const r = ratings[p.id];
        const rate = p.currency === currency ? 1 : rates[`${p.currency}_${currency}`];
        return withDisplay(p, {
          currency,
          rate,
          rating: r?.average ?? 0,
          reviews: r?.count ?? 0,
        });
      }),
    [raw, ratings, rates, currency]
  );

  return { products, loading, error };
}