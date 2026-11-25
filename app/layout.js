import "./globals.css";
import { Suspense } from "react"; // Import Suspense
import AppProviders from "@/context/AppProviders";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Liduka ",
  description: "Buy from independent vendors, sell to thousands of buyers.",
  manifest: "/manifest.webmanifest",
  // Logo shown in the browser tab, on the Home Screen and in notifications.
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }], // iPhone Home Screen
  },
  // iPhone: name under the Home Screen icon, and open full screen
  appleWebApp: { capable: true, title: "Liduka", statusBarStyle: "default" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {/* Wrap in Suspense to fix the blocking route error */}
          <Suspense 
            fallback={
              <div className="grid min-h-dvh place-items-center bg-ink-50">
                <div className="text-sm font-semibold text-ink-500">Loading...</div>
              </div>
            }
          >
            <AppShell>{children}</AppShell>
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}