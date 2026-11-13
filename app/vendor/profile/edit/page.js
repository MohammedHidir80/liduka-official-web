"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { changePassword, changeEmail, hasPasswordLogin } from "@/lib/security";
import { regionOptions } from "@/utils/addresses";
import { normRegion } from "@/utils/location";
import { normalizePhone, isValidPhone } from "@/utils/phone";
import { getAuthError } from "@/lib/auth";
import { 
  ChevronLeftIcon, UserCircleIcon, MapPinIcon, PhoneIcon,
  LockIcon, MailIcon, CheckCircleIcon, AlertTriangleIcon, InfoIcon 
} from "@/components/icons";

const Msg = ({ m }) => 
  m ? (
    <div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${m.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {m.ok ? <CheckCircleIcon size={16} /> : <AlertTriangleIcon size={16} />}
      <span>{m.text}</span>
    </div>
  ) : null;

export default function VendorEditProfilePage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [secBusy, setSecBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [emailMsg, setEmailMsg] = useState(null);
  const canSecure = hasPasswordLogin();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((s) => {
      const d = s.data() || {};
      const region = normRegion(d.region || "");
      setForm({
        fullName: d.fullName || "",
        phone: d.phone || "",
        region: regionOptions.some((r) => r.key === region) ? region : "",
        city: d.city || "",
        address: d.address || "",
      });
    });
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.fullName.trim()) return setMsg({ text: "Name is required." });
    const phone = form.phone ? normalizePhone(form.phone) : "";
    if (phone && !isValidPhone(phone)) return setMsg({ text: "Enter a valid phone number." });
    setSaving(true);
    try {
      const regionName = regionOptions.find((r) => r.key === form.region)?.name || "";
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: form.fullName.trim(),
        phone,
        city: form.city.trim(),
        region: form.region,
        ...(regionName ? { regionLabel: regionName } : {}),
        address: form.address.trim(),
      });
      setMsg({ ok: true, text: "Profile updated successfully." });
    } catch (err) {
      setMsg({ text: err.message || "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  const doPassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) return setPwMsg({ text: "Password must be at least 6 characters." });
    if (newPw !== confPw) return setPwMsg({ text: "Passwords do not match." });
    setSecBusy(true);
    try {
      await changePassword(curPw, newPw);
      setPwMsg({ ok: true, text: "Password updated successfully." });
      setCurPw(""); setNewPw(""); setConfPw("");
    } catch (err) { 
      setPwMsg({ text: getAuthError?.(err) || err.message }); 
    } finally { 
      setSecBusy(false); 
    }
  };

  const doEmail = async (e) => {
    e.preventDefault();
    setEmailMsg(null);
    if (!newEmail.includes("@")) return setEmailMsg({ text: "Enter a valid email." });
    setSecBusy(true);
    try {
      await changeEmail(curPw, newEmail);
      setEmailMsg({ ok: true, text: `Verification link sent to ${newEmail}. The change applies once you open it.` });
      setNewEmail("");
    } catch (err) { 
      setEmailMsg({ text: getAuthError?.(err) || err.message }); 
    } finally { 
      setSecBusy(false); 
    }
  };

  if (!form) {
    return (
      <div className="container-page py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl space-y-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/vendor/profile" className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100 transition">
          <ChevronLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-extrabold text-ink-900">Edit Profile & Security</h1>
      </div>

      {/* Personal Details Form */}
      <form onSubmit={save} className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-ink-900 border-b border-ink-100 pb-3">Personal Details</h2>
        
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-600">Business / Full Name</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><UserCircleIcon size={18} /></span>
            <input className="input pl-10" placeholder="Enter your business name" value={form.fullName} onChange={set("fullName")} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-600">Phone Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><PhoneIcon size={18} /></span>
            <input className="input pl-10" placeholder="e.g. 0241234567" value={form.phone} onChange={set("phone")} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-600">Region</label>
            <select className="input" value={form.region} onChange={set("region")}>
              <option value="">Select region</option>
              {regionOptions.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-600">City</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><MapPinIcon size={18} /></span>
              <input className="input pl-10" placeholder="City" value={form.city} onChange={set("city")} />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-600">Shop Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><MapPinIcon size={18} /></span>
            <input className="input pl-10" placeholder="Enter full shop address" value={form.address} onChange={set("address")} />
          </div>
        </div>

        <Msg m={msg} />
        
        <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Security Section */}
      <section className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-ink-900 border-b border-ink-100 pb-3">Security</h2>
        
        {!canSecure ? (
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-blue-700">
            <InfoIcon size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">You signed in with a social account. There is no password to change here.</p>
          </div>
        ) : (
          <>
            {/* Current Password (Shared) */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-600">Current Password (Required for changes)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><LockIcon size={18} /></span>
                <input 
                  className="input pl-10" 
                  type="password" 
                  placeholder="Enter your current password" 
                  value={curPw} 
                  onChange={(e) => setCurPw(e.target.value)} 
                  autoComplete="current-password" 
                />
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={doPassword} className="space-y-4 border-t border-ink-100 pt-5">
              <h3 className="text-sm font-bold text-ink-900">Change Password</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-600">New Password</label>
                  <input className="input" type="password" placeholder="Min 6 characters" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-600">Confirm New Password</label>
                  <input className="input" type="password" placeholder="Confirm new password" value={confPw} onChange={(e) => setConfPw(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
              
              <Msg m={pwMsg} />
              <button className="btn-outline w-full py-2.5" disabled={secBusy || !curPw || !newPw || !confPw}>
                {secBusy ? "Updating..." : "Update Password"}
              </button>
            </form>

            {/* Change Email Form */}
            <form onSubmit={doEmail} className="space-y-4 border-t border-ink-100 pt-5">
              <h3 className="text-sm font-bold text-ink-900">Change Email</h3>
              
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink-600">New Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"><MailIcon size={18} /></span>
                  <input className="input pl-10" type="email" placeholder="new@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
              </div>
              
              <Msg m={emailMsg} />
              <button className="btn-outline w-full py-2.5" disabled={secBusy || !curPw || !newEmail}>
                {secBusy ? "Updating..." : "Update Email"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}