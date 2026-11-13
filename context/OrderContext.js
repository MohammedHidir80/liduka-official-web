"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { orders as mockOrders } from "@/data/mock"; // Import mock orders

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ready, setReady] = useState(false);

  // Load orders from localStorage or fallback to mock data
  useEffect(() => {
    try {
      const raw = localStorage.getItem("Liduka.orders.v1");
      if (raw) {
        setOrders(JSON.parse(raw));
      } else {
        // If no local storage, start with the mock orders from data/mock.js
        setOrders(mockOrders);
      }
    } catch {
      setOrders(mockOrders);
    }
    setReady(true);
  }, []);

  // Save all orders globally
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("Liduka.orders.v1", JSON.stringify(orders));
  }, [orders, ready]);

  const addOrder = (order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const updateOrder = (id, updates) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const deleteOrder = (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // Derived state: Filter orders based on the logged-in user
  let buyerOrders = [];
  let vendorOrders = [];

  if (user) {
    if (user.role === "buyer") {
      buyerOrders = orders.filter((o) => o.buyerId === user.id);
    } else if (user.role === "vendor") {
      vendorOrders = orders.filter((o) => o.vendorId === user.vendorId);
    }
  }

  return (
    <OrderContext.Provider value={{ 
      orders, 
      buyerOrders, 
      vendorOrders, 
      addOrder, 
      updateOrder, 
      deleteOrder, 
      ready 
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used inside OrderProvider");
  return ctx;
}