"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { ChevronLeftIcon, ChevronRightIcon, HeadsetIcon, MailIcon } from "@/components/icons";

const SUPPORT_EMAIL = "support@liduka.com";

export default function CustomerServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useSettings();

  const faqs = [
    [t.faq1Q, t.faq1A],
    [t.faq2Q, t.faq2A],
    [t.faq3Q, t.faq3A],
  ].filter(([q, a]) => q && a);

  return (
    <div className="container-page max-w-2xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100"
          aria-label="Back"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-ink-900">{t.customerService}</h1>
        <div className="w-9" />
      </div>

      <div className="card mb-6 flex flex-col items-center p-6 text-center">
        <span className="mb-3 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
          <HeadsetIcon size={30} />
        </span>
        <h2 className="text-lg font-extrabold text-ink-900">{t.howCanWeHelp}</h2>
        <p className="mt-1 text-sm text-ink-500">{t.helpSub}</p>
      </div>

      <h3 className="mb-2 ml-2 text-xs font-bold uppercase tracking-wider text-ink-400">{t.contactUs}</h3>
      <div className="card mb-8 overflow-hidden">
        <Link
          href="/customer-service/chat"
          className="flex items-center gap-4 border-b border-ink-50 p-4 transition hover:bg-ink-50"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <HeadsetIcon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-900">{t.liveChat}</p>
            <p className="text-xs text-ink-500">{t.responseTime}</p>
          </div>
          <ChevronRightIcon size={18} className="text-ink-300" />
        </Link>

        <a
          href={`mailto:${SUPPORT_EMAIL}${user?.email ? `?subject=${encodeURIComponent("Support request")}` : ""}`}
          className="flex items-center gap-4 p-4 transition hover:bg-ink-50"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink-100 text-ink-500">
            <MailIcon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-900">{t.emailSupport}</p>
            <p className="text-xs text-ink-500">{SUPPORT_EMAIL}</p>
          </div>
        </a>
      </div>

      {faqs.length > 0 && (
        <>
          <h3 className="mb-2 ml-2 text-xs font-bold uppercase tracking-wider text-ink-400">
            {t.frequentlyAsked}
          </h3>
          <div className="card divide-y divide-ink-50 overflow-hidden">
            {faqs.map(([q, a]) => (
              <details key={q} className="group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-ink-900">
                  {q}
                  <ChevronRightIcon size={16} className="shrink-0 text-ink-300 transition group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{a}</p>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}