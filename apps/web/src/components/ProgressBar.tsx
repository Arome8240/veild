"use client";

interface Props {
  value:      number;
  max:        number;
  className?: string;
  label?:     string;
}

export function ProgressBar({ value, max, className = "", label }: Props) {
  const pct    = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const rounded = Math.round(pct);

  return (
    <div role="progressbar" aria-valuenow={rounded} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-1.5 rounded-full bg-white/10 overflow-hidden ${className}`}>
        <div
          className="h-full bg-purple-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
