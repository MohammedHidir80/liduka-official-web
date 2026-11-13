"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

const PROVIDERS = {
  bank: [
    { name: "GCB Bank", code: "GCB" },
    { name: "Access Bank", code: "ACCESS" },
    { name: "Stanbic Bank", code: "STANBIC" },
    { name: "Cal Bank", code: "CAL" },
  ],
  mobile_money: [
    { name: "MTN Mobile Money", code: "MTN" },
    { name: "Vodafone Cash", code: "VODAFONE" },
    { name: "AirtelTigo Money", code: "AIRTELTIGO" },
  ],
};

export default function PayoutSetupPage() {
  const [type, setType] = useState("mobile_money");
  const [provider, setProvider] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, "payoutDetails", uid)).then((s) => {
      if (s.exists()) {
        const d = s.data();
        setAccountName(d.accountName || "");
        setAccountNumber(d.accountNumber || "");
        setType(d.providerType || "mobile_money");
        setProvider({ name: d.providerName, code: d.providerCode });
      }
      setLoading(false);
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!accountName.trim() || !accountNumber.trim() || !provider || !password)
      return setMsg({ text: "Please complete all fields, including your password." });
    const digits = accountNumber.replace(/\s/g, "");
    if (!/^\d+$/.test(digits) || (type === "mobile_money" ? digits.length !== 10 : digits.length < 8 || digits.length > 16))
      return setMsg({ text: type === "mobile_money" ? "Mobile money numbers have 10 digits." : "Enter a valid bank account number." });

    const user = auth.currentUser;
    setSaving(true);
    try {
      try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      } catch {
        return setMsg({ text: "Incorrect password." });
      }
      await setDoc(doc(db, "payoutDetails", user.uid), {
        accountName: accountName.trim(),
        accountNumber: digits,
        providerName: provider.name,
        providerCode: provider.code,
        providerType: type,
        updatedAt: serverTimestamp(),
      });
      setPassword("");
      setMsg({ ok: true, text: "Payout details saved." });
    } catch (err) {
      console.error(err);
      setMsg({ text: "Failed to save payout details." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container-page py-6 text-ink-500">Loading…</div>;

  return (
    <form onSubmit={save} className="container-page max-w-xl space-y-4 py-6">
      <Link href="/vendor/profile" className="text-sm text-brand-600">← Back to profile</Link>
      <h1 className="text-2xl font-bold text-ink-900">Payout setup</h1>
      <p className="text-sm text-ink-500">Withdrawals are sent to these details, so double-check them.</p>

      <div className="card space-y-3 p-4">
        <input className="input" placeholder="Account holder name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        <input className="input" inputMode="numeric" placeholder={type === "mobile_money" ? "Mobile money number" : "Account number"}
          value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />

        <div className="grid grid-cols-2 gap-2">
          {[["mobile_money", "📱 Mobile money"], ["bank", "🏦 Bank"]].map(([k, label]) => (
            <button type="button" key={k} onClick={() => { setType(k); setProvider(null); }}
              className={type === k ? "btn-primary" : "btn-outline"}>{label}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS[type].map((p) => (
            <button type="button" key={p.code} onClick={() => setProvider(p)}
              className={provider?.code === p.code ? "btn-primary" : "btn-outline"}>{p.name}</button>
          ))}
        </div>

        <input className="input" type="password" placeholder="Confirm with your password" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

        {msg && <p className={`rounded-lg p-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}
        <button className="btn-primary w-full" disabled={saving}>{saving ? "Saving…" : "Save payout details"}</button>
      </div>
    </form>
  );
}