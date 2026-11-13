"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy,
  query, serverTimestamp, setDoc, where,
} from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const newClientId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function useSupportChat() {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [chatId, setChatId] = useState(null);
  const [serverMessages, setServerMessages] = useState([]);
  const [pending, setPending] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const chatRef = useRef(null);
  const creating = useRef(null);
  const pendingRef = useRef([]);
  chatRef.current = chatId;
  pendingRef.current = pending;

  // Find this buyer's open chat (same query as mobile)
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setReady(false);
    getDocs(
      query(collection(db, "chats"), where("userId", "==", uid), where("status", "==", "open"), limit(1))
    )
      .then((snap) => {
        if (cancelled) return;
        setChatId(snap.empty ? null : snap.docs[0].id);
        setReady(true);
      })
      .catch((err) => {
        console.error("Chat lookup failed:", err);
        if (!cancelled) {
          setError(err);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Live messages
  useEffect(() => {
    if (!chatId) {
      setServerMessages([]);
      return;
    }
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) =>
        setServerMessages(
          snap.docs.map((d) => {
            const x = d.data({ serverTimestamps: "estimate" });
            return { ...x, id: d.id, time: x.timestamp?.toDate?.() || null, status: "sent" };
          })
        ),
      (err) => {
        console.error("Messages snapshot error:", err.code, err.message);
        setError(err);
      }
    );
    return () => unsub();
  }, [chatId]);

  const ensureChat = useCallback(async () => {
    if (chatRef.current) return chatRef.current;
    if (!creating.current) {
      const newChat = doc(collection(db, "chats"));
      creating.current = setDoc(newChat, {
        userId: uid,
        createdAt: serverTimestamp(),
        status: "open",
        lastActivity: serverTimestamp(),
      })
        .then(() => {
          chatRef.current = newChat.id;
          setChatId(newChat.id);
          return newChat.id;
        })
        .finally(() => {
          creating.current = null;
        });
    }
    return creating.current;
  }, [uid]);

  const deliver = useCallback(
    async (item) => {
      try {
        const cid = await ensureChat();
        let body;
        if (item.file) {
          const fileRef = storageRef(storage, `chats/${uid}/${Date.now()}.${EXT[item.file.type] || "jpg"}`);
          await uploadBytes(fileRef, item.file, { contentType: item.file.type });
          body = { imageUrl: await getDownloadURL(fileRef) };
        } else {
          body = { text: item.text };
        }

        await addDoc(collection(db, "chats", cid, "messages"), {
          clientId: item.clientId,
          ...body,
          sender: "user",
          senderId: uid,
          timestamp: serverTimestamp(),
        });
        await setDoc(doc(db, "chats", cid), { lastActivity: serverTimestamp() }, { merge: true });

        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        setPending((p) => p.filter((m) => m.clientId !== item.clientId));
      } catch (err) {
        console.error("Sending message failed:", err);
        setPending((p) => p.map((m) => (m.clientId === item.clientId ? { ...m, status: "failed" } : m)));
      }
    },
    [uid, ensureChat]
  );

  const sendText = useCallback(
    (text) => {
      const clean = text.trim();
      if (!clean || !uid) return;
      const item = { clientId: newClientId(), text: clean, senderId: uid, time: new Date(), status: "pending" };
      setPending((p) => [...p, item]);
      deliver(item);
    },
    [uid, deliver]
  );

  const sendImage = useCallback(
    (file) => {
      if (!file || !uid) return;
      const previewUrl = URL.createObjectURL(file);
      const item = {
        clientId: newClientId(),
        file,
        previewUrl,
        imageUrl: previewUrl,
        senderId: uid,
        time: new Date(),
        status: "pending",
      };
      setPending((p) => [...p, item]);
      deliver(item);
    },
    [uid, deliver]
  );

  const retry = useCallback(
    (clientId) => {
      const item = pendingRef.current.find((m) => m.clientId === clientId);
      if (!item) return;
      setPending((p) => p.map((m) => (m.clientId === clientId ? { ...m, status: "pending" } : m)));
      deliver(item);
    },
    [deliver]
  );

  // Closes the chat. The next message starts a new one, same as mobile.
  const endChat = useCallback(async () => {
    const cid = chatRef.current;
    if (cid) {
      await setDoc(doc(db, "chats", cid), { status: "closed", endedAt: serverTimestamp() }, { merge: true });
    }
    chatRef.current = null;
    setChatId(null);
    setServerMessages([]);
    setPending([]);
  }, []);

  const messages = useMemo(() => {
    const seen = new Set(serverMessages.map((m) => m.clientId).filter(Boolean));
    return [...serverMessages, ...pending.filter((m) => !seen.has(m.clientId))];
  }, [serverMessages, pending]);

  return { messages, ready, error, sendText, sendImage, retry, endChat, uid };
}