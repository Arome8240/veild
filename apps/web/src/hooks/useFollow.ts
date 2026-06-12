"use client";

import { useState, useCallback, useEffect } from "react";
import { type Address } from "viem";

const STORAGE_KEY = "veild_following";

function readFollowing(): Set<Address> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as Address[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeFollowing(set: Set<Address>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/**
 * Local (off-chain) follow list persisted to localStorage.
 * Following is optimistic — no on-chain transaction required.
 */
export function useFollow(creator: Address | undefined) {
  const [following, setFollowing] = useState<Set<Address>>(readFollowing);

  useEffect(() => {
    writeFollowing(following);
  }, [following]);

  const isFollowing = creator ? following.has(creator) : false;

  const toggle = useCallback(() => {
    if (!creator) return;
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(creator)) {
        next.delete(creator);
      } else {
        next.add(creator);
      }
      return next;
    });
  }, [creator]);

  return { isFollowing, toggle, followCount: following.size };
}

export function useFollowingList(): Address[] {
  const [list, setList] = useState<Address[]>(() => [...readFollowing()]);

  useEffect(() => {
    const stored = [...readFollowing()];
    setList(stored);
  }, []);

  return list;
}
