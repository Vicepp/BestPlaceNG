"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import type { ChatMessage } from "@/data/conversations";
import { formatNaira } from "@/data/apartments";

function PropertyCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <Link
      href={`/city/${msg.propertyCitySlug}/apartments`}
      className={`block rounded-2xl border p-3 text-sm transition hover:shadow-md ${
        mine ? "border-white/30 bg-white/10 text-white" : "border-zinc-200 bg-white text-foreground"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Home className={`h-4 w-4 shrink-0 ${mine ? "text-white/70" : "text-brand"}`} />
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${mine ? "text-white/70" : "text-brand"}`}>
          {msg.propertyType} · For {msg.propertyPurpose}
        </span>
      </div>
      <p className={`font-bold ${mine ? "text-white" : "text-foreground"}`}>{msg.propertyTitle}</p>
      <p className={`text-xs mt-0.5 ${mine ? "text-white/70" : "text-zinc-500"}`}>{msg.propertyArea}</p>
      {msg.propertyPriceNaira && (
        <p className={`mt-1 font-semibold ${mine ? "text-white" : "text-brand-dark"}`}>
          {formatNaira(msg.propertyPriceNaira)}
        </p>
      )}
    </Link>
  );
}

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
            {!mine && (
              <span className="mr-2 mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                {m.senderName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
              {!mine && <p className="px-1 text-[10px] font-semibold text-zinc-400">{m.senderName}</p>}

              {m.type === "property_share" ? (
                <div className={`rounded-2xl px-1 py-1 ${mine ? "bg-brand" : "bg-zinc-100"}`}>
                  <PropertyCard msg={m} mine={mine} />
                </div>
              ) : m.type === "image" && m.imageData ? (
                <div className={`rounded-2xl overflow-hidden ${mine ? "bg-brand p-1" : "bg-zinc-100 p-1"}`}>
                  <img src={m.imageData} alt="Shared image" className="max-h-64 w-auto rounded-xl object-cover" />
                </div>
              ) : (
                <div className={`rounded-2xl px-4 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-zinc-100 text-foreground"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                </div>
              )}

              <p className={`px-1 text-[10px] ${mine ? "text-zinc-400" : "text-zinc-400"}`}>
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
