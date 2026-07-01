"use client";

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseStorage, isFirebaseConfigured } from "./firebase";

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/** Upload a File to Firebase Storage under `path` and return the public download URL.
 *  Times out after 30s so the UI never hangs indefinitely. */
export async function uploadFile(file: File, path: string): Promise<UploadResult> {
  if (!isFirebaseConfigured()) return { ok: false, error: "Storage not configured. Check Firebase settings." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "File too large — max 10 MB per image." };

  const timeout = new Promise<UploadResult>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 30_000)
  );

  try {
    const upload = (async () => {
      const storageRef = ref(getFirebaseStorage(), path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { ok: true as const, url };
    })();
    return await Promise.race([upload, timeout]);
  } catch (e) {
    const msg = (e as Error).message === "timeout"
      ? "Upload timed out — check your connection and Firebase Storage rules."
      : "Upload failed. Make sure Firebase Storage is enabled in the Firebase console.";
    console.error("[storage] upload failed:", e);
    return { ok: false, error: msg };
  }
}

/** Upload multiple image files and return an array of download URLs. */
export async function uploadImages(files: File[], basePath: string): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const ext = files[i].name.split(".").pop() ?? "jpg";
    const result = await uploadFile(files[i], `${basePath}/${Date.now()}-${i}.${ext}`);
    if (result.ok) results.push(result.url);
  }
  return results;
}

export async function deleteFile(url: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const storageRef = ref(getFirebaseStorage(), url);
    await deleteObject(storageRef);
  } catch { /* file may already be gone */ }
}
