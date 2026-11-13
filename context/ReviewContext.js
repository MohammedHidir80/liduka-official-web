"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "Liduka.reviews.v1";
const ReviewContext = createContext(null);

const SEED_REVIEWS = [
  {
    id: "r1",
    productId: "1",
    userId: "u99",
    userName: "John Doe",
    rating: 5,
    comment: "Absolutely incredible sound quality. The noise cancellation is top-notch.",
    date: "Oct 24, 2026",
  },
  {
    id: "r2",
    productId: "1",
    userId: "u98",
    userName: "Sarah K.",
    rating: 4,
    comment: "Very comfortable, but the case is a bit bulky. Battery life is amazing though.",
    date: "Oct 20, 2026",
  },
];

export function ReviewProvider({ children }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setReviews(JSON.parse(raw));
      else setReviews(SEED_REVIEWS);
    } catch {
      setReviews(SEED_REVIEWS);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  }, [reviews, ready]);

  const addReview = (productId, rating, comment) => {
    if (!user) return;
    const newReview = {
      id: `r_${Date.now()}`,
      productId,
      userId: user.id,
      userName: user.name,
      rating,
      comment,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  const editReview = (id, rating, comment) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rating, comment } : r))
    );
  };

  const deleteReview = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const reportReview = (id, reason) => {
    // In a real app, this would send to a backend
    console.log(`Reported review ${id} for: ${reason}`);
  };

  return (
    <ReviewContext.Provider value={{ reviews, addReview, editReview, deleteReview, reportReview }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error("useReviews must be used inside ReviewProvider");
  return ctx;
}