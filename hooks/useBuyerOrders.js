"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function useBuyerOrders() {
  const { user } = useAuth();
  const uid = user?.role === "buyer" ? user.uid : null;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "orders"),
      where("buyerId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // an order just placed has no server time yet, so it sorts first
        const time = (o) => (o.createdAt?.seconds ? o.createdAt.seconds : Infinity);
        list.sort((a, b) => time(b) - time(a));
        setOrders(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Orders snapshot error:", err.code, err.message);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid]);

  return { orders, loading, error };
}