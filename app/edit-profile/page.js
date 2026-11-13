"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import {
  changePassword,
  changeEmail,
  requestAccountDeletion,
  securityError,
  hasPasswordLogin,
} from "@/lib/security";
import { normalizePhone, isValidPhone } from "@/utils/phone";
import {
  ChevronLeftIcon, ChevronRightIcon, LockIcon, MailIcon, TrashIcon, XIcon,
} from "@/components/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Notice({ notice }) {
  if (!notice) return null;
  const style =
    notice.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-600";
  return (
    <p role="alert" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${style}`}>
      {notice.text}
    </p>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-500 hover:bg-ink-100"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, autoComplete, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-ink-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

function PasswordForm({ onClose, t }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!current) return setNotice({ type: "error", text: "Enter your current password." });
    if (next.length < 6) return setNotice({ type: "error", text: "Password must be at least 6 characters." });
    if (next !== confirm) return setNotice({ type: "error", text: "New passwords do not match." });
    if (next === current) return setNotice({ type: "error", text: "Choose a password you haven't used here before." });

    setBusy(true);
    try {
      await changePassword(current, next);
      setDone(true);
      setNotice({ type: "success", text: "Password updated successfully." });
    } catch (err) {
      console.error("Change password failed:", err);
      setNotice({ type: "error", text: securityError(err) });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4">
        <Notice notice={notice} />
        <button onClick={onClose} className="btn-primary w-full py-3">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t.currentPassword} type="password" value={current} onChange={setCurrent} autoComplete="current-password" />
      <Field label={t.newPassword} type="password" value={next} onChange={setNext} autoComplete="new-password" />
      <Field label={t.confirmPassword} type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <Notice notice={notice} />
      <div className="flex gap-3">
        <button type="button" onClick={onClose} disabled={busy} className="btn-outline flex-1 py-3">{t.cancel}</button>
        <button type="submit" disabled={busy} className="btn-primary flex-1 py-3">
          {busy ? "Updating..." : t.updatePassword}
        </button>
      </div>
    </form>
  );
}

function EmailForm({ onClose, currentEmail, t }) {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!EMAIL_RE.test(email.trim())) return setNotice({ type: "error", text: "Please enter a valid email address." });
    if (email.trim().toLowerCase() === (currentEmail || "").toLowerCase()) {
      return setNotice({ type: "error", text: "That is already your email address." });
    }
    if (!password) return setNotice({ type: "error", text: "Enter your current password." });

    setBusy(true);
    try {
      await changeEmail(password, email);
      setDone(true);
    } catch (err) {
      console.error("Change email failed:", err);
      setNotice({ type: "error", text: securityError(err) });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          A verification link has been sent to {email.trim()}. Open it to complete the change. Until then you
          keep signing in with your current email, and after the change you'll sign in again with the new one.
        </p>
        <button onClick={onClose} className="btn-primary w-full py-3">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
        Current email: <span className="font-bold text-ink-900">{currentEmail}</span>
        <br />A verification link will be sent to your new email address.
      </p>
      <Field label={t.currentPassword} type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <Field label="New email address" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
      <Notice notice={notice} />
      <div className="flex gap-3">
        <button type="button" onClick={onClose} disabled={busy} className="btn-outline flex-1 py-3">{t.cancel}</button>
        <button type="submit" disabled={busy} className="btn-primary flex-1 py-3">
          {busy ? "Sending..." : t.updateEmail}
        </button>
      </div>
    </form>
  );
}

function DeleteForm({ onClose, t }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!password) return setNotice({ type: "error", text: "Please confirm your password." });

    setBusy(true);
    try {
      await requestAccountDeletion(password);
      setDone(true);
    } catch (err) {
      console.error("Deletion request failed:", err);
      setNotice({ type: "error", text: securityError(err) });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Your account deletion request has been sent for admin review.
        </p>
        <button onClick={onClose} className="btn-primary w-full py-3">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl border border-ink-100 bg-ink-50 p-4 text-sm text-ink-600">
        <p className="mb-2 font-bold text-ink-900">Before requesting deletion:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your wallet balance must be ₵0.00</li>
          <li>You must have no pending or active orders</li>
          <li>Confirm your password to verify it's you</li>
        </ul>
      </div>
      <p className="text-sm text-ink-600">
        This is <span className="font-bold">permanent and irreversible</span> once an admin approves it.
      </p>
      <Field label="Confirm Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <Notice notice={notice} />
      <div className="flex gap-3">
        <button type="button" onClick={onClose} disabled={busy} className="btn-outline flex-1 py-3">{t.cancel}</button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {busy ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { t } = useSettings();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [modal, setModal] = useState(null); // "password" | "email" | "delete"

  if (!user) return null;

  const canChangeCredentials = hasPasswordLogin();

  const handleSave = async (e) => {
    e.preventDefault();
    setNotice(null);

    const name = fullName.trim();
    if (!name) return setNotice({ type: "error", text: "Full name cannot be empty." });

    const normalized = normalizePhone(phone);
    if (normalized && !isValidPhone(normalized)) {
      return setNotice({ type: "error", text: "Please enter a valid phone number." });
    }

    setSaving(true);
    try {
      await updateUser({ name, phone: normalized });
      setFullName(name);
      setPhone(normalized);
      setNotice({ type: "success", text: t.profileUpdated || "Profile updated successfully!" });
    } catch (err) {
      console.error("Profile update failed:", err);
      setNotice({ type: "error", text: "Could not save your profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => setModal(null);

  const row = (Icon, title, subtitle, onClick) => (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-ink-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900">{title}</p>
          <p className="truncate text-xs text-ink-500">{subtitle}</p>
        </div>
      </div>
      <ChevronRightIcon size={18} className="shrink-0 text-ink-300" />
    </button>
  );

  return (
    <div className="container-page max-w-2xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100"
          aria-label="Back"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-ink-900">{t.editProfile}</h1>
        <div className="w-9" />
      </div>

      {/* Personal details */}
      <form onSubmit={handleSave} className="card space-y-4 p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink-400">
          {t.personalDetails}
        </h2>

        <Field label={t.fullName} value={fullName} onChange={setFullName} autoComplete="name" />

        <div>
          <label className="mb-1 block text-xs font-bold text-ink-600">{t.phone}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0241234567 or +233241234567"
            autoComplete="tel"
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink-600">{t.email}</label>
          <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">{user.email}</p>
        </div>

        <p className="text-xs italic text-ink-400">
          Your name will be visible to vendors and delivery personnel.
        </p>

        <Notice notice={notice} />

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? "Saving..." : t.saveChanges}
        </button>
      </form>

      {/* Security */}
      <div className="card overflow-hidden">
        <h2 className="border-b border-ink-50 px-5 pb-3 pt-5 text-sm font-extrabold uppercase tracking-wider text-ink-400">
          {t.securitySettings}
        </h2>
        {canChangeCredentials ? (
          <>
            {row(LockIcon, t.changePassword, "Update your password regularly", () => setModal("password"))}
            <div className="border-t border-ink-50" />
            {row(MailIcon, t.changeEmail, `Current: ${user.email}`, () => setModal("email"))}
          </>
        ) : (
          <p className="p-5 text-sm text-ink-500">
            Your account signs in through another provider, so your password and email are managed there.
          </p>
        )}
      </div>

      {/* Danger zone */}
      <div className="card overflow-hidden border border-rose-100">
        <h2 className="border-b border-rose-50 px-5 pb-3 pt-5 text-sm font-extrabold uppercase tracking-wider text-rose-400">
          {t.dangerZone}
        </h2>
        {canChangeCredentials ? (
          <button
            onClick={() => setModal("delete")}
            className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-rose-50"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-500">
              <TrashIcon size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-rose-600">Request Account Deletion</p>
              <p className="text-xs text-ink-500">An admin reviews every request</p>
            </div>
          </button>
        ) : (
          <p className="p-5 text-sm text-ink-500">Contact support to delete this account.</p>
        )}
      </div>

      {modal === "password" && (
        <Modal title={t.changePassword} onClose={closeModal}>
          <PasswordForm onClose={closeModal} t={t} />
        </Modal>
      )}
      {modal === "email" && (
        <Modal title={t.changeEmail} onClose={closeModal}>
          <EmailForm onClose={closeModal} currentEmail={user.email} t={t} />
        </Modal>
      )}
      {modal === "delete" && (
        <Modal title="Confirm Deletion Request" onClose={closeModal}>
          <DeleteForm onClose={closeModal} t={t} />
        </Modal>
      )}
    </div>
  );
}