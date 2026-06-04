import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Round the skeleton into a circle (useful for avatars). */
  circle?: boolean;
}

/**
 * Generic pulse skeleton block.
 * Compose multiples to match the real layout of the loading content.
 */
export function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-muted",
        circle ? "rounded-full" : "rounded-lg",
        className
      )}
      {...props}
    />
  );
}
