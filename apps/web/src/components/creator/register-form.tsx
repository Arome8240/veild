"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { CREATOR_CATEGORIES } from "@/constants/config";
import { useVeildContracts } from "@/hooks/useVeildContracts";
import type { RegisterFormState } from "@/types";

interface RegisterFormProps {
  onSuccess: () => void;
}

const INITIAL_STATE: RegisterFormState = {
  username: "",
  name: "",
  bio: "",
  category: CREATOR_CATEGORIES[0],
};

/**
 * On-chain creator registration form.
 * Extracted from profile/page.tsx.
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState<RegisterFormState>(INITIAL_STATE);
  const { registerCreator, isPending, isConfirming, isConfirmed, error } =
    useVeildContracts();

  if (isConfirmed) {
    return (
      <div className="text-center py-8" role="status" aria-live="polite">
        <Check
          className="w-12 h-12 text-green-400 mx-auto mb-3"
          aria-hidden="true"
        />
        <p className="font-semibold text-green-400 mb-1">
          You&apos;re live on Veild!
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          Your creator profile is now on-chain.
        </p>
        <button
          onClick={onSuccess}
          className="text-primary text-sm hover:text-primary/80 transition-colors"
        >
          View profile →
        </button>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registerCreator(form.username, form.name, form.bio, "", form.category);
  }

  const isBusy = isPending || isConfirming;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Username */}
      <div>
        <label
          htmlFor="reg-username"
          className="text-xs text-muted-foreground mb-1 block"
        >
          Username <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="reg-username"
          required
          autoComplete="username"
          value={form.username}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              username: e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 32),
            }))
          }
          placeholder="your_handle"
          aria-describedby="reg-username-hint"
          className="w-full bg-background border border-input focus:border-ring rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
        />
        <p
          id="reg-username-hint"
          className="text-[10px] text-muted-foreground mt-1"
        >
          Letters, numbers, underscores — max 32 chars
        </p>
      </div>

      {/* Display name */}
      <div>
        <label
          htmlFor="reg-name"
          className="text-xs text-muted-foreground mb-1 block"
        >
          Display name <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
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
        <label
          htmlFor="reg-bio"
          className="text-xs text-muted-foreground mb-1 block"
        >
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
        <label
          htmlFor="reg-category"
          className="text-xs text-muted-foreground mb-1 block"
        >
          Category
        </label>
        <select
          id="reg-category"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
        >
          {CREATOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.message?.slice(0, 80)}
        </p>
      )}

      <button
        type="submit"
        disabled={!form.username || !form.name || isBusy}
        aria-busy={isBusy}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-sm font-semibold py-3 rounded-xl transition-all"
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            {isPending ? "Confirm in wallet…" : "Registering…"}
          </>
        ) : (
          "Create my Veild profile"
        )}
      </button>
    </form>
  );
}
