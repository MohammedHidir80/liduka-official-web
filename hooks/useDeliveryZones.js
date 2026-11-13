"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GHANA_REGIONS } from "@/data/ghana";

// One document: settings/deliveryZones. Cached in memory + sessionStorage for 10 minutes,
// so checkout costs at most one read per 10 minutes. Falls back to data/ghana if it does not exist yet.
const KEY = "Liduka.deliveryZones";
const TTL = 10 * 60 * 1000;
let mem = null; // { at, regions }
let inflight = null;

export const zoneKey = (s) =>
  String(s || "").toLowerCase().replace(/\s*region\s*$/, "").trim().replace(/[\s_-]+/g, "_");

export async function loadDeliveryZones() {
  if (mem && Date.now() - mem.at < TTL) return mem.regions;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && Date.now() - c.at < TTL) { mem = c; return c.regions; }
    }
  } catch {}
  if (!inflight) {
    inflight = getDoc(doc(db, "settings", "deliveryZones"))
      .then((snap) => {
        const regions = snap.exists() && snap.data().regions ? snap.data().regions : GHANA_REGIONS;
        mem = { at: Date.now(), regions };
        try { sessionStorage.setItem(KEY, JSON.stringify(mem)); } catch {}
        return regions;
      })
      .catch(() => GHANA_REGIONS) // errors are not cached
      .finally(() => { inflight = null; });
  }
  return inflight;
}

// null (unknown) | { available:false } | { available:true, fee }
export function lookupDeliveryInfo(regions, region, city) {
  if (!region || !city || !regions) return null;
  const entry = Object.entries(regions).find(([k]) => zoneKey(k) === zoneKey(region));
  if (!entry) return null;
  const d = (entry[1].districts || []).find((x) => zoneKey(x.value) === zoneKey(city));
  if (!d) return null;
  if (!d.available) return { available: false };
  return { available: true, fee: Number(d.deliveryFee) || 0 };
}

export default function useDeliveryZones() {
  const [regions, setRegions] = useState(mem?.regions || null);
  useEffect(() => {
    let alive = true;
    loadDeliveryZones().then((r) => alive && setRegions(r));
    return () => { alive = false; };
  }, []);
  return { regions, loading: !regions };
}