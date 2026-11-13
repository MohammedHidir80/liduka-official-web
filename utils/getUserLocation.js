// utils/getUserLocation.js
// Web version of mobile's getBuyerLocation(). Returns null if the user
// denies permission or anything fails, so sign-up always continues.
import { normalizeRegion } from "@/utils/normalizeRegion";


export const getUserLocation = async () => {
  if (typeof window === "undefined" || !("geolocation" in navigator)) return null;

  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      })
    );

    const { latitude, longitude } = pos.coords;
    const location = { latitude, longitude };

    // Reverse geocode -> city / region / country. If this fails we still keep lat/long.
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      if (res.ok) {
        const d = await res.json();
        const city = d.city || d.locality;
        if (city) location.city = city;
        if (d.principalSubdivision) location.region = d.principalSubdivision;
        if (d.countryName) location.country = d.countryName;
      }
      if (d.principalSubdivision) {
        location.regionLabel = d.principalSubdivision.replace(/\s+region$/i, "");
        location.region = normalizeRegion(d.principalSubdivision);
      }

    } catch (e) {
      console.log("Reverse geocode failed:", e);
    }

    return location;
  } catch (e) {
    console.log("Location unavailable:", e?.message);
    return null; // permission denied, timeout, or unsupported
  }
};