"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, getDoc, getDocs, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

export default function useVendorCoupons() {
  const [uid, setUid] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUid(u?.uid || null); if (!u) setLoading(false); }), []);

  // Categories this vendor sells in (for "applies to")
  useEffect(() => {
    if (!uid) return;
    getDocs(query(collection(db, "products"), where("vendorId", "==", uid))).then((snap) => {
      const set = new Set();
      snap.forEach((d) => d.data().category && set.add(d.data().category));
      setCategories([...set]);
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(db, "vendorCoupons", uid, "coupons"), orderBy("createdAt", "desc")),
      async (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => !c.deleted);
        // Usage counters live on allCoupons (source of truth, as on mobile)
        const withUsage = await Promise.all(
          rows.map(async (c) => {
            const g = await getDoc(doc(db, "allCoupons", c.code || c.id));
            const gd = g.exists() ? g.data() : {};
            return { ...c, code: c.code || c.id, totalUsed: gd.used ?? gd.totalUsed ?? 0, totalUsers: gd.totalUsers ?? 0 };
          })
        );
        setCoupons(withUsage);
        setLoading(false);
      },
      (e) => { console.error("useVendorCoupons", e); setLoading(false); }
    );
  }, [uid]);

  return { uid, coupons, categories, activeCount: coupons.filter((c) => c.isActive).length, loading };
}