"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useNotifications } from "@/context/NotificationContext";
import { useSettings } from "@/context/SettingsContext";
import { uploadAvatar } from "@/lib/r2";
import { resizeToSquareJpeg } from "@/utils/image";
import { formatPrice } from "@/utils/currency";
import {
  UserCircleIcon, WalletIcon, MapPinIcon, ReceiptIcon, HeartIcon, BellIcon,
  SettingsIcon, HeadsetIcon, InfoIcon, LogOutIcon, ChevronRightIcon,
  CalendarIcon, XIcon,
} from "@/components/icons";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_MB = 15;

function CameraBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, logout, updateUser } = useAuth();
  const { balance, ready: walletReady } = useWallet();
  const { unreadCount } = useNotifications();
  const { t } = useSettings();

  const fileRef = useRef(null);

  const [zoomVisible, setZoomVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [avatarError, setAvatarError] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  // If the session ends (logout, expired, signed out elsewhere), go to login
  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  const handleLogout = async () => {
    if (loggingOut) return;
    if (!confirm("Are you sure you want to log out?")) return;

    setLoggingOut(true);
    try {
      await logout(); // Firebase signOut; the auth listener clears `user`
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Could not log out. Please try again.");
      setLoggingOut(false);
    }
  };

  const openEdit = () => {
    setEditName(user?.name || "");
    setEditPhone(user?.phone || "");
    setEditError("");
    setEditVisible(true);
  };

  const saveProfile = async () => {
    if (!editName.trim()) return setEditError("Name is required.");
    setSaving(true);
    setEditError("");
    try {
      await updateUser({ name: editName.trim(), phone: editPhone.trim() });
      setEditVisible(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      setEditError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again
    if (!file || !user) return;

    setAvatarError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      return setAvatarError("Please choose a JPG, PNG or WebP image.");
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return setAvatarError(`That image is too large. Please choose one under ${MAX_FILE_MB} MB.`);
    }

    setUploading(true);
    setProgress(0);
    try {
      const blob = await resizeToSquareJpeg(file);
      const url = await uploadAvatar(blob, user.uid, setProgress);
      await updateUser({ avatar: url }); // same field mobile reads
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setAvatarError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const avatarStyle = { background: `hsl(${user.hue ?? 232} 60% 45%)` };

  const menuSections = [
    {
      title: t.account,
      items: [
        { id: "notifications", Icon: BellIcon, label: t.notifications, badge: unreadCount, onPress: () => router.push("/notifications") },
        { id: "edit", Icon: UserCircleIcon, label: t.editProfile, onPress: () => router.push("/edit-profile") },
        { id: "wallet", Icon: WalletIcon, label: t.myWallet, onPress: () => router.push("/wallet") },
        { id: "addresses", Icon: MapPinIcon, label: t.manageAddresses, onPress: () => router.push("/addresses") },
        { id: "orders", Icon: ReceiptIcon, label: t.myOrders, onPress: () => router.push("/orders") },
        { id: "wishlist", Icon: HeartIcon, label: t.myWishlist, onPress: () => router.push("/saved") },
      ],
    },
    {
      title: "Preferences",
      items: [
        { id: "settings", Icon: SettingsIcon, label: t.settings, onPress: () => router.push("/settings") },
      ],
    },
    {
      title: "Support",
      items: [
        { id: "help", Icon: HeadsetIcon, label: t.customerService, onPress: () => router.push("/customer-service") },
        { id: "about", Icon: InfoIcon, label: t.about, onPress: () => alert("Liduka Marketplace · v1.0 (Demo)") },
      ],
    },
  ];

  return (
    <div className="container-page max-w-2xl py-6">
      {/* Header */}
      <div className="flex flex-col items-center py-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarFile}
        />

        <div className="relative mb-4">
          <button
            onClick={() => setZoomVisible(true)}
            disabled={uploading}
            className="grid h-28 w-28 place-items-center overflow-hidden rounded-full text-4xl font-extrabold text-white shadow-card transition hover:opacity-90 active:scale-95"
            style={avatarStyle}
            aria-label="View profile picture"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </button>

          {uploading && (
            <div className="absolute inset-0 grid place-items-center rounded-full bg-black/55 text-sm font-bold text-white">
              {Math.round(progress * 100)}%
            </div>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow transition hover:bg-brand-700 disabled:opacity-60"
            aria-label="Change profile picture"
          >
            <CameraBadge />
          </button>
        </div>

        <h1 className="text-2xl font-extrabold text-ink-900">{user.name}</h1>
        <p className="text-sm text-ink-500">{user.email}</p>
        <div className="mt-3 flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-[11px] font-semibold text-ink-600">
          <CalendarIcon size={12} /> {t.memberSince} {user.joined || "Today"}
        </div>

        {avatarError && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600">
            {avatarError}
          </p>
        )}
      </div>

      {/* Wallet card */}
      <button
        onClick={() => router.push("/wallet")}
        className="relative mb-8 w-full overflow-hidden rounded-3xl bg-brand-600 p-5 text-left text-white shadow-card transition hover:bg-brand-700"
      >
        <div className="relative z-10">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-100">
            <WalletIcon size={16} /> Wallet Balance
          </p>
          <p className="text-3xl font-extrabold tracking-tight">
            {walletReady ? formatPrice(balance, "GHS") : "---"}
          </p>
          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-200">
            Tap to view details <ChevronRightIcon size={14} />
          </p>
        </div>
        <div className="absolute -right-8 -top-8 text-brand-500/30">
          <WalletIcon size={140} strokeWidth={1} />
        </div>
      </button>

      {/* Menu */}
      {menuSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="mb-2 ml-2 text-xs font-bold uppercase tracking-wider text-ink-400">
            {section.title}
          </h2>
          <div className="card overflow-hidden border border-ink-100">
            {section.items.map((item, idx) => (
              <button
                key={item.id}
                onClick={item.onPress}
                className={`flex w-full items-center justify-between p-4 text-left transition hover:bg-ink-50 ${idx !== section.items.length - 1 ? "border-b border-ink-50" : ""
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                    <item.Icon size={18} />
                  </span>
                  <span className="text-sm font-semibold text-ink-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge > 0 && (
                    <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                  <ChevronRightIcon size={18} className="text-ink-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white p-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
      >
        <LogOutIcon size={18} /> {loggingOut ? "Logging out..." : t.logout}
      </button>

      {/* Full-size picture */}
      {zoomVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setZoomVisible(false)}
        >
          <button className="absolute right-6 top-6 text-white hover:opacity-80" aria-label="Close">
            <XIcon size={32} />
          </button>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="max-h-[80vh] max-w-full rounded-3xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="grid h-64 w-64 place-items-center rounded-full text-8xl font-extrabold text-white shadow-2xl"
              style={avatarStyle}
            >
              {user.name.charAt(0)}
            </div>
          )}
        </div>
      )}

      {/* Edit profile */}
      {editVisible && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setEditVisible(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-extrabold text-ink-900">{t.editProfile}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink-600">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-ink-600">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="input"
                  placeholder="Your phone number"
                />
              </div>
              {editError && <p className="text-xs font-semibold text-rose-500">{editError}</p>}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setEditVisible(false)} className="btn-outline flex-1 py-3">
                {t.cancel}
              </button>
              <button onClick={saveProfile} disabled={saving} className="btn-primary flex-1 py-3">
                {saving ? "Saving..." : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}