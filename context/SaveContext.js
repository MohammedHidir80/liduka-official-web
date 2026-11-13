"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// Saved products/vendors: kept in this browser (instant) and in users/{uid}.saved so the mobile app shows the same list.
const STORAGE_KEY = "Liduka.saved.v1";
const SaveContext = createContext(null);
const sigOf = (p, v) => JSON.stringify([[...p].sort(), [...v].sort()]);

export function SaveProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.role === "buyer" ? user.uid : null;

  const [savedProducts, setSavedProducts] = useState([]);
  const [savedVendors, setSavedVendors] = useState([]);
  const [ready, setReady] = useState(false);
  const [syncedUid, setSyncedUid] = useState(null);
  const lastSig = useRef(null);
  const timer = useRef(null);
  const pending = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedProducts(parsed.products || []);
        setSavedVendors(parsed.vendors || []);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ products: savedProducts, vendors: savedVendors })
    );
  }, [savedProducts, savedVendors, ready]);

  // pull the account's saved list (login, and when the tab is opened again)
  useEffect(() => {
    if (!ready || !uid) { setSyncedUid(null); return; }
    let alive = true;
    const pull = async () => {
      if (pending.current) return;
      try {
        const s = (await getDoc(doc(db, "users", uid))).data()?.saved;
        if (!alive) return;
        if (s) {
          const p = Array.isArray(s.products) ? s.products.map(String) : [];
          const v = Array.isArray(s.vendors) ? s.vendors.map(String) : [];
          if (sigOf(p, v) !== lastSig.current) {
            lastSig.current = sigOf(p, v);
            setSavedProducts(p);
            setSavedVendors(v);
          }
        } else {
          lastSig.current = null; // nothing online yet: this browser's list gets uploaded
        }
      } catch (e) {
        console.error("Saved load error:", e?.code, e?.message);
      }
      if (alive) setSyncedUid(uid);
    };
    pull();
    const onVisible = () => document.visibilityState === "visible" && pull();
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; document.removeEventListener("visibilitychange", onVisible); };
  }, [ready, uid]);

  // save changes (one write ~1s after the last tap)
  useEffect(() => {
    if (!uid || syncedUid !== uid) return;
    const sig = sigOf(savedProducts, savedVendors);
    if (sig === lastSig.current) { pending.current = false; return; }
    pending.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", uid), { saved: { products: savedProducts, vendors: savedVendors } }, { merge: true });
        lastSig.current = sig;
      } catch (e) {
        console.error("Saved sync error:", e?.code, e?.message); // permission-denied = Firestore rules block users/{uid}.saved
      } finally {
        pending.current = false;
      }
    }, 1000);
    return () => clearTimeout(timer.current);
  }, [savedProducts, savedVendors, uid, syncedUid]);

  const toggleSaveProduct = (productId) => {
    setSavedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSaveVendor = (vendorId) => {
    setSavedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const unsaveProduct = (id) => setSavedProducts((prev) => prev.filter((x) => x !== id));
  const isProductSaved = (id) => savedProducts.includes(id);
  const isVendorSaved = (id) => savedVendors.includes(id);

  return (
    <SaveContext.Provider
      value={{
        savedProducts,
        savedVendors,
        toggleSaveProduct,
        toggleSaveVendor,
        unsaveProduct,
        isProductSaved,
        isVendorSaved,
      }}
    >
      {children}
    </SaveContext.Provider>
  );
}

export function useSave() {
  const ctx = useContext(SaveContext);
  if (!ctx) throw new Error("useSave must be used inside SaveProvider");
  return ctx;
}