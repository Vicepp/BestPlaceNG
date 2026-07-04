import { collection, addDoc, doc, setDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";

/**
 * Firestore rejects `undefined` values — strip them before every write so no
 * optional field that was never filled in causes an invalid-argument error.
 * `null` is allowed and preserved; only `undefined` is removed.
 */
function clean(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export type WriteResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Adds a new document (auto-generated ID) to a Firestore collection. Unlike the
 * read helpers, this never silently falls back - the caller is submitting a form
 * and needs to know whether it actually saved, so failures are surfaced as a
 * `{ ok: false, error }` result instead of swallowed.
 */
function firestoreError(col: string, e: unknown): WriteResult {
  const err = e as { code?: string; message?: string };
  const code = (err.code ?? "").toLowerCase();
  const msg  = (err.message ?? "").toLowerCase();
  console.error(`[firestore] write to "${col}" failed — code: ${err.code}, message: ${err.message}`, e);

  const isPermission = code.includes("permission") || msg.includes("permission") || msg.includes("missing or insufficient");
  const isUnauth     = code.includes("unauthenticated") || code.includes("auth") || msg.includes("unauthenticated");

  if (isPermission) {
    return {
      ok: false,
      error: "⚠️ Permission denied — Firestore rules need to be published. Open the Firebase console → Firestore → Rules tab → paste the full firestore.rules file → click Publish.",
    };
  }
  if (isUnauth) {
    return { ok: false, error: "You need to be logged in to do that." };
  }
  return { ok: false, error: `Couldn't save (${err.code ?? "unknown error"}). Check the browser console for details.` };
}

export async function addFirestoreDoc(col: string, data: Record<string, unknown>): Promise<WriteResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "This feature isn't available right now. Please try again later." };
  }
  try {
    const ref = await addDoc(collection(getDb(), col), clean(data));
    return { ok: true, id: ref.id };
  } catch (e) {
    return firestoreError(col, e);
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
    await setDoc(ref, clean({ ...data, id: ref.id }));
    return { ok: true, id: ref.id };
  } catch (e) {
    return firestoreError(col, e);
  }
}

/** Sets (creates or overwrites) a document at a known ID, e.g. a user profile keyed by uid. */
export async function setFirestoreDoc(col: string, id: string, data: Record<string, unknown>): Promise<WriteResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "This feature isn't available right now. Please try again later." };
  }
  try {
    await setDoc(doc(getDb(), col, id), clean(data), { merge: true });
    return { ok: true, id };
  } catch (e) {
    return firestoreError(`${col}/${id}`, e);
  }
}

export async function deleteFirestoreDoc(col: string, id: string): Promise<WriteResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "This feature isn't available right now." };
  }
  try {
    await deleteDoc(doc(getDb(), col, id));
    return { ok: true, id };
  } catch (e) {
    return firestoreError(`${col}/${id}`, e);
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
