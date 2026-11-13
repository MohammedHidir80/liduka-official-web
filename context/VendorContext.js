"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { products as initialProducts, orders as initialOrders } from "@/data/mock";

const VendorContext = createContext(null);

export function VendorProvider({ children }) {
  const { user } = useAuth();
  const [vendorProducts, setVendorProducts] = useState([]);
  const [payoutDetails, setPayoutDetails] = useState(null); // New state
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "vendor") {
      setVendorProducts([]);
      setPayoutDetails(null);
      setReady(true);
      return;
    }

    try {
      // Load Products
      const raw = localStorage.getItem(`marketa.vendorProducts.${user.vendorId}`);
      const customProducts = raw ? JSON.parse(raw) : [];
      const myMockProducts = initialProducts.filter(p => p.vendorId === user.vendorId);
      const enhancedMock = myMockProducts.map(p => ({
        ...p,
        salesCount: Math.floor(Math.random() * 100) + 10,
        averageRating: p.rating || 0,
        ratingsCount: p.reviews || 0,
      }));
      setVendorProducts([...customProducts, ...enhancedMock]);

      // Load Payout Details
      const payoutRaw = localStorage.getItem(`marketa.payout.${user.id}`);
      if (payoutRaw) setPayoutDetails(JSON.parse(payoutRaw));

    } catch {
      setVendorProducts([]);
    }
    setReady(true);
  }, [user]);

  const addProduct = (productData) => {
    // ... existing addProduct logic
    const newProduct = {
      id: `p_${Date.now()}`,
      vendorId: user.vendorId,
      ...productData,
      rating: 0,
      reviews: 0,
      salesCount: 0,
      averageRating: 0,
      ratingsCount: 0,
      images: productData.images.length > 0 ? productData.images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"],
    };
    const updated = [newProduct, ...vendorProducts];
    setVendorProducts(updated);
    localStorage.setItem(`marketa.vendorProducts.${user.vendorId}`, JSON.stringify(updated));
    return newProduct;
  };

  const updateProduct = (id, updates) => {
  const updated = vendorProducts.map(p => p.id === id ? { ...p, ...updates } : p);
  setVendorProducts(updated);
  localStorage.setItem(`marketa.vendorProducts.${user.vendorId}`, JSON.stringify(updated));
};

  const deleteProduct = (id) => {
    // ... existing deleteProduct logic
    const updated = vendorProducts.filter(p => p.id !== id);
    setVendorProducts(updated);
    localStorage.setItem(`marketa.vendorProducts.${user.vendorId}`, JSON.stringify(updated));
  };

  const savePayoutDetails = (details) => {
    setPayoutDetails(details);
    localStorage.setItem(`marketa.payout.${user.id}`, JSON.stringify(details));
  };

  const vendorOrders = initialOrders.filter(o => o.vendorId === user?.vendorId);
  const totalSales = vendorOrders.filter(o => o.status === "delivered" || o.status === "shipped").reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = vendorOrders.filter(o => o.status === "pending" || o.status === "accepted").length;
  const overallRating = vendorProducts.length > 0 ? vendorProducts.reduce((sum, p) => sum + (p.averageRating || 0), 0) / vendorProducts.length : 0;

  const stats = {
    totalProducts: vendorProducts.length,
    totalOrders: vendorOrders.length,
    totalSales,
    pendingOrders,
    overallRating,
  };

  return (
    <VendorContext.Provider value={{ 
      vendorProducts, 
      vendorOrders, 
      stats, 
      addProduct, 
      deleteProduct, 
      updateProduct, 
      payoutDetails, 
      savePayoutDetails, 
      ready 
    }}>
      {children}
    </VendorContext.Provider>
  );
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error("useVendor must be used inside VendorProvider");
  return ctx;
}