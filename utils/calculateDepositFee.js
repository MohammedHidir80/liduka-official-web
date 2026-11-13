// utils/calculateDepositFee.js
// Preview only. The server recalculates the real fee.
export const calculateDepositFee = (amount, currency) => {
  let fee;
  switch (currency) {
    case "GHS":
    case "KES":
      fee = amount * 0.0195;
      break;
    case "NGN":
      fee = amount * 0.015;
      if (amount > 2500) fee += 100;
      break;
    case "USD":
    case "GBP":
      fee = amount * 0.02;
      break;
    default:
      fee = amount * 0.0195;
  }
  return {
    paystackFee: Number(fee.toFixed(2)),
    grossAmount: Number((amount + fee).toFixed(2)),
  };
};