"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// categories/{category name}.subcategories can hold strings or { name } objects
export default function useSubcategories(category) {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    setSubs([]);
    if (!category) return;
    let cancelled = false;
    getDoc(doc(db, "categories", category))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const list = snap.data().subcategories || [];
        setSubs(list.map((s) => (typeof s === "string" ? s : s?.name)).filter(Boolean));
      })
      .catch((e) => console.error("Subcategories error:", e));
    return () => {
      cancelled = true;
    };
  }, [category]);

  return subs;
}