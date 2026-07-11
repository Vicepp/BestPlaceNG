"use client";

import { useEffect, useState } from "react";
import { User, ShieldCheck, Camera, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setFirestoreDoc } from "@/lib/firestoreWrite";
import { getFirestoreDoc } from "@/lib/firestoreData";
import { uploadFile, uploadDocument } from "@/lib/storage";

/** Private KYC record — stored in kyc/{uid} (owner-only reads under the rules),
 * NEVER on the publicly-readable users doc. */
interface KycRecord {
  firstName?: string;
  lastName?: string;
  nin?: string;
  selfieUrl?: string;
  documentUrl?: string;
  status?: "incomplete" | "submitted";
  submittedAt?: string;
}

const STEPS = [
  { key: "name", label: "Your Name", icon: User },
  { key: "nin", label: "National ID", icon: ShieldCheck },
  { key: "selfie", label: "Selfie", icon: Camera },
  { key: "documents", label: "Documents", icon: FileText },
] as const;

export default function KycTab() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KycRecord>({});
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nin, setNin] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getFirestoreDoc<KycRecord>("kyc", user.uid).then((doc) => {
      const k = doc ?? {};
      setKyc(k);
      setFirstName(k.firstName ?? "");
      setLastName(k.lastName ?? "");
      setNin(k.nin ?? "");
      // Resume at the first incomplete step
      if (!k.firstName || !k.lastName) setStep(0);
      else if (!k.nin) setStep(1);
      else if (!k.selfieUrl) setStep(2);
      else setStep(3);
      setLoading(false);
    });
  }, [user]);

  async function savePartial(patch: Partial<KycRecord>, nextStep: number) {
    if (!user) return;
    setSaving(true);
    setError("");
    const merged = { ...kyc, ...patch, status: (patch.status ?? "incomplete") as KycRecord["status"] };
    const res = await setFirestoreDoc("kyc", user.uid, merged);
    setSaving(false);
    if (!res.ok) { setError(res.error ?? "Couldn't save — try again."); return; }
    setKyc(merged);
    setStep(nextStep);
    if (patch.status === "submitted") {
      // Public flag only (no sensitive data) so the rest of the app can show a "verified pending" badge.
      setFirestoreDoc("users", user.uid, { kycStatus: "submitted" }).catch(() => {});
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, kind: "selfie" | "document") {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError("");
    const res = kind === "selfie" ? await uploadFile(file, `kyc/${user.uid}`) : await uploadDocument(file);
    setUploading(false);
    if (!res.ok) { setError(res.error); return; }
    if (kind === "selfie") await savePartial({ selfieUrl: res.url }, 3);
    else await savePartial({ documentUrl: res.url, status: "submitted", submittedAt: new Date().toISOString() }, 3);
  }

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;

  const submitted = kyc.status === "submitted";

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {submitted ? (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span><strong>KYC submitted.</strong> Your identity details are under review — we&apos;ll notify you when verification completes.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span><strong className="text-red-600">KYC Not Completed.</strong> Please complete the steps below to verify your identity.</span>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step || submitted;
          const active = i === step && !submitted;
          return (
            <div key={s.key} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <div className="flex flex-col items-center">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                  done ? "border-brand bg-brand text-white" : active ? "border-brand bg-white text-brand" : "border-zinc-200 bg-white text-zinc-300"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className={`mt-1.5 whitespace-nowrap text-[11px] font-semibold ${done || active ? "text-foreground" : "text-zinc-300"}`}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && <div className={`mx-2 mb-5 h-0.5 flex-1 ${i < step || submitted ? "bg-brand" : "bg-zinc-200"}`} />}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          {step === 0 && (
            <>
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Check that the first and last names match exactly as they appear on your <strong>government-issued NIN document</strong>. Using a nickname or alias may cause your verification to fail.
              </div>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">First Name (as on government ID)</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="mb-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              <label className="mb-1 block text-xs font-semibold text-zinc-500">Last Name (as on government ID)</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              <button
                onClick={() => {
                  if (!firstName.trim() || !lastName.trim()) { setError("Enter your first and last name exactly as on your NIN."); return; }
                  savePartial({ firstName: firstName.trim(), lastName: lastName.trim() }, 1);
                }}
                disabled={saving}
                className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
                {saving ? "Saving…" : "Continue"}
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">National Identification Number (NIN)</label>
              <input value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))} inputMode="numeric" placeholder="11-digit NIN"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm tracking-widest outline-none focus:border-brand" />
              <p className="mt-1 text-[11px] text-zinc-400">Stored privately — only you (and verification staff) can access it. Never shown on your public profile.</p>
              <button
                onClick={() => {
                  if (nin.length !== 11) { setError("Your NIN must be exactly 11 digits."); return; }
                  savePartial({ nin }, 2);
                }}
                disabled={saving}
                className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
                {saving ? "Saving…" : "Continue"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="mb-3 text-sm text-zinc-600">Upload a clear selfie — face the camera, good lighting, no sunglasses or caps.</p>
              <label className="relative block cursor-pointer overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50 hover:border-brand">
                {kyc.selfieUrl ? (
                  <img src={kyc.selfieUrl} alt="selfie" className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center text-zinc-400">
                    <Camera className="mb-1 h-7 w-7" />
                    <span className="text-xs">Click to take/upload a selfie</span>
                  </div>
                )}
                {uploading && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">Uploading…</span>}
                <input type="file" accept="image/*" capture="user" onChange={(e) => handleUpload(e, "selfie")} className="hidden" />
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <p className="mb-3 text-sm text-zinc-600">Finally, upload a photo or PDF of your NIN slip / national ID card.</p>
              <label className="relative block cursor-pointer rounded-xl border border-dashed border-zinc-200 bg-zinc-50 hover:border-brand">
                <div className="flex h-32 flex-col items-center justify-center text-zinc-400">
                  <FileText className="mb-1 h-7 w-7" />
                  <span className="text-xs">{kyc.documentUrl ? "Document uploaded — click to replace" : "Click to upload your ID document"}</span>
                </div>
                {uploading && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">Uploading…</span>}
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleUpload(e, "document")} className="hidden" />
              </label>
              <p className="mt-2 text-[11px] text-zinc-400">Submitting the document completes your KYC and sends it for review.</p>
            </>
          )}

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
