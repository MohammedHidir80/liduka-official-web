"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSave } from "@/context/SaveContext";
import useProducts from "@/hooks/useProducts";
import useVendors from "@/hooks/useVendors";
import useQuickAdd from "@/hooks/useQuickAdd";
import ProductCard from "@/components/ProductCard";
import VariantModal from "@/components/VariantModal";
import { HeartIcon, StoreIcon } from "@/components/icons";
import { normRegion, titleCase } from "@/utils/location";

export default function SavedPage() {
  const { user } = useAuth();
  const { savedProducts, savedVendors, unsaveProduct, toggleSaveVendor } = useSave();
  const { products, loading } = useProducts({ currency: user?.currency || "GHS" });
  const { vendors, vendorById } = useVendors();
  const { quickAdd, modalProps } = useQuickAdd();
  const [activeTab, setActiveTab] = useState("products");

  const mySavedProducts = useMemo(
    () => products.filter((p) => savedProducts.includes(p.id)),
    [products, savedProducts]
  );

  // Saved products that were deleted, deactivated or sold out
  const unavailableIds = useMemo(
    () =>
      loading ? [] : savedProducts.filter((id) => !products.some((p) => p.id === id)),
    [loading, savedProducts, products]
  );

  const mySavedVendors = useMemo(
    () => vendors.filter((v) => savedVendors.includes(v.id)),
    [vendors, savedVendors]
  );

  const tab = (name, label, count) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
        activeTab === name ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-50"
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="container-page py-6">
      <h1 className="mb-4 text-xl font-extrabold tracking-tight">Saved</h1>

      <div className="mb-6 flex gap-2 border-b border-ink-100 pb-2">
        {tab("products", "Products", mySavedProducts.length)}
        {tab("vendors", "Vendors", mySavedVendors.length)}
      </div>

      {activeTab === "products" && (
        <>
          {unavailableIds.length > 0 && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>
                {unavailableIds.length} saved{" "}
                {unavailableIds.length === 1 ? "item is" : "items are"} no longer available.
              </span>
              <button
                onClick={() => unavailableIds.forEach(unsaveProduct)}
                className="shrink-0 font-bold underline"
              >
                Remove
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl bg-ink-100" />
              ))}
            </div>
          ) : mySavedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <HeartIcon size={32} className="mb-3 text-ink-300" />
              <p className="text-sm font-semibold text-ink-600">No saved products</p>
              <p className="mb-4 mt-1 text-xs text-ink-400">
                Tap the heart icon on any product to save it here.
              </p>
              <Link href="/" className="btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {mySavedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  vendor={vendorById[p.vendorId]}
                  onAddToCart={quickAdd}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "vendors" && (
        <>
          {mySavedVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <StoreIcon size={32} className="mb-3 text-ink-300" />
              <p className="text-sm font-semibold text-ink-600">No saved vendors</p>
              <p className="mb-4 mt-1 text-xs text-ink-400">
                Follow your favorite vendors to see them here.
              </p>
              <Link href="/" className="btn-primary">
                Discover Vendors
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {mySavedVendors.map((v) => {
                const place = [v.city, titleCase(normRegion(v.region))].filter(Boolean).join(", ");
                return (
                  <div
                    key={v.id}
                    className="flex flex-col items-center rounded-2xl bg-white p-4 text-center shadow-card"
                  >
                    <Link href={`/vendors/${v.id}`} className="flex flex-col items-center">
                      {v.avatar ? (
                        <img
                          src={v.avatar}
                          alt={v.name}
                          className="mb-3 h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm"
                        />
                      ) : (
                        <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-lg font-extrabold text-brand-600">
                          {v.name.charAt(0)}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-ink-900">{v.name}</h3>
                      <p className="mb-4 mt-1 text-xs text-ink-500">
                        {place || "Location not available"}
                      </p>
                    </Link>
                    <button
                      onClick={() => toggleSaveVendor(v.id)}
                      className="mt-auto w-full rounded-xl border border-ink-200 py-2 text-xs font-bold text-ink-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      Unfollow
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <VariantModal {...modalProps} />
    </div>
  );
}