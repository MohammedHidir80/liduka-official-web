"use client";
import { useEffect, useMemo, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import useVendorProducts from "@/hooks/useVendorProducts";

// Same sources as mobile: products, delivered orders, comments (ratings), vendorLikes
export default function useVendorStats() {
  const { products, loading: pLoading } = useVendorProducts();
  const [uid, setUid] = useState(null);
  const [sales, setSales] = useState({}); // productId -> delivered count
  const [salesTotal, setSalesTotal] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [ratings, setRatings] = useState([]); // [{productId, rating}]

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid || null)), []);

  useEffect(() => {
    if (!uid) return;
    const unsubs = [
      onSnapshot(
        query(collection(db, "orders"), where("vendorId", "==", uid), where("status", "==", "delivered")),
        (snap) => {
          const m = {};
          snap.forEach((d) => { const p = d.data().productId; if (p) m[p] = (m[p] || 0) + 1; });
          setSales(m);
          setSalesTotal(snap.size);
        }
      ),
      onSnapshot(
        query(collection(db, "orders"), where("vendorId", "==", uid), where("status", "==", "pending")),
        (snap) => setPendingOrders(snap.size)
      ),
      onSnapshot(query(collection(db, "vendorLikes"), where("vendorId", "==", uid)), (snap) => setCustomers(snap.size)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  // Comments: Firestore "in" allows 10 ids per query, so chunk like mobile
  const idsKey = products.map((p) => p.id).join(",");
  useEffect(() => {
    if (!idsKey) { setRatings([]); return; }
    const ids = idsKey.split(",");
    const buckets = {};
    const unsubs = [];
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      unsubs.push(
        onSnapshot(query(collection(db, "comments"), where("productId", "in", chunk)), (snap) => {
          buckets[i] = snap.docs.map((d) => d.data()).filter((c) => c.rating && c.productId);
          setRatings(Object.values(buckets).flat());
        })
      );
    }
    return () => unsubs.forEach((u) => u());
  }, [idsKey]);

  const stats = useMemo(() => {
    const byProduct = {};
    let total = 0;
    ratings.forEach((r) => {
      total += r.rating;
      const b = (byProduct[r.productId] ||= { total: 0, count: 0 });
      b.total += r.rating; b.count++;
    });
    return {
      overallRating: ratings.length ? total / ratings.length : 0,
      list: products.map((p) => {
        const r = byProduct[p.id];
        return { ...p, salesCount: sales[p.id] || 0, ratingsCount: r?.count || 0, averageRating: r ? r.total / r.count : 0 };
      }),
    };
  }, [products, ratings, sales]);

  return {
    loading: pLoading,
    products: stats.list,
    summary: { products: products.length, totalSales: salesTotal, overallRating: stats.overallRating, customers, pendingOrders },
  };
}