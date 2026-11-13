"use client";

import { useCallback, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Writes the same document shape as mobile's reports collection
export default function useReport() {
  const [loading, setLoading] = useState(false);

  const submitReport = useCallback(
    async ({ type, targetId, targetOwnerId, reason, description = "" }) => {
      const current = auth.currentUser;
      if (!current) throw new Error("You must be logged in to report.");

      setLoading(true);
      try {
        await addDoc(collection(db, "reports"), {
          type,
          targetId,
          targetOwnerId,
          reason,
          description: description.trim(),
          reporterId: current.uid,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { submitReport, loading };
}