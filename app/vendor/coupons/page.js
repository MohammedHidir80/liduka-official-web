"use client";
import { useState } from "react";
import useVendorCoupons from "@/hooks/useVendorCoupons";
import { createCoupon, setCouponActive, deleteCoupon, generateCode, MAX_ACTIVE, MAX_PERCENT } from "@/lib/vendorCoupons";

export default function VendorCouponsPage() {
  const { uid, coupons, categories, activeCount, loading } = useVendorCoupons();
  const [code, setCode] = useState("");
  const [auto, setAuto] = useState(false);
  const [value, setValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const toggleCat = (c) => setSelected((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setNotice("");
    setBusy(true);
    try {
      const finalCode = auto ? generateCode(uid, 6) : code.trim().toUpperCase();
      await createCoupon({ vendorId: uid, code: finalCode, discountValue: value, isActive, categories: selected, activeCount });
      setNotice(`Coupon ${finalCode} created.`);
      setCode(""); setValue(""); setSelected([]); setAuto(false); setIsActive(true);
    } catch (err) {
      setError(err.message || "Failed to create coupon.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c) => {
    setError(""); setNotice("");
    try { await setCouponActive(uid, c, !c.isActive, activeCount); }
    catch (err) { setError(err.message || "Failed to update coupon."); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    try { await deleteCoupon(uid, c); } catch (err) { setError("Failed to delete coupon."); }
  };

  return (
    <div className="container-page max-w-2xl space-y-6 py-6">
      <h1 className="text-2xl font-bold text-ink-900">Coupons</h1>

      <form onSubmit={submit} className="card space-y-3 p-4">
        <h2 className="font-semibold">Create coupon</h2>
        <p className="text-xs text-ink-500">Percentage discounts only (max {MAX_PERCENT}%). You can have {MAX_ACTIVE} active coupons at a time ({activeCount} active now).</p>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-generate code
        </label>
        {!auto && (
          <input className="input uppercase" placeholder="Coupon code (e.g. SAVE10)" value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))} maxLength={20} />
        )}
        <input className="input" type="number" min="1" max={MAX_PERCENT} placeholder="Discount %" value={value}
          onChange={(e) => setValue(e.target.value)} />

        {categories.length > 0 && (
          <div>
            <p className="mb-1 text-sm text-ink-500">Applies to (leave empty for all your products)</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button type="button" key={c} onClick={() => toggleCat(c)} className={selected.includes(c) ? "btn-primary" : "btn-outline"}>{c}</button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          {isActive ? "Active immediately" : "Save as inactive"}
        </label>

        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        {notice && <p className="rounded-lg bg-green-50 p-2 text-sm text-green-700">{notice}</p>}
        <button className="btn-primary w-full" disabled={busy || !uid}>{busy ? "Creating…" : "Create coupon"}</button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">Your coupons</h2>
        {loading ? <p className="text-ink-500">Loading…</p> : coupons.length === 0 ? (
          <div className="card p-6 text-center text-ink-500">No coupons yet.</div>
        ) : coupons.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-lg font-bold">{c.code}</p>
              <p className="text-sm">{c.discountValue}% off · {c.appliesTo ? `Applies to: ${c.appliesTo.join(", ")}` : "All products"}</p>
              <p className="text-xs text-ink-500">Used by {c.totalUsers} customers • {c.totalUsed} times</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {c.isActive ? "Active" : "Inactive"}
            </span>
            <button className="btn-outline" onClick={() => toggle(c)}>{c.isActive ? "Deactivate" : "Activate"}</button>
            <button className="text-red-500" onClick={() => remove(c)} aria-label="Delete coupon">🗑</button>
          </div>
        ))}
      </section>
    </div>
  );
}