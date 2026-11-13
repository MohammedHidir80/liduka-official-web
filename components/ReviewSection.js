"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { saveReview, deleteReview } from "@/hooks/useProductReviews";
import { StarIcon, StarFilledIcon } from "./icons";
import ReportButton from "./ReportButton";

export default function ReviewSection({ productId, reviews, average, count, loading }) {
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // One review per buyer per product, like mobile
  const own = user ? reviews.find((r) => r.userId === user.uid) : null;
  const showForm = !!user && (!own || editing);

  const resetForm = () => {
    setRating(0);
    setText("");
    setEditing(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user) return setError("Please log in to leave a review.");
    if (!rating) return setError("Please select a star rating.");
    if (!text.trim()) return setError("Please write a comment.");

    setSaving(true);
    try {
      await saveReview({ productId, user, rating, text });
      resetForm();
    } catch (err) {
      console.error("Error posting review:", err);
      setError("Failed to post your review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (review) => {
    setRating(review.rating);
    setText(review.text);
    setEditing(true);
    setError("");
  };

  const handleDelete = async (review) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(review.id);
    } catch (err) {
      console.error("Error deleting review:", err);
      setError("Could not delete your review. Please try again.");
    }
  };

  return (
    <div className="mt-8 border-t border-ink-100 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink-900">Reviews ({count})</h2>
        <div className="flex items-center gap-1">
          <StarFilledIcon size={18} className="text-amber-500" />
          <span className="font-bold text-ink-900">{average.toFixed(1)}</span>
        </div>
      </div>

      {/* Write / edit your review */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-ink-200 bg-white p-4">
          <p className="mb-3 text-sm font-bold text-ink-900">
            {editing ? "Edit your review" : "Write a Review"}
          </p>

          <div className="mb-4 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition hover:scale-110"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              >
                {star <= rating ? (
                  <StarFilledIcon size={28} className="text-amber-500" />
                ) : (
                  <StarIcon size={28} className="text-ink-300" />
                )}
              </button>
            ))}
          </div>

          <textarea
            className="input min-h-[100px] resize-none"
            placeholder="Share your thoughts..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {error && <p className="mt-2 text-xs font-semibold text-rose-500">{error}</p>}

          <div className="mt-3 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : editing ? "Update" : "Submit"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="btn-ghost text-rose-600">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {!showForm && error && (
        <p className="mb-4 text-xs font-semibold text-rose-500">{error}</p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="py-8 text-center text-sm text-ink-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-500">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const isOwn = user && user.uid === review.userId;
            return (
              <div key={review.id} className="border-b border-ink-100 pb-6 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {review.avatar ? (
                      <img src={review.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-ink-900">{review.name}</span>
                    {isOwn && (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-ink-400">{review.date}</span>
                </div>

                <div className="my-2 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                      {star <= review.rating ? (
                        <StarFilledIcon size={14} className="text-amber-500" />
                      ) : (
                        <StarIcon size={14} className="text-ink-200" />
                      )}
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.text}</p>

                {isOwn ? (
                  !editing && (
                    <div className="mt-3 flex gap-4">
                      <button
                        onClick={() => handleEdit(review)}
                        className="text-xs font-bold text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )
                ) : (
                  user && (
                    <div className="mt-3">
                      <ReportButton
                        type="comment"
                        targetId={review.id}
                        targetOwnerId={review.userId}
                        variant="link"
                      />
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}