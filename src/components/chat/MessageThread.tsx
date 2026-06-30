"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/data/conversations";

export default function MessageThread({ messages, myUid }: { messages: ChatMessage[]; myUid: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.length === 0 && <p className="text-center text-xs text-zinc-400">No messages yet. Say hello!</p>}
      {messages.map((m) => {
        const mine = m.senderId === myUid;
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-zinc-100 text-foreground"}`}>
              {!mine && <p className="mb-0.5 text-xs font-semibold opacity-70">{m.senderName}</p>}
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-zinc-400"}`}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
