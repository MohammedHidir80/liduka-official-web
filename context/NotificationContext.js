"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const MAX_LOADED = 50; // same limit as mobile

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [notifications, setNotifications] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  // Live: notifications/{uid}/userNotifications, newest first
  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setError(null);
      setReady(true);
      return;
    }

    setReady(false);
    const q = query(
      collection(db, "notifications", uid, "userNotifications"),
      orderBy("createdAt", "desc"),
      limit(MAX_LOADED)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotifications(
          snap.docs.map((d) => {
            // "estimate" gives a just-written notification a time before the server confirms it
            const data = d.data({ serverTimestamps: "estimate" });
            const created = data.createdAt?.toDate?.();
            return {
              ...data,
              id: d.id,
              read: data.read === true,
              createdAt: created ? created.toISOString() : null,
            };
          })
        );
        setError(null);
        setReady(true);
      },
      (err) => {
        console.error("Notifications snapshot error:", err.code, err.message);
        setError(err);
        setReady(true);
      }
    );
    return () => unsub();
  }, [uid]);

  const markAsRead = useCallback(
    async (id) => {
      if (!uid || !id) return;
      try {
        await updateDoc(doc(db, "notifications", uid, "userNotifications", id), { read: true });
      } catch (err) {
        console.error("Error marking notification read:", err);
      }
    },
    [uid]
  );

  const markAllAsRead = useCallback(async () => {
    if (!uid) return;
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((n) =>
        batch.update(doc(db, "notifications", uid, "userNotifications", n.id), { read: true })
      );
      await batch.commit();
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  }, [uid, notifications]);

  // Adds a notification for the signed-in user
  const addNotification = useCallback(
    async (type, message) => {
      if (!uid) return;
      try {
        await addDoc(collection(db, "notifications", uid, "userNotifications"), {
          type,
          message,
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error adding notification:", err);
      }
    },
    [uid]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      ready,
      error,
      addNotification,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, ready, error, addNotification, markAsRead, markAllAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}