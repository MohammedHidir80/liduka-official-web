"use client";

import { useCallback, useMemo, useState } from "react";
import { locationTier, normRegion } from "@/utils/location";

// The mix, as a share of all products. Tune the feed here and nowhere else.
export const FEED_MIX = {
  city: 0.6,       // same city as the buyer
  region: 0.25,    // same region, other cities
  other: 0.1,      // other regions
  discovery: 0.05, // random picks from whatever is left
};

const newSeed = () => Math.random().toString(36).slice(2);

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return h >>> 0;
}

export default function useLocationFeed(products = [], { city = "", region = "" } = {}) {
  const [seed, setSeed] = useState(newSeed);
  const reshuffle = useCallback(() => setSeed(newSeed()), []);
  const hasLocation = Boolean(normRegion(region));

  const feed = useMemo(() => {
    if (!products.length) return [];

    // Seeded shuffle: same seed = same order, so live product updates
    // don't scramble the feed. A new seed (page load, reshuffle) mixes it up.
    const shuffle = (list) =>
      [...list].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`));

    // No location saved: plain shuffle, no tiers
    if (!hasLocation) return shuffle(products);

    const sameCity = [];
    const sameRegion = [];
    const other = [];
    for (const p of products) {
      const tier = locationTier(p, city, region);
      (tier === 0 ? sameCity : tier === 1 ? sameRegion : other).push(p);
    }

    const total = products.length;
    const out = [
      ...shuffle(sameCity).slice(0, Math.floor(total * FEED_MIX.city)),
      ...shuffle(sameRegion).slice(0, Math.floor(total * FEED_MIX.region)),
      ...shuffle(other).slice(0, Math.floor(total * FEED_MIX.other)),
    ];

    // Random discovery from what's left
    let used = new Set(out.map((p) => p.id));
    const remaining = products.filter((p) => !used.has(p.id));
    const discoveryCount = Math.max(1, Math.floor(total * FEED_MIX.discovery));
    out.push(...shuffle(remaining).slice(0, discoveryCount));

    // Everything else goes at the end, so the feed always has every product
    used = new Set(out.map((p) => p.id));
    out.push(...shuffle(products.filter((p) => !used.has(p.id))));

    return out;
  }, [products, city, region, hasLocation, seed]);

  return { feed, reshuffle, hasLocation };
}