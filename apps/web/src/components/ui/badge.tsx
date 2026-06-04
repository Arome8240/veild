import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary/15 text-primary border-primary/25",
        secondary:   "bg-secondary text-secondary-foreground border-border",
        success:     "bg-green-500/15 text-green-400 border-green-500/25",
        warning:     "bg-amber-400/15 text-amber-300 border-amber-400/25",
        destructive: "bg-destructive/15 text-destructive border-destructive/25",
        verified:    "bg-primary/15 text-primary border-primary/25",
        priority:    "bg-amber-400/15 text-amber-300 border-amber-400/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
