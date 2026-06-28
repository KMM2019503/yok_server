"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatListTime, getPeer } from "@/lib/chat-utils";
import type { Conversation } from "@/lib/types";

interface Props {
  conversation: Conversation;
  currentUserId: string;
  online: boolean;
  active: boolean;
}

export function ConversationItem({ conversation, currentUserId, online, active }: Props) {
  const peer = getPeer(conversation, currentUserId);
  const last = conversation.lastMessage;
  const preview = last?.content ?? "No messages yet";
  const mine = last?.senderId === currentUserId;

  return (
    <Link
      href={`/chat/${conversation.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-accent" : "hover:bg-accent/60",
      )}
    >
      <Avatar
        src={peer?.profilePictureUrl}
        name={peer?.userName}
        online={online}
        className="size-11"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">{peer?.userName ?? "Unknown"}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatListTime(last?.createdAt ?? conversation.lastActivity)}
          </span>
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {mine && <span className="text-muted-foreground/70">You: </span>}
          {preview}
        </p>
      </div>
    </Link>
  );
}
