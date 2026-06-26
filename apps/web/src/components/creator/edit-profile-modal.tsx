"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check } from "lucide-react";
import { AvatarUpload } from "./avatar-upload";
import { useVeildContracts } from "@/hooks/useVeildContracts";
import { CREATOR_CATEGORIES, MAX_BIO_CHARS } from "@/constants/config";
import type { Creator } from "@/types";

interface Props {
  profile: Creator;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({ profile, open, onClose, onSaved }: Props) {
  const [name, setName]         = useState(profile.name);
  const [bio, setBio]           = useState(profile.bio);
  const [category, setCategory] = useState(profile.category);
  const [avatarCID, setAvatarCID] = useState(profile.avatarCID);

  const { updateProfile, isPending, isConfirming, isConfirmed, error, reset } =
    useVeildContracts();

  const isBusy = isPending || isConfirming;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isBusy) return;
    reset();
    updateProfile(name.trim(), bio.trim(), avatarCID, category);
  }, [name, bio, avatarCID, category, isBusy, reset, updateProfile]);

  useEffect(() => {
    if (isConfirmed) {
      onSaved();
      onClose();
    }
  }, [isConfirmed, onSaved, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
          role="dialog"
          aria-modal="true"
          aria-label="Edit your profile"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full bg-card border-t border-border rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" aria-hidden="true" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">Edit profile</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Avatar */}
              <AvatarUpload
                currentCID={avatarCID}
                name={name}
                onCIDReady={setAvatarCID}
              />

              {/* Display name */}
              <div>
                <label htmlFor="edit-name" className="text-xs text-muted-foreground mb-1 block">
                  Display name
                </label>
                <input
                  id="edit-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-input focus:border-ring rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="edit-bio" className="text-xs text-muted-foreground mb-1 block">
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_CHARS))}
                  className="w-full bg-background border border-input focus:border-ring rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{bio.length}/{MAX_BIO_CHARS}</p>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="edit-category" className="text-xs text-muted-foreground mb-1 block">
                  Category
                </label>
                <select
                  id="edit-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                >
                  {CREATOR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="text-xs text-destructive bg-destructive/10 border border-destructive/25 rounded-xl px-3 py-2">
                  {error.message?.slice(0, 120) ?? "Transaction failed."}
                </p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || isBusy}
                aria-busy={isBusy}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-sm font-semibold py-3 rounded-xl transition-all"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {isPending ? "Confirm in wallet…" : "Saving on-chain…"}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    Save changes
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
