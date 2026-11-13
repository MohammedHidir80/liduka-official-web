"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "@/lib/translations"; // Import the separated file

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem("Liduka.lang");
      // Ensure the stored language actually exists in our translations
      if (storedLang && translations[storedLang]) setLanguage(storedLang);
    } catch { }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("Liduka.lang", language);
  }, [language, ready]);

  const t = translations[language];

  return (
    <SettingsContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}