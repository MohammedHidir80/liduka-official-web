"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, query, where, limit, getDocs, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import useVendorProducts from "@/hooks/useVendorProducts";
import { productTotalStock } from "@/lib/vendorProducts";
import { formatPrice } from "@/utils/currency";

const PAGE = 15; // products shown per batch

const STATUS = {
  active: { label: "Active", cls: "bg-emerald-500 text-white" },
  inactive: { label: "Inactive", cls: "bg-ink-500 text-white" },
  "out-of-stock": { label: "Out of stock", cls: "bg-rose-500 text-white" },
  uploading: { label: "Uploading", cls: "bg-amber-500 text-white" },
  suspended: { label: "Suspended", cls: "bg-amber-500 text-white" },
  banned: { label: "Banned", cls: "bg-rose-600 text-white" },
};

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);
const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
);

export default function VendorProductsPage() {
  const { products, loading } = useVendorProducts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [visible, setVisible] = useState(PAGE);
  const [menuId, setMenuId] = useState(null); // card whose "..." menu is open
  const [toast, setToast] = useState("");

  // close the "..." menu when tapping anywhere else
  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuId]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const list = useMemo(() => {
    let r = products;
    if (filter === "out") r = r.filter((p) => productTotalStock(p) <= 0);
    const s = search.trim().toLowerCase();
    if (s) r = r.filter((p) => p.name?.toLowerCase().includes(s));
    return r;
  }, [products, search, filter]);

  // Share the product's public page (native share sheet on phones, copy link on desktop)
  const handleShare = async (p) => {
    const url = `${window.location.origin}/products/${p.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, text: `Check out ${p.name} on Liduka`, url });
      } else {
        await navigator.clipboard.writeText(url);
        flash("Product link copied");
      }
    } catch {
      /* the share sheet was dismissed */
    }
  };

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

      <div className="mb-5 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search products…" value={search}
          onChange={(e) => { setSearch(e.target.value); setVisible(PAGE); }} />
        {[["all", "All"], ["out", "Out of stock"]].map(([k, label]) => (
          <button key={k} onClick={() => { setFilter(k); setVisible(PAGE); }}
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {list.slice(0, visible).map((p) => {
            const stock = productTotalStock(p);
            const st = STATUS[p.status] || STATUS.inactive;
            const live = p.status === "active";
            const moderated = ["suspended", "banned"].includes(p.status);
            return (
              <article key={p.id} className="relative flex flex-col rounded-2xl bg-white shadow-card">
                {/* photo with the status on top */}
                <Link href={`/vendor/products/${p.id}`} className="relative block aspect-[4/3] overflow-hidden rounded-t-2xl bg-ink-100">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-sm font-bold text-ink-300">No image</span>
                  )}
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                </Link>

                <div className="flex flex-1 flex-col p-3">
                  <p className="truncate text-sm font-bold text-ink-900">{p.name}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="font-extrabold text-brand-600">{formatPrice(p.price, p.currency || "GHS")}</span>
                    <span className={`text-[11px] font-semibold ${stock <= 0 ? "text-rose-500" : stock < 10 ? "text-amber-500" : "text-ink-500"}`}>
                      {stock <= 0 ? "Sold out" : `${stock} in stock`}
                    </span>
                  </div>

                  {p.moderationReason && moderated && (
                    <p className="mt-1.5 line-clamp-2 rounded-lg bg-rose-50 px-2 py-1 text-[11px] text-rose-600">{p.moderationReason}</p>
                  )}

                  {/* actions: Edit is the main one, Share and "..." sit beside it */}
                  <div className="mt-3 flex items-center gap-2 pt-1">
                    <Link href={`/vendor/products/${p.id}`} className="btn-outline flex-1 py-2 text-center text-sm">Edit</Link>
                    <button
                      onClick={() => handleShare(p)}
                      disabled={!live}
                      title={live ? "Share product link" : "Only active products can be shared"}
                      aria-label="Share product link"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 transition hover:bg-brand-100 active:scale-95 disabled:opacity-40"
                    >
                      <ShareIcon />
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuId(menuId === p.id ? null : p.id); }}
                        aria-label="More actions"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink-200 text-ink-600 transition hover:bg-ink-50 active:scale-95"
                      >
                        <DotsIcon />
                      </button>
                      {menuId === p.id && (
                        <div className="absolute bottom-12 right-0 z-20 w-36 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 text-sm shadow-xl">
                          <Link href={`/vendor/products/${p.id}/reviews`} className="block px-4 py-2.5 font-semibold text-ink-700 hover:bg-ink-50">
                            Reviews
                          </Link>
                          <button
                            disabled={busyId === p.id}
                            onClick={() => { setMenuId(null); handleDelete(p); }}
                            className="block w-full px-4 py-2.5 text-left font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {busyId === p.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {list.length > visible && (
        <button className="btn-outline mt-4 w-full py-3" onClick={() => setVisible((v) => v + PAGE)}>
          See more ({list.length - visible} remaining)
        </button>
      )}

      {toast && (
        <div className="fixed left-1/2 top-20 z-[100] -translate-x-1/2 rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}