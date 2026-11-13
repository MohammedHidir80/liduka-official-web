"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProductReviewsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "products", id)).then((s) => s.exists() && setProduct({ id: s.id, ...s.data() }));
    return onSnapshot(query(collection(db, "comments"), where("productId", "==", id)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setComments(list);
      setLoading(false);
    });
  }, [id]);

  const { avg, counts } = useMemo(() => {
    const rated = comments.filter((c) => c.rating >= 1 && c.rating <= 5);
    const counts = [0, 0, 0, 0, 0, 0]; // index = stars
    rated.forEach((c) => counts[c.rating]++);
    return { avg: rated.length ? rated.reduce((s, c) => s + c.rating, 0) / rated.length : 0, counts };
  }, [comments]);

  if (loading) return <div className="container-page py-6 text-ink-500">Loading…</div>;

  return (
    <div className="container-page max-w-2xl space-y-5 py-6">
      <Link href="/vendor/products" className="text-sm text-brand-600">← Back to products</Link>
      <h1 className="text-2xl font-bold text-ink-900">Reviews{product ? `: ${product.name}` : ""}</h1>

      <div className="card flex items-center gap-6 p-4">
        <div className="text-center">
          <p className="text-5xl font-extrabold">{avg ? avg.toFixed(1) : "–"}</p>
          <p className="text-yellow-500">{"★".repeat(Math.round(avg))}</p>
          <p className="text-xs text-ink-500">{comments.length} review{comments.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-6">{s} ★</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-gray-200">
                <div className="h-full bg-yellow-400" style={{ width: comments.length ? `${(counts[s] / comments.length) * 100}%` : 0 }} />
              </div>
              <span className="w-5 text-right">{counts[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">No reviews yet.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
                  {(c.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{c.name || "Anonymous User"}</p>
                  <p className="text-xs text-ink-500">{c.createdAt?.toDate?.().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                </div>
                <span className="text-yellow-500">{"★".repeat(c.rating || 0)}<span className="text-gray-300">{"★".repeat(5 - (c.rating || 0))}</span></span>
              </div>
              {c.comment && <p className="mt-2 text-sm">{c.comment}</p>}
              {c.text && c.text !== c.comment && <p className="mt-1 text-sm italic text-ink-500">“{c.text}”</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}