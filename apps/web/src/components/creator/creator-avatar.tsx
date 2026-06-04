import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorAvatarProps {
  src: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  shape?: "rounded" | "circle";
}

const sizeMap = {
  sm:  "w-8 h-8",
  md:  "w-12 h-12",
  lg:  "w-16 h-16",
  xl:  "w-20 h-20",
};

/**
 * Creator avatar with automatic fallback to a User icon when src is missing.
 * Handles both full URLs and IPFS CIDs (via resolveAvatar in utils).
 */
export function CreatorAvatar({
  src,
  name,
  size = "md",
  className,
  shape = "rounded",
}: CreatorAvatarProps) {
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-2xl";

  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          sizeMap[size],
          shapeClass,
          className
        )}
      >
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted ring-2 ring-border shrink-0",
        sizeMap[size],
        shapeClass,
        className
      )}
    >
      <Image
        src={src}
        alt={`${name}'s avatar`}
        fill
        sizes="80px"
        className="object-cover"
      />
    </div>
  );
}
