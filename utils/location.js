// utils/location.js
import { normalizeRegion } from "@/utils/normalizeRegion";

export const normCity = (v) => String(v || "").trim().toLowerCase();
export const normRegion = (v) => normalizeRegion(String(v || ""));

// 0 = same city, 1 = same region, 2 = elsewhere or unknown
export function locationTier(item, city, region) {
  const userRegion = normRegion(region);
  if (!userRegion || normRegion(item?.region) !== userRegion) return 2;
  const userCity = normCity(city);
  return userCity && normCity(item?.city) === userCity ? 0 : 1;
}

export const titleCase = (s = "") => s.replace(/\b\w/g, (m) => m.toUpperCase());