"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { uploadVendorImage } from "@/lib/vendorProfile";
import { formatPrice } from "@/utils/currency";
import { 
  CameraIcon, ShareIcon, CheckIcon, WalletIcon, ChevronRightIcon, 
  StoreIcon, BoxIcon, BagIcon, ReceiptIcon, SettingsIcon, LogOutIcon, UserCircleIcon
} from "@/components/icons"; // Assuming these are in your icons file

const MENU = [
  { label: "Dashboard", href: "/vendor", Icon: StoreIcon, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "My products", href: "/vendor/products", Icon: BoxIcon, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Orders", href: "/vendor/orders", Icon: BagIcon, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Coupons", href: "/vendor/coupons", Icon: ReceiptIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Wallet", href: "/vendor/wallet", Icon: WalletIcon, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Payout setup", href: "/vendor/payout", Icon: WalletIcon, color: "text-teal-600", bg: "bg-teal-50" },
  { label: "Edit profile & security", href: "/vendor/profile/edit", Icon: UserCircleIcon, color: "text-rose-600", bg: "bg-rose-50" },
  { label: "Settings", href: "/vendor/settings", Icon: SettingsIcon, color: "text-ink-600", bg: "bg-ink-100" },
];

export default function VendorProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [info, setInfo] = useState(null);
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState({ avatar: false, cover: false });
  const [msg, setMsg] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(doc(db, "users", user.uid), (s) => setInfo(s.data() || {}));
    const u2 = onSnapshot(doc(db, "wallets", user.uid), (s) => setBalance(Number(s.data()?.balance) || 0));
    return () => { u1(); u2(); };
  }, [user]);

  const shopLink = user ? `${window.location.origin}/vendors/${user.uid}` : "";

  const pick = async (type, file) => {
    if (!file || !user) return;
    setMsg("");
    setBusy((b) => ({ ...b, [type]: true }));
    try {
      const url = await uploadVendorImage(file, type, user.uid);
      await updateDoc(doc(db, "users", user.uid), { [`${type}URL`]: url });
      setMsg(`${type === 'avatar' ? 'Profile photo' : 'Cover photo'} updated successfully!`);
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      console.error(e);
      setMsg(e.message || "Upload failed.");
    } finally {
      setBusy((b) => ({ ...b, [type]: false }));
    }
  };

  const copy = async () => {
    try { 
      await navigator.clipboard.writeText(shopLink); 
      setMsg("Shop link copied to clipboard!"); 
      setTimeout(() => setMsg(""), 3000);
    }
    catch { 
      setMsg(shopLink); 
    }
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: info?.fullName, text: "Check out my shop on Liduka!", url: shopLink }); } catch {}
    } else copy();
  };

  const doLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
      router.replace("/vendor/login");
    }
  };

  if (!info) {
    return (
      <div className="container-page py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl pb-16 pt-0 sm:pt-4">
      
      {/* Cover Image */}
      <label className="group relative mt-0 sm:mt-4 block aspect-[16/7] sm:aspect-[16/6] cursor-pointer overflow-hidden rounded-none sm:rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-sm">
        {info.coverURL && (
          <img src={info.coverURL} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/80">
          <CameraIcon size={14} /> {busy.cover ? "Uploading…" : "Change cover"}
        </span>
        <input type="file" accept="image/*" hidden disabled={busy.cover} onChange={(e) => pick("cover", e.target.files?.[0])} />
      </label>

      {/* Avatar & Info */}
      <div className="relative -mt-14 flex flex-col items-center px-4">
        <div className="relative">
          <label className="relative block h-28 w-28 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-ink-100 shadow-md">
            {info.avatarURL ? (
              <img src={info.avatarURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-3xl font-black text-ink-400 bg-ink-50">
                {info.fullName?.charAt(0) || "V"}
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100 flex items-center justify-center">
              <CameraIcon size={24} className="text-white" />
            </div>
            <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
              {busy.avatar ? "…" : "Edit"}
            </span>
            <input type="file" accept="image/*" hidden disabled={busy.avatar} onChange={(e) => pick("avatar", e.target.files?.[0])} />
          </label>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-ink-900">{info.fullName || "Vendor Store"}</h1>
        <p className="text-sm font-medium text-ink-500">{user?.email}</p>
        {info.createdAt?.toDate && (
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] font-bold text-ink-600">
            Joined {info.createdAt.toDate().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex w-full max-w-xs gap-3">
          <button className="btn-primary flex-1 py-2.5" onClick={share}>
            <ShareIcon size={16} /> Share
          </button>
          <button className="btn-outline flex-1 py-2.5" onClick={copy}>
            <CheckIcon size={16} /> Copy Link
          </button>
        </div>
        {msg && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1 rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            {msg}
          </div>
        )}
      </div>

      {/* Wallet Highlight Card */}
      

      {/* Menu List */}
      <div className="mt-8 mx-4 space-y-4">
        <div className="card overflow-hidden border border-ink-100">
          {MENU.map(({ label, href, Icon, color, bg }, idx) => (
            <Link 
              key={href} 
              href={href} 
              className={`flex items-center justify-between p-4 transition hover:bg-ink-50 ${
                idx !== MENU.length - 1 ? "border-b border-ink-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${bg} ${color}`}>
                  <Icon size={18} />
                </span>
                <span className="text-sm font-bold text-ink-900">{label}</span>
              </div>
              <ChevronRightIcon size={18} className="text-ink-300" />
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button 
          onClick={doLogout} 
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white p-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
        >
          <LogOutIcon size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}