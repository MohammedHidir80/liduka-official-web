"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatPrice } from "@/utils/currency";
import {
  TrashIcon,
  PlusIcon,
  CartIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
} from "@/components/icons";

const STATUS_LABEL = {
  removed: "No longer available",
  inactive: "Unavailable",
  "no-options": "Options needed",
  "out-of-stock": "Out of stock",
};

export default function CartPage() {
  const router = useRouter();
  const { items, ready, cartCount, validCount, subtotalLabel, updateQuantity, removeFromCart } =
    useCart();
  const { t } = useSettings();
  const [notice, setNotice] = useState("");

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  };

  const change = (item, qty) => {
    const result = updateQuantity(item.id, item.variantId, qty);
    if (!result.ok) flash(result.message);
  };

  if (!ready) {
    return (
      <div className="container-page max-w-4xl py-6">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-ink-100" />
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-24 text-center">
        <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-ink-100 text-ink-400">
          <CartIcon size={32} />
        </span>
        <h2 className="text-lg font-extrabold text-ink-900">{t.emptyCart}</h2>
        <p className="mb-6 mt-1 text-sm text-ink-500">{t.emptyCartSub}</p>
        <Link href="/" className="btn-primary">
          {t.startShopping}
        </Link>
      </div>
    );
  }

  const hasInvalid = validCount < items.length;

  return (
    <div className="container-page max-w-4xl py-6">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">
        {t.cart} ({cartCount})
      </h1>

      {notice && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"
        >
          {notice}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          {items.map((item) => {
            const variantText = [item.color, item.size].filter(Boolean).join(" • ");
            return (
              <div
                key={item.key}
                className={`relative flex gap-3 rounded-2xl bg-white p-3 shadow-card ${
                  item.valid ? "" : "opacity-90"
                }`}
              >
                {!item.valid && (
                  <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <AlertTriangleIcon size={11} /> {STATUS_LABEL[item.status]}
                  </span>
                )}

                <Link
                  href={`/products/${item.id}`}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-ink-400">
                      <CartIcon size={24} />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.id}`}
                        className="line-clamp-2 text-sm font-bold text-ink-900"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.id, item.variantId)}
                        className="text-ink-400 transition hover:text-rose-500"
                        aria-label="Remove item"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>

                    {item.status === "no-options" ? (
                      <Link
                        href={`/products/${item.id}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-600"
                      >
                        Select options <ChevronRightIcon size={13} />
                      </Link>
                    ) : (
                      variantText && (
                        <p className="mt-1 text-[11px] font-medium text-ink-500">{variantText}</p>
                      )
                    )}
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-extrabold text-ink-900">
                        {formatPrice(item.unit, item.unitCurrency)}
                      </p>
                      {item.variantStock > 0 && (
                        <p className="text-[11px] text-ink-400">{item.variantStock} available</p>
                      )}
                    </div>

                    <div className="flex items-center rounded-lg border border-ink-200 bg-white">
                      <button
                        onClick={() => change(item, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="grid h-8 w-8 place-items-center text-ink-600 hover:bg-ink-50 disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <span className="text-lg font-bold leading-none">-</span>
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => change(item, item.quantity + 1)}
                        disabled={!item.valid || item.quantity >= item.variantStock}
                        className="grid h-8 w-8 place-items-center text-ink-600 hover:bg-ink-50 disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/checkout?only=${encodeURIComponent(item.key)}`)}
                    disabled={!item.valid}
                    className="mt-3 w-full rounded-lg bg-brand-50 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-20 rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-4 text-base font-extrabold text-ink-900">{t.orderSummary}</h2>

            <div className="mb-4 space-y-2 text-sm text-ink-600">
              <div className="flex justify-between">
                <span>Items</span>
                <span className="font-semibold text-ink-900">
                  {validCount} of {items.length} ready
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="font-semibold text-ink-900">{subtotalLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.delivery}</span>
                <span className="text-xs font-semibold text-ink-500">Calculated at checkout</span>
              </div>
            </div>

            {hasInvalid && (
              <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                Fix or remove the items marked above to continue.
              </p>
            )}

            <button
              onClick={() => router.push("/checkout")}
              disabled={validCount === 0 || hasInvalid}
              className="btn-primary flex w-full justify-center py-3"
            >
              {t.checkout} <ChevronRightIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}