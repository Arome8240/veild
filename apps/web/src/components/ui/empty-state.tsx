import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standardized empty state with an icon, title, optional description, and CTA.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
      role="status"
    >
      <Icon
        className="w-10 h-10 text-muted-foreground/30 mb-3"
        aria-hidden="true"
      />
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground/60 text-xs mt-1 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
