"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function useTransactions(max = 50) {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(max)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setTransactions(
          snap.docs.map((d) => {
            const x = d.data({ serverTimestamps: "estimate" });
            return {
              ...x,
              id: d.id,
              amount: Number(x.amount) || 0,
              fee: Number(x.fee) || 0,
              date: x.createdAt?.toDate?.() || null,
            };
          })
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Transactions snapshot error:", err.code, err.message);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid, max]);

  return { transactions, loading, error };
}