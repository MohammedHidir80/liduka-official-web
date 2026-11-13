"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CouponContext = createContext(null);

export function CouponProvider({ children }) {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "vendor") {
      setCoupons([]);
      setReady(true);
      return;
    }
    try {
      const raw = localStorage.getItem(`Liduka.coupons.${user.vendorId}`);
      if (raw) setCoupons(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (!ready || !user || user.role !== "vendor") return;
    localStorage.setItem(`Liduka.coupons.${user.vendorId}`, JSON.stringify(coupons));
  }, [coupons, user, ready]);

  const addCoupon = (coupon) => {
    setCoupons((prev) => [coupon, ...prev]);
  };

  const toggleCoupon = (code) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.code === code ? { ...c, isActive: !c.isActive, status: !c.isActive ? "active" : "inactive" } : c
      )
    );
  };

  const deleteCoupon = (code) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code));
  };

  const generateCode = (length = 6) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return `LDK${out}`;
  };

  const isCodeTaken = (code) => coupons.some((c) => c.code === code);
  const activeCount = coupons.filter((c) => c.isActive).length;

  return (
    <CouponContext.Provider value={{ coupons, addCoupon, toggleCoupon, deleteCoupon, generateCode, isCodeTaken, activeCount, ready }}>
      {children}
    </CouponContext.Provider>
  );
}

export function useCoupons() {
  const ctx = useContext(CouponContext);
  if (!ctx) throw new Error("useCoupons must be used inside CouponProvider");
  return ctx;
}