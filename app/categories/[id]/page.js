"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import useProducts from "@/hooks/useProducts";
import useVendors from "@/hooks/useVendors";
import useSubcategories from "@/hooks/useSubcategories";
import useQuickAdd from "@/hooks/useQuickAdd";
import ProductCard from "@/components/ProductCard";
import VariantModal from "@/components/VariantModal";
import { ChevronLeftIcon, SearchIcon, XIcon } from "@/components/icons";

const SORTS = [
  { value: "default", label: "Default" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "topRated", label: "Top Rated" },
];
const WEEK = 7 * 24 * 60 * 60 * 1000;

const created = (p) => p.createdAt?.toMillis?.() ?? 0;
const amount = (p) => Number(p.displayAmount ?? p.price) || 0;

// Same rules as mobile: NEW for the first week, HOT at 4.5 stars or more
const badgesFor = (p) => {
  const out = [];
  if (created(p) && Date.now() - created(p) < WEEK) out.push("NEW");
  if (p.reviews > 0 && p.rating >= 4.5) out.push("HOT");
  return out;
};

export default function CategoryPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();

  const name = useMemo(() => {
    try {
      return decodeURIComponent(id);
    } catch {
      return String(id);
    }
  }, [id]);

  const { products, loading } = useProducts({ currency: user?.currency || "GHS", category: name });
  const { vendorById } = useVendors();
  const subcategories = useSubcategories(name);
  const { quickAdd, modalProps } = useQuickAdd();

  const [query, setQuery] = useState("");
  const [sub, setSub] = useState("all");
  const [sort, setSort] = useState("default");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (q && !(p.name || "").toLowerCase().includes(q)) return false;
      if (sub === "all") return true;
      const subs = [p.subcategory, ...(Array.isArray(p.subcategories) ? p.subcategories : [])]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return subs.includes(sub.toLowerCase());
    });

    const sorted = [...list];
    if (sort === "priceLow") sorted.sort((a, b) => amount(a) - amount(b));
    else if (sort === "priceHigh") sorted.sort((a, b) => amount(b) - amount(a));
    else if (sort === "newest") sorted.sort((a, b) => created(b) - created(a));
    else if (sort === "topRated") sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted;
  }, [products, query, sub, sort]);

  const chip = (active) =>
    `shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
    }`;

  return (
    <div className="container-page py-4 md:py-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100"
          aria-label="Back"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="truncate text-xl font-extrabold text-ink-900">{name}</h1>
        <span className="ml-auto shrink-0 text-xs font-semibold text-ink-400">
          {visible.length} {visible.length === 1 ? "product" : "products"}
        </span>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            <SearchIcon size={18} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-10 pr-10"
            placeholder={`Search in ${name}...`}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              aria-label="Clear search"
            >
              <XIcon size={16} />
            </button>
          )}
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input sm:w-56"
          aria-label="Sort products"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      {subcategories.length > 0 && (
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSub("all")} className={chip(sub === "all")}>
            All
          </button>
          {subcategories.map((s) => (
            <button key={s} onClick={() => setSub(s)} className={chip(sub === s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-12 text-center">
          <SearchIcon size={28} className="text-ink-300" />
          <p className="text-sm font-semibold text-ink-600">No products found</p>
          <p className="text-xs text-ink-400">Try adjusting your search or filters.</p>
          {(query || sub !== "all" || sort !== "default") && (
            <button
              onClick={() => {
                setQuery("");
                setSub("all");
                setSort("default");
              }}
              className="mt-2 text-xs font-bold text-brand-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              vendor={vendorById[p.vendorId]}
              badges={badgesFor(p)}
              onAddToCart={quickAdd}
            />
          ))}
        </div>
      )}

      <VariantModal {...modalProps} />
    </div>
  );
}