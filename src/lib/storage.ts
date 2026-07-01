/**
 * Image upload via Cloudinary (unsigned upload preset).
 * No Firebase Storage, no API secret needed — the cloud_name and upload_preset
 * are public-safe and stored as NEXT_PUBLIC_ env vars.
 *
 * Cloudinary free tier: 25 GB storage + 25 GB bandwidth/month.
 */

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );
}

/**
 * Upload a single file to Cloudinary and return the permanent CDN URL.
 * The `_path` param is accepted for API compatibility with existing callers
 * but isn't used — Cloudinary auto-assigns a public_id.
 */
export async function uploadFile(file: File, _path?: string): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    return { ok: false, error: "Image upload not configured — check NEXT_PUBLIC_CLOUDINARY_* env vars." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "File too large — max 10 MB per image." };
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("folder", "bestplaceng");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, { method: "POST", body: form, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return { ok: false, error: err?.error?.message ?? `Upload failed (HTTP ${res.status}).` };
    }

    const data = await res.json() as { secure_url: string };
    return { ok: true, url: data.secure_url };
  } catch (e) {
    clearTimeout(timeout);
    if ((e as Error).name === "AbortError") {
      return { ok: false, error: "Upload timed out — check your internet connection and try again." };
    }
    console.error("[cloudinary] upload failed:", e);
    return { ok: false, error: "Upload failed. Please try again." };
  }
}

/** Upload multiple image files in sequence and return the array of CDN URLs. */
export async function uploadImages(files: File[], _basePath?: string): Promise<string[]> {
  const results: string[] = [];
  for (const file of files) {
    const result = await uploadFile(file);
    if (result.ok) results.push(result.url);
  }
  return results;
}

/**
 * Cloudinary deletion from the browser requires a signed request (API secret).
 * For safety, browser-side deletion is intentionally not supported — delete
 * images from the Cloudinary dashboard if needed.
 */
export async function deleteFile(_url: string): Promise<void> {
  // no-op: deletion requires the API secret which must never be in browser code.
}
