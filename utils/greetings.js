// utils/greetings.js — the welcome word for each country we serve. The country comes from the account
// (user.countryCode, set by the server from the IP at signup). Any other country gets the fallback.
const WELCOME = {
  GH: { word: "A maraaba", lang: "Dagbani" },
  NG: { word: "Ẹ káàbọ̀", lang: "Yoruba" },
  KE: { word: "Karibu", lang: "Swahili" },
  ZA: { word: "Siyakwamukela", lang: "Zulu" },
};

export function welcomeFor(countryCode, fallback = "Welcome") {
  return WELCOME[String(countryCode || "").toUpperCase()] || { word: fallback, lang: "" };
}