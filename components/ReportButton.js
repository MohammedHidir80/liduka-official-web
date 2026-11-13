"use client";

import { useEffect, useState } from "react";
import useReport from "@/hooks/useReport";

const REASONS_BY_TYPE = {
  product: [
    "Counterfeit / Fake Product",
    "Scam or Fraud",
    "Misleading Product Info",
    "Prohibited Item",
    "Wrong Category",
    "Spam Listing",
    "Other",
  ],
  comment: [
    "Hate Speech / Abuse",
    "Harassment",
    "Offensive Language",
    "Spam Comment",
    "False Information",
    "Personal Attack",
    "Other",
  ],
};

function FlagIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 22V4" />
      <path d="M4 4h12l-2 4 2 4H4" />
    </svg>
  );
}

// variant="icon" -> just the flag (product page); variant="link" -> flag + "Report" (reviews)
export default function ReportButton({ type, targetId, targetOwnerId, variant = "icon" }) {
  const { submitReport, loading } = useReport();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reasons = REASONS_BY_TYPE[type] || [];

  const close = () => {
    setOpen(false);
    setReason(null);
    setDescription("");
    setError("");
    setDone(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSubmit = async () => {
    setError("");
    if (!reason) return setError("Please choose a reason.");
    if (!REASONS_BY_TYPE[type]) return setError("Invalid report type.");
    if (!reasons.includes(reason)) return setError("Invalid report reason selected.");
    if (!targetId || !targetOwnerId) return setError("Invalid report target.");

    try {
      await submitReport({ type, targetId, targetOwnerId, reason, description });
      setDone(true);
    } catch (err) {
      console.error("Report error:", err);
      setError(err?.message === "You must be logged in to report."
        ? err.message
        : "Failed to submit report. Please try again.");
    }
  };

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs font-bold text-ink-400 transition hover:text-rose-600"
        >
          <FlagIcon size={12} /> Report
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Report this ${type}`}
          className="grid h-9 w-9 place-items-center rounded-full text-rose-500 transition hover:bg-rose-50"
        >
          <FlagIcon size={18} />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center">
                <h2 className="mb-2 text-lg font-extrabold text-ink-900">Report submitted</h2>
                <p className="mb-6 text-sm text-ink-500">
                  Thank you. Our team will review this {type}.
                </p>
                <button type="button" onClick={close} className="btn-primary w-full py-3">
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-3 text-lg font-extrabold capitalize text-ink-900">
                  Report {type}
                </h2>

                <div className="space-y-1">
                  {reasons.map((r) => (
                    <label
                      key={r}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        reason === r
                          ? "bg-rose-50 font-semibold text-rose-600"
                          : "text-ink-700 hover:bg-ink-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`report-reason-${type}-${targetId}`}
                        checked={reason === r}
                        onChange={() => { setReason(r); setError(""); }}
                        className="h-4 w-4 accent-rose-500"
                      />
                      {r}
                    </label>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details (optional)"
                  className="input mt-3 min-h-[80px] resize-none"
                />

                {error && <p className="mt-2 text-xs font-semibold text-rose-500">{error}</p>}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="mt-4 w-full rounded-xl bg-rose-500 py-3 text-sm font-bold text-white transition hover:bg-rose-600 active:scale-[.98] disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="mt-3 w-full text-center text-sm font-semibold text-ink-500 hover:text-ink-800"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}