// utils/fees.js
export const getPlatformFee = (currency, amount) => {
  const feeConfig = {
    GHS: { percent: 0.02, flat: 1 },
    NGN: { percent: 0.015, flat: 100 },
    USD: { percent: 0.025, flat: 0.2 },
    GBP: { percent: 0.02, flat: 0.15 },
    KES: { percent: 0.018, flat: 10 },
  };

  // Ghana tiers
  if (currency === "GHS") {
    if (amount <= 100) return 0.49; // flat ₵0.49
    if (amount <= 1500) return parseFloat((amount * 0.01).toFixed(2)); // 1%
    return 19.9; // flat ₵19.90
  }

  // Nigeria tiers
  if (currency === "NGN") {
    if (amount <= 20000) return 69.99;
    if (amount <= 200000) return parseFloat((amount * 0.007).toFixed(2));
    return 2000;
  }

  const { percent, flat } = feeConfig[currency] || { percent: 0.02, flat: 1 };
  return parseFloat((amount * percent + flat).toFixed(2));
};