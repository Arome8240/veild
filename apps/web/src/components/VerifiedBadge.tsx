"use client";

interface Props {
  size?: number;
  className?: string;
}

export function VerifiedBadge({ size = 16, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-label="Verified creator"
      role="img"
      className={className}
    >
      <circle cx="8" cy="8" r="8" fill="#7C3AED" />
      <path
        d="M5 8l2 2 4-4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
