"use client";
import { useMemo, useState } from "react";
import useVendorOrders from "@/hooks/useVendorOrders";
import VendorOrderModal, { STATUS_STYLE } from "@/components/VendorOrderModal";
import { formatPrice } from "@/utils/currency";

const FILTERS = ["All", "Pending", "Accepted", "Shipped", "Delivered", "Cancelled"];
const DAY30 = 30 * 24 * 60 * 60 * 1000;

export default function VendorOrdersPage() {
  const { orders, loading, hasMore, loadMore } = useVendorOrders();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return orders.filter((o) => {
      const ms = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : 0;
      if (!showAll && ms && Date.now() - ms > DAY30) return false;
      if (filter !== "All" && (o.status || "").toLowerCase() !== filter.toLowerCase()) return false;
      if (!s) return true;
      return [o.productTitle, o.address?.fullName, o.color, o.size].some((x) => x?.toLowerCase().includes(s));
    });
  }, [orders, filter, search, showAll]);

  const count = (st) => orders.filter((o) => o.status === st).length;
  const selected = orders.find((o) => o.id === selectedId) || null; // live: stays in sync with Firestore

  return (
    <div className="container-page py-6">
      <h1 className="mb-4 text-2xl font-bold text-ink-900">Orders</h1>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Total", orders.length], ["Pending", count("pending")], ["Shipped", count("shipped")], ["Delivered", count("delivered")]].map(([k, v]) => (
          <div key={k} className="card p-3 text-center"><p className="text-2xl font-bold">{v}</p><p className="text-xs text-ink-500">{k}</p></div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="Search product, buyer, color, size…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary" : "btn-outline"}>{f}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-ink-500">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show older than 30 days
        </label>
      </div>

      {loading ? <p className="text-ink-500">Loading…</p> : list.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">{search || filter !== "All" ? "No orders match your filters." : "No orders yet."}</div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => {
            const st = (o.status || "").toLowerCase();
            return (
              <button key={o.id} onClick={() => setSelectedId(o.id)} className="card flex w-full gap-3 p-3 text-left hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.productImage} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-gray-100 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{o.productTitle}</p>
                  <p className="truncate text-sm text-ink-500">
                    {o.address?.fullName} · x{o.quantity}{[o.color, o.size].filter(Boolean).length ? ` · ${[o.color, o.size].filter(Boolean).join(" · ")}` : ""}
                  </p>
                  <p className="text-xs text-ink-500">{o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">{formatPrice(o.finalTotal ?? o.total ?? 0, o.currency || "GHS")}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[st] || "bg-gray-100"}`}>{st}</span>
                </div>
              </button>
            );
          })}
          {hasMore && <button className="btn-outline w-full" onClick={loadMore}>Load more</button>}
        </div>
      )}

      <VendorOrderModal order={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}