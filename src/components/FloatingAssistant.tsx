"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MessageCircle, Send, Square, X, Plus, ChevronLeft, History } from "lucide-react";
import { cities, type CityData } from "@/data/cities";
import { citySections } from "@/data/citySections";
import { useAuth } from "@/context/AuthContext";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface CityRecommendation {
  city: CityData;
  section?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  recommendations?: CityRecommendation[];
}

interface SavedThread {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; text: string }[];
  updatedAt: string;
}

interface SpeechRecognitionResultEvent extends Event {
  results: { 0: { transcript: string } }[];
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

const INTRO_MESSAGE: ChatMessage = {
  id: "intro",
  role: "assistant",
  text: "Hi! Tell me what you're looking for in a place to live in Nigeria — e.g. \"affordable city with good schools\" — or tap the mic to speak.",
};

const KEYWORD_RULES: { keywords: string[]; test: (c: CityData) => boolean }[] = [
  { keywords: ["cheap", "affordable", "low cost", "budget"], test: (c) => (c.costOfLivingIndex ?? 100) <= 85 },
  { keywords: ["safe", "security", "low crime"], test: (c) => (c.safetyIndex ?? 0) >= 78 },
  { keywords: ["cool", "cold", "highland"], test: (c) => (c.climate?.tempHighC ?? 99) <= 30 },
  { keywords: ["hot", "warm", "coastal"], test: (c) => (c.climate?.tempHighC ?? 0) >= 32 },
  { keywords: ["school", "education", "university"], test: (c) => (c.schoolRating ?? 0) >= 6.8 },
  { keywords: ["capital", "government", "abuja"], test: (c) => c.isFederalCapital === true || c.isStateCapital },
  { keywords: ["lagos", "business", "commercial", "tech"], test: (c) => (c.costOfLivingIndex ?? 0) >= 100 },
  { keywords: ["quiet", "calm", "relax"], test: (c) => c.population < 1_000_000 },
];

function recommendCitiesOffline(query: string): CityData[] {
  const q = query.toLowerCase();
  const direct = cities.filter((c) => q.includes(c.name.toLowerCase()) || q.includes(c.stateName.toLowerCase()));
  if (direct.length > 0) return direct.slice(0, 5);
  const majors = cities.filter((c) => c.tier === "major");
  const matchedRules = KEYWORD_RULES.filter((r) => r.keywords.some((kw) => q.includes(kw)));
  if (matchedRules.length === 0) return [...majors].sort((a, b) => b.population - a.population).slice(0, 3);
  return majors
    .map((c) => ({ city: c, score: matchedRules.filter((r) => r.test(c)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.city.population - a.city.population)
    .slice(0, 5)
    .map((s) => s.city);
}

function buildOfflineReply(recs: CityData[]): string {
  if (recs.length === 0) return "I couldn't find a close match yet. Try mentioning what matters most — e.g. affordable, safe, cool climate, good schools.";
  return `Based on what you described, here ${recs.length === 1 ? "is" : "are"} ${recs.length} place${recs.length === 1 ? "" : "s"} worth a look.`;
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-zinc-100 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-zinc-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}

const FIRESTORE_COL = "userChatThreads";

async function loadThreadsFromFirestore(uid: string): Promise<SavedThread[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const snap = await getDoc(doc(getDb(), FIRESTORE_COL, uid));
    if (!snap.exists()) return [];
    return (snap.data()?.threads as SavedThread[]) ?? [];
  } catch { return []; }
}

async function saveThreadsToFirestore(uid: string, threads: SavedThread[]): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await setDoc(doc(getDb(), FIRESTORE_COL, uid), { threads: threads.slice(0, 20), updatedAt: new Date().toISOString() }, { merge: true });
  } catch { /* silent */ }
}

export default function FloatingAssistant() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [threads, setThreads] = useState<SavedThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadsLoadedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  // Load saved threads when a user opens the panel for the first time
  useEffect(() => {
    if (!open || !user || threadsLoadedRef.current) return;
    threadsLoadedRef.current = true;
    loadThreadsFromFirestore(user.uid).then((saved) => {
      if (saved.length > 0) {
        setThreads(saved);
        // Restore the most recent thread automatically
        const latest = saved[0];
        setActiveThreadId(latest.id);
        setMessages([
          INTRO_MESSAGE,
          ...latest.messages.map((m, i) => ({
            id: `loaded-${i}`,
            role: m.role,
            text: m.text,
          })),
        ]);
      }
    });
  }, [open, user]);

  const persistThreads = useCallback(
    (updated: SavedThread[]) => {
      setThreads(updated);
      if (user) saveThreadsToFirestore(user.uid, updated);
    },
    [user]
  );

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput("");

    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: "user", text: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setThinking(true);

    // Build history to send (only user/assistant messages, no intro)
    const history = newMessages
      .filter((m) => m.id !== "intro")
      .map((m) => ({ role: m.role, content: m.text }));

    let assistantMsg: ChatMessage;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: history.slice(0, -1) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { reply: string; recommendations: { slug: string; section?: string }[] } = await res.json();
      const recs: CityRecommendation[] = data.recommendations.flatMap((r) => {
        const city = cities.find((c) => c.slug === r.slug);
        return city ? [{ city, section: r.section }] : [];
      });
      assistantMsg = { id: `${Date.now()}-a`, role: "assistant", text: data.reply, recommendations: recs };
    } catch {
      const recs = recommendCitiesOffline(trimmed);
      assistantMsg = { id: `${Date.now()}-a`, role: "assistant", text: buildOfflineReply(recs), recommendations: recs.map((city) => ({ city })) };
    } finally {
      setThinking(false);
    }

    const finalMessages = [...newMessages, assistantMsg!];
    setMessages(finalMessages);

    // Save / update the current thread in Firestore
    if (user) {
      const threadMsgs = finalMessages.filter((m) => m.id !== "intro").map((m) => ({ role: m.role, text: m.text }));
      const title = threadMsgs.find((m) => m.role === "user")?.text.slice(0, 40) ?? "New chat";
      const threadId = activeThreadId ?? `thread-${Date.now()}`;
      if (!activeThreadId) setActiveThreadId(threadId);

      const updated: SavedThread = { id: threadId, title, messages: threadMsgs, updatedAt: new Date().toISOString() };
      persistThreads([updated, ...threads.filter((t) => t.id !== threadId)]);
    }
  }

  function startNewChat() {
    setActiveThreadId(null);
    setMessages([INTRO_MESSAGE]);
    setShowHistory(false);
    setInput("");
  }

  function loadThread(thread: SavedThread) {
    setActiveThreadId(thread.id);
    setMessages([
      INTRO_MESSAGE,
      ...thread.messages.map((m, i) => ({ id: `loaded-${i}`, role: m.role, text: m.text })),
    ]);
    setShowHistory(false);
  }

  function toggleVoice() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setMessages((p) => [...p, { id: `${Date.now()}-a`, role: "assistant", text: "Voice search isn't supported in this browser. Try typing instead." }]);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-NG";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (e) => handleSend(e.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex h-[30rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                {showHistory && (
                  <button onClick={() => setShowHistory(false)} aria-label="Back to chat">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <p className="text-sm font-semibold">BestPlaceNG Assistant</p>
                  <p className="text-xs text-white/80">
                    {showHistory ? "Chat history" : "Ask about any city in Nigeria"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <>
                    <button onClick={startNewChat} aria-label="New chat" title="New chat">
                      <Plus className="h-4 w-4 text-white/80 hover:text-white" />
                    </button>
                    <button onClick={() => setShowHistory((v) => !v)} aria-label="Chat history" title="History">
                      <History className="h-4 w-4 text-white/80 hover:text-white" />
                    </button>
                  </>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* History panel */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {threads.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400 mt-8">No saved conversations yet.</p>
                ) : (
                  threads.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => loadThread(t)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        t.id === activeThreadId ? "border-brand bg-brand-light text-brand-dark" : "border-zinc-100 bg-zinc-50 hover:border-brand"
                      }`}
                    >
                      <p className="font-medium truncate">{t.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{new Date(t.updatedAt).toLocaleDateString()}</p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Message thread */}
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-brand text-white" : "bg-zinc-100 text-foreground"}`}>
                        <p>{m.text}</p>
                        {m.recommendations && m.recommendations.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {m.recommendations.map(({ city, section }) => {
                              const sectionLabel = section && section !== "overview" ? citySections.find((s) => s.slug === section)?.label : undefined;
                              const href = section && section !== "overview" ? `/city/${city.slug}/${section}` : `/city/${city.slug}`;
                              return (
                                <Link key={`${city.slug}-${section ?? "overview"}`} href={href}
                                  className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-brand-dark transition hover:border-brand"
                                >
                                  {city.name}, {city.stateName}{sectionLabel ? ` — ${sectionLabel}` : ""} &rarr;
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {thinking && <ThinkingBubble />}
                </div>

                {/* Input */}
                <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                  className="flex items-center gap-2 border-t border-zinc-100 px-3 py-3"
                >
                  <button type="button" onClick={toggleVoice} aria-label={listening ? "Stop voice" : "Start voice"}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${listening ? "bg-red-500 text-white" : "bg-brand-light text-brand"}`}
                  >
                    {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <input value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder={listening ? "Listening..." : thinking ? "Thinking..." : "Describe the place you want..."}
                    disabled={thinking}
                    className="flex-1 rounded-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
                  />
                  <button type="submit" disabled={thinking} aria-label="Send"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button onClick={() => setOpen((v) => !v)} whileTap={{ scale: 0.92 }}
        aria-label="Open BestPlaceNG assistant"
        className="pulse-ring flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
