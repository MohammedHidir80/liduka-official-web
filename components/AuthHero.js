"use client";

// components/AuthHero.js — welcome banner for the buyer and vendor sign-in pages. Same on phone and desktop.
// The welcome word changes every few seconds through the countries we serve. Edit GREETINGS to change them.
import { useEffect, useState } from "react";
import Link from "next/link";

// Pan-African colours (gold, red, green, black) as a woven strip
const KENTE =
  "repeating-linear-gradient(90deg,#F2B705 0 14px,#111 14px 18px,#C8102E 18px 32px,#111 32px 36px,#007A3D 36px 50px,#111 50px 54px)";

const GREETINGS = [
  { word: "A maraaba", from: "Dagbani · Ghana" },
  { word: "Ẹ káàbọ̀", from: "Yoruba · Nigeria" },
  { word: "Karibu", from: "Swahili · Kenya" },
  { word: "Siyakwamukela", from: "Zulu · South Africa" },
];

const COUNTRIES = ["Ghana", "Nigeria", "Kenya", "South Africa"];

export default function AuthHero({ tagline, sub }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    let swap;
    const t = setInterval(() => {
      setShow(false); // fade out, change the word, fade back in
      swap = setTimeout(() => {
        setI((n) => (n + 1) % GREETINGS.length);
        setShow(true);
      }, 300);
    }, 3200);
    return () => {
      clearInterval(t);
      clearTimeout(swap);
    };
  }, []);

  const g = GREETINGS[i];

  return (
    <header
      className="relative overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg,#0B1020 0%,#10234F 65%,#12306B 100%)" }}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
        <defs>
          <pattern id="mud" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M24 4 44 24 24 44 4 24Z" fill="none" stroke="#fff" strokeWidth="2" />
            <path d="M24 14 34 24 24 34 14 24Z" fill="#fff" />
            <path d="M0 0l8 8M48 0l-8 8M0 48l8-8M48 48l-8-8" stroke="#fff" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mud)" />
      </svg>

      <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-8 text-center sm:pb-24 sm:pt-12">
        <Link href="/" className="inline-block text-3xl font-black italic tracking-tight sm:text-4xl">
          lidu<span className="text-[#1877F2]">ka</span>
        </Link>

        <div className={`mt-7 transition-opacity duration-300 sm:mt-10 ${show ? "opacity-100" : "opacity-0"}`} aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2B705]">{g.from}</p>
          <p className="mt-1 text-5xl font-black leading-tight tracking-tight sm:text-7xl">{g.word}</p>
        </div>

        <p className="mt-5 text-lg font-extrabold sm:text-2xl">{tagline}</p>
        {sub && <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">{sub}</p>}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {COUNTRIES.map((c) => (
            <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 sm:text-sm">
              <span className="text-[#F2B705]">◆</span> {c}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-2" style={{ background: KENTE }} aria-hidden="true" />
    </header>
  );
}