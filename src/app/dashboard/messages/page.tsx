"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function MessagesContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMyConversationsLive(user.uid).then((c) => {
      setConversations(c);
      setLoading(false);
      if (!activeId && c.length > 0) {
        router.replace(`/dashboard/messages?c=${c[0].id}`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToMessages(activeId, setMessages);
    return unsub;
  }, [activeId]);

  if (loading) return <p className="text-sm text-zinc-400">Loading...</p>;

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <div className="w-72 shrink-0 overflow-y-auto border-r border-zinc-100">
        <p className="px-4 py-3 text-sm font-bold text-foreground">Messages</p>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          myUid={user!.uid}
          onSelect={(id) => router.push(`/dashboard/messages?c=${id}`)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {activeId ? (
          <>
            <MessageThread messages={messages} myUid={user!.uid} />
            <MessageInput
              onSend={(text) => sendMessage(activeId, user!.uid, profile?.displayName ?? user!.email ?? "User", text)}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
            Select a conversation, or message a landlord from a listing page.
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
