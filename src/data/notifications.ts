import { addFirestoreDoc, setFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";
import { onSnapshot, query, where, collection, orderBy } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import type { Unsubscribe } from "firebase/firestore";

export type NotificationType = "message" | "payment_received" | "payment_made" | "maintenance" | "tenancy" | "system";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export async function createNotification(params: Omit<AppNotification, "id" | "read" | "createdAt">): Promise<WriteResult> {
  return addFirestoreDoc("notifications", {
    ...params,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function markNotificationRead(id: string): Promise<WriteResult> {
  return setFirestoreDoc("notifications", id, { read: true });
}

export async function markAllRead(userId: string): Promise<void> {
  const all = await queryFirestoreCollection<AppNotification>("notifications", [["userId", userId], ["read", false]]);
  if (!all) return;
  await Promise.all(all.map((n) => markNotificationRead(n.id)));
}

/** Real-time subscription to unread notification count for a user. */
export function subscribeToUnreadCount(userId: string, onCount: (n: number) => void): Unsubscribe {
  if (!isFirebaseConfigured()) { onCount(0); return () => {}; }
  const q = query(
    collection(getDb(), "notifications"),
    where("userId", "==", userId),
    where("read", "==", false)
  );
  return onSnapshot(q, (snap) => onCount(snap.size), () => onCount(0));
}

/** Real-time subscription to all notifications for a user, newest first. */
export function subscribeToNotifications(userId: string, onData: (n: AppNotification[]) => void): Unsubscribe {
  if (!isFirebaseConfigured()) { onData([]); return () => {}; }
  const q = query(
    collection(getDb(), "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification)), () => onData([]));
}
