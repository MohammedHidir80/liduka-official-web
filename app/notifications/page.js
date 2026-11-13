"use client";

import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { useSettings } from "@/context/SettingsContext";
import { timeAgo } from "@/lib/format";
import { getIconDetails } from "@/utils/notifications";
import { ChevronLeftIcon, BellIcon } from "@/components/icons";

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useSettings();
  const { notifications, markAsRead, markAllAsRead, unreadCount, ready, error } = useNotifications();

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
        <h1 className="text-lg font-extrabold text-ink-900">{t.notifications}</h1>
        <div className="flex w-24 justify-end">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              {t.markAllRead}
            </button>
          )}
        </div>
      </div>

      {!ready ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 border-b border-ink-50 p-4 last:border-0">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-ink-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-400">
            <BellIcon size={28} />
          </div>
          <p className="text-sm font-semibold text-ink-600">Could not load your notifications.</p>
          <p className="mt-1 text-xs text-ink-400">Please check your connection and try again.</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-ink-100 text-ink-400">
            <BellIcon size={28} />
          </div>
          <p className="text-sm font-semibold text-ink-600">{t.noNotifications}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
          {notifications.map((notif) => {
            const { Icon, color, bg } = getIconDetails(notif.type);
            return (
              <button
                key={notif.id}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id);
                }}
                className={`flex w-full items-start gap-4 border-b border-ink-50 p-4 text-left transition last:border-0 hover:bg-ink-50 ${
                  !notif.read ? "bg-brand-50/30" : ""
                }`}
              >
                <span
                  className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ${bg} ${color}`}
                >
                  <Icon size={18} />
                </span>
                <div className="flex-1">
                  <p
                    className={`text-sm leading-tight ${
                      !notif.read ? "font-bold text-ink-900" : "font-medium text-ink-600"
                    }`}
                  >
                    {notif.message}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    {notif.createdAt ? timeAgo(notif.createdAt) : "just now"}
                  </p>
                </div>
                {!notif.read && <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}