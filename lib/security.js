// lib/security.js
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Mobile leaves "accepted" out of this list, so accepted orders didn't block deletion
const ACTIVE_STATUSES = ["pending", "accepted", "processing", "shipped"];

export const hasPasswordLogin = () =>
  !!auth.currentUser?.providerData?.some((p) => p.providerId === "password");

async function reauthenticate(password) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("You must be logged in.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  return user;
}

export async function changePassword(currentPassword, newPassword) {
  const user = await reauthenticate(currentPassword);
  await updatePassword(user, newPassword);
}

// Firebase emails a link to the NEW address. The change applies once it's opened.
export async function changeEmail(currentPassword, newEmail) {
  const user = await reauthenticate(currentPassword);
  await verifyBeforeUpdateEmail(user, newEmail.trim());
}

function appError(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

export async function requestAccountDeletion(password) {
  const user = await reauthenticate(password);

  const wallet = await getDoc(doc(db, "wallets", user.uid));
  if (wallet.exists() && Math.round((Number(wallet.data().balance) || 0) * 100) > 0) {
    throw appError("app/has-balance", "Please withdraw your wallet balance before requesting account deletion.");
  }

  const active = await getDocs(
    query(
      collection(db, "orders"),
      where("buyerId", "==", user.uid),
      where("status", "in", ACTIVE_STATUSES)
    )
  );
  if (!active.empty) {
    throw appError("app/active-orders", "You still have pending orders. Please complete them first.");
  }

  const existing = await getDocs(
    query(
      collection(db, "deleteRequests"),
      where("userId", "==", user.uid),
      where("status", "==", "pending")
    )
  );
  if (!existing.empty) {
    throw appError("app/already-requested", "You already have a deletion request waiting for review.");
  }

  await addDoc(collection(db, "deleteRequests"), {
    userId: user.uid,
    email: user.email,
    role: "buyer",
    status: "pending",
    requestedAt: serverTimestamp(),
  });
}

export function securityError(err) {
  if (err?.code?.startsWith?.("app/")) return err.message;
  switch (err?.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Your current password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/requires-recent-login":
      return "For security, please log out, log in again and retry.";
    case "auth/email-already-in-use":
      return "That email is already used by another account.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 6 characters).";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}