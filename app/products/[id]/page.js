"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSave } from "@/context/SaveContext";
import useProduct from "@/hooks/useProduct";
import useProductReviews from "@/hooks/useProductReviews";
import useVariantPicker from "@/hooks/useVariantPicker";
import { titleCase, normRegion } from "@/utils/location";
import ReviewSection from "@/components/ReviewSection";
import ReportButton from "@/components/ReportButton";
import {
  StarIcon, StarFilledIcon, HeartIcon, MapPinIcon, ChevronLeftIcon, CheckIcon,
} from "@/components/icons";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();

  const reviewsState = useProductReviews(id);
  const { product, vendor, loading, notFound } = useProduct(id, {
    currency: user?.currency || "GHS",
    rating: reviewsState.average,
    reviews: reviewsState.count,
  });

  if (loading) {
    return (
      <div className="container-page py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-ink-100" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded bg-ink-100" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-ink-100" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-ink-100" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-xl font-bold text-ink-900">Product not found</h1>
        <button onClick={() => router.back()} className="btn-primary mt-4">Go Back</button>
      </div>
    );
  }

  // key = product id, so variant and quantity state reset when the product changes
  return <ProductView key={product.id} product={product} vendor={vendor} reviewsState={reviewsState} />;
}

function ProductView({ product, vendor, reviewsState }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isProductSaved, toggleSaveProduct } = useSave();

  const {
    colors, sizes, selectedColor, selectedSize, selectedVariant, selectColor, selectSize,
  } = useVariantPicker(product.variants, product.totalStock);

  const [qty, setQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  const isSaved = isProductSaved(product.id);
  const images = product.images || [];

  // Stock rules, same as mobile
  const stock = selectedVariant ? Number(selectedVariant.stock) || 0 : 0;
  const isInactive = product.status !== "active";
  const allOutOfStock = product.totalStock <= 0;
  const isOutOfStock = !!selectedVariant && stock <= 0;
  const isUnavailable = isInactive || allOutOfStock || isOutOfStock;
  const safeQty = Math.min(qty, Math.max(stock, 1)); // also covers live stock drops

  const variantKey = `${selectedVariant?.color}|${selectedVariant?.size}`;
  useEffect(() => {
    setQty(1);
    setError("");
  }, [variantKey]);

  const vendorPlace = vendor
    ? [vendor.city, titleCase(normRegion(vendor.region))].filter(Boolean).join(", ")
    : "";

  const increase = () => {
    if (!selectedVariant) return setError("Please select your options first.");
    if (safeQty < stock) setQty(safeQty + 1);
    else setError("No more stock available.");
  };

  const decrease = () => {
    setError("");
    setQty(Math.max(1, safeQty - 1));
  };

  // Writes to carts/{uid}, the same document mobile uses
  const handleAddToCart = (buyNow = false) => {
    if (isUnavailable) return;
    if (!selectedVariant) return setError("Please select an available option before continuing.");

    // Buy Now skips the cart, same as mobile
    if (buyNow) {
      const params = new URLSearchParams({ buy: product.id, q: String(safeQty) });
      if (selectedVariant.variantId) params.set("v", selectedVariant.variantId);
      router.push(`/checkout?${params.toString()}`);
      return;
    }

    const result = addToCart(product, safeQty, selectedVariant);
    if (!result.ok) return setError(result.message);
    setError("");

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const pill = (active, disabled) =>
    `rounded-xl border px-4 py-2 text-sm font-semibold transition ${active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
    } ${disabled ? "cursor-not-allowed opacity-40 line-through" : ""}`;

  const actionLabel = isUnavailable ? "Unavailable" : null;

  return (
    <div className="container-page py-4 pb-32 md:py-8 md:pb-8">
      {/* Back button (desktop) */}
      <button
        onClick={() => router.back()}
        className="mb-6 hidden items-center gap-1 text-sm font-bold text-ink-500 hover:text-ink-900 md:flex"
      >
        <ChevronLeftIcon size={16} /> Back to products
      </button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        {/* LEFT: images and video */}
        <div className="space-y-4">
          <div className="group relative aspect-square overflow-hidden rounded-2xl bg-ink-100">
            {images.length > 0 ? (
              <img
                src={images[activeImageIdx]}
                alt={product.title}
                className="h-full w-full cursor-zoom-in object-cover transition-transform duration-500 hover:scale-105"
                onClick={() => setShowLightbox(true)}
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl font-black text-ink-300">
                No Image
              </div>
            )}

            {product.discount > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-ink-900/85 px-3 py-1 text-xs font-bold text-white">
                -{product.discount}% OFF
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${activeImageIdx === idx
                      ? "border-brand-600"
                      : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {product.video && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-bold text-ink-900">Product Video</h3>
              <div className="overflow-hidden rounded-2xl bg-black shadow-card">
                <video
                  src={product.video}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full object-contain"
                  poster={images[0]}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: details */}
        <div className="flex flex-col">
          {product.category && (
            <div className="mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                {product.category}
              </span>
            </div>
          )}

          <h1 className="mb-2 text-2xl font-extrabold leading-tight text-ink-900 md:text-3xl">
            {product.title}
          </h1>

          <div className="mb-6 flex items-center gap-2">
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i}>
                  {i <= Math.round(reviewsState.average) ? (
                    <StarFilledIcon size={16} />
                  ) : (
                    <StarIcon size={16} className="text-ink-200" />
                  )}
                </span>
              ))}
            </div>
            <span className="text-sm font-semibold text-ink-500">
              {reviewsState.average.toFixed(1)} ({reviewsState.count} reviews)
            </span>
            <div className="ml-auto">
              <ReportButton
                type="product"
                targetId={product.id}
                targetOwnerId={product.vendorId}
              />
            </div>
          </div>

          {/* Price and stock */}
          <div className="mb-6 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-extrabold text-ink-900">{product.displayPrice}</span>
            {product.displayOldPrice && (
              <span className="mb-1 text-lg font-medium text-ink-400 line-through">
                {product.displayOldPrice}
              </span>
            )}
            {allOutOfStock ? (
              <span className="mb-1 rounded-full bg-rose-500 px-3 py-0.5 text-xs font-bold text-white">
                Out of Stock
              </span>
            ) : (
              selectedVariant && (
                <span
                  className={`mb-1 text-sm font-bold ${stock <= 0 ? "text-rose-500" : stock < 10 ? "text-amber-500" : "text-emerald-500"
                    }`}
                >
                  {stock > 0 ? `${stock} in stock` : "Out of stock"}
                </span>
              )
            )}
          </div>

          {/* Vendor card */}
          {vendor && (
            <div className="mb-8 flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {vendor.avatar ? (
                  <img src={vendor.avatar} alt={vendor.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-50 text-lg font-extrabold text-brand-600">
                    {vendor.name.charAt(0)}
                  </span>
                )}
                <div>
                  <span className="font-bold text-ink-900">{vendor.name}</span>
                  {vendorPlace && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                      <MapPinIcon size={12} /> {vendorPlace}
                    </p>
                  )}
                  {vendor.joined && (
                    <p className="text-xs text-ink-400">Joined {vendor.joined}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push(`/vendors/${vendor.id}`)}
                className="btn-outline px-3 py-1.5 text-xs"
              >
                Visit Store
              </button>
            </div>
          )}

          {/* Color */}
          {colors.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-ink-900">Color</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    disabled={c.soldOut}
                    onClick={() => selectColor(c.name)}
                    className={pill(selectedColor === c.name, c.soldOut)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-ink-900">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.name}
                    disabled={s.stock <= 0}
                    onClick={() => selectSize(s.name)}
                    className={pill(selectedSize === s.name, s.stock <= 0)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">Quantity</h3>
            <div className="flex items-center rounded-xl border border-ink-200 bg-white">
              <button
                onClick={decrease}
                className="grid h-10 w-10 place-items-center text-ink-600 hover:bg-ink-50 disabled:opacity-50"
                disabled={safeQty <= 1}
              >
                <span className="text-lg font-bold">-</span>
              </button>
              <span className="w-10 text-center text-sm font-bold">{safeQty}</span>
              <button
                onClick={increase}
                className="grid h-10 w-10 place-items-center text-ink-600 hover:bg-ink-50 disabled:opacity-50"
                disabled={!!selectedVariant && safeQty >= stock}
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>
          </div>

          {error && <p className="mb-4 text-xs font-semibold text-rose-500">{error}</p>}

          {isInactive && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              This product is currently inactive.
            </div>
          )}

          {/* Desktop actions */}
          <div className="mb-8 mt-4 hidden gap-3 md:flex">
            <button
              onClick={() => toggleSaveProduct(product.id)}
              className={`btn-outline w-12 shrink-0 ${isSaved ? "border-rose-200 bg-rose-50 text-rose-500" : ""}`}
              aria-label={isSaved ? "Remove from saved" : "Save product"}
            >
              <HeartIcon size={20} fill={isSaved ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => handleAddToCart(false)}
              disabled={isUnavailable}
              className="btn-outline flex-1 border-2 border-brand-600 py-3 text-brand-700"
            >
              {actionLabel || "Add to Cart"}
            </button>
            <button
              onClick={() => handleAddToCart(true)}
              disabled={isUnavailable}
              className="btn-primary flex-1 py-3"
            >
              {actionLabel || "Buy Now"}
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-ink-100 pt-6">
              <h3 className="mb-2 text-sm font-bold text-ink-900">Description</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 max-w-3xl">
        <ReviewSection
          productId={product.id}
          reviews={reviewsState.reviews}
          average={reviewsState.average}
          count={reviewsState.count}
          loading={reviewsState.loading}
        />
      </div>

      {/* Mobile sticky action bar (sits above BottomNav) */}
      <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-ink-100 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => toggleSaveProduct(product.id)}
            className={`grid w-12 shrink-0 place-items-center rounded-xl border transition ${isSaved ? "border-rose-200 bg-rose-50 text-rose-500" : "border-ink-200 text-ink-600"
              }`}
            aria-label={isSaved ? "Remove from saved" : "Save product"}
          >
            <HeartIcon size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => handleAddToCart(false)}
            disabled={isUnavailable}
            className="flex-1 rounded-xl border-2 border-brand-600 py-3 text-sm font-bold text-brand-700 transition active:scale-[.98] disabled:opacity-50"
          >
            {actionLabel || "Add to Cart"}
          </button>
          <button
            onClick={() => handleAddToCart(true)}
            disabled={isUnavailable}
            className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-50"
          >
            {actionLabel || "Buy Now"}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <img src={images[activeImageIdx]} alt="" className="max-h-full max-w-full object-contain" />
          <button
            className="absolute right-6 top-6 text-3xl font-light text-white"
            onClick={() => setShowLightbox(false)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckIcon size={16} className="text-emerald-400" />
          Added to Cart
        </div>
      )}
    </div>
  );
}