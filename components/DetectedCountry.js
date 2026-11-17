"use client";
// components/DetectedCountry.js (WEB) — shows the country found from the IP at signup. Read only, nobody picks it.
// onResult('checking' | 'ok' | 'unsupported' | 'error') lets the form block submit until it is 'ok'.
import { useCallback, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export default function DetectedCountry({ onResult }) {
  const [s, setS] = useState({ status: "checking" });

  const run = useCallback(async () => {
    setS({ status: "checking" }); onResult?.("checking");
    try {
      const r = (await httpsCallable(functions, "detectCountry")()).data;
      if (r?.supported) { setS({ status: "ok", ...r }); onResult?.("ok"); }
      else { setS({ status: "unsupported" }); onResult?.("unsupported"); }
    } catch (e) {
      console.error("detectCountry failed:", e?.code, e?.message);
      setS({ status: "error", code: e?.code }); onResult?.("error");
    }
  }, [onResult]);
  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (s.status === "checking") return <div className="rounded-xl border border-ink-100 p-3 text-sm text-ink-500">Checking your country…</div>;
  if (s.status === "ok") return (
    <div className="rounded-xl border border-brand-100 bg-brand-50 p-3">
      <p className="text-sm font-bold text-ink-900">{s.name} · prices in {s.currency}</p>
      <p className="text-xs text-ink-500">Detected automatically. It sets your currency and can't be changed later.</p>
    </div>
  );
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <span className="font-bold">{s.status === "unsupported" ? "Liduka isn't available in your country yet." : "We couldn't detect your country."}</span>
      {s.status === "error" && <button type="button" onClick={run} className="font-bold underline">Retry</button>}
    </div>
  );
}