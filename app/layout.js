import "./globals.css";
import { Suspense } from "react"; // Import Suspense
import AppProviders from "@/context/AppProviders";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Liduka ",
  description: "Buy from independent vendors, sell to thousands of buyers.",
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