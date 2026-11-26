"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
import { welcomeFor } from "@/utils/greetings";
import ProductCard from "@/components/ProductCard";
import PromoBanner from "@/components/PromoBanner";
import VariantModal from "@/components/VariantModal";
import VerifiedBadge from "@/components/VerifiedBadge";
import { SearchIcon, ChevronRightIcon, MapPinIcon } from "@/components/icons";

const FOR_YOU_COUNT = 8;
const CATEGORY_COUNT = 4;
const VENDOR_BLOCK = 6; // vendors per "Vendors near you" strip

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

// Strip of vendor cards ("Vendors near you")
function VendorStrip({ list, seeMore, isVendorSaved, toggleSaveVendor }) {
  if (list.length === 0) return null;
  return (
    <section>
      <SectionHeader title="Vendors near you" href="/vendors" seeMore={seeMore} />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {list.map((v) => {
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
                <p className="flex items-center gap-1 text-sm font-bold text-ink-800">
                  <span className="truncate">{v.name}</span>
                  {v.verified && <VerifiedBadge size={14} className="shrink-0" />}
                </p>
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
  );
}

// Pull down at the top of the page (phones) to reload. The refresh reloads the page, so new products show up.
const PULL_AT = 64;
function usePullToRefresh() {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let startY = null;
    let dist = 0;
    const html = document.documentElement;
    const prev = html.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = "contain"; // stop the browser's own pull-to-refresh so there is only one
    const start = (e) => { startY = window.scrollY <= 0 && window.innerWidth < 768 ? e.touches[0].clientY : null; dist = 0; };
    const move = (e) => {
      if (startY == null) return;
      dist = (e.touches[0].clientY - startY) * 0.5;
      if (dist > 0 && window.scrollY <= 0) setPull(Math.min(dist, 90)); else setPull(0);
    };
    const end = () => {
      if (startY != null && dist >= PULL_AT) { setBusy(true); setPull(PULL_AT); window.location.reload(); return; }
      startY = null; dist = 0; setPull(0);
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      html.style.overscrollBehaviorY = prev;
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  }, []);
  return { pull, busy };
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
  const { pull, busy: refreshing } = usePullToRefresh();

  const seeMore = t.seeMore || "See more";

  // Welcome in the language of the account's country (Ghana, Nigeria, Kenya, South Africa); "Welcome" elsewhere
  const hello = welcomeFor(user?.countryCode, t.welcome || "Welcome");
  const firstName = user?.name?.split(" ")[0] || "";

  const locationLabel = [user?.city, titleCase(normRegion(user?.region))]
    .filter(Boolean)
    .join(", ");

  const forYou = feed.slice(0, FOR_YOU_COUNT);

  const sortedVendors = useMemo(
    () =>
      [...vendors].sort(
        (a, b) =>
          locationTier(a, user?.city, user?.region) - locationTier(b, user?.city, user?.region) ||
          a.name.localeCompare(b.name)
      ),
    [vendors, user?.city, user?.region]
  );

  // Strip number k shows the next VENDOR_BLOCK vendors. With few vendors it wraps round (repeats);
  // once there are enough vendors every strip shows different ones.
  const vendorBlock = (k) => {
    const n = sortedVendors.length;
    if (n <= VENDOR_BLOCK) return sortedVendors;
    return Array.from({ length: VENDOR_BLOCK }, (_, j) => sortedVendors[(k * VENDOR_BLOCK + j) % n]);
  };

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
      {/* pull-to-refresh indicator (phones) */}
      {pull > 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-14 z-30 flex justify-center md:hidden" style={{ transform: `translateY(${pull * 0.6}px)` }}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-card">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              className={`text-brand-600 ${refreshing ? "animate-spin" : ""}`}
              style={refreshing ? undefined : { transform: `rotate(${Math.min(pull / PULL_AT, 1) * 360}deg)`, opacity: Math.min(pull / PULL_AT, 1) }}>
              <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" />
            </svg>
          </span>
        </div>
      )}

      {/* Header & Search */}
      <section>
        {locationLabel && (
          <p className="flex items-center gap-1 text-xs font-semibold text-ink-400">
            <MapPinIcon size={13} /> {locationLabel}
          </p>
        )}
        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900">
          {hello.word}
          {firstName && `, ${firstName}`}
        </h1>

        <form onSubmit={handleSearchSubmit} className="relative mt-4 block md:hidden">
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

        {/* desktop: the search lives in the top bar, so a banner sits here instead */}
        <div className="mt-4 hidden md:block">
          <PromoBanner compact />
        </div>
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

      {/* Vendors near you (first strip) */}
      <VendorStrip list={vendorBlock(0)} seeMore={seeMore} isVendorSaved={isVendorSaved} toggleSaveVendor={toggleSaveVendor} />

      {/* Categories */}
      {categorySections.map(({ name, items }, idx) => (
        <Fragment key={name}>
        <section>
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
        {/* rhythm: category, ad, category, vendors, category, ad, ... */}
        {idx % 2 === 0 ? (
          <PromoBanner startAt={Math.floor(idx / 2) % 2} />
        ) : (
          <VendorStrip
            list={vendorBlock(Math.floor(idx / 2) + 1)}
            seeMore={seeMore}
            isVendorSaved={isVendorSaved}
            toggleSaveVendor={toggleSaveVendor}
          />
        )}
        </Fragment>
      ))}

      <VariantModal {...modalProps} />
    </div>
  );
}