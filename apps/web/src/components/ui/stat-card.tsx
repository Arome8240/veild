import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  iconClassName?: string;
  iconBgClassName?: string;
  className?: string;
}

/**
 * Reusable metric card used on home, inbox, and profile pages.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClassName = "text-primary",
  iconBgClassName = "bg-primary/10",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl p-4",
        className
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center mb-3",
          iconBgClassName
        )}
        aria-hidden="true"
      >
        <Icon className={cn("w-4 h-4", iconClassName)} />
      </div>
      <p className="font-bold text-base leading-none text-foreground">{value}</p>
      <p className="text-muted-foreground text-xs mt-0.5">{label}</p>
      {sub && <p className="text-muted-foreground/60 text-[10px] mt-0.5">{sub}</p>}
    </div>
  );
}
