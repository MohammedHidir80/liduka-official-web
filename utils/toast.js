// utils/toast.js — small message that fades out by itself (no click needed). Use instead of alert().
//   import { showToast } from "@/utils/toast";
//   showToast("Added Shea butter to cart");           // default: success
//   showToast("Could not save", "error");
// Works anywhere (hooks, event handlers). It does nothing on the server.
let host = null;

function getHost() {
  if (host && document.body.contains(host)) return host;
  host = document.createElement("div");
  host.setAttribute("aria-live", "polite");
  host.style.cssText =
    "position:fixed;left:50%;top:76px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;max-width:92vw";
  document.body.appendChild(host);

  const css = document.createElement("style");
  css.textContent =
    "@keyframes lk-toast-in{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:none}}" +
    "@keyframes lk-toast-out{to{opacity:0;transform:translateY(-8px)}}";
  document.head.appendChild(css);
  return host;
}

export function showToast(text, type = "success", ms = 2200) {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  const err = type === "error";
  el.setAttribute("role", "status");
  el.style.cssText =
    "display:flex;align-items:center;gap:8px;padding:11px 18px;border-radius:9999px;font:700 13px/1.3 system-ui,sans-serif;color:#fff;" +
    `background:${err ? "#E11D48" : "#10234F"};box-shadow:0 10px 28px -10px rgba(0,0,0,.5);animation:lk-toast-in .25s ease-out`;
  el.textContent = (err ? "! " : "✓ ") + text;

  const h = getHost();
  h.appendChild(el);
  // keep at most 3 on screen
  while (h.children.length > 3) h.removeChild(h.firstChild);

  setTimeout(() => {
    el.style.animation = "lk-toast-out .3s ease-in forwards";
    setTimeout(() => el.remove(), 320);
  }, ms);
}