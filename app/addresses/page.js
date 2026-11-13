"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { saveAddress, clearAddress } from "@/lib/profile";
import { getUserLocation } from "@/utils/getUserLocation";
import { getDeliveryInfo } from "@/utils/getDeliveryInfo";
import { districtLabel, regionLabel } from "@/utils/ghana";
import { normRegion } from "@/utils/location";
import {
  ADDRESS_KEYS,
  isAddressSet,
  isKnownRegion,
  regionOptions,
  districtsFor,
  matchDistrict,
  toForm,
  fromForm,
  validateForm,
} from "@/utils/addresses";
import {
  ChevronLeftIcon, HomeIcon, BriefcaseIcon, InfoIcon, TrashIcon, XIcon, MapPinIcon,
} from "@/components/icons";

function AddressEditor({ slotKey, title, address, user, onClose }) {
  const { t } = useSettings();
  const [form, setForm] = useState(() => toForm(address, user.phone || ""));
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const known = form.regionChoice && form.regionChoice !== "other";
  const districts = known ? districtsFor(form.regionChoice) : [];

  const handleDetect = async () => {
    setError("");
    setHint("");
    setLocating(true);
    try {
      const loc = await getUserLocation();
      if (!loc) {
        setError(
          "We couldn't get your location. Allow location access in your browser, or fill in the details by hand."
        );
        return;
      }

      const region = normRegion(loc.region || "");
      const regionKnown = isKnownRegion(region);
      const district = regionKnown ? matchDistrict(region, loc.city) : "";

      setForm((f) => ({
        ...f,
        gps: { latitude: loc.latitude, longitude: loc.longitude },
        country: loc.country || f.country,
        ...(region
          ? {
              regionChoice: regionKnown ? region : "other",
              regionText: regionKnown ? "" : region,
              district,
              cityText: regionKnown ? "" : loc.city || f.cityText,
            }
          : {}),
      }));

      setHint(
        regionKnown && !district
          ? "Location detected. Please pick your district from the list."
          : "Location detected. Please check the details below."
      );
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    setError("");
    const problem = validateForm(form);
    if (problem) return setError(problem);

    setSaving(true);
    try {
      await saveAddress(user.uid, slotKey, fromForm(form));
      onClose();
    } catch (err) {
      console.error("Save address failed:", err);
      setError("Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const label = "mb-1 block text-xs font-bold text-ink-600";
  const hasGps = form.gps.latitude != null && form.gps.longitude != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-ink-100 p-5">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900">{title}</h2>
            <p className="text-xs text-ink-500">Fill in the address details below</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-500 hover:bg-ink-100"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <p className="rounded-xl bg-ink-50 px-4 py-2.5 text-sm font-semibold text-ink-800">
            {user.name}
          </p>

          <div>
            <label className={label}>Phone Number *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="e.g. 0241234567"
              className="input"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className={label}>Region *</label>
            <select
              value={form.regionChoice}
              onChange={(e) => {
                const v = e.target.value;
                set({ regionChoice: v, district: "", regionText: v === "other" ? form.regionText : "" });
              }}
              className="input"
            >
              <option value="">Select region</option>
              {regionOptions.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
              <option value="other">Other region</option>
            </select>
          </div>

          {known && (
            <div>
              <label className={label}>District *</label>
              <select
                value={form.district}
                onChange={(e) => set({ district: e.target.value })}
                className="input"
              >
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                    {d.available === false ? " (delivery unavailable)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.regionChoice === "other" && (
            <>
              <div>
                <label className={label}>Region name *</label>
                <input
                  type="text"
                  value={form.regionText}
                  onChange={(e) => set({ regionText: e.target.value })}
                  placeholder="e.g. Greater Accra"
                  className="input"
                />
              </div>
              <div>
                <label className={label}>City / Town *</label>
                <input
                  type="text"
                  value={form.cityText}
                  onChange={(e) => set({ cityText: e.target.value })}
                  placeholder="e.g. Accra"
                  className="input"
                />
              </div>
            </>
          )}

          <div>
            <label className={label}>Street Address *</label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => set({ street: e.target.value })}
              placeholder="House number, street, landmark"
              className="input"
              autoComplete="street-address"
            />
          </div>

          <div className="rounded-2xl border border-ink-100 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-900">
              <MapPinIcon size={16} className="text-brand-600" /> GPS Coordinates
            </p>
            {hasGps && (
              <p className="mb-3 rounded-lg bg-ink-50 px-3 py-2 font-mono text-xs text-ink-600">
                Lat: {Number(form.gps.latitude).toFixed(6)} · Long: {Number(form.gps.longitude).toFixed(6)}
              </p>
            )}
            <button
              type="button"
              onClick={handleDetect}
              disabled={locating}
              className="w-full rounded-xl bg-brand-50 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
            >
              {locating ? "Detecting location..." : hasGps ? "Detect again" : "Detect Current Location"}
            </button>
            {hint && <p className="mt-2 text-xs font-semibold text-emerald-600">{hint}</p>}
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-ink-100 p-5">
          <button onClick={onClose} disabled={saving} className="btn-outline flex-1 py-3">
            {t.cancel}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-[2] py-3">
            {saving ? "Saving..." : t.saveAddress}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useSettings();
  const [editing, setEditing] = useState(null);

  if (!user) return null;

  const slots = [
    { key: ADDRESS_KEYS[0], title: t.homeAddress, Icon: HomeIcon },
    { key: ADDRESS_KEYS[1], title: t.workAddress, Icon: BriefcaseIcon },
  ];

  const handleDelete = async (slotKey) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await clearAddress(user.uid, slotKey);
    } catch (err) {
      console.error("Delete address failed:", err);
      alert("Could not delete the address. Please try again.");
    }
  };

  const editingSlot = slots.find((s) => s.key === editing);

  return (
    <div className="container-page max-w-2xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100"
          aria-label="Back"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-ink-900">{t.manageAddresses}</h1>
        <div className="w-9" />
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-brand-800">
        <InfoIcon size={20} className="mt-0.5 shrink-0" />
        <p className="text-xs font-semibold leading-relaxed">{t.addressesInfo}</p>
      </div>

      {slots.map(({ key, title, Icon }) => {
        const addr = user.addresses?.[key];
        const set = isAddressSet(addr);
        const noDelivery = set && getDeliveryInfo(normRegion(addr.region), addr.city)?.available === false;

        return (
          <div
            key={key}
            onClick={() => setEditing(key)}
            className="card mb-3 flex cursor-pointer items-center gap-4 border border-transparent p-4 transition hover:border-brand-200"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Icon size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-ink-900">{title}</h3>
              {set ? (
                <>
                  <p className="truncate text-xs text-ink-500">
                    {[addr.street, districtLabel(addr.region, addr.city), regionLabel(addr.region)]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {addr.phone && (
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {t.phoneLabel}: {addr.phone}
                    </p>
                  )}
                  {noDelivery && (
                    <p className="mt-1 text-[11px] font-semibold text-amber-600">
                      Delivery isn't available in this district yet
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-xs italic text-ink-400">{t.noAddressSet}</p>
              )}
            </div>
            <span className="text-sm font-bold text-brand-600">{set ? "Edit" : "Add"}</span>
            {set && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(key);
                }}
                className="grid h-8 w-8 place-items-center rounded-full text-rose-500 transition hover:bg-rose-50"
                aria-label="Delete address"
              >
                <TrashIcon size={18} />
              </button>
            )}
          </div>
        );
      })}

      <div className="mt-8 px-1">
        <h2 className="mb-2 text-base font-bold text-ink-900">Need help?</h2>
        <p className="text-xs leading-relaxed text-ink-500">
          Make sure your address details are accurate for successful deliveries. You can use the GPS
          detection feature to get precise coordinates.
        </p>
      </div>

      {editingSlot && (
        <AddressEditor
          key={editingSlot.key}
          slotKey={editingSlot.key}
          title={editingSlot.title}
          address={user.addresses?.[editingSlot.key]}
          user={user}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}