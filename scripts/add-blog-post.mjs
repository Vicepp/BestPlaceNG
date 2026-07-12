/**
 * Publish ONE new Learn post from a JSON file (used by the /write-trending-blog
 * skill). Refuses to overwrite an existing slug — new topics get new slugs.
 *   node scripts/add-blog-post.mjs <post.json>
 */
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

process.loadEnvFile(".env.local");
function norm(r) { if (!r) return r; let k = r.trim(); if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1); return k.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n"); }
function key() { const b = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64; if (b?.trim()) return norm(Buffer.from(b.trim(), "base64").toString("utf8")); return norm(process.env.FIREBASE_ADMIN_PRIVATE_KEY); }
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: key() }) });
const db = getFirestore(app);

const file = process.argv[2];
if (!file) { console.error("Usage: node scripts/add-blog-post.mjs <post.json>"); process.exit(1); }
const post = JSON.parse(readFileSync(file, "utf8"));

const required = ["slug", "title", "excerpt", "category", "kind", "tags", "metaDescription", "sections", "takeaways", "ctaMid", "ctaEnd"];
const missing = required.filter((k) => post[k] === undefined || (Array.isArray(post[k]) && post[k].length === 0));
if (missing.length) { console.error("Post is missing:", missing.join(", ")); process.exit(1); }
if (post.title.length < 30 || post.title.length > 70) console.warn(`⚠ Title is ${post.title.length} chars — aim for 40–60.`);
if (post.metaDescription.length > 165) console.warn(`⚠ Meta description is ${post.metaDescription.length} chars — keep under 160.`);

const doc = {
  ...post,
  image: post.image ?? `https://picsum.photos/seed/bpng-${post.slug}/1200/675`,
  author: post.author ?? { name: "BestPlaceNG Data Desk", role: "Research Team" },
  date: post.date ?? new Date().toISOString().slice(0, 10),
  updatedAt: new Date().toISOString(),
};

// create() — cannot overwrite an existing post.
await db.collection("blogPosts").doc(post.slug).create(doc);
console.log(`PUBLISHED blogPosts/${post.slug}`);
console.log(`Live at /learn/${post.slug} within ~5 minutes (cache TTL).`);
process.exit(0);
