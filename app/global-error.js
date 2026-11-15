"use client";
// app/global-error.js — shown if the app crashes while starting (for example a blocked storage in an in-app browser),
// instead of leaving visitors on the loading screen forever. Plain styles on purpose: it must work even if the CSS or providers fail.

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#111827" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 320 }}>
            The page could not start. Check your internet connection and try again. If it keeps happening, open the site in Chrome or Safari.
          </p>
          <button
            onClick={() => (typeof reset === "function" ? reset() : window.location.reload())}
            style={{ marginTop: 8, padding: "10px 22px", borderRadius: 12, border: 0, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 15 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}