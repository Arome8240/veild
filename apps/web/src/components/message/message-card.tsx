"use client";

import { useState, useCallback } from "react";
import {
  Zap, Reply, Eye, Archive, ChevronDown, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { useVeildContracts } from "@/hooks/useVeildContracts";
import { timeAgo, formatCELO } from "@/lib/utils";
import type { IndexedMessage } from "@/types";

interface MessageCardProps {
  message: IndexedMessage;
  creatorAvatar: string;
  creatorName: string;
  onReply: (_msg: IndexedMessage) => void;
}

/**
 * A single message row in the inbox.
 * Extracted from inbox/page.tsx.
 */
export function MessageCard({
  message,
  creatorAvatar,
  creatorName,
  onReply,
}: MessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { archiveMessage, publishToWall, isPending, isConfirming } =
    useVeildContracts();

  const handleToggleExpand = useCallback(() => setExpanded((v) => !v), []);
  const handleReply = useCallback(() => onReply(message), [onReply, message]);
  const handlePublish = useCallback(() => publishToWall(BigInt(message.index)), [publishToWall, message.index]);
  const handleArchive = useCallback(() => archiveMessage(BigInt(message.index)), [archiveMessage, message.index]);

  if (message.isArchived) return null;

  const isLong  = message.content.length > 120;
  const isBusy  = isPending || isConfirming;

  return (
    <article
      aria-label={`Anonymous message${message.isPriority ? " (priority)" : ""}`}
      className={`relative bg-card border rounded-2xl overflow-hidden transition-colors ${
        message.isPriority
          ? "border-amber-400/20"
          : message.isAnswered
          ? "border-border/50"
          : "border-border"
      }`}
    >
      {message.isPriority && (
        <div
          aria-hidden="true"
          className="h-0.5 w-full bg-gradient-to-r from-amber-400/60 to-amber-600/40"
        />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2" aria-label="Message metadata">
            <span
              aria-hidden="true"
              className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground font-medium"
            >
              ?
            </span>
            <span className="text-xs text-muted-foreground">Anonymous</span>
            {message.isPriority && (
              <Badge variant="priority">
                <Zap className="w-2 h-2" aria-hidden="true" /> Priority
              </Badge>
            )}
            {message.fee > 0n && (
              <span className="text-[9px] text-amber-400/70">
                {formatCELO(message.fee)} CELO
              </span>
            )}
          </div>
          <time
            dateTime={new Date(Number(message.sentAt) * 1000).toISOString()}
            className="text-muted-foreground text-[10px]"
          >
            {timeAgo(message.sentAt)}
          </time>
        </div>

        {/* Message content */}
        <p
          className={`text-foreground text-sm leading-relaxed mb-3 ${
            !expanded && isLong ? "line-clamp-3" : ""
          }`}
        >
          {message.content}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={handleToggleExpand}
            aria-expanded={expanded}
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Reply preview */}
        {message.isAnswered && message.reply && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CreatorAvatar avatarCID={creatorAvatar} name={creatorName} size="xxs" shape="circle" />
              <span className="text-[10px] text-primary font-medium">Your reply</span>
              {message.isPublished && (
                <Badge variant="success">Published</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">{message.reply}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Message actions">
          {!message.isAnswered && (
            <button
              type="button"
              onClick={handleReply}
              className="flex items-center gap-1 text-xs text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors font-medium"
              aria-label="Reply to this message"
            >
              <Reply className="w-3 h-3" aria-hidden="true" /> Reply
            </button>
          )}
          {message.isAnswered && !message.isPublished && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isBusy}
              className="flex items-center gap-1 text-xs text-foreground hover:text-green-400 border border-border hover:border-green-500/25 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              aria-label="Publish this Q&A to your public wall"
            >
              {isBusy ? (
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              ) : (
                <Eye className="w-3 h-3" aria-hidden="true" />
              )}
              Publish
            </button>
          )}
          <button
            type="button"
            onClick={handleArchive}
            disabled={isBusy}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Archive this message"
          >
            <Archive className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
