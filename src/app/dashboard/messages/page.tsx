"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getMyConversationsLive,
  subscribeToMessages,
  sendMessage,
  type Conversation,
  type ChatMessage,
} from "@/data/conversations";
import ConversationList from "@/components/chat/ConversationList";
import MessageThread from "@/components/chat/MessageThread";
import MessageInput from "@/components/chat/MessageInput";
import ChatAttachMenu from "@/components/chat/ChatAttachMenu";
import { getPaymentsForTenantLive } from "@/data/payments";
import { requestToRent, getTenanciesForTenantLive } from "@/data/tenancies";
import { createNotification } from "@/data/notifications";
import { getFirestoreDoc } from "@/lib/firestoreData";
import { isPaystackConfigured, payWithPaystack } from "@/lib/paystack";
import type { ApartmentListing } from "@/data/apartments";

function ChatHeader({ conversation, myUid }: { conversation: Conversation | null; myUid: string }) {
  if (!conversation) return null;

  if (conversation.type === "group") {
    const tenantCount = conversation.participantIds.length - 1; // landlord + tenants
    return (
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
          <Users className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{conversation.title ?? "Group Chat"}</p>
          <p className="truncate text-xs text-zinc-400">
            Property group · {tenantCount} tenant{tenantCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    );
  }

  // Direct conversation — show the other user's name
  const otherId = conversation.participantIds.find((id) => id !== myUid) ?? "";
  const otherName = conversation.participantNames?.[otherId] ?? "User";
  const initials = otherName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-600">
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{otherName}</p>
        <p className="truncate text-xs text-zinc-400">
          <MessageCircle className="mr-1 inline h-3 w-3" />Direct message
        </p>
      </div>
    </div>
  );
}

function MessagesContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [payingMsgId, setPayingMsgId] = useState<string | null>(null);
  const [payBanner, setPayBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  /** "Make Payment" on a shared property card:
   *  1. If a pending rent invoice already exists for me + this apartment → open Paystack right away.
   *  2. Otherwise → send a rent request to the landlord (they'll approve + invoice, tenant gets notified). */
  async function handlePayProperty(msg: ChatMessage) {
    if (!user || !msg.propertyId) return;
    setPayingMsgId(msg.id);
    setPayBanner(null);
    try {
      const myPayments = await getPaymentsForTenantLive(user.uid);
      const invoice = myPayments.find((p) => p.apartmentId === msg.propertyId && p.status === "pending");

      if (invoice && isPaystackConfigured() && user.email) {
        // Direct to payment popup
        const reference = `bpng-${invoice.id}-${Date.now()}`;
        payWithPaystack({
          email: user.email,
          amountNaira: invoice.amount,
          reference,
          paymentId: invoice.id,
          onSuccess: async (ref) => {
            const res = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: ref, paymentId: invoice.id }),
            });
            const json = await res.json();
            setPayBanner(json.ok
              ? { kind: "ok", text: "Payment successful! Receipt saved to your dashboard." }
              : { kind: "err", text: json.error ?? "Verification failed — contact your landlord." });
            setPayingMsgId(null);
          },
          onClose: () => setPayingMsgId(null),
        });
        return;
      }

      // No invoice yet — send a rent request instead
      const apartment = await getFirestoreDoc<ApartmentListing>("apartments", msg.propertyId);
      if (!apartment || !apartment.ownerId) {
        setPayBanner({ kind: "err", text: "This listing is no longer available." });
        setPayingMsgId(null);
        return;
      }
      // Don't duplicate an existing request/tenancy
      const myTenancies = await getTenanciesForTenantLive(user.uid);
      const existing = myTenancies.find((t) => t.apartmentId === apartment.id && ["requested", "active"].includes(t.status));
      if (existing) {
        setPayBanner({
          kind: "ok",
          text: existing.status === "active"
            ? "You're already a tenant here — check your dashboard for any pending invoice."
            : "You've already requested this property — waiting for the landlord to approve and send an invoice.",
        });
        setPayingMsgId(null);
        return;
      }

      const result = await requestToRent({
        apartmentId: apartment.id,
        citySlug: apartment.citySlug,
        apartmentTitle: apartment.title,
        landlordId: apartment.ownerId,
        tenantId: user.uid,
        tenantName: profile?.displayName ?? user.email ?? "Tenant",
        tenantEmail: user.email ?? "",
        rentAmount: apartment.priceNaira,
        rentPeriod: apartment.pricePeriod === "month" ? "month" : "year",
      });
      if (result.ok) {
        createNotification({
          userId: apartment.ownerId,
          type: "tenancy",
          title: "Rent request from chat",
          body: `${profile?.displayName ?? user.email} wants to rent ${apartment.title}. Approve and send an invoice to collect payment.`,
          link: "/dashboard/tenants",
        }).catch(() => {});
        setPayBanner({ kind: "ok", text: "Request sent! The landlord will approve and send you a payment invoice — you'll get a notification." });
      } else {
        setPayBanner({ kind: "err", text: result.error });
      }
    } catch {
      setPayBanner({ kind: "err", text: "Something went wrong. Please try again." });
    }
    setPayingMsgId(null);
  }

  useEffect(() => {
    if (!user) return;
    getMyConversationsLive(user.uid).then((c) => {
      setConversations(c);
      setLoading(false);
      if (!activeId && c.length > 0) router.replace(`/dashboard/messages?c=${c[0].id}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    setAttachOpen(false);
    return subscribeToMessages(activeId, setMessages);
  }, [activeId]);

  if (loading) return <p className="text-sm text-zinc-400">Loading...</p>;

  return (
    /* full-height two-pane layout; on mobile, show only the thread pane when a conversation is open */
    <div className="flex h-[calc(100dvh-14rem)] overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm md:h-[calc(100vh-8rem)]">
      {/* Conversation list — hidden on mobile when a chat is open */}
      <div className={`w-full shrink-0 overflow-y-auto border-r border-zinc-100 md:w-72 ${activeId ? "hidden md:block" : "block"}`}>
        <p className="px-4 py-3 text-sm font-bold text-foreground">Messages</p>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          myUid={user!.uid}
          onSelect={(id) => router.push(`/dashboard/messages?c=${id}`)}
        />
      </div>

      {/* Thread pane */}
      <div className={`flex min-w-0 flex-1 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
        {activeId ? (
          <>
            {/* Back button on mobile */}
            <div className="flex items-center gap-2 md:block">
              <button
                onClick={() => router.push("/dashboard/messages")}
                className="flex h-9 w-9 items-center justify-center text-zinc-400 hover:text-foreground md:hidden"
                aria-label="Back"
              >
                ←
              </button>
              <div className="flex-1">
                <ChatHeader conversation={activeConversation} myUid={user!.uid} />
              </div>
            </div>
            {payBanner && (
              <div className={`mx-4 mt-2 flex items-start justify-between gap-2 rounded-xl px-4 py-2.5 text-xs ${payBanner.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                <span>{payBanner.text}</span>
                <button onClick={() => setPayBanner(null)} className="shrink-0 font-bold">✕</button>
              </div>
            )}
            <MessageThread messages={messages} myUid={user!.uid} onPayProperty={handlePayProperty} payingMsgId={payingMsgId} />
            {attachOpen && activeId && (
              <ChatAttachMenu conversationId={activeId} onClose={() => setAttachOpen(false)} />
            )}
            <MessageInput
              onSend={(text) => sendMessage(activeId, user!.uid, profile?.displayName ?? user!.email ?? "User", text)}
              onAttach={() => setAttachOpen((v) => !v)}
              attachOpen={attachOpen}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-400">Loading...</p>}>
      <MessagesContent />
    </Suspense>
  );
}
