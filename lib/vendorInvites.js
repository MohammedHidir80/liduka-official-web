// lib/vendorInvites.js
import {
  collection, getDocs, limit, query, runTransaction, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function appError(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

// Returns the invite's document reference, or throws a friendly error
export async function findInvite(rawCode) {
  const code = String(rawCode || "").trim();
  const snap = await getDocs(
    query(collection(db, "invites"), where("code", "==", code), limit(1))
  );
  if (snap.empty) throw appError("app/invite-invalid", "This invite code does not exist.");

  const invite = snap.docs[0];
  if (invite.data().used) {
    throw appError("app/invite-used", "This invite code has already been used.");
  }
  return invite.ref;
}

// Atomically marks the invite as used by this account
export async function claimInvite(inviteRef, uid) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(inviteRef);
    if (!snap.exists() || snap.data().used) {
      throw appError("app/invite-used", "This invite code has already been used.");
    }
    tx.update(inviteRef, { used: true, usedBy: uid, usedAt: serverTimestamp() });
  });
}