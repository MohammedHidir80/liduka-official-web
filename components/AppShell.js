"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import Logo from "./logo";

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
const PUBLIC_ROUTES = ["/terms"];

// Logged-in pages both roles may open (adjust to your routes)
const SHARED_ROUTES = ["/customer-service", "/notifications"];

const isUnder = (path, base) => path === base || path.startsWith(base + "/");

function Splash() {
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
    </div>
  );
}

export default function AppShell({ children }) {
  const [mounted, setMounted] = useState(false);
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some((p) => isUnder(pathname, p));
  const isSharedRoute = SHARED_ROUTES.some((p) => isUnder(pathname, p));
  const isVendorArea = isUnder(pathname, "/vendor");

  // Decided during render, so a wrong-role page never mounts
  let redirectTo = null;
  if (mounted && ready && !isPublicRoute) {
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!mounted || !ready) return <Splash />;
  if (isPublicRoute) return <>{children}</>;
  if (redirectTo) return <Splash />;
  if (isAuthRoute) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex-1 pb-24 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}