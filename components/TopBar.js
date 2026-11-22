"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWallet } from "@/context/WalletContext";
import { useSettings } from "@/context/SettingsContext";
import { useNotifications } from "@/context/NotificationContext";
import usePendingOrders from "@/hooks/usePendingOrders";
import { timeAgo } from "@/lib/format";
import { formatPrice } from "@/utils/currency";
import { getIconDetails } from "@/utils/notifications";
import Logo from "./logo";
import { SearchIcon, CartIcon, WalletIcon, ChevronLeftIcon, BellIcon } from "./icons";

// Becomes "on" for ~1s whenever `value` goes UP (a new notification, an item added to the cart).
// Increases in the first moments after the page opens are the data loading in, so they are ignored.
function useRing(value, enabled = true) {
  const prev = useRef(null);
  const born = useRef(Date.now());
  const timer = useRef(null);
  const [state, setState] = useState({ on: false, tick: 0 });
  useEffect(() => {
    if (!enabled) return;
    if (prev.current !== null && value > prev.current && Date.now() - born.current > 2500) {
      setState((s) => ({ on: true, tick: s.tick + 1 }));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setState((s) => ({ ...s, on: false })), 1100);
    }
    prev.current = value;
  }, [value, enabled]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return state;
}

const RING_CSS = `
.lk-ring{display:inline-grid;transform-origin:50% 8%;animation:lk-ring 1s ease-in-out}
.lk-bounce{display:inline-grid;animation:lk-bounce .8s cubic-bezier(.3,1.4,.5,1)}
.lk-pop{animation:lk-pop .6s ease-out}
@keyframes lk-ring{0%,100%{transform:rotate(0)}10%{transform:rotate(18deg)}22%{transform:rotate(-16deg)}34%{transform:rotate(12deg)}46%{transform:rotate(-9deg)}58%{transform:rotate(5deg)}70%{transform:rotate(-2deg)}}
@keyframes lk-bounce{0%,100%{transform:translateY(0) scale(1)}25%{transform:translateY(-7px) scale(1.15)}50%{transform:translateY(0) scale(.94)}72%{transform:translateY(-3px) scale(1.06)}}
@keyframes lk-pop{0%{transform:scale(1)}40%{transform:scale(1.7)}100%{transform:scale(1)}}
@media(prefers-reduced-motion:reduce){.lk-ring,.lk-bounce,.lk-pop{animation:none}}
`;

export default function TopBar() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { balance } = useWallet();
  const { t } = useSettings();
  const { notifications, unreadCount, markAsRead, markAllAsRead, ready } = useNotifications();
  const pathname = usePathname();
  // vendors: orders waiting to be accepted (badge next to Orders)
  const pending = usePendingOrders(user?.role === "vendor" ? user.uid : null, notifications?.[0]?.id);

  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef(null);
  const bell = useRing(unreadCount, ready);
  const cart = useRing(cartCount);

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
    ? [{ href: "/vendor", label: t.dashboard }, { href: "/vendor/orders", label: t.orders, badge: pending }]
    : [{ href: "/", label: t.home }, { href: "/orders", label: t.myOrders }, { href: "/saved", label: t.saved }];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
      <style>{RING_CSS}</style>
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
              {link.badge > 0 && (
                <span className="ml-1.5 inline-grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {link.badge > 99 ? "99+" : link.badge}
                </span>
              )}
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
            {formatPrice(balance, user?.currency || "GHS")}
          </Link>

          {/* Notifications bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative grid h-9 w-9 place-items-center rounded-xl text-ink-700 transition hover:bg-ink-100"
              aria-label="Notifications"
            >
              <span key={bell.tick} className={bell.on ? "lk-ring" : "inline-grid"}><BellIcon size={20} /></span>
              {unreadCount > 0 && (
                <span className={`absolute right-1 top-1 ${bell.on ? "lk-pop" : ""} grid h-4 min-w-[16px] place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white`}>
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
              <span key={cart.tick} className={cart.on ? "lk-bounce" : "inline-grid"}><CartIcon size={20} /></span>
              {cartCount > 0 && (
                <span className={`absolute right-0.5 top-0.5 ${cart.on ? "lk-pop" : ""} grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white`}>
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