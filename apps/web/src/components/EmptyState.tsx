"use client";

interface Props {
  emoji?:    string;
  title:     string;
  body?:     string;
  action?:   { label: string; onClick: () => void };
}

export function EmptyState({ emoji = "👀", title, body, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <span className="text-4xl" aria-hidden="true">{emoji}</span>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {body && <p className="text-sm text-zinc-500">{body}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 rounded-xl bg-white px-5 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
