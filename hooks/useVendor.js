"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function useVendor(id) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);

    const unsub = onSnapshot(
      doc(db, "users", id),
      (snap) => {
        const x = snap.exists() ? snap.data() : null;
        if (!x || x.role !== "vendor") {
          setVendor(null);
          setNotFound(true);
        } else {
          const created = x.createdAt?.toDate?.();
          setVendor({
            id: snap.id,
            name: x.fullName || "Vendor",
            avatar: x.avatarURL || "",
            cover: x.coverURL || "",
            city: x.city || "",
            region: x.region || "",
            address: x.address || "",
            description: x.description || "",
            verified: x.verified === true,
            joined: created
              ? created.toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "",
          });
          setNotFound(false);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Vendor snapshot error:", err.code, err.message);
        setVendor(null);
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  return { vendor, loading, notFound };
}