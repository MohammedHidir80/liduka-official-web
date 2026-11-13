"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { ChevronLeftIcon, BellIcon, CheckIcon, LogOutIcon, GlobeIcon } from "@/components/icons";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "pt", name: "Português" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useSettings();

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
      router.replace("/login");
    }
  };

  return (
    <div className="container-page py-6 max-w-2xl min-h-dvh">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100 text-ink-700">
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-ink-900">{t.settings}</h1>
        <div className="w-9" />
      </div>

      {/* Language */}
      <h2 className="mb-3 ml-1 text-xs font-bold uppercase tracking-wider text-ink-400">
        {t.language}
      </h2>
      <div className="mb-8 rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm">
        {LANGUAGES.map((lang, idx) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex w-full items-center justify-between p-4 transition hover:bg-ink-50 ${
              idx !== LANGUAGES.length - 1 ? "border-b border-ink-50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                <GlobeIcon size={18} />
              </span>
              <span className="text-sm font-semibold text-ink-900">{lang.name}</span>
            </div>
            {language === lang.code && (
              <CheckIcon size={20} className="text-brand-600" />
            )}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <h2 className="mb-3 ml-1 text-xs font-bold uppercase tracking-wider text-ink-400">
        Notifications
      </h2>
      <div className="mb-8 rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm">
        <button
          onClick={() => alert("Notification preferences are demo-only.")}
          className="flex w-full items-center justify-between p-4 transition hover:bg-ink-50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
              <BellIcon size={18} />
            </span>
            <span className="text-sm font-semibold text-ink-900">{t.notifications}</span>
          </div>
        </button>
      </div>

      {/* About */}
      <h2 className="mb-3 ml-1 text-xs font-bold uppercase tracking-wider text-ink-400">
        {t.about}
      </h2>
      <div className="mb-8 rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-ink-50">
          <span className="text-sm text-ink-500">{t.version}</span>
          <span className="text-sm font-semibold text-ink-900">1.0.0 (Demo)</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-ink-500">{t.marketplace}</span>
          <span className="text-sm font-semibold text-ink-900">Liduka</span>
        </div>
      </div>

      
    </div>
  );
}