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
  /** Apartment this chat is about (direct inquiries from a listing) — powers the
   * "Request a tour" action in the chat. */
  apartmentTitle?: string;
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

/** Notifies every participant except the sender — used by all message types. */
async function notifyParticipants(conversationId: string, senderId: string, senderName: string, preview: string): Promise<void> {
  try {
    const convoSnap = await getDoc(doc(getDb(), "conversations", conversationId));
    const convoData = convoSnap.data() as Conversation;
    const others = (convoData.participantIds ?? []).filter((id) => id !== senderId);
    const { addFirestoreDoc } = await import("@/lib/firestoreWrite");
    await Promise.all(
      others.map((uid) =>
        addFirestoreDoc("notifications", {
          userId: uid,
          type: "message",
          title: `New message from ${senderName}`,
          body: preview.length > 80 ? preview.slice(0, 77) + "..." : preview,
          link: `/dashboard/messages?c=${conversationId}`,
          read: false,
          createdAt: new Date().toISOString(),
        })
      )
    );
  } catch { /* notification failure should never break the send */ }
}

export async function sendMessage(conversationId: string, senderId: string, senderName: string, text: string): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(getDb(), "conversations", conversationId, "messages"), {
    senderId, senderName, text, type: "text", createdAt: now,
  });
  await updateDoc(doc(getDb(), "conversations", conversationId), { lastMessageText: text, lastMessageAt: now });
  await notifyParticipants(conversationId, senderId, senderName, text);
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
  await notifyParticipants(conversationId, senderId, senderName, `🏠 Shared a property: ${property.title}`);
}

export async function sendImage(conversationId: string, senderId: string, senderName: string, imageData: string): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(getDb(), "conversations", conversationId, "messages"), {
    senderId, senderName, text: "📷 Image", type: "image", imageData, createdAt: now,
  });
  await updateDoc(doc(getDb(), "conversations", conversationId), {
    lastMessageText: "Sent an image", lastMessageAt: now,
  });
  await notifyParticipants(conversationId, senderId, senderName, "📷 Sent an image");
}

/** Finds an existing 1:1 conversation between two users, or creates one - used for
 * pre-rental "Message Landlord" inquiries, independent of any tenancy. */
export async function getOrCreateDirectConversation(
  myUid: string,
  myName: string,
  otherUid: string,
  otherName: string,
  apartment?: { id: string; title: string }
): Promise<string> {
  const existing = await getDocs(query(collection(getDb(), "conversations"), where("participantIds", "array-contains", myUid)));
  const match = existing.docs.find((d) => {
    const data = d.data() as Conversation;
    return data.type === "direct" && data.participantIds.includes(otherUid) && data.participantIds.length === 2;
  });
  if (match) {
    // Tag an existing chat with the apartment it's now about, if not already set.
    if (apartment && !(match.data() as Conversation).apartmentId) {
      await updateDoc(doc(getDb(), "conversations", match.id), { apartmentId: apartment.id, apartmentTitle: apartment.title }).catch(() => {});
    }
    return match.id;
  }

  const ref = await addDoc(collection(getDb(), "conversations"), {
    type: "direct",
    participantIds: [myUid, otherUid],
    participantNames: { [myUid]: myName, [otherUid]: otherName },
    ...(apartment ? { apartmentId: apartment.id, apartmentTitle: apartment.title } : {}),
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

/** Opens (or creates) the per-property group chat and returns its id — used by
 * the landlord's "Group Chat" button. Creates a landlord-only group if none
 * exists yet (tenants are auto-added when their tenancy activates). */
export async function getOrCreatePropertyGroupChat(params: {
  apartmentId: string;
  apartmentTitle: string;
  landlordId: string;
  landlordName: string;
  tenantIds?: { id: string; name: string }[];
}): Promise<string> {
  const existing = await getDocs(
    query(collection(getDb(), "conversations"), where("apartmentId", "==", params.apartmentId), where("type", "==", "group"))
  );
  if (!existing.empty) return existing.docs[0].id;

  const participantIds = [params.landlordId, ...(params.tenantIds ?? []).map((t) => t.id)];
  const participantNames: Record<string, string> = { [params.landlordId]: params.landlordName };
  for (const t of params.tenantIds ?? []) participantNames[t.id] = t.name;

  // A group needs >=2 participants (rules). If there are no tenants yet, the
  // landlord can't create a "group" of one — return "" so the caller can inform them.
  if (participantIds.length < 2) return "";

  const ref = await addDoc(collection(getDb(), "conversations"), {
    type: "group",
    apartmentId: params.apartmentId,
    title: params.apartmentTitle,
    participantIds,
    participantNames,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(getDb(), "conversations", conversationId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null;
}
