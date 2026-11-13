"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function useVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("role", "==", "vendor")));
        if (cancelled) return;
        setVendors(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              name: x.fullName || "Vendor",
              avatar: x.avatarURL || "",
              city: x.city || "",
              region: x.region || "",
              cover: x.coverURL || "",
            };
          })
        );
      } catch (e) {
        console.error("Vendors error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vendorById = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v])),
    [vendors]
  );

  return { vendors, vendorById, loading };
}