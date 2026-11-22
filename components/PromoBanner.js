"use client";
// components/PromoBanner.js — animated Liduka banner that rotates between a BUYER slide and a VENDOR (onboarding) slide.
// Pure CSS/SVG: no images to load. Auto-advances (pauses on hover/touch), swipe + dots to change, respects reduced motion.
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BagIcon, BoxIcon, StarFilledIcon, MapPinIcon, WalletIcon, CheckIcon, UserCircleIcon,
} from "@/components/icons";

const SLIDE_MS = 7000;
const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@liduka.com";

const SLIDES = {
  buyer: {
    key: "buyer",
    tag: "FOR SHOPPERS",
    title: ["Shop. Discover.", "Support African businesses."],
    sub: "Liduka is a Pan-African marketplace making online commerce easier for businesses and customers across Africa.",
    points: ["A vast marketplace", "Shop with ease and confidence", "Grow together across borders"],
    tiles: [
      { Icon: BagIcon, label: "Find exactly what you need" },
      { Icon: StarFilledIcon, label: "Trusted vendors" },
      { Icon: MapPinIcon, label: "Across Africa" },
    ],
  },
  vendor: {
    key: "vendor",
    tag: "BECOME A VENDOR",
    title: ["Take your business online", "with Liduka."],
    sub: "More customers. More opportunities. A bigger future. Join the Liduka Vendor Partnership Programme.",
    points: ["Simple onboarding", "Product listing support", "Promotional opportunities"],
    steps: ["Register", "Business profile", "List products", "Get verified", "Go live"],
    tiles: [
      { Icon: UserCircleIcon, label: "Wider audience" },
      { Icon: WalletIcon, label: "More sales" },
      { Icon: BoxIcon, label: "Pan-African reach" },
    ],
  },
};

function Network() {
  // glowing nodes joined by arcs: an abstract "connected Africa"
  const nodes = [[60, 40], [150, 90], [240, 50], [330, 110], [420, 60], [200, 170], [310, 200], [110, 160]];
  return (
    <svg className="lpb-net" viewBox="0 0 480 240" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1">
        <path className="lpb-arc" d="M60 40 Q105 0 150 90" />
        <path className="lpb-arc" d="M150 90 Q195 20 240 50" style={{ animationDelay: ".6s" }} />
        <path className="lpb-arc" d="M240 50 Q285 120 330 110" style={{ animationDelay: "1.2s" }} />
        <path className="lpb-arc" d="M330 110 Q380 30 420 60" style={{ animationDelay: "1.8s" }} />
        <path className="lpb-arc" d="M150 90 Q150 150 200 170" style={{ animationDelay: ".3s" }} />
        <path className="lpb-arc" d="M200 170 Q260 230 310 200" style={{ animationDelay: ".9s" }} />
        <path className="lpb-arc" d="M310 200 Q330 150 330 110" style={{ animationDelay: "1.5s" }} />
        <path className="lpb-arc" d="M110 160 Q130 120 150 90" style={{ animationDelay: "2.1s" }} />
      </g>
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill="#fff" />
          <circle className="lpb-pulse" cx={x} cy={y} r="3" fill="none" stroke="#fff" style={{ animationDelay: `${i * 0.35}s` }} />
        </g>
      ))}
    </svg>
  );
}

function Slide({ s, active }) {
  return (
    <div className={`lpb-slide ${active ? "is-on" : ""}`} aria-hidden={!active}>
      <div className="lpb-copy">
        <span className="lpb-tag">{s.tag}</span>
        <h2 className="lpb-title">
          {s.title[0]} <span className="lpb-grad">{s.title[1]}</span>
        </h2>
        <p className="lpb-sub">{s.sub}</p>

        <ul className="lpb-points">
          {s.points.map((p) => (
            <li key={p}><span className="lpb-check"><CheckIcon size={11} /></span>{p}</li>
          ))}
        </ul>

        {s.steps && (
          <ol className="lpb-steps" aria-label="How it works">
            {s.steps.map((t, i) => (
              <li key={t}><b>{i + 1}</b>{t}</li>
            ))}
          </ol>
        )}

        {s.key === "vendor" && (
          <p className="lpb-contact">
            Questions? <a href={`mailto:${SUPPORT}`} tabIndex={active ? 0 : -1} className="lpb-mail">{SUPPORT}</a>
          </p>
        )}
      </div>

      <div className="lpb-tiles" aria-hidden="true">
        {s.tiles.map(({ Icon, label }, i) => (
          <div key={label} className="lpb-tile" style={{ animationDelay: `${i * 0.7}s` }}>
            <span className="lpb-ico"><Icon size={20} /></span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// compact: a shorter banner for the product page
export default function PromoBanner({ compact = false, startAt = 0, className = "" }) {
  const { user } = useAuth();
  // vendors don't need the "become a vendor" slide
  const list = user?.role === "vendor" ? [SLIDES.buyer] : [SLIDES.buyer, SLIDES.vendor];
  const [i, setI] = useState(startAt); // startAt: 0 = buyer slide first, 1 = vendor slide first
  const [hold, setHold] = useState(false);
  const [x0, setX0] = useState(null);
  const idx = i % list.length;
  // pause every animation while the banner is off-screen or the tab is hidden (saves CPU/battery)
  const ref = useRef(null);
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    const vis = () => setSeen(!document.hidden && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);
  const go = (n) => setI((n + list.length) % list.length);

  return (
    <section
      ref={ref}
      className={`lpb ${compact ? "lpb-compact" : ""} ${hold || !seen ? "is-hold" : ""} ${seen ? "" : "is-off"} ${className}`}
      aria-roledescription="carousel"
      aria-label="About Liduka"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      onTouchStart={(e) => { setHold(true); setX0(e.touches[0].clientX); }}
      onTouchEnd={(e) => {
        setHold(false);
        if (x0 != null) {
          const dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > 45) go(idx + (dx < 0 ? 1 : -1));
        }
        setX0(null);
      }}
    >
      <style>{CSS}</style>

      <div className="lpb-bg" aria-hidden="true">
        <span className="lpb-orb lpb-o1" /><span className="lpb-orb lpb-o2" /><span className="lpb-ring" />
        <Network />
        <span className="lpb-kente" />
      </div>

      <div className="lpb-brand" aria-hidden="true">lidu<i>ka</i><small>Shop · Sell · Grow</small></div>

      <div className="lpb-stage">
        {list.map((s, n) => <Slide key={s.key} s={s} active={n === idx} />)}
      </div>

      {list.length > 1 && (
        <div className="lpb-dots" role="tablist" aria-label="Choose a slide">
          {list.map((s, n) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={n === idx}
              aria-label={s.tag}
              onClick={() => go(n)}
              className={`lpb-dot ${n === idx ? "is-on" : ""}`}
            >
              {/* when this bar finishes filling, move to the next slide */}
              {n === idx && <span key={`${idx}-${i}`} className="lpb-fill" onAnimationEnd={() => go(idx + 1)} />}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

const CSS = `
.lpb{position:relative;overflow:hidden;border-radius:22px;color:#fff;isolation:isolate;contain:layout paint;
  background:linear-gradient(120deg,#1877F2 0%,#1664DB 52%,#0F46A8 100%);
  box-shadow:0 12px 28px -16px rgba(24,119,242,.75)}
.lpb-bg{position:absolute;inset:0;z-index:-1}
.lpb-net{position:absolute;inset:0;width:100%;height:100%;opacity:.5}
.lpb-arc{stroke-dasharray:5 7}
.lpb-pulse{transform-box:fill-box;transform-origin:center;animation:lpb-ping 3s ease-out infinite}
.lpb-orb{position:absolute;border-radius:9999px}
.lpb-o1{width:300px;height:300px;right:-90px;top:-130px;background:radial-gradient(circle,rgba(255,255,255,.28),rgba(255,255,255,0) 68%);animation:lpb-float 14s ease-in-out infinite}
.lpb-o2{width:240px;height:240px;left:-70px;bottom:-120px;background:radial-gradient(circle,rgba(242,183,5,.32),rgba(242,183,5,0) 68%)}
.lpb-ring{position:absolute;right:38%;top:-60px;width:160px;height:160px;border-radius:9999px;border:26px solid rgba(255,255,255,.07)}
.lpb-kente{position:absolute;left:0;right:0;bottom:0;height:4px;
  background:linear-gradient(90deg,#F2B705 0 25%,#C8102E 25% 50%,#007A3D 50% 75%,#111 75% 100%)}

.lpb-brand{position:absolute;right:26px;top:14px;font-weight:900;font-style:italic;font-size:20px;letter-spacing:-.02em;line-height:1;text-align:right}
.lpb-brand i{color:#fff;opacity:.7;font-style:italic}
.lpb-brand small{display:block;font-style:normal;font-weight:700;font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.75);margin-top:3px}

.lpb-stage{display:grid;padding:18px 18px 34px}
.lpb-slide{grid-area:1/1;display:flex;align-items:center;justify-content:space-between;gap:20px;
  opacity:0;transform:translateX(20px);pointer-events:none;visibility:hidden;
  transition:opacity .5s ease,transform .6s cubic-bezier(.2,.8,.2,1),visibility 0s .6s}
.lpb-slide.is-on{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition-delay:0s}
.lpb-copy{max-width:540px;min-width:0}
.lpb-tag{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.18em;padding:4px 10px;border-radius:9999px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35)}
.lpb-title{margin:8px 0 0;font-size:21px;line-height:1.15;font-weight:900;letter-spacing:-.02em}
.lpb-grad{color:#FFE08A}
.lpb-sub{display:none;margin:6px 0 0;font-size:13px;line-height:1.45;color:rgba(255,255,255,.9);max-width:50ch}
.lpb-points{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 12px;font-size:11.5px;font-weight:700}
.lpb-points li{display:flex;align-items:center;gap:5px}
.lpb-check{display:grid;place-items:center;width:16px;height:16px;border-radius:9999px;background:#fff;color:#1877F2}
.lpb-steps{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:5px}
.lpb-steps li{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;padding:3px 9px 3px 3px;border-radius:9999px;background:rgba(255,255,255,.16)}
.lpb-steps b{display:grid;place-items:center;width:16px;height:16px;border-radius:9999px;background:#F2B705;color:#0F2F73;font-size:9px}
.lpb-contact{margin:10px 0 0;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.85)}
.lpb-mail{font-size:11.5px;font-weight:700;color:#fff;text-decoration:underline;text-underline-offset:3px}

.lpb-tiles{display:none;flex-direction:column;gap:8px;flex:none;width:176px}
.lpb-tile{display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:14px;font-size:11px;font-weight:700;
  background:rgba(255,255,255,.17);border:1px solid rgba(255,255,255,.32);animation:lpb-bob 5s ease-in-out infinite}
.lpb-tile:nth-child(2){margin-left:16px}
.lpb-ico{display:grid;place-items:center;width:28px;height:28px;border-radius:10px;background:#fff;color:#1877F2;flex:none}

.lpb-dots{position:absolute;left:18px;bottom:11px;display:flex;gap:7px}
.lpb-dot{position:relative;height:4px;width:18px;border-radius:9999px;background:rgba(255,255,255,.35);overflow:hidden;border:0;padding:0;cursor:pointer;transition:width .3s}
.lpb-dot.is-on{width:48px}
.lpb-fill{position:absolute;inset:0;background:#fff;transform-origin:left;transform:scaleX(0);animation:lpb-prog ${SLIDE_MS}ms linear forwards}
.lpb.is-hold .lpb-fill{animation-play-state:paused}
.lpb.is-off *{animation-play-state:paused!important}

.lpb-compact .lpb-stage{padding:14px 16px 30px}
.lpb-compact .lpb-title{font-size:18px}
.lpb-compact .lpb-sub,.lpb-compact .lpb-brand,.lpb-compact .lpb-steps,.lpb-compact .lpb-tiles{display:none!important}

@media(min-width:640px){.lpb-sub{display:block}}
@media(min-width:768px){
  .lpb-stage{padding:20px 30px 36px}
  .lpb-title{font-size:27px}
  .lpb-tiles{display:flex}
  .lpb-brand{right:30px;top:16px;font-size:22px}
  .lpb-dots{left:30px;bottom:13px}
  .lpb-tile:first-child{margin-top:20px}
  .lpb-compact .lpb-title{font-size:20px}
}
@media(max-width:420px){.lpb-brand{display:none}}

@keyframes lpb-ping{0%{transform:scale(1);opacity:.9}100%{transform:scale(5);opacity:0}}
@keyframes lpb-float{0%,100%{transform:translate(0,0)}50%{transform:translate(-14px,10px)}}
@keyframes lpb-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes lpb-prog{to{transform:scaleX(1)}}
@media(prefers-reduced-motion:reduce){
  .lpb *{animation:none!important;transition-duration:.01ms!important}
  .lpb-fill{transform:scaleX(1)}
}
`;