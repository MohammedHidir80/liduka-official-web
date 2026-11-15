// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A missing variable on Vercel is the #1 cause of an endless splash. Say so in the console.
if (typeof window !== "undefined" && (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId)) {
  console.error(
    "Firebase settings are missing. Add the NEXT_PUBLIC_FIREBASE_* variables in Vercel (Settings > Environment Variables) and redeploy."
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth: the web SDK persists the session in the browser by default
const auth = getAuth(app);

// In-app browsers (Facebook, Instagram, TikTok, WhatsApp...) often break IndexedDB / multi-tab locking,
// which can leave Firestore waiting forever. They get a simple in-memory cache instead.
const inAppBrowser =
  typeof navigator !== "undefined" &&
  /FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|BytedanceWebview|Line\/|MicroMessenger|Snapchat|Twitter/i.test(
    navigator.userAgent || ""
  );
const canPersist = typeof indexedDB !== "undefined" && !inAppBrowser;

// Firestore: offline cache only in the browser (same idea as mobile)
let db;
if (typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: canPersist
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache(),
      // If the normal connection is blocked (some networks / proxies / browsers), fall back to long polling
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    // Already initialized (hot reload in dev)
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

const storage = getStorage(app);
const functions = getFunctions(app, "us-central1");

export { app, auth, db, storage, functions };