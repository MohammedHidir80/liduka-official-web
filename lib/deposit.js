// lib/deposit.js
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

const startDepositFn = httpsCallable(functions, "startDeposit");
const verifyDepositFn = httpsCallable(functions, "verifyDeposit");

export async function startDeposit(amount, currency = "GHS") {
  const res = await startDepositFn({ amount, currency });
  return res.data; // { accessCode, reference, amount, fee, gross }
}

export async function verifyDeposit(reference) {
  const res = await verifyDepositFn({ reference });
  return res.data; // { status: "success" | "pending" | "abandoned" | "failed", ... }
}

// Opens the Paystack popup. Resolves when it closes, paid or not.
// The real outcome always comes from verifyDeposit, never from the popup.
export async function openPaystack(accessCode) {
  const { default: PaystackPop } = await import("@paystack/inline-js");
  return new Promise((resolve, reject) => {
    const popup = new PaystackPop();
    popup.resumeTransaction(accessCode, {
      onSuccess: () => resolve("closed"),
      onCancel: () => resolve("cancelled"),
      onError: (err) => reject(new Error(err?.message || "Payment failed.")),
    });
  });
}