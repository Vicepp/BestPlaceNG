"use client";

import { useRef, useState } from "react";
import { ImageIcon, X, Upload, Loader2 } from "lucide-react";
import { uploadImages } from "@/lib/storage";

interface Props {
  existingUrls?: string[];
  onChange: (urls: string[]) => void;
  storagePath: string;
  maxImages?: number;
  label?: string;
}

export default function ImageUploader({
  existingUrls = [],
  onChange,
  storagePath,
  maxImages = 8,
  label = "Property photos",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = maxImages - existingUrls.length;
    if (remaining <= 0) {
      setError(`Max ${maxImages} images allowed.`);
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    setError("");
    const newUrls = await uploadImages(toUpload, storagePath);
    if (newUrls.length === 0) setError("Upload failed. Check file size (max 10 MB each).");
    onChange([...existingUrls, ...newUrls]);
    setUploading(false);
    e.target.value = "";
  }

  function remove(url: string) {
    onChange(existingUrls.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500">{label} ({existingUrls.length}/{maxImages})</p>

      {/* Thumbnail grid */}
      {existingUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {existingUrls.map((url) => (
            <div key={url} className="group relative aspect-square">
              <img src={url} alt="" className="h-full w-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {existingUrls.length < maxImages && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-4 text-sm font-medium text-zinc-500 transition hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Add photos</>
            )}
          </button>
        </>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          <p className="font-semibold">Upload failed</p>
          <p className="mt-0.5">{error}</p>
          <p className="mt-1 text-red-500">
            Make sure Firebase Storage is enabled in your Firebase console (Build → Storage → Get Started) and that your Storage rules allow writes. You can also skip photos and add them later.
          </p>
        </div>
      )}
    </div>
  );
}
