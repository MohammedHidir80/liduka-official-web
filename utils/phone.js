// utils/phone.js

// "0241234567" -> "+233241234567" (the format sign-up saves). Other numbers keep their country code.
export function normalizePhone(raw) {
  const s = String(raw || "").replace(/[\s()-]/g, "");
  if (!s) return "";
  if (s.startsWith("+")) return s;
  if (s.startsWith("00")) return `+${s.slice(2)}`;
  if (s.startsWith("0")) return `+233${s.slice(1)}`;
  return s;
}

export const isValidPhone = (p) => /^\+?\d{7,15}$/.test(p);