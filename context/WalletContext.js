"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  doc, onSnapshot, collection, query, where, orderBy, limit,
  getDoc, getDocs, addDoc, serverTimestamp, runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { getPlatformFee } from "@/utils/fees";

const WalletContext = createContext(null);
const PLATFORM_WALLET_ID = "platform_wallet";

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [hasPayoutDetails, setHasPayoutDetails] = useState(false);
  const [ready, setReady] = useState(false);

  // Wallet
  useEffect(() => {
    if (!uid) { setBalance(0); setReady(true); return; }
    setReady(false);
    const unsub = onSnapshot(
      doc(db, "wallets", uid),
      (snap) => {
        setBalance(snap.exists() ? Number(snap.data().balance) || 0 : 0);
        setReady(true);
      },
      (err) => {
        console.error("Wallet snapshot error:", err.code, err.message);
        setReady(true);
      }
    );
    return () => unsub();
  }, [uid]);

  // Transactions
  useEffect(() => {
    if (!uid) { setTransactions([]); return; }
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTransactions(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              amount: Number(data.amount) || 0,
              fee: Number(data.fee) || 0,
              net: Number(data.net) || 0,
              date: data.createdAt?.toDate?.()?.toLocaleString() || "",
              createdAt: data.createdAt,
            };
          })
        );
      },
      (err) => console.error("Transactions snapshot error:", err.code, err.message)
    );
    return () => unsub();
  }, [uid]);

  // Payout details existence (used to short-circuit withdraw validation)
  useEffect(() => {
    if (!uid) { setHasPayoutDetails(false); return; }
    const unsub = onSnapshot(doc(db, "payoutDetails", uid), (snap) => {
      const d = snap.data();
      setHasPayoutDetails(!!(snap.exists() && d?.accountNumber));
    });
    return () => unsub();
  }, [uid]);

  const addFunds = () => {
    alert("Wallet top-ups are being connected. Check back soon.");
    return false;
  };

  // Signature must stay sync (the wallet page does:
  //   const success = deductFunds(amt, "...");
  //   if (success) alert("Withdrawal successful!") )
  // So we do a sync validation on cached state, then kick off the write.
  const deductFunds = (amount, description = "Vendor Withdrawal") => {
    const amt = Number(amount);
    if (!uid || !Number.isFinite(amt) || amt <= 0) return false;
    if (amt > balance) { alert("Insufficient balance"); return false; }
    if (!hasPayoutDetails) {
      alert("Please set up your payout details before requesting a withdrawal.");
      return false;
    }

    // Fire async write; UI shows "success" optimistically. If the write fails,
    // the user is alerted via the catch below.
    (async () => {
      try {
        // One withdrawal per month (same rule as mobile)
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - 1);
        const monthlyQ = query(
          collection(db, "transactions"),
          where("userId", "==", uid),
          where("type", "==", "withdrawal"),
          orderBy("createdAt", "desc")
        );
        const monthlySnap = await getDocs(monthlyQ);
        const recent = monthlySnap.docs
          .map((d) => d.data())
          .find((t) => t.createdAt?.toDate?.() > monthStart);
        if (recent) {
          alert("You can only request one withdrawal per month.");
          return;
        }

        const currency = user?.currency || "GHS";
        const fee = getPlatformFee(currency, amt);
        const net = amt - fee;
        if (net <= 0) {
          alert("Amount too low after fee deduction.");
          return;
        }

        const walletRef = doc(db, "wallets", uid);
        const platformRef = doc(db, "wallets", PLATFORM_WALLET_ID);

        await runTransaction(db, async (tx) => {
          const walletSnap = await tx.get(walletRef);
          const platformSnap = await tx.get(platformRef);
          const current = Number(walletSnap.data()?.balance || 0);
          if (current < amt) throw new Error("Insufficient balance");
          const platformBal = Number(platformSnap.data()?.balance || 0);

          tx.update(walletRef, { balance: current - amt });
          if (platformSnap.exists()) {
            tx.update(platformRef, { balance: platformBal + fee });
          } else {
            tx.set(platformRef, {
              balance: fee, type: "platform", createdAt: serverTimestamp(),
            });
          }
        });

        await addDoc(collection(db, "transactions"), {
          userId: uid,
          amount: parseFloat(amt.toFixed(2)),
          currency,
          country: user?.country || null,
          type: "withdrawal",
          status: "pending",
          description,
          fee,
          net,
          createdAt: serverTimestamp(),
        });

        await addDoc(
          collection(db, "notifications", uid, "userNotifications"),
          {
            type: "withdrawal",
            message: `You requested a withdrawal of ${amt}. Net: ${net}.`,
            read: false,
            createdAt: serverTimestamp(),
          }
        );
      } catch (err) {
        console.error("Withdrawal failed:", err);
        alert(err.message || "Withdrawal failed.");
      }
    })();

    return true;
  };

  return (
    <WalletContext.Provider
      value={{ balance, transactions, ready, addFunds, deductFunds }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}