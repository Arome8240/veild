"use client";

interface Props {
  label?:     string;
  className?: string;
}

export function Divider({ label, className = "" }: Props) {
  if (!label) {
    return <hr className={`border-white/10 ${className}`} />;
  }
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <hr className="flex-1 border-white/10" />
      <span className="text-xs text-zinc-600 shrink-0">{label}</span>
      <hr className="flex-1 border-white/10" />
    </div>
  );
}
