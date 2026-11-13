"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const AddressContext = createContext(null);

export function AddressProvider({ children }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState({ home: null, work: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setAddresses({ home: null, work: null });
      setReady(true);
      return;
    }
    try {
      const raw = localStorage.getItem(`Liduka.addresses.${user.id}`);
      if (raw) setAddresses(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (!ready || !user) return;
    localStorage.setItem(`Liduka.addresses.${user.id}`, JSON.stringify(addresses));
  }, [addresses, user, ready]);

  const saveAddress = (type, data) => {
    setAddresses((prev) => ({ ...prev, [type]: data }));
  };

  return (
    <AddressContext.Provider value={{ addresses, saveAddress }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddress must be used inside AddressProvider");
  return ctx;
}