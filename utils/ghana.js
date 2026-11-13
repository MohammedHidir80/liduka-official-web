// utils/ghana.js
import { GHANA_REGIONS } from "@/data/ghana";
import { normRegion } from "@/utils/location";

// "tamale_metro" -> "Tamale Metro"
export const districtLabel = (region, city) => {
  const district = GHANA_REGIONS[normRegion(region)]?.districts.find((d) => d.value === city);
  return district?.label || city || "";
};

// "northern" -> "Northern"
export const regionLabel = (region) => {
  const key = normRegion(region);
  return GHANA_REGIONS[key]?.name || key.replace(/\b\w/g, (c) => c.toUpperCase());
};