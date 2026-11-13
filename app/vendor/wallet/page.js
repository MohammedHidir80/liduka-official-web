"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";
import { getPlatformFee } from "@/utils/fees";
import { formatPrice } from "@/utils/currency";
import { 
  WalletIcon, ArrowDownLeftIcon, XIcon, AlertTriangleIcon, 
  ChevronRightIcon, InfoIcon, CheckCircleIcon 
} from "@/components/icons";

const STATUS_STYLE = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
};
const MIN = 100;
const MAX = 15000;
const requestWithdrawal = httpsCallable(functions, "requestWithdrawal");

export default function VendorWalletPage() {
  const [uid, setUid] = useState(null);
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState([]);
  const [payout, setPayout] = useState(undefined);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid || null)), []);

  useEffect(() => {
    if (!uid) return;
    const u1 = onSnapshot(doc(db, "wallets", uid), (s) => setBalance(Number(s.data()?.balance) || 0));
    const u2 = onSnapshot(
      query(collection(db, "transactions"), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(50)),
      (snap) => setTxs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.error("wallet txs", e)
    );
    getDoc(doc(db, "payoutDetails", uid)).then((s) => setPayout(s.exists() ? s.data() : null));
    return () => { u1(); u2(); };
  }, [uid]);

  const amt = parseFloat(amount);
  const preview = useMemo(() => {
    if (!amt || amt <= 0) return null;
    const fee = parseFloat(Number(getPlatformFee("GHS", amt)).toFixed(2));
    return { fee, net: parseFloat((amt - fee).toFixed(2)) };
  }, [amt]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!amt || amt < MIN) return setError(`Minimum withdrawal is ${formatPrice(MIN, "GHS")}.`);
    if (amt > MAX) return setError(`Maximum withdrawal is ${formatPrice(MAX, "GHS")} per request.`);
    if (amt > balance) return setError("You do not have enough funds.");
    if (!preview || preview.net <= 0) return setError("Amount too low after fee deduction.");
    
    if (!window.confirm(`Amount: ${formatPrice(amt, "GHS")}\nFee: ${formatPrice(preview.fee, "GHS")}\nYou will receive: ${formatPrice(preview.net, "GHS")}\n\nProceed?`)) return;

    setBusy(true);
    try {
      const res = await requestWithdrawal({ amount: amt });
      setNotice(`Withdrawal requested. Fee ${formatPrice(res.data.fee, "GHS")}, you receive ${formatPrice(res.data.net, "GHS")}.`);
      setOpen(false);
      setAmount("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process withdrawal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-2xl space-y-6 py-6 pb-24">
      <h1 className="text-2xl font-extrabold text-ink-900">Wallet</h1>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-xl shadow-brand-600/20">
        <div className="relative z-10">
          <p className="text-sm font-semibold text-brand-100 mb-1">Available Balance</p>
          <p className="text-4xl font-extrabold tracking-tight">{formatPrice(balance, "GHS")}</p>
          <button 
            className="mt-6 flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/30 backdrop-blur-sm" 
            onClick={() => { setOpen(true); setNotice(""); setError(""); }}
          >
            <ArrowDownLeftIcon size={16} className="rotate-180" /> Withdraw Funds
          </button>
        </div>
        <div className="absolute -right-10 -top-10 text-brand-500/20">
          <WalletIcon size={180} strokeWidth={1} />
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircleIcon size={18} /> {notice}
        </div>
      )}

      {/* Payout Status Banner */}
      {payout === null && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon size={20} className="text-amber-600 shrink-0" />
            <span className="text-sm font-semibold text-amber-800">Set up your payout details before you withdraw.</span>
          </div>
          <Link href="/vendor/payout" className="btn-outline w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-100 whitespace-nowrap">
            Set up
          </Link>
        </div>
      )}

      {payout && (
        <Link href="/vendor/payout" className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-4 transition hover:bg-ink-50">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-ink-100 text-ink-600">
              <WalletIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-500">Payout Account</p>
              <p className="text-sm font-bold text-ink-900">
                {payout.providerName} · {payout.accountName} · ••••{String(payout.accountNumber).slice(-4)}
              </p>
            </div>
          </div>
          <ChevronRightIcon size={18} className="text-ink-400" />
        </Link>
      )}

      {/* Transactions */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink-900">Recent Transactions</h2>
        {txs.length === 0 ? (
          <div className="card flex flex-col items-center justify-center p-12 text-center">
            <InfoIcon size={32} className="mb-3 text-ink-300" />
            <p className="text-sm font-semibold text-ink-600">No transactions yet</p>
          </div>
        ) : (
          <div className="card divide-y divide-ink-50 overflow-hidden">
            {txs.map((t) => {
              const credit = t.type === "credit";
              return (
                <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-ink-50/50 transition">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${credit ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
                    {credit ? <ArrowDownLeftIcon size={18} /> : <WalletIcon size={18} />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{t.description || (credit ? "Deposit" : "Withdrawal")}</p>
                    <p className="text-[11px] text-ink-500 mt-0.5">{t.createdAt?.toDate?.().toLocaleString()}</p>
                    {t.type === "withdrawal" && t.fee != null && (
                      <p className="text-[11px] text-ink-400">Fee {formatPrice(t.fee, "GHS")} · Net {formatPrice(t.net, "GHS")}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-extrabold ${credit ? "text-emerald-600" : "text-ink-900"}`}>
                      {credit ? "+" : "−"}{formatPrice(t.amount, "GHS")}
                    </p>
                    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLE[t.status] || "bg-ink-100 border-ink-200 text-ink-600"}`}>
                      {t.status || t.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Withdrawal Bottom Sheet Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !busy && setOpen(false)}>
          <form 
            onSubmit={submit} 
            onClick={(e) => e.stopPropagation()} 
            className="flex w-full max-w-md flex-col rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl animate-in slide-in-from-bottom-4 sm:zoom-in-95"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-ink-900">Withdraw Funds</h3>
              <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-500 hover:bg-ink-100">
                <XIcon size={16} />
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-xs font-bold text-ink-500">Amount to Withdraw</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-ink-400">₵</span>
                <input 
                  className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-9 pr-4 text-xl font-extrabold text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" 
                  type="number" min={MIN} max={MAX} step="0.01" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)} 
                  autoFocus 
                />
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="mb-5 flex flex-wrap gap-2">
              {[100, 500, 1000, 5000].filter((q) => q <= balance).map((q) => (
                <button type="button" key={q} className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:bg-ink-100" onClick={() => setAmount(String(q))}>
                  {q.toLocaleString()}
                </button>
              ))}
              {balance >= MIN && (
                <button type="button" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                  onClick={() => setAmount(String(Math.floor(Math.min(balance, MAX) * 100) / 100))}>
                  Max
                </button>
              )}
            </div>

            {preview && (
              <div className="mb-5 rounded-xl bg-ink-50 p-4 text-sm">
                <div className="mb-1 flex justify-between text-ink-600"><span>Withdrawal Amount</span><span>{formatPrice(amt, "GHS")}</span></div>
                <div className="mb-2 flex justify-between text-rose-600"><span>Processing Fee</span><span>− {formatPrice(preview.fee, "GHS")}</span></div>
                <div className="my-2 h-px w-full bg-ink-200" />
                <div className="flex justify-between font-extrabold text-emerald-600"><span>You Receive</span><span>{formatPrice(preview.net, "GHS")}</span></div>
              </div>
            )}

            {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-600">{error}</p>}
            
            <p className="mb-5 text-[11px] leading-relaxed text-ink-400">
              Min {formatPrice(MIN, "GHS")} · Max {formatPrice(MAX, "GHS")} per request. One withdrawal per month, paid to your saved payout account.
            </p>

            <div className="flex gap-3">
              <button type="button" className="btn-outline flex-1 py-3" disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary flex-1 py-3" disabled={busy}>
                {busy ? "Processing…" : "Withdraw"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}