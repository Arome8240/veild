"use client";

interface Props {
  label:      string;
  value:      string | number;
  sub?:       string;
  emoji?:     string;
  className?: string;
}

export function StatCard({ label, value, sub, emoji, className = "" }: Props) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-4 space-y-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        {emoji && <span aria-hidden="true" className="text-lg">{emoji}</span>}
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}
