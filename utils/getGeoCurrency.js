// utils/getGeoCurrency.js
export const getGeoCurrency = async () => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    if (data && data.country_name && data.currency && data.currency_symbol) {
      return {
        country: data.country_name,
        currency: data.currency,
        symbol: data.currency_symbol,
      };
    }
    return { country: "Ghana", currency: "GHS", symbol: "₵" };
  } catch (error) {
    console.log("GeoCurrency Error:", error);
    return { country: "Ghana", currency: "GHS", symbol: "₵" };
  }
};