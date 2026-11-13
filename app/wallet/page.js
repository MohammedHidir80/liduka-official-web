"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import useTransactions from "@/hooks/useTransactions";
import { startDeposit, verifyDeposit, openPaystack } from "@/lib/deposit";
import { calculateDepositFee } from "@/utils/calculateDepositFee";
import { formatPrice } from "@/utils/currency";
import { WalletIcon, PlusIcon, ArrowDownLeftIcon, CreditCardIcon, XIcon } from "@/components/icons";

const CURRENCY = "GHS"; // wallet currency, same as checkout
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const MIN_DEPOSIT = 1;
const MAX_DEPOSIT = 1000000;

const money = (n) => formatPrice(n, CURRENCY);

// Refunds put money back, so they count as credits (mobile shows them as debits)
const isCredit = (tx) => tx.type === "credit" || tx.type === "refund";

const STATUS_STYLE = {
  success: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  held: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
};

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-50 py-2.5 text-sm last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-ink-900">{children}</span>
    </div>
  );
}

export default function WalletPage() {
  const { user } = useAuth();
  const { balance, ready } = useWallet();
  const { transactions, loading: txLoading, error: txError } = useTransactions();

  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | starting | paying | verifying
  const [notice, setNotice] = useState(null); // { type, text }
  const [selectedTx, setSelectedTx] = useState(null);

  const value = parseFloat(amount);
  const validAmount = Number.isFinite(value) && value >= MIN_DEPOSIT && value <= MAX_DEPOSIT;
  const fees = validAmount ? calculateDepositFee(value, CURRENCY) : null;
  const busy = phase !== "idle";

  const handleDeposit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!Number.isFinite(value) || value <= 0) {
      return setNotice({ type: "error", text: "Please enter a valid amount greater than 0." });
    }
    if (value < MIN_DEPOSIT) {
      return setNotice({ type: "error", text: `The minimum deposit is ${money(MIN_DEPOSIT)}.` });
    }
    if (value > MAX_DEPOSIT) {
      return setNotice({ type: "error", text: "Maximum deposit amount is 1,000,000." });
    }

    try {
      setPhase("starting");
      const { accessCode, reference } = await startDeposit(value, CURRENCY);

      setPhase("paying");
      await openPaystack(accessCode);

      setPhase("verifying");
      const result = await verifyDeposit(reference);

      if (result.status === "success") {
        setAmount("");
        setNotice({ type: "success", text: `Deposit completed! ${money(result.amount)} was added to your wallet.` });
      } else {
        setNotice({
          type: "info",
          text: "The payment wasn't completed. If you were charged, your balance will update automatically within a minute.",
        });
      }
    } catch (err) {
      console.error("Deposit error:", err);
      setNotice({ type: "error", text: err.message || "Failed to process deposit." });
    } finally {
      setPhase("idle");
    }
  };

  const buttonLabel = {
    idle: validAmount ? `Deposit ${money(fees.grossAmount)}` : "Deposit Now",
    starting: "Preparing payment...",
    paying: "Waiting for payment...",
    verifying: "Confirming payment...",
  }[phase];

  return (
    <div className="container-page max-w-2xl py-6">
      <h1 className="mb-6 text-xl font-extrabold tracking-tight">Wallet</h1>

      {/* Balance */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-brand-600 p-6 text-white shadow-card">
        <div className="relative z-10">
          <p className="mb-1 text-sm font-semibold text-brand-100">Available Balance</p>
          {ready ? (
            <p className="text-4xl font-extrabold tracking-tight">{money(balance)}</p>
          ) : (
            <div className="h-10 w-40 animate-pulse rounded bg-white/20" />
          )}
          <p className="mt-4 text-xs font-medium text-brand-200">Account: {user?.email}</p>
        </div>
        <div className="absolute -right-10 -top-10 text-brand-500/30">
          <WalletIcon size={160} strokeWidth={1} />
        </div>
      </div>

      {/* Deposit */}
      <div className="card mb-8 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-900">
          <CreditCardIcon size={18} className="text-brand-600" />
          Deposit Funds
        </h2>

        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              disabled={busy}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                Number(amount) === q
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
              }`}
            >
              {money(q)}
            </button>
          ))}
        </div>

        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-600">Enter Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-500">
                {CURRENCY}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={MIN_DEPOSIT}
                max={MAX_DEPOSIT}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={busy}
                className="input pl-14 text-lg font-bold"
              />
            </div>
          </div>

          {fees && (
            <div className="space-y-1.5 rounded-xl bg-ink-50 p-4 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Amount</span>
                <span className="font-semibold text-ink-900">{money(value)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Processing Fee</span>
                <span className="font-semibold text-ink-900">{money(fees.paystackFee)}</span>
              </div>
              <div className="flex justify-between border-t border-ink-200 pt-2 font-extrabold text-ink-900">
                <span>Total to Pay</span>
                <span>{money(fees.grossAmount)}</span>
              </div>
            </div>
          )}

          {notice && (
            <p
              role="alert"
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                notice.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {notice.text}
            </p>
          )}

          <button type="submit" disabled={busy || !amount} className="btn-primary w-full py-3.5">
            {buttonLabel}
          </button>
        </form>
      </div>

      {/* History */}
      <div>
        <h2 className="mb-3 text-base font-extrabold text-ink-900">Transaction History</h2>

        {txLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink-100" />
            ))}
          </div>
        ) : txError ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-ink-500">Could not load your transactions.</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm font-semibold text-ink-600">No transactions yet</p>
            <p className="mt-1 text-xs text-ink-400">Your transactions will appear here</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {transactions.map((tx) => {
              const credit = isCredit(tx);
              const status = (tx.status || "").toLowerCase();
              return (
                <li key={tx.id}>
                  <button
                    onClick={() => setSelectedTx(tx)}
                    className="card flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-ink-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                          credit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                        }`}
                      >
                        {credit ? <PlusIcon size={18} /> : <ArrowDownLeftIcon size={18} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-900">
                          {tx.description || (credit ? "Deposit" : "Withdrawal")}
                        </p>
                        <p className="text-[11px] text-ink-400">
                          {tx.date ? tx.date.toLocaleString() : ""}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-extrabold ${
                          credit ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {credit ? "+" : "-"}
                        {money(tx.amount)}
                      </p>
                      {status && (
                        <span
                          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            STATUS_STYLE[status] || "bg-ink-100 text-ink-600"
                          }`}
                        >
                          {status}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Transaction details */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-ink-900">Transaction Details</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-500 hover:bg-ink-100"
                aria-label="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-2xl bg-ink-50 px-4">
              <DetailRow label="Amount">{money(selectedTx.amount)}</DetailRow>
              {selectedTx.fee > 0 && <DetailRow label="Fee">{money(selectedTx.fee)}</DetailRow>}
              {selectedTx.grossAmount > 0 && (
                <DetailRow label="Total">{money(selectedTx.grossAmount)}</DetailRow>
              )}
              <DetailRow label="Status">{(selectedTx.status || "N/A").toUpperCase()}</DetailRow>
              <DetailRow label="Type">{(selectedTx.type || "N/A").toUpperCase()}</DetailRow>
              <DetailRow label="Description">{selectedTx.description || "N/A"}</DetailRow>
              <DetailRow label="Date">
                {selectedTx.date ? selectedTx.date.toLocaleString() : "N/A"}
              </DetailRow>
              {selectedTx.reference && <DetailRow label="Reference">{selectedTx.reference}</DetailRow>}
              {selectedTx.paymentMethod && (
                <DetailRow label="Payment Method">{selectedTx.paymentMethod}</DetailRow>
              )}
            </div>

            <button onClick={() => setSelectedTx(null)} className="btn-primary mt-4 w-full py-3">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}