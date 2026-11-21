"use client";

// components/Maintenance.js — shown to everyone while settings/maintenance.enabled is true.
export default function Maintenance({ message }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-white px-6 text-center">
      <div className="max-w-md">
        <p className="mb-6 text-7xl">🚧</p>
        <h1 className="mb-3 text-3xl font-extrabold text-ink-900">We'll Be Back Soon</h1>
        <p className="text-base leading-relaxed text-ink-500">
          {message || "We're currently improving Liduka and fixing a few issues. Please check back again shortly."}
        </p>
        <button onClick={() => window.location.reload()} className="btn-outline mt-8 px-6 py-2.5 text-sm">
          Try again
        </button>
        <p className="mt-10 text-2xl font-black italic tracking-tight text-ink-900">
          lidu<span className="text-[#1877F2]">ka</span>
        </p>
      </div>
    </div>
  );
}