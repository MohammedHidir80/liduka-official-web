"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useNotifications } from "@/context/NotificationContext";
import usePendingOrders from "@/hooks/usePendingOrders";
import { HomeIcon, BagIcon, HeartIcon, UserIcon, PlusIcon } from "./icons";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useSettings();
  const { notifications } = useNotifications();
  // vendors: orders waiting to be accepted (badge on the Orders tab)
  const pending = usePendingOrders(user?.role === "vendor" ? user.uid : null, notifications?.[0]?.id);

  if (!user) return null;

  const buyerTabs = [
    { href: "/", label: t.home, Icon: HomeIcon, exact: true },
    { href: "/orders", label: t.orders, Icon: BagIcon },
    { href: "/saved", label: t.saved, Icon: HeartIcon },
    { href: "/profile", label: t.profile, Icon: UserIcon },
  ];

  const vendorTabs = [
    { href: "/vendor", label: t.home, Icon: HomeIcon, exact: true },
    { href: "/vendor/orders", label: t.orders, Icon: BagIcon, badge: pending },
    { href: "/vendor/products/new", label: t.add, Icon: PlusIcon, primary: true },
    { href: "/vendor/profile", label: t.profile, Icon: UserIcon },
  ];

  const tabs = user.role === "vendor" ? vendorTabs : buyerTabs;

  const isActive = (tab) =>
    tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 backdrop-blur shadow-nav md:hidden">
      <ul className="safe-bottom grid grid-cols-4 pt-2">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.Icon;

          if (tab.primary) {
            return (
              <li key={tab.href} className="flex justify-center">
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  className="-mt-6 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-brand-600 text-white shadow-card transition active:scale-95"
                >
                  <Icon size={24} strokeWidth={2.1} />
                </Link>
              </li>
            );
          }

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 pb-1.5 text-[11px] font-semibold transition ${
                  active ? "text-brand-600" : "text-ink-400"
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  {tab.badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
                <span
                  className={`h-1 w-1 rounded-full transition ${
                    active ? "bg-brand-600" : "bg-transparent"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}