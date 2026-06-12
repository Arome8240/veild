"use client";

const CATEGORY_COLORS: Record<string, string> = {
  music:      "text-pink-400   bg-pink-400/10   border-pink-400/20",
  art:        "text-orange-400 bg-orange-400/10 border-orange-400/20",
  gaming:     "text-green-400  bg-green-400/10  border-green-400/20",
  education:  "text-blue-400   bg-blue-400/10   border-blue-400/20",
  tech:       "text-cyan-400   bg-cyan-400/10   border-cyan-400/20",
  lifestyle:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  finance:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

const DEFAULT_COLORS = "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";

interface Props {
  category:  string;
  className?: string;
}

export function CategoryBadge({ category, className = "" }: Props) {
  const colors = CATEGORY_COLORS[category.toLowerCase()] ?? DEFAULT_COLORS;

  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${colors} ${className}`}
    >
      {category}
    </span>
  );
}
