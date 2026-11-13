"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { collection, query, where, limit, getDocs, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import useVendorProducts from "@/hooks/useVendorProducts";
import { productTotalStock } from "@/lib/vendorProducts";
import { formatPrice } from "@/utils/currency";

const STATUS_STYLE = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  "out-of-stock": "bg-red-100 text-red-700",
  uploading: "bg-yellow-100 text-yellow-700",
};

export default function VendorProductsPage() {
  const { products, loading } = useVendorProducts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const list = useMemo(() => {
    let r = products;
    if (filter === "out") r = r.filter((p) => productTotalStock(p) <= 0);
    const s = search.trim().toLowerCase();
    if (s) r = r.filter((p) => p.name?.toLowerCase().includes(s));
    return r;
  }, [products, search, filter]);

  const handleDelete = async (p) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setBusyId(p.id);
    try {
      const active = await getDocs(
        query(
          collection(db, "orders"),
          where("productId", "==", p.id),
          where("vendorId", "==", uid),
          where("status", "in", ["pending", "accepted"]),
          limit(1)
        )
      );
      if (!active.empty) {
        alert("This product has active orders (pending or accepted), so it can't be deleted.");
        return;
      }
      if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
      await deleteDoc(doc(db, "products", p.id));
    } catch (e) {
      console.error(e);
      alert("Could not delete product.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">My products ({products.length})</h1>
        <Link href="/vendor/products/new" className="btn-primary">+ Add product</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search products…" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        {[["all", "All"], ["out", "Out of stock"]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={filter === k ? "btn-primary" : "btn-outline"}>{label}</button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-500">Loading…</p>
      ) : list.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">
          {search || filter !== "all" ? "No products match your filters." : "You haven't added any products yet."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const stock = productTotalStock(p);
            return (
              <div key={p.id} className="card flex gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images?.[0]} alt="" className="h-24 w-24 shrink-0 rounded-lg bg-gray-100 object-cover" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate font-semibold text-ink-900">{p.name}</p>
                  <p className="text-brand-600 font-bold">{formatPrice(p.price, p.currency || "GHS")}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLE[p.status] || STATUS_STYLE.inactive}`}>
                      {p.status}
                    </span>
                    <span className="text-ink-500">{stock} in stock</span>
                  </div>
                  <div className="mt-auto flex gap-3 pt-2 text-sm">
                    <Link href={`/vendor/products/${p.id}`} className="text-brand-600 font-medium">Edit</Link>
                    <Link href={`/vendor/products/${p.id}/reviews`} className="text-ink-500">Reviews</Link>
                    <button disabled={busyId === p.id} onClick={() => handleDelete(p)}
                      className="text-red-500 disabled:opacity-50">
                      {busyId === p.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}