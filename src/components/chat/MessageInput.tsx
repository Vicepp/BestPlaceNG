"use client";

import { useState } from "react";
import { Send, Paperclip } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  onAttach?: () => void;
  attachOpen?: boolean;
}

export default function MessageInput({ onSend, onAttach, attachOpen }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-zinc-100 p-3">
      {onAttach && (
        <button
          type="button"
          onClick={onAttach}
          aria-label="Attach"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            attachOpen ? "bg-brand text-white" : "border border-zinc-200 text-zinc-400 hover:border-brand hover:text-brand"
          }`}
        >
          <Paperclip className="h-4 w-4" />
        </button>
      )}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"
        aria-label="Send"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
