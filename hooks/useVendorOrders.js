"use client";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

const PAGE = 20;

export default function useVendorOrders() {
  const [orders, setOrders] = useState([]);
  const [max, setMax] = useState(PAGE);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    const stop = onAuthStateChanged(auth, (u) => {
      unsub();
      if (!u) { setOrders([]); setLoading(false); return; }
      const q = query(
        collection(db, "orders"),
        where("vendorId", "==", u.uid),
        orderBy("createdAt", "desc"),
        limit(max)
      );
      unsub = onSnapshot(q, (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setHasMore(snap.docs.length === max);
        setLoading(false);
      }, (e) => { console.error("useVendorOrders", e); setLoading(false); });
    });
    return () => { stop(); unsub(); };
  }, [max]);

  return { orders, loading, hasMore, loadMore: () => setMax((m) => m + PAGE) };
}