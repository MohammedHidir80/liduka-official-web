"use client";

// components/AccountBlocked.js — shown instead of the app to a suspended or banned account.
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@liduka.com";

export default function AccountBlocked({ info }) {
  const banned = info.kind === "banned";
  return (
    <div className="grid min-h-dvh place-items-center bg-ink-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
        <p className="mb-4 text-6xl">{banned ? "⛔" : "⏸️"}</p>
        <h1 className="mb-2 text-2xl font-extrabold text-ink-900">{info.title}</h1>
        <p className="text-sm leading-relaxed text-ink-500">{info.message}</p>

        {info.reason && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-left text-sm text-rose-700">
            <span className="font-bold">Reason: </span>
            {info.reason}
          </p>
        )}
        {!banned && info.until > 0 && (
          <p className="mt-3 text-sm font-semibold text-ink-700">
            Suspended until {new Date(info.until).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        <a href={`mailto:${SUPPORT}`} className="btn-primary mt-6 flex w-full justify-center py-3">
          Contact support
        </a>
        <button onClick={() => signOut(auth)} className="btn-outline mt-3 w-full py-3 text-sm">
          Log out
        </button>
      </div>
    </div>
  );
}