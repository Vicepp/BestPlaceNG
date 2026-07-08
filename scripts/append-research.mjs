/**
 * Append-only research snapshot writer.
 *
 *   node scripts/append-research.mjs city  <city-slug>  <snapshot.json>
 *   node scripts/append-research.mjs state <state-slug> <snapshot.json>
 *
 * Creates a NEW doc cityResearch/<slug>__<timestamp> (or stateResearch/…).
 * By design it can NEVER overwrite: the doc id embeds the current timestamp
 * and the write uses create() (fails if the id somehow exists). Old snapshots
 * are never touched — the full history stays in the database.
 */
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

process.loadEnvFile(".env.local");
function norm(r) { if (!r) return r; let k = r.trim(); if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1); return k.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n"); }
function key() { const b = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64; if (b && b.trim()) return norm(Buffer.from(b.trim(), "base64").toString("utf8")); return norm(process.env.FIREBASE_ADMIN_PRIVATE_KEY); }

const [, , kind, slug, file] = process.argv;
if (!["city", "state"].includes(kind) || !slug || !file) {
  console.error("Usage: node scripts/append-research.mjs city|state <slug> <snapshot.json>");
  process.exit(1);
}

let snapshot;
try {
  snapshot = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error("Could not read/parse snapshot JSON:", e.message);
  process.exit(1);
}
if (!snapshot.headline || !Array.isArray(snapshot.sources) || snapshot.sources.length === 0) {
  console.error("Snapshot needs at least: headline (string) and sources (non-empty array). Refusing unsourced data.");
  process.exit(1);
}

const app = getApps().length ? getApps()[0] : initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: key(),
  }),
});
const db = getFirestore(app);

const now = new Date();
const id = `${slug}__${now.getTime()}`;
const col = kind === "city" ? "cityResearch" : "stateResearch";

const doc = {
  slug,
  kind,
  ...snapshot,
  asOf: snapshot.asOf ?? now.toISOString().slice(0, 7),
  createdAt: now.toISOString(),
};

// create() (not set) — throws ALREADY_EXISTS instead of overwriting, ever.
await db.collection(col).doc(id).create(doc);

const history = await db.collection(col).where("slug", "==", slug).get();
console.log(`APPENDED ${col}/${id}`);
console.log(`headline: ${snapshot.headline}`);
console.log(`history for ${slug}: ${history.size} snapshot(s) — nothing overwritten.`);
process.exit(0);
