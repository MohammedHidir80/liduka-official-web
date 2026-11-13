"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { HomeIcon, BagIcon, HeartIcon, UserIcon, PlusIcon } from "./icons";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useSettings();

  if (!user) return null;

  const buyerTabs = [
    { href: "/", label: t.home, Icon: HomeIcon, exact: true },
    { href: "/orders", label: t.orders, Icon: BagIcon },
    { href: "/saved", label: t.saved, Icon: HeartIcon },
    { href: "/profile", label: t.profile, Icon: UserIcon },
  ];

  const vendorTabs = [
    { href: "/vendor", label: t.home, Icon: HomeIcon, exact: true },
    { href: "/vendor/orders", label: t.orders, Icon: BagIcon },
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
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
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