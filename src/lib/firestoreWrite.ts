import { collection, addDoc, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";

export type WriteResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Adds a new document (auto-generated ID) to a Firestore collection. Unlike the
 * read helpers, this never silently falls back - the caller is submitting a form
 * and needs to know whether it actually saved, so failures are surfaced as a
 * `{ ok: false, error }` result instead of swallowed.
 */
export async function addFirestoreDoc(col: string, data: Record<string, unknown>): Promise<WriteResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "This feature isn't available right now. Please try again later." };
  }
  try {
    const ref = await addDoc(collection(getDb(), col), data);
    return { ok: true, id: ref.id };
  } catch (e) {
    console.error(`[firestore] write to "${col}" failed:`, e);
    return { ok: false, error: "Couldn't save that just now. Please try again." };
  }
}

/**
 * Like addFirestoreDoc, but also stores the generated document ID as an `id`
 * field on the document itself - needed for collections read back via
 * getFirestoreCollection (a plain array of d.data(), which doesn't carry the
 * Firestore doc ID), e.g. apartments/directoryListings, where the UI relies on
 * a stable `id` field for React keys and detail links.
 */
export async function addFirestoreDocWithId(col: string, data: Record<string, unknown>): Promise<WriteResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "This feature isn't available right now. Please try again later." };
  }
  try {
    const ref = doc(collection(getDb(), col));
    await setDoc(ref, { ...data, id: ref.id });
    return { ok: true, id: ref.id };
  } catch (e) {
    console.error(`[firestore] write to "${col}" failed:`, e);
    return { ok: false, error: "Couldn't save that just now. Please try again." };
  }
}

/** Sets (creates or overwrites) a document at a known ID, e.g. a user profile keyed by uid. */
export async function setFirestoreDoc(col: string, id: string, data: Record<string, unknown>): Promise<WriteResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "This feature isn't available right now. Please try again later." };
  }
  try {
    await setDoc(doc(getDb(), col, id), data, { merge: true });
    return { ok: true, id };
  } catch (e) {
    console.error(`[firestore] write to "${col}/${id}" failed:`, e);
    return { ok: false, error: "Couldn't save that just now. Please try again." };
  }
}

/** Fetches all docs in a collection matching simple equality filters, sorted client-side - avoids needing composite Firestore indexes. */
export async function queryFirestoreCollection<T>(
  col: string,
  filters: [string, string | number | boolean | null][]
): Promise<T[] | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const constraints = filters.map(([field, value]) => where(field, "==", value));
    const snap = await getDocs(query(collection(getDb(), col), ...constraints));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  } catch (e) {
    console.error(`[firestore] query "${col}" failed:`, e);
    return null;
  }
}
