import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app: App | null = null;
let db: Firestore | null = null;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64)
  );
}

/** Normalise the private key no matter how it was pasted into the environment:
 *  - strips surrounding single/double quotes (Vercel/paste artefact)
 *  - converts literal \n (and \r\n) escape sequences into real newlines
 *  - leaves an already-multiline key untouched
 * A malformed key is the #1 cause of "Failed to parse private key" 500s. */
function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  return key;
}

/** Resolve the private key, preferring a base64-encoded var if present.
 * Dashboards (Vercel, etc.) mangle the newlines in a raw PEM key — the single
 * most common cause of a "Failed to parse private key" 500. Base64 has no
 * newlines to mangle, so FIREBASE_ADMIN_PRIVATE_KEY_BASE64 is the bulletproof
 * way to supply it: `base64 -w0 service-account-key.pem` and paste the result. */
function resolvePrivateKey(): string | undefined {
  const b64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64;
  if (b64 && b64.trim()) {
    return normalizePrivateKey(Buffer.from(b64.trim(), "base64").toString("utf8"));
  }
  return normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
}

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0];
    return app;
  }
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: resolvePrivateKey(),
    }),
  });
  return app;
}

/** Server-only, trusted Firestore access that bypasses security rules - use sparingly, only where a write must be independently verified server-side (e.g. confirming a Paystack payment) rather than trusted from the client.
 *
 * Memoised, and configured with `preferRest` so it uses HTTP/1.1 REST instead of
 * gRPC. In a serverless function (Vercel) a fresh gRPC channel can take many
 * seconds to establish on a cold start — enough to blow past the platform's
 * execution-time limit and make the whole function return a non-JSON 500. REST
 * has no channel warm-up, so cold reads/writes return in well under a second. */
export function getAdminDb(): Firestore {
  if (db) return db;
  db = getFirestore(getAdminApp());
  try {
    db.settings({ preferRest: true });
  } catch {
    // settings() throws if called twice; safe to ignore on a reused instance.
  }
  return db;
}

/** Verify a Firebase ID token sent from the client (Authorization: Bearer ...).
 * Returns the uid, or null if missing/invalid — used where a route moves real
 * money and must know exactly who is calling. */
export async function verifyIdToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}
