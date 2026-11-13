"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSave } from "@/context/SaveContext";
import { useSettings } from "@/context/SettingsContext";
import useProducts from "@/hooks/useProducts";
import useVendors from "@/hooks/useVendors";
import useLocationFeed from "@/hooks/useLocationFeed";
import useQuickAdd from "@/hooks/useQuickAdd";
import { HOME_CATEGORIES } from "@/data/categories";
import { locationTier, normRegion, titleCase } from "@/utils/location";
import ProductCard from "@/components/ProductCard";
import VariantModal from "@/components/VariantModal";
import { SearchIcon, ChevronRightIcon, MapPinIcon } from "@/components/icons";

const FOR_YOU_COUNT = 8;
const CATEGORY_COUNT = 4;

function SectionHeader({ title, href, seeMore }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-base font-extrabold tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-xs font-bold text-brand-600">
          {seeMore} <ChevronRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl bg-ink-100" />
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useSettings();
  const { toggleSaveVendor, isVendorSaved } = useSave();

  const { products, loading } = useProducts({ currency: user?.currency || "GHS" });
  const { vendors, vendorById } = useVendors();
  const { feed } = useLocationFeed(products, { city: user?.city, region: user?.region });
  const { quickAdd, modalProps } = useQuickAdd();

  const [query, setQuery] = useState("");

  const seeMore = t.seeMore || "See more";

  const locationLabel = [user?.city, titleCase(normRegion(user?.region))]
    .filter(Boolean)
    .join(", ");

  const forYou = feed.slice(0, FOR_YOU_COUNT);

  const nearbyVendors = useMemo(
    () =>
      [...vendors]
        .sort(
          (a, b) =>
            locationTier(a, user?.city, user?.region) - locationTier(b, user?.city, user?.region) ||
            a.name.localeCompare(b.name)
        )
        .slice(0, 6),
    [vendors, user?.city, user?.region]
  );

  const categorySections = useMemo(
    () =>
      HOME_CATEGORIES.map((name) => ({
        name,
        items: feed
          .filter((p) => (p.category || "").trim().toLowerCase() === name.toLowerCase())
          .slice(0, CATEGORY_COUNT),
      })).filter((s) => s.items.length > 0),
    [feed]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="container-page space-y-8 py-4">
      {/* Header & Search */}
      <section>
        {locationLabel && (
          <p className="flex items-center gap-1 text-xs font-semibold text-ink-400">
            <MapPinIcon size={13} /> {locationLabel}
          </p>
        )}
        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900">
          Hi {user?.name?.split(" ")[0]}
        </h1>

        <form onSubmit={handleSearchSubmit} className="relative mt-4 block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            <SearchIcon size={18} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-10 shadow-sm"
            placeholder={t.search}
          />
        </form>
      </section>

      {/* For you (location feed) */}
      <section>
        <SectionHeader title="For you" />
        {loading ? (
          <ProductSkeleton />
        ) : forYou.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-card">
            No products available yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {forYou.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                vendor={vendorById[p.vendorId]}
                onAddToCart={quickAdd}
              />
            ))}
          </div>
        )}
      </section>

      {/* Vendors near you */}
      {nearbyVendors.length > 0 && (
        <section>
          <SectionHeader title="Vendors near you" href="/vendors" seeMore={seeMore} />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {nearbyVendors.map((v) => {
              const followed = isVendorSaved(v.id);
              const place = [v.city, titleCase(normRegion(v.region))].filter(Boolean).join(", ");
              return (
                <div key={v.id} className="relative w-40 shrink-0 rounded-2xl bg-white p-3 shadow-card">
                  <Link href={`/vendors/${v.id}`} className="block">
                    {v.avatar ? (
                      <img src={v.avatar} alt={v.name} className="mb-2 h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-sm font-extrabold text-brand-600">
                        {v.name.charAt(0)}
                      </span>
                    )}
                    <p className="truncate text-sm font-bold text-ink-800">{v.name}</p>
                    <p className="truncate text-[11px] text-ink-400">{place || "Location not available"}</p>
                  </Link>
                  <button
                    onClick={() => toggleSaveVendor(v.id)}
                    className={`mt-3 w-full rounded-lg py-1 text-[11px] font-bold transition ${
                      followed ? "bg-ink-100 text-ink-600" : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    }`}
                  >
                    {followed ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Categories */}
      {categorySections.map(({ name, items }) => (
        <section key={name}>
          <SectionHeader
            title={name}
            href={`/categories/${encodeURIComponent(name)}`}
            seeMore={seeMore}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                vendor={vendorById[p.vendorId]}
                onAddToCart={quickAdd}
              />
            ))}
          </div>
        </section>
      ))}

      <VariantModal {...modalProps} />
    </div>
  );
}