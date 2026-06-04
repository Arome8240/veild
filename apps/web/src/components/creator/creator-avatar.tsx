import Image from "next/image";
import { cn, resolveAvatar, getInitials, getAvatarColor } from "@/lib/utils";

interface CreatorAvatarProps {
  /** IPFS CID or full https URL. Pass an empty string to always show initials. */
  avatarCID?: string;
  /** Used to derive initials and the background color. */
  name: string;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "rounded" | "circle";
  className?: string;
}

const sizeMap = {
  xxs: { wrapper: "w-5 h-5",   text: "text-[8px] font-bold" },
  xs:  { wrapper: "w-7 h-7",   text: "text-[10px] font-semibold" },
  sm:  { wrapper: "w-8 h-8",   text: "text-xs font-semibold" },
  md:  { wrapper: "w-12 h-12", text: "text-sm font-bold" },
  lg:  { wrapper: "w-16 h-16", text: "text-lg font-bold" },
  xl:  { wrapper: "w-20 h-20", text: "text-xl font-bold" },
};

/**
 * Creator avatar that shows initials with a deterministic accent colour.
 * Falls back to rendering a real image only if avatarCID is a valid
 * IPFS CID or https URL — i.e. an actual uploaded photo.
 */
export function CreatorAvatar({
  avatarCID = "",
  name,
  size = "md",
  shape = "rounded",
  className,
}: CreatorAvatarProps) {
  const imageUrl    = resolveAvatar(avatarCID);
  const initials    = getInitials(name);
  const bgColor     = getAvatarColor(name);
  const shapeClass  = shape === "circle" ? "rounded-full" : "rounded-2xl";
  const { wrapper, text } = sizeMap[size];

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden shrink-0 ring-1 ring-white/10",
          wrapper,
          shapeClass,
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={`${name}'s avatar`}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`${name}'s avatar`}
      className={cn(
        "flex items-center justify-center shrink-0 select-none",
        wrapper,
        shapeClass,
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      <span className={cn("text-white leading-none", text)}>
        {initials}
      </span>
    </div>
  );
}
