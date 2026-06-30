import { Sparkles } from "lucide-react";

export default function ComingSoon({ topic }: { topic: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
      <Sparkles className="mb-3 h-6 w-6 text-brand" />
      <p className="text-sm font-medium text-foreground">
        Detailed {topic} data is coming soon
      </p>
      <p className="mt-1 max-w-sm text-xs text-zinc-400">
        We&apos;re progressively adding verified {topic.toLowerCase()} data for
        every city. Check back soon, or ask the assistant in the corner for
        what we already know.
      </p>
    </div>
  );
}
