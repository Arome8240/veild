"use client";

import { useState } from "react";

interface Props {
  currentBio: string;
  onSave:     (bio: string) => Promise<void> | void;
  isPending?: boolean;
}

export function BioEditor({ currentBio, onSave, isPending }: Props) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio]         = useState(currentBio);
  const MAX                   = 200;

  const handleSave = async () => {
    await onSave(bio.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setBio(currentBio);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <p className="flex-1 text-sm text-zinc-400 whitespace-pre-wrap">
          {currentBio || <span className="italic text-zinc-600">No bio yet.</span>}
        </p>
        <button
          onClick={() => setEditing(true)}
          aria-label="Edit bio"
          className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
        >
          ✎
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, MAX))}
        rows={3}
        autoFocus
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
        placeholder="Tell your audience about yourself…"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-600">{bio.length}/{MAX}</span>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-500 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || bio.trim() === currentBio}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-white/90 disabled:opacity-40 transition-colors"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
