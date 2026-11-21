"use client";
// hooks/useMaintenance.js — settings/maintenance { web, mobile, message, allowUids: [] } (written by the admin dashboard; "enabled" still works as an old master switch).
// One small document, watched live, so switching it on or off reaches everyone within seconds.
// allowUids lets you (the owner) keep using the app while it is on. If the document can't be read,
// the app stays open (it never locks people out by mistake).
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function useMaintenance(uid) {
  const [m, setM] = useState({ on: false, message: "", allow: [] });
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "maintenance"),
      (snap) => {
        const d = snap.exists() ? snap.data() : {};
        setM({ on: !!(d.web ?? d.enabled), message: d.message || "", allow: Array.isArray(d.allowUids) ? d.allowUids : [] });
      },
      () => setM({ on: false, message: "", allow: [] })
    );
    return () => unsub();
  }, []);
  const active = m.on && !(uid && m.allow.includes(uid));
  return { active, message: m.message };
}