// lib/profile.js
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EMPTY_ADDRESS } from "@/utils/addresses";

// Updates one address only (dotted field path), so the other one can't be overwritten
export function saveAddress(uid, slotKey, address) {
  return updateDoc(doc(db, "users", uid), { [`addresses.${slotKey}`]: address });
}

export const clearAddress = (uid, slotKey) => saveAddress(uid, slotKey, EMPTY_ADDRESS);