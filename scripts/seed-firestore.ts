/**
 * One-time (re-runnable) migration: pushes all the curated static datasets and
 * sample listings into Firestore. Run with:
 *   npx tsx scripts/seed-firestore.ts
 *
 * Requires NEXT_PUBLIC_FIREBASE_* in .env.local and (temporarily) permissive
 * Firestore rules, since this runs unauthenticated via the client SDK.
 */
process.loadEnvFile?.(".env.local");

import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc, collection } from "firebase/firestore";

import { cities } from "../src/data/cities";
import { apartments } from "../src/data/apartments";
import { directoryListings } from "../src/data/directoryListings";
import researchedRent from "../src/data/researched-rent.json";
import stateRentFallback from "../src/data/state-rent-fallback.json";
import costOfLivingConfig from "../src/data/cost-of-living-config.json";
import researchedCrime from "../src/data/researched-crime.json";
import crimeConfigData from "../src/data/crime-config.json";
import crimeHistoryData from "../src/data/crime-history.json";
import notableIncidentsData from "../src/data/notable-incidents.json";
import climateNormalsData from "../src/data/climate-normals.json";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_* env vars - check .env.local");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type WriteOp = { col: string; id: string; data: Record<string, unknown> };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function commitAll(ops: WriteOp[]) {
  const batches = chunk(ops, 450);
  for (let i = 0; i < batches.length; i++) {
    const batch = writeBatch(db);
    for (const op of batches[i]) {
      batch.set(doc(db, op.col, op.id), op.data);
    }
    await batch.commit();
    console.log(`  committed batch ${i + 1}/${batches.length} (${batches[i].length} docs)`);
  }
}

async function main() {
  const ops: WriteOp[] = [];

  console.log(`Queuing ${cities.length} cities...`);
  for (const c of cities) {
    ops.push({ col: "cities", id: c.slug, data: c as unknown as Record<string, unknown> });
  }

  console.log(`Queuing ${Object.keys(researchedRent).length} cost-of-living research entries...`);
  for (const [slug, entry] of Object.entries(researchedRent)) {
    ops.push({ col: "costOfLivingResearch", id: slug, data: entry as Record<string, unknown> });
  }
  ops.push({ col: "config", id: "costOfLiving", data: costOfLivingConfig });
  ops.push({ col: "config", id: "stateRentFallback", data: stateRentFallback });

  console.log(`Queuing ${Object.keys(researchedCrime).length} crime research entries...`);
  for (const [slug, entry] of Object.entries(researchedCrime)) {
    ops.push({ col: "crimeResearch", id: slug, data: entry as Record<string, unknown> });
  }
  ops.push({ col: "config", id: "crime", data: crimeConfigData });
  ops.push({ col: "config", id: "crimeHistory", data: crimeHistoryData });

  console.log(`Queuing ${notableIncidentsData.length} notable incidents...`);
  notableIncidentsData.forEach((incident, i) => {
    ops.push({ col: "notableIncidents", id: `incident-${i}`, data: incident });
  });

  console.log(`Queuing ${Object.keys(climateNormalsData).length} climate normals...`);
  for (const [slug, months] of Object.entries(climateNormalsData)) {
    ops.push({ col: "climateNormals", id: slug, data: { months } });
  }

  console.log(`Queuing ${apartments.length} sample apartment listings...`);
  for (const a of apartments) {
    ops.push({ col: "apartments", id: a.id, data: { ...a, ownerId: "seed", createdAt: new Date().toISOString() } });
  }

  console.log(`Queuing ${directoryListings.length} sample directory listings...`);
  for (const d of directoryListings) {
    ops.push({ col: "directoryListings", id: d.id, data: { ...d, ownerId: "seed", createdAt: new Date().toISOString() } });
  }

  console.log(`\nTotal documents to write: ${ops.length}`);
  await commitAll(ops);
  console.log("\nSeed complete.");
}

main().catch((e) => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});
