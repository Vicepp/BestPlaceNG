import { Users } from "lucide-react";
import type { Conversation } from "@/data/conversations";

export default function ConversationList({
  conversations,
  activeId,
  myUid,
  onSelect,
}: {
  conversations: Conversation[];
  activeId: string | null;
  myUid: string;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return <p className="p-4 text-xs text-zinc-400">No conversations yet.</p>;
  }

  return (
    <div className="divide-y divide-zinc-50">
      {conversations.map((c) => {
        const otherName =
          c.type === "group" ? c.title ?? "Group Chat" : Object.entries(c.participantNames ?? {}).find(([uid]) => uid !== myUid)?.[1] ?? "Conversation";
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${activeId === c.id ? "bg-brand-light" : "hover:bg-zinc-50"}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              {c.type === "group" ? <Users className="h-4 w-4" /> : otherName.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{otherName}</span>
              <span className="block truncate text-xs text-zinc-400">{c.lastMessageText ?? "No messages yet"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
