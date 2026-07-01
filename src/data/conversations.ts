import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

export interface Conversation {
  id: string;
  type: "direct" | "group";
  apartmentId?: string;
  title?: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  lastMessageText?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export type ChatMessageType = "text" | "property_share" | "image";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type?: ChatMessageType;
  // property_share fields
  propertyId?: string;
  propertyTitle?: string;
  propertyType?: string;
  propertyPurpose?: string;
  propertyCitySlug?: string;
  propertyPriceNaira?: number;
  propertyArea?: string;
  // image fields
  imageData?: string; // base64 data URL
  createdAt: string;
}

/** One-shot fetch of every conversation the user is part of, newest activity first. */
export async function getMyConversationsLive(uid: string): Promise<Conversation[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const snap = await getDocs(query(collection(getDb(), "conversations"), where("participantIds", "array-contains", uid)));
    const convos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation);
    return convos.sort((a, b) => new Date(b.lastMessageAt ?? b.createdAt).getTime() - new Date(a.lastMessageAt ?? a.createdAt).getTime());
  } catch (e) {
    console.error("[conversations] getMyConversationsLive failed:", e);
    return [];
  }
}

/** Real-time subscription to a conversation's messages, oldest first. */
export function subscribeToMessages(conversationId: string, onMessages: (messages: ChatMessage[]) => void): Unsubscribe {
  const q = query(collection(getDb(), "conversations", conversationId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    onMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage));
  });
}

export async function sendMessage(conversationId: string, senderId: string, senderName: string, text: string): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(getDb(), "conversations", conversationId, "messages"), {
    senderId, senderName, text, type: "text", createdAt: now,
  });
  const convoRef = doc(getDb(), "conversations", conversationId);
  await updateDoc(convoRef, { lastMessageText: text, lastMessageAt: now });

  // Notify all other participants about the new message
  try {
    const convoSnap = await getDoc(convoRef);
    const convoData = convoSnap.data() as Conversation;
    const others = (convoData.participantIds ?? []).filter((id) => id !== senderId);
    const { addFirestoreDoc } = await import("@/lib/firestoreWrite");
    await Promise.all(
      others.map((uid) =>
        addFirestoreDoc("notifications", {
          userId: uid,
          type: "message",
          title: `New message from ${senderName}`,
          body: text.length > 80 ? text.slice(0, 77) + "..." : text,
          link: `/dashboard/messages?c=${conversationId}`,
          read: false,
          createdAt: now,
        })
      )
    );
  } catch { /* notification failure should never break the send */ }
}

export async function sendPropertyCard(
  conversationId: string,
  senderId: string,
  senderName: string,
  property: { id: string; title: string; type: string; purpose: string; citySlug: string; priceNaira: number; area: string }
): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(getDb(), "conversations", conversationId, "messages"), {
    senderId, senderName, text: `🏠 ${property.title}`,
    type: "property_share",
    propertyId: property.id,
    propertyTitle: property.title,
    propertyType: property.type,
    propertyPurpose: property.purpose,
    propertyCitySlug: property.citySlug,
    propertyPriceNaira: property.priceNaira,
    propertyArea: property.area,
    createdAt: now,
  });
  await updateDoc(doc(getDb(), "conversations", conversationId), {
    lastMessageText: `Shared: ${property.title}`, lastMessageAt: now,
  });
}

export async function sendImage(conversationId: string, senderId: string, senderName: string, imageData: string): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(getDb(), "conversations", conversationId, "messages"), {
    senderId, senderName, text: "📷 Image", type: "image", imageData, createdAt: now,
  });
  await updateDoc(doc(getDb(), "conversations", conversationId), {
    lastMessageText: "Sent an image", lastMessageAt: now,
  });
}

/** Finds an existing 1:1 conversation between two users, or creates one - used for
 * pre-rental "Message Landlord" inquiries, independent of any tenancy. */
export async function getOrCreateDirectConversation(
  myUid: string,
  myName: string,
  otherUid: string,
  otherName: string
): Promise<string> {
  const existing = await getDocs(query(collection(getDb(), "conversations"), where("participantIds", "array-contains", myUid)));
  const match = existing.docs.find((d) => {
    const data = d.data() as Conversation;
    return data.type === "direct" && data.participantIds.includes(otherUid) && data.participantIds.length === 2;
  });
  if (match) return match.id;

  const ref = await addDoc(collection(getDb(), "conversations"), {
    type: "direct",
    participantIds: [myUid, otherUid],
    participantNames: { [myUid]: myName, [otherUid]: otherName },
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

/** Ensures a per-property group conversation exists and includes this tenant - called when
 * a tenancy goes "active". Creates the group (landlord-only) if missing, else adds the tenant. */
export async function ensurePropertyGroupConversation(params: {
  apartmentId: string;
  apartmentTitle: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
}): Promise<void> {
  const existing = await getDocs(
    query(collection(getDb(), "conversations"), where("apartmentId", "==", params.apartmentId), where("type", "==", "group"))
  );
  if (existing.empty) {
    await addDoc(collection(getDb(), "conversations"), {
      type: "group",
      apartmentId: params.apartmentId,
      title: params.apartmentTitle,
      participantIds: [params.landlordId, params.tenantId],
      participantNames: { [params.landlordId]: params.landlordName, [params.tenantId]: params.tenantName },
      createdAt: new Date().toISOString(),
    });
    return;
  }
  const convoDoc = existing.docs[0];
  const data = convoDoc.data() as Conversation;
  if (data.participantIds.includes(params.tenantId)) return;
  await updateDoc(doc(getDb(), "conversations", convoDoc.id), {
    participantIds: arrayUnion(params.tenantId),
    [`participantNames.${params.tenantId}`]: params.tenantName,
  });
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(getDb(), "conversations", conversationId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null;
}
