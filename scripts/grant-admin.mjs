/**
 * Grant MASTER admin to an existing account:
 *   node scripts/grant-admin.mjs you@email.com
 * Master admins see every section of /admin and can invite/manage sub-admins.
 */
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

process.loadEnvFile(".env.local");
function norm(r) { if (!r) return r; let k = r.trim(); if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1); return k.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n"); }
function key() { const b = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64; if (b && b.trim()) return norm(Buffer.from(b.trim(), "base64").toString("utf8")); return norm(process.env.FIREBASE_ADMIN_PRIVATE_KEY); }
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: key() }) });

const email = process.argv[2];
if (!email) { console.error("Usage: node scripts/grant-admin.mjs <account-email>"); process.exit(1); }

try {
  const user = await getAuth(app).getUserByEmail(email);
  await getFirestore(app).collection("admins").doc(user.uid).set({
    role: "master",
    permissions: ["*"],
    email,
    createdAt: new Date().toISOString(),
    grantedBy: "grant-admin script",
  });
  console.log(`MASTER admin granted to ${email} (uid ${user.uid}).`);
  console.log("Open /admin while logged in as that account.");
} catch (e) {
  console.error("Failed:", e.message, "\n(The account must already exist — sign up on the site first.)");
  process.exit(1);
}
process.exit(0);
