"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSave } from "@/context/SaveContext";
import useVendor from "@/hooks/useVendor";
import useProducts from "@/hooks/useProducts";
import useQuickAdd from "@/hooks/useQuickAdd";
import ProductCard from "@/components/ProductCard";
import VariantModal from "@/components/VariantModal";
import { normRegion, titleCase } from "@/utils/location";
import {
  ChevronLeftIcon, ShareIcon, MapPinIcon, CheckIcon, SearchIcon, CalendarIcon,
} from "@/components/icons";

export default function VendorCatalogPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const { isVendorSaved, toggleSaveVendor } = useSave();

  const { vendor, loading: vendorLoading, notFound } = useVendor(id);
  const { products, loading: productsLoading } = useProducts({
    currency: user?.currency || "GHS",
    vendorId: id,
  });
  const { quickAdd, modalProps } = useQuickAdd();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sales, setSales] = useState(null);
  const [toast, setToast] = useState("");

  // Delivered orders = sales, same number mobile shows. Hidden if it can't be read.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getCountFromServer(
      query(collection(db, "orders"), where("vendorId", "==", id), where("status", "==", "delivered"))
    )
      .then((s) => !cancelled && setSales(s.data().count))
      .catch(() => !cancelled && setSales(null));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const categories = useMemo(
    () => ["all", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!q || (p.name || "").toLowerCase().includes(q)) &&
        (activeCategory === "all" || p.category === activeCategory)
    );
  }, [products, search, activeCategory]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  if (vendorLoading) {
    return (
      <div className="container-page max-w-5xl py-6">
        <div className="mb-4 h-40 animate-pulse rounded-2xl bg-ink-100" />
        <div className="h-8 w-1/2 animate-pulse rounded bg-ink-100" />
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-lg font-bold text-ink-900">Vendor not found</h1>
        <button onClick={() => router.back()} className="btn-primary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  const following = isVendorSaved(vendor.id);
  const place = [vendor.city, titleCase(normRegion(vendor.region))].filter(Boolean).join(", ");

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: vendor.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        flash("Link copied");
      }
    } catch {
      /* the share sheet was dismissed */
    }
  };

  const chip = (active) =>
    `shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
    }`;

  return (
    <div className="container-page max-w-5xl py-4 pb-24 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100"
          aria-label="Back"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="flex-1 truncate text-center text-base font-extrabold">Vendor Catalog</h1>
        <button
          onClick={handleShare}
          className="grid h-9 w-9 place-items-center rounded-xl text-ink-600 hover:bg-ink-100"
          aria-label="Share vendor"
        >
          <ShareIcon size={18} />
        </button>
      </div>

      {/* Cover and avatar */}
      <div className="relative mb-12">
        <div className="h-40 w-full overflow-hidden rounded-2xl bg-brand-50">
          {vendor.cover && <img src={vendor.cover} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="absolute -bottom-8 left-4 h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-card">
          {vendor.avatar ? (
            <img src={vendor.avatar} alt={vendor.name} className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-brand-50 text-2xl font-extrabold text-brand-600">
              {vendor.name.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-2">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="truncate text-xl font-extrabold text-ink-900">{vendor.name}</h2>
            {vendor.verified && <CheckIcon size={16} className="shrink-0 text-brand-600" />}
          </div>
          <button
            onClick={() => toggleSaveVendor(vendor.id)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-bold transition ${
              following
                ? "bg-brand-600 text-white"
                : "border border-brand-600 text-brand-600 hover:bg-brand-50"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>

        <div className="my-5 flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
          <div className="flex-1 text-center">
            <p className="text-lg font-extrabold text-ink-900">{productsLoading ? "..." : products.length}</p>
            <p className="text-[11px] font-semibold uppercase text-ink-400">Products</p>
          </div>
          {sales !== null && (
            <>
              <div className="h-8 w-px bg-ink-100" />
              <div className="flex-1 text-center">
                <p className="text-lg font-extrabold text-ink-900">{sales}</p>
                <p className="text-[11px] font-semibold uppercase text-ink-400">Sales</p>
              </div>
            </>
          )}
          {vendor.joined && (
            <>
              <div className="h-8 w-px bg-ink-100" />
              <div className="flex-1 text-center">
                <p className="text-lg font-extrabold text-ink-900">{vendor.joined}</p>
                <p className="text-[11px] font-semibold uppercase text-ink-400">Joined</p>
              </div>
            </>
          )}
        </div>

        <p className="mb-2 flex items-center gap-1 text-sm text-ink-500">
          <MapPinIcon size={14} className="text-brand-600" />
          {place || vendor.address || "Location not available"}
        </p>
        {vendor.joined && (
          <p className="mb-2 flex items-center gap-1 text-sm text-ink-500">
            <CalendarIcon size={14} className="text-brand-600" /> Joined {vendor.joined}
          </p>
        )}
        {vendor.description && (
          <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-ink-600">{vendor.description}</p>
        )}
      </div>

      {/* Search and categories */}
      <div className="mb-6 space-y-3">
        <label className="relative block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            <SearchIcon size={18} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Search products..."
          />
        </label>

        {categories.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={chip(activeCategory === cat)}>
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-ink-900">Products</h3>
          <span className="text-xs font-semibold text-ink-400">{filtered.length} items</span>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-ink-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card grid place-items-center gap-2 p-12 text-center">
            <SearchIcon size={28} className="text-ink-300" />
            <p className="text-sm font-semibold text-ink-600">No products found</p>
            {(search || activeCategory !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="mt-2 text-xs font-bold text-brand-600 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} vendor={vendor} onAddToCart={quickAdd} />
            ))}
          </div>
        )}
      </div>

      <VariantModal {...modalProps} />

      {toast && (
        <div className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white shadow-xl">
          <CheckIcon size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}