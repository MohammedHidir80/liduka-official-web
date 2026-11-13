"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSave } from "@/context/SaveContext";
import { useSettings } from "@/context/SettingsContext";
import useVendors from "@/hooks/useVendors";
import { locationTier, normRegion, titleCase } from "@/utils/location";
import { ChevronLeftIcon, MapPinIcon, SearchIcon } from "@/components/icons";

function VendorCard({ v }) {
  const { isVendorSaved, toggleSaveVendor } = useSave();
  const followed = isVendorSaved(v.id);
  const place = [v.city, titleCase(normRegion(v.region))].filter(Boolean).join(", ");

  return (
    <div className="card flex flex-col overflow-hidden">
      <Link href={`/vendors/${v.id}`} className="relative block">
        <div className="h-24 w-full bg-brand-50">
          {v.cover && <img src={v.cover} alt="" loading="lazy" className="h-full w-full object-cover opacity-90" />}
        </div>
        <div className="px-4 pb-4">
          <div className="relative -mt-8 mb-2 flex items-end justify-between">
            <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-white shadow-sm">
              {v.avatar ? (
                <img src={v.avatar} alt={v.name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-brand-50 text-xl font-extrabold text-brand-600">
                  {v.name.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <h3 className="truncate text-base font-extrabold text-ink-900">{v.name}</h3>
          <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-semibold text-ink-500">
            <MapPinIcon size={12} /> {place || "Location not available"}
          </p>
        </div>
      </Link>

      <div className="mt-auto border-t border-ink-100 p-3">
        <button
          onClick={() => toggleSaveVendor(v.id)}
          className={`w-full rounded-xl py-2 text-xs font-bold transition ${
            followed ? "bg-ink-100 text-ink-600" : "bg-brand-50 text-brand-700 hover:bg-brand-100"
          }`}
        >
          {followed ? "Following" : "Follow"}
        </button>
      </div>
    </div>
  );
}

export default function ExploreVendorsPage() {
  const { user } = useAuth();
  const { t } = useSettings();
  const { vendors, loading } = useVendors();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return vendors.filter((v) => !s || v.name.toLowerCase().includes(s));
  }, [vendors, q]);

  const hasLocation = Boolean(normRegion(user?.region));

  const nearYou = useMemo(
    () =>
      hasLocation
        ? filtered
            .filter((v) => locationTier(v, user.city, user.region) < 2)
            .sort(
              (a, b) =>
                locationTier(a, user.city, user.region) - locationTier(b, user.city, user.region) ||
                a.name.localeCompare(b.name)
            )
        : [],
    [filtered, hasLocation, user?.city, user?.region]
  );

  const others = useMemo(() => {
    const near = new Set(nearYou.map((v) => v.id));
    return filtered.filter((v) => !near.has(v.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, nearYou]);

  const grid = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4";

  return (
    <div className="container-page max-w-5xl py-4 md:py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/" className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100" aria-label="Back">
          <ChevronLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-extrabold text-ink-900">{t.exploreVendors || "Explore Vendors"}</h1>
      </div>

      <label className="relative mb-6 block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <SearchIcon size={18} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input pl-10"
          placeholder="Search vendors..."
        />
      </label>

      {loading ? (
        <div className={grid}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-ink-500">No vendors found.</p>
      ) : (
        <div className="space-y-8">
          {nearYou.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-extrabold tracking-tight">{t.nearYou || "Near you"}</h2>
              <div className={grid}>
                {nearYou.map((v) => (
                  <VendorCard key={v.id} v={v} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-extrabold tracking-tight">
                {nearYou.length > 0 ? "More vendors" : "All vendors"}
              </h2>
              <div className={grid}>
                {others.map((v) => (
                  <VendorCard key={v.id} v={v} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}