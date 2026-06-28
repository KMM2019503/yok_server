"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./message-bubble";
import { useMessages } from "@/hooks/use-messages";
import { useAuth } from "@/providers/auth-provider";
import { getSocket } from "@/lib/socket";
import {
  dayKey,
  formatDayDivider,
  getSenderId,
} from "@/lib/chat-utils";
import type { Message } from "@/lib/types";

export function MessageList({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const { data: messages, isLoading, isError, refetch } = useMessages(conversationId);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const currentUserId = user?.id ?? "";

  // Keep the view pinned to the latest message.
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length, conversationId]);

  // Mark unseen incoming messages as read while this thread is open.
  React.useEffect(() => {
    if (!messages || !currentUserId) return;
    const unseen = messages
      .filter(
        (m) =>
          getSenderId(m) !== currentUserId &&
          !m.id.startsWith("temp-") &&
          !(m.status?.seenUserIds ?? []).includes(currentUserId),
      )
      .map((m) => m.id);
    if (unseen.length === 0) return;
    getSocket().emit("markMessagesAsRead", {
      messageIds: unseen,
      userId: currentUserId,
    });
  }, [messages, currentUserId]);

  if (isLoading) return <MessagesSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        <div>
          <p>Couldn&apos;t load this conversation.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 font-medium text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        No messages yet — say hello 👋
      </div>
    );
  }

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {renderGroupedMessages(messages, currentUserId)}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function renderGroupedMessages(messages: Message[], currentUserId: string) {
  const nodes: React.ReactNode[] = [];
  let lastDay: string | null = null;

  messages.forEach((m, i) => {
    const day = dayKey(m.createdAt);
    if (day !== lastDay) {
      nodes.push(
        <div key={`day-${day}-${i}`} className="my-4 flex justify-center">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {formatDayDivider(m.createdAt)}
          </span>
        </div>,
      );
      lastDay = day;
    }

    const prev = messages[i - 1];
    const sameSenderAsPrev =
      prev && getSenderId(prev) === getSenderId(m) && dayKey(prev.createdAt) === day;

    nodes.push(
      <MessageBubble
        key={m.id}
        message={m}
        mine={getSenderId(m) === currentUserId}
        grouped={Boolean(sameSenderAsPrev)}
      />,
    );
  });

  return nodes;
}

function MessagesSkeleton() {
  const rows: { side: "left" | "right"; w: string }[] = [
    { side: "left", w: "w-48" },
    { side: "right", w: "w-64" },
    { side: "right", w: "w-36" },
    { side: "left", w: "w-56" },
    { side: "left", w: "w-40" },
    { side: "right", w: "w-52" },
  ];
  return (
    <div className="flex-1 space-y-3 overflow-hidden px-6 py-6">
      <div className="mx-auto max-w-3xl space-y-3">
        {rows.map((r, i) => (
          <div
            key={i}
            className={r.side === "right" ? "flex justify-end" : "flex justify-start"}
          >
            <Skeleton className={`h-10 rounded-2xl ${r.w}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
