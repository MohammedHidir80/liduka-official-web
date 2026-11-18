"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import Logo from "./logo";
import Footer from "./Footer";

// Login-type pages: logged-in users get sent away from these
const AUTH_ROUTES = [
  "/login",
  "/vendor/login",
  "/verify-email",
  "/vendor/verify-email",
  "/forgot-password",
  "/vendor/forgot-password",
];

// Readable by anyone, logged in or not, with no shell and no redirects

const PUBLIC_ROUTES = ["/terms", "/auth/action"];

// Logged-in pages both roles may open (adjust to your routes)
const SHARED_ROUTES = ["/customer-service", "/notifications"];

const isUnder = (path, base) => path === base || path.startsWith(base + "/");

function Splash() {
  const [slow, setSlow] = useState(false);
  // If the splash stays up for 6s, tell the visitor and let them retry instead of waiting forever
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="animate-pulse">
        <Logo size="text-5xl" />
      </div>
      <div className="mt-4 flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: "300ms" }} />
      </div>
      {slow && (
        <div className="mt-6 px-6 text-center">
          <p className="text-sm font-semibold text-ink-500">Taking longer than usual. Check your internet connection.</p>
          <button onClick={() => window.location.reload()} className="btn-outline mt-3 px-5 py-2 text-sm">
            Reload
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some((p) => isUnder(pathname, p));
  const isSharedRoute = SHARED_ROUTES.some((p) => isUnder(pathname, p));
  const isVendorArea = isUnder(pathname, "/vendor");

  // Decided during render, so a wrong-role page never mounts
  let redirectTo = null;
  if (ready && !isPublicRoute) {
    if (!user && !isAuthRoute) {
      redirectTo = isVendorArea ? "/vendor/login" : "/login";
    } else if (user && isAuthRoute) {
      redirectTo = user.role === "vendor" ? "/vendor" : "/";
    } else if (user && !isSharedRoute) {
      if (user.role === "vendor" && !isVendorArea) redirectTo = "/vendor";
      else if (user.role !== "vendor" && isVendorArea) redirectTo = "/";
    }
  }

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  // After a new deploy, a phone holding the old page asks for files that no longer exist.
  // Reload once so it picks up the new version (guarded so it can never loop).
  useEffect(() => {
    const onErr = (e) => {
      const msg = String(e?.message || e?.reason?.message || "");
      if (/ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(msg)) {
        try {
          if (sessionStorage.getItem("chunk-reload")) return;
          sessionStorage.setItem("chunk-reload", "1");
        } catch {}
        window.location.reload();
      }
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onErr);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onErr);
    };
  }, []);

  if (isPublicRoute) return <>{children}</>; // terms etc. never wait for sign-in
  if (!ready) return <Splash />;
  if (redirectTo) return <Splash />;
  if (isAuthRoute) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex-1 pb-24 md:pb-10">{children}</main>
       <Footer />
      <BottomNav />
    </div>
  );
}