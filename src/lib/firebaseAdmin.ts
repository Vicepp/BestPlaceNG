import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app: App | null = null;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
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
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  return app;
}

/** Server-only, trusted Firestore access that bypasses security rules - use sparingly, only where a write must be independently verified server-side (e.g. confirming a Paystack payment) rather than trusted from the client. */
export function getAdminDb() {
  return getFirestore(getAdminApp());
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
