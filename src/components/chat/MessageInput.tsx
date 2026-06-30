"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function MessageInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-zinc-100 p-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-brand"
      />
      <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark" aria-label="Send">
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
