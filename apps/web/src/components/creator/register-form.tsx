"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useAccount } from "wagmi";
import { CREATOR_CATEGORIES, MAX_USERNAME_CHARS, MAX_ERROR_DISPLAY_CHARS } from "@/constants/config";
import { useVeildContracts, useIsRegistered, useCreatorByUsername } from "@/hooks/useVeildContracts";
import { AvatarUpload } from "@/components/creator/avatar-upload";
import type { RegisterFormState } from "@/types";
import type { Address } from "viem";

interface RegisterFormProps {
  onSuccess: () => void;
}

const INITIAL_STATE: RegisterFormState = {
  username: "",
  name: "",
  bio: "",
  category: CREATOR_CATEGORIES[0],
  avatarCID: "",
};

/** Strip the raw JSON-RPC wrapper viem sometimes leaks into error messages. */
function friendlyError(msg: string): string {
  if (!msg) return "Transaction failed. Please try again.";

  // AlreadyRegistered custom error
  if (msg.includes("AlreadyRegistered"))
    return "This wallet is already registered as a creator.";

  // UsernameTaken custom error
  if (msg.includes("UsernameTaken"))
    return "That username is already taken. Please choose another.";

  // Raw JSON-RPC bleed-through
  if (msg.includes("jsonrpc") || msg.includes("JSON-RPC"))
    return "Transaction reverted on-chain. The username may already be taken.";

  // Generic contract revert
  if (msg.includes("reverted"))
    return "Transaction reverted. Check the username isn't already taken.";

  return msg.length > MAX_ERROR_DISPLAY_CHARS ? msg.slice(0, MAX_ERROR_DISPLAY_CHARS) + "…" : msg;
}

/**
 * On-chain creator registration form with preflight username + wallet checks.
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { address } = useAccount();
  const [form, setForm]         = useState<RegisterFormState>(INITIAL_STATE);
  const [usernameQuery, setUsernameQuery] = useState(""); // debounced

  const { registerCreator, isPending, isConfirming, isConfirmed, error, reset } =
    useVeildContracts();

  // ── Preflight checks ─────────────────────────────────────────────────────────
  const { data: alreadyRegistered, isLoading: checkingWallet } = useIsRegistered(
    address as Address | undefined
  );
  const { data: usernameResult, isFetching: checkingUsername } = useCreatorByUsername(
    usernameQuery || undefined
  );

  const usernameAddr = usernameResult?.[0];
  const usernameTaken =
    !!usernameQuery &&
    !!usernameAddr &&
    usernameAddr !== "0x0000000000000000000000000000000000000000";

  // Debounce username availability check
  useEffect(() => {
    if (!form.username) { setUsernameQuery(""); return; }
    const t = setTimeout(() => setUsernameQuery(form.username), 600);
    return () => clearTimeout(t);
  }, [form.username]);

  const isBusy    = isPending || isConfirming;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (usernameTaken || !form.username || !form.name) return;
    reset();
    registerCreator(form.username, form.name, form.bio, form.avatarCID, form.category);
  }, [usernameTaken, form, reset, registerCreator]);

  // ── Confirmation screen ───────────────────────────────────────────────────────
  if (isConfirmed) {
    return (
      <div className="text-center py-8" role="status" aria-live="polite">
        <Check className="w-12 h-12 text-green-400 mx-auto mb-3" aria-hidden="true" />
        <p className="font-semibold text-green-400 mb-1">You&apos;re live on Veild!</p>
        <p className="text-muted-foreground text-sm mb-4">
          Your creator profile is now on-chain.
        </p>
        <button
          onClick={onSuccess}
          className="text-primary text-sm hover:text-primary/80 transition-colors"
        >
          View profile
        </button>
      </div>
    );
  }

  // ── Already registered guard ─────────────────────────────────────────────────
  if (alreadyRegistered) {
    return (
      <div className="text-center py-8" role="status">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" aria-hidden="true" />
        <p className="font-semibold text-foreground mb-1">Already registered</p>
        <p className="text-muted-foreground text-sm">
          This wallet already has a Veild profile. Refresh the page to see it.
        </p>
      </div>
    );
  }
  const canSubmit = !!form.username && !!form.name && !usernameTaken && !isBusy;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Avatar upload */}
      <AvatarUpload
        name={form.name || form.username}
        onCIDReady={(cid) => setForm((f) => ({ ...f, avatarCID: cid }))}
      />

      {/* MiniPay notice */}
      <div className="flex gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3.5 py-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-blue-300 leading-relaxed">
          MiniPay may show <strong>&ldquo;Unknown transaction&rdquo;</strong> for this contract &mdash; that&apos;s normal.
          Tap <strong>Send</strong> to confirm.
        </p>
      </div>

      {/* Username */}
      <div>
        <label htmlFor="reg-username" className="text-xs text-muted-foreground mb-1 block">
          Username (required)
        </label>
        <div className="relative">
          <input
            id="reg-username"
            required
            autoComplete="username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, MAX_USERNAME_CHARS),
              }))
            }
            placeholder="your_handle"
            aria-describedby="reg-username-hint reg-username-status"
            className={`w-full bg-background border rounded-xl px-4 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors ${
              usernameTaken
                ? "border-destructive focus:border-destructive"
                : form.username && !checkingUsername && !usernameTaken
                ? "border-green-500/60 focus:border-green-500"
                : "border-input focus:border-ring"
            }`}
          />
          {/* Availability indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checkingUsername && form.username ? (
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" aria-hidden="true" />
            ) : usernameTaken ? (
              <AlertCircle className="w-3.5 h-3.5 text-destructive" aria-hidden="true" />
            ) : form.username && !checkingUsername ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
            ) : null}
          </div>
        </div>
        <div id="reg-username-status" aria-live="polite" className="mt-1">
          {usernameTaken ? (
            <p className="text-[10px] text-destructive">
              @{form.username} is already taken
            </p>
          ) : form.username && !checkingUsername ? (
            <p className="text-[10px] text-green-400">@{form.username} is available</p>
          ) : (
            <p id="reg-username-hint" className="text-[10px] text-muted-foreground">
              Letters, numbers, underscores — max 32 chars
            </p>
          )}
        </div>
      </div>

      {/* Display name */}
      <div>
        <label htmlFor="reg-name" className="text-xs text-muted-foreground mb-1 block">
          Display name (required)
        </label>
        <input
          id="reg-name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your Name"
          className="w-full bg-background border border-input focus:border-ring rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="reg-bio" className="text-xs text-muted-foreground mb-1 block">
          Bio
        </label>
        <textarea
          id="reg-bio"
          rows={3}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          placeholder="Tell your fans about yourself…"
          className="w-full bg-background border border-input focus:border-ring rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="reg-category" className="text-xs text-muted-foreground mb-1 block">
          Category
        </label>
        <select
          id="reg-category"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
        >
          {CREATOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Contract error — cleaned up */}
      {error && (
        <div role="alert" className="flex gap-2 bg-destructive/10 border border-destructive/25 rounded-xl px-3.5 py-3">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-destructive leading-relaxed">
            {friendlyError(error.message ?? "")}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || checkingWallet}
        aria-busy={isBusy}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-sm font-semibold py-3 rounded-xl transition-all"
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            {isPending ? "Confirm in wallet…" : "Registering on-chain…"}
          </>
        ) : (
          "Create my Veild profile"
        )}
      </button>
    </form>
  );
}
