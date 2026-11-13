"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HeartIcon, StarFilledIcon, CartIcon } from "./icons";
import { formatPrice } from "@/utils/currency";
import { useSave } from "@/context/SaveContext";

export default function ProductCard({ product, vendor, onAddToCart, badges = [] }) {
  const { isProductSaved, toggleSaveProduct } = useSave();
  const saved = isProductSaved(product.id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product.images || [];
  const hasMultipleImages = images.length > 1;
  const name = product.title || product.name || "";

  useEffect(() => {
    if (!hasMultipleImages) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hasMultipleImages, images.length]);

  // Prepared by useProducts (buyer's currency). The fallback keeps other pages
  // that still pass older product objects working, and never shows "$".
  const price =
    product.displayPrice ?? formatPrice(product.price, product.currency || "GHS");

  const oldPrice =
    product.displayOldPrice ??
    (product.oldPrice > product.price
      ? formatPrice(product.oldPrice, product.currency || "GHS")
      : null);

  const discount =
    product.discount ??
    (product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0);

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggleSaveProduct(product.id);
        }}
        aria-label={saved ? "Remove from saved" : "Save product"}
        className={`absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full
          bg-white/90 shadow-card backdrop-blur transition active:scale-90 ${saved ? "text-rose-500" : "text-ink-500"
          }`}
      >
        <HeartIcon size={17} fill={saved ? "currentColor" : "none"} />
      </button>

      <Link href={`/products/${product.id}`} className="block relative flex-1">
        <div className="relative grid aspect-[4/3] place-items-center bg-ink-100 overflow-hidden">
          {images.length > 0 ? (
            <img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-black tracking-tight opacity-70 text-ink-400">
              No Image
            </span>
          )}

          {hasMultipleImages && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                />
              ))}
            </div>
          )}

          {(discount > 0 || badges.length > 0) && (
            <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
              {discount > 0 && (
                <span className="rounded-full bg-ink-900/85 px-2 py-0.5 text-[10px] font-bold text-white">
                  -{discount}%
                </span>
              )}
              {badges.map((b) => (
                <span
                  key={b}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${b === "NEW" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1 p-3 pb-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {vendor?.name ?? "Vendor"}
          </p>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-ink-800">
            {name}
          </h3>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-base font-extrabold text-ink-900">{price}</span>
            {oldPrice && (
              <span className="text-xs font-medium text-ink-400 line-through">
                {oldPrice}
              </span>
            )}
          </div>

          <div className="flex min-h-[1rem] items-center gap-1 text-[11px] font-semibold text-ink-500">
            {product.reviews > 0 ? (
              <>
                <StarFilledIcon size={12} className="text-amber-500" />
                {Number(product.rating).toFixed(1)}
                <span className="font-normal text-ink-400">({product.reviews})</span>
              </>
            ) : (
              <span className="font-normal text-ink-400">No reviews yet</span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-3 pt-2 mt-auto">
        <button
          type="button"
          onClick={() => onAddToCart && onAddToCart(product)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-50 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100 active:scale-[.98]"
        >
          <CartIcon size={16} />
          Add to Cart
        </button>
      </div>
    </article>
  );
}