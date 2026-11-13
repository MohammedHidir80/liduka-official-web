"use client";
 
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { onAuthStateChanged, reload } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  signUp,
  signIn,
  logOut,
  resendVerification,
 
} from "@/lib/auth";

const AuthContext = createContext(null);

function hueFromString(s = "") {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

// Firestore profile -> the user object the web app already expects.
// Mobile field names (uid, fullName) AND old web names (id, name) both exist.
function toAppUser(fbUser, profile) {
  const created = profile.createdAt?.toDate?.();
  return {
    ...profile,
    uid: fbUser.uid,
    id: fbUser.uid,
    fullName: profile.fullName || "",
    name: profile.fullName || fbUser.email,
    email: profile.email || fbUser.email,
    role: profile.role,
    vendorId: profile.role === "vendor" ? fbUser.uid : undefined,
    emailVerified: fbUser.emailVerified,
    hue: hueFromString(fbUser.uid),
    joined: created
      ? created.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "",
  };
}

export function AuthProvider({ children }) {
  const [fbUser, setFbUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [profileUid, setProfileUid] = useState(null); // uid whose profile has finished loading

  // 1) Firebase auth session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      setVerified(!!u?.emailVerified);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // 2) Live users/{uid} profile (only for verified accounts, like mobile)
  useEffect(() => {
    if (!fbUser || !verified) {
      setUser(null);
      setProfileUid(null);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "users", fbUser.uid),
      (snap) => {
        setUser(snap.exists() ? toAppUser(fbUser, snap.data()) : null);
        setProfileUid(fbUser.uid);
      },
      (err) => {
        console.error("Profile snapshot error:", err.code, err.message);
        setUser(null);
        setProfileUid(fbUser.uid);
      }
    );
    return () => unsub();
  }, [fbUser, verified]);

  // Not ready until auth is checked AND (no verified user, or their profile has loaded)
  const ready =
    authChecked && (!fbUser || !verified || profileUid === fbUser.uid);

  // Call after the user clicks the email link and returns to the site
  const refreshUser = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return false;
    await reload(current);
    setVerified(current.emailVerified);
    return current.emailVerified;
  }, []);

  const signup = useCallback(
  ({ name, email, phone, password, role = "buyer", geoInfo, userLocation, beforeProfile }) =>
    signUp({ fullName: name, email, phone, password, role, geoInfo, userLocation, beforeProfile }),
  []
);

  const loginWithCredentials = useCallback(
    (email, password, role = "buyer") => signIn(email, password, role),
    []
  );

  const logout = useCallback(() => logOut(), []);

  // Writes to Firestore; the snapshot listener updates `user` automatically
  const updateUser = useCallback(async (patch) => {
    const current = auth.currentUser;
    if (!current) return;
    // never let the client change these
    const { id, uid, role, walletId, name, ...rest } = patch;
    const data = name !== undefined ? { ...rest, fullName: name } : rest;
    await updateDoc(doc(db, "users", current.uid), data);
  }, []);

  const value = {
    user,
    firebaseUser: fbUser,
    ready,
    awaitingVerification: !!fbUser && !verified,
    isVendor: user?.role === "vendor",
    isBuyer: user?.role === "buyer",
    signup,
    loginWithCredentials,
    resendVerification,
    refreshUser,
    forceLogin: refreshUser, // old name, kept so nothing crashes
    logout,
    updateUser,
    accounts: [], // demo accounts are gone; kept so old code doesn't crash
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}