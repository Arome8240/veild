/** Application-wide configuration constants. */

// ─── Message limits ───────────────────────────────────────────────────────────
export const MAX_MESSAGE_CHARS       = 280;
export const MAX_USERNAME_CHARS      = 32;
export const MAX_BIO_CHARS           = 280;
export const MAX_BIO_EDITOR_CHARS    = 200;
export const MAX_TIP_MESSAGE_CHARS   = 140;
export const MAX_POOL_QUESTION_CHARS = 256;
export const MAX_TIER_LABEL_CHARS    = 32;

// ─── UI limits ────────────────────────────────────────────────────────────────
export const WALL_PREVIEW_SIZE      = 4;
export const MAX_NOTIFICATIONS      = 50;
export const MAX_ERROR_DISPLAY_CHARS = 100;

// ─── Contract defaults ────────────────────────────────────────────────────────
export const DEFAULT_PRIORITY_FEE_WEI    = BigInt("1000000000000000");  // 0.001 CELO
export const DEFAULT_POOL_CONTRIBUTE_WEI = BigInt("10000000000000000"); // 0.01 CELO

// ─── External URLs ────────────────────────────────────────────────────────────
export const IPFS_GATEWAY = "https://ipfs.io/ipfs";
export const DICEBEAR_BASE = "https://api.dicebear.com/7.x/avataaars/svg";
export const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";
export const CELO_MAINNET_RPC = "https://forno.celo.org";
export const VEILD_APP_DOMAIN = "veild.vercel.app";

// ─── Creator categories ───────────────────────────────────────────────────────
export const CREATOR_CATEGORIES = [
  "Art & Design",
  "Music",
  "Tech & Education",
  "Gaming",
  "Fitness",
  "Comedy",
  "Cooking",
  "Photography",
  "Writing",
  "Fashion",
] as const;

export type CreatorCategory = (typeof CREATOR_CATEGORIES)[number];

// ─── Message quick prompts ────────────────────────────────────────────────────
export const QUICK_PROMPTS = [
  "What's your biggest advice for beginners?",
  "How did you get started?",
  "What's your daily routine like?",
  "What's something you wish you knew earlier?",
  "Can we collab?",
] as const;

// ─── Particle animation colours ───────────────────────────────────────────────
export const PARTICLE_COLORS = [
  "#7c3aed",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
] as const;

// ─── Timing ───────────────────────────────────────────────────────────────────
export const TOAST_DURATION_MS = 3000;
export const COPY_FEEDBACK_MS  = 2000;
export const PARTICLE_DECAY_MS = 900;
