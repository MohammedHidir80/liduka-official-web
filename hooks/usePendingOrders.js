"use client";
// hooks/usePendingOrders.js — how many orders are waiting for the vendor to accept (badge on the Orders link/tab).
// Cost: ONE count query (billed ~1 read per 1000 orders). Runs on load, when the tab regains focus, every 2 minutes
// while open, when `trigger` changes (pass the newest notification id) and after refreshPendingOrders(uid, true).
import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

let count = 0, last = 0, busy = false, owner = null;
const subs = new Set();

export async function refreshPendingOrders(uid, force = false) {
  if (!uid || busy) return;
  if (owner !== uid) { owner = uid; count = 0; last = 0; subs.forEach((f) => f(0)); }
  if (!force && Date.now() - last < 15000) return;
  busy = true;
  try {
    const s = await getCountFromServer(
      query(collection(db, "orders"), where("vendorId", "==", uid), where("status", "==", "pending"))
    );
    count = s.data().count;
    last = Date.now();
    subs.forEach((f) => f(count));
  } catch (e) {
    console.error("Pending orders count error:", e?.code, e?.message);
  } finally {
    busy = false;
  }
}

export default function usePendingOrders(uid, trigger) {
  const [n, setN] = useState(count);

  useEffect(() => {
    subs.add(setN);
    if (uid) refreshPendingOrders(uid);
    const onFocus = () => uid && refreshPendingOrders(uid);
    window.addEventListener("focus", onFocus);
    const timer = setInterval(onFocus, 120000);
    return () => {
      subs.delete(setN);
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, [uid]);

  useEffect(() => {
    if (uid && trigger) refreshPendingOrders(uid, true); // a new notification may be a new order
  }, [uid, trigger]);

  return uid && owner === uid ? n : 0;
}