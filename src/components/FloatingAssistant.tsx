"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MessageCircle, Send, Square, X } from "lucide-react";
import { cities, type CityData } from "@/data/cities";
import { citySections } from "@/data/citySections";

interface CityRecommendation {
  city: CityData;
  /** city-section slug, e.g. "jobs", "crime", "apartments" - links straight to the relevant tab instead of just the overview */
  section?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  recommendations?: CityRecommendation[];
}

// Minimal typing for the Web Speech API (not in default TS lib)
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

// Keyword rules rely on researched indices that only "major" tier cities have.
// Used only as an offline fallback if the AI assistant API is unreachable.
const KEYWORD_RULES: { keywords: string[]; test: (c: CityData) => boolean }[] = [
  { keywords: ["cheap", "affordable", "low cost", "budget"], test: (c) => (c.costOfLivingIndex ?? 100) <= 85 },
  { keywords: ["safe", "security", "low crime"], test: (c) => (c.safetyIndex ?? 0) >= 78 },
  { keywords: ["cool", "cold", "highland", "mountain"], test: (c) => (c.climate?.tempHighC ?? 99) <= 30 },
  { keywords: ["hot", "warm", "coastal", "beach"], test: (c) => (c.climate?.tempHighC ?? 0) >= 32 },
  { keywords: ["school", "education", "university", "student"], test: (c) => (c.schoolRating ?? 0) >= 6.8 },
  { keywords: ["capital", "government", "abuja"], test: (c) => c.isFederalCapital === true || c.isStateCapital },
  { keywords: ["lagos", "business", "commercial", "tech", "job"], test: (c) => (c.costOfLivingIndex ?? 0) >= 100 },
  { keywords: ["quiet", "calm", "relax"], test: (c) => c.population < 1000000 },
];

function recommendCitiesOffline(query: string): CityData[] {
  const q = query.toLowerCase();

  const direct = cities.filter(
    (c) => q.includes(c.name.toLowerCase()) || q.includes(c.stateName.toLowerCase())
  );
  if (direct.length > 0) return direct.slice(0, 5);

  const majors = cities.filter((c) => c.tier === "major");
  const matchedRules = KEYWORD_RULES.filter((rule) =>
    rule.keywords.some((kw) => q.includes(kw))
  );

  if (matchedRules.length === 0) {
    return [...majors].sort((a, b) => b.population - a.population).slice(0, 3);
  }

  const scored = majors.map((c) => ({
    city: c,
    score: matchedRules.filter((r) => r.test(c)).length,
  }));

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.city.population - a.city.population)
    .slice(0, 5)
    .map((s) => s.city);
}

function buildOfflineReply(recs: CityData[]): string {
  if (recs.length === 0) {
    return "I couldn't find a close match in our city database yet. Try mentioning a city, state, or what matters most to you (e.g. affordable, safe, cool climate, good schools).";
  }
  return `Based on what you described, here ${recs.length === 1 ? "is" : "are"} ${recs.length} place${recs.length === 1 ? "" : "s"} in Nigeria worth a look. Tap a city below to see the full overview.`;
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-zinc-100 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-zinc-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Hi! Tell me what you're looking for in a place to live in Nigeria — e.g. “affordable city with good schools” — or tap the mic to speak.",
    },
  ]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput("");
    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: "user", text: trimmed }]);
    setThinking(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { reply: string; recommendations: { slug: string; section?: string }[] } = await res.json();
      const recommendations: CityRecommendation[] = [];
      for (const r of data.recommendations) {
        const city = cities.find((c) => c.slug === r.slug);
        if (city) recommendations.push({ city, section: r.section });
      }
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-a`, role: "assistant", text: data.reply, recommendations },
      ]);
    } catch {
      // Offline fallback: local keyword matching, same behaviour as before the AI was wired up.
      const recs = recommendCitiesOffline(trimmed);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-a`, role: "assistant", text: buildOfflineReply(recs), recommendations: recs.map((city) => ({ city })) },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: "assistant",
          text: "Voice search isn't supported in this browser yet. Try typing your request instead, or use Chrome on desktop/Android.",
        },
      ]);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-NG";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };
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
            className="flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:w-96"
          >
            <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">BestPlaceNG Assistant</p>
                <p className="text-xs text-white/80">Ask, or speak, your way to a city</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close assistant">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                      m.role === "user" ? "bg-brand text-white" : "bg-zinc-100 text-foreground"
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.recommendations && m.recommendations.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {m.recommendations.map(({ city, section }) => {
                          const sectionLabel = section && section !== "overview" ? citySections.find((s) => s.slug === section)?.label : undefined;
                          const href = section && section !== "overview" ? `/city/${city.slug}/${section}` : `/city/${city.slug}`;
                          return (
                            <Link
                              key={`${city.slug}-${section ?? "overview"}`}
                              href={href}
                              className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-brand-dark transition hover:border-brand"
                            >
                              {city.name}, {city.stateName}
                              {sectionLabel ? ` — ${sectionLabel}` : ""} &rarr;
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2 border-t border-zinc-100 px-3 py-3"
            >
              <button
                type="button"
                onClick={toggleVoice}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                  listening ? "bg-red-500 text-white" : "bg-brand-light text-brand"
                }`}
              >
                {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening..." : thinking ? "Thinking..." : "Describe the place you want..."}
                disabled={thinking}
                className="flex-1 rounded-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={thinking}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        aria-label="Open BestPlaceNG assistant"
        className="pulse-ring flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
