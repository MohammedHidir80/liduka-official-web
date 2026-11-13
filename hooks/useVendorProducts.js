"use client";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

// Live list of the signed-in vendor's products (same query as mobile)
export default function useVendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    const stop = onAuthStateChanged(auth, (u) => {
      unsub();
      if (!u) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const q = query(
        collection(db, "products"),
        where("vendorId", "==", u.uid),
        orderBy("createdAt", "desc")
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (e) => {
          console.error("useVendorProducts", e);
          setLoading(false);
        }
      );
    });
    return () => {
      stop();
      unsub();
    };
  }, []);

  return { products, loading };
}