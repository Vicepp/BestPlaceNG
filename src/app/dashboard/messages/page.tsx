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

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

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
            <MessageThread messages={messages} myUid={user!.uid} />
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
