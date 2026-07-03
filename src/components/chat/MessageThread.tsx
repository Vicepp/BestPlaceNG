"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Home, UserPlus, X } from "lucide-react";
import type { ChatMessage } from "@/data/conversations";
import { formatNaira } from "@/data/apartments";

const DISMISS_KEY = "bestplaceng:dismissedShares";

function loadDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(DISMISS_KEY) ?? "[]"); } catch { return []; }
}

function PropertyCard({
  msg,
  mine,
  dismissed,
  onIgnore,
}: {
  msg: ChatMessage;
  mine: boolean;
  dismissed: boolean;
  onIgnore?: (msgId: string) => void;
}) {
  return (
    <div
      className={`block rounded-2xl border p-3 text-sm ${
        mine ? "border-white/30 bg-white/10 text-white" : "border-zinc-200 bg-white text-foreground"
      }`}
    >
      <Link href={`/city/${msg.propertyCitySlug}/apartments?apt=${msg.propertyId}`} className="block transition hover:opacity-80">
        <div className="mb-1 flex items-center gap-2">
          <Home className={`h-4 w-4 shrink-0 ${mine ? "text-white/70" : "text-brand"}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${mine ? "text-white/70" : "text-brand"}`}>
            {msg.propertyType} · For {msg.propertyPurpose}
          </span>
        </div>
        <p className={`font-bold ${mine ? "text-white" : "text-foreground"}`}>{msg.propertyTitle}</p>
        <p className={`mt-0.5 text-xs ${mine ? "text-white/70" : "text-zinc-500"}`}>{msg.propertyArea}</p>
        {msg.propertyPriceNaira ? (
          <p className={`mt-1 font-semibold ${mine ? "text-white" : "text-brand-dark"}`}>
            {formatNaira(msg.propertyPriceNaira)}
          </p>
        ) : null}
      </Link>

      {/* Action buttons — only on RECEIVED property shares, until dismissed */}
      {!mine && !dismissed && msg.propertyId && onIgnore && (
        <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
          <Link
            href={`/become-tenant/${msg.propertyId}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Become a tenant
          </Link>
          <button
            onClick={() => onIgnore(msg.id)}
            className="flex items-center justify-center gap-1 rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:border-red-300 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" /> Ignore
          </button>
        </div>
      )}
    </div>
  );
}

export default function MessageThread({
  messages,
  myUid,
}: {
  messages: ChatMessage[];
  myUid: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => { setDismissed(loadDismissed()); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleIgnore(msgId: string) {
    const next = [...dismissed, msgId];
    setDismissed(next);
    try { window.localStorage.setItem(DISMISS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

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
                  <PropertyCard
                    msg={m}
                    mine={mine}
                    dismissed={dismissed.includes(m.id)}
                    onIgnore={handleIgnore}
                  />
                </div>
              ) : m.type === "image" && m.imageData ? (
                <div className={`overflow-hidden rounded-2xl ${mine ? "bg-brand p-1" : "bg-zinc-100 p-1"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.imageData} alt="Shared image" className="max-h-64 w-auto rounded-xl object-cover" />
                </div>
              ) : (
                <div className={`rounded-2xl px-4 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-zinc-100 text-foreground"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                </div>
              )}

              <p className="px-1 text-[10px] text-zinc-400">
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
