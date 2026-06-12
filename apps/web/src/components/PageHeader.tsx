"use client";

import { useRouter } from "next/navigation";

interface Props {
  title:      string;
  subtitle?:  string;
  back?:      boolean;
  action?:    React.ReactNode;
}

export function PageHeader({ title, subtitle, back = false, action }: Props) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3">
      <div className="flex items-center gap-2">
        {back && (
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="shrink-0 rounded-xl p-1.5 hover:bg-white/5 transition-colors"
          >
            ‹
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 truncate">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
