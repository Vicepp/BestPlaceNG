"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

function PasswordField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-500">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 pr-10 text-sm outline-none focus:border-brand"
        />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function PasswordTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 6) { setMsg({ ok: false, text: "New password must be at least 6 characters." }); return; }
    if (next !== confirm) { setMsg({ ok: false, text: "New passwords don't match." }); return; }
    const authUser = getFirebaseAuth().currentUser;
    if (!authUser?.email) { setMsg({ ok: false, text: "You need to be logged in." }); return; }

    setBusy(true);
    try {
      // Re-authenticate first — Firebase requires a recent login to change passwords.
      const credential = EmailAuthProvider.credential(authUser.email, current);
      await reauthenticateWithCredential(authUser, credential);
      await updatePassword(authUser, next);
      setMsg({ ok: true, text: "Password updated successfully." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setMsg({
        ok: false,
        text:
          code === "auth/invalid-credential" || code === "auth/wrong-password"
            ? "Your current password is incorrect."
            : code === "auth/too-many-requests"
            ? "Too many attempts — wait a moment and try again."
            : "Couldn't update the password. Please try again.",
      });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-foreground">Security</h2>
        <p className="text-sm text-zinc-400">Update your password to keep your account secure.</p>
      </div>
      <PasswordField label="Current Password" value={current} onChange={setCurrent} />
      <PasswordField label="New Password" value={next} onChange={setNext} />
      <PasswordField label="Confirm New Password" value={confirm} onChange={setConfirm} />
      {msg && <p className={`text-xs font-semibold ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}
      <button type="submit" disabled={busy || !current || !next || !confirm}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {busy ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
