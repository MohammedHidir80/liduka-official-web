// utils/addresses.js
import { GHANA_REGIONS } from "@/data/ghana";
import { normCity, normRegion } from "@/utils/location";
import { normalizePhone, isValidPhone } from "@/utils/phone";

// Same two slots as mobile: Home = address1, Work = address2
export const ADDRESS_KEYS = ["address1", "address2"];

export const EMPTY_ADDRESS = {
  phone: "",
  region: "",
  city: "",
  street: "",
  gps: { latitude: null, longitude: null },
};

export const regionOptions = Object.entries(GHANA_REGIONS).map(([key, r]) => ({
  key,
  name: r.name,
}));

export const isKnownRegion = (key) => !!GHANA_REGIONS[key];
export const districtsFor = (regionKey) => GHANA_REGIONS[regionKey]?.districts || [];

// checkout only accepts addresses with these three
export const isAddressSet = (a) => !!(a?.street && a?.city && a?.region);

// "Tamale" (from the GPS lookup) -> "tamale_metro"
export function matchDistrict(regionKey, cityText) {
  const c = normCity(cityText);
  if (!c) return "";
  const hit = districtsFor(regionKey).find((d) => {
    const label = normCity(d.label);
    const value = d.value.replace(/_/g, " ");
    return label === c || label.startsWith(c) || c.startsWith(label) || value === c || value.startsWith(c);
  });
  return hit?.value || "";
}

// Saved address -> form state
export function toForm(addr, fallbackPhone = "") {
  const a = { ...EMPTY_ADDRESS, ...(addr || {}) };
  const region = normRegion(a.region);
  const known = isKnownRegion(region);
  const districtOk = known && districtsFor(region).some((d) => d.value === a.city);

  return {
    phone: a.phone || fallbackPhone,
    regionChoice: known ? region : region ? "other" : "",
    regionText: known ? "" : region,
    district: districtOk ? a.city : "",
    cityText: known ? "" : a.city || "",
    street: a.street || "",
    gps: { latitude: a.gps?.latitude ?? null, longitude: a.gps?.longitude ?? null },
    country: a.country || "",
  };
}

// Returns an error message, or "" when the form is complete
export function validateForm(form) {
  const phone = normalizePhone(form.phone);
  if (!phone) return "Phone number is required.";
  if (!isValidPhone(phone)) return "Please enter a valid phone number.";
  if (!form.regionChoice) return "Select your region.";

  if (form.regionChoice === "other") {
    if (!normRegion(form.regionText)) return "Enter your region.";
    if (!form.cityText.trim()) return "Enter your city or town.";
  } else if (!form.district) {
    return "Select your district.";
  }

  if (!form.street.trim()) return "Street address is required.";
  return "";
}

// Form state -> the object saved to Firestore (same shape as mobile)
export function fromForm(form) {
  const known = form.regionChoice && form.regionChoice !== "other";
  return {
    phone: normalizePhone(form.phone),
    region: known ? form.regionChoice : normRegion(form.regionText),
    city: known ? form.district : form.cityText.trim(),
    street: form.street.trim(),
    gps: {
      latitude: form.gps.latitude ?? null,
      longitude: form.gps.longitude ?? null,
    },
    ...(form.country ? { country: form.country } : {}),
  };
}