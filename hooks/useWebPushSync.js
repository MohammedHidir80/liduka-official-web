"use client";
// hooks/useWebPushSync.js — if this browser already allowed notifications, quietly keep its token saved
// (never opens the permission popup). Call once in a component that is always on screen, like TopBar.
import { useEffect } from "react";
import { enableWebPush } from "@/lib/webPush";

export default function useWebPushSync(uid) {
  useEffect(() => {
    if (!uid || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    enableWebPush(uid, { prompt: false });
  }, [uid]);
}