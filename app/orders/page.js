"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useBuyerOrders from "@/hooks/useBuyerOrders";
import BuyerOrderModal from "@/components/BuyerOrderModal";
import { SkeletonOrderCard } from "@/components/Skeleton";
import { STATUS_STYLES, statusKey, statusLabel, badgeText, relativeTime } from "@/utils/orders";
import { formatPrice } from "@/utils/currency";
import {
  BagIcon, SearchIcon, CalendarIcon, BoxIcon, BikeIcon, XIcon,
} from "@/components/icons";

const FILTERS = ["All", "Pending", "Accepted", "Shipped", "Delivered", "Cancelled"];
const money = (n) => formatPrice(n, "GHS");

export default function BuyerOrdersPage() {
  const { orders, loading, error } = useBuyerOrders();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);

  // The modal reads the live order, so a status change shows without reopening
  const selectedOrder = orders.find((o) => o.id === selectedId) || null;

  const statusCounts = useMemo(() => {
    const counts = { All: orders.length };
    FILTERS.slice(1).forEach((f) => {
      counts[f] = orders.filter((o) => (o.status || "").toLowerCase() === f.toLowerCase()).length;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders
      .filter((o) => activeFilter === "All" || (o.status || "").toLowerCase() === activeFilter.toLowerCase())
      .filter(
        (o) =>
          !q ||
          (o.productTitle || "").toLowerCase().includes(q) ||
          (o.variantLabel || "").toLowerCase().includes(q) ||
          (o.color || "").toLowerCase().includes(q) ||
          (o.size || "").toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
  }, [orders, activeFilter, searchQuery]);

  if (loading) {
    return (
      <div className="container-page max-w-4xl py-6">
        <div className="mb-6 h-8 w-1/3 animate-pulse rounded bg-ink-100" />
        <div className="mb-4 h-12 w-full animate-pulse rounded-xl bg-ink-100" />
        <div className="mb-6 flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-ink-100" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonOrderCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="mb-2 text-lg font-bold text-ink-900">Could not load your orders</h1>
        <p className="text-sm text-ink-500">
          {error.code === "failed-precondition"
            ? "A database index is missing. Open the browser console and follow the link to create it."
            : "Please check your connection and try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[80vh] max-w-4xl flex-col py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">My Orders</h1>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
          {orders.length} {orders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <SearchIcon size={18} />
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10 pr-10"
          placeholder="Search by product or order ID"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            aria-label="Clear search"
          >
            <XIcon size={16} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
              activeFilter === f
                ? "bg-brand-600 text-white"
                : "border border-ink-200 bg-white text-ink-600 hover:border-ink-300"
            }`}
          >
            {statusLabel(f.toLowerCase())}
            {statusCounts[f] > 0 && (
              <span className={`text-xs ${activeFilter === f ? "text-brand-200" : "text-ink-400"}`}>
                ({statusCounts[f]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-ink-50 text-ink-300">
            <BagIcon size={32} />
          </div>
          <h2 className="mb-1 text-lg font-bold text-ink-900">No orders found</h2>
          <p className="mb-6 text-sm text-ink-500">
            {searchQuery || activeFilter !== "All"
              ? "Try adjusting your filters or search term."
              : "When you buy something, it will appear here."}
          </p>
          {searchQuery || activeFilter !== "All" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("All");
              }}
              className="btn-outline"
            >
              Clear Filters
            </button>
          ) : (
            <Link href="/" className="btn-primary">
              Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = statusKey(order);
            const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
            const StatusIcon = style.icon;
            const variantText = [order.color, order.size].filter(Boolean).join(" · ");

            return (
              <button
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                className="card flex w-full gap-4 border border-transparent p-3 text-left transition-colors hover:border-brand-300 sm:p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:h-24 sm:w-24">
                  {order.productImage ? (
                    <img
                      src={order.productImage}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-ink-400">
                      <BoxIcon size={24} />
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-ink-900 sm:text-base">
                        {order.productTitle || "Unknown Item"}
                      </h3>
                      <span
                        className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}
                      >
                        <StatusIcon size={10} />
                        {badgeText(order)}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <p className="flex items-center gap-1.5 text-[11px] text-ink-500 sm:text-xs">
                        <CalendarIcon size={12} /> {relativeTime(order.createdAt)}
                      </p>
                      <p className="flex items-center gap-1.5 text-[11px] text-ink-500 sm:text-xs">
                        <BoxIcon size={12} /> Qty: {order.quantity || 1}
                      </p>
                      {variantText && (
                        <p className="truncate text-[11px] text-ink-500 sm:text-xs">{variantText}</p>
                      )}
                      {status === "shipped" && order.deliveryStatus && (
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold capitalize text-brand-600 sm:text-xs">
                          <BikeIcon size={12} /> {order.deliveryStatus.replaceAll("_", " ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-brand-600 sm:text-base">
                      {money(order.finalTotal ?? order.total ?? 0)}
                    </span>
                    <span className="font-mono text-[10px] text-ink-400">#{order.id.slice(-8)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <BuyerOrderModal order={selectedOrder} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}