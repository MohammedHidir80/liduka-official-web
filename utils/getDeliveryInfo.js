// utils/getDeliveryInfo.js
import { GHANA_REGIONS } from "@/data/ghana";

// Delivery info for a region + district. `region` should already be normalized ("northern").
export const getDeliveryInfo = (region, city) => {
  if (!region || !city) return null;

  const regionData = GHANA_REGIONS[String(region).toLowerCase()];
  if (!regionData) return null;

  const district = regionData.districts.find((d) => d.value === city);
  if (!district) return null;

  if (!district.available) {
    return { available: false, message: "Delivery not available in your location" };
  }
  return { available: true, fee: district.deliveryFee || 0 };
};