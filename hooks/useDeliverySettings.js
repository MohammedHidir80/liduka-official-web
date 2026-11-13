"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const KEY = "Liduka.deliverySettings";
const TTL = 10 * 60 * 1000; // 10 minutes
const DEFAULT = { mode: "vendor" };

let memory = null; // { value, at }
let inflight = null;

function readCache() {
  if (memory && Date.now() - memory.at < TTL) return memory.value;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Date.now() - p.at < TTL) {
        memory = p;
        return p.value;
      }
    }
  } catch {}
  return null;
}

function writeCache(value) {
  memory = { value, at: Date.now() };
  try { sessionStorage.setItem(KEY, JSON.stringify(memory)); } catch {}
}

// One Firestore read per ~10 minutes per browser session, and only where it's used (checkout)
export async function loadDeliverySettings() {
  const cached = readCache();
  if (cached) return cached;
  if (!inflight) {
    inflight = getDoc(doc(db, "settings", "delivery"))
      .then((s) => {
        const value = { mode: s.exists() && s.data().mode === "platform" ? "platform" : "vendor" };
        writeCache(value);
        return value;
      })
      .catch((e) => {
        console.log("Delivery settings error:", e);
        return DEFAULT; // not cached, so it retries next time
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export default function useDeliverySettings() {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    let alive = true;
    loadDeliverySettings().then((v) => alive && setSettings(v));
    return () => { alive = false; };
  }, []);
  return { settings, loading: !settings };
}