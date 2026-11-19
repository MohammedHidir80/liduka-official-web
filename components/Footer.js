"use client";

// components/Footer.js — site footer for the buyer pages. Hidden where it would get in the way
// (checkout, sign-in pages, the vendor area). Only links to pages that exist; edit LINKS to add more.
import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDE = ["/checkout", "/auth", "/login", "/vendor", "/vendor-login", "/signup"];
const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@liduka.com";

const SHOP = [
  { href: "/", label: "Home" },
  { href: "/orders", label: "My orders" },
  { href: "/saved", label: "Saved" },
  { href: "/wallet", label: "Wallet" },
];
const HELP = [
  { href: `mailto:${SUPPORT}`, label: "Contact support", external: true },
  { href: "/terms", label: "Terms & Privacy" },
];
const COUNTRIES = ["Ghana", "Nigeria", "Kenya", "South Africa"];

function Col({ title, links }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-white/50">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a href={l.href} className="text-sm font-medium text-white/70 transition hover:text-white">{l.label}</a>
            ) : (
              <Link href={l.href} className="text-sm font-medium text-white/70 transition hover:text-white">{l.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const pathname = usePathname() || "/";
  if (HIDE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <footer className="mt-16 bg-ink-900 pb-24 pt-10 text-white md:pb-8">
      <div className="container-page">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-2">
            <span className="text-[28px] font-black italic tracking-tight text-white">lidu<span className="text-[#1877F2]">ka</span></span>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
              Buy and sell across Africa. Pay from your wallet, get your order from trusted vendors.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{c}</span>
              ))}
            </div>
          </div>
          <Col title="Shop" links={SHOP} />
          <Col title="Help" links={HELP} />
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Liduka. All rights reserved.</p>
          <p>Prices in another currency are estimates. You see the final price before you pay.</p>
        </div>
      </div>
    </footer>
  );
}