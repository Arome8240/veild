"use client";

interface Props {
  size?:      number;
  className?: string;
  label?:     string;
}

export function Spinner({ size = 20, className = "", label = "Loading…" }: Props) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-white/20 border-t-white ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
