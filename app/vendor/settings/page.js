"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import {
  HeadsetIcon, ChevronRightIcon, GlobeIcon,
} from "@/components/icons";

// Must match the keys in lib/translations.js. Names are shown in their own language.
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
];

export default function VendorSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { language, setLanguage, t } = useSettings();
  const [langOpen, setLangOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
      router.replace("/vendor/login");
    }
  };

  const pick = (code) => {
    setLanguage(code);
    setLangOpen(false);
  };

  return (
    <div className="container-page max-w-xl space-y-6 py-6 pb-24">
      <h1 className="text-2xl font-extrabold text-ink-900">{t.settings}</h1>

      <div className="card divide-y divide-ink-50 overflow-hidden border border-ink-100">
        {/* Customer Service */}
        <Link href="/customer-service" className="flex items-center justify-between p-4 transition hover:bg-ink-50">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600">
              <HeadsetIcon size={18} />
            </span>
            <span className="text-sm font-bold text-ink-900">Customer Service</span>
          </div>
          <ChevronRightIcon size={18} className="text-ink-300" />
        </Link>

        {/* Language */}
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 transition hover:bg-ink-50"
          onClick={() => setLangOpen(true)}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-purple-50 text-purple-600">
              <GlobeIcon size={18} />
            </span>
            <span className="text-sm font-bold text-ink-900">{t.language}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">{current.label}</span>
            <ChevronRightIcon size={18} className="text-ink-300" />
          </div>
        </button>
      </div>

      {/* Language picker */}
      {langOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setLangOpen(false)}
        >
          <div
            role="dialog"
            aria-label={t.language}
            className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900">{t.language}</h2>
              <button type="button" onClick={() => setLangOpen(false)} aria-label="Close" className="text-ink-500">✕</button>
            </div>

            <div className="divide-y divide-ink-50 overflow-hidden rounded-xl border border-ink-100">
              {LANGUAGES.map((l) => {
                const selected = l.code === language;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => pick(l.code)}
                    className={`flex w-full items-center justify-between p-4 text-left transition hover:bg-ink-50 ${selected ? "bg-brand-50" : ""}`}
                  >
                    <span className={`text-sm font-bold ${selected ? "text-brand-600" : "text-ink-900"}`}>{l.label}</span>
                    {selected && <span className="text-brand-600">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}