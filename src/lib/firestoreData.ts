import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";

const TTL_MS = 5 * 60 * 1000; // 5 minutes - short enough that console edits show up quickly, long enough to keep read costs sane.
const cache = new Map<string, { data: unknown; expires: number }>();

/**
 * Reads an entire Firestore collection, with an in-memory TTL cache and a
 * `null` return (never a throw) on any failure so callers can fall back to
 * their bundled static data. This is the "live, but never breaks the site"
 * pattern used across every data module.
 */
export async function getFirestoreCollection<T>(name: string): Promise<T[] | null> {
  if (!isFirebaseConfigured()) return null;
  const cacheKey = `col:${name}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as T[];
  try {
    const snap = await getDocs(collection(getDb(), name));
    const data = snap.docs.map((d) => d.data() as T);
    cache.set(cacheKey, { data, expires: Date.now() + TTL_MS });
    return data;
  } catch (e) {
    console.error(`[firestore] collection "${name}" read failed, falling back to static data:`, e);
    return null;
  }
}

/** Like getFirestoreCollection, but keyed by document ID - for collections where the ID is the lookup key (e.g. a city slug). */
export async function getFirestoreCollectionAsMap<T>(name: string): Promise<Record<string, T> | null> {
  if (!isFirebaseConfigured()) return null;
  const cacheKey = `map:${name}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as Record<string, T>;
  try {
    const snap = await getDocs(collection(getDb(), name));
    const data: Record<string, T> = {};
    snap.docs.forEach((d) => {
      data[d.id] = d.data() as T;
    });
    cache.set(cacheKey, { data, expires: Date.now() + TTL_MS });
    return data;
  } catch (e) {
    console.error(`[firestore] collection-as-map "${name}" read failed, falling back to static data:`, e);
    return null;
  }
}

export async function getFirestoreDoc<T>(col: string, id: string): Promise<T | null> {
  if (!isFirebaseConfigured()) return null;
  const cacheKey = `doc:${col}/${id}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as T;
  try {
    const snap = await getDoc(doc(getDb(), col, id));
    if (!snap.exists()) {
      cache.set(cacheKey, { data: null, expires: Date.now() + TTL_MS });
      return null;
    }
    const data = snap.data() as T;
    cache.set(cacheKey, { data, expires: Date.now() + TTL_MS });
    return data;
  } catch (e) {
    console.error(`[firestore] doc "${col}/${id}" read failed, falling back to static data:`, e);
    return null;
  }
}
