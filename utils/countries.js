// utils/countries.js — the countries Liduka runs in. Shared by the app and the website (same file).
// A person's country is chosen at signup and locked: it sets their currency and which vendors they see.
// To open another country: add it here with enabled: true (and prepare its delivery zones, payout providers and Paystack).
export const COUNTRIES = {
  GH: { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: '₵', dial: '+233', enabled: true },
  NG: { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', dial: '+234', enabled: true },
  KE: { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', dial: '+254', enabled: true },
  ZA: { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', dial: '+27', enabled: true },
};

export const signupCountries = () => Object.values(COUNTRIES).filter((c) => c.enabled);
export const countryByCode = (code) => COUNTRIES[String(code || '').toUpperCase()] || null;
export const countryByName = (name) => {
  const n = String(name || '').trim().toLowerCase();
  return Object.values(COUNTRIES).find((c) => c.name.toLowerCase() === n) || null;
};
export const countryByCurrency = (cur) => Object.values(COUNTRIES).find((c) => c.currency === cur) || null;

// 🇬🇭 from "GH" (works on phones and browsers; falls back to the code if flags are not drawn)
export const flagOf = (code) =>
  String(code || '').length === 2 ? String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 127397 + ch.charCodeAt(0))) : '';
