"use client";
// hooks/useCheckoutQuote.js — asks the server (it knows each product's real currency) whether the cart has
// products from another country. If so it returns a price locked for 15 minutes (with the conversion margin).
// `checked` = the server answered; `quote` is null for all-local carts.
import { useCallback, useEffect, useState } from "react";
import { getCheckoutQuote } from "@/lib/placeOrder";

export default function useCheckoutQuote(lines, enabled) {
  const [state, setState] = useState({ quote: null, loading: false, error: "", checked: false });
  const [now, setNow] = useState(Date.now());
  const key = JSON.stringify((lines || []).map((l) => [l.id, l.variantId || null, l.quantity]));

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "", checked: false }));
    try {
      const q = await getCheckoutQuote(lines);
      setState({ quote: q.crossBorder ? q : null, loading: false, error: "", checked: true });
    } catch (e) {
      setState({ quote: null, loading: false, error: e.message || "Could not get a price quote.", checked: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (enabled) load();
    else setState({ quote: null, loading: false, error: "", checked: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  useEffect(() => {
    if (!state.quote) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.quote]);

  const secondsLeft = state.quote ? Math.max(0, Math.floor((state.quote.expiresAtMs - now) / 1000)) : 0;
  return { ...state, secondsLeft, expired: !!state.quote && secondsLeft === 0, refresh: load };
}