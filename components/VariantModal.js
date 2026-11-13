"use client";

import { useEffect, useState } from "react";
import { XIcon, PlusIcon } from "./icons";
import useVariantPicker from "@/hooks/useVariantPicker";
import { formatPrice } from "@/utils/currency";

// The inner body remounts every time the modal opens, so selections start fresh.
export default function VariantModal({ isOpen, product, onClose, onConfirm }) {
  if (!isOpen || !product) return null;
  return <VariantModalBody key={product.id} product={product} onClose={onClose} onConfirm={onConfirm} />;
}

function VariantModalBody({ product, onClose, onConfirm }) {
  const {
    colors, sizes, selectedColor, selectedSize, selectedVariant, selectColor, selectSize,
  } = useVariantPicker(product.variants, product.totalStock);

  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  const stock = selectedVariant ? Number(selectedVariant.stock) || 0 : 0;
  const safeQty = Math.min(qty, Math.max(stock, 1));

  const variantKey = `${selectedVariant?.color}|${selectedVariant?.size}`;
  useEffect(() => setQty(1), [variantKey]);

  const unitAmount = product.displayAmount ?? product.price;
  const currency = product.displayCurrency || product.currency || "GHS";

  const handleConfirm = () => {
    if (!selectedVariant) return setError("Please select all options.");
    if (stock <= 0) return setError("This option is out of stock.");
    // The cart takes the variant object itself (variantId, color, size, stock)
    onConfirm(product, safeQty, selectedVariant);
    onClose();
  };

  const pill = (active, disabled) =>
    `rounded-xl border px-4 py-2 text-sm font-semibold transition ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
    } ${disabled ? "cursor-not-allowed opacity-40 line-through" : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:max-h-[80vh] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-ink-100 p-4 sm:p-5">
          <h3 className="text-lg font-extrabold text-ink-900">Select Options</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-500 transition hover:bg-ink-100"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
          {colors.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-bold text-ink-800">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    disabled={c.soldOut}
                    onClick={() => { setError(""); selectColor(c.name); }}
                    className={pill(selectedColor === c.name, c.soldOut)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-bold text-ink-800">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    disabled={s.stock <= 0}
                    onClick={() => { setError(""); selectSize(s.name); }}
                    className={pill(selectedSize === s.name, s.stock <= 0)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-bold text-ink-800">Quantity</p>
              {selectedVariant && (
                <p className="text-xs text-ink-500">
                  {stock > 0 ? `${stock} available` : "Out of stock"}
                </p>
              )}
            </div>
            <div className="flex items-center rounded-xl border border-ink-200 bg-white">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, safeQty - 1))}
                className="grid h-10 w-10 place-items-center text-ink-600 hover:bg-ink-50 disabled:opacity-50"
                disabled={safeQty <= 1}
              >
                <span className="text-lg font-bold">-</span>
              </button>
              <span className="w-10 text-center text-sm font-bold text-ink-900">{safeQty}</span>
              <button
                type="button"
                onClick={() => setQty(safeQty + 1)}
                className="grid h-10 w-10 place-items-center text-ink-600 hover:bg-ink-50 disabled:opacity-50"
                disabled={!selectedVariant || safeQty >= stock}
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
        </div>

        <div className="border-t border-ink-100 p-4 sm:p-5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedVariant || stock <= 0}
            className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to Cart — {formatPrice(unitAmount * safeQty, currency)}
          </button>
        </div>
      </div>
    </div>
  );
}