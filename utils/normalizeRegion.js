// utils/normalizeRegion.js
// Same logic as mobile: "Northern Region" -> "northern"
export const normalizeRegion = (region = "") => {
  return String(region || "")
    .toLowerCase()
    .replace(" region", "")
    .trim();
};