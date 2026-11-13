"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import useProducts from "@/hooks/useProducts";
import useVendors from "@/hooks/useVendors";
import useQuickAdd from "@/hooks/useQuickAdd";
import ProductCard from "@/components/ProductCard";
import VariantModal from "@/components/VariantModal";
import { normRegion, titleCase } from "@/utils/location";
import { SearchIcon, ChevronLeftIcon } from "@/components/icons";

function SearchResultsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const { t } = useSettings();

  const query = (params.get("q") || "").trim();
  const [input, setInput] = useState(query);
  useEffect(() => setInput(query), [query]);

  const { products, loading } = useProducts({ currency: user?.currency || "GHS" });
  const { vendors, vendorById, loading: vendorsLoading } = useVendors();
  const { quickAdd, modalProps } = useQuickAdd();

  const q = query.toLowerCase();

  const matchedProducts = useMemo(() => {
    if (!q) return [];
    const rank = (p) => {
      const n = (p.name || "").toLowerCase();
      return n.startsWith(q) ? 0 : n.includes(q) ? 1 : 2;
    };
    return products
      .filter((p) =>
        [p.name, p.category, p.subcategory, ...(Array.isArray(p.subcategories) ? p.subcategories : [])]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q))
      )
      .sort((a, b) => rank(a) - rank(b));
  }, [products, q]);

  const matchedVendors = useMemo(
    () => (q ? vendors.filter((v) => v.name.toLowerCase().includes(q)) : []),
    [vendors, q]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  const busy = loading || vendorsLoading;
  const hasResults = matchedVendors.length > 0 || matchedProducts.length > 0;

  return (
    <div className="container-page max-w-5xl py-4 md:py-6">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-ink-100"
          aria-label="Back"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <form onSubmit={handleSubmit} className="flex-1">
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
              <SearchIcon size={18} />
            </span>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input pl-10 shadow-sm"
              placeholder={t.search}
            />
          </label>
        </form>
      </div>

      {!query ? (
        <p className="py-20 text-center text-sm text-ink-500">Type something to start searching...</p>
      ) : busy ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      ) : !hasResults ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-ink-50 text-ink-300">
            <SearchIcon size={32} />
          </div>
          <h2 className="mb-1 text-lg font-bold text-ink-900">
            {t.noResults} "{query}"
          </h2>
          <p className="mb-6 text-sm text-ink-500">Try checking your spelling or using more general terms.</p>
          <button onClick={() => router.push("/")} className="btn-primary">
            Back to Home
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {matchedVendors.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-extrabold tracking-tight text-ink-900">
                Vendors ({matchedVendors.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {matchedVendors.map((v) => {
                  const place = [v.city, titleCase(normRegion(v.region))].filter(Boolean).join(", ");
                  return (
                    <Link
                      key={v.id}
                      href={`/vendors/${v.id}`}
                      className="card flex items-center gap-3 border border-transparent p-3 transition hover:border-brand-200"
                    >
                      {v.avatar ? (
                        <img src={v.avatar} alt={v.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-50 text-base font-extrabold text-brand-600">
                          {v.name.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-ink-900">{v.name}</h3>
                        <p className="truncate text-xs text-ink-500">{place || "Location not available"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {matchedProducts.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-extrabold tracking-tight text-ink-900">
                Products ({matchedProducts.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {matchedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} vendor={vendorById[p.vendorId]} onAddToCart={quickAdd} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <VariantModal {...modalProps} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center">Loading...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}