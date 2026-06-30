export default function IndexBar({
  label,
  value,
  max = 150,
  helpText,
}: {
  label: string;
  value: number;
  max?: number;
  helpText?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-semibold text-brand">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {helpText && <p className="mt-1 text-xs text-zinc-400">{helpText}</p>}
    </div>
  );
}
