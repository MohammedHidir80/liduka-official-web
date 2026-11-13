"use client";
import { emptyVariant } from "@/lib/vendorProducts";

export default function VariantEditor({ variants, setVariants }) {
  const update = (i, field, value) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));

  return (
    <div className="space-y-3">
      {variants.map((v, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_90px_auto] items-center gap-2">
          <input className="input" placeholder="Size (optional)" value={v.size}
            onChange={(e) => update(i, "size", e.target.value)} />
          <input className="input" placeholder="Color (optional)" value={v.color}
            onChange={(e) => update(i, "color", e.target.value)} />
          <input className="input" type="number" min="0" placeholder="Stock" value={v.stock}
            onChange={(e) => update(i, "stock", e.target.value)} />
          <button type="button" disabled={variants.length === 1}
            onClick={() => setVariants((p) => p.filter((_, idx) => idx !== i))}
            className="px-2 text-red-500 disabled:opacity-30" aria-label="Remove variant">✕</button>
        </div>
      ))}
      <button type="button" className="btn-outline" onClick={() => setVariants((p) => [...p, emptyVariant()])}>
        + Add variant
      </button>
    </div>
  );
}