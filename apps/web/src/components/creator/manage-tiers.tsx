"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, Edit2, Check, AlertCircle } from "lucide-react";
import { type Address } from "viem";
import {
  useVeildSubscriptions,
  useCreatorTiers,
} from "@/hooks/useSubscriptions";
import { formatCELO } from "@/lib/utils";
import { MAX_TIER_LABEL_CHARS } from "@/constants/config";

const MAX_TIERS = 3;

const PRICE_OPTIONS = [
  { label: "0.01 CELO/mo",  value: 10_000_000_000_000_000n },
  { label: "0.05 CELO/mo",  value: 50_000_000_000_000_000n },
  { label: "0.1 CELO/mo",   value: 100_000_000_000_000_000n },
  { label: "0.5 CELO/mo",   value: 500_000_000_000_000_000n },
  { label: "1 CELO/mo",     value: 1_000_000_000_000_000_000n },
];

interface ManageTiersProps {
  creatorAddress: Address;
}

export function ManageTiers({ creatorAddress }: ManageTiersProps) {
  const {
    createTier, updateTierPrice, deactivateTier,
    isPending, isConfirmed, error, reset,
  } = useVeildSubscriptions();

  const { data: tiers = [], refetch } = useCreatorTiers(creatorAddress);

  const [newLabel, setNewLabel]     = useState("");
  const [newPrice, setNewPrice]     = useState(PRICE_OPTIONS[0].value);
  const [editId, setEditId]         = useState<number | null>(null);
  const [editPrice, setEditPrice]   = useState(PRICE_OPTIONS[0].value);
  const [mode, setMode]             = useState<"idle" | "add" | "edit" | "deactivate">("idle");

  useEffect(() => {
    if (isConfirmed) {
      refetch();
      reset();
    }
  }, [isConfirmed, refetch, reset]);

  const activeTiers = useMemo(() => tiers.filter((t) => t.isActive), [tiers]);
  const canAdd      = activeTiers.length < MAX_TIERS;

  const handleCreate = useCallback(() => {
    if (!newLabel.trim()) return;
    setMode("add");
    createTier(newPrice, newLabel.trim());
    setNewLabel("");
  }, [newLabel, newPrice, createTier]);

  const handleUpdatePrice = useCallback(() => {
    if (editId === null) return;
    setMode("edit");
    updateTierPrice(BigInt(editId), editPrice);
    setEditId(null);
  }, [editId, editPrice, updateTierPrice]);

  const handleDeactivate = useCallback((tierId: number) => {
    setMode("deactivate");
    deactivateTier(BigInt(tierId));
  }, [deactivateTier]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold">Subscription tiers</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Up to {MAX_TIERS} tiers. Fans subscribe monthly.
        </p>
      </div>

      {/* Existing tiers */}
      {tiers.length === 0 ? (
        <p className="px-4 py-5 text-center text-xs text-muted-foreground">
          No tiers yet. Create one below to start earning subscriptions.
        </p>
      ) : (
        <ul className="divide-y divide-border" aria-label="Your subscription tiers">
          {tiers.map((tier, i) => (
            <li key={tier.label} className={`px-4 py-3 flex items-center justify-between gap-3 ${!tier.isActive ? "opacity-40" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tier.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCELO(tier.pricePerMonth)} CELO/mo
                </p>
              </div>

              {tier.isActive && editId === i ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={editPrice.toString()}
                    onChange={(e) => setEditPrice(BigInt(e.target.value))}
                    className="text-xs bg-background border border-input rounded-lg px-2 py-1 outline-none"
                    aria-label="New price for tier"
                  >
                    {PRICE_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value.toString()}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleUpdatePrice}
                    disabled={isPending}
                    className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-60"
                    aria-label="Save new price"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors text-xs"
                    aria-label="Cancel edit"
                  >
                    ✕
                  </button>
                </div>
              ) : tier.isActive ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setEditId(i); setEditPrice(tier.pricePerMonth); }}
                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    aria-label={`Edit ${tier.label} price`}
                    disabled={isPending}
                  >
                    <Edit2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivate(i)}
                    className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
                    aria-label={`Deactivate ${tier.label}`}
                    disabled={isPending}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Inactive
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Create new tier */}
      {canAdd && (
        <div className="px-4 pb-4 pt-3 border-t border-border space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Add tier</p>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value.slice(0, MAX_TIER_LABEL_CHARS))}
            placeholder='e.g. "Supporter", "VIP"'
            className="w-full bg-background border border-input focus:border-ring rounded-xl px-3 py-2 text-sm outline-none transition-colors"
            aria-label="Tier label"
            maxLength={MAX_TIER_LABEL_CHARS}
          />
          <select
            value={newPrice.toString()}
            onChange={(e) => setNewPrice(BigInt(e.target.value))}
            className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm outline-none"
            aria-label="Monthly price"
          >
            {PRICE_OPTIONS.map((o) => (
              <option key={o.label} value={o.value.toString()}>{o.label}</option>
            ))}
          </select>

          {error && mode === "add" && (
            <div role="alert" className="flex gap-2 bg-destructive/10 border border-destructive/25 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" aria-hidden="true" />
              <p className="text-xs text-destructive">{error.message?.slice(0, 80) ?? "Failed"}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={!newLabel.trim() || isPending}
            aria-busy={isPending && mode === "add"}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-sm font-medium py-2.5 rounded-xl transition-all"
          >
            {isPending && mode === "add" ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4" aria-hidden="true" />
            )}
            {isPending && mode === "add" ? "Creating…" : "Create tier"}
          </button>
        </div>
      )}

      {!canAdd && (
        <p className="px-4 pb-4 text-xs text-muted-foreground text-center">
          Maximum of {MAX_TIERS} active tiers reached.
        </p>
      )}
    </div>
  );
}
