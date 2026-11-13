"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWallet } from "@/context/WalletContext";
import { useSettings } from "@/context/SettingsContext";
import { useNotifications } from "@/context/NotificationContext";
import { timeAgo } from "@/lib/format";
import { formatPrice } from "@/utils/currency";
import { getIconDetails } from "@/utils/notifications";
import Logo from "./logo";
import { SearchIcon, CartIcon, WalletIcon, ChevronLeftIcon, BellIcon } from "./icons";

export default function TopBar() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { balance } = useWallet();
  const { t } = useSettings();
  const { notifications, unreadCount, markAsRead, markAllAsRead, ready } = useNotifications();
  const pathname = usePathname();

  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const isVendor = user?.role === "vendor";
  const homeHref = isVendor ? "/vendor" : "/";
  const isHome = pathname === homeHref;

  const desktopLinks = isVendor
    ? [{ href: "/vendor", label: t.dashboard }, { href: "/vendor/orders", label: t.orders }]
    : [{ href: "/", label: t.home }, { href: "/orders", label: t.myOrders }, { href: "/saved", label: t.saved }];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-14 items-center gap-3">
        {isHome ? (
          <Link href={homeHref} className="flex items-center gap-2">
            <Logo size="text-[28px]" />
          </Link>
        ) : (
          <button
            onClick={() => history.back()}
            className="grid h-9 w-9 place-items-center rounded-xl text-ink-700 hover:bg-ink-100"
            aria-label="Back"
          >
            <ChevronLeftIcon size={20} />
          </button>
        )}

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {desktopLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition hover:text-brand-600 ${pathname === link.href ? "text-brand-600" : "text-ink-500"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop search */}
        <div className="hidden flex-1 md:block">
          <form onSubmit={handleSearch} className="relative ml-auto block max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
              <SearchIcon size={18} />
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input h-9 pl-10"
              placeholder={t.search}
            />
          </form>
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          {/* Wallet */}
          <Link
            href={isVendor ? "/vendor/wallet" : "/wallet"}
            className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700"
          >
            <WalletIcon size={16} />
            {formatPrice(balance, "GHS")}
          </Link>

          {/* Notifications bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative grid h-9 w-9 place-items-center rounded-xl text-ink-700 transition hover:bg-ink-100"
              aria-label="Notifications"
            >
              <BellIcon size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-xl animate-in fade-in zoom-in-95 sm:w-96">
                <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/50 p-4">
                  <h3 className="text-sm font-extrabold text-ink-900">{t.notifications}</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      {t.markAllRead}
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {!ready ? (
                    <p className="p-6 text-center text-sm text-ink-400">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="p-6 text-center text-sm text-ink-500">{t.noNotifications}</p>
                  ) : (
                    notifications.slice(0, 5).map((notif) => {
                      const { Icon, color, bg } = getIconDetails(notif.type);
                      return (
                        <button
                          key={notif.id}
                          onClick={() => {
                            if (!notif.read) markAsRead(notif.id);
                          }}
                          className={`flex w-full items-start gap-3 border-b border-ink-50 p-4 text-left transition last:border-0 hover:bg-ink-50 ${!notif.read ? "bg-brand-50/30" : ""
                            }`}
                        >
                          <span
                            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${bg} ${color}`}
                          >
                            <Icon size={14} />
                          </span>
                          <div className="flex-1">
                            <p
                              className={`text-sm leading-tight ${!notif.read ? "font-bold text-ink-900" : "font-medium text-ink-600"
                                }`}
                            >
                              {notif.message}
                            </p>
                            <p className="mt-1 text-[11px] text-ink-400">
                              {notif.createdAt ? timeAgo(notif.createdAt) : "just now"}
                            </p>
                          </div>
                          {!notif.read && (
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-ink-100 bg-white p-2">
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="block w-full rounded-xl py-2 text-center text-sm font-bold text-brand-600 transition hover:bg-brand-50"
                  >
                    {t.seeAll}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Cart (buyers only) */}
          {!isVendor && (
            <Link
              href="/cart"
              className="relative grid h-9 w-9 place-items-center rounded-xl text-ink-700 hover:bg-ink-100"
              aria-label="Cart"
            >
              <CartIcon size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          <Link
            href={isVendor ? "/vendor/profile" : "/profile"}
            className="grid h-9 w-9 place-items-center overflow-hidden rounded-full text-sm font-bold text-white"
            style={{ background: `hsl(${user?.hue ?? 232} 60% 45%)` }}
          >
            {(user?.avatarURL || user?.avatar) ? (
              <img src={user.avatarURL || user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.name?.[0] ?? "?"
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}