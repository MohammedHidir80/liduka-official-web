"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Same query as mobile's CommentsSection (so the same Firestore index applies)
export default function useProductReviews(productId) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "comments"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReviews(
          snap.docs.map((d) => {
            const x = d.data();
            const created = x.createdAt?.toDate?.();
            return {
              id: d.id,
              userId: x.userId,
              name: x.name || "Anonymous",
              avatar: x.avatar || "",
              rating: Number(x.rating) || 0,
              text: x.text || "",
              date: created
                ? created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "",
            };
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error("Reviews snapshot error:", err.code, err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [productId]);

  const { average, count } = useMemo(() => {
    const rated = reviews.filter((r) => r.rating > 0);
    if (!rated.length) return { average: 0, count: 0 };
    const total = rated.reduce((sum, r) => sum + r.rating, 0);
    return { average: Math.round((total / rated.length) * 10) / 10, count: rated.length };
  }, [reviews]);

  return { reviews, average, count, loading };
}

// One review per buyer per product: posting again updates it (same as mobile)
export async function saveReview({ productId, user, rating, text }) {
  const existing = await getDocs(
    query(
      collection(db, "comments"),
      where("productId", "==", productId),
      where("userId", "==", user.uid)
    )
  );

  const fields = {
    text: text.trim(),
    rating,
    name: user.fullName || "Anonymous",
    avatar: user.avatar || null,
    createdAt: serverTimestamp(),
  };

  if (!existing.empty) {
    await updateDoc(doc(db, "comments", existing.docs[0].id), fields);
    return;
  }
  await addDoc(collection(db, "comments"), { productId, userId: user.uid, ...fields });
}

export function deleteReview(reviewId) {
  return deleteDoc(doc(db, "comments", reviewId));
}